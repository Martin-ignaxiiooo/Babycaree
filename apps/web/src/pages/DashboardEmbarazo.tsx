import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Calendar, CalendarPlus, Plus, Sparkles, Camera, X, Loader2 } from "lucide-react";
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
  const navigate = useNavigate();
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [fechaCitaDate, setFechaCitaDate] = useState("");
  const [fechaCitaTime, setFechaCitaTime] = useState("");
  const fechaCita = fechaCitaDate && fechaCitaTime ? `${fechaCitaDate}T${fechaCitaTime}` : "";
  const [medico, setMedico] = useState("");
  const [notas, setNotas] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Foto de perfil (embarazo). Se maneja local porque este componente
  // recibe "perfil" como prop desde arriba y no controla su propio fetch;
  // se actualiza sola de nuevo cuando el usuario cambia de bebé.
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(perfil?.foto_perfil || null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoError, setFotoError] = useState("");
  const [confirmandoBorrarFoto, setConfirmandoBorrarFoto] = useState(false);

  useEffect(() => {
    setFotoPerfil(perfil?.foto_perfil || null);
  }, [activeBabyId, perfil?.foto_perfil]);

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

  // Redimensiona/comprime la foto en el navegador antes de subirla (igual
  // que en el dashboard del bebé ya nacido), para no guardar imágenes
  // pesadas en la base de datos.
  const resizeImageFile = (file: File, maxDim = 480, quality = 0.82): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round(height * (maxDim / width));
          width = maxDim;
        } else if (height >= width && height > maxDim) {
          width = Math.round(width * (maxDim / height));
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("No se pudo procesar la imagen"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (blob) resolve(blob);
            else reject(new Error("No se pudo procesar la imagen"));
          },
          "image/jpeg",
          quality,
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("No se pudo leer la imagen"));
      };
      img.src = objectUrl;
    });
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !activeBabyId) return;

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFotoError("Formato no soportado. Usa JPG, PNG, WEBP o GIF.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setFotoError("La imagen no puede pesar más de 8MB.");
      return;
    }

    setFotoError("");
    setUploadingFoto(true);
    try {
      const resizedBlob = await resizeImageFile(file);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("foto", resizedBlob, "foto.jpg");

      const res = await axios.post(`${API_URL}/v1/perfiles-bebe/${activeBabyId}/foto`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setFotoPerfil(res.data.foto_perfil);
    } catch (error) {
      console.error(error);
      setFotoError("No se pudo subir la foto. Intenta de nuevo.");
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleEliminarFoto = async () => {
    if (!activeBabyId || uploadingFoto) return;
    setFotoError("");
    setUploadingFoto(true);
    setConfirmandoBorrarFoto(false);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/v1/perfiles-bebe/${activeBabyId}/foto`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFotoPerfil(null);
    } catch (error) {
      console.error(error);
      setFotoError("No se pudo quitar la foto. Intenta de nuevo.");
    } finally {
      setUploadingFoto(false);
    }
  };

  // Extraer datos del backend
  const semanas = perfil?.semanas_embarazo || 1;
  let porcentaje = 0;
  if (semanas > 0) {
    porcentaje = Math.round((semanas / 40) * 100);
  }
  // Estos textos ahora viven en la tabla embarazo_hitos_mes y llegan desde el
  // backend. Los objetos locales quedan solo como respaldo por si la tabla
  // todavía no está creada en ese ambiente.
  const mes = perfil?.mes_embarazo || mesDesdeSemanas(semanas);
  const hito = perfil?.hito_embarazo || HITOS_POR_MES[mes];
  const frutaActual = perfil?.fruta_embarazo || "Semillita";
  const etiquetaMes = perfil?.etiqueta_mes_embarazo || ETIQUETA_POR_MES[mes];
  const rangoSemana = perfil?.rango_semana_mes_embarazo || SEMANA_RANGO_POR_MES[mes];

  const cardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: "22px",
    overflow: "hidden",
    boxShadow: "0 6px 24px rgba(124,92,191,0.07)",
  };

  const cardHeaderBannerStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
    color: "white",
    fontFamily: "'Baloo 2', sans-serif",
    fontSize: "16px",
    fontWeight: 700,
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
    <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, #FAF9FD 0%, #F6F2FF 100%)", fontFamily: "'Nunito', sans-serif", flex: 1 }}>

      {/* ── HERO: degradado contenido arriba, igual que el resto de la app ── */}
      <div style={{
        background: "linear-gradient(120deg, var(--theme-darker) 0%, #B85C7E 55%, var(--theme-light) 100%)",
        padding: "40px clamp(16px, 4vw, 40px) 44px",
      }}>
        <div style={{ maxWidth: "1020px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "22px", flexWrap: "wrap" }}>
            <label
              htmlFor="foto-embarazo-input"
              style={{
                position: "relative",
                width: "88px", height: "88px", borderRadius: "22px",
                background: "#fff", flexShrink: 0, overflow: "hidden", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 22px rgba(45,38,64,0.2)",
              }}
              title="Cambiar foto"
            >
              {fotoPerfil ? (
                <img src={fotoPerfil} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <Camera size={30} color="#E4C9D6" strokeWidth={2} />
              )}

              {uploadingFoto && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Loader2 size={22} color="var(--theme-primary)" className="spin-icon" />
                </div>
              )}

              {fotoPerfil && !uploadingFoto && !confirmandoBorrarFoto && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmandoBorrarFoto(true); }}
                  title="Quitar foto"
                  aria-label="Quitar foto"
                  style={{
                    position: "absolute", top: "4px", right: "4px",
                    width: "20px", height: "20px", borderRadius: "50%",
                    background: "rgba(45,38,64,0.6)", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0,
                  }}
                >
                  <X size={12} color="#fff" strokeWidth={3} />
                </button>
              )}

              {confirmandoBorrarFoto && !uploadingFoto && (
                <div
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  style={{ position: "absolute", inset: 0, background: "rgba(45,38,64,0.88)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", padding: "6px" }}
                >
                  <span style={{ color: "#fff", fontSize: "9px", fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>¿Quitar foto?</span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEliminarFoto(); }} style={{ background: "#fff", color: "#B91C1C", border: "none", borderRadius: "6px", padding: "3px 7px", fontSize: "10px", fontWeight: 800, cursor: "pointer" }}>Sí</button>
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmandoBorrarFoto(false); }} style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.5)", borderRadius: "6px", padding: "3px 7px", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}>No</button>
                  </div>
                </div>
              )}

              <input
                id="foto-embarazo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleUploadFoto}
                disabled={uploadingFoto}
                style={{ display: "none" }}
              />
            </label>

            <div style={{ flex: "1 1 260px", minWidth: 0 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "rgba(255,255,255,0.16)", color: "#fff",
                padding: "6px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: 800,
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px",
                border: "1px solid rgba(255,255,255,0.25)",
              }}>
                <Sparkles size={13} /> Semana {semanas} de 40
              </div>
              <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "clamp(24px, 4vw, 30px)", fontWeight: 700, color: "#fff", lineHeight: 1.2, margin: 0 }}>
                Seguimiento de {perfil?.nombre || "tu embarazo"}
              </h1>
              <div style={{ fontSize: "14.5px", color: "rgba(255,255,255,0.8)", marginTop: "6px", fontWeight: 600 }}>
                Mes {mes} · {etiquetaMes}
              </div>
              {fotoError && (
                <div style={{ fontSize: "12px", color: "#fff", background: "rgba(185,28,28,0.85)", padding: "4px 10px", borderRadius: "8px", marginTop: "8px", fontWeight: 700, display: "inline-block" }}>{fotoError}</div>
              )}
            </div>

            {/* Mini progreso, visible también en el hero para que se vea de un vistazo */}
            <div style={{ flex: "0 0 auto", textAlign: "center", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "18px", padding: "14px 22px" }}>
              <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "26px", fontWeight: 700, color: "#fff" }}>{Math.min(porcentaje, 100)}%</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>del camino</div>
            </div>

            {hito && (
              <button
                type="button"
                onClick={() => navigate(`/embarazo/${activeBabyId}/info`, { state: { perfil } })}
                title="Ver datos sobre tu embarazo"
                style={{
                  flex: "0 0 auto",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.35)",
                  color: "#fff",
                  padding: "12px 20px",
                  borderRadius: "100px",
                  fontSize: "13px",
                  fontWeight: 800,
                  fontFamily: "'Nunito', sans-serif",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "background 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.3)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.18)";
                  (e.currentTarget as HTMLElement).style.transform = "";
                }}
              >
                <Sparkles size={16} /> Datos sobre tu embarazo
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin-embarazo-kf { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin-icon { animation: spin-embarazo-kf 0.9s linear infinite; }
      `}</style>

      {/* ── CONTENIDO ── */}
      <div style={{ maxWidth: "1020px", margin: "0 auto", padding: "32px clamp(12px, 4vw, 20px) 40px", fontFamily: "Nunito" }}>

        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "stretch" }}>

          {/* TARJETA 1: Tamaño del bebé */}
          <div style={{ ...cardStyle, flex: "1 1 320px", padding: "24px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
              <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "19px", fontWeight: 700, color: "var(--theme-darker)", margin: 0 }}>
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

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                <BabyGrowthIcon semanas={semanas} porcentaje={porcentaje} fill />
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
                <p style={{ fontSize: "15px", color: "#6B647F", lineHeight: 1.5, margin: 0 }}>
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

        {/* TARJETA 4: Texto del hito de la semana (ancho completo) */}
        {hito && (
          <div style={{ ...cardStyle, marginTop: "24px" }}>
            <div style={cardHeaderBannerStyle}>
              <Sparkles size={18} />
              Tu semana {semanas}
            </div>
            <div style={{ padding: "24px" }}>
              <p style={{
                fontSize: "15px",
                color: "#6B647F",
                lineHeight: 1.7,
                margin: 0,
                whiteSpace: "pre-line",
              }}>
                {hito}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
