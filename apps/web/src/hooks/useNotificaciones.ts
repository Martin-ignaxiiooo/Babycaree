import { useCallback, useEffect, useState } from "react";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

/**
 * Gestiona el permiso y la suscripción a notificaciones push.
 *
 * Los avisos de vacunas, citas y exámenes ya salen por correo. El push se
 * suma porque el correo se pierde entre el resto; no lo reemplaza.
 *
 * Limitaciones que la interfaz debe poder explicar:
 *  - En iOS solo funciona si el usuario instaló la PWA en su pantalla de
 *    inicio: Safari no permite push desde una pestaña normal.
 *  - Si el usuario bloqueó el permiso, el navegador no vuelve a
 *    preguntar; hay que ir a los ajustes del sitio.
 */

/** La clave VAPID viaja en base64url y hay que pasarla a bytes. */
function base64UrlABytes(base64: string): ArrayBuffer {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const normal = (base64 + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const crudo = atob(normal);
  // Se devuelve el ArrayBuffer y no el Uint8Array: los tipos recientes de
  // TS distinguen ArrayBuffer de SharedArrayBuffer, y pushManager.subscribe
  // solo acepta el primero.
  const buffer = new ArrayBuffer(crudo.length);
  const vista = new Uint8Array(buffer);
  for (let i = 0; i < crudo.length; i++) vista[i] = crudo.charCodeAt(i);
  return buffer;
}

/** iOS solo entrega push a una PWA instalada, no a una pestaña de Safari. */
function esIOSSinInstalar(): boolean {
  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (!esIOS) return false;
  const instalada =
    (window.navigator as any).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches;
  return !instalada;
}

export type EstadoPush =
  | "cargando"
  | "no_soportado"      // el navegador no tiene push
  | "requiere_instalar" // iOS sin la PWA instalada
  | "no_disponible"     // el servidor no tiene claves VAPID
  | "bloqueado"         // el usuario denegó el permiso
  | "inactivo"          // se puede activar
  | "activo";

export function useNotificaciones() {
  const [estado, setEstado] = useState<EstadoPush>("cargando");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = () => localStorage.getItem("token");

  const revisar = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setEstado("no_soportado");
      return;
    }
    if (esIOSSinInstalar()) {
      setEstado("requiere_instalar");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/v1/push/clave-publica`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (!data.disponible || !data.clave) {
        setEstado("no_disponible");
        return;
      }

      if (Notification.permission === "denied") {
        setEstado("bloqueado");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setEstado(sub ? "activo" : "inactivo");
    } catch {
      setEstado("no_disponible");
    }
  }, []);

  useEffect(() => { revisar(); }, [revisar]);

  const activar = useCallback(async () => {
    setProcesando(true);
    setError(null);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "bloqueado" : "inactivo");
        return;
      }

      const claveRes = await fetch(`${API_URL}/v1/push/clave-publica`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const { clave } = await claveRes.json();
      if (!clave) throw new Error("El servidor no tiene configuradas las notificaciones.");

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlABytes(clave),
      });

      const guardar = await fetch(`${API_URL}/v1/push/suscribir`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!guardar.ok) throw new Error("No se pudo guardar la suscripción.");

      setEstado("activo");

      // Un aviso de prueba: si no, activar el permiso es un acto de fe
      // hasta que ocurra algo real días después.
      fetch(`${API_URL}/v1/push/probar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
      }).catch(() => {});
    } catch (e: any) {
      setError(e?.message ?? "No pudimos activar las notificaciones.");
    } finally {
      setProcesando(false);
    }
  }, []);

  const desactivar = useCallback(async () => {
    setProcesando(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(`${API_URL}/v1/push/suscribir`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {});
        await sub.unsubscribe();
      }
      setEstado("inactivo");
    } catch {
      setError("No pudimos desactivar las notificaciones.");
    } finally {
      setProcesando(false);
    }
  }, []);

  return { estado, procesando, error, activar, desactivar };
}
