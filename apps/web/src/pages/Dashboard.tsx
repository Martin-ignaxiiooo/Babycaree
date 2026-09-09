import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Camera, X,
  Ruler, Star, Check, Clock, Loader2, Plus, Syringe,
} from "lucide-react";
import TopNav from "../components/TopNav";
import NotificacionDetalleModal from "../components/NotificacionDetalleModal";
import DiarioResumenMini from "../components/DiarioResumenMini";
import { marcarNotifLeida } from "../utils/notificacionesLeidas";
import DashboardEmbarazo from "./DashboardEmbarazo";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

// Icono que no existe en lucide-react, dibujado a mano para calzar con el diseño de referencia
function ScaleIcon({ size = 20, color = "var(--theme-primary)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="4" stroke={color} strokeWidth="2" />
      <ellipse cx="12" cy="12" rx="5" ry="3.2" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="1" fill={color} />
    </svg>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeBabyId, setActiveBabyId] = useState<string | null>(null);
  const [homeData, setHomeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Notificación cuyo detalle se está viendo en el popup de "Lo que se viene".
  const [notifDetalle, setNotifDetalle] = useState<any | null>(null);
  const [pesoInput, setPesoInput] = useState("");
  const [tallaInput, setTallaInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Foto de perfil del bebé
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoError, setFotoError] = useState("");
  const [confirmandoBorrarFoto, setConfirmandoBorrarFoto] = useState(false);

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

  const [growthError, setGrowthError] = useState("");

  // Rango realista para un niño de 0 a 12 años aprox. Evita errores como
  // escribir 3500 (confundiendo gramos con kilos) y que el guardado falle
  // silenciosamente por desbordar la columna numérica en la base de datos.
  const PESO_MIN_KG = 0.3;
  const PESO_MAX_KG = 60;
  const TALLA_MIN_CM = 20;
  const TALLA_MAX_CM = 180;

  const handleSaveGrowth = async () => {
    if (!pesoInput || !tallaInput || !activeBabyId) return;

    const peso = parseFloat(pesoInput);
    const talla = parseFloat(tallaInput);

    if (isNaN(peso) || peso < PESO_MIN_KG || peso > PESO_MAX_KG) {
      const pesoEnKg = peso / 1000;
      const sugerenciaConversion = peso > PESO_MAX_KG && pesoEnKg >= PESO_MIN_KG && pesoEnKg <= PESO_MAX_KG
        ? ` ¿Quisiste decir ${pesoEnKg.toFixed(2)}kg?`
        : "";
      setGrowthError(`El peso debe estar entre ${PESO_MIN_KG}kg y ${PESO_MAX_KG}kg.${sugerenciaConversion}`);
      return;
    }
    if (isNaN(talla) || talla < TALLA_MIN_CM || talla > TALLA_MAX_CM) {
      setGrowthError(`La talla debe estar entre ${TALLA_MIN_CM}cm y ${TALLA_MAX_CM}cm.`);
      return;
    }

    setGrowthError("");
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/v1/home/${activeBabyId}/crecimiento`, {
        peso,
        talla
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setIsModalOpen(false);
      setPesoInput("");
      setTallaInput("");
      
      // Refresh Dashboard data
      if (token) fetchDashboard(token, activeBabyId);
    } catch (error: any) {
      console.error(error);
      setGrowthError(error.response?.data?.error || "Error al guardar las medidas. Intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  // Redimensiona/comprime la foto en el navegador antes de subirla, para no
  // guardar imágenes pesadas en la base de datos (se guardan en base64).
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
    e.target.value = ""; // permite volver a elegir el mismo archivo después
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

      await axios.post(`${API_URL}/v1/perfiles-bebe/${activeBabyId}/foto`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Refrescar el dashboard para traer la nueva foto ya guardada en la BD
      if (token) fetchDashboard(token, activeBabyId);
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
      if (token) fetchDashboard(token, activeBabyId);
    } catch (error) {
      console.error(error);
      setFotoError("No se pudo quitar la foto. Intenta de nuevo.");
    } finally {
      setUploadingFoto(false);
    }
  };

  if (!user || loading) return <div style={{ padding: "40px", textAlign: "center", fontFamily: "Nunito", fontSize: "18px" }}>Cargando tu panel...</div>;

  // Early return for pregnancy dashboard
  if (homeData?.perfil?.estado === 'embarazo') {
    const notificaciones = homeData?.notificaciones || [];
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, var(--page-bg) 0%, var(--theme-bg-light) 100%)", fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column" }}>
        <TopNav user={user} notificaciones={notificaciones} onLogout={handleLogout} activePath="/dashboard" perfilEstado="embarazo" />
        <DashboardEmbarazo user={user} perfil={homeData.perfil} activeBabyId={activeBabyId!} />
      </div>
    );
  }

  const hero = homeData?.hero || { nombre: "Sin perfiles registrados", edad_exacta: "-", peso_kg: "-", talla_cm: "-", percentil: "-" };
  const notificaciones = homeData?.notificaciones || [];
  
  // Growth Chart Calculations (Evolución de Peso y Talla)
  const seriePeso = homeData?.crecimiento?.serie_peso || [];
  const serieTalla = homeData?.crecimiento?.serie_talla || [];
  const etiquetasFecha = homeData?.crecimiento?.etiquetas_fecha || [];
  const seriePesoOms = homeData?.crecimiento?.serie_peso_oms || [];
  const serieTallaOms = homeData?.crecimiento?.serie_talla_oms || [];
  
  // Create an array de 8 elementos máx, con padding si hay menos (igual que la referencia)
  const maxPoints = 8;
  const paddingNeeded = maxPoints - seriePeso.length;
  // El padding va al final para que los datos reales queden alineados a
  // la izquierda (antes se rellenaba al principio y los corría a la derecha).
  const padEnd = (arr: any[], filler: any) => (paddingNeeded > 0 ? [...arr, ...Array(paddingNeeded).fill(filler)] : arr.slice(-maxPoints));

  const displayPesos = padEnd(seriePeso, null);
  const displayTallas = padEnd(serieTalla, null);
  const displayFechas = padEnd(etiquetasFecha, "");
  const displayPesoOms = padEnd(seriePesoOms, null);
  const displayTallaOms = padEnd(serieTallaOms, null);

  // SVG Geometry
  const xPositions = [55, 94, 132, 171, 209, 248, 286, 325];
  // Paleta arcoíris para los puntos del gráfico de peso, igual que el diseño de referencia
  const dotColors = ["#E8D2F6", "#D4C0F4", "#A9D4F6", "#FAEDB4", "#FDC488", "#F7A4A7", "#D5A2BE", "#8D2EC9"];

  // Escala de peso: 0kg (abajo, y=85) a 15kg (arriba, y=10).
  const mapYPeso = (val: number | null) => {
    if (val === null || val === undefined || val === 0) return null;
    const y = 85 - (val * 5);
    return Math.max(10, Math.min(85, y));
  };
  // Escala de talla: 40cm (abajo, y=85) a 120cm (arriba, y=10).
  const mapYTalla = (val: number | null) => {
    if (val === null || val === undefined || val === 0) return null;
    const y = 85 - ((val - 40) / 80) * 75;
    return Math.max(10, Math.min(85, y));
  };

  const buildPoints = (arr: (number | null)[], mapY: (v: number | null) => number | null) => {
    let s = "";
    arr.forEach((w, i) => {
      const y = mapY(w);
      if (y !== null) s += `${xPositions[i]},${y} `;
    });
    return s;
  };

  const pesoPointsString = buildPoints(displayPesos, mapYPeso);
  const pesoOmsPointsString = buildPoints(displayPesoOms, mapYPeso);
  const tallaPointsString = buildPoints(displayTallas, mapYTalla);
  const tallaOmsPointsString = buildPoints(displayTallaOms, mapYTalla);

  // Polígono del área rellena bajo la curva de peso (misma línea + vuelta por la base)
  let areaPointsString = "";
  if (pesoPointsString.trim()) {
    const validIdx = displayPesos
      .map((w: number | null, i: number) => (mapYPeso(w) !== null ? i : null))
      .filter((i): i is number => i !== null);
    if (validIdx.length > 0) {
      const firstX = xPositions[validIdx[0]];
      const lastX = xPositions[validIdx[validIdx.length - 1]];
      areaPointsString = `${firstX},85 ${pesoPointsString}${lastX},85`;
    }
  }

  return (

    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(165deg, #F3EEFC 0%, #F1ECFB 40%, #FDF2F5 100%)",
      fontFamily: "'Nunito', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      <TopNav user={user} notificaciones={notificaciones} onLogout={handleLogout} activePath="/dashboard" perfilEstado={homeData?.perfil?.estado} />

      <div className="page-container">
        
        {/* ── HOME HERO FULL WIDTH ── */}
        <div style={{
          background: "linear-gradient(120deg, var(--theme-bg-light) 0%, var(--theme-bg-hover) 100%)",
          borderRadius: "26px",
          marginBottom: "22px",
          display: "flex",
          alignItems: "stretch",
          flexWrap: "wrap",
          gap: "20px",
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(124,92,191,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px", flex: 1, minWidth: "280px" }}>
            {/* Foto del bebé (subible por el usuario, blanco por defecto) */}
            <label
              htmlFor="foto-bebe-input"
              style={{
                position: "relative",
                width: "150px",
                minHeight: "140px",
                alignSelf: "stretch",
                background: "var(--surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
              title="Cambiar foto del bebé"
            >
              {hero.foto_perfil ? (
                <img
                  src={hero.foto_perfil}
                  alt={hero.nombre}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Camera size={38} color="#C9BEE8" strokeWidth={2} />
              )}

              {hero.foto_perfil && !uploadingFoto && !confirmandoBorrarFoto && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setConfirmandoBorrarFoto(true);
                  }}
                  title="Quitar foto"
                  aria-label="Quitar foto del bebé"
                  style={{
                    position: "absolute", top: "6px", right: "6px",
                    width: "24px", height: "24px", borderRadius: "50%",
                    background: "rgba(45,38,64,0.6)", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", padding: 0,
                  }}
                >
                  <X size={14} color="#fff" strokeWidth={2.5} />
                </button>
              )}

              {confirmandoBorrarFoto && !uploadingFoto && (
                <div
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  style={{
                    position: "absolute", inset: 0, background: "rgba(45,38,64,0.85)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: "8px", padding: "10px", textAlign: "center",
                  }}
                >
                  <span style={{ color: "#fff", fontSize: "11px", fontWeight: 700, lineHeight: 1.3 }}>
                    ¿Quitar foto?
                  </span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEliminarFoto(); }}
                      style={{
                        background: "var(--surface)", color: "#B91C1C", border: "none", borderRadius: "8px",
                        padding: "5px 10px", fontSize: "11px", fontWeight: 800, cursor: "pointer",
                      }}
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmandoBorrarFoto(false); }}
                      style={{
                        background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.5)",
                        borderRadius: "8px", padding: "5px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      No
                    </button>
                  </div>
                </div>
              )}

              {uploadingFoto && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(255,255,255,0.85)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Loader2 size={26} color="var(--theme-primary)" className="spin-icon" />
                </div>
              )}

              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "rgba(45,38,64,0.55)", color: "#fff",
                fontSize: "10px", fontWeight: 700, textAlign: "center", padding: "4px 0",
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
              <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "27px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>{hero.nombre}</div>
              <div style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 600 }}>{hero.edad_exacta}</div>
              {fotoError && (
                <div style={{ fontSize: "12px", color: "#DC2626", marginTop: "4px", fontWeight: 600 }}>{fotoError}</div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div className="hero-stats-grid" style={{ alignItems: "center", padding: "14px 24px 14px 0" }}>
              <div style={{ background: "var(--surface)", borderRadius: "20px", padding: "10px 16px", textAlign: "center", minWidth: "100px", boxShadow: "0 4px 14px rgba(45,38,64,0.06)" }}>
                <div className="stat-icon-circle" style={{ background: "#DED0F7" }}>
                  <ScaleIcon size={42} color="#7C5CBF" />
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Peso:</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text)" }}>{hero.peso_kg !== "-" && hero.peso_kg !== 0 ? `${hero.peso_kg}kg` : "N/A"}</div>
              </div>
              <div style={{ background: "var(--surface)", borderRadius: "20px", padding: "10px 16px", textAlign: "center", minWidth: "100px", boxShadow: "0 4px 14px rgba(45,38,64,0.06)" }}>
                <div className="stat-icon-circle" style={{ background: "#F7B8C4" }}>
                  <Ruler size={42} color="#7A3B45" strokeWidth={2.2} />
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Altura:</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text)" }}>{hero.talla_cm !== "-" && hero.talla_cm !== 0 ? `${hero.talla_cm}cm` : "N/A"}</div>
              </div>
              <div style={{ background: "var(--surface)", borderRadius: "20px", padding: "10px 16px", textAlign: "center", minWidth: "100px", boxShadow: "0 4px 14px rgba(45,38,64,0.06)" }}>
                <div className="stat-icon-circle" style={{ background: "#F7DE8B" }}>
                  <Star size={42} color="#8A6D1D" strokeWidth={2.2} />
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Percentil:</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text)" }}>P{hero.percentil}</div>
              </div>
            </div>

            {/* Fecha del último registro: deja claro a qué momento corresponden
                las medidas de arriba, en vez de parecer siempre "de hoy". */}
            {hero.fecha_medicion && (
              <div style={{
                textAlign: "center", fontSize: "12px",
                color: "var(--text-muted)", fontWeight: 600, marginTop: "-4px", paddingBottom: "4px",
              }}>
                {hero.medicion_es_nacimiento ? "Medidas de nacimiento · " : "Último registro · "}
                {new Date(hero.fecha_medicion).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            )}
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
              <div style={{ background: "var(--surface)", borderRadius: "26px", padding: "22px", boxShadow: "0 6px 24px rgba(124,92,191,0.07)" }}>
                <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "19px", fontWeight: 700, color: "var(--text)", marginBottom: "18px" }}>
                  Lo que se viene
                </h3>

                {notificaciones.map((n: any, idx: number) => {
                  // Colores/íconos por tipo real de notificación (no por prioridad
                  // genérica, para no rotular mal cosas como el artículo
                  // recomendado, que no es una "tarea completada").
                  const config: Record<string, { icon: any; color: string; bg: string; label: string }> = {
                    control_proximo: { icon: Clock, color: "#1E4E8C", bg: "linear-gradient(90deg, #8CC9F0 0%, #D7EEFF 100%)", label: "Agendado" },
                    vacuna_atrasada: { icon: Syringe, color: "#8A5212", bg: "linear-gradient(90deg, #FEAD53 0%, #FFE6CD 100%)", label: "Pendiente" },
                    vacuna_pendiente: { icon: Syringe, color: "#8A5212", bg: "linear-gradient(90deg, #FEAD53 0%, #FFE6CD 100%)", label: "Pendiente" },
                    vacuna_proxima: { icon: Syringe, color: "#1E4E8C", bg: "linear-gradient(90deg, #8CC9F0 0%, #D7EEFF 100%)", label: "Próximo" },
                    articulo: { icon: Check, color: "#7C5CBF", bg: "#E3D2FA", label: "Recomendado" },
                  };
                  const { icon: StatusIcon, color: statusColor, bg: statusBg, label: statusLabel } =
                    config[n.tipo] || config.articulo;

                  const d = n.detalle;
                  // En una cita interesa el "cuándo" exacto; en una vacuna,
                  // a qué edad corresponde (en semanas), que es como lo
                  // maneja el calendario del PNI.
                  let resumen = "";
                  if (d?.fecha_cita) {
                    const f = new Date(d.fecha_cita);
                    resumen = `${f.toLocaleDateString("es-CL", { day: "numeric", month: "short" })} · ${f.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}`;
                  } else if (d?.es_vacuna && d.meses_edad_recomendada != null) {
                    const semanas = Math.round(d.meses_edad_recomendada * 4.345);
                    resumen = d.meses_edad_recomendada === 0
                      ? "Al nacer"
                      : `${semanas} semanas`;
                  }

                  return (
                    <div key={idx}
                      onClick={() => {
                        marcarNotifLeida(activeBabyId, n);
                        // El artículo recomendado sí lleva a otra pantalla;
                        // citas y vacunas abren el detalle sin sacarte del inicio.
                        if (n.tipo === "articulo" && n.articulo_id) {
                          navigate(`/comunidad/articulo/${n.articulo_id}`);
                        } else {
                          setNotifDetalle(n);
                        }
                      }}
                      style={{
                        borderRadius: "999px", padding: "12px 18px", marginBottom: "10px",
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", cursor: "pointer",
                        background: statusBg,
                        transition: "transform 0.2s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateX(4px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <StatusIcon size={26} color={statusColor} strokeWidth={2.6} style={{ flexShrink: 0 }} />
                        <span style={{
                          fontSize: "14px", fontWeight: 700, color: "var(--text)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                        }}>
                          {n.tipo?.startsWith("vacuna_") ? `Vacuna: ${n.titulo}` : n.titulo}
                        </span>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: statusColor, flexShrink: 0, whiteSpace: "nowrap" }}>
                        {resumen || `(${statusLabel})`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── GRÁFICO DINÁMICO ── */}
            <div style={{ background: "var(--surface)", borderRadius: "26px", padding: "22px", boxShadow: "0 6px 24px rgba(124,92,191,0.07)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "19px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                  📈 Evolución de Crecimiento
                </h3>
                {(!homeData?.rol_acceso || !homeData.rol_acceso.startsWith('solo_lectura')) && (
                  <button 
                    onClick={() => { setIsModalOpen(true); setGrowthError(""); }}
                    style={{
                      background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))", color: "#fff",
                      padding: "9px 17px", borderRadius: "12px", border: "none",
                      fontSize: "13px", fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "6px",
                      boxShadow: "0 4px 14px var(--theme-shadow-light)",
                    }}
                  >
                    <Plus size={16} /> Registrar Medidas
                  </button>
                )}
              </div>

              {/* ── GRÁFICO DE PESO ── */}
              <div style={{ marginBottom: "28px" }}>
                <h4 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "15px", fontWeight: 700, color: "var(--text)", margin: "0 0 10px 0" }}>
                  Peso
                </h4>
                <div style={{ display: "flex", gap: "20px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
                    <span style={{ width: "16px", height: "3px", background: "var(--theme-primary)", borderRadius: "2px", display: "inline-block" }} />
                    Peso del bebé
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
                    <span style={{ width: "16px", height: "0", borderTop: "2px dashed #9CA3AF", display: "inline-block" }} />
                    Promedio OMS
                  </div>
                </div>
                <svg viewBox="0 0 340 120" style={{ width: "100%", height: "auto", overflow: "visible" }}>
                  <defs>
                    <linearGradient id="growthAreaGradientPeso" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--theme-primary)" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="var(--theme-primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <rect width="340" height="100" fill="#F9FAFB" rx="8"/>
                  <line x1="40" y1="10" x2="40" y2="85" stroke="#E5E7EB" strokeWidth="0.8"/>
                  <line x1="40" y1="85" x2="330" y2="85" stroke="#E5E7EB" strokeWidth="0.8"/>
                  <line x1="40" y1="35" x2="330" y2="35" stroke="#F3F4F6" strokeWidth="0.6"/>
                  <line x1="40" y1="60" x2="330" y2="60" stroke="#F3F4F6" strokeWidth="0.6"/>
                  <text x="35" y="13" textAnchor="end" fontSize="8" fill="#9CA3AF">15kg</text>
                  <text x="35" y="38" textAnchor="end" fontSize="8" fill="#9CA3AF">10kg</text>
                  <text x="35" y="63" textAnchor="end" fontSize="8" fill="#9CA3AF">5kg</text>
                  {displayFechas.map((fecha, idx) => (
                    <text key={idx} x={xPositions[idx]} y="105" textAnchor="middle" fontSize="9" fill="#9CA3AF" fontWeight="600">
                      {fecha || ""}
                    </text>
                  ))}
                  {areaPointsString && (
                    <polygon points={areaPointsString} fill="url(#growthAreaGradientPeso)" />
                  )}
                  {pesoOmsPointsString && (
                    <polyline points={pesoOmsPointsString} fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="4,3"/>
                  )}
                  {pesoPointsString && (
                    <polyline points={pesoPointsString} fill="none" stroke="var(--theme-primary)" strokeWidth="2.5" strokeLinejoin="round"/>
                  )}
                  {displayPesos.map((w: number | null, i: number) => {
                    const y = mapYPeso(w);
                    if (y === null) return null;
                    const isLast = i === maxPoints - 1 && w !== null;
                    return <circle key={i} cx={xPositions[i]} cy={y} r={isLast ? 5 : 4}
                      fill={dotColors[i] || "var(--theme-primary)"} stroke={isLast ? "#fff" : "#fff"} strokeWidth={isLast ? 2 : 1.2}/>;
                  })}
                </svg>
              </div>

              {/* ── GRÁFICO DE TALLA ── */}
              <div>
                <h4 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "15px", fontWeight: 700, color: "var(--text)", margin: "0 0 10px 0" }}>
                  Talla
                </h4>
                <div style={{ display: "flex", gap: "20px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
                    <span style={{ width: "16px", height: "3px", background: "var(--accent-coral, #E8927C)", borderRadius: "2px", display: "inline-block" }} />
                    Talla del bebé
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
                    <span style={{ width: "16px", height: "0", borderTop: "2px dashed #9CA3AF", display: "inline-block" }} />
                    Promedio OMS
                  </div>
                </div>
                <svg viewBox="0 0 340 120" style={{ width: "100%", height: "auto", overflow: "visible" }}>
                  <rect width="340" height="100" fill="#F9FAFB" rx="8"/>
                  <line x1="40" y1="10" x2="40" y2="85" stroke="#E5E7EB" strokeWidth="0.8"/>
                  <line x1="40" y1="85" x2="330" y2="85" stroke="#E5E7EB" strokeWidth="0.8"/>
                  <line x1="40" y1="35" x2="330" y2="35" stroke="#F3F4F6" strokeWidth="0.6"/>
                  <line x1="40" y1="60" x2="330" y2="60" stroke="#F3F4F6" strokeWidth="0.6"/>
                  <text x="35" y="13" textAnchor="end" fontSize="8" fill="#9CA3AF">120cm</text>
                  <text x="35" y="38" textAnchor="end" fontSize="8" fill="#9CA3AF">93cm</text>
                  <text x="35" y="63" textAnchor="end" fontSize="8" fill="#9CA3AF">67cm</text>
                  {displayFechas.map((fecha, idx) => (
                    <text key={idx} x={xPositions[idx]} y="105" textAnchor="middle" fontSize="9" fill="#9CA3AF" fontWeight="600">
                      {fecha || ""}
                    </text>
                  ))}
                  {tallaOmsPointsString && (
                    <polyline points={tallaOmsPointsString} fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="4,3"/>
                  )}
                  {tallaPointsString && (
                    <polyline points={tallaPointsString} fill="none" stroke="var(--accent-coral, #E8927C)" strokeWidth="2.5" strokeLinejoin="round"/>
                  )}
                  {displayTallas.map((w: number | null, i: number) => {
                    const y = mapYTalla(w);
                    if (y === null) return null;
                    const isLast = i === maxPoints - 1 && w !== null;
                    return <circle key={i} cx={xPositions[i]} cy={y} r={isLast ? 5 : 4}
                      fill="var(--accent-coral, #E8927C)" stroke={isLast ? "#fff" : "#fff"} strokeWidth={isLast ? 2 : 1.2}/>;
                  })}
                </svg>
              </div>
            </div>
          </div>

          {/* COLUMNA 2: Patrones del Diario (últimos 7 días, fijo, sin
              selector — la versión completa con más rango vive en /diario).
              Antes acá estaban los botones grandes de Módulos; se sacaron
              por ser redundantes con la barra de navegación. */}
          <div style={{ background: "var(--surface)", borderRadius: "26px", padding: "22px", boxShadow: "0 6px 24px rgba(124,92,191,0.07)" }}>
            <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "19px", fontWeight: 700, color: "var(--text)", marginBottom: "20px" }}>
              Patrones del Diario
            </h3>
            {activeBabyId && <DiarioResumenMini bebeId={activeBabyId} token={localStorage.getItem("token")!} />}
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
            background: "var(--surface)", padding: "32px", borderRadius: "26px", width: "100%", maxWidth: "400px",
            boxShadow: "0 20px 60px rgba(45,38,64,0.25)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "21px", fontWeight: 700, color: "var(--text)", margin: 0 }}>Registrar Medidas</h2>
              <button onClick={() => { setIsModalOpen(false); setGrowthError(""); }} style={{ background: "#F3F1F9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={18} color="#6B7280" />
              </button>
            </div>

            {growthError && (
              <div style={{
                background: "#FFF0F0", borderLeft: "4px solid #DC2626", borderRadius: "10px",
                padding: "12px 16px", marginBottom: "18px", fontSize: "13px", color: "#7F1D1D", fontWeight: 600,
              }}>
                {growthError}
              </div>
            )}
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "8px", color: "#4B5563" }}>Peso (kg)</label>
              <input 
                type="number" 
                step="0.01"
                value={pesoInput}
                onChange={e => { setPesoInput(e.target.value); setGrowthError(""); }}
                placeholder="Ej. 7.4"
                style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #E5E7EB", outline: "none", fontSize: "15px" }}
              />
            </div>

            <div style={{ marginBottom: "22px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "8px", color: "#4B5563" }}>Talla (cm)</label>
              <input 
                type="number" 
                step="0.1"
                value={tallaInput}
                onChange={e => { setTallaInput(e.target.value); setGrowthError(""); }}
                placeholder="Ej. 67.5"
                style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #E5E7EB", outline: "none", fontSize: "15px" }}
              />
            </div>

            <button 
              onClick={handleSaveGrowth}
              disabled={isSaving || !pesoInput || !tallaInput}
              style={{ 
                width: "100%", 
                background: (isSaving || !pesoInput || !tallaInput) ? "#D1D5DB" : "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
                color: "#fff", 
                padding: "16px", borderRadius: "16px", border: "none", 
                fontSize: "16px", fontWeight: 800, cursor: isSaving ? "not-allowed" : "pointer",
                boxShadow: (isSaving || !pesoInput || !tallaInput) ? "none" : "0 10px 26px var(--theme-shadow)",
              }}
            >
              {isSaving ? "Guardando..." : "Guardar Registro"}
            </button>
          </div>
        </div>
      )}

      {/* Popup de detalle de "Lo que se viene" */}
      <NotificacionDetalleModal notif={notifDetalle} onClose={() => setNotifDetalle(null)} />

    </div>
  );
}
