import { Router } from "express";
import {
  getOMSData,
  getOMSStats,
  createOMSData,
  updateOMSData,
  deleteOMSData,
} from "./oms.service";
import { requireRole } from "../../middlewares/adminAuth.middleware";

const router = Router();

const allowedRoles = ["admin_general", "medico", "auditor"];
const writeRoles = ["admin_general", "medico"];

router.get("/stats", requireRole(allowedRoles), getOMSStats);
router.get("/", requireRole(allowedRoles), getOMSData);
router.post("/", requireRole(writeRoles), createOMSData);
router.put("/:id", requireRole(writeRoles), updateOMSData);
router.delete("/:id", requireRole(writeRoles), deleteOMSData);

export default router;
