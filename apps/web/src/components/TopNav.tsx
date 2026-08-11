import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, X } from "lucide-react";

interface TopNavProps {
  user: any;
  notificaciones?: any[];
  onLogout?: () => void;
  activePath?: string;
}

export default function TopNav({ user, notificaciones = [], onLogout, activePath = "/dashboard" }: TopNavProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.clear();
      navigate("/");
    }
  };

  const NavLinks = () => (
    <>
      <span 
        style={{ cursor: "pointer", color: activePath.includes("dashboard") ? "var(--theme-light)" : "white" }} 
        onClick={() => { setMobileMenuOpen(false); navigate("/dashboard"); }}
      >
        Inicio
      </span>
      <span 
        style={{ cursor: "pointer", color: activePath.includes("salud") ? "var(--theme-light)" : "white" }} 
        onClick={() => { setMobileMenuOpen(false); navigate("/salud"); }}
      >
        Salud
      </span>
      <span 
        style={{ cursor: "pointer", color: activePath.includes("comunidad") ? "var(--theme-light)" : "white" }} 
        onClick={() => { setMobileMenuOpen(false); navigate("/comunidad"); }}
      >
        Comunidad
      </span>
      <span 
        style={{ cursor: "pointer", color: activePath.includes("directorio") ? "var(--theme-light)" : "white" }} 
        onClick={() => { setMobileMenuOpen(false); navigate("/directorio"); }}
      >
        Directorio
      </span>
      <span 
        style={{ cursor: "pointer", color: activePath.includes("galeria") ? "var(--theme-light)" : "white" }} 
        onClick={() => { setMobileMenuOpen(false); navigate("/galeria"); }}
      >
        Galería
      </span>
    </>
  );

  return (
    <>
      <nav style={{
        width: "100%",
        background: "var(--theme-darker)",
        color: "#fff",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 4px 12px rgba(0,0,0,.15)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button 
            className="nav-hamburger-mobile" 
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div style={{ fontSize: "22px", fontWeight: 800, cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
            Iniciativa<span style={{ color: "var(--theme-light)" }}>Baby</span>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <div className="nav-links-desktop" style={{ fontWeight: 600, fontSize: "15px" }}>
            <NavLinks />
          </div>
          
          <div className="nav-links-desktop" style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.2)", margin: "0 8px" }}></div>
          
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => alert("No tienes nuevas notificaciones")}>
              <Bell size={22} />
              {notificaciones.length > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "#EF4444", width: 10, height: 10, borderRadius: "50%" }}></span>}
            </div>
            <div 
              onClick={() => navigate("/mi-perfil")}
              style={{ 
                width: "36px", height: "36px", borderRadius: "50%", 
                background: "var(--theme-primary)", display: "flex", 
                alignItems: "center", justifyContent: "center", fontWeight: "bold",
                fontSize: "16px", cursor: "pointer", border: "2px solid rgba(255,255,255,0.2)"
              }}>
              {user?.nombre ? user.nombre.charAt(0).toUpperCase() : "U"}
            </div>
            <button className="nav-links-desktop" onClick={handleLogout} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", display: "flex", alignItems: "center" }} title="Cerrar sesión">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%", 
          background: "rgba(0,0,0,0.5)", zIndex: 999,
          display: "flex"
        }}>
          <div style={{
            width: "280px", height: "100%", background: "var(--theme-darker)",
            padding: "20px", display: "flex", flexDirection: "column", gap: "24px",
            color: "white", boxShadow: "4px 0 20px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: 800 }}>Menú</div>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "16px", fontWeight: 600 }}>
              <NavLinks />
            </div>

            <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "16px" }}>
              <button onClick={handleLogout} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "16px" }}>
                <LogOut size={20} /> Cerrar Sesión
              </button>
            </div>
          </div>
          <div style={{ flex: 1 }} onClick={() => setMobileMenuOpen(false)}></div>
        </div>
      )}
    </>
  );
}
