import { Router } from "express";
import { getBitacora } from "./bitacora.service";
import { requireRole } from "../../middlewares/adminAuth.middleware";

const router = Router();

// Only admin_general and auditor can view the audit log
router.get("/", requireRole(["admin_general", "auditor"]), getBitacora);

export default router;
