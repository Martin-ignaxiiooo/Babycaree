import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, PlusCircle, Loader2 } from "lucide-react";
import TopNav from "../components/TopNav";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

const DIAS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** Celdas del mes: incluye los días de relleno del mes anterior y siguiente. */
function armarMes(anio: number, mes: number) {
  const primero = new Date(anio, mes, 1);
  const arranque = primero.getDay(); // 0 = domingo
  const diasMes = new Date(anio, mes + 1, 0).getDate();
  const diasMesAnterior = new Date(anio, mes, 0).getDate();

  const celdas: { dia: number; delMes: boolean; fecha: Date }[] = [];

  for (let i = arranque - 1; i >= 0; i--) {
    celdas.push({ dia: diasMesAnterior - i, delMes: false, fecha: new Date(anio, mes - 1, diasMesAnterior - i) });
  }
  for (let d = 1; d <= diasMes; d++) {
    celdas.push({ dia: d, delMes: true, fecha: new Date(anio, mes, d) });
  }
  // Se completa hasta llenar la última semana, para que la grilla no quede coja.
  while (celdas.length % 7 !== 0) {
    const siguiente = celdas.length - (arranque + diasMes) + 1;
    celdas.push({ dia: siguiente, delMes: false, fecha: new Date(anio, mes + 1, siguiente) });
  }
  return celdas;
}

const mismoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function Calendario() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [bebeId, setBebeId] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<any>(null);
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const hoy = new Date();
  const [cursor, setCursor] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [seleccionado, setSeleccionado] = useState<Date>(hoy);

  // Formulario de nueva cita
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { navigate("/"); return; }
    const id = localStorage.getItem("selectedBabyId");
    if (!id) { navigate("/seleccionar-perfil"); return; }
    setBebeId(id);
  }, [token, navigate]);

  const cargar = useCallback(async () => {
    if (!bebeId) return;
    const h = { Authorization: `Bearer ${token}` };
    const [c, p] = await Promise.allSettled([
      fetch(`${API_URL}/v1/salud/${bebeId}/citas`, { headers: h }),
      fetch(`${API_URL}/v1/home/${bebeId}`, { headers: h }),
    ]);
    if (c.status === "fulfilled" && c.value.ok) setCitas(await c.value.json());
    if (p.status === "fulfilled" && p.value.ok) {
      const d = await p.value.json();
      setPerfil(d.perfil);
    }
    setLoading(false);
  }, [bebeId, token]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha || !hora) { setError("Completa la fecha y la hora."); return; }
    const [a, m, d] = fecha.split("-").map(Number);
    const [hh, mm] = hora.split(":").map(Number);
    const cuando = new Date(a, m - 1, d, hh, mm);
    if (Number.isNaN(cuando.getTime())) { setError("La fecha no es válida."); return; }

    setGuardando(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/v1/salud/${bebeId}/citas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          // ISO con offset explícito: sin esto Postgres interpreta la hora
          // local como UTC y la cita queda corrida varias horas.
          fecha_cita: cuando.toISOString(),
          especialidad: titulo.trim() || "Control",
          tipo: "control",
        }),
      });
      if (!res.ok) throw new Error("No se pudo guardar la cita.");
      setTitulo(""); setFecha(""); setHora("");
      cargar();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const celdas = armarMes(cursor.getFullYear(), cursor.getMonth());
  const citasDe = (f: Date) => citas.filter((c) => mismoDia(new Date(c.fecha_cita), f));

  const proximas = citas
    .filter((c) => new Date(c.fecha_cita) >= new Date())
    .sort((a, b) => new Date(a.fecha_cita).getTime() - new Date(b.fecha_cita).getTime())
    .slice(0, 4);

  const semanas = perfil?.semanas_embarazo;
  const delDia = citasDe(seleccionado);

  return (
    <div style={{ minHeight: "100vh", background: "#F7F5FC", fontFamily: "'Nunito', sans-serif" }}>
      <TopNav user={user} activePath="/calendario" perfilEstado={perfil?.estado} />

      <div style={{ background: "linear-gradient(135deg, #8B5FD6 0%, #A47BE8 100%)", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "26px 32px 0" }}>
          {semanas != null && (
            <span style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", color: "#fff", borderRadius: "100px", padding: "5px 14px", fontSize: "11.5px", fontWeight: 800, letterSpacing: "0.5px", marginBottom: "10px" }}>
              SEMANA {semanas} DE 40
            </span>
          )}
          <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "31px", fontWeight: 700, color: "#fff", margin: 0 }}>
            Mi Calendario
          </h1>
          <p style={{ fontSize: "14.5px", color: "rgba(255,255,255,0.8)", margin: "6px 0 0", fontWeight: 600 }}>
            Gestiona tus citas médicas y haz seguimiento de tu progreso semanal.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1240px", margin: "-60px auto 0", padding: "0 32px 48px" }}>
        <div className="cal-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.55fr) minmax(300px, 1fr)", gap: "20px", alignItems: "start" }}>

          {/* ── Calendario ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <Tarjeta>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "21px", fontWeight: 700, color: "#3F3A52", margin: 0 }}>
                  {MESES[cursor.getMonth()]} {cursor.getFullYear()}
                </h2>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Flecha onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
                    <ChevronLeft size={17} />
                  </Flecha>
                  <Flecha onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
                    <ChevronRight size={17} />
                  </Flecha>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "8px" }}>
                {DIAS.map((d) => (
                  <div key={d} style={{ textAlign: "center", fontSize: "11px", fontWeight: 800, color: "#A99FC4", letterSpacing: "0.5px", padding: "6px 0" }}>
                    {d}
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                {celdas.map((c, i) => {
                  const tiene = c.delMes && citasDe(c.fecha).length > 0;
                  const esHoy = mismoDia(c.fecha, hoy);
                  const activo = mismoDia(c.fecha, seleccionado);
                  return (
                    <button
                      key={i}
                      onClick={() => c.delMes && setSeleccionado(c.fecha)}
                      style={{
                        aspectRatio: "1", border: activo && !esHoy ? "1.5px solid #8B5FD6" : "1.5px solid transparent",
                        borderRadius: "12px", cursor: c.delMes ? "pointer" : "default",
                        background: esHoy ? "linear-gradient(135deg, #8B5FD6, #A47BE8)" : "transparent",
                        color: esHoy ? "#fff" : !c.delMes ? "#D6D1E3" : tiene ? "#8B5FD6" : "#3F3A52",
                        fontWeight: esHoy || tiene ? 800 : 600, fontSize: "14px",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        gap: "3px", fontFamily: "'Nunito', sans-serif", position: "relative",
                      }}
                    >
                      {c.dia}
                      {tiene && (
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: esHoy ? "#fff" : "#8B5FD6" }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </Tarjeta>

            {/* Citas del día elegido, o el hito de la semana */}
            <Tarjeta>
              <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "18px", fontWeight: 700, color: "#3F3A52", margin: 0 }}>
                {delDia.length > 0
                  ? `Citas del ${seleccionado.getDate()} de ${MESES[seleccionado.getMonth()].toLowerCase()}`
                  : "Desarrollo Semanal"}
              </h3>

              {delDia.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
                  {delDia.map((c: any) => (
                    <div key={c.id} style={fila}>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#3F3A52" }}>
                          {c.especialidad || "Control"}
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#8A849C", marginTop: "1px" }}>
                          {new Date(c.fecha_cita).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                          {c.medico ? ` · ${c.medico}` : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "14px", color: "#6B647F", lineHeight: 1.7, marginTop: "10px" }}>
                  {perfil?.hito_embarazo
                    ? `Semana ${semanas}: ${String(perfil.hito_embarazo).split(".")[0]}.`
                    : "Elige un día con punto morado para ver sus citas."}
                </p>
              )}
            </Tarjeta>
          </div>

          {/* ── Columna derecha ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <Tarjeta>
              <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "18px", fontWeight: 700, color: "#3F3A52", margin: 0 }}>
                Mis Citas Próximas
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
                {loading ? (
                  <Loader2 size={18} className="spin-icon" />
                ) : proximas.length === 0 ? (
                  <p style={{ fontSize: "13.5px", color: "#8A849C", margin: 0 }}>No tienes citas agendadas.</p>
                ) : (
                  proximas.map((c: any) => {
                    const d = new Date(c.fecha_cita);
                    return (
                      <div key={c.id} style={fila}>
                        <div style={{ textAlign: "center", minWidth: "38px", flexShrink: 0 }}>
                          <div style={{ fontSize: "18px", fontWeight: 900, color: "#3F3A52", lineHeight: 1, fontFamily: "'Baloo 2', sans-serif" }}>
                            {String(d.getDate()).padStart(2, "0")}
                          </div>
                          <div style={{ fontSize: "10px", fontWeight: 800, color: "#A99FC4" }}>
                            {d.toLocaleDateString("es-CL", { month: "short" }).replace(".", "").toUpperCase()}
                          </div>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#3F3A52" }}>
                            {c.especialidad || "Control"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#8A849C" }}>
                            {d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                            {c.medico ? ` · ${c.medico}` : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Tarjeta>

            {/* Añadir cita */}
            <Tarjeta>
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <PlusCircle size={19} color="#8B5FD6" />
                <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "18px", fontWeight: 700, color: "#3F3A52", margin: 0 }}>
                  Añadir Cita
                </h3>
              </div>

              <form onSubmit={guardar} style={{ marginTop: "16px" }}>
                <Etiqueta>Título</Etiqueta>
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Análisis de sangre" style={input} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" }}>
                  <div>
                    <Etiqueta>Fecha</Etiqueta>
                    <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={input} />
                  </div>
                  <div>
                    <Etiqueta>Hora</Etiqueta>
                    <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} style={input} />
                  </div>
                </div>

                {error && (
                  <p style={{ color: "#D97070", fontSize: "12.5px", fontWeight: 700, marginTop: "10px" }}>{error}</p>
                )}

                <button type="submit" disabled={guardando} style={{ ...btnPrimario, marginTop: "16px", opacity: guardando ? 0.6 : 1 }}>
                  {guardando ? "Guardando…" : "Guardar Cita"}
                </button>
              </form>
            </Tarjeta>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .cal-grid { grid-template-columns: 1fr !important; }
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

function Flecha({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "32px", height: "32px", borderRadius: "10px", border: "1px solid #EDE7F9",
        background: "#FAF8FE", color: "#8B5FD6", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "#8A849C", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
      {children}
    </label>
  );
}

const fila: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "12px",
  background: "#FAF8FE", border: "1px solid #EDE7F9", borderRadius: "14px", padding: "11px 14px",
};

const input: React.CSSProperties = {
  width: "100%", padding: "11px 13px", borderRadius: "11px",
  border: "1px solid #E4DBF7", background: "#FAF8FE", fontSize: "14px",
  fontFamily: "'Nunito', sans-serif", color: "#3F3A52", outline: "none", boxSizing: "border-box",
};

const btnPrimario: React.CSSProperties = {
  width: "100%", background: "linear-gradient(135deg, #8B5FD6, #A47BE8)", color: "#fff",
  border: "none", borderRadius: "12px", padding: "13px", fontWeight: 800, fontSize: "14.5px",
  cursor: "pointer", fontFamily: "'Nunito', sans-serif",
  boxShadow: "0 6px 16px rgba(139,95,214,0.28)",
};
