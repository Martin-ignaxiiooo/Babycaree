import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Camera, X,
  Ruler, Star, Check, Clock, Loader2, Lollipop, Plus,
} from "lucide-react";
import TopNav from "../components/TopNav";
import DashboardEmbarazo from "./DashboardEmbarazo";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

// Iconos que no existen en lucide-react, dibujados a mano para calzar con el diseño de referencia
function BabyFaceIcon({ size = 28 }: { size?: number }) {
  const stroke = "#4A3770";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Orejas */}
      <circle cx="9" cy="25" r="4.5" fill="#FBD8B8" stroke={stroke} strokeWidth="1.6" />
      <circle cx="39" cy="25" r="4.5" fill="#FBD8B8" stroke={stroke} strokeWidth="1.6" />
      {/* Cabeza */}
      <circle cx="24" cy="24" r="17" fill="#FBD8B8" stroke={stroke} strokeWidth="1.8" />
      {/* Remolino de pelo */}
      <path d="M21 9c1.5-1.3 4-1.3 4.5 0.5c0.4 1.5-1 2-2 1.2" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" fill="none" />
      {/* Ojo izquierdo: punto */}
      <circle cx="17.5" cy="23" r="1.8" fill={stroke} />
      {/* Ojo derecho: guiño (curva) */}
      <path d="M27.5 23c1 -1.6 3 -1.6 4 0" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Nariz */}
      <circle cx="23" cy="27.5" r="0.9" fill={stroke} opacity="0.55" />
      {/* Sonrisa */}
      <path d="M19.5 30c1.4 2 3 2.8 4.5 2.8s3.1-0.8 4.5-2.8" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Cachetes */}
      <circle cx="13.5" cy="29" r="2.2" fill="#F4A0A0" opacity="0.6" />
      <circle cx="34.5" cy="29" r="2.2" fill="#F4A0A0" opacity="0.6" />
    </svg>
  );
}

function ScaleIcon({ size = 20, color = "var(--theme-primary)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="4" stroke={color} strokeWidth="2" />
      <ellipse cx="12" cy="12" rx="5" ry="3.2" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="1" fill={color} />
    </svg>
  );
}

function HeartPlusIcon({ size = 32 }: { size?: number }) {
  const stroke = "#4A3770";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path
        d="M24 40 C24 40 6 28.5 6 15.5 C6 9 11 5 16.5 5 C20.3 5 23 7.6 24 9.5 C25 7.6 27.7 5 31.5 5 C37 5 42 9 42 15.5 C42 28.5 24 40 24 40 Z"
        fill="#F4AAB6" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round"
      />
      <path d="M15 12c-4 1-5 5-3.5 9" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" fill="none" />
      <polygon
        points="32,23 38,23 38,27 42,27 42,33 38,33 38,37 32,37 32,33 28,33 28,27 32,27"
        fill="#B9AEEA" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round"
      />
    </svg>
  );
}

function ComunidadIcon({ size = 32 }: { size?: number }) {
  const stroke = "#4A3770";
  // Forma de globo de diálogo (rect redondeado + colita), estilo lucide MessageSquare
  const bubblePath = "M2 4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V4z";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <g transform="translate(3,4) scale(1.35)">
        <path d={bubblePath} fill="#B9AEEA" stroke={stroke} strokeWidth="1" strokeLinejoin="round" />
        <circle cx="8" cy="9" r="1" fill={stroke} />
        <circle cx="12" cy="9" r="1" fill={stroke} />
        <circle cx="16" cy="9" r="1" fill={stroke} />
      </g>
      <g transform="translate(45,26) scale(-1.05,1.05)">
        <path d={bubblePath} fill="#FBD97B" stroke={stroke} strokeWidth="1" strokeLinejoin="round" />
        <circle cx="8" cy="9" r="1" fill={stroke} />
        <circle cx="12" cy="9" r="1" fill={stroke} />
        <circle cx="16" cy="9" r="1" fill={stroke} />
      </g>
    </svg>
  );
}

function GaleriaIcon({ size = 32 }: { size?: number }) {
  const stroke = "#4A3770";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <clipPath id="galeriaInnerClip">
          <rect x="10" y="15" width="21" height="15" rx="1" />
        </clipPath>
      </defs>
      {/* Foto de atrás (rotada, asoma detrás) */}
      <rect x="15" y="7" width="24" height="24" rx="3" fill="#E4D9F7" stroke={stroke} strokeWidth="1.3" transform="rotate(9 27 19)" />
      {/* Foto principal */}
      <rect x="7" y="11" width="26" height="24" rx="3" fill="#FDFBF6" stroke={stroke} strokeWidth="1.7" />
      <g clipPath="url(#galeriaInnerClip)">
        <rect x="10" y="15" width="21" height="15" fill="#BFE3F5" />
        <circle cx="16" cy="19.5" r="2.4" fill="#FBD97B" stroke={stroke} strokeWidth="0.8" />
        <polygon points="10,30 18,20 24,30" fill="#6FBF73" />
        <polygon points="19,30 26,21.5 31,30" fill="#8ED18F" />
      </g>
      <rect x="10" y="15" width="21" height="15" rx="1" fill="none" stroke={stroke} strokeWidth="1" />
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
  
  // Create an array of 8 elementos máx, con padding si hay menos (igual que la referencia)
  const maxPoints = 8;
  const paddingNeeded = maxPoints - seriePeso.length;
  const displayPesos = paddingNeeded > 0 
    ? [...Array(paddingNeeded).fill(null), ...seriePeso] 
    : seriePeso.slice(-maxPoints);
    
  const displayFechas = paddingNeeded > 0
    ? [...Array(paddingNeeded).fill(""), ...etiquetasFecha]
    : etiquetasFecha.slice(-maxPoints);

  const displayOms = paddingNeeded > 0
    ? [...Array(paddingNeeded).fill(null), ...serieOms]
    : serieOms.slice(-maxPoints);

  // SVG Geometry
  const xPositions = [55, 94, 132, 171, 209, 248, 286, 325];
  // Paleta arcoíris para los puntos del gráfico, igual que el diseño de referencia
  const dotColors = ["#E8D2F6", "#D4C0F4", "#A9D4F6", "#FAEDB4", "#FDC488", "#F7A4A7", "#D5A2BE", "#8D2EC9"];
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

  // Polígono del área rellena bajo la curva (misma línea + vuelta por la base)
  let areaPointsString = "";
  if (pointsString.trim()) {
    const validIdx = displayPesos
      .map((w: number | null, i: number) => (mapY(w) !== null ? i : null))
      .filter((i): i is number => i !== null);
    if (validIdx.length > 0) {
      const firstX = xPositions[validIdx[0]];
      const lastX = xPositions[validIdx[validIdx.length - 1]];
      areaPointsString = `${firstX},85 ${pointsString}${lastX},85`;
    }
  }

  return (

    <div style={{
      minHeight: "100vh",
      background: "#F1ECFB",
      fontFamily: "'Nunito', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      <TopNav user={user} notificaciones={notificaciones} onLogout={handleLogout} activePath="/dashboard" perfilEstado={homeData?.perfil?.estado} />

      <div className="page-container">
        
        {/* ── HOME HERO FULL WIDTH ── */}
        <div style={{
          background: "var(--theme-bg-light)",
          borderRadius: "24px",
          marginBottom: "22px",
          display: "flex",
          alignItems: "stretch",
          flexWrap: "wrap",
          gap: "20px",
          overflow: "hidden",
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
                background: "#fff",
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
                        background: "#fff", color: "#B91C1C", border: "none", borderRadius: "8px",
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
              <div style={{ fontSize: "26px", fontWeight: 900, color: "var(--theme-darker)", marginBottom: "4px" }}>{hero.nombre}</div>
              <div style={{ fontSize: "14px", color: "var(--theme-dark)", opacity: 0.75 }}>{hero.edad_exacta}</div>
              {fotoError && (
                <div style={{ fontSize: "12px", color: "#DC2626", marginTop: "4px", fontWeight: 600 }}>{fotoError}</div>
              )}
            </div>
          </div>

          <div className="hero-stats-grid" style={{ alignItems: "center", padding: "14px 24px 14px 0" }}>
            <div style={{ background: "#fff", borderRadius: "20px", padding: "10px 16px", textAlign: "center", minWidth: "100px", boxShadow: "0 4px 14px rgba(45,38,64,0.06)" }}>
              <div className="stat-icon-circle" style={{ background: "#DED0F7" }}>
                <ScaleIcon size={42} color="#7C5CBF" />
              </div>
              <div style={{ fontSize: "12px", color: "#8A849C", fontWeight: 600 }}>Peso:</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--theme-darker)" }}>{hero.peso_kg !== "-" && hero.peso_kg !== 0 ? `${hero.peso_kg}kg` : "N/A"}</div>
            </div>
            <div style={{ background: "#fff", borderRadius: "20px", padding: "10px 16px", textAlign: "center", minWidth: "100px", boxShadow: "0 4px 14px rgba(45,38,64,0.06)" }}>
              <div className="stat-icon-circle" style={{ background: "#F7B8C4" }}>
                <Ruler size={42} color="#7A3B45" strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: "12px", color: "#8A849C", fontWeight: 600 }}>Altura:</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--theme-darker)" }}>{hero.talla_cm !== "-" && hero.talla_cm !== 0 ? `${hero.talla_cm}cm` : "N/A"}</div>
            </div>
            <div style={{ background: "#fff", borderRadius: "20px", padding: "10px 16px", textAlign: "center", minWidth: "100px", boxShadow: "0 4px 14px rgba(45,38,64,0.06)" }}>
              <div className="stat-icon-circle" style={{ background: "#F7DE8B" }}>
                <Star size={42} color="#8A6D1D" strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: "12px", color: "#8A849C", fontWeight: 600 }}>Percentil:</div>
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
              <div style={{ background: "#fff", borderRadius: "24px", padding: "22px", boxShadow: "0 4px 20px rgba(0,0,0,.04)" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--theme-darker)", marginBottom: "18px" }}>
                  Próximas Tareas
                </h3>

                {notificaciones.map((n: any, idx: number) => {
                  // Estilo tipo checklist: completado (lavanda) / pendiente (naranja) / próximo (celeste)
                  // Colores tomados directo del diseño de referencia (Stitch AI)
                  const esUrgente = n.prioridad === 'alta';
                  const esProxima = n.prioridad === 'media';
                  const StatusIcon = esUrgente ? Clock : esProxima ? Lollipop : Check;
                  const statusColor = esUrgente ? "#8A5212" : esProxima ? "#1E4E8C" : "#7C5CBF";
                  const statusBg = esUrgente
                    ? "linear-gradient(90deg, #FEAD53 0%, #FFE6CD 100%)"
                    : esProxima
                    ? "linear-gradient(90deg, #8CC9F0 0%, #D7EEFF 100%)"
                    : "#E3D2FA";
                  const statusLabel = esUrgente ? "Pendiente" : esProxima ? "Próximo" : "Completado";

                  return (
                    <div key={idx}
                      onClick={() => n.tipo === "articulo" && n.articulo_id ? navigate(`/comunidad/articulo/${n.articulo_id}`) : navigate("/salud")}
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
            <div style={{ background: "#fff", borderRadius: "24px", padding: "22px", boxShadow: "0 4px 20px rgba(0,0,0,.04)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--theme-darker)", margin: 0 }}>
                  📈 Evolución de Crecimiento
                </h3>
                {(!homeData?.rol_acceso || !homeData.rol_acceso.startsWith('solo_lectura')) && (
                  <button 
                    onClick={() => { setIsModalOpen(true); setGrowthError(""); }}
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
                <defs>
                  <linearGradient id="growthAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--theme-primary)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--theme-primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <rect width="340" height="100" fill="#F9FAFB" rx="8"/>
                
                {/* Y Axes Lines */}
                <line x1="40" y1="10" x2="40" y2="85" stroke="#E5E7EB" strokeWidth="0.8"/>
                <line x1="40" y1="85" x2="330" y2="85" stroke="#E5E7EB" strokeWidth="0.8"/>
                <line x1="40" y1="35" x2="330" y2="35" stroke="#F3F4F6" strokeWidth="0.6"/>
                <line x1="40" y1="60" x2="330" y2="60" stroke="#F3F4F6" strokeWidth="0.6"/>
                
                {/* Y Axis Labels */}
                <text x="35" y="13" textAnchor="end" fontSize="8" fill="#9CA3AF">15kg</text>
                <text x="35" y="38" textAnchor="end" fontSize="8" fill="#9CA3AF">10kg</text>
                <text x="35" y="63" textAnchor="end" fontSize="8" fill="#9CA3AF">5kg</text>
                
                {/* X Axis Labels (Dates) */}
                {displayFechas.map((fecha, idx) => (
                  <text key={idx} x={xPositions[idx]} y="105" textAnchor="middle" fontSize="9" fill="#9CA3AF" fontWeight="600">
                    {fecha || ""}
                  </text>
                ))}
                
                {/* Área rellena bajo la curva */}
                {areaPointsString && (
                  <polygon points={areaPointsString} fill="url(#growthAreaGradient)" />
                )}

                {/* Dynamic Data Line */}
                {pointsString && (
                  <polyline points={pointsString} fill="none" stroke="var(--theme-primary)" strokeWidth="2.5" strokeLinejoin="round"/>
                )}
                
                {/* Dynamic Data Points */}
                {displayPesos.map((w: number | null, i: number) => {
                  const y = mapY(w);
                  if (y === null) return null;
                  const isLast = i === maxPoints - 1 && w !== null;
                  return <circle key={i} cx={xPositions[i]} cy={y} r={isLast ? 5 : 4}
                    fill={dotColors[i] || "var(--theme-primary)"} stroke={isLast ? "#fff" : "#fff"} strokeWidth={isLast ? 2 : 1.2}/>;
                })}
              </svg>
            </div>
          </div>

          {/* COLUMNA 2: Módulos */}
          <div style={{ background: "#fff", borderRadius: "24px", padding: "22px", boxShadow: "0 4px 20px rgba(0,0,0,.04)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--theme-darker)", marginBottom: "20px" }}>
              Módulos
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>

              {[
                { icon: BabyFaceIcon, label: "Perfil", hoverBg: "var(--theme-bg-light)", hoverBorder: "var(--theme-primary)", onClick: () => navigate(`/perfil/${hero.id}`) },
                { icon: HeartPlusIcon, label: "Salud", hoverBg: "#FFF0F0", hoverBorder: "#F4A0A0", onClick: () => navigate("/salud") },
                { icon: ComunidadIcon, label: "Comunidad", hoverBg: "#F3EEFD", hoverBorder: "#B39DDB", onClick: () => navigate("/comunidad") },
                { icon: GaleriaIcon, label: "Galería", hoverBg: "#E8F0FE", hoverBorder: "#6B9BF4", onClick: () => navigate("/galeria") },
              ].map(({ icon: Icon, label, hoverBg, hoverBorder, onClick }) => (
                <div key={label} onClick={onClick} style={{ background: "#F9FAFB", padding: "10px 8px", borderRadius: "20px", textAlign: "center", cursor: "pointer", border: "2px solid transparent", transition: "all 0.2s" }}
                     onMouseEnter={e => { e.currentTarget.style.borderColor = hoverBorder; e.currentTarget.style.background = hoverBg; }}
                     onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "#F9FAFB"; }}>
                  <div className="module-icon-wrap">
                    <Icon size={96} />
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
              <button onClick={() => { setIsModalOpen(false); setGrowthError(""); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={24} color="#6B7280" />
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
