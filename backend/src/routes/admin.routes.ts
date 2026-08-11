import { Router } from "express";
import {
  login,
  verify2fa,
  seedAdmin,
  getUsuarios,
  getUsuariosStats,
  createUsuario,
  getAdministradores,
  getAdministradoresStats,
  createAdministrador,
  updateAdministrador,
  deleteAdministrador,
  updateUsuario,
  deleteUsuario,
  impersonateUser,
  updateAdministradorPassword,
} from "../controllers/admin.controller";
import {
  verifyAdminToken,
  requireRole,
} from "../middlewares/adminAuth.middleware";

import vacunasRouter from "../microservices/vacunas/vacunas.routes";
import directorioRouter from "../microservices/directorio/directorio.routes";
import articulosRouter from "../microservices/articulos/articulos.routes";
import bitacoraRouter from "../microservices/bitacora/bitacora.routes";
import dashboardRouter from "../microservices/dashboard/dashboard.routes";
import omsRouter from "../microservices/oms/oms.routes";
import comunidadRouter from "../microservices/comunidad/comunidad.routes";

const router = Router();

// Auth routes
import { loginLimiter } from "../middlewares/rateLimit.middleware";

router.post("/auth/login", loginLimiter, login);
router.post("/auth/verificar-2fa", verify2fa);

// Seed admin
router.get("/seed", seedAdmin);

// Protected routes
router.use(verifyAdminToken);

import { generate2fa, enable2fa } from "../controllers/admin_2fa.controller";
router.post("/auth/2fa/generate", generate2fa);
router.post("/auth/2fa/enable", enable2fa);

// Usuarios
router.get(
  "/usuarios/stats",
  requireRole(["admin_general", "soporte_cliente", "auditor"]),
  getUsuariosStats,
);
router.get(
  "/usuarios",
  requireRole(["admin_general", "soporte_cliente", "auditor"]),
  getUsuarios,
);
router.post(
  "/usuarios",
  requireRole(["admin_general", "soporte_cliente"]),
  createUsuario,
);
router.put(
  "/usuarios/:id",
  requireRole(["admin_general", "soporte_cliente"]),
  updateUsuario,
);
router.delete("/usuarios/:id", requireRole(["admin_general"]), deleteUsuario);
router.post(
  "/usuarios/:id/impersonate",
  requireRole(["admin_general", "soporte_cliente"]),
  impersonateUser,
);

// Administradores
router.get(
  "/administradores/stats",
  requireRole(["admin_general", "auditor"]),
  getAdministradoresStats,
);
router.get(
  "/administradores",
  requireRole(["admin_general", "auditor"]),
  getAdministradores,
);
router.post(
  "/administradores",
  requireRole(["admin_general"]),
  createAdministrador,
);
router.put(
  "/administradores/:id",
  requireRole(["admin_general"]),
  updateAdministrador,
);
router.put(
  "/administradores/:id/password",
  requireRole(["admin_general"]),
  updateAdministradorPassword,
);
router.delete(
  "/administradores/:id",
  requireRole(["admin_general"]),
  deleteAdministrador,
);

// Microservicios
router.use("/vacunas", vacunasRouter);
router.use("/directorio", directorioRouter);
router.use("/articulos", articulosRouter);
router.use("/bitacora", bitacoraRouter);
router.use("/dashboard", dashboardRouter);
router.use("/oms", omsRouter);
router.use("/comunidad", comunidadRouter);

export default router;
