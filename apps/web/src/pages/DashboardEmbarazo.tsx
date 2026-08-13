import { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, Heart } from "lucide-react";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

interface DashboardEmbarazoProps {
  user: any;
  perfil: any;
  activeBabyId: string;
}

export default function DashboardEmbarazo({ user, perfil, activeBabyId }: DashboardEmbarazoProps) {
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [fechaCita, setFechaCita] = useState("");
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
      
      setFechaCita("");
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

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1000px", margin: "0 auto", fontFamily: "Nunito" }}>
      
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 800, color: "var(--theme-darker)", marginBottom: "8px" }}>
          ¡Tu Embarazo Semana a Semana!
        </h1>
        <p style={{ fontSize: "18px", color: "var(--theme-text-light)", fontWeight: 600 }}>
          Actualmente tienes {semanas} semanas de embarazo
        </p>
      </div>

      <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
        
        {/* LADO IZQUIERDO: Tamaño del bebé */}
        <div style={{
          flex: "1 1 350px",
          background: "linear-gradient(155deg, var(--theme-darker) 0%, var(--theme-dark) 60%, var(--theme-primary) 130%)",
          borderRadius: "24px",
          padding: "40px 30px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          color: "white",
          boxShadow: "0 10px 30px var(--theme-shadow)",
          height: "fit-content"
        }}>
          
          <div style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "30px"
          }}>
            <Heart size={50} color="#F4A0A0" fill="#F4A0A0" />
          </div>

          <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "12px" }}>Tamaño del Bebé</h2>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.7)", textAlign: "center", marginBottom: "30px" }}>
            Esta semana, tu bebé tiene el tamaño de un/a <strong style={{ color: "#F4A0A0" }}>{frutaActual}</strong>.
          </p>

          <div style={{ width: "100%", background: "rgba(255,255,255,0.12)", borderRadius: "10px", height: "10px", overflow: "hidden", marginBottom: "10px" }}>
            <div style={{ 
              width: `${Math.min(porcentaje, 100)}%`, 
              height: "100%", 
              background: "linear-gradient(90deg, #F4A0A0 0%, var(--theme-light) 100%)",
              borderRadius: "10px"
            }}></div>
          </div>
          <div style={{ width: "100%", textAlign: "right", fontSize: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
            {Math.min(porcentaje, 100)}% del desarrollo
          </div>
        </div>

        {/* LADO DERECHO: Controles Prenatales */}
        <div style={{
          flex: "2 1 450px",
          background: "linear-gradient(160deg, var(--theme-darker) 0%, var(--theme-dark) 100%)",
          borderRadius: "24px",
          padding: "30px",
          color: "white",
          boxShadow: "0 10px 30px var(--theme-shadow)"
        }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "12px",
              background: "rgba(160,122,223,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <Calendar size={18} color="var(--theme-light)" />
            </div>
            Controles Prenatales
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "30px", maxHeight: "300px", overflowY: "auto", paddingRight: "10px" }}>
            {loading ? (
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Cargando citas...</p>
            ) : citas.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>No tienes controles registrados aún.</p>
            ) : (
              citas.map(cita => {
                const date = new Date(cita.fecha_cita);
                const isPast = date < new Date();
                return (
                  <div key={cita.id} style={{ 
                    background: "rgba(255,255,255,0.06)", 
                    borderRadius: "16px", 
                    padding: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderLeft: `4px solid ${isPast ? "rgba(255,255,255,0.2)" : "var(--theme-light)"}`
                  }}>
                    <div>
                      <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", color: isPast ? "rgba(255,255,255,0.6)" : "white" }}>
                        {cita.notas || "Control Médico"}
                      </h4>
                      <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: "10px" }}>
                        <span>{cita.medico || "Sin especificar doctor"}</span>
                        {cita.lugar && <span>• {cita.lugar}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, fontSize: "15px", color: isPast ? "rgba(255,255,255,0.6)" : "#F4A0A0" }}>
                        {date.toLocaleDateString("es-CL", { day: 'numeric', month: 'short' })}
                      </div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                        {date.toLocaleTimeString("es-CL", { hour: '2-digit', minute:'2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Formulario Nueva Cita */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Agregar Nueva Cita</h3>
            
            <form onSubmit={handleSaveCita} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Fecha y Hora</label>
                  <input 
                    type="datetime-local" 
                    lang="es-CL"
                    value={fechaCita}
                    onChange={e => setFechaCita(e.target.value)}
                    required
                    style={inputStyle} 
                    onFocus={(e) => { e.target.style.borderColor = "var(--theme-light)"; e.target.style.background = "rgba(255,255,255,0.14)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.background = "rgba(255,255,255,0.08)"; }}
                  />
                </div>
                <div style={{ flex: "1 1 200px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Doctor/Centro (Opcional)</label>
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
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Notas / Título</label>
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

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
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
