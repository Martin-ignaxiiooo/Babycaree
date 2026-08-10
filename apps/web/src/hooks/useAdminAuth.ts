import { useMemo } from "react";

export function useAdminAuth() {
  const adminData = useMemo(() => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) return null;

      const base64Url = token.split(".")[1];
      if (!base64Url) return null;

      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Error decoding token", e);
      return null;
    }
  }, []);

  const rol = adminData?.rol || null;

  return {
    adminData,
    rol,
    isAdminGeneral: rol === "admin_general",
    isAuditor: rol === "auditor",
    canManageUsers: rol === "admin_general" || rol === "soporte_cliente",
    canManageDirectorio: rol === "admin_general" || rol === "editor_contenido",
    canManageArticulos: rol === "admin_general" || rol === "editor_contenido",
    canManageVacunas: rol === "admin_general",
    canManageOMS: rol === "admin_general" || rol === "medico", // si existe el rol medico
    canManageComunidad: rol === "admin_general" || rol === "soporte_cliente",
  };
}
