"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// import { connectRedis } from "./config/redis";
const rateLimit_middleware_1 = require("./middlewares/rateLimit.middleware");
const auth_middleware_1 = require("./middlewares/auth.middleware");
const helmet_1 = __importDefault(require("helmet"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const profiles_routes_1 = __importDefault(require("./routes/profiles.routes"));
const media_routes_1 = __importDefault(require("./routes/media.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const home_routes_1 = __importDefault(require("./routes/home.routes"));
const perfil_bebe_routes_1 = __importDefault(require("./routes/perfil_bebe.routes"));
const personas_routes_1 = __importDefault(require("./routes/personas.routes"));
const salud_routes_1 = __importDefault(require("./routes/salud.routes"));
const directorio_publico_routes_1 = __importDefault(require("./routes/directorio_publico.routes"));
const comunidad_routes_1 = __importDefault(require("./routes/comunidad.routes"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.set("trust proxy", 1);
const port = process.env.PORT || 3000;
// Log all requests
app.use((req, res, next) => {
    const log = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
    fs_1.default.appendFileSync('backend_error.log', log);
    // Intercept response finish
    res.on('finish', () => {
        if (res.statusCode >= 400) {
            fs_1.default.appendFileSync('backend_error.log', `-> RESPONSE ERROR: ${res.statusCode}\n`);
        }
    });
    next();
});
// Configurar directorio público para uploads locales
const uploadDir = path_1.default.join(__dirname, "../../uploads");
app.use("/uploads", express_1.default.static(uploadDir));
// Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(rateLimit_middleware_1.globalLimiter);
// Rutas de la API
app.use("/api/auth", auth_routes_1.default);
app.use("/api/profiles", profiles_routes_1.default);
app.use("/api/media", media_routes_1.default);
app.use("/api/v1/admin", admin_routes_1.default);
app.use("/api/v1/home", home_routes_1.default);
app.use("/api/v1/perfiles-bebe", perfil_bebe_routes_1.default);
app.use("/api/v1/personas", personas_routes_1.default);
app.use("/api/v1/salud", salud_routes_1.default);
app.use("/api/v1/directorio", directorio_publico_routes_1.default);
app.use("/api/v1/comunidad", comunidad_routes_1.default);
// Iniciar servicios y servidor
const startServer = async () => {
    try {
        // await connectRedis(); // Redis not used and crashes Render free tier
        // Rutas de prueba
        app.get("/api/health", (req, res) => {
            res.json({ status: "ok", message: "Iniciativa Baby API is running" });
        });
        app.get("/api/protected", auth_middleware_1.verifyToken, (req, res) => {
            res.json({
                status: "ok",
                message: "You have access to protected route",
                user: req.user,
            });
        });
        app.get("/api/logs", (req, res) => {
            try {
                const logs = fs_1.default.readFileSync('backend_error.log', 'utf8');
                res.send(logs);
            }
            catch (e) {
                res.send("No logs yet");
            }
        });
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};
startServer();
// Global error logger
process.on('uncaughtException', (err) => {
    fs_1.default.appendFileSync('backend_error.log', `[UNCAUGHT] ${err.stack}\n`);
});
process.on('unhandledRejection', (reason, p) => {
    fs_1.default.appendFileSync('backend_error.log', `[UNHANDLED] ${reason}\n`);
});
