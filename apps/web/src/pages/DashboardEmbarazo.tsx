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
          background: "#1E1E2F",
          borderRadius: "24px",
          padding: "40px 30px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          color: "white",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          height: "fit-content"
        }}>
          
          <div style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "30px"
          }}>
            <Heart size={50} color="#F4A0A0" />
          </div>

          <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "12px" }}>Tamaño del Bebé</h2>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.7)", textAlign: "center", marginBottom: "30px" }}>
            Esta semana, tu bebé tiene el tamaño de un/a <strong style={{ color: "#F4A0A0" }}>{frutaActual}</strong>.
          </p>

          <div style={{ width: "100%", background: "rgba(255,255,255,0.1)", borderRadius: "10px", height: "10px", overflow: "hidden", marginBottom: "10px" }}>
            <div style={{ 
              width: `${Math.min(porcentaje, 100)}%`, 
              height: "100%", 
              background: "linear-gradient(90deg, #F4A0A0 0%, #D4A5E3 100%)",
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
          background: "#2A2A3C",
          borderRadius: "24px",
          padding: "30px",
          color: "white",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Calendar size={20} color="#D4A5E3" /> Controles Prenatales
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
                    background: "rgba(255,255,255,0.05)", 
                    borderRadius: "16px", 
                    padding: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderLeft: `4px solid ${isPast ? "rgba(255,255,255,0.2)" : "#D4A5E3"}`
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
                        {date.toLocaleDateString("es-ES", { day: 'numeric', month: 'short' })}
                      </div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                        {date.toLocaleTimeString("es-ES", { hour: '2-digit', minute:'2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Formulario Nueva Cita */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Agregar Nueva Cita</h3>
            
            <form onSubmit={handleSaveCita} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "8px", color: "rgba(255,255,255,0.6)" }}>Fecha y Hora</label>
                  <input 
                    type="datetime-local" 
                    value={fechaCita}
                    onChange={e => setFechaCita(e.target.value)}
                    required
                    style={{ 
                      width: "100%", padding: "12px", borderRadius: "12px", border: "none", 
                      background: "rgba(255,255,255,0.1)", color: "white", outline: "none",
                      boxSizing: "border-box", fontFamily: "Nunito"
                    }} 
                  />
                </div>
                <div style={{ flex: "1 1 200px" }}>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "8px", color: "rgba(255,255,255,0.6)" }}>Doctor/Centro (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Dr. Silva - Centro Médico"
                    value={medico}
                    onChange={e => setMedico(e.target.value)}
                    style={{ 
                      width: "100%", padding: "12px", borderRadius: "12px", border: "none", 
                      background: "rgba(255,255,255,0.1)", color: "white", outline: "none",
                      boxSizing: "border-box", fontFamily: "Nunito"
                    }} 
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: "12px", marginBottom: "8px", color: "rgba(255,255,255,0.6)" }}>Notas / Título</label>
                <input 
                  type="text" 
                  placeholder="Ej. Ecografía Estructural"
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  style={{ 
                    width: "100%", padding: "12px", borderRadius: "12px", border: "none", 
                    background: "rgba(255,255,255,0.1)", color: "white", outline: "none",
                    boxSizing: "border-box", fontFamily: "Nunito"
                  }} 
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                <button 
                  type="submit" 
                  disabled={isSaving || !fechaCita}
                  style={{ 
                    background: isSaving || !fechaCita ? "rgba(255,255,255,0.2)" : "rgba(212, 165, 227, 0.2)",
                    color: isSaving || !fechaCita ? "rgba(255,255,255,0.5)" : "#D4A5E3",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    fontWeight: 700,
                    cursor: isSaving || !fechaCita ? "not-allowed" : "pointer",
                    transition: "all 0.2s"
                  }}
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
