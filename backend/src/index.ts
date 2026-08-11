import express from "express";
import cors from "cors";
import dotenv from "dotenv";
// import { connectRedis } from "./config/redis";
import { globalLimiter } from "./middlewares/rateLimit.middleware";
import { verifyToken } from "./middlewares/auth.middleware";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes";
import profilesRoutes from "./routes/profiles.routes";
import mediaRoutes from "./routes/media.routes";
import adminRoutes from "./routes/admin.routes";
import homeRoutes from "./routes/home.routes";
import perfilBebeRoutes from "./routes/perfil_bebe.routes";
import personasRoutes from "./routes/personas.routes";
import saludRoutes from "./routes/salud.routes";
import directorioPublicoRoutes from "./routes/directorio_publico.routes";
import comunidadRoutes from "./routes/comunidad.routes";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const port = process.env.PORT || 3000;

// Log all requests
app.use((req, res, next) => {
  const log = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
  fs.appendFileSync('backend_error.log', log);
  
  // Intercept response finish
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      fs.appendFileSync('backend_error.log', `-> RESPONSE ERROR: ${res.statusCode}\n`);
    }
  });
  next();
});

// Configurar directorio público para uploads locales
const uploadDir = path.join(__dirname, "../../uploads");
app.use("/uploads", express.static(uploadDir));

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(globalLimiter);

// Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/profiles", profilesRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/home", homeRoutes);
app.use("/api/v1/perfiles-bebe", perfilBebeRoutes);
app.use("/api/v1/personas", personasRoutes);
app.use("/api/v1/salud", saludRoutes);
app.use("/api/v1/directorio", directorioPublicoRoutes);
app.use("/api/v1/comunidad", comunidadRoutes);

// Iniciar servicios y servidor
const startServer = async () => {
  try {
    // await connectRedis(); // Redis not used and crashes Render free tier

    // Rutas de prueba
    app.get("/api/health", (req, res) => {
      res.json({ status: "ok", message: "Iniciativa Baby API is running" });
    });

    app.get("/api/protected", verifyToken, (req, res) => {
      res.json({
        status: "ok",
        message: "You have access to protected route",
        user: (req as any).user,
      });
    });

    app.get("/api/logs", (req, res) => {
      try {
        const logs = fs.readFileSync('backend_error.log', 'utf8');
        res.send(logs);
      } catch(e) {
        res.send("No logs yet");
      }
    });

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// Global error logger
process.on('uncaughtException', (err) => {
  fs.appendFileSync('backend_error.log', `[UNCAUGHT] ${err.stack}\n`);
});
process.on('unhandledRejection', (reason, p) => {
  fs.appendFileSync('backend_error.log', `[UNHANDLED] ${reason}\n`);
});
