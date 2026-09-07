/**
 * Las notificaciones (vacunas atrasadas/próximas, citas próximas,
 * artículo recomendado) se calculan al vuelo en el backend cada vez que
 * se pide el dashboard, no viven en una tabla propia. Por eso "marcar
 * como leída" no es un PATCH al backend: se guarda localmente, por
 * bebé, la lista de ids de notificación ya revisados.
 *
 * Se usa tanto desde el dropdown de la campanita (TopNav) como desde el
 * bloque "Lo que se viene" del Dashboard, así que vive acá para que
 * ambos compartan exactamente la misma lógica y se mantengan en
 * sincronía en la misma pestaña (vía el evento personalizado).
 */

const EVENTO_NOTIF_LEIDA = "babycare:notif-leida";

const clavePersistencia = (bebeId: string) => `notifs_leidas_${bebeId}`;

/** Id estable de una notificación. El backend ya manda `id`; si por
    algún motivo faltara (dato viejo en caché, etc.), se arma uno a
    partir de campos que no deberían cambiar entre refrescos. */
export function claveNotif(n: any): string {
  if (n?.id) return String(n.id);
  return `${n?.tipo ?? "notif"}_${n?.titulo ?? ""}`;
}

export function cargarNotifsLeidas(bebeId: string | null | undefined): Set<string> {
  if (!bebeId || typeof window === "undefined") return new Set();
  try {
    const crudo = localStorage.getItem(clavePersistencia(bebeId));
    if (!crudo) return new Set();
    return new Set(JSON.parse(crudo));
  } catch {
    return new Set();
  }
}

/** Marca una notificación como leída: persiste en localStorage y avisa
    a cualquier otro componente montado en la misma página (por ejemplo
    TopNav, si quien marcó fue el Dashboard) para que actualice su
    contador sin necesidad de recargar. */
export function marcarNotifLeida(bebeId: string | null | undefined, notif: any) {
  if (!bebeId || typeof window === "undefined") return;
  const clave = claveNotif(notif);
  const actuales = cargarNotifsLeidas(bebeId);
  if (actuales.has(clave)) return;
  actuales.add(clave);
  localStorage.setItem(clavePersistencia(bebeId), JSON.stringify(Array.from(actuales)));
  window.dispatchEvent(new CustomEvent(EVENTO_NOTIF_LEIDA, { detail: { bebeId, clave } }));
}

/** Suscribirse a cambios (de cualquier componente, en la misma pestaña). */
export function onNotifLeida(cb: (detail: { bebeId: string; clave: string }) => void) {
  const handler = (e: Event) => cb((e as CustomEvent).detail);
  window.addEventListener(EVENTO_NOTIF_LEIDA, handler);
  return () => window.removeEventListener(EVENTO_NOTIF_LEIDA, handler);
}
