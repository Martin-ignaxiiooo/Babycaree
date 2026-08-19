import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Bell, LogOut, Menu, X, ChevronDown, Baby, Check, Plus } from "lucide-react";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

interface TopNavProps {
  user: any;
  notificaciones?: any[];
  onLogout?: () => void;
  activePath?: string;
  perfilEstado?: string;
}

export default function TopNav({ user, notificaciones = [], onLogout, activePath = "/dashboard", perfilEstado }: TopNavProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [babies, setBabies] = useState<any[]>([]);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const activeBabyId = typeof window !== "undefined" ? localStorage.getItem("selectedBabyId") : null;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios
      .get(`${API_URL}/profiles/babies`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setBabies(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitchBaby = (babyId: string) => {
    if (babyId === activeBabyId) {
      setSwitcherOpen(false);
      return;
    }
    localStorage.setItem("selectedBabyId", babyId);
    setSwitcherOpen(false);
    // Recarga completa para que todas las paginas (Dashboard, Salud, etc.)
    // vuelvan a pedir los datos del nuevo bebe desde cero.
    window.location.href = "/dashboard";
  };

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
      {perfilEstado !== "embarazo" && (
        <>
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
      )}
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
            {babies.length > 1 && (
              <div ref={switcherRef} style={{ position: "relative" }} className="nav-links-desktop">
                <button
                  onClick={() => setSwitcherOpen((v) => !v)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "100px", padding: "7px 12px", cursor: "pointer",
                    color: "white", fontSize: "13px", fontWeight: 700,
                    fontFamily: "'Nunito', sans-serif",
                  }}
                  title="Cambiar de perfil"
                >
                  <Baby size={16} />
                  {babies.find((b) => b.id === activeBabyId)?.nombre || "Cambiar"}
                  <ChevronDown size={14} style={{ transform: switcherOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>

                {switcherOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 10px)", right: 0,
                    background: "white", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                    minWidth: "220px", overflow: "hidden", zIndex: 200,
                  }}>
                    <div style={{ padding: "12px 16px 8px", fontSize: "11px", fontWeight: 800, color: "#8A849C", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Tus perfiles
                    </div>
                    {babies.map((baby) => (
                      <div
                        key={baby.id}
                        onClick={() => handleSwitchBaby(baby.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: "10px",
                          padding: "10px 16px", cursor: "pointer",
                          background: baby.id === activeBabyId ? "var(--theme-bg-light)" : "white",
                        }}
                        onMouseEnter={(e) => { if (baby.id !== activeBabyId) e.currentTarget.style.background = "#F8F7FC"; }}
                        onMouseLeave={(e) => { if (baby.id !== activeBabyId) e.currentTarget.style.background = "white"; }}
                      >
                        <div style={{
                          width: "32px", height: "32px", borderRadius: "50%",
                          background: "var(--theme-bg-light)", color: "var(--theme-primary)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 800, fontSize: "14px", flexShrink: 0, overflow: "hidden",
                        }}>
                          {baby.foto_perfil ? (
                            <img src={baby.foto_perfil} alt={baby.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            baby.nombre?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span style={{ flex: 1, fontSize: "14px", fontWeight: 700, color: "var(--theme-darker)" }}>
                          {baby.nombre}
                        </span>
                        {baby.id === activeBabyId && <Check size={16} color="var(--theme-primary)" />}
                      </div>
                    ))}
                    <div
                      onClick={() => { setSwitcherOpen(false); navigate("/seleccionar-perfil"); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "12px 16px", cursor: "pointer",
                        borderTop: "1px solid var(--theme-bg-light)",
                        color: "var(--theme-primary)", fontSize: "14px", fontWeight: 700,
                      }}
                    >
                      <Plus size={16} /> Gestionar perfiles
                    </div>
                  </div>
                )}
              </div>
            )}
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

            {babies.length > 1 && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
                  Tus perfiles
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {babies.map((baby) => (
                    <div
                      key={baby.id}
                      onClick={() => { setMobileMenuOpen(false); handleSwitchBaby(baby.id); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "10px 8px", borderRadius: "10px", cursor: "pointer",
                        background: baby.id === activeBabyId ? "rgba(255,255,255,0.1)" : "transparent",
                      }}
                    >
                      <div style={{
                        width: "30px", height: "30px", borderRadius: "50%",
                        background: "var(--theme-primary)", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: "13px", flexShrink: 0, overflow: "hidden",
                      }}>
                        {baby.foto_perfil ? (
                          <img src={baby.foto_perfil} alt={baby.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          baby.nombre?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span style={{ flex: 1, fontSize: "15px" }}>{baby.nombre}</span>
                      {baby.id === activeBabyId && <Check size={16} />}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
