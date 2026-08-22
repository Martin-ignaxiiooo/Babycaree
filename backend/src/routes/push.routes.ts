import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import {
  getClavePublicaPush,
  suscribirPush,
  desuscribirPush,
  probarPush,
} from "../controllers/push.controller";

const router = Router();

router.use(verifyToken);

router.get("/clave-publica", getClavePublicaPush);
router.post("/suscribir", suscribirPush);
router.delete("/suscribir", desuscribirPush);
router.post("/probar", probarPush);

export default router;
