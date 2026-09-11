import { Router } from "express";
import { getInvitacion, aceptarInvitacion } from "../controllers/invitaciones.controller";

const router = Router();

// Rutas públicas a propósito: quien llega acá viene desde el enlace del
// correo y todavía no tiene cuenta (o no ha iniciado sesión). El token
// de la invitación es la credencial.
router.get("/:token", getInvitacion);
router.post("/:token/aceptar", aceptarInvitacion);

export default router;
