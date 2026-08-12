import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Heart, Shield, TrendingUp, Bell, Plus, FileText, 
  MessageCircle, Camera, Search, Users, Syringe, Stethoscope, LogOut, X
} from "lucide-react";
import TopNav from "../components/TopNav";

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

  if (!user || loading) return <div style={{ padding: "40px", textAlign: "center", fontFamily: "Nunito", fontSize: "18px" }}>Cargando tu panel...</div>;

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
      <TopNav user={user} notificaciones={notificaciones} onLogout={handleLogout} activePath="/dashboard" />

      <div className="page-container">
        
        {/* ÔöÇÔöÇ HOME HERO FULL WIDTH ÔöÇÔöÇ */}
        <div style={{
          background: "linear-gradient(135deg, var(--theme-darker) 0%, var(--theme-primary) 100%)",
          padding: "40px",
          color: "#fff",
          borderRadius: "24px",
          boxShadow: "0 10px 30px var(--theme-shadow-bg)",
          marginBottom: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "24px"
        }}>
          <div>
            <div style={{ fontSize: "16px", opacity: 0.8, marginBottom: "12px" }}>Buenos d├¡as, {user.nombre} {user.apellidos || ""} ­ƒæï</div>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{
                width: "80px", height: "80px", borderRadius: "50%", 
                background: "var(--theme-bg-light)", display: "flex", 
                alignItems: "center", justifyContent: "center", 
                fontSize: "40px", border: "4px solid rgba(255,255,255,.4)"
              }}>
                ­ƒæÂ
              </div>
              <div>
                <div style={{ fontSize: "28px", fontWeight: 800, marginBottom: "4px" }}>{hero.nombre}</div>
                <div style={{ fontSize: "15px", opacity: 0.9 }}>{hero.edad_exacta} ┬À {hero.prevision}</div>
              </div>
            </div>
          </div>

          <div className="hero-stats-grid">
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: "16px", padding: "20px 30px", textAlign: "center", minWidth: "120px" }}>
              <div style={{ fontSize: "24px", fontWeight: 800 }}>{hero.peso_kg !== "-" && hero.peso_kg !== 0 ? `${hero.peso_kg} kg` : "N/A"}</div>
              <div style={{ fontSize: "13px", opacity: 0.8, marginTop: "4px" }}>Peso actual</div>
            </div>
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: "16px", padding: "20px 30px", textAlign: "center", minWidth: "120px" }}>
              <div style={{ fontSize: "24px", fontWeight: 800 }}>{hero.talla_cm !== "-" && hero.talla_cm !== 0 ? `${hero.talla_cm} cm` : "N/A"}</div>
              <div style={{ fontSize: "13px", opacity: 0.8, marginTop: "4px" }}>Talla actual</div>
            </div>
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: "16px", padding: "20px 30px", textAlign: "center", minWidth: "120px" }}>
              <div style={{ fontSize: "24px", fontWeight: 800 }}>P{hero.percentil}</div>
              <div style={{ fontSize: "13px", opacity: 0.8, marginTop: "4px" }}>Percentil OMS</div>
            </div>
          </div>
        </div>

        {/* ÔöÇÔöÇ GRID DESKTOP Y MOBILE ÔöÇÔöÇ */}
        <div className="responsive-grid">
          
          {/* COLUMNA 1: Notificaciones y Gr├ífico */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* ÔöÇÔöÇ NOTIFICACIONES ÔöÇÔöÇ */}
            {notificaciones.length > 0 && (
              <div style={{ background: "#fff", borderRadius: "24px", padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,.04)" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--theme-darker)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  ­ƒöö Alertas y Tareas
                </h3>
                
                {notificaciones.map((n: any, idx: number) => {
                  const bg = n.prioridad === 'alta' ? '#FEE2E2' : n.prioridad === 'media' ? '#FEF3C7' : 'var(--theme-bg-light)';
                  const border = n.prioridad === 'alta' ? '#DC2626' : n.prioridad === 'media' ? '#D97706' : 'var(--theme-primary)';
                  const icon = n.tipo.includes('vacuna') ? '­ƒÆë' : n.tipo.includes('control') ? '­ƒ®║' : '­ƒôÜ';

                  return (
                    <div key={idx} 
                      onClick={() => navigate("/salud")}
                      style={{ 
                        borderRadius: "16px", padding: "16px", marginBottom: "16px", 
                        display: "flex", alignItems: "flex-start", gap: "16px", cursor: "pointer",
                        background: bg, borderLeft: `5px solid ${border}`,
                        transition: "transform 0.2s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateX(5px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}
                    >
                      <span style={{ fontSize: "24px" }}>{icon}</span>
                      <div>
                        <strong style={{ display: "block", fontSize: "15px", color: "var(--theme-darker)", marginBottom: "4px" }}>{n.titulo}</strong>
                        <span style={{ fontSize: "14px", color: "#4B5563", lineHeight: 1.5 }}>{n.mensaje}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ÔöÇÔöÇ GR├üFICO DIN├üMICO ÔöÇÔöÇ */}
            <div style={{ background: "#fff", borderRadius: "24px", padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--theme-darker)", margin: 0 }}>
                  ­ƒôê Evoluci├│n de Crecimiento
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
                
                {/* P50 reference line (Din├ímico OMS) */}
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

          {/* COLUMNA 2: Accesos R├ípidos */}
          <div style={{ background: "#fff", borderRadius: "24px", padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,.04)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--theme-darker)", marginBottom: "20px" }}>
              ­ƒùé´©Å M├│dulos de Acceso R├ípido
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              
              <div onClick={() => navigate(`/perfil/${hero.id}`)} style={{ background: "#F9FAFB", padding: "28px 16px", borderRadius: "20px", textAlign: "center", cursor: "pointer", border: "2px solid transparent", transition: "all 0.2s" }}
                   onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--theme-primary)"; e.currentTarget.style.background = "var(--theme-bg-light)"; }}
                   onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "#F9FAFB"; }}>
                <FileText size={36} color="var(--theme-primary)" style={{ margin: "0 auto 12px" }} />
                <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--theme-darker)" }}>Perfil del beb├®</div>
                <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "6px" }}>Datos generales</div>
              </div>

              <div onClick={() => navigate("/salud")} style={{ background: "#F9FAFB", padding: "28px 16px", borderRadius: "20px", textAlign: "center", cursor: "pointer", border: "2px solid transparent", transition: "all 0.2s" }}
                   onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--theme-primary)"; e.currentTarget.style.background = "var(--theme-bg-light)"; }}
                   onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "#F9FAFB"; }}>
                <Syringe size={36} color="var(--theme-primary)" style={{ margin: "0 auto 12px" }} />
                <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--theme-darker)" }}>Salud</div>
                <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "6px" }}>Vacunas y controles</div>
              </div>

              <div onClick={() => navigate("/comunidad")} style={{ background: "#F9FAFB", padding: "28px 16px", borderRadius: "20px", textAlign: "center", cursor: "pointer", border: "2px solid transparent", transition: "all 0.2s" }}
                   onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--theme-primary)"; e.currentTarget.style.background = "var(--theme-bg-light)"; }}
                   onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "#F9FAFB"; }}>
                <MessageCircle size={36} color="var(--theme-primary)" style={{ margin: "0 auto 12px" }} />
                <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--theme-darker)" }}>Comunidad</div>
                <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "6px" }}>Foros y art├¡culos</div>
              </div>

              <div onClick={() => navigate("/galeria")} style={{ background: "#F9FAFB", padding: "28px 16px", borderRadius: "20px", textAlign: "center", cursor: "pointer", border: "2px solid transparent", transition: "all 0.2s" }}
                   onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--theme-primary)"; e.currentTarget.style.background = "var(--theme-bg-light)"; }}
                   onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "#F9FAFB"; }}>
                <Camera size={36} color="var(--theme-primary)" style={{ margin: "0 auto 12px" }} />
                <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--theme-darker)" }}>Galer├¡a</div>
                <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "6px" }}>Fotos e hitos</div>
              </div>

              <div onClick={() => navigate("/directorio")} style={{ background: "#F9FAFB", padding: "28px 16px", borderRadius: "20px", textAlign: "center", cursor: "pointer", border: "2px solid transparent", transition: "all 0.2s" }}
                   onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--theme-primary)"; e.currentTarget.style.background = "var(--theme-bg-light)"; }}
                   onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "#F9FAFB"; }}>
                <Search size={36} color="var(--theme-primary)" style={{ margin: "0 auto 12px" }} />
                <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--theme-darker)" }}>Directorio</div>
                <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "6px" }}>Especialistas</div>
              </div>



            </div>
          </div>
        </div>

      </div>

      {/* ÔöÇÔöÇ MODAL REGISTRO CRECIMIENTO ÔöÇÔöÇ */}
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
