import { Router } from "express";
import { getDashboardStats } from "./dashboard.service";
import { requireRole } from "../../middlewares/adminAuth.middleware";

const router = Router();

router.get(
  "/stats",
  requireRole([
    "admin_general",
    "auditor",
    "soporte_cliente",
    "editor_contenido",
  ]),
  getDashboardStats,
);

export default router;
