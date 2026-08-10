import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { query } from "../config/db";
import { AdminAuthRequest } from "../middlewares/adminAuth.middleware";

const JWT_ADMIN_SECRET =
  process.env.JWT_ADMIN_SECRET || "supersecret_admin_key_fallback";
const JWT_SECRET = 
  process.env.JWT_SECRET || "supersecret_fallback_key";

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

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.endsWith("@iniciativababy.cl")) {
      return res
        .status(401)
        .json({ error: "Solo se permiten correos corporativos" });
    }

    const result = await query(
      "SELECT * FROM administradores WHERE correo_corporativo = $1",
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const admin = result.rows[0];

    if (admin.estado !== "activo") {
      return res.status(403).json({ error: "Cuenta no activa" });
    }

    const match = await bcrypt.compare(password, admin.hash_contrasena);
    if (!match) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Si tiene 2FA (simulamos 2FA)
    if (admin.requiere_2fa) {
      const tempToken = jwt.sign(
        { id: admin.id, pending2FA: true },
        JWT_ADMIN_SECRET,
        { expiresIn: "5m" },
      );
      // Simulamos enviar código
      console.log(`\n=== 2FA CODE PARA ${admin.correo_corporativo} ===`);
      console.log(`Tu código es: 123456`);
      console.log(`====================================================\n`);
      return res.json({
        require2FA: true,
        tempToken,
        message: "Código enviado por correo/SMS",
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

    if (code !== "123456") {
      return res.status(401).json({ error: "Código 2FA incorrecto" });
    }

    const decoded: any = jwt.verify(tempToken, JWT_ADMIN_SECRET);
    if (!decoded.pending2FA) {
      return res.status(401).json({ error: "Token inválido" });
    }

    const result = await query("SELECT * FROM administradores WHERE id = $1", [
      decoded.id,
    ]);
    const admin = result.rows[0];

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

    const hash = await bcrypt.hash("usuario2026", 10);
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

    res.status(201).json(result.rows[0]);
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
    
    // Default password for new admins: temporal2026
    const hash = await bcrypt.hash("temporal2026", 10);

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

    res.status(201).json(result.rows[0]);
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
      "UPDATE administradores SET hash_contrasena=$1 WHERE id=$2 RETURNING id, nombre_completo, correo_corporativo",
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
  } catch (error) {
    console.error("Error impersonando usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Seed de un admin inicial (solo para desarrollo/pruebas)
export const seedAdmin = async (req: Request, res: Response) => {
  try {
    const check = await query("SELECT COUNT(*) FROM administradores");
    if (parseInt(check.rows[0].count) > 0) {
      return res.status(400).json({ message: "Ya existen administradores" });
    }

    const hash = await bcrypt.hash("Administrador2026", 12);
    await query(
      `INSERT INTO administradores (nombre_completo, correo_corporativo, rol, hash_contrasena, requiere_2fa) 
                 VALUES ('César Peña', 'cesar.pena@iniciativababy.cl', 'admin_general', $1, true)`,
      [hash],
    );

    res.json({
      message: "Admin inicial creado (cesar.pena@iniciativababy.cl / Administrador2026)",
    });
  } catch (error) {
    res.status(500).json({ error: "Error seeding admin" });
  }
};
