import { Link, useLocation } from "react-router-dom";
import {
  Users,
  UserCheck,
  Syringe,
  Stethoscope,
  HeartPulse,
  Shield,
  Building2,
  BookOpen,
  FileText,
  LineChart,
  MessageSquare,
} from "lucide-react";
import { useAdminAuth } from "../../hooks/useAdminAuth";

export default function AdminSidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { rol, isAdminGeneral, isAuditor, canManageUsers, canManageDirectorio, canManageArticulos, canManageVacunas, canManageOMS, canManageComunidad } = useAdminAuth();

  const allMenuItems = [
    { name: "Dashboard", path: "/admin/panel", icon: <HeartPulse size={20} /> },
    { name: "Administradores", path: "/admin/administradores", icon: <Shield size={20} />, reqAuditorOrAdmin: true },
    { name: "Usuarios", path: "/admin/usuarios", icon: <Users size={20} />, reqAuditorOrUsers: true },
    { name: "Vacunas", path: "/admin/vacunas", icon: <Syringe size={20} />, reqAdmin: true },
    { name: "Directorio Médico", path: "/admin/medicos", icon: <UserCheck size={20} />, reqDirectorio: true },
    { name: "Especialidades", path: "/admin/especialidades", icon: <Stethoscope size={20} />, reqDirectorio: true },
    { name: "Previsión", path: "/admin/prevision", icon: <Shield size={20} />, reqDirectorio: true },
    { name: "Centros", path: "/admin/centros", icon: <Building2 size={20} />, reqDirectorio: true },
    { name: "Artículos", path: "/admin/articulos", icon: <BookOpen size={20} />, reqArticulos: true },
    { name: "OMS", path: "/admin/oms", icon: <LineChart size={20} />, reqAuditorOrOMS: true },
    { name: "Bitácora", path: "/admin/bitacora", icon: <FileText size={20} />, reqAuditorOrAdmin: true },
    { name: "Comunidad", path: "/admin/comunidad", icon: <MessageSquare size={20} />, reqAuditorOrComunidad: true },
  ];

  const menuItems = allMenuItems.filter(item => {
    if (isAdminGeneral) return true;
    if (item.reqAdmin && !isAdminGeneral) return false;
    if (item.reqAuditorOrAdmin) return isAuditor || isAdminGeneral;
    if (item.reqAuditorOrUsers) return isAuditor || canManageUsers;
    if (item.reqDirectorio) return canManageDirectorio;
    if (item.reqArticulos) return canManageArticulos;
    if (item.reqAuditorOrOMS) return isAuditor || canManageOMS;
    if (item.reqAuditorOrComunidad) return isAuditor || canManageComunidad;
    
    // Default fallback (e.g. Dashboard)
    return true; 
  });

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        Baby Care
        <br />
        <span style={{ fontSize: "0.875rem", fontWeight: 400, opacity: 0.8 }}>
          Panel Interno
        </span>
      </div>
      <ul className="admin-nav-menu mt-4">
        {menuItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`admin-nav-item ${pathname === item.path ? "active" : ""}`}
            >
              {item.icon} {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
