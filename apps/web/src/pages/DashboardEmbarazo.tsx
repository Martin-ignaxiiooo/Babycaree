import { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, Heart, Sparkles, CalendarPlus, Plus } from "lucide-react";
import DateSelect from "../components/DateSelect";
import TimeSelect from "../components/TimeSelect";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

interface DashboardEmbarazoProps {
  user: any;
  perfil: any;
  activeBabyId: string;
}

export default function DashboardEmbarazo({ user, perfil, activeBabyId }: DashboardEmbarazoProps) {
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [fechaCitaDate, setFechaCitaDate] = useState("");
  const [fechaCitaTime, setFechaCitaTime] = useState("");
  const fechaCita = fechaCitaDate && fechaCitaTime ? `${fechaCitaDate}T${fechaCitaTime}` : "";
  const [medico, setMedico] = useState("");
  const [notas, setNotas] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCitas();
  }, [activeBabyId]);

  const fetchCitas = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/v1/salud/${activeBabyId}/citas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCitas(res.data);
    } catch (error) {
      console.error("Error fetching citas", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaCita) return;
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/v1/salud/${activeBabyId}/citas`, {
        fecha_cita: fechaCita,
        medico,
        notas,
        especialidad: "Obstetricia"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFechaCitaDate("");
      setFechaCitaTime("");
      setMedico("");
      setNotas("");
      fetchCitas();
    } catch (error) {
      console.error("Error saving cita", error);
      alert("Error al guardar la cita");
    } finally {
      setIsSaving(false);
    }
  };

  // Extraer datos del backend
  const semanas = perfil?.semanas_embarazo || 0;
  let porcentaje = 0;
  if (semanas > 0) {
    porcentaje = Math.round((semanas / 40) * 100);
  }
  const frutaActual = perfil?.fruta_embarazo || "Semillita";

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Nunito', sans-serif",
    fontSize: "14px",
    transition: "border-color 0.2s, background 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "8px",
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <div style={{ padding: "40px clamp(12px, 4vw, 20px)", maxWidth: "1020px", margin: "0 auto", fontFamily: "Nunito" }}>
      
      <div style={{ marginBottom: "32px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "var(--theme-bg-light)", color: "var(--theme-primary)",
          padding: "6px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: 800,
          textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px"
        }}>
          <Sparkles size={13} /> Semana {semanas} de 40
        </div>
        <h1 style={{ fontSize: "32px", fontWeight: 800, color: "var(--theme-darker)", marginBottom: "6px", lineHeight: 1.15 }}>
          ¡Tu Embarazo Semana a Semana!
        </h1>
        <p style={{ fontSize: "16px", color: "#8A849C", fontWeight: 600 }}>
          Acá vas a ver cómo crece tu bebé y llevar el registro de tus controles médicos.
        </p>
      </div>

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-start" }}>
        
        {/* LADO IZQUIERDO: Tamaño del bebé */}
        <div style={{
          flex: "1 1 320px",
          background: "linear-gradient(155deg, var(--theme-darker) 0%, var(--theme-dark) 60%, var(--theme-primary) 130%)",
          borderRadius: "24px",
          padding: "32px clamp(20px, 6vw, 30px)",
          display: "flex",
          flexDirection: "column",
          color: "white",
          boxShadow: "0 10px 30px var(--theme-shadow)",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Glow decorativo, atmósfera sutil */}
          <div style={{
            position: "absolute", top: "-60px", right: "-60px", width: "180px", height: "180px",
            borderRadius: "50%", background: "radial-gradient(circle, rgba(244,160,160,0.25) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative" }}>
            <div style={{
              width: "112px",
              height: "112px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "24px",
              boxShadow: "0 0 0 8px rgba(255,255,255,0.04)",
            }}>
              <Heart size={46} color="#F4A0A0" fill="#F4A0A0" />
            </div>

            <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "10px", textAlign: "center" }}>Tamaño del Bebé</h2>
            <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.7)", textAlign: "center", marginBottom: "28px", lineHeight: 1.5 }}>
              Esta semana, tu bebé tiene el tamaño de un/a<br />
              <strong style={{ color: "#F4A0A0", fontSize: "17px" }}>{frutaActual}</strong>
            </p>
          </div>

          <div>
            <div style={{ width: "100%", background: "rgba(255,255,255,0.12)", borderRadius: "10px", height: "8px", overflow: "hidden", marginBottom: "10px" }}>
              <div style={{ 
                width: `${Math.max(Math.min(porcentaje, 100), 3)}%`, 
                height: "100%", 
                background: "linear-gradient(90deg, #F4A0A0 0%, var(--theme-light) 100%)",
                borderRadius: "10px",
                transition: "width 0.4s ease",
              }}></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
              <span>Concepción</span>
              <span style={{ color: "#F4A0A0", fontWeight: 800 }}>{Math.min(porcentaje, 100)}%</span>
              <span>Semana 40</span>
            </div>
          </div>
        </div>

        {/* LADO DERECHO: Controles Prenatales */}
        <div style={{
          flex: "2 1 450px",
          background: "linear-gradient(160deg, var(--theme-darker) 0%, var(--theme-dark) 100%)",
          borderRadius: "24px",
          padding: "30px",
          color: "white",
          boxShadow: "0 10px 30px var(--theme-shadow)",
          display: "flex",
          flexDirection: "column",
        }}>
          <h2 style={{ fontSize: "19px", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "12px",
              background: "rgba(160,122,223,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <Calendar size={18} color="var(--theme-light)" />
            </div>
            Controles Prenatales
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "26px", maxHeight: "280px", overflowY: "auto", paddingRight: "6px" }}>
            {loading ? (
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>Cargando citas...</p>
            ) : citas.length === 0 ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                padding: "28px 16px", background: "rgba(255,255,255,0.04)", borderRadius: "16px",
                border: "1px dashed rgba(255,255,255,0.15)",
              }}>
                <div style={{
                  width: "44px", height: "44px", borderRadius: "50%", background: "rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px",
                }}>
                  <CalendarPlus size={20} color="rgba(255,255,255,0.5)" />
                </div>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", fontWeight: 700, margin: "0 0 4px 0" }}>
                  Todavía no tienes controles agendados
                </p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                  Agregá tu próxima cita médica más abajo.
                </p>
              </div>
            ) : (
              citas.map(cita => {
                const date = new Date(cita.fecha_cita);
                const isPast = date < new Date();
                return (
                  <div key={cita.id} style={{ 
                    background: "rgba(255,255,255,0.06)", 
                    borderRadius: "16px", 
                    padding: "14px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    borderLeft: `4px solid ${isPast ? "rgba(255,255,255,0.2)" : "var(--theme-light)"}`
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", color: isPast ? "rgba(255,255,255,0.6)" : "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cita.notas || "Control Médico"}
                      </h4>
                      <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>{cita.medico || "Sin especificar doctor"}</span>
                        {cita.lugar && <span>• {cita.lugar}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: "14px", color: isPast ? "rgba(255,255,255,0.6)" : "#F4A0A0" }}>
                        {date.toLocaleDateString("es-CL", { day: 'numeric', month: 'short' })}
                      </div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                        {date.toLocaleTimeString("es-CL", { hour: '2-digit', minute:'2-digit', hour12: false })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Formulario Nueva Cita */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: "22px", marginTop: "auto" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 800, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Plus size={16} color="var(--theme-light)" /> Agregar Nueva Cita
            </h3>
            
            <form onSubmit={handleSaveCita} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <label style={labelStyle}>Fecha</label>
                  <DateSelect
                    value={fechaCitaDate}
                    onChange={setFechaCitaDate}
                    required
                    variant="dark"
                  />
                </div>
                <div style={{ flex: "1 1 140px" }}>
                  <label style={labelStyle}>Hora</label>
                  <TimeSelect
                    value={fechaCitaTime}
                    onChange={setFechaCitaTime}
                    required
                    variant="dark"
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Doctor/Centro (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ej. Dr. Silva - Centro Médico"
                  value={medico}
                  onChange={e => setMedico(e.target.value)}
                  style={inputStyle} 
                  onFocus={(e) => { e.target.style.borderColor = "var(--theme-light)"; e.target.style.background = "rgba(255,255,255,0.14)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.background = "rgba(255,255,255,0.08)"; }}
                />
              </div>
              
              <div>
                <label style={labelStyle}>Notas / Título</label>
                <input 
                  type="text" 
                  placeholder="Ej. Ecografía Estructural"
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  style={inputStyle} 
                  onFocus={(e) => { e.target.style.borderColor = "var(--theme-light)"; e.target.style.background = "rgba(255,255,255,0.14)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.background = "rgba(255,255,255,0.08)"; }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                <button 
                  type="submit" 
                  disabled={isSaving || !fechaCita}
                  style={{ 
                    background: isSaving || !fechaCita ? "rgba(255,255,255,0.12)" : "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
                    color: isSaving || !fechaCita ? "rgba(255,255,255,0.4)" : "white",
                    border: "none",
                    padding: "13px 28px",
                    borderRadius: "14px",
                    fontWeight: 800,
                    fontSize: "15px",
                    fontFamily: "'Nunito', sans-serif",
                    cursor: isSaving || !fechaCita ? "not-allowed" : "pointer",
                    boxShadow: isSaving || !fechaCita ? "none" : "0 6px 18px var(--theme-shadow)",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => { if (!isSaving && fechaCita) (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; }}
                >
                  {isSaving ? "Guardando..." : "Guardar Cita"}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
