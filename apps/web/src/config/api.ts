/**
 * URL base del backend.
 *
 * Antes esta URL estaba escrita a mano en más de 100 lugares del
 * frontend, lo que hacía imposible apuntar a un backend local para
 * desarrollo (siempre se hablaba con producción) y convertía cualquier
 * cambio de dominio en una edición masiva.
 *
 * El valor por defecto es la URL de producción actual: si no se define
 * VITE_API_URL, todo sigue funcionando exactamente como antes.
 *
 * Para apuntar a otro backend, crear un archivo .env.local en apps/web
 * (está en .gitignore) con:
 *   VITE_API_URL=http://localhost:3000/api
 */
export const API_URL =
  import.meta.env.VITE_API_URL ?? "https://babycare-backend-msyq.onrender.com/api";
