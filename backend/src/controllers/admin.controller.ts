import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { query } from "../config/db";
import { AdminAuthRequest } from "../middlewares/adminAuth.middleware";
import { generarPasswordTemporal } from "../utils/password";
import { sendAdminLoginCode } from "../config/mailer";

const sha256 = (text: string): string =>
  crypto.createHash("sha256").update(text).digest("hex");

const getClientIp = (req: Request): string =>
  (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
  req.socket.remoteAddress ||
  "desconocida";

const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_ADMIN_SECRET || !JWT_SECRET) {
  throw new Error("JWT_ADMIN_SECRET y JWT_SECRET deben estar definidos en las variables de entorno.");
}

export const logAudit = async (
  id_admin: string,
  rol: string,
  accion: string,
  tabla_afectada: string,
  id_registro: string,
  valores_anteriores: any,
  valores_nuevos: any,
  ip_origen: string,
) => {
  try {
    await query(
      `INSERT INTO bitacora_auditoria (id_admin, rol, accion, tabla_afectada, id_registro, valores_anteriores, valores_nuevos, ip_origen)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id_admin,
        rol,
        accion,
        tabla_afectada,
        id_registro,
        valores_anteriores ? JSON.stringify(valores_anteriores) : null,
        valores_nuevos ? JSON.stringify(valores_nuevos) : null,
        ip_origen,
      ],
    );
  } catch (error) {
    console.error("Error logging audit:", error);
  }
};

export const logoutAdmin = async (req: AdminAuthRequest, res: Response) => {
  try {
    const jti = req.admin?.jti;
    if (!jti) {
      return res.status(400).json({ error: "Sesión sin identificador válido" });
    }
    await query(
      "UPDATE sesiones_admin SET valido = FALSE WHERE token_jti = $1",
      [jti],
    );
    res.json({ message: "Sesión cerrada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al cerrar sesión" });
  }
};

// Permite a un admin_general revocar TODAS las sesiones activas de un
// administrador puntual (por ejemplo, si sospecha que su token o el de otro
// admin se filtró, sin tener que rotar el secreto JWT para todos).
export const revocarSesionesAdmin = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      "UPDATE sesiones_admin SET valido = FALSE WHERE id_admin = $1 AND valido = TRUE RETURNING id",
      [id],
    );
    res.json({ message: `${result.rows.length} sesión(es) revocada(s)` });
  } catch (error) {
    res.status(500).json({ error: "Error al revocar sesiones" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Antes solo se aceptaban correos @iniciativababy.cl. Ahora se permite
    // cualquier correo (Gmail incluido): quién puede entrar lo decide la
    // tabla administradores, no el dominio del correo — un admin_general
    // igual tiene que haber creado esa cuenta a propósito.
    if (!email || !password) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const result = await query(
      "SELECT * FROM administradores WHERE LOWER(correo_corporativo) = LOWER($1)",
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const admin = result.rows[0];

    if (admin.estado !== "activo") {
      return res.status(403).json({ error: "Cuenta no activa" });
    }

    // Bloqueo por intentos fallidos. El rate limit por IP no alcanza para
    // una cuenta de admin: se evade rotando IPs. Esto bloquea la CUENTA,
    // igual que ya hacían los usuarios normales.
    if (admin.bloqueado_hasta && new Date(admin.bloqueado_hasta) > new Date()) {
      const minutos = Math.ceil(
        (new Date(admin.bloqueado_hasta).getTime() - Date.now()) / 60000,
      );
      return res.status(429).json({
        error: `Cuenta bloqueada. Intenta nuevamente en ${minutos} minuto${minutos !== 1 ? "s" : ""}.`,
        bloqueado: true,
      });
    }

    const match = await bcrypt.compare(password, admin.hash_contrasena);
    if (!match) {
      const intentos = (admin.intentos_login_fallidos || 0) + 1;

      // 5 intentos y 15 minutos: mismos números que en el login de
      // usuarios, para que la política sea una sola y predecible.
      if (intentos >= 5) {
        const bloqueadoHasta = new Date(Date.now() + 15 * 60 * 1000);
        await query(
          "UPDATE administradores SET intentos_login_fallidos = $1, bloqueado_hasta = $2 WHERE id = $3",
          [intentos, bloqueadoHasta, admin.id],
        );
        return res.status(429).json({
          error: "Cuenta bloqueada por 15 minutos por múltiples intentos fallidos.",
          bloqueado: true,
        });
      }

      await query(
        "UPDATE administradores SET intentos_login_fallidos = $1 WHERE id = $2",
        [intentos, admin.id],
      );
      // Se informa cuántos quedan, igual que a los usuarios: ayuda a quien
      // de verdad olvidó su clave sin regalar información útil a un atacante
      // (que de todos modos puede contar sus propios intentos).
      return res.status(401).json({
        error: "Credenciales inválidas",
        intentos_restantes: 5 - intentos,
      });
    }

    // Contraseña correcta: se limpian los contadores. Se hace acá y no
    // después del 2FA, porque la contraseña ya se validó — el 2FA es otra
    // barrera, con su propio límite de intentos.
    await query(
      "UPDATE administradores SET intentos_login_fallidos = 0, bloqueado_hasta = NULL WHERE id = $1",
      [admin.id],
    );

    // 2FA por correo: si la cuenta lo requiere, se genera un código de 6
    // dígitos, se guarda su hash (nunca el código en claro) y se manda al
    // correo corporativo. El admin debe escribirlo para terminar de entrar.
    if (admin.requiere_2fa) {
      const codigo = crypto.randomInt(100000, 999999).toString();
      const hashCodigo = sha256(codigo);
      const expiraEn = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

      // Invalidar códigos anteriores sin usar, para que no queden varios
      // códigos "válidos" al mismo tiempo si el admin pide reenviar.
      await query(
        "UPDATE codigos_2fa_admin SET usado = TRUE WHERE id_admin = $1 AND usado = FALSE",
        [admin.id],
      );
      await query(
        `INSERT INTO codigos_2fa_admin (id_admin, hash_codigo, expira_en, ip_solicitud)
         VALUES ($1, $2, $3, $4)`,
        [admin.id, hashCodigo, expiraEn, getClientIp(req)],
      );

      // No se espera el envío para responder rápido; si el correo falla,
      // el admin puede pedir que se reenvíe el código.
      sendAdminLoginCode(admin.correo_corporativo, codigo, admin.nombre_completo).catch((e) => {
        console.error("[admin 2fa] Error enviando código por correo:", e);
      });

      const tempToken = jwt.sign(
        { id: admin.id, pending2FA: true },
        JWT_ADMIN_SECRET,
        { expiresIn: "10m" },
      );
      return res.json({
        require2FA: true,
        tempToken,
        message: "Te enviamos un código a tu correo corporativo",
      });
    }

    // Si no requiere 2FA (ej. Editor de contenido) - generar token final
    const jti = uuidv4();
    const token = jwt.sign(
      { id: admin.id, rol: admin.rol, jti },
      JWT_ADMIN_SECRET,
      { expiresIn: "8h" },
    );

    await query(
      "INSERT INTO sesiones_admin (id_admin, token_jti, ip_origen) VALUES ($1, $2, $3)",
      [admin.id, jti, req.ip],
    );
    await query(
      "UPDATE administradores SET ultimo_acceso = NOW() WHERE id = $1",
      [admin.id],
    );

    res.json({
      token,
      user: {
        nombre: admin.nombre_completo,
        rol: admin.rol,
        email: admin.correo_corporativo,
      },
    });
  } catch (error) {
    console.error("Login admin error:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const verify2fa = async (req: Request, res: Response) => {
  try {
    const { tempToken, code } = req.body;

    if (!code || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "El código debe tener 6 dígitos" });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, JWT_ADMIN_SECRET, { algorithms: ["HS256"] });
    } catch {
      return res.status(401).json({ error: "El código expiró, vuelve a iniciar sesión" });
    }
    if (!decoded.pending2FA) {
      return res.status(401).json({ error: "Token inválido" });
    }

    const result = await query("SELECT * FROM administradores WHERE id = $1", [
      decoded.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    const admin = result.rows[0];

    // Se busca el código vigente más reciente para este admin: sin usar,
    // no vencido, con margen de intentos fallidos (evita fuerza bruta de
    // los 6 dígitos aunque sea un token temporal de corta duración).
    const codigoRes = await query(
      `SELECT id, hash_codigo, intentos_fallidos FROM codigos_2fa_admin
       WHERE id_admin = $1 AND usado = FALSE AND expira_en > NOW()
       ORDER BY creado_en DESC LIMIT 1`,
      [admin.id],
    );

    if (codigoRes.rows.length === 0) {
      return res.status(401).json({ error: "El código expiró. Vuelve a iniciar sesión para pedir uno nuevo." });
    }

    const registro = codigoRes.rows[0];
    if (registro.intentos_fallidos >= 5) {
      return res.status(401).json({ error: "Demasiados intentos. Vuelve a iniciar sesión para pedir un código nuevo." });
    }

    const hashRecibido = sha256(code);
    if (hashRecibido !== registro.hash_codigo) {
      await query(
        "UPDATE codigos_2fa_admin SET intentos_fallidos = intentos_fallidos + 1 WHERE id = $1",
        [registro.id],
      );
      return res.status(401).json({ error: "Código incorrecto" });
    }

    await query("UPDATE codigos_2fa_admin SET usado = TRUE WHERE id = $1", [registro.id]);

    const jti = uuidv4();
    const token = jwt.sign(
      { id: admin.id, rol: admin.rol, jti },
      JWT_ADMIN_SECRET,
      { expiresIn: "8h" },
    );

    await query(
      "INSERT INTO sesiones_admin (id_admin, token_jti, ip_origen) VALUES ($1, $2, $3)",
      [admin.id, jti, req.ip],
    );
    await query(
      "UPDATE administradores SET ultimo_acceso = NOW() WHERE id = $1",
      [admin.id],
    );

    res.json({
      token,
      user: {
        nombre: admin.nombre_completo,
        rol: admin.rol,
        email: admin.correo_corporativo,
      },
    });
  } catch (error) {
    console.error("Verify 2FA error:", error);
    res.status(500).json({ error: "Error del servidor o código expirado" });
  }
};

export const getUsuarios = async (req: AdminAuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        u.id, u.nombre, u.apellidos, u.email, u.rol, 'activo' as estado_cuenta, u.fecha_registro,
        COUNT(pb.id) as cantidad_perfiles,
        STRING_AGG(COALESCE(pb.sexo, 'Prefirió no decir'), ', ') as sexos_bebes,
        STRING_AGG(COALESCE(tp.nombre_visible, pb.prevision_salud, 'Sin Previsión'), ', ') as previsiones_bebes
      FROM usuarios u
      LEFT JOIN perfiles_bebes pb ON u.id = pb.usuario_id
      LEFT JOIN tipos_prevision tp ON pb.prevision_salud = tp.codigo
      GROUP BY u.id
      ORDER BY u.fecha_registro DESC 
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error fetching users" });
  }
};

export const getUsuariosStats = async (req: AdminAuthRequest, res: Response) => {
  try {
    const totalRes = await query("SELECT COUNT(*) FROM usuarios");
    const activeRes = await query("SELECT COUNT(*) FROM usuarios"); // Just mock active for now as total since ultima_conexion might be null for new users
    const perfilesRes = await query("SELECT COUNT(*) FROM perfiles_bebes");
    
    const total = parseInt(totalRes.rows[0].count) || 0;
    const activos = total;
    const porcentajeActivos = total > 0 ? Math.round((activos / total) * 100) : 0;
    const perfilesTotales = parseInt(perfilesRes.rows[0].count) || 0;
    const perfilesPromedio = total > 0 ? (perfilesTotales / total).toFixed(1) : "0.0";

    res.json({
      registradas: total,
      activasPorcentaje: porcentajeActivos,
      perfilesInfantiles: perfilesTotales,
      perfilesPromedio: perfilesPromedio,
      leySanna: 0 // No ley sanna table yet
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching user stats" });
  }
};

export const createUsuario = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { nombre, apellidos, rol } = req.body;
    let { email } = req.body;
    if (!email) {
       email = `user_${Date.now()}@temp.cl`; // fallback if email is not provided in form
    }

    const passwordTemporal = generarPasswordTemporal();
    const hash = await bcrypt.hash(passwordTemporal, 10);
    const result = await query(
      "INSERT INTO usuarios (nombre, apellidos, email, rol, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, apellidos, email, rol, 'activo' as estado_cuenta, fecha_registro",
      [nombre, apellidos, email, rol || 'user', hash]
    );

    await logAudit(
      req.admin.id,
      req.admin.rol,
      "CREATE",
      "usuarios",
      result.rows[0].id,
      null,
      result.rows[0],
      req.ip,
    );

    res.status(201).json({ ...result.rows[0], password_temporal: passwordTemporal });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: "El correo ya está en uso" });
    }
    res.status(500).json({ error: "Error creating user" });
  }
};

export const getAdministradores = async (
  req: AdminAuthRequest,
  res: Response,
) => {
  try {
    const result = await query(
      "SELECT id, nombre_completo, correo_corporativo, rol, requiere_2fa, estado, ultimo_acceso FROM administradores ORDER BY fecha_creacion DESC",
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error fetching admins" });
  }
};

export const getAdministradoresStats = async (req: AdminAuthRequest, res: Response) => {
  try {
    const totalRes = await query("SELECT COUNT(*) FROM administradores");
    const activasRes = await query("SELECT COUNT(*) FROM administradores WHERE estado = 'activo'");
    const adminGenRes = await query("SELECT COUNT(*) FROM administradores WHERE rol = 'admin_general'");
    const accionesRes = await query("SELECT COUNT(*) FROM bitacora_auditoria WHERE fecha_hora_utc >= NOW() - INTERVAL '7 days'");

    res.json({
      totales: parseInt(totalRes.rows[0].count) || 0,
      activas: parseInt(activasRes.rows[0].count) || 0,
      adminGeneral: parseInt(adminGenRes.rows[0].count) || 0,
      accionesSemana: parseInt(accionesRes.rows[0].count) || 0
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching admin stats" });
  }
};

export const createAdministrador = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { nombre_completo, correo_corporativo, rol, requiere_2fa, estado } = req.body;
    
    const passwordTemporal = generarPasswordTemporal();
    const hash = await bcrypt.hash(passwordTemporal, 10);

    const result = await query(
      "INSERT INTO administradores (nombre_completo, correo_corporativo, rol, requiere_2fa, estado, hash_contrasena) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nombre_completo, correo_corporativo, rol, requiere_2fa, estado",
      [nombre_completo, correo_corporativo, rol, requiere_2fa, estado, hash]
    );

    await logAudit(
      req.admin.id,
      req.admin.rol,
      "CREATE",
      "administradores",
      result.rows[0].id,
      null,
      result.rows[0],
      req.ip,
    );

    res.status(201).json({ ...result.rows[0], password_temporal: passwordTemporal });
  } catch (error: any) {
    if (error.code === '23505') { // unique violation
      return res.status(400).json({ error: "El correo ya está en uso" });
    }
    res.status(500).json({ error: "Error creating admin" });
  }
};

export const updateAdministrador = async (
  req: AdminAuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { nombre_completo, correo_corporativo, rol, requiere_2fa, estado } =
      req.body;

    const result = await query(
      "UPDATE administradores SET nombre_completo=$1, correo_corporativo=$2, rol=$3, requiere_2fa=$4, estado=$5 WHERE id=$6 RETURNING id, nombre_completo, correo_corporativo, rol, requiere_2fa, estado",
      [nombre_completo, correo_corporativo, rol, requiere_2fa, estado, id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Admin no encontrado" });

    await logAudit(
      req.admin.id,
      req.admin.rol,
      "UPDATE",
      "administradores",
      id,
      null,
      result.rows[0],
      req.ip,
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando admin" });
  }
};

export const updateAdministradorPassword = async (
  req: AdminAuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { nueva_contrasena } = req.body;

    if (!nueva_contrasena || nueva_contrasena.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    const hash = await bcrypt.hash(nueva_contrasena, 10);

    const result = await query(
      // Se limpia también el bloqueo: si un admin quedó bloqueado por
      // intentos fallidos, cambiarle la contraseña debe devolverle el
      // acceso de inmediato, sin esperar los 15 minutos.
      `UPDATE administradores
       SET hash_contrasena=$1, intentos_login_fallidos = 0, bloqueado_hasta = NULL
       WHERE id=$2 RETURNING id, nombre_completo, correo_corporativo`,
      [hash, id],
    );
    
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Admin no encontrado" });

    await logAudit(
      req.admin.id,
      req.admin.rol,
      "UPDATE",
      "administradores",
      id,
      null,
      { ...result.rows[0], accion: "Reseteo de contraseña" },
      req.ip,
    );
    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error updating admin password:", error);
    res.status(500).json({ error: "Error actualizando contraseña del administrador" });
  }
};

export const deleteAdministrador = async (
  req: AdminAuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const result = await query(
      "DELETE FROM administradores WHERE id=$1 RETURNING id",
      [id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Admin no encontrado" });

    await logAudit(
      req.admin.id,
      req.admin.rol,
      "DELETE",
      "administradores",
      id,
      result.rows[0],
      null,
      req.ip,
    );
    res.json({ message: "Admin eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando admin" });
  }
};

export const updateUsuario = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, apellidos, rol } = req.body;

    const result = await query(
      "UPDATE usuarios SET nombre=$1, apellidos=$2, rol=$3 WHERE id=$4 RETURNING id, nombre, apellidos, rol, 'activo' as estado_cuenta",
      [nombre, apellidos, rol, id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });

    await logAudit(
      req.admin.id,
      req.admin.rol,
      "UPDATE",
      "usuarios",
      id,
      null,
      result.rows[0],
      req.ip,
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando usuario" });
  }
};

export const deleteUsuario = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Obtener info antes de eliminar para la bitácora
    const userRes = await query(
      "SELECT id, email, estado_cuenta FROM usuarios WHERE id = $1",
      [id],
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    await query("DELETE FROM usuarios WHERE id = $1", [id]);

    await logAudit(
      req.admin.id,
      req.admin.rol,
      "DELETE",
      "usuarios",
      id,
      userRes.rows[0],
      null,
      req.ip || "unknown",
    );

    res.json({ message: "Usuario eliminado con éxito" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};

export const impersonateUser = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const userRes = await query(
      "SELECT id, email, nombre, apellidos, rol, consentimiento_ley_19628, consentimiento_ley_21719 FROM usuarios WHERE id = $1",
      [id]
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const user = userRes.rows[0];

    // Generate user token
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      JWT_SECRET,
      { expiresIn: "1h" } // Corta duración por seguridad
    );

    // Log the action
    await logAudit(
      req.admin.id,
      req.admin.rol,
      "IMPERSONATE",
      "usuarios",
      id,
      null,
      { info: "Administrador inició sesión como este usuario" },
      req.ip || "unknown"
    );

    res.json({ user, token });
  } catch (error: any) {
    console.error("Error impersonando usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Seed de un admin inicial (solo para desarrollo/pruebas)
// La función seedAdmin (endpoint público GET /api/v1/admin/seed) se eliminó:
// no requería autenticación y creaba un admin con contraseña hardcodeada
// ("Administrador2026") cada vez que la tabla administradores estuviera vacía.
// Para crear el primer admin usar backend/scripts/seed_admin.ts, que ahora
// exige ADMIN_NAME/ADMIN_EMAIL/ADMIN_PASSWORD por variable de entorno.
