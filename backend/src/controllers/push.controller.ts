import { Response } from "express";
import { query } from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";
import { pushDisponible, getClavePublica, enviarPush } from "../services/push.service";

/**
 * GET /clave-publica — la app la necesita para suscribirse.
 * Devuelve disponible:false si el servidor no tiene claves VAPID, para que
 * el frontend esconda la opción en vez de ofrecer algo que no va a andar.
 */
export const getClavePublicaPush = async (_req: AuthRequest, res: Response) => {
  res.json({ disponible: pushDisponible(), clave: getClavePublica() || null });
};

/** POST /suscribir — registra este navegador. */
export const suscribirPush = async (req: AuthRequest, res: Response) => {
  try {
    const { endpoint, keys } = req.body ?? {};

    if (!endpoint || typeof endpoint !== "string" || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: "Datos de suscripción incompletos." });
    }

    // El endpoint es único por dispositivo. Si el mismo navegador se
    // vuelve a suscribir (pasa al renovarse la suscripción), se actualizan
    // las claves en vez de crear un duplicado, y se reactiva si estaba
    // marcada como caída.
    await query(
      `INSERT INTO suscripciones_push (usuario_id, endpoint, p256dh, auth, user_agent)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (endpoint) DO UPDATE
         SET usuario_id = EXCLUDED.usuario_id,
             p256dh     = EXCLUDED.p256dh,
             auth       = EXCLUDED.auth,
             user_agent = EXCLUDED.user_agent,
             activa     = TRUE,
             ultimo_error = NULL`,
      [
        req.user.id,
        endpoint,
        keys.p256dh,
        keys.auth,
        (req.headers["user-agent"] ?? "").toString().slice(0, 300),
      ],
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error en suscribirPush:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/** DELETE /suscribir — el usuario apaga las notificaciones en este equipo. */
export const desuscribirPush = async (req: AuthRequest, res: Response) => {
  try {
    const { endpoint } = req.body ?? {};
    if (!endpoint) {
      return res.status(400).json({ error: "Falta el endpoint." });
    }
    await query(
      "DELETE FROM suscripciones_push WHERE endpoint = $1 AND usuario_id = $2",
      [endpoint, req.user.id],
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error en desuscribirPush:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * POST /probar — manda una notificación de prueba al propio usuario.
 * Sin esto, activar el permiso es un acto de fe: no hay forma de saber si
 * quedó bien hasta que pasa algo real días después.
 */
export const probarPush = async (req: AuthRequest, res: Response) => {
  try {
    if (!pushDisponible()) {
      return res.status(503).json({ error: "Las notificaciones no están disponibles en este momento." });
    }
    const enviados = await enviarPush(req.user.id, {
      titulo: "Baby Care",
      cuerpo: "Las notificaciones quedaron activadas. Te avisaremos de vacunas y controles.",
      url: "/dashboard",
      tag: "prueba",
    });

    if (enviados === 0) {
      return res.status(404).json({ error: "No encontramos dispositivos activos para tu cuenta." });
    }
    res.json({ success: true, enviados });
  } catch (error) {
    console.error("Error en probarPush:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
