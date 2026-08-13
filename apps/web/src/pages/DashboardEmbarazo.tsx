import { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, CalendarPlus, Plus } from "lucide-react";
import DateSelect from "../components/DateSelect";
import TimeSelect from "../components/TimeSelect";
import BabyGrowthIcon, { HITOS_POR_MES, ETIQUETA_POR_MES, SEMANA_RANGO_POR_MES, mesDesdeSemanas } from "../components/BabyGrowthIcon";

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
  const semanas = perfil?.semanas_embarazo || 1;
  let porcentaje = 0;
  if (semanas > 0) {
    porcentaje = Math.round((semanas / 40) * 100);
  }
  const mes = mesDesdeSemanas(semanas);
  const hito = HITOS_POR_MES[mes];
  const frutaActual = perfil?.fruta_embarazo || "Semillita";
  const etiquetaMes = ETIQUETA_POR_MES[mes];
  const rangoSemana = SEMANA_RANGO_POR_MES[mes];

  const cardStyle: React.CSSProperties = {
    background: "white",
    border: "2px solid var(--theme-bg-light)",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 4px 16px rgba(124, 92, 191, 0.08)",
  };

  const cardHeaderBannerStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
    color: "white",
    fontSize: "16px",
    fontWeight: 800,
    padding: "16px 22px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
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

  return (
    <div style={{
      padding: "40px clamp(12px, 4vw, 20px)",
      background: "linear-gradient(135deg, var(--theme-primary) 0%, #F4A0A0 50%, var(--theme-light) 100%)",
      minHeight: "100vh",
      flex: 1,
    }}>
      <div style={{ maxWidth: "1020px", margin: "0 auto", fontFamily: "Nunito" }}>

        <div style={{ marginBottom: "32px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "white", color: "var(--theme-primary)",
            padding: "6px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: 800,
            textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px",
            boxShadow: "0 2px 8px rgba(124,92,191,0.15)",
          }}>
            Semana {semanas} de 40
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "var(--theme-darker)", lineHeight: 1.15 }}>
            Seguimiento - Mes {mes} ({etiquetaMes})
          </h1>
        </div>

        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "stretch" }}>

          {/* TARJETA 1: Tamaño del bebé */}
          <div style={{ ...cardStyle, flex: "1 1 320px", padding: "24px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "19px", fontWeight: 800, color: "var(--theme-darker)", margin: 0 }}>
                Tamaño del Bebé
              </h2>
              <div style={{
                background: "var(--theme-bg-light)", color: "var(--theme-primary)",
                padding: "6px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 800,
                whiteSpace: "nowrap",
              }}>
                Mes {mes} - {rangoSemana}
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                <BabyGrowthIcon semanas={semanas} porcentaje={porcentaje} />
                <div style={{ flex: "1 1 140px" }}>
                  <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--theme-darker)", marginBottom: "8px" }}>
                    {Math.min(porcentaje, 100)}%
                  </div>
                  <div style={{ width: "100%", background: "var(--theme-bg-light)", borderRadius: "10px", height: "8px", overflow: "hidden", marginBottom: "8px" }}>
                    <div style={{
                      width: `${Math.max(Math.min(porcentaje, 100), 3)}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #F4A0A0 0%, #E8607F 100%)",
                      borderRadius: "10px",
                      transition: "width 0.4s ease",
                    }}></div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#8A849C", fontWeight: 700 }}>
                    <span>Semana 1</span>
                    <span>Semana 40</span>
                  </div>
                </div>
              </div>

              <div>
                <p style={{ fontSize: "15px", color: "#6B647F", lineHeight: 1.5, margin: "0 0 6px 0" }}>
                  {hito}
                </p>
                <p style={{ fontSize: "14px", color: "#8A849C", lineHeight: 1.5, margin: 0 }}>
                  Tiene el tamaño de un/a{" "}
                  <strong style={{ color: "#E8607F" }}>{frutaActual}</strong>.
                </p>
              </div>
            </div>
          </div>

          <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: "24px", minWidth: 0 }}>

            {/* TARJETA 2: Controles Prenatales */}
            <div style={cardStyle}>
              <div style={cardHeaderBannerStyle}>
                <Calendar size={18} />
                Controles Prenatales
              </div>
              <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "12px", maxHeight: "280px", overflowY: "auto" }}>
                {loading ? (
                  <p style={{ color: "#B0ABC4", fontSize: "14px", margin: 0 }}>Cargando citas...</p>
                ) : citas.length === 0 ? (
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                    padding: "16px",
                  }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "50%", background: "var(--theme-bg-light)",
                      display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px",
                    }}>
                      <CalendarPlus size={20} color="var(--theme-primary)" />
                    </div>
                    <p style={{ color: "var(--theme-darker)", fontSize: "14px", fontWeight: 700, margin: "0 0 4px 0" }}>
                      Todavía no tienes controles agendados.
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

            {/* TARJETA 3: Agregar Nueva Cita */}
            <div style={cardStyle}>
              <div style={cardHeaderBannerStyle}>
                <Plus size={18} />
                Agregar Nueva Cita
              </div>
              <div style={{ padding: "22px" }}>
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

                  <button
                    type="submit"
                    disabled={isSaving || !fechaCita}
                    style={{
                      background: isSaving || !fechaCita ? "var(--theme-bg-light)" : "linear-gradient(135deg, #F4A0A0, #E8607F)",
                      color: isSaving || !fechaCita ? "#B0ABC4" : "white",
                      border: "none",
                      padding: "14px 28px",
                      borderRadius: "100px",
                      fontWeight: 800,
                      fontSize: "15px",
                      fontFamily: "'Nunito', sans-serif",
                      cursor: isSaving || !fechaCita ? "not-allowed" : "pointer",
                      boxShadow: isSaving || !fechaCita ? "none" : "0 6px 18px rgba(232,96,127,0.35)",
                      transition: "all 0.2s",
                      width: "100%",
                    }}
                    onMouseEnter={(e) => { if (!isSaving && fechaCita) (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; }}
                  >
                    {isSaving ? "Guardando..." : "Guardar Cita"}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
