import { Router } from "express";
import {
  getArticulos,
  getArticulosStats,
  createArticulo,
  updateArticulo,
  deleteArticulo,
} from "./articulos.service";
import { requireRole } from "../../middlewares/adminAuth.middleware";

const router = Router();

const allowedRoles = ["admin_general", "editor_contenido"];

router.get("/stats", getArticulosStats);
router.get("/", getArticulos);
router.post("/", requireRole(allowedRoles), createArticulo);
router.put("/:id", requireRole(allowedRoles), updateArticulo);
router.delete("/:id", requireRole(allowedRoles), deleteArticulo);

export default router;
