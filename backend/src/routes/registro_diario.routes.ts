import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import {
  getRegistros,
  getResumenDia,
  getEstadisticas,
  createRegistro,
  cerrarSueno,
  deleteRegistro,
} from "../controllers/registro_diario.controller";

const router = Router();

// Todas las rutas del registro diario son protegidas.
router.use(verifyToken);

router.get("/:bebeId/registros", getRegistros);
router.get("/:bebeId/registros/resumen", getResumenDia);
router.get("/:bebeId/registros/estadisticas", getEstadisticas);
router.post("/:bebeId/registros", createRegistro);
router.patch("/:bebeId/registros/:registroId/despertar", cerrarSueno);
router.delete("/:bebeId/registros/:registroId", deleteRegistro);

export default router;
