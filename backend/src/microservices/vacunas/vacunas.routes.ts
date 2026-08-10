import { Router } from "express";
import {
  getVacunas,
  createVacuna,
  updateVacuna,
  deleteVacuna,
} from "./vacunas.service";
import {
  requireAdmin,
  requireRole,
} from "../../middlewares/adminAuth.middleware";

const router = Router();

router.get("/", requireAdmin, getVacunas);
router.post("/", requireAdmin, requireRole(["admin_general"]), createVacuna);
router.put("/:id", requireAdmin, requireRole(["admin_general"]), updateVacuna);
router.delete(
  "/:id",
  requireAdmin,
  requireRole(["admin_general"]),
  deleteVacuna,
);

export default router;
