import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";
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
import { revisarYEnviarRecordatorios, revisarYEnviarSeguimientos } from "./services/citaReminders.service";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const port = process.env.PORT || 3000;

// Log de peticiones solo a stdout (Render ya captura esto en sus propios logs).
// Antes esto se escribía a un archivo en disco que además quedaba commiteado al
// repo y se servía públicamente sin autenticación en /api/logs — se eliminó.
app.use((req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      console.error(`[${new Date().toISOString()}] ${req.method} ${req.url} -> ${res.statusCode}`);
    }
  });
  next();
});

// Configurar directorio público para uploads locales
const uploadDir = path.join(__dirname, "../../uploads");
app.use("/uploads", express.static(uploadDir));

// Middlewares
app.use(helmet());

// CORS restringido a los orígenes conocidos del frontend (antes estaba abierto
// a cualquier origen). Se puede agregar más orígenes vía la variable de entorno
// CORS_EXTRA_ORIGINS (separados por coma), útil para previews de Vercel.
const allowedOrigins = [
  "https://babycaree-web.vercel.app",
  "http://localhost:5173",
  ...(process.env.CORS_EXTRA_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) || []),
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"));
    }
  },
  credentials: true,
}));

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
      res.json({ status: "ok", message: "Baby Care API is running" });
    });

    app.get("/api/protected", verifyToken, (req, res) => {
      res.json({
        status: "ok",
        message: "You have access to protected route",
        user: (req as any).user,
      });
    });

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    // Revisa cada 15 minutos si hay citas próximas (7 días, 1 día o 2 horas)
    // que necesiten recordatorio por correo, y citas ya pasadas que necesiten
    // el correo de seguimiento. Vive dentro del mismo proceso del servidor
    // (no depende de un Cron Job separado en Render) — mientras el backend
    // esté corriendo, los correos se siguen enviando.
    const revisarCorreosDeCitas = () => {
      revisarYEnviarRecordatorios().catch((err) =>
        console.error("[recordatorios] Error inesperado en el job:", err),
      );
      revisarYEnviarSeguimientos().catch((err) =>
        console.error("[seguimiento] Error inesperado en el job:", err),
      );
    };

    cron.schedule("*/15 * * * *", revisarCorreosDeCitas);
    // Corre una vez también al arrancar, para no esperar hasta el primer
    // múltiplo de 15 minutos tras un redeploy.
    revisarCorreosDeCitas();
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// Global error logger
process.on('uncaughtException', (err) => {
  console.error(`[UNCAUGHT] ${err.stack}`);
});
process.on('unhandledRejection', (reason) => {
  console.error(`[UNHANDLED] ${reason}`);
});
