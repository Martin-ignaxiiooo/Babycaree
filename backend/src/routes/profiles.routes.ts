import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import {
  getMe,
  updateMe,
  updatePassword,
  createBabyProfile,
  getMyBabies,
  deleteBabyProfile,
} from "../controllers/profiles.controller";

const router = Router();

// Antes existía una ruta pública GET /public/:id que devolvía nombre,
// fecha de nacimiento y el calendario completo de vacunas de cualquier
// bebé sin requerir sesión, usando directamente su UUID interno (que se
// usa en muchas otras partes de la app, así que era fácil que se filtrara
// por accidente). No la usaba ninguna pantalla del frontend, así que se
// elimina en vez de dejar esa exposición sin necesidad. Si en el futuro se
// necesita compartir un perfil públicamente (ej. QR para un pediatra), hay
// que implementarlo con un token dedicado y revocable (la tabla
// accesos_compartidos_bebe ya tiene columnas token_qr_hash/es_qr_temporal
// pensadas para eso), no con el ID real del perfil.

// Rutas Protegidas
router.use(verifyToken);

router.get("/me", getMe);
router.patch("/me", updateMe);
router.patch("/me/password", updatePassword);
router.post("/babies", createBabyProfile);
router.get("/babies", getMyBabies);
router.delete("/babies/:id", deleteBabyProfile);

export default router;
