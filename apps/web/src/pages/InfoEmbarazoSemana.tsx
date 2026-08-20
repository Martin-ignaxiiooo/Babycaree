import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import TopNav from "../components/TopNav";
import {
  HITOS_POR_MES,
  ETIQUETA_POR_MES,
  mesDesdeSemanas,
} from "../components/BabyGrowthIcon";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

export default function InfoEmbarazoSemana() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const [user, setUser] = useState<any>(null);
  const [perfil, setPerfil] = useState<any>(location.state?.perfil || null);
  const [loading, setLoading] = useState(!location.state?.perfil);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (perfil || !id) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    axios
      .get(`${API_URL}/v1/home/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setPerfil(res.data?.perfil))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, perfil]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const semanas = perfil?.semanas_embarazo || 1;
  const porcentaje = semanas > 0 ? Math.round((semanas / 40) * 100) : 0;
  const mes = perfil?.mes_embarazo || mesDesdeSemanas(semanas);
  const hito = perfil?.hito_embarazo || HITOS_POR_MES[mes];
  const etiquetaMes = perfil?.etiqueta_mes_embarazo || ETIQUETA_POR_MES[mes];

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
    gap: "8px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, #FAF9FD 0%, #F6F2FF 100%)", fontFamily: "'Nunito', sans-serif" }}>
      <TopNav user={user} onLogout={handleLogout} activePath="/dashboard" perfilEstado="embarazo" />

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "28px clamp(12px, 4vw, 20px) 48px" }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "none", border: "none", color: "var(--theme-primary)",
            fontWeight: 800, fontSize: "14px", cursor: "pointer", padding: "8px 0", marginBottom: "18px",
          }}
        >
          <ArrowLeft size={18} /> Volver
        </button>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 size={28} color="var(--theme-primary)" className="spin-icon-info" />
            <style>{`
              @keyframes spin-info-kf { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              .spin-icon-info { animation: spin-info-kf 0.9s linear infinite; }
            `}</style>
          </div>
        ) : (
          <>
            {/* Hero: semana grande + progreso */}
            <div style={{
              background: "linear-gradient(120deg, var(--theme-darker) 0%, #B85C7E 55%, var(--theme-light) 100%)",
              borderRadius: "26px",
              padding: "32px clamp(20px, 4vw, 36px)",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "24px",
              flexWrap: "wrap",
            }}>
              <div style={{ position: "relative", width: "110px", height: "110px", flexShrink: 0 }}>
                <svg width="110" height="110" viewBox="0 0 132 132" style={{ transform: "rotate(-90deg)" }}>
                  <defs>
                    <linearGradient id="semanaRingGradientInfo" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFD166" />
                      <stop offset="50%" stopColor="#FF8FB1" />
                      <stop offset="100%" stopColor="#8ED1FC" />
                    </linearGradient>
                  </defs>
                  <circle cx="66" cy="66" r="56" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="12" />
                  <circle
                    cx="66" cy="66" r="56" fill="none"
                    stroke="url(#semanaRingGradientInfo)" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 56}
                    strokeDashoffset={2 * Math.PI * 56 * (1 - Math.min(porcentaje, 100) / 100)}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "26px", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{semanas}</div>
                  <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.85)", fontWeight: 800, textTransform: "uppercase" }}>semana</div>
                </div>
              </div>

              <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  background: "rgba(255,255,255,0.16)", color: "#fff",
                  padding: "6px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: 800,
                  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px",
                  border: "1px solid rgba(255,255,255,0.25)",
                }}>
                  <Sparkles size={13} /> Semana {semanas} de 40
                </div>
                <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 700, color: "#fff", lineHeight: 1.2, margin: 0 }}>
                  Datos sobre tu embarazo
                </h1>
                <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", marginTop: "6px", fontWeight: 600 }}>
                  Mes {mes} · {etiquetaMes} · {Math.min(porcentaje, 100)}% del camino
                </div>
              </div>
            </div>

            {/* Tarjeta: hito de la semana */}
            {hito && (
              <div style={cardStyle}>
                <div style={cardHeaderBannerStyle}>
                  <Sparkles size={18} />
                  Tu semana {semanas}
                </div>
                <div style={{ padding: "24px" }}>
                  <p style={{ fontSize: "15px", color: "#6B647F", lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" }}>
                    {hito}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
