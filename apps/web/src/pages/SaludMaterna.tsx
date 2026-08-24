import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2, Heart, Scale, CheckCircle2, ChevronRight } from "lucide-react";
import TopNav from "../components/TopNav";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

/** Los síntomas frecuentes del embarazo, para no obligar a escribirlos. */
const SINTOMAS = [
  { clave: "nauseas", etiqueta: "Náuseas", emoji: "🤢" },
  { clave: "fatiga", etiqueta: "Fatiga", emoji: "😴" },
  { clave: "dolor_cabeza", etiqueta: "Dolor de cabeza", emoji: "🤕" },
  { clave: "hinchazon", etiqueta: "Hinchazón", emoji: "💧" },
  { clave: "acidez", etiqueta: "Acidez", emoji: "🔥" },
  { clave: "contracciones", etiqueta: "Contracciones", emoji: "⚡" },
];

const TRIMESTRE = (semanas: number) =>
  semanas <= 13 ? "Primer" : semanas <= 27 ? "Segundo" : "Tercer";

export default function SaludMaterna() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [bebeId, setBebeId] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<any>(null);
  const [datos, setDatos] = useState<any>(null);
  const [articulos, setArticulos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState<null | "peso" | "presion" | "inicial">(null);
  const [valor1, setValor1] = useState("");
  const [valor2, setValor2] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [elegidos, setElegidos] = useState<string[]>([]);
  const [notaSintomas, setNotaSintomas] = useState("");
  const [guardandoSintomas, setGuardandoSintomas] = useState(false);
  const [okSintomas, setOkSintomas] = useState(false);

  useEffect(() => {
    if (!token) { navigate("/"); return; }
    const id = localStorage.getItem("selectedBabyId");
    if (!id) { navigate("/seleccionar-perfil"); return; }
    setBebeId(id);
  }, [token, navigate]);

  const cargar = useCallback(async () => {
    if (!bebeId) return;
    const h = { Authorization: `Bearer ${token}` };
    const [m, p, a] = await Promise.allSettled([
      fetch(`${API_URL}/v1/salud/${bebeId}/materna`, { headers: h }),
      fetch(`${API_URL}/v1/home/${bebeId}`, { headers: h }),
      fetch(`${API_URL}/v1/comunidad/articulos`, { headers: h }),
    ]);
    if (m.status === "fulfilled" && m.value.ok) setDatos(await m.value.json());
    if (p.status === "fulfilled" && p.value.ok) setPerfil((await p.value.json()).perfil);
    if (a.status === "fulfilled" && a.value.ok) setArticulos(await a.value.json());
    setLoading(false);
  }, [bebeId, token]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    setGuardando(true);
    setError("");
    try {
      let url = `${API_URL}/v1/salud/${bebeId}/materna`;
      let metodo = "POST";
      let cuerpo: any;

      if (modal === "peso") cuerpo = { peso_kg: valor1 };
      else if (modal === "presion") cuerpo = { presion_sistolica: valor1, presion_diastolica: valor2 };
      else { url += "/peso-inicial"; metodo = "PATCH"; cuerpo = { peso_pregestacional_kg: valor1 }; }

      const res = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(cuerpo),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "No se pudo guardar.");
      setModal(null); setValor1(""); setValor2("");
      cargar();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const guardarSintomas = async () => {
    if (elegidos.length === 0) return;
    setGuardandoSintomas(true);
    try {
      await fetch(`${API_URL}/v1/salud/${bebeId}/materna/sintomas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sintomas: elegidos, nota: notaSintomas }),
      });
      setElegidos([]); setNotaSintomas(""); setOkSintomas(true);
      setTimeout(() => setOkSintomas(false), 3000);
      cargar();
    } finally {
      setGuardandoSintomas(false);
    }
  };

  const semanas = perfil?.semanas_embarazo ?? 0;
  const peso = datos?.ultimo_peso;
  const presion = datos?.ultima_presion;
  const subida = datos?.subida_kg;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F5FC" }}>
        <TopNav user={user} activePath="/salud" perfilEstado="embarazo" />
        <div style={{ textAlign: "center", padding: "80px" }}><Loader2 size={28} className="spin-icon" /></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F5FC", fontFamily: "'Nunito', sans-serif" }}>
      <TopNav user={user} activePath="/salud" perfilEstado="embarazo" />

      <div style={{ background: "linear-gradient(135deg, #8B5FD6 0%, #A47BE8 100%)", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "26px 32px 0" }}>
          {semanas > 0 && (
            <span style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", color: "#fff", borderRadius: "100px", padding: "5px 14px", fontSize: "11.5px", fontWeight: 800, letterSpacing: "0.5px", marginBottom: "10px" }}>
              SEMANA {semanas} DE 40
            </span>
          )}
          <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "31px", fontWeight: 700, color: "#fff", margin: 0 }}>
            Mi Salud{semanas > 0 ? ` — ${TRIMESTRE(semanas)} Trimestre` : ""}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: "1240px", margin: "-60px auto 0", padding: "0 32px 48px" }}>
        <div className="sm-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(280px, 0.9fr)", gap: "20px", alignItems: "start" }}>

          {/* Peso */}
          <Tarjeta>
            <Encabezado icono={<Scale size={17} color="#8B5FD6" />}>Peso</Encabezado>
            {peso ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "10px" }}>
                  <span style={{ fontSize: "40px", fontWeight: 900, color: "#3F3A52", fontFamily: "'Baloo 2', sans-serif", lineHeight: 1 }}>
                    {Number(peso.peso_kg)}
                  </span>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#A99FC4" }}>kg</span>
                </div>
                {subida != null && (
                  <div style={{ marginTop: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", fontWeight: 800, color: "#8A849C", marginBottom: "6px" }}>
                      <span>DESDE EL INICIO</span>
                      <span style={{ color: "#8B5FD6" }}>{subida > 0 ? "+" : ""}{subida} KG</span>
                    </div>
                    <div style={{ height: "7px", borderRadius: "4px", background: "#EDE7F9", overflow: "hidden" }}>
                      {/* La barra usa 16 kg como referencia visual del rango
                          habitual de aumento. No es una meta médica ni un
                          límite: solo da escala al número. */}
                      <div style={{ width: `${Math.min(Math.max((subida / 16) * 100, 0), 100)}%`, height: "100%", background: "linear-gradient(90deg, #8B5FD6, #C0A9EE)" }} />
                    </div>
                  </div>
                )}
                {datos?.peso_pregestacional_kg == null && (
                  <button onClick={() => setModal("inicial")} style={{ ...enlace, marginTop: "12px" }}>
                    Registra tu peso previo para ver cuánto llevas
                  </button>
                )}
              </>
            ) : (
              <p style={{ fontSize: "13.5px", color: "#8A849C", marginTop: "10px", lineHeight: 1.6 }}>
                Aún no has registrado tu peso.
              </p>
            )}
            <button onClick={() => setModal("peso")} style={{ ...btnSuave, marginTop: "16px" }}>
              <Plus size={15} /> Registrar peso
            </button>
          </Tarjeta>

          {/* Presión arterial */}
          <Tarjeta>
            <Encabezado icono={<Heart size={17} color="#8B5FD6" />}>Presión Arterial</Encabezado>
            {presion ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "10px" }}>
                  <span style={{ fontSize: "40px", fontWeight: 900, color: "#3F3A52", fontFamily: "'Baloo 2', sans-serif", lineHeight: 1 }}>
                    {presion.presion_sistolica}/{presion.presion_diastolica}
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#A99FC4" }}>mmHg</span>
                </div>
                <div style={{ background: "#FAF8FE", border: "1px solid #EDE7F9", borderRadius: "12px", padding: "12px 14px", marginTop: "14px", fontSize: "12.5px", color: "#6B647F", lineHeight: 1.55 }}>
                  Último registro del{" "}
                  {new Date(presion.fecha_registro + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long" })}.
                  {/* No se interpreta el valor a propósito: decir si una
                      presión es normal en el embarazo es diagnóstico, y eso
                      le corresponde a la matrona o al médico. */}
                </div>
              </>
            ) : (
              <p style={{ fontSize: "13.5px", color: "#8A849C", marginTop: "10px", lineHeight: 1.6 }}>
                Aún no has registrado tu presión.
              </p>
            )}
            <button onClick={() => setModal("presion")} style={{ ...btnPrimario, marginTop: "16px" }}>
              <Plus size={15} /> Nuevo registro
            </button>
          </Tarjeta>

          {/* Artículos */}
          <Tarjeta>
            <Encabezado>Artículos Recomendados</Encabezado>
            <div style={{ display: "flex", flexDirection: "column", gap: "9px", marginTop: "14px" }}>
              {articulos.length === 0 ? (
                <p style={{ fontSize: "13.5px", color: "#8A849C", margin: 0 }}>Pronto habrá contenido.</p>
              ) : (
                articulos.slice(0, 3).map((a: any) => (
                  <button key={a.id} onClick={() => navigate(`/comunidad/articulo/${a.id}`)} style={filaArticulo}>
                    <div style={{ textAlign: "left", minWidth: 0 }}>
                      <span style={{ display: "inline-block", background: "#F3EEFC", color: "#8B5FD6", borderRadius: "100px", padding: "2px 9px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", marginBottom: "5px" }}>
                        {a.categoria}
                      </span>
                      <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#3F3A52", lineHeight: 1.4 }}>{a.titulo}</div>
                    </div>
                    <ChevronRight size={15} color="#A99FC4" style={{ flexShrink: 0 }} />
                  </button>
                ))
              )}
            </div>
          </Tarjeta>

          {/* Síntomas: ocupa las dos primeras columnas */}
          <div style={{ gridColumn: "span 2" }}>
            <Tarjeta>
              <Encabezado>Síntomas Físicos</Encabezado>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px", marginTop: "16px" }}>
                {SINTOMAS.map((s) => {
                  const on = elegidos.includes(s.clave);
                  return (
                    <button
                      key={s.clave}
                      onClick={() => setElegidos(on ? elegidos.filter((x) => x !== s.clave) : [...elegidos, s.clave])}
                      style={{
                        background: on ? "linear-gradient(135deg, #8B5FD6, #A47BE8)" : "#FAF8FE",
                        border: on ? "1.5px solid #8B5FD6" : "1.5px solid #EDE7F9",
                        color: on ? "#fff" : "#3F3A52",
                        borderRadius: "14px", padding: "14px 8px", cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                        fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "12.5px",
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>{s.emoji}</span>
                      {s.etiqueta}
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: "16px" }}>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "#8A849C", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "7px" }}>
                  Notas adicionales
                </label>
                <input
                  value={notaSintomas}
                  onChange={(e) => setNotaSintomas(e.target.value)}
                  placeholder="Ej. Me sentí muy cansada después de almorzar…"
                  style={input}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                {okSintomas && (
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#3E8E6E", fontSize: "13px", fontWeight: 700 }}>
                    <CheckCircle2 size={15} /> Guardado
                  </span>
                )}
                <button
                  onClick={guardarSintomas}
                  disabled={elegidos.length === 0 || guardandoSintomas}
                  style={{ ...btnPrimario, width: "auto", opacity: elegidos.length === 0 ? 0.5 : 1 }}
                >
                  {guardandoSintomas ? "Guardando…" : "Guardar síntomas"}
                </button>
              </div>
            </Tarjeta>
          </div>
        </div>
      </div>

      {/* Modal de registro */}
      {modal && (
        <div onClick={() => setModal(null)} style={overlay}>
          <div onClick={(e) => e.stopPropagation()} style={caja}>
            <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "19px", color: "#3F3A52", margin: "0 0 16px" }}>
              {modal === "peso" ? "Registrar peso" : modal === "presion" ? "Registrar presión" : "Tu peso antes del embarazo"}
            </h3>

            {modal === "presion" ? (
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <Etiqueta>Sistólica</Etiqueta>
                  <input type="number" value={valor1} onChange={(e) => setValor1(e.target.value)} placeholder="118" style={input} />
                </div>
                <span style={{ paddingBottom: "12px", fontSize: "20px", color: "#A99FC4" }}>/</span>
                <div style={{ flex: 1 }}>
                  <Etiqueta>Diastólica</Etiqueta>
                  <input type="number" value={valor2} onChange={(e) => setValor2(e.target.value)} placeholder="78" style={input} />
                </div>
              </div>
            ) : (
              <>
                <Etiqueta>Peso en kilos</Etiqueta>
                <input type="number" step="0.1" value={valor1} onChange={(e) => setValor1(e.target.value)} placeholder="68.5" style={input} />
              </>
            )}

            {error && <p style={{ color: "#D97070", fontSize: "13px", fontWeight: 700, marginTop: "10px" }}>{error}</p>}

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={() => { setModal(null); setError(""); }} style={{ ...btnSuave, flex: 1, justifyContent: "center" }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando || !valor1} style={{ ...btnPrimario, flex: 2, opacity: guardando || !valor1 ? 0.6 : 1 }}>
                {guardando ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1000px) {
          .sm-grid { grid-template-columns: 1fr !important; }
          .sm-grid > div[style*="span 2"] { grid-column: span 1 !important; }
        }
      `}</style>
    </div>
  );
}

/* ── piezas ── */

function Tarjeta({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: "20px", padding: "22px 24px", boxShadow: "0 6px 28px rgba(90,60,150,0.08)" }}>
      {children}
    </div>
  );
}

function Encabezado({ children, icono }: { children: React.ReactNode; icono?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {icono}
      <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "18px", fontWeight: 700, color: "#3F3A52", margin: 0 }}>
        {children}
      </h2>
    </div>
  );
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "#8A849C", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
      {children}
    </label>
  );
}

const input: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: "12px",
  border: "1px solid #E4DBF7", background: "#FAF8FE", fontSize: "14.5px",
  fontFamily: "'Nunito', sans-serif", color: "#3F3A52", outline: "none", boxSizing: "border-box",
};

const btnPrimario: React.CSSProperties = {
  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
  background: "linear-gradient(135deg, #8B5FD6, #A47BE8)", color: "#fff", border: "none",
  borderRadius: "12px", padding: "12px 20px", fontWeight: 800, fontSize: "13.5px",
  cursor: "pointer", fontFamily: "'Nunito', sans-serif",
};

const btnSuave: React.CSSProperties = {
  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
  background: "#FAF8FE", color: "#8B5FD6", border: "1px solid #EDE7F9",
  borderRadius: "12px", padding: "12px 20px", fontWeight: 800, fontSize: "13.5px",
  cursor: "pointer", fontFamily: "'Nunito', sans-serif",
};

const enlace: React.CSSProperties = {
  background: "none", border: "none", color: "#8B5FD6", fontSize: "12.5px",
  fontWeight: 700, cursor: "pointer", padding: 0, textAlign: "left",
  textDecoration: "underline", fontFamily: "'Nunito', sans-serif",
};

const filaArticulo: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px",
  background: "#FAF8FE", border: "1px solid #EDE7F9", borderRadius: "12px",
  padding: "12px 14px", cursor: "pointer", width: "100%", fontFamily: "'Nunito', sans-serif",
};

const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(63,58,82,0.55)", zIndex: 1000,
  display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
};

const caja: React.CSSProperties = {
  background: "#fff", borderRadius: "20px", padding: "26px", width: "100%", maxWidth: "420px",
  fontFamily: "'Nunito', sans-serif",
};
