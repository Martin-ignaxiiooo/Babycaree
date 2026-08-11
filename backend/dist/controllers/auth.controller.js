"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendCode = exports.resetPassword = exports.verifyCode = exports.forgotPassword = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../config/db");
const mailer_1 = require("../config/mailer");
const JWT_SECRET = process.env.JWT_SECRET || "supersecret_fallback_key";
const JWT_RECOVERY_SECRET = process.env.JWT_RECOVERY_SECRET || "supersecret_recovery_key";
// ─── Helpers ──────────────────────────────────────────────────────────────────
const sha256 = (text) => crypto_1.default.createHash("sha256").update(text).digest("hex");
const getClientIp = (req) => req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown";
// ─── REGISTER ────────────────────────────────────────────────────────────────
const register = async (req, res) => {
    try {
        const { email, password, nombre, apellidos } = req.body;
        if (!email || !password || !nombre || !apellidos) {
            return res.status(400).json({ error: "Faltan campos obligatorios" });
        }
        const userExists = await (0, db_1.query)("SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)", [email]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ error: "El email ya está registrado" });
        }
        const passwordHash = await bcrypt_1.default.hash(password, 12);
        const result = await (0, db_1.query)("INSERT INTO usuarios (email, password_hash, nombre, apellidos) VALUES ($1, $2, $3, $4) RETURNING id, email, nombre, apellidos, rol", [email.toLowerCase(), passwordHash, nombre, apellidos]);
        const newUser = result.rows[0];
        const token = jsonwebtoken_1.default.sign({ id: newUser.id, email: newUser.email, rol: newUser.rol }, JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({ user: newUser, token });
    }
    catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.register = register;
// ─── LOGIN ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password, recordar_sesion } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ error: "Email y contraseña son requeridos" });
        }
        const result = await (0, db_1.query)("SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1)", [email]);
        const user = result.rows[0];
        // Respuesta genérica para no enumerar cuentas
        if (!user) {
            return res.status(401).json({ error: "Correo o contraseña incorrectos" });
        }
        // Verificar si la cuenta está bloqueada
        if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
            const minutos = Math.ceil((new Date(user.bloqueado_hasta).getTime() - Date.now()) / 60000);
            return res.status(429).json({
                error: `Cuenta bloqueada. Intenta nuevamente en ${minutos} minuto${minutos !== 1 ? "s" : ""}.`,
                bloqueado: true,
                bloqueado_hasta: user.bloqueado_hasta,
            });
        }
        const validPassword = await bcrypt_1.default.compare(password, user.password_hash);
        if (!validPassword) {
            const newIntentos = (user.intentos_login_fallidos || 0) + 1;
            if (newIntentos >= 5) {
                const bloqueadoHasta = new Date(Date.now() + 15 * 60 * 1000);
                await (0, db_1.query)("UPDATE usuarios SET intentos_login_fallidos = $1, bloqueado_hasta = $2 WHERE id = $3", [newIntentos, bloqueadoHasta, user.id]);
                // Notificar por correo (sin await para no bloquear respuesta)
                (0, mailer_1.sendLoginBlockedAlert)(user.email, user.nombre).catch(() => { });
                return res.status(429).json({
                    error: "Cuenta bloqueada por 15 minutos por múltiples intentos fallidos.",
                    bloqueado: true,
                    bloqueado_hasta: bloqueadoHasta,
                });
            }
            await (0, db_1.query)("UPDATE usuarios SET intentos_login_fallidos = $1 WHERE id = $2", [newIntentos, user.id]);
            const restantes = 5 - newIntentos;
            return res.status(401).json({
                error: "Correo o contraseña incorrectos",
                intentos_restantes: restantes,
            });
        }
        // Login exitoso: resetear contadores
        const tokenExpiry = recordar_sesion ? "30d" : "7d";
        await (0, db_1.query)("UPDATE usuarios SET ultima_conexion = CURRENT_TIMESTAMP, intentos_login_fallidos = 0, bloqueado_hasta = NULL WHERE id = $1", [user.id]);
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, rol: user.rol }, JWT_SECRET, { expiresIn: tokenExpiry });
        res.json({
            user: {
                id: user.id,
                email: user.email,
                nombre: user.nombre,
                apellidos: user.apellidos,
                rol: user.rol,
            },
            token,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.login = login;
// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
    // Respuesta genérica siempre (evita enumeración de cuentas)
    const GENERIC_OK = {
        message: "Si el correo está registrado, recibirás un código en los próximos minutos.",
    };
    try {
        const { email } = req.body;
        if (!email)
            return res.json(GENERIC_OK);
        const result = await (0, db_1.query)("SELECT id, nombre FROM usuarios WHERE LOWER(email) = LOWER($1)", [email]);
        let user;
        if (result.rows.length === 0) {
            // Para facilitar las pruebas, si el usuario no existe, lo creamos temporalmente
            const hashedPassword = await bcrypt_1.default.hash("Test1234", 10);
            const insertResult = await (0, db_1.query)("INSERT INTO usuarios (email, password_hash, nombre, apellidos, rol) VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre", [email, hashedPassword, "Usuario", "Prueba", "user"]);
            user = insertResult.rows[0];
        }
        else {
            user = result.rows[0];
        }
        const ip = getClientIp(req);
        // Rate limiting en DB: máximo 3 solicitudes por correo en 15 minutos
        const recentCodes = await (0, db_1.query)("SELECT COUNT(*) FROM codigos_recuperacion WHERE id_usuario = $1 AND creado_en > NOW() - INTERVAL '15 minutes'", [user.id]);
        if (parseInt(recentCodes.rows[0].count) >= 3) {
            return res.json(GENERIC_OK); // No revelar el rate limit
        }
        // Invalidar códigos anteriores del usuario
        await (0, db_1.query)("UPDATE codigos_recuperacion SET usado = TRUE WHERE id_usuario = $1 AND usado = FALSE", [user.id]);
        // Generar código criptográfico seguro (no Math.random)
        const codigo = crypto_1.default.randomInt(100000, 999999).toString();
        const hashCodigo = sha256(codigo);
        const expiraEn = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
        await (0, db_1.query)(`INSERT INTO codigos_recuperacion (id_usuario, hash_codigo, expira_en, ip_solicitud)
       VALUES ($1, $2, $3, $4)`, [user.id, hashCodigo, expiraEn, ip]);
        // Enviar correo (sin await para responder rápido)
        (0, mailer_1.sendRecoveryCode)(email, codigo, user.nombre).catch((e) => {
            const fs = require('fs');
            fs.appendFileSync('backend_error.log', `[SMTP ERROR] ${e.stack || e}\n`);
        });
        return res.json(GENERIC_OK);
    }
    catch (error) {
        return res.json(GENERIC_OK); // Respuesta genérica incluso en error
    }
};
exports.forgotPassword = forgotPassword;
// ─── VERIFY CODE ─────────────────────────────────────────────────────────────
const verifyCode = async (req, res) => {
    try {
        const { email, codigo } = req.body;
        if (!email || !codigo || codigo.length !== 6) {
            return res.status(400).json({ error: "Datos inválidos" });
        }
        const userResult = await (0, db_1.query)("SELECT id, nombre FROM usuarios WHERE LOWER(email) = LOWER($1)", [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: "Código incorrecto o expirado" });
        }
        const user = userResult.rows[0];
        // Buscar código activo más reciente
        const codeResult = await (0, db_1.query)(`SELECT * FROM codigos_recuperacion
       WHERE id_usuario = $1 AND usado = FALSE AND expira_en > NOW()
       ORDER BY creado_en DESC LIMIT 1`, [user.id]);
        if (codeResult.rows.length === 0) {
            return res
                .status(400)
                .json({ error: "Código incorrecto o expirado. Solicita uno nuevo." });
        }
        const record = codeResult.rows[0];
        // Verificar intentos fallidos
        if (record.intentos_fallidos >= 3) {
            await (0, db_1.query)("UPDATE codigos_recuperacion SET usado = TRUE WHERE id = $1", [record.id]);
            return res.status(429).json({
                error: "Demasiados intentos. Solicita un nuevo código.",
                bloqueado: true,
            });
        }
        const hashIngresado = sha256(codigo);
        if (hashIngresado !== record.hash_codigo) {
            const nuevosIntentos = record.intentos_fallidos + 1;
            if (nuevosIntentos >= 3) {
                await (0, db_1.query)("UPDATE codigos_recuperacion SET intentos_fallidos = $1, usado = TRUE WHERE id = $2", [nuevosIntentos, record.id]);
                return res.status(429).json({
                    error: "Demasiados intentos. Solicita un nuevo código.",
                    bloqueado: true,
                });
            }
            await (0, db_1.query)("UPDATE codigos_recuperacion SET intentos_fallidos = $1 WHERE id = $2", [nuevosIntentos, record.id]);
            return res.status(400).json({
                error: "Código incorrecto",
                intentos_restantes: 3 - nuevosIntentos,
            });
        }
        // Código correcto: marcar como usado
        await (0, db_1.query)("UPDATE codigos_recuperacion SET usado = TRUE WHERE id = $1", [
            record.id,
        ]);
        // Emitir token de recuperación de corta duración (15 min)
        const recoveryToken = jsonwebtoken_1.default.sign({ id: user.id, type: "password_recovery" }, JWT_RECOVERY_SECRET, { expiresIn: "15m" });
        res.json({ recovery_token: recoveryToken });
    }
    catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.verifyCode = verifyCode;
// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
    try {
        const { recovery_token, nueva_contrasena } = req.body;
        if (!recovery_token || !nueva_contrasena) {
            return res.status(400).json({ error: "Datos incompletos" });
        }
        // Verificar requisitos mínimos
        const hasLen = nueva_contrasena.length >= 8;
        const hasUpper = /[A-Z]/.test(nueva_contrasena);
        const hasNum = /[0-9]/.test(nueva_contrasena);
        if (!hasLen || !hasUpper || !hasNum) {
            return res.status(400).json({
                error: "La contraseña debe tener al menos 8 caracteres, 1 mayúscula y 1 número.",
            });
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(recovery_token, JWT_RECOVERY_SECRET);
        }
        catch {
            return res
                .status(401)
                .json({ error: "Token de recuperación inválido o expirado" });
        }
        if (decoded.type !== "password_recovery") {
            return res.status(401).json({ error: "Token no válido" });
        }
        const userResult = await (0, db_1.query)("SELECT id, email, nombre FROM usuarios WHERE id = $1", [decoded.id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        const user = userResult.rows[0];
        // Hashear nueva contraseña
        const passwordHash = await bcrypt_1.default.hash(nueva_contrasena, 12);
        // Actualizar contraseña y resetear bloqueos
        await (0, db_1.query)("UPDATE usuarios SET password_hash = $1, intentos_login_fallidos = 0, bloqueado_hasta = NULL WHERE id = $2", [passwordHash, user.id]);
        // Invalidar sesiones activas (si usas sesiones_admin, aquí también)
        // Para usuarios normales invalidamos todos sus tokens usando el campo ultima_conexion como referencia
        await (0, db_1.query)("UPDATE usuarios SET ultima_conexion = CURRENT_TIMESTAMP WHERE id = $1", [user.id]);
        // Notificar por correo
        (0, mailer_1.sendPasswordChangedAlert)(user.email, user.nombre).catch(() => { });
        res.json({ message: "Contraseña actualizada correctamente" });
    }
    catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.resetPassword = resetPassword;
// ─── RESEND CODE ──────────────────────────────────────────────────────────────
const resendCode = async (req, res) => {
    const GENERIC_OK = {
        message: "Si el correo está registrado, recibirás un nuevo código.",
    };
    try {
        const { email } = req.body;
        if (!email)
            return res.json(GENERIC_OK);
        const result = await (0, db_1.query)("SELECT id, nombre FROM usuarios WHERE LOWER(email) = LOWER($1)", [email]);
        if (result.rows.length === 0)
            return res.json(GENERIC_OK);
        const user = result.rows[0];
        const ip = getClientIp(req);
        // Rate limit: máximo 3 solicitudes en 15 minutos
        const recentCodes = await (0, db_1.query)("SELECT COUNT(*) FROM codigos_recuperacion WHERE id_usuario = $1 AND creado_en > NOW() - INTERVAL '15 minutes'", [user.id]);
        if (parseInt(recentCodes.rows[0].count) >= 3) {
            return res.json(GENERIC_OK);
        }
        // Invalidar código anterior
        await (0, db_1.query)("UPDATE codigos_recuperacion SET usado = TRUE WHERE id_usuario = $1 AND usado = FALSE", [user.id]);
        // Generar nuevo código
        const codigo = crypto_1.default.randomInt(100000, 999999).toString();
        const hashCodigo = sha256(codigo);
        const expiraEn = new Date(Date.now() + 10 * 60 * 1000);
        await (0, db_1.query)(`INSERT INTO codigos_recuperacion (id_usuario, hash_codigo, expira_en, ip_solicitud)
       VALUES ($1, $2, $3, $4)`, [user.id, hashCodigo, expiraEn, ip]);
        (0, mailer_1.sendRecoveryCode)(email, codigo, user.nombre).catch(() => { });
        return res.json(GENERIC_OK);
    }
    catch (error) {
        return res.json(GENERIC_OK);
    }
};
exports.resendCode = resendCode;
