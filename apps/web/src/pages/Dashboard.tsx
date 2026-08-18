import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Heart, Shield, TrendingUp, Bell, Plus, FileText,
  MessageCircle, Camera, Search, Users, Syringe, Stethoscope, LogOut, X,
  Weight, Ruler, Star, CheckCircle2, Clock, Sparkles, Loader2
} from "lucide-react";
import TopNav from "../components/TopNav";
import DashboardEmbarazo from "./DashboardEmbarazo";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeBabyId, setActiveBabyId] = useState<string | null>(null);
  const [homeData, setHomeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pesoInput, setPesoInput] = useState("");
  const [tallaInput, setTallaInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Foto de perfil del bebé
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoError, setFotoError] = useState("");

  const fetchDashboard = (token: string, babyId: string) => {
    axios.get(`${API_URL}/v1/home/${babyId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setHomeData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      navigate("/");
      return;
    }
    setUser(JSON.parse(storedUser));

    const selectedBabyId = localStorage.getItem("selectedBabyId");
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!selectedBabyId || !uuidRegex.test(selectedBabyId)) {
      localStorage.removeItem("selectedBabyId");
      navigate("/seleccionar-perfil");
      return;
    }
    
    setActiveBabyId(selectedBabyId);
    fetchDashboard(token, selectedBabyId);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleSaveGrowth = async () => {
    if (!pesoInput || !tallaInput || !activeBabyId) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/v1/home/${activeBabyId}/crecimiento`, {
        peso: parseFloat(pesoInput),
        talla: parseFloat(tallaInput)
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setIsModalOpen(false);
      setPesoInput("");
      setTallaInput("");
      
      // Refresh Dashboard data
      if (token) fetchDashboard(token, activeBabyId);
    } catch (error) {
      console.error(error);
      alert("Error al guardar las medidas");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo después
    if (!file || !activeBabyId) return;

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFotoError("Formato no soportado. Usa JPG, PNG, WEBP o GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFotoError("La imagen no puede pesar más de 5MB.");
      return;
    }

    setFotoError("");
    setUploadingFoto(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await axios.post(`${API_URL}/media/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      const fotoUrl = uploadRes.data.url;

      await axios.patch(
        `${API_URL}/v1/perfiles-bebe/${activeBabyId}`,
        { foto_perfil: fotoUrl },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Refrescar el dashboard para traer la nueva foto
      if (token) fetchDashboard(token, activeBabyId);
    } catch (error) {
      console.error(error);
      setFotoError("No se pudo subir la foto. Intenta de nuevo.");
    } finally {
      setUploadingFoto(false);
    }
  };

  if (!user || loading) return <div style={{ padding: "40px", textAlign: "center", fontFamily: "Nunito", fontSize: "18px" }}>Cargando tu panel...</div>;

  // Early return for pregnancy dashboard
  if (homeData?.perfil?.estado === 'embarazo') {
    const notificaciones = homeData?.notificaciones || [];
    return (
      <div style={{ minHeight: "100vh", background: "#F8F7FC", fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column" }}>
        <TopNav user={user} notificaciones={notificaciones} onLogout={handleLogout} activePath="/dashboard" perfilEstado="embarazo" />
        <DashboardEmbarazo user={user} perfil={homeData.perfil} activeBabyId={activeBabyId!} />
      </div>
    );
  }

  const hero = homeData?.hero || { nombre: "Sin perfiles registrados", edad_exacta: "-", peso_kg: "-", talla_cm: "-", percentil: "-" };
  const notificaciones = homeData?.notificaciones || [];
  
  // Growth Chart Calculations
  const seriePeso = homeData?.crecimiento?.serie_peso || [];
  const etiquetasFecha = homeData?.crecimiento?.etiquetas_fecha || [];
  const serieOms = homeData?.crecimiento?.serie_oms || [];
  
  // Create an array of 6 elements max, padded if fewer exist
  const maxPoints = 6;
  const paddingNeeded = maxPoints - seriePeso.length;
  const displayPesos = paddingNeeded > 0 
    ? [...Array(paddingNeeded).fill(null), ...seriePeso] 
    : seriePeso.slice(-6);
    
  const displayFechas = paddingNeeded > 0
    ? [...Array(paddingNeeded).fill(""), ...etiquetasFecha]
    : etiquetasFecha.slice(-6);

  const displayOms = paddingNeeded > 0
    ? [...Array(paddingNeeded).fill(null), ...serieOms]
    : serieOms.slice(-6);

  // SVG Geometry
  const xPositions = [60, 110, 160, 210, 260, 310];
  const mapY = (val: number | null) => {
    if (val === null || val === 0) return null;
    // Map weight from 0kg (y=85) to 15kg (y=10)
    // 15kg range = 75px. 1kg = 5px
    const y = 85 - (val * 5); 
    return Math.max(10, Math.min(85, y));
  };

  let pointsString = "";
  displayPesos.forEach((w: number | null, i: number) => {
    const y = mapY(w);
    if (y !== null) {
      pointsString += `${xPositions[i]},${y} `;
    }
  });

  let omsPointsString = "";
  displayOms.forEach((w: number | null, i: number) => {
    const y = mapY(w);
    if (y !== null) {
      omsPointsString += `${xPositions[i]},${y} `;
    }
  });

  return (

    <div style={{
      minHeight: "100vh",
      background: "#F8F7FC",
      fontFamily: "'Nunito', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      <TopNav user={user} notificaciones={notificaciones} onLogout={handleLogout} activePath="/dashboard" perfilEstado={homeData?.perfil?.estado} />

      <div className="page-container">
        
        {/* ── HOME HERO FULL WIDTH ── */}
        <div style={{
          background: "var(--theme-bg-light)",
          padding: "24px 32px",
          borderRadius: "24px",
          marginBottom: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {/* Foto del bebé (subible por el usuario, blanco por defecto) */}
            <label
              htmlFor="foto-bebe-input"
              style={{
                position: "relative",
                width: "84px",
                height: "84px",
                borderRadius: "20px",
                background: "#fff",
                border: "2px solid rgba(124,92,191,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                cursor: "pointer",
                flexShrink: 0,
              }}
              title="Cambiar foto del bebé"
            >
              {hero.foto_perfil ? (
                <img
                  src={hero.foto_perfil.startsWith("http") ? hero.foto_perfil : `${API_URL.replace(/\/api$/, "")}${hero.foto_perfil}`}
                  alt={hero.nombre}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Camera size={26} color="#C9BEE8" />
              )}

              {uploadingFoto && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(255,255,255,0.85)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Loader2 size={22} color="var(--theme-primary)" className="spin-icon" />
                </div>
              )}

              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "rgba(45,38,64,0.55)", color: "#fff",
                fontSize: "9px", fontWeight: 700, textAlign: "center", padding: "2px 0",
              }}>
                {hero.foto_perfil ? "Cambiar" : "Subir foto"}
              </div>

              <input
                id="foto-bebe-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleUploadFoto}
                disabled={uploadingFoto}
                style={{ display: "none" }}
              />
            </label>

            <div>
              <div style={{ fontSize: "26px", fontWeight: 900, color: "var(--theme-darker)", marginBottom: "4px" }}>{hero.nombre}</div>
              <div style={{ fontSize: "14px", color: "var(--theme-dark)", opacity: 0.75 }}>{hero.edad_exacta}</div>
              {fotoError && (
                <div style={{ fontSize: "12px", color: "#DC2626", marginTop: "4px", fontWeight: 600 }}>{fotoError}</div>
              )}
            </div>
          </div>

          <div className="hero-stats-grid">
            <div style={{ background: "#fff", borderRadius: "16px", padding: "14px 22px", textAlign: "center", minWidth: "100px", boxShadow: "0 4px 14px rgba(45,38,64,0.06)" }}>
              <div style={{
                width: "34px", height: "34px", borderRadius: "10px", background: "var(--theme-bg-light)",
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px"
              }}>
                <Weight size={17} color="var(--theme-primary)" />
              </div>
              <div style={{ fontSize: "12px", color: "#8A849C", fontWeight: 600 }}>Peso</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--theme-darker)" }}>{hero.peso_kg !== "-" && hero.peso_kg !== 0 ? `${hero.peso_kg}kg` : "N/A"}</div>
            </div>
            <div style={{ background: "#fff", borderRadius: "16px", padding: "14px 22px", textAlign: "center", minWidth: "100px", boxShadow: "0 4px 14px rgba(45,38,64,0.06)" }}>
              <div style={{
                width: "34px", height: "34px", borderRadius: "10px", background: "#FFF0F0",
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px"
              }}>
                <Ruler size={17} color="#F4A0A0" />
              </div>
              <div style={{ fontSize: "12px", color: "#8A849C", fontWeight: 600 }}>Altura</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--theme-darker)" }}>{hero.talla_cm !== "-" && hero.talla_cm !== 0 ? `${hero.talla_cm}cm` : "N/A"}</div>
            </div>
            <div style={{ background: "#fff", borderRadius: "16px", padding: "14px 22px", textAlign: "center", minWidth: "100px", boxShadow: "0 4px 14px rgba(45,38,64,0.06)" }}>
              <div style={{
                width: "34px", height: "34px", borderRadius: "10px", background: "#FEF9E7",
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px"
              }}>
                <Star size={17} color="#E8C55A" />
              </div>
              <div style={{ fontSize: "12px", color: "#8A849C", fontWeight: 600 }}>Percentil</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--theme-darker)" }}>P{hero.percentil}</div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes spin-icon-kf { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .spin-icon { animation: spin-icon-kf 0.9s linear infinite; }
        `}</style>

        {/* ── GRID DESKTOP Y MOBILE ── */}
        <div className="responsive-grid">
          
          {/* COLUMNA 1: Notificaciones y Gráfico */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* ── NOTIFICACIONES ── */}
            {notificaciones.length > 0 && (
              <div style={{ background: "#fff", borderRadius: "24px", padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,.04)" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--theme-darker)", marginBottom: "18px" }}>
                  Próximas Tareas
                </h3>

                {notificaciones.map((n: any, idx: number) => {
                  // Estilo tipo checklist: completado / pendiente / próximo
                  const esUrgente = n.prioridad === 'alta';
                  const esProxima = n.prioridad === 'media';
                  const StatusIcon = esUrgente ? Clock : esProxima ? Clock : CheckCircle2;
                  const statusColor = esUrgente ? "#D97706" : esProxima ? "#3B82F6" : "var(--theme-primary)";
                  const statusBg = esUrgente ? "#FEF3C7" : esProxima ? "#EFF6FF" : "var(--theme-bg-light)";
                  const statusLabel = esUrgente ? "Pendiente" : esProxima ? "Próximo" : "Al día";

                  return (
                    <div key={idx}
                      onClick={() => navigate("/salud")}
                      style={{
                        borderRadius: "14px", padding: "14px 16px", marginBottom: "10px",
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", cursor: "pointer",
                        background: statusBg,
                        transition: "transform 0.2s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateX(4px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <StatusIcon size={18} color={statusColor} style={{ flexShrink: 0 }} />
                        <span style={{
                          fontSize: "14px", fontWeight: 700, color: "var(--theme-darker)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                        }}>
                          {n.titulo}
                        </span>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: statusColor, flexShrink: 0 }}>
                        ({statusLabel})
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── GRÁFICO DINÁMICO ── */}
            <div style={{ background: "#fff", borderRadius: "24px", padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--theme-darker)", margin: 0 }}>
                  📈 Evolución de Crecimiento
                </h3>
                {(!homeData?.rol_acceso || !homeData.rol_acceso.startsWith('solo_lectura')) && (
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    style={{
                      background: "var(--theme-primary)", color: "#fff",
                      padding: "8px 16px", borderRadius: "12px", border: "none",
                      fontSize: "13px", fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "6px"
                    }}
                  >
                    <Plus size={16} /> Registrar Medidas
                  </button>
                )}
              </div>
              
              <svg viewBox="0 0 340 120" style={{ width: "100%", height: "auto", overflow: "visible" }}>
                <rect width="340" height="100" fill="#F9FAFB" rx="8"/>
                
                {/* Y Axes Lines */}
                <line x1="40" y1="10" x2="40" y2="85" stroke="#E5E7EB" strokeWidth="0.8"/>
                <line x1="40" y1="85" x2="330" y2="85" stroke="#E5E7EB" strokeWidth="0.8"/>
                <line x1="40" y1="35" x2="330" y2="35" stroke="#F3F4F6" strokeWidth="0.6"/>
                <line x1="40" y1="60" x2="330" y2="60" stroke="#F3F4F6" strokeWidth="0.6"/>
                
                {/* Y Axis Labels (Approx 15kg, 10kg, 5kg scale mapping) */}
                <text x="35" y="13" textAnchor="end" fontSize="8" fill="#9CA3AF">15kg</text>
                <text x="35" y="38" textAnchor="end" fontSize="8" fill="#9CA3AF">10kg</text>
                <text x="35" y="63" textAnchor="end" fontSize="8" fill="#9CA3AF">5kg</text>
                <text x="35" y="88" textAnchor="end" fontSize="8" fill="#9CA3AF">0kg</text>
                
                {/* X Axis Labels (Dates) */}
                {displayFechas.map((fecha, idx) => (
                  <text key={idx} x={xPositions[idx]} y="105" textAnchor="middle" fontSize="9" fill="#9CA3AF" fontWeight="600">
                    {fecha || ""}
                  </text>
                ))}
                
                {/* P50 reference line (Dinámico OMS) */}
                {omsPointsString && (
                  <polyline points={omsPointsString} fill="none" stroke="#E5E7EB" strokeWidth="1.5" strokeDasharray="4,3"/>
                )}
                
                {/* Dynamic Data Line */}
                {pointsString && (
                  <polyline points={pointsString} fill="none" stroke="var(--theme-primary)" strokeWidth="2.5" strokeLinejoin="round"/>
                )}
                
                {/* Dynamic Data Points */}
                {displayPesos.map((w: number | null, i: number) => {
                  const y = mapY(w);
                  if (y === null) return null;
                  return <circle key={i} cx={xPositions[i]} cy={y} r={i === maxPoints - 1 && w !== null ? 4.5 : 3.5} 
                    fill="var(--theme-primary)" stroke={i === maxPoints - 1 ? "#fff" : "none"} strokeWidth={2}/>;
                })}
              </svg>
            </div>
          </div>

          {/* COLUMNA 2: Módulos */}
          <div style={{ background: "#fff", borderRadius: "24px", padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,.04)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--theme-darker)", marginBottom: "20px" }}>
              Módulos
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

              {[
                { icon: FileText, label: "Perfil", bg: "var(--theme-bg-light)", color: "var(--theme-primary)", onClick: () => navigate(`/perfil/${hero.id}`) },
                { icon: Heart, label: "Salud", bg: "#FFF0F0", color: "#F4A0A0", onClick: () => navigate("/salud") },
                { icon: MessageCircle, label: "Comunidad", bg: "#FEF9E7", color: "#E8C55A", onClick: () => navigate("/comunidad") },
                { icon: Camera, label: "Galería", bg: "#E8F0FE", color: "#6B9BF4", onClick: () => navigate("/galeria") },
                { icon: Search, label: "Directorio", bg: "#E8F7F1", color: "#6DBE9E", onClick: () => navigate("/directorio") },
              ].map(({ icon: Icon, label, bg, color, onClick }) => (
                <div key={label} onClick={onClick} style={{ background: "#F9FAFB", padding: "26px 16px", borderRadius: "20px", textAlign: "center", cursor: "pointer", border: "2px solid transparent", transition: "all 0.2s" }}
                     onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = bg; }}
                     onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "#F9FAFB"; }}>
                  <div style={{
                    width: "56px", height: "56px", borderRadius: "16px", background: bg,
                    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px"
                  }}>
                    <Icon size={26} color={color} />
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--theme-darker)" }}>{label}</div>
                </div>
              ))}

            </div>
          </div>
        </div>

      </div>

      {/* ── MODAL REGISTRO CRECIMIENTO ── */}
      {isModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "#fff", padding: "32px", borderRadius: "24px", width: "100%", maxWidth: "400px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--theme-darker)", margin: 0 }}>Registrar Medidas</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={24} color="#6B7280" />
              </button>
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "8px", color: "#4B5563" }}>Peso (kg)</label>
              <input 
                type="number" 
                step="0.01"
                value={pesoInput}
                onChange={e => setPesoInput(e.target.value)}
                placeholder="Ej. 7.4"
                style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #E5E7EB", outline: "none", fontSize: "15px" }}
              />
            </div>

            <div style={{ marginBottom: "32px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "8px", color: "#4B5563" }}>Talla (cm)</label>
              <input 
                type="number" 
                step="0.1"
                value={tallaInput}
                onChange={e => setTallaInput(e.target.value)}
                placeholder="Ej. 67.5"
                style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #E5E7EB", outline: "none", fontSize: "15px" }}
              />
            </div>

            <button 
              onClick={handleSaveGrowth}
              disabled={isSaving || !pesoInput || !tallaInput}
              style={{ 
                width: "100%", background: "var(--theme-primary)", color: "#fff", 
                padding: "16px", borderRadius: "14px", border: "none", 
                fontSize: "16px", fontWeight: 800, cursor: isSaving ? "not-allowed" : "pointer",
                opacity: (isSaving || !pesoInput || !tallaInput) ? 0.6 : 1
              }}
            >
              {isSaving ? "Guardando..." : "Guardar Registro"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
