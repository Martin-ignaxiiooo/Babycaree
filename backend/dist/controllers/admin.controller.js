"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdmin = exports.impersonateUser = exports.deleteUsuario = exports.updateUsuario = exports.deleteAdministrador = exports.updateAdministradorPassword = exports.updateAdministrador = exports.createAdministrador = exports.getAdministradoresStats = exports.getAdministradores = exports.createUsuario = exports.getUsuariosStats = exports.getUsuarios = exports.verify2fa = exports.login = exports.logAudit = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const db_1 = require("../config/db");
const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || "supersecret_admin_key_fallback";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret_fallback_key";
const logAudit = async (id_admin, rol, accion, tabla_afectada, id_registro, valores_anteriores, valores_nuevos, ip_origen) => {
    try {
        await (0, db_1.query)(`INSERT INTO bitacora_auditoria (id_admin, rol, accion, tabla_afectada, id_registro, valores_anteriores, valores_nuevos, ip_origen)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
            id_admin,
            rol,
            accion,
            tabla_afectada,
            id_registro,
            valores_anteriores ? JSON.stringify(valores_anteriores) : null,
            valores_nuevos ? JSON.stringify(valores_nuevos) : null,
            ip_origen,
        ]);
    }
    catch (error) {
        console.error("Error logging audit:", error);
    }
};
exports.logAudit = logAudit;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !email.endsWith("@iniciativababy.cl")) {
            return res
                .status(401)
                .json({ error: "Solo se permiten correos corporativos" });
        }
        const result = await (0, db_1.query)("SELECT * FROM administradores WHERE correo_corporativo = $1", [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }
        const admin = result.rows[0];
        if (admin.estado !== "activo") {
            return res.status(403).json({ error: "Cuenta no activa" });
        }
        const match = await bcrypt_1.default.compare(password, admin.hash_contrasena);
        if (!match) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }
        // Si tiene 2FA activo
        if (admin.dos_fa_activo) {
            const tempToken = jsonwebtoken_1.default.sign({ id: admin.id, pending2FA: true }, JWT_ADMIN_SECRET, { expiresIn: "5m" });
            return res.json({
                require2FA: true,
                tempToken,
                message: "Introduce el código de tu aplicación autenticadora",
            });
        }
        // Si no requiere 2FA (ej. Editor de contenido) - generar token final
        const jti = (0, uuid_1.v4)();
        const token = jsonwebtoken_1.default.sign({ id: admin.id, rol: admin.rol, jti }, JWT_ADMIN_SECRET, { expiresIn: "8h" });
        await (0, db_1.query)("INSERT INTO sesiones_admin (id_admin, token_jti, ip_origen) VALUES ($1, $2, $3)", [admin.id, jti, req.ip]);
        await (0, db_1.query)("UPDATE administradores SET ultimo_acceso = NOW() WHERE id = $1", [admin.id]);
        res.json({
            token,
            user: {
                nombre: admin.nombre_completo,
                rol: admin.rol,
                email: admin.correo_corporativo,
            },
        });
    }
    catch (error) {
        console.error("Login admin error:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
};
exports.login = login;
const verify2fa = async (req, res) => {
    try {
        const { tempToken, code } = req.body;
        const decoded = jsonwebtoken_1.default.verify(tempToken, JWT_ADMIN_SECRET);
        if (!decoded.pending2FA) {
            return res.status(401).json({ error: "Token inválido" });
        }
        const result = await (0, db_1.query)("SELECT * FROM administradores WHERE id = $1", [
            decoded.id,
        ]);
        const admin = result.rows[0];
        // Real speakeasy verify
        const speakeasy = require("speakeasy");
        const verified = speakeasy.totp.verify({
            secret: admin.dos_fa_secret,
            encoding: "base32",
            token: code,
        });
        if (!verified) {
            return res.status(401).json({ error: "Código 2FA incorrecto" });
        }
        const jti = (0, uuid_1.v4)();
        const token = jsonwebtoken_1.default.sign({ id: admin.id, rol: admin.rol, jti }, JWT_ADMIN_SECRET, { expiresIn: "8h" });
        await (0, db_1.query)("INSERT INTO sesiones_admin (id_admin, token_jti, ip_origen) VALUES ($1, $2, $3)", [admin.id, jti, req.ip]);
        await (0, db_1.query)("UPDATE administradores SET ultimo_acceso = NOW() WHERE id = $1", [admin.id]);
        res.json({
            token,
            user: {
                nombre: admin.nombre_completo,
                rol: admin.rol,
                email: admin.correo_corporativo,
            },
        });
    }
    catch (error) {
        console.error("Verify 2FA error:", error);
        res.status(500).json({ error: "Error del servidor o código expirado" });
    }
};
exports.verify2fa = verify2fa;
const getUsuarios = async (req, res) => {
    try {
        const result = await (0, db_1.query)(`
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
    }
    catch (error) {
        res.status(500).json({ error: "Error fetching users" });
    }
};
exports.getUsuarios = getUsuarios;
const getUsuariosStats = async (req, res) => {
    try {
        const totalRes = await (0, db_1.query)("SELECT COUNT(*) FROM usuarios");
        const activeRes = await (0, db_1.query)("SELECT COUNT(*) FROM usuarios"); // Just mock active for now as total since ultima_conexion might be null for new users
        const perfilesRes = await (0, db_1.query)("SELECT COUNT(*) FROM perfiles_bebes");
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
    }
    catch (error) {
        res.status(500).json({ error: "Error fetching user stats" });
    }
};
exports.getUsuariosStats = getUsuariosStats;
const createUsuario = async (req, res) => {
    try {
        const { nombre, apellidos, rol } = req.body;
        let { email } = req.body;
        if (!email) {
            email = `user_${Date.now()}@temp.cl`; // fallback if email is not provided in form
        }
        const hash = await bcrypt_1.default.hash("usuario2026", 10);
        const result = await (0, db_1.query)("INSERT INTO usuarios (nombre, apellidos, email, rol, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, apellidos, email, rol, 'activo' as estado_cuenta, fecha_registro", [nombre, apellidos, email, rol || 'user', hash]);
        await (0, exports.logAudit)(req.admin.id, req.admin.rol, "CREATE", "usuarios", result.rows[0].id, null, result.rows[0], req.ip);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: "El correo ya está en uso" });
        }
        res.status(500).json({ error: "Error creating user" });
    }
};
exports.createUsuario = createUsuario;
const getAdministradores = async (req, res) => {
    try {
        const result = await (0, db_1.query)("SELECT id, nombre_completo, correo_corporativo, rol, requiere_2fa, estado, ultimo_acceso FROM administradores ORDER BY fecha_creacion DESC");
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: "Error fetching admins" });
    }
};
exports.getAdministradores = getAdministradores;
const getAdministradoresStats = async (req, res) => {
    try {
        const totalRes = await (0, db_1.query)("SELECT COUNT(*) FROM administradores");
        const activasRes = await (0, db_1.query)("SELECT COUNT(*) FROM administradores WHERE estado = 'activo'");
        const adminGenRes = await (0, db_1.query)("SELECT COUNT(*) FROM administradores WHERE rol = 'admin_general'");
        const accionesRes = await (0, db_1.query)("SELECT COUNT(*) FROM bitacora_auditoria WHERE fecha_hora_utc >= NOW() - INTERVAL '7 days'");
        res.json({
            totales: parseInt(totalRes.rows[0].count) || 0,
            activas: parseInt(activasRes.rows[0].count) || 0,
            adminGeneral: parseInt(adminGenRes.rows[0].count) || 0,
            accionesSemana: parseInt(accionesRes.rows[0].count) || 0
        });
    }
    catch (error) {
        res.status(500).json({ error: "Error fetching admin stats" });
    }
};
exports.getAdministradoresStats = getAdministradoresStats;
const createAdministrador = async (req, res) => {
    try {
        const { nombre_completo, correo_corporativo, rol, requiere_2fa, estado } = req.body;
        // Default password for new admins: temporal2026
        const hash = await bcrypt_1.default.hash("temporal2026", 10);
        const result = await (0, db_1.query)("INSERT INTO administradores (nombre_completo, correo_corporativo, rol, requiere_2fa, estado, hash_contrasena) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nombre_completo, correo_corporativo, rol, requiere_2fa, estado", [nombre_completo, correo_corporativo, rol, requiere_2fa, estado, hash]);
        await (0, exports.logAudit)(req.admin.id, req.admin.rol, "CREATE", "administradores", result.rows[0].id, null, result.rows[0], req.ip);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        if (error.code === '23505') { // unique violation
            return res.status(400).json({ error: "El correo ya está en uso" });
        }
        res.status(500).json({ error: "Error creating admin" });
    }
};
exports.createAdministrador = createAdministrador;
const updateAdministrador = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_completo, correo_corporativo, rol, requiere_2fa, estado } = req.body;
        const result = await (0, db_1.query)("UPDATE administradores SET nombre_completo=$1, correo_corporativo=$2, rol=$3, requiere_2fa=$4, estado=$5 WHERE id=$6 RETURNING id, nombre_completo, correo_corporativo, rol, requiere_2fa, estado", [nombre_completo, correo_corporativo, rol, requiere_2fa, estado, id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Admin no encontrado" });
        await (0, exports.logAudit)(req.admin.id, req.admin.rol, "UPDATE", "administradores", id, null, result.rows[0], req.ip);
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: "Error actualizando admin" });
    }
};
exports.updateAdministrador = updateAdministrador;
const updateAdministradorPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { nueva_contrasena } = req.body;
        if (!nueva_contrasena || nueva_contrasena.length < 6) {
            return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
        }
        const hash = await bcrypt_1.default.hash(nueva_contrasena, 10);
        const result = await (0, db_1.query)("UPDATE administradores SET hash_contrasena=$1 WHERE id=$2 RETURNING id, nombre_completo, correo_corporativo", [hash, id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Admin no encontrado" });
        await (0, exports.logAudit)(req.admin.id, req.admin.rol, "UPDATE", "administradores", id, null, { ...result.rows[0], accion: "Reseteo de contraseña" }, req.ip);
        res.json({ message: "Contraseña actualizada correctamente" });
    }
    catch (error) {
        console.error("Error updating admin password:", error);
        res.status(500).json({ error: "Error actualizando contraseña del administrador" });
    }
};
exports.updateAdministradorPassword = updateAdministradorPassword;
const deleteAdministrador = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await (0, db_1.query)("DELETE FROM administradores WHERE id=$1 RETURNING id", [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Admin no encontrado" });
        await (0, exports.logAudit)(req.admin.id, req.admin.rol, "DELETE", "administradores", id, result.rows[0], null, req.ip);
        res.json({ message: "Admin eliminado" });
    }
    catch (error) {
        res.status(500).json({ error: "Error eliminando admin" });
    }
};
exports.deleteAdministrador = deleteAdministrador;
const updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellidos, rol } = req.body;
        const result = await (0, db_1.query)("UPDATE usuarios SET nombre=$1, apellidos=$2, rol=$3 WHERE id=$4 RETURNING id, nombre, apellidos, rol, 'activo' as estado_cuenta", [nombre, apellidos, rol, id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Usuario no encontrado" });
        await (0, exports.logAudit)(req.admin.id, req.admin.rol, "UPDATE", "usuarios", id, null, result.rows[0], req.ip);
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: "Error actualizando usuario" });
    }
};
exports.updateUsuario = updateUsuario;
const deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        // Obtener info antes de eliminar para la bitácora
        const userRes = await (0, db_1.query)("SELECT id, email, estado_cuenta FROM usuarios WHERE id = $1", [id]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        await (0, db_1.query)("DELETE FROM usuarios WHERE id = $1", [id]);
        await (0, exports.logAudit)(req.admin.id, req.admin.rol, "DELETE", "usuarios", id, userRes.rows[0], null, req.ip || "unknown");
        res.json({ message: "Usuario eliminado con éxito" });
    }
    catch (error) {
        res.status(500).json({ error: "Error al eliminar usuario" });
    }
};
exports.deleteUsuario = deleteUsuario;
const impersonateUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if user exists
        const userRes = await (0, db_1.query)("SELECT id, email, nombre, apellidos, rol, consentimiento_ley_19628, consentimiento_ley_21719 FROM usuarios WHERE id = $1", [id]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        const user = userRes.rows[0];
        // Generate user token
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, rol: user.rol }, JWT_SECRET, { expiresIn: "1h" } // Corta duración por seguridad
        );
        // Log the action
        await (0, exports.logAudit)(req.admin.id, req.admin.rol, "IMPERSONATE", "usuarios", id, null, { info: "Administrador inició sesión como este usuario" }, req.ip || "unknown");
        res.json({ user, token });
    }
    catch (error) {
        console.error("Error impersonando usuario:", error);
        res.status(500).json({ error: "Error interno del servidor", details: error.message, stack: error.stack });
    }
};
exports.impersonateUser = impersonateUser;
// Seed de un admin inicial (solo para desarrollo/pruebas)
const seedAdmin = async (req, res) => {
    try {
        const check = await (0, db_1.query)("SELECT COUNT(*) FROM administradores");
        if (parseInt(check.rows[0].count) > 0) {
            return res.status(400).json({ message: "Ya existen administradores" });
        }
        const hash = await bcrypt_1.default.hash("Administrador2026", 12);
        await (0, db_1.query)(`INSERT INTO administradores (nombre_completo, correo_corporativo, rol, hash_contrasena, requiere_2fa) 
                 VALUES ('César Peña', 'cesar.pena@iniciativababy.cl', 'admin_general', $1, true)`, [hash]);
        res.json({
            message: "Admin inicial creado (cesar.pena@iniciativababy.cl / Administrador2026)",
        });
    }
    catch (error) {
        res.status(500).json({ error: "Error seeding admin" });
    }
};
exports.seedAdmin = seedAdmin;
