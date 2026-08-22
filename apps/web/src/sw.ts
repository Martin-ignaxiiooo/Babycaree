/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

/**
 * Service worker de Baby Care.
 *
 * Usa la estrategia injectManifest (en vez de generateSW) porque hace falta
 * código propio para los eventos push, que un service worker generado
 * automáticamente no incluye.
 */

// Workbox reemplaza esto en el build por la lista real de archivos.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Con autoUpdate, tomar control de inmediato evita que una pestaña vieja
// siga usando una versión anterior del service worker.
self.skipWaiting();
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/** Llega un aviso desde el servidor. */
self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  let datos: any = {};
  try {
    datos = event.data.json();
  } catch {
    // Si el payload no fuera JSON, se muestra el texto crudo antes que
    // descartar el aviso en silencio.
    datos = { titulo: "Baby Care", cuerpo: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(datos.titulo ?? "Baby Care", {
      body: datos.cuerpo ?? "",
      icon: "/pwa-icons/icon-192.png",
      badge: "/pwa-icons/icon-192.png",
      // El tag agrupa: un aviso nuevo del mismo tema reemplaza al anterior
      // en vez de apilar cinco notificaciones de la misma vacuna.
      tag: datos.tag,
      data: { url: datos.url ?? "/dashboard" },
      // Vibración corta: esto puede llegar de madrugada.
      vibrate: [100, 50, 100],
    } as NotificationOptions),
  );
});

/** El usuario toca la notificación. */
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const destino = (event.notification.data?.url as string) ?? "/dashboard";

  event.waitUntil(
    (async () => {
      const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

      // Si la app ya está abierta, se navega en esa pestaña en vez de
      // abrir otra: nadie quiere cinco pestañas de la misma app.
      for (const ventana of ventanas) {
        if ("focus" in ventana) {
          await (ventana as WindowClient).focus();
          await (ventana as WindowClient).navigate(destino).catch(() => {});
          return;
        }
      }
      await self.clients.openWindow(destino);
    })(),
  );
});
