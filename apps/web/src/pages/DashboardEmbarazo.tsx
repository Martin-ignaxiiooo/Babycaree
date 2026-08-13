import { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, Sparkles, CalendarPlus, Plus } from "lucide-react";
import DateSelect from "../components/DateSelect";
import TimeSelect from "../components/TimeSelect";
import BabyGrowthIcon from "../components/BabyGrowthIcon";

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

  const cardStyle: React.CSSProperties = {
    background: "white",
    border: "2px solid var(--theme-bg-light)",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 4px 16px rgba(124, 92, 191, 0.06)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: "14px",
    border: "2px solid var(--theme-bg-light)",
    background: "#FDFCFF",
    color: "var(--theme-darker)",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Nunito', sans-serif",
    fontSize: "14px",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "8px",
    color: "#8A849C",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const cardHeaderStyle: React.CSSProperties = {
    fontSize: "17px",
    fontWeight: 800,
    color: "var(--theme-darker)",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };

  const iconBadgeStyle: React.CSSProperties = {
    width: "36px", height: "36px", borderRadius: "12px",
    background: "var(--theme-bg-light)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
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

        {/* TARJETA 1: Tamaño del bebé */}
        <div style={{ ...cardStyle, flex: "1 1 320px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h2 style={{ ...cardHeaderStyle, alignSelf: "flex-start" }}>
            <div style={iconBadgeStyle}>
              <Sparkles size={18} color="var(--theme-primary)" />
            </div>
            Tamaño del Bebé
          </h2>

          <BabyGrowthIcon porcentaje={porcentaje} />

          <div style={{ width: "100%", marginTop: "20px" }}>
            <div style={{ width: "100%", background: "var(--theme-bg-light)", borderRadius: "10px", height: "8px", overflow: "hidden", marginBottom: "10px" }}>
              <div style={{
                width: `${Math.max(Math.min(porcentaje, 100), 3)}%`,
                height: "100%",
                background: "linear-gradient(90deg, #F4A0A0 0%, var(--theme-primary) 100%)",
                borderRadius: "10px",
                transition: "width 0.4s ease",
              }}></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#8A849C", fontWeight: 700 }}>
              <span>{Math.min(porcentaje, 100)}% · Semana {semanas}</span>
              <span>Semana 40</span>
            </div>
          </div>

          <p style={{ fontSize: "15px", color: "#6B647F", textAlign: "center", marginTop: "20px", lineHeight: 1.5 }}>
            Esta semana, tu bebé tiene el tamaño de un/a{" "}
            <strong style={{ color: "#E8607F" }}>{frutaActual}</strong>.
          </p>
        </div>

        <div style={{ flex: "1 1 380px", display: "flex", flexDirection: "column", gap: "24px", minWidth: 0 }}>

          {/* TARJETA 2: Controles Prenatales (solo lista) */}
          <div style={cardStyle}>
            <h2 style={cardHeaderStyle}>
              <div style={iconBadgeStyle}>
                <Calendar size={18} color="var(--theme-primary)" />
              </div>
              Controles Prenatales
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "280px", overflowY: "auto", paddingRight: "4px" }}>
              {loading ? (
                <p style={{ color: "#B0ABC4", fontSize: "14px" }}>Cargando citas...</p>
              ) : citas.length === 0 ? (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                  padding: "24px 16px", background: "var(--theme-bg-light)", borderRadius: "16px",
                }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "50%", background: "white",
                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px",
                  }}>
                    <CalendarPlus size={20} color="var(--theme-primary)" />
                  </div>
                  <p style={{ color: "var(--theme-darker)", fontSize: "14px", fontWeight: 700, margin: "0 0 4px 0" }}>
                    Todavía no tienes controles agendados
                  </p>
                  <p style={{ color: "#8A849C", fontSize: "13px", margin: 0 }}>
                    Agregá tu próxima cita médica más abajo.
                  </p>
                </div>
              ) : (
                citas.map(cita => {
                  const date = new Date(cita.fecha_cita);
                  const isPast = date < new Date();
                  return (
                    <div key={cita.id} style={{
                      background: "var(--theme-bg-light)",
                      borderRadius: "16px",
                      padding: "14px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      borderLeft: `4px solid ${isPast ? "#D3CDE8" : "var(--theme-primary)"}`,
                      opacity: isPast ? 0.7 : 1,
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", color: "var(--theme-darker)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {cita.notas || "Control Médico"}
                        </h4>
                        <div style={{ fontSize: "13px", color: "#8A849C", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>{cita.medico || "Sin especificar doctor"}</span>
                          {cita.lugar && <span>• {cita.lugar}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--theme-primary)" }}>
                          {date.toLocaleDateString("es-CL", { day: 'numeric', month: 'short' })}
                        </div>
                        <div style={{ fontSize: "12px", color: "#8A849C" }}>
                          {date.toLocaleTimeString("es-CL", { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* TARJETA 3: Agregar Nueva Cita (formulario, tarjeta separada) */}
          <div style={cardStyle}>
            <h2 style={cardHeaderStyle}>
              <div style={iconBadgeStyle}>
                <Plus size={18} color="var(--theme-primary)" />
              </div>
              Agregar Nueva Cita
            </h2>

            <form onSubmit={handleSaveCita} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <label style={labelStyle}>Fecha</label>
                  <DateSelect
                    value={fechaCitaDate}
                    onChange={setFechaCitaDate}
                    required
                    variant="light"
                  />
                </div>
                <div style={{ flex: "1 1 140px" }}>
                  <label style={labelStyle}>Hora</label>
                  <TimeSelect
                    value={fechaCitaTime}
                    onChange={setFechaCitaTime}
                    required
                    variant="light"
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
                  onFocus={(e) => { e.target.style.borderColor = "var(--theme-light)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--theme-bg-light)"; }}
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
                  onFocus={(e) => { e.target.style.borderColor = "var(--theme-light)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--theme-bg-light)"; }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                <button
                  type="submit"
                  disabled={isSaving || !fechaCita}
                  style={{
                    background: isSaving || !fechaCita ? "var(--theme-bg-light)" : "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
                    color: isSaving || !fechaCita ? "#B0ABC4" : "white",
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
