import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CalendarPlus, Settings2, Loader2, ChevronRight, Camera, X } from "lucide-react";
import BabyGrowthIcon, { HITOS_POR_MES, mesDesdeSemanas } from "../components/BabyGrowthIcon";
import { ACCEPT_IMAGEN, resizeImageFile, validarImagen } from "../utils/imagen";

import { API_URL } from "../config/api";

interface DashboardEmbarazoProps {
  user: any;
  perfil: any;
  activeBabyId: string;
}

/** "15" y "OCT" por separado, para la insignia de fecha de cada cita. */
function partirFecha(iso: string) {
  const d = new Date(iso);
  return {
    dia: String(d.getDate()).padStart(2, "0"),
    mes: d.toLocaleDateString("es-CL", { month: "short" }).replace(".", "").toUpperCase(),
    hora: d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function DashboardEmbarazo({ user, perfil, activeBabyId }: DashboardEmbarazoProps) {
  const navigate = useNavigate();
  const [citas, setCitas] = useState<any[]>([]);
  const [articulos, setArticulos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Foto del perfil: se guarda local porque "perfil" llega como prop desde
  // arriba y este componente no controla su propio fetch.
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(perfil?.foto_perfil ?? null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [fotoError, setFotoError] = useState("");
  const [confirmandoBorrarFoto, setConfirmandoBorrarFoto] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!activeBabyId) return;
    const cargar = async () => {
      const h = { Authorization: `Bearer ${token}` };
      // allSettled: si los artículos fallan, las citas igual se muestran.
      const [c, a] = await Promise.allSettled([
        axios.get(`${API_URL}/v1/salud/${activeBabyId}/citas`, { headers: h }),
        axios.get(`${API_URL}/v1/comunidad/articulos`, { headers: h }),
      ]);
      if (c.status === "fulfilled") setCitas(Array.isArray(c.value.data) ? c.value.data : []);
      if (a.status === "fulfilled") setArticulos(Array.isArray(a.value.data) ? a.value.data : []);
      setLoading(false);
    };
    cargar();
  }, [activeBabyId, token]);

  const semanas = perfil?.semanas_embarazo || 1;
  const porcentaje = Math.min(Math.round((semanas / 40) * 100), 100);
  const mes = perfil?.mes_embarazo || mesDesdeSemanas(semanas);
  const hito = perfil?.hito_embarazo || HITOS_POR_MES[mes];
  const fruta = String(perfil?.fruta_embarazo || "semillita").toLowerCase();
  const nombre = user?.nombre ? user.nombre.split(" ")[0] : "";

  const ahora = new Date();
  const proximas = citas
    .filter((c) => new Date(c.fecha_cita) >= ahora)
    .sort((a, b) => new Date(a.fecha_cita).getTime() - new Date(b.fecha_cita).getTime())
    .slice(0, 4);

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !activeBabyId) return;

    const errorValidacion = validarImagen(file);
    if (errorValidacion) {
      setFotoError(errorValidacion);
      return;
    }

    setFotoError("");
    setSubiendoFoto(true);
    try {
      const blob = await resizeImageFile(file);
      const formData = new FormData();
      formData.append("foto", blob, "foto.jpg");
      const res = await axios.post(`${API_URL}/v1/perfiles-bebe/${activeBabyId}/foto`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      setFotoPerfil(res.data.foto_perfil);
    } catch {
      setFotoError("No se pudo subir la foto. Intenta de nuevo.");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleEliminarFoto = async () => {
    if (!activeBabyId || subiendoFoto) return;
    setFotoError("");
    setSubiendoFoto(true);
    setConfirmandoBorrarFoto(false);
    try {
      await axios.delete(`${API_URL}/v1/perfiles-bebe/${activeBabyId}/foto`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFotoPerfil(null);
    } catch {
      setFotoError("No se pudo quitar la foto. Intenta de nuevo.");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const R = 74;
  const circunferencia = 2 * Math.PI * R;

  return (
    <div style={{ minHeight: "100vh", background: "var(--page-bg)", fontFamily: "'Nunito', sans-serif" }}>
      {/* Cabecera morada; se extiende bajo las tarjetas para que floten
          sobre ella, como en el diseño. */}
      <div style={{ background: "linear-gradient(135deg, var(--header-from) 0%, var(--header-to) 100%)", paddingBottom: "90px" }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "28px 32px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <label
              title={fotoPerfil ? "Cambiar foto" : "Subir foto"}
              style={{
                position: "relative",
                width: "58px", height: "58px", borderRadius: "50%", flexShrink: 0,
                cursor: subiendoFoto ? "default" : "pointer",
                background: fotoPerfil ? `url(${fotoPerfil}) center/cover` : "rgba(255,255,255,0.22)",
                border: "2.5px solid rgba(255,255,255,0.55)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {subiendoFoto ? (
                <Loader2 size={20} color="#fff" className="spin-icon" />
              ) : !fotoPerfil ? (
                <Camera size={22} color="rgba(255,255,255,0.9)" />
              ) : null}

              {fotoPerfil && !subiendoFoto && !confirmandoBorrarFoto && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmandoBorrarFoto(true); }}
                  title="Quitar foto"
                  aria-label="Quitar la foto del perfil"
                  style={{
                    position: "absolute", top: "-4px", right: "-4px",
                    width: "22px", height: "22px", borderRadius: "50%",
                    background: "rgba(45,38,64,0.72)", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", padding: 0,
                  }}
                >
                  <X size={12} color="#fff" strokeWidth={2.5} />
                </button>
              )}

              {confirmandoBorrarFoto && !subiendoFoto && (
                <div
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    background: "rgba(45,38,64,0.88)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: "3px", padding: "4px", textAlign: "center",
                  }}
                >
                  <span style={{ color: "#fff", fontSize: "9px", fontWeight: 700, lineHeight: 1.2 }}>
                    ¿Quitar?
                  </span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEliminarFoto(); }}
                      style={{
                        background: "#fff", color: "#B91C1C", border: "none", borderRadius: "6px",
                        padding: "2px 7px", fontSize: "10px", fontWeight: 800, cursor: "pointer",
                      }}
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmandoBorrarFoto(false); }}
                      style={{
                        background: "rgba(255,255,255,0.22)", color: "#fff", border: "1px solid rgba(255,255,255,0.5)",
                        borderRadius: "6px", padding: "2px 7px", fontSize: "10px", fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      No
                    </button>
                  </div>
                </div>
              )}

              <input
                type="file"
                accept={ACCEPT_IMAGEN}
                onChange={handleUploadFoto}
                disabled={subiendoFoto}
                style={{ display: "none" }}
              />
            </label>

            <div>
              <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "32px", fontWeight: 700, color: "#fff", margin: 0 }}>
                Hola, {nombre}
              </h1>
              {fotoError && (
                <div style={{ fontSize: "12.5px", color: "#FFD9D9", fontWeight: 700, marginTop: "3px" }}>{fotoError}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1240px", margin: "-70px auto 0", padding: "0 32px 48px" }}>
        <div className="embarazo-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.65fr) minmax(300px, 1fr)", gap: "22px", alignItems: "start" }}>

          {/* Columna izquierda */}
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>

            <Tarjeta>
              <Titulo>Progreso del Embarazo</Titulo>
              <div style={{ display: "flex", alignItems: "center", gap: "26px", flexWrap: "wrap", marginTop: "18px" }}>
                <div style={{ position: "relative", width: "168px", height: "168px", flexShrink: 0 }}>
                  <svg width="168" height="168" viewBox="0 0 168 168" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="84" cy="84" r={R} fill="none" stroke="var(--theme-bg-light)" strokeWidth="11" />
                    <circle
                      cx="84" cy="84" r={R} fill="none"
                      stroke="var(--theme-primary)" strokeWidth="11" strokeLinecap="round"
                      strokeDasharray={circunferencia}
                      strokeDashoffset={circunferencia * (1 - porcentaje / 100)}
                      style={{ transition: "stroke-dashoffset .8s ease-out" }}
                    />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: "50%" }}>
                    <BabyGrowthIcon semanas={semanas} porcentaje={porcentaje} fill />
                  </div>
                </div>

                <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                  <p style={{ fontSize: "17px", color: "var(--text)", lineHeight: 1.55, margin: 0, fontWeight: 600 }}>
                    Semana {semanas} — ¡Tu beb&eacute; tiene el tama&ntilde;o de{" "}
                    {/^[aeiou]/.test(fruta) ? "un" : "una"}{" "}
                    <strong style={{ color: "var(--theme-primary)" }}>{fruta}</strong>!
                  </p>
                  <div style={{ marginTop: "12px", height: "7px", borderRadius: "4px", background: "var(--border)", overflow: "hidden" }}>
                    <div style={{ width: `${porcentaje}%`, height: "100%", background: "linear-gradient(90deg, var(--theme-primary), var(--theme-light))", borderRadius: "4px" }} />
                  </div>
                  <div style={{ fontSize: "12.5px", color: "var(--text-muted)", fontWeight: 700, marginTop: "7px" }}>
                    Semana {semanas} de 40 &middot; {porcentaje}% del camino
                  </div>
                </div>
              </div>
            </Tarjeta>

            {hito && (
              <Tarjeta>
                <Titulo>Tu semana {semanas}</Titulo>
                <p style={{ fontSize: "14.5px", color: "var(--text-muted)", lineHeight: 1.75, marginTop: "12px", whiteSpace: "pre-line" }}>
                  {hito}
                </p>
              </Tarjeta>
            )}

            <Tarjeta>
              <Titulo>Art&iacute;culos Recomendados</Titulo>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
                {loading ? (
                  <Loader2 size={20} className="spin-icon" />
                ) : articulos.length === 0 ? (
                  <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
                    Pronto habr&aacute; contenido para esta etapa.
                  </p>
                ) : (
                  articulos.slice(0, 3).map((a: any) => (
                    <button
                      key={a.id}
                      onClick={() => navigate(`/comunidad/articulo/${a.id}`)}
                      style={{
                        background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "12px",
                        padding: "14px 16px", textAlign: "left", cursor: "pointer", width: "100%",
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
                        fontFamily: "'Nunito', sans-serif",
                      }}
                    >
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{a.titulo}</span>
                      <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    </button>
                  ))
                )}
              </div>
            </Tarjeta>
          </div>

          {/* Columna derecha: citas */}
          <Tarjeta style={{ display: "flex", flexDirection: "column", minHeight: "420px" }}>
            <Titulo>Mis Citas Pr&oacute;ximas</Titulo>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "18px", flex: 1 }}>
              {loading ? (
                <Loader2 size={20} className="spin-icon" />
              ) : proximas.length === 0 ? (
                <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                  No tienes controles agendados. A&ntilde;ade el pr&oacute;ximo para que te lo recordemos.
                </p>
              ) : (
                proximas.map((c: any) => {
                  const f = partirFecha(c.fecha_cita);
                  return (
                    <div
                      key={c.id}
                      style={{
                        display: "flex", alignItems: "center", gap: "14px",
                        background: "var(--surface-2)", border: "1px solid var(--border)",
                        borderRadius: "14px", padding: "12px 14px",
                      }}
                    >
                      <div style={{ textAlign: "center", flexShrink: 0, minWidth: "42px" }}>
                        <div style={{ fontSize: "21px", fontWeight: 900, color: "var(--text)", lineHeight: 1, fontFamily: "'Baloo 2', sans-serif" }}>
                          {f.dia}
                        </div>
                        <div style={{ fontSize: "10.5px", fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                          {f.mes}
                        </div>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text)" }}>
                          {c.especialidad || (c.tipo === "control" ? "Control" : "Cita m\u00e9dica")}
                        </div>
                        <div style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "1px" }}>
                          {f.hora}{c.medico ? ` \u00b7 ${c.medico}` : ""}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={() => navigate("/salud")} style={btnSecundario}>
                <Settings2 size={16} /> Gestionar
              </button>
              <button onClick={() => navigate("/salud")} style={btnPrimario}>
                <CalendarPlus size={16} /> A&ntilde;adir Cita
              </button>
            </div>
          </Tarjeta>
        </div>
      </div>

      {/* En pantallas angostas las dos columnas se apilan. */}
      <style>{`
        @media (max-width: 900px) {
          .embarazo-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function Tarjeta({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--surface)", borderRadius: "20px", padding: "24px 26px",
      boxShadow: "0 6px 28px rgba(90,60,150,0.08)", ...style,
    }}>
      {children}
    </div>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "19px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
      {children}
    </h2>
  );
}

const btnBase: React.CSSProperties = {
  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
  padding: "13px 10px", borderRadius: "12px", cursor: "pointer",
  fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "13.5px",
  whiteSpace: "nowrap", border: "none",
};

const btnPrimario: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
  color: "#fff",
  boxShadow: "0 6px 16px rgba(139,95,214,0.28)",
};

const btnSecundario: React.CSSProperties = {
  ...btnBase,
  background: "var(--theme-bg-light)",
  color: "var(--theme-primary)",
};
