import { Router } from "express";
import {
  getComunidadStats,
  getForos,
  getComentarios,
  deleteComentario,
  createAdminComentario,
} from "./comunidad.service";
import { requireRole } from "../../middlewares/adminAuth.middleware";

const router = Router();

const allowedRoles = ["admin_general", "soporte_cliente", "auditor"];
const deleteRoles = ["admin_general", "soporte_cliente"];

router.get("/stats", requireRole(allowedRoles), getComunidadStats);
router.get("/foros", requireRole(allowedRoles), getForos);
router.get("/foros/:foroId/comentarios", requireRole(allowedRoles), getComentarios);
router.post("/foros/:foroId/comentarios", requireRole(deleteRoles), createAdminComentario);
router.delete("/comentarios/:id", requireRole(deleteRoles), deleteComentario);

export default router;
