import { useEffect, useState } from "react";
import { API_URL } from "../config/api";

/**
 * Devuelve el usuario de la sesión, manteniéndolo al día.
 *
 * Antes cada página leía localStorage directamente. Eso guarda lo que devolvió
 * el login y no se vuelve a pedir nunca, así que un cambio hecho desde otro
 * dispositivo (o desde la app móvil) no se veía acá hasta cerrar y abrir
 * sesión. La app móvil ya resuelve esto pidiendo el perfil en cada carga; este
 * hook hace lo mismo en la web.
 *
 * Funciona en tres tiempos:
 *  1. Devuelve de inmediato lo guardado, para no dejar la pantalla en blanco.
 *  2. Pide el perfil al backend y lo actualiza si cambió.
 *  3. Escucha el evento "storage", que dispara Mi Perfil al guardar y que
 *     además llega solo cuando el cambio ocurre en otra pestaña del navegador.
 */
export function useUsuario() {
  const [usuario, setUsuario] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const leerGuardado = () => {
      try {
        setUsuario(JSON.parse(localStorage.getItem("user") || "{}"));
      } catch {
        /* dato corrupto: se conserva el que ya está en memoria */
      }
    };

    const refrescar = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/profiles/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return; // un 401 ya lo maneja el flujo de sesión
        const datos = await res.json();
        localStorage.setItem("user", JSON.stringify(datos));
        setUsuario(datos);
      } catch {
        /* sin conexión: se sigue usando lo guardado */
      }
    };

    refrescar();
    window.addEventListener("storage", leerGuardado);
    return () => window.removeEventListener("storage", leerGuardado);
  }, []);

  return usuario;
}
