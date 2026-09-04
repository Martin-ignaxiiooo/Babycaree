import webpush from "web-push";
import { query } from "../config/db";

/**
 * Notificaciones push (Web Push con VAPID).
 *
 * POR QUÉ ADEMÁS DEL CORREO
 * Los recordatorios de vacunas y citas ya se mandan por mail, pero el
 * correo se pierde entre el resto. Una notificación en el teléfono se ve.
 * El correo se mantiene: no todos aceptan el permiso, y en iOS solo
 * funciona si instalaron la PWA en la pantalla de inicio.
 *
 * CONFIGURACIÓN
 * Requiere VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY en el entorno. Se generan
 * una sola vez con:
 *     npx web-push generate-vapid-keys
 * Si no están, la app funciona igual y solo se registra un aviso: push
 * queda desactivado, no roto.
 *
 * ⚠️ Si se cambian las claves, TODAS las suscripciones existentes dejan de
 * funcionar y cada usuario tiene que volver a aceptar el permiso.
 */

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const CONTACTO = process.env.VAPID_SUBJECT || "mailto:babyyycareee@gmail.com";

let configurado = false;

if (PUBLIC_KEY && PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(CONTACTO, PUBLIC_KEY, PRIVATE_KEY);
    configurado = true;
  } catch (error) {
    console.error("[push] Las claves VAPID no son válidas:", error);
  }
} else {
  console.log("[push] Sin claves VAPID: las notificaciones push están desactivadas.");
}

export const pushDisponible = (): boolean => configurado;
export const getClavePublica = (): string => PUBLIC_KEY;

export interface Aviso {
  titulo: string;
  cuerpo: string;
  /** Ruta de la app a abrir al tocar la notificación. */
  url?: string;
  /** Agrupa avisos del mismo tema: uno nuevo reemplaza al anterior en vez
   *  de apilarse. Evita cinco notificaciones de la misma vacuna. */
  tag?: string;
}

/**
 * Envía un aviso a todos los dispositivos activos de un usuario.
 * Devuelve cuántos llegaron.
 */
export async function enviarPush(usuarioId: string, aviso: Aviso): Promise<number> {
  if (!configurado) return 0;

  const subsRes = await query(
    `SELECT id, endpoint, p256dh, auth FROM suscripciones_push
     WHERE usuario_id = $1 AND activa = TRUE`,
    [usuarioId],
  );

  if (subsRes.rows.length === 0) return 0;

  const payload = JSON.stringify({
    titulo: aviso.titulo,
    cuerpo: aviso.cuerpo,
    url: aviso.url ?? "/dashboard",
    tag: aviso.tag,
  });

  let enviados = 0;

  await Promise.all(
    subsRes.rows.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        enviados++;
        await query("UPDATE suscripciones_push SET ultimo_envio = NOW() WHERE id = $1", [sub.id]);
      } catch (error: any) {
        const status = error?.statusCode;
        // 404/410 significan que el navegador ya no existe (desinstaló la
        // PWA, limpió datos). Se desactiva para no seguir intentando.
        if (status === 404 || status === 410) {
          await query(
            "UPDATE suscripciones_push SET activa = FALSE, ultimo_error = $2 WHERE id = $1",
            [sub.id, `Suscripción expirada (${status})`],
          );
        } else {
          console.error(`[push] Error enviando a una suscripción (${status}):`, error?.body ?? error?.message);
          await query(
            "UPDATE suscripciones_push SET ultimo_error = $2 WHERE id = $1",
            [sub.id, String(error?.message ?? status ?? "desconocido").slice(0, 300)],
          );
        }
      }
    }),
  );

  return enviados;
}
