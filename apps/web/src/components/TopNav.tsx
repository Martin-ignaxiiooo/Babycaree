import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Bell, LogOut, Menu, X, ChevronDown, Baby, Check, Plus, Sparkles } from "lucide-react";

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
  const [notifOpen, setNotifOpen] = useState(false);
  // Solo el Dashboard le pasaba notificaciones al TopNav; en el resto de las
  // pantallas la campana salía siempre vacía aunque hubiera citas próximas.
  // Si no vienen por props, se cargan acá para que funcione en toda la app.
  const [notifPropias, setNotifPropias] = useState<any[]>([]);
  const switcherRef = useRef<HTMLDivElement>(null);
  const activeBabyId = typeof window !== "undefined" ? localStorage.getItem("selectedBabyId") : null;

  const notifs = notificaciones.length > 0 ? notificaciones : notifPropias;

  // Para perfiles de embarazo, mostrar "Embarazo de X" en vez del nombre a
  // secas, para no confundirlos con un bebé ya nacido en listas donde
  // aparecen mezclados.
  const nombreVisible = (baby: any) => baby.estado === "embarazo" ? `Embarazo de ${baby.nombre}` : baby.nombre;

  const fetchBabies = () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios
      .get(`${API_URL}/profiles/babies`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setBabies(res.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchBabies();
  }, []);

  useEffect(() => {
    // Si la página ya nos pasó notificaciones (Dashboard), no se pide de nuevo.
    if (notificaciones.length > 0) return;
    const token = localStorage.getItem("token");
    if (!token || !activeBabyId) return;
    axios
      .get(`${API_URL}/v1/home/${activeBabyId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setNotifPropias(res.data?.notificaciones ?? []))
      .catch(() => {});
  }, [activeBabyId, notificaciones.length]);

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

  const NavLinks = ({ pill = false }: { pill?: boolean }) => {
    const items = [
      { label: "Inicio", path: "/dashboard", match: "dashboard" },
      // El calendario es propio del seguimiento de embarazo: en un perfil de
      // bebé nacido las citas se ven desde Salud y no hace falta duplicarlo.
      ...(perfilEstado === "embarazo" ? [
        { label: "Calendario", path: "/calendario", match: "calendario" },
      ] : []),
      { label: "Salud", path: "/salud", match: "salud" },
      { label: "Comunidad", path: "/comunidad", match: "comunidad" },
      ...(perfilEstado !== "embarazo" ? [
        { label: "Directorio", path: "/directorio", match: "directorio" },
        { label: "Galería", path: "/galeria", match: "galeria" },
      ] : []),
    ];
    return (
      <>
        {items.map((item) => {
          const active = activePath.includes(item.match);
          return (
            <span
              key={item.path}
              onClick={() => { setMobileMenuOpen(false); navigate(item.path); }}
              style={pill ? {
                cursor: "pointer",
                padding: "9px 16px",
                borderRadius: "100px",
                background: active ? "rgba(255,255,255,0.16)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.72)",
                transition: "background 0.18s, color 0.18s",
              } : {
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: "10px",
                padding: "11px 12px", borderRadius: "12px",
                background: active ? "rgba(255,255,255,0.1)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.75)",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              {item.label}
            </span>
          );
        })}
      </>
    );
  };

  return (
    <>
      <nav style={{
        width: "100%",
        background: "linear-gradient(100deg, var(--theme-darker) 0%, #3A2E5C 55%, var(--theme-dark) 100%)",
        color: "#fff",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 4px 20px rgba(45,38,64,0.25)",
        fontFamily: "'Nunito', sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            className="nav-hamburger-mobile"
            onClick={() => { fetchBabies(); setMobileMenuOpen(true); }}
            style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "10px", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}
          >
            <Menu size={20} />
          </button>

          <div
            style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
            onClick={() => navigate("/dashboard")}
          >
            <div style={{
              width: "34px", height: "34px", borderRadius: "10px",
              background: "linear-gradient(135deg, var(--accent-coral), var(--theme-light))",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 3px 10px rgba(255,143,163,0.35)", flexShrink: 0,
            }}>
              <Sparkles size={17} color="#fff" fill="#fff" />
            </div>
            <div style={{ fontFamily: "'Baloo 2', 'Nunito', sans-serif", fontSize: "21px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Baby<span style={{ color: "var(--accent-coral)" }}>Care</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <div className="nav-links-desktop" style={{ fontWeight: 700, fontSize: "14.5px", display: "flex", gap: "2px" }}>
            <NavLinks pill />
          </div>

          <div className="nav-links-desktop" style={{ width: "1px", height: "26px", background: "rgba(255,255,255,0.15)", margin: "0 4px" }}></div>

          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            {babies.length > 1 && (
              <div ref={switcherRef} style={{ position: "relative" }} className="nav-links-desktop">
                <button
                  onClick={() => { setSwitcherOpen((v) => { if (!v) fetchBabies(); return !v; }); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "7px",
                    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.16)",
                    borderRadius: "100px", padding: "7px 14px 7px 7px", cursor: "pointer",
                    color: "white", fontSize: "13px", fontWeight: 700,
                    fontFamily: "'Nunito', sans-serif",
                  }}
                  title="Cambiar de perfil"
                >
                  <span style={{
                    width: "22px", height: "22px", borderRadius: "50%", overflow: "hidden",
                    background: "var(--accent-coral-light)", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--text)", fontSize: "11px", fontWeight: 800, flexShrink: 0,
                  }}>
                    {(() => {
                      const activeBaby = babies.find((b) => b.id === activeBabyId);
                      return activeBaby?.foto_perfil ? (
                        <img src={activeBaby.foto_perfil} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : <Baby size={12} />;
                    })()}
                  </span>
                  {(() => {
                    const activeBaby = babies.find((b) => b.id === activeBabyId);
                    return activeBaby ? nombreVisible(activeBaby) : "Cambiar";
                  })()}
                  <ChevronDown size={13} style={{ transform: switcherOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>

                {switcherOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 12px)", right: 0,
                    background: "white", borderRadius: "20px", boxShadow: "0 16px 40px rgba(45,38,64,0.22)",
                    minWidth: "240px", overflow: "hidden", zIndex: 200,
                    border: "1px solid rgba(124,92,191,0.08)",
                  }}>
                    <div style={{ padding: "14px 18px 8px", fontSize: "11px", fontWeight: 800, color: "#A399B5", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Tus perfiles
                    </div>
                    {babies.map((baby) => (
                      <div
                        key={baby.id}
                        onClick={() => handleSwitchBaby(baby.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: "11px",
                          padding: "10px 18px", cursor: "pointer",
                          background: baby.id === activeBabyId ? "var(--theme-bg-light)" : "white",
                        }}
                        onMouseEnter={(e) => { if (baby.id !== activeBabyId) e.currentTarget.style.background = "#FAF9FD"; }}
                        onMouseLeave={(e) => { if (baby.id !== activeBabyId) e.currentTarget.style.background = "white"; }}
                      >
                        <div style={{
                          width: "34px", height: "34px", borderRadius: "50%",
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
                        <span style={{ flex: 1, fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
                          {nombreVisible(baby)}
                        </span>
                        {baby.id === activeBabyId && <Check size={16} color="var(--theme-primary)" />}
                      </div>
                    ))}
                    <div
                      onClick={() => { setSwitcherOpen(false); navigate("/seleccionar-perfil"); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "13px 18px", cursor: "pointer",
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
            <div style={{ position: "relative" }}>
              <div
                style={{ position: "relative", cursor: "pointer", width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={() => setNotifOpen((v) => !v)}
                title={notifs.length > 0 ? `${notifs.length} pendiente(s)` : "Sin notificaciones"}
              >
                <Bell size={19} />
                {notifs.length > 0 && (
                  <span style={{
                    position: "absolute", top: -4, right: -4, background: "var(--accent-coral)",
                    minWidth: 18, height: 18, borderRadius: 9, border: "2px solid var(--theme-darker)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "10.5px", fontWeight: 900, color: "#fff", padding: "0 4px",
                  }}>
                    {notifs.length > 9 ? "9+" : notifs.length}
                  </span>
                )}
              </div>

              {notifOpen && (
                <>
                  {/* Capa para cerrar al hacer click afuera */}
                  <div
                    onClick={() => setNotifOpen(false)}
                    style={{ position: "fixed", inset: 0, zIndex: 40 }}
                  />
                  <div style={{
                    position: "absolute", top: "46px", right: 0, width: "300px", zIndex: 50,
                    background: "var(--surface)", borderRadius: "16px", overflow: "hidden",
                    boxShadow: "0 12px 32px rgba(45,38,64,0.22)", color: "var(--text)",
                  }}>
                    <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--border-soft)", fontWeight: 800, fontSize: "14px" }}>
                      Notificaciones
                    </div>
                    {notifs.length === 0 ? (
                      <div style={{ padding: "22px 16px", fontSize: "13.5px", color: "var(--text-muted)", textAlign: "center" }}>
                        No tienes pendientes por ahora.
                      </div>
                    ) : (
                      <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                        {notifs.map((n, i) => (
                          <div key={i} style={{ padding: "12px 16px", borderBottom: i < notifs.length - 1 ? "1px solid #F5F2FC" : "none" }}>
                            <div style={{ fontWeight: 700, fontSize: "13.5px" }}>
                              {n.titulo ?? n.tipo ?? "Recordatorio"}
                            </div>
                            {n.mensaje && (
                              <div style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "2px", lineHeight: 1.45 }}>
                                {n.mensaje}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div
              onClick={() => navigate("/mi-perfil")}
              style={{
                width: "38px", height: "38px", borderRadius: "50%",
                background: "linear-gradient(135deg, var(--theme-light), var(--accent-coral))",
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800,
                fontSize: "15px", cursor: "pointer", boxShadow: "0 0 0 2px rgba(255,255,255,0.25)",
                fontFamily: "'Baloo 2', sans-serif",
              }}>
              {user?.nombre ? user.nombre.charAt(0).toUpperCase() : "U"}
            </div>
            <button className="nav-links-desktop" onClick={handleLogout} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.65)", cursor: "pointer", display: "flex", alignItems: "center" }} title="Cerrar sesión">
              <LogOut size={19} />
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(45,38,64,0.55)", zIndex: 999,
          display: "flex", backdropFilter: "blur(2px)",
        }}>
          <div style={{
            width: "290px", height: "100%",
            background: "linear-gradient(165deg, var(--theme-darker) 0%, #3A2E5C 100%)",
            padding: "22px", display: "flex", flexDirection: "column", gap: "22px",
            color: "white", boxShadow: "4px 0 30px rgba(0,0,0,0.25)",
            fontFamily: "'Nunito', sans-serif",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "30px", height: "30px", borderRadius: "9px",
                  background: "linear-gradient(135deg, var(--accent-coral), var(--theme-light))",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Sparkles size={15} color="#fff" fill="#fff" />
                </div>
                <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "19px", fontWeight: 700 }}>
                  Baby<span style={{ color: "var(--accent-coral)" }}>Care</span>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "8px", width: "32px", height: "32px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "15.5px", fontWeight: 700 }}>
              <NavLinks />
            </div>

            {babies.length > 1 && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "18px" }}>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                  Tus perfiles
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {babies.map((baby) => (
                    <div
                      key={baby.id}
                      onClick={() => { setMobileMenuOpen(false); handleSwitchBaby(baby.id); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "11px",
                        padding: "10px 10px", borderRadius: "12px", cursor: "pointer",
                        background: baby.id === activeBabyId ? "rgba(255,255,255,0.1)" : "transparent",
                      }}
                    >
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--theme-light), var(--accent-coral))", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: "13px", flexShrink: 0, overflow: "hidden",
                      }}>
                        {baby.foto_perfil ? (
                          <img src={baby.foto_perfil} alt={baby.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          baby.nombre?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span style={{ flex: 1, fontSize: "15px" }}>{nombreVisible(baby)}</span>
                      {baby.id === activeBabyId && <Check size={16} />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "18px" }}>
              <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "12px", color: "rgba(255,255,255,0.8)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", fontWeight: 700, padding: "12px 14px", width: "100%" }}>
                <LogOut size={18} /> Cerrar sesión
              </button>
            </div>
          </div>
          <div style={{ flex: 1 }} onClick={() => setMobileMenuOpen(false)}></div>
        </div>
      )}
    </>
  );
}
