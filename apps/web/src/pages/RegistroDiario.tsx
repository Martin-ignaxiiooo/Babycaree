import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Milk, Moon, Baby, Plus, Trash2, Clock,
  Droplets, Loader2, Sun,
} from "lucide-react";
import TopNav from "../components/TopNav";
import EstadisticasDiario from "../components/EstadisticasDiario";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

type Tipo = "toma" | "sueno" | "panal";

/** "hace 2 h 15 min" — la forma en que una madre piensa el tiempo, no un reloj. */
function haceCuanto(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  const resto = min % 60;
  if (h < 24) return resto > 0 ? `hace ${h} h ${resto} min` : `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} ${d === 1 ? "día" : "días"}`;
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

function duracionTexto(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}min` : `${m} min`;
}

/** Etiqueta legible de un registro, según su tipo. */
function describir(r: any): string {
  if (r.tipo === "toma") {
    if (r.fuente === "biberon") return `Biberón · ${r.cantidad_ml ?? "?"} ml`;
    const lado = r.fuente === "pecho_izq" ? "izquierdo" : "derecho";
    return r.duracion_min ? `Pecho ${lado} · ${r.duracion_min} min` : `Pecho ${lado}`;
  }
  if (r.tipo === "sueno") {
    if (!r.sueno_fin) return "Durmiendo ahora";
    const min = (new Date(r.sueno_fin).getTime() - new Date(r.sueno_inicio).getTime()) / 60000;
    return `Durmió ${duracionTexto(min)}`;
  }
  return { pis: "Pañal · pipí", caca: "Pañal · caca", mixto: "Pañal · mixto" }[r.panal_tipo as string] ?? "Pañal";
}

const ESTILO_TIPO: Record<Tipo, { bg: string; fg: string; Icon: any }> = {
  toma:  { bg: "#E3F2FD", fg: "#1976D2", Icon: Milk },
  sueno: { bg: "#EDE7F6", fg: "#7C5CBF", Icon: Moon },
  panal: { bg: "#FFF4E0", fg: "#B27B16", Icon: Baby },
};

export default function RegistroDiario() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [bebeId, setBebeId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const [registros, setRegistros] = useState<any[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formulario abierto (null = ninguno). Se abre uno a la vez para que la
  // pantalla no se llene de campos cuando se registra con una sola mano.
  const [vista, setVista] = useState<"registro" | "patrones">("registro");
  const [abierto, setAbierto] = useState<Tipo | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Campos del formulario
  const [fuente, setFuente] = useState<"pecho_izq" | "pecho_der" | "biberon">("biberon");
  const [cantidadMl, setCantidadMl] = useState(120);
  const [duracionMin, setDuracionMin] = useState(15);
  const [panalTipo, setPanalTipo] = useState<"pis" | "caca" | "mixto">("pis");
  const [nota, setNota] = useState("");

  useEffect(() => {
    if (!token) { navigate("/"); return; }
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
    const id = localStorage.getItem("selectedBabyId");
    if (!id) { navigate("/seleccionar-perfil"); return; }
    setBebeId(id);
  }, [token, navigate]);

  const cargar = useCallback(async () => {
    if (!bebeId) return;
    try {
      const [regRes, resRes] = await Promise.all([
        fetch(`${API_URL}/v1/diario/${bebeId}/registros?limite=50`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/v1/diario/${bebeId}/registros/resumen`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!regRes.ok || !resRes.ok) throw new Error();
      setRegistros(await regRes.json());
      setResumen(await resRes.json());
      setError(null);
    } catch {
      setError("No pudimos cargar los registros.");
    } finally {
      setCargando(false);
    }
  }, [bebeId, token]);

  useEffect(() => { cargar(); }, [cargar]);

  const registrar = async (cuerpo: any) => {
    if (!bebeId) return;
    setGuardando(true);
    try {
      const res = await fetch(`${API_URL}/v1/diario/${bebeId}/registros`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...cuerpo, nota: nota.trim() || null }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "No se pudo guardar.");
      }
      setAbierto(null);
      setNota("");
      cargar();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const despertar = async (id: string) => {
    if (!bebeId) return;
    await fetch(`${API_URL}/v1/diario/${bebeId}/registros/${id}/despertar`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` },
    });
    cargar();
  };

  const eliminar = async (id: string) => {
    if (!bebeId || !confirm("¿Eliminar este registro?")) return;
    await fetch(`${API_URL}/v1/diario/${bebeId}/registros/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    cargar();
  };

  const suenoEnCurso = resumen?.sueno_en_curso;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, #FAF9FD 0%, #F6F2FF 100%)" }}>
      <TopNav
        user={user}
        activePath="/diario"
        onLogout={() => { localStorage.clear(); navigate("/"); }}
      />

      {/* Cabecera: mismo patrón que Salud y Galería — fondo full width,
          contenido limitado a 1400px para alinear con el resto. */}
      <div style={{ background: "linear-gradient(120deg, var(--theme-darker) 0%, #3A2E5C 55%, var(--theme-dark) 100%)", color: "#fff" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 40px 40px" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", marginBottom: "18px", fontFamily: "'Nunito', sans-serif" }}
          >
            <ArrowLeft size={16} /> Volver al Dashboard
          </button>
          <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "30px", margin: 0 }}>Registro diario</h1>
          <p style={{ color: "rgba(255,255,255,0.7)", marginTop: "6px", fontSize: "15px" }}>
            Tomas, sueño y pañales. Lo del día a día, a mano.
          </p>

          <div style={{ display: "flex", gap: "26px", marginTop: "22px" }}>
            {([["registro", "Registro"], ["patrones", "Patrones"]] as const).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "0 0 10px", fontFamily: "'Nunito', sans-serif",
                  fontSize: "15px", fontWeight: 800,
                  color: vista === v ? "#fff" : "rgba(255,255,255,0.55)",
                  borderBottom: vista === v ? "3px solid var(--accent-coral, #F4A0A0)" : "3px solid transparent",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="page-container" style={{ padding: "28px 40px 60px" }}>
        {vista === "patrones" && bebeId && (
          <EstadisticasDiario bebeId={bebeId} token={token!} />
        )}

        {vista === "registro" && (
        <>
        {/* Resumen de hoy */}
        {resumen && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "14px", marginBottom: "26px" }}>
            <Tarjeta icono={<Milk size={19} color="#1976D2" />} bg="#E3F2FD" valor={resumen.hoy.tomas} etiqueta="tomas hoy" />
            <Tarjeta icono={<Droplets size={19} color="#0288D1" />} bg="#E1F5FE" valor={`${resumen.hoy.ml_total} ml`} etiqueta="de biberón" />
            <Tarjeta icono={<Moon size={19} color="#7C5CBF" />} bg="#EDE7F6" valor={duracionTexto(resumen.hoy.sueno_min)} etiqueta="durmiendo" />
            <Tarjeta icono={<Baby size={19} color="#B27B16" />} bg="#FFF4E0" valor={resumen.hoy.panales} etiqueta="pañales" />
          </div>
        )}

        {/* Sueño en curso: acción destacada, es lo único con estado abierto */}
        {suenoEnCurso && (
          <div style={{ background: "linear-gradient(120deg, #4A3770, #7C5CBF)", borderRadius: "20px", padding: "20px 24px", marginBottom: "22px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <Moon size={26} color="#fff" />
            <div style={{ flex: 1, minWidth: "180px" }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: "16px" }}>Está durmiendo</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "13.5px" }}>
                Desde las {hora(suenoEnCurso.sueno_inicio)} · {haceCuanto(suenoEnCurso.sueno_inicio)}
              </div>
            </div>
            <button
              onClick={() => despertar(suenoEnCurso.id)}
              style={{ background: "var(--surface)", color: "var(--theme-primary)", border: "none", borderRadius: "100px", padding: "11px 22px", fontWeight: 800, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", fontFamily: "'Nunito', sans-serif" }}
            >
              <Sun size={16} /> Ya despertó
            </button>
          </div>
        )}

        {/* Registro rápido */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "16px" }}>
          <BotonRapido tipo="toma" activo={abierto === "toma"} onClick={() => setAbierto(abierto === "toma" ? null : "toma")} label="Registrar toma" />
          {!suenoEnCurso && (
            <BotonRapido tipo="sueno" activo={false} onClick={() => registrar({ tipo: "sueno", sueno_inicio: new Date().toISOString() })} label="Se durmió" />
          )}
          <BotonRapido tipo="panal" activo={abierto === "panal"} onClick={() => setAbierto(abierto === "panal" ? null : "panal")} label="Cambio de pañal" />
        </div>

        {/* Formulario de toma */}
        {abierto === "toma" && (
          <Panel>
            <Etiqueta>¿De dónde comió?</Etiqueta>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px" }}>
              {([["pecho_izq", "Pecho izq."], ["biberon", "Biberón"], ["pecho_der", "Pecho der."]] as const).map(([v, l]) => (
                <Opcion key={v} activo={fuente === v} onClick={() => setFuente(v)}>{l}</Opcion>
              ))}
            </div>

            {fuente === "biberon" ? (
              <>
                <Etiqueta>Cantidad</Etiqueta>
                <Contador valor={cantidadMl} setValor={setCantidadMl} paso={10} min={10} max={500} unidad="ml" atajos={[60, 120, 180]} />
              </>
            ) : (
              <>
                <Etiqueta>Duración</Etiqueta>
                <Contador valor={duracionMin} setValor={setDuracionMin} paso={5} min={1} max={120} unidad="min" atajos={[10, 15, 20]} />
              </>
            )}

            <CampoNota nota={nota} setNota={setNota} />
            <Guardar
              disabled={guardando}
              onClick={() => registrar(
                fuente === "biberon"
                  ? { tipo: "toma", fuente, cantidad_ml: cantidadMl }
                  : { tipo: "toma", fuente, duracion_min: duracionMin }
              )}
            />
          </Panel>
        )}

        {/* Formulario de pañal */}
        {abierto === "panal" && (
          <Panel>
            <Etiqueta>¿Qué había?</Etiqueta>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px" }}>
              {([["pis", "Pipí"], ["caca", "Caca"], ["mixto", "Ambos"]] as const).map(([v, l]) => (
                <Opcion key={v} activo={panalTipo === v} onClick={() => setPanalTipo(v)}>{l}</Opcion>
              ))}
            </div>
            <CampoNota nota={nota} setNota={setNota} />
            <Guardar disabled={guardando} onClick={() => registrar({ tipo: "panal", panal_tipo: panalTipo })} />
          </Panel>
        )}

        {error && (
          <div style={{ background: "#FFF0F0", color: "#D97070", borderRadius: "12px", padding: "12px 16px", fontSize: "13.5px", fontWeight: 600, marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {/* Línea de tiempo */}
        <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "20px", color: "var(--text)", margin: "26px 0 14px" }}>
          Últimos registros
        </h2>

        {cargando ? (
          <div style={{ textAlign: "center", padding: "50px", color: "var(--text-muted)" }}><Loader2 size={26} className="spin-icon" /></div>
        ) : registros.length === 0 ? (
          <div style={{ background: "var(--surface)", borderRadius: "20px", padding: "50px 24px", textAlign: "center", boxShadow: "0 4px 18px rgba(124,92,191,0.06)" }}>
            <Clock size={38} color="var(--theme-primary)" style={{ opacity: 0.45 }} />
            <div style={{ fontWeight: 800, color: "var(--text)", marginTop: "12px", fontSize: "16px" }}>Todavía no hay registros</div>
            <div style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "5px" }}>
              Usa los botones de arriba para anotar la primera toma o cambio de pañal.
            </div>
          </div>
        ) : (
          registros.map((r) => {
            const est = ESTILO_TIPO[r.tipo as Tipo];
            return (
              <div key={r.id} style={{ background: "var(--surface)", borderRadius: "16px", padding: "14px 18px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 3px 14px rgba(124,92,191,0.05)" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: est.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <est.Icon size={20} color={est.fg} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "var(--text)", fontSize: "15px" }}>{describir(r)}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "12.5px", marginTop: "2px" }}>
                    {hora(r.fecha_hora)} · {haceCuanto(r.fecha_hora)}
                    {r.registrado_por_nombre ? ` · ${r.registrado_por_nombre}` : ""}
                  </div>
                  {r.nota && <div style={{ color: "#6B647F", fontSize: "13px", marginTop: "5px", fontStyle: "italic" }}>{r.nota}</div>}
                </div>
                <button onClick={() => eliminar(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C4BFD4", padding: "6px" }} aria-label="Eliminar">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })
        )}
        </>
        )}
      </div>
    </div>
  );
}

/* ── piezas reutilizables ── */

function Tarjeta({ icono, bg, valor, etiqueta }: any) {
  return (
    <div style={{ background: "var(--surface)", borderRadius: "18px", padding: "16px 18px", boxShadow: "0 4px 18px rgba(124,92,191,0.06)" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
        {icono}
      </div>
      <div style={{ fontSize: "22px", fontWeight: 900, color: "var(--text)", fontFamily: "'Baloo 2', sans-serif" }}>{valor}</div>
      <div style={{ fontSize: "12.5px", color: "var(--text-muted)", fontWeight: 600 }}>{etiqueta}</div>
    </div>
  );
}

function BotonRapido({ tipo, activo, onClick, label }: any) {
  const est = ESTILO_TIPO[tipo as Tipo];
  return (
    <button
      onClick={onClick}
      style={{
        background: activo ? est.fg : "#fff", color: activo ? "#fff" : "var(--theme-darker)",
        border: `2px solid ${activo ? est.fg : "#EDE9F8"}`, borderRadius: "18px", padding: "18px 16px",
        cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "14.5px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
        boxShadow: "0 4px 18px rgba(124,92,191,0.06)",
      }}
    >
      <est.Icon size={24} color={activo ? "#fff" : est.fg} />
      {label}
    </button>
  );
}

function Panel({ children }: any) {
  return (
    <div style={{ background: "var(--surface)", borderRadius: "20px", padding: "22px 24px", marginBottom: "16px", boxShadow: "0 4px 18px rgba(124,92,191,0.07)" }}>
      {children}
    </div>
  );
}

function Etiqueta({ children }: any) {
  return <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text)", marginBottom: "9px" }}>{children}</div>;
}

function Opcion({ activo, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: "1 1 100px", padding: "12px", borderRadius: "14px", cursor: "pointer",
        fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "14px",
        border: activo ? "2px solid var(--theme-primary)" : "2px solid #E4DBF7",
        background: activo ? "var(--theme-primary)" : "#fff",
        color: activo ? "#fff" : "var(--theme-darker)",
      }}
    >
      {children}
    </button>
  );
}

/** Contador con +/- y atajos: registrar de madrugada no debería requerir teclear. */
function Contador({ valor, setValor, paso, min, max, unidad, atajos }: any) {
  const ajustar = (d: number) => setValor(Math.min(max, Math.max(min, valor + d)));
  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", marginBottom: "12px" }}>
        <button onClick={() => ajustar(-paso)} style={botonCirculo}>−</button>
        <div style={{ textAlign: "center", minWidth: "110px" }}>
          <div style={{ fontSize: "34px", fontWeight: 900, color: "var(--theme-primary)", fontFamily: "'Baloo 2', sans-serif", lineHeight: 1 }}>{valor}</div>
          <div style={{ fontSize: "12.5px", color: "var(--text-muted)", fontWeight: 600 }}>{unidad}</div>
        </div>
        <button onClick={() => ajustar(paso)} style={{ ...botonCirculo, background: "var(--theme-primary)", color: "#fff", borderColor: "var(--theme-primary)" }}>+</button>
      </div>
      <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
        {atajos.map((a: number) => (
          <button key={a} onClick={() => setValor(a)} style={{ padding: "7px 16px", borderRadius: "100px", border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--theme-primary)", fontWeight: 800, fontSize: "12.5px", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
            {a} {unidad}
          </button>
        ))}
      </div>
    </div>
  );
}

function CampoNota({ nota, setNota }: any) {
  return (
    <>
      <Etiqueta>Nota (opcional)</Etiqueta>
      <input
        value={nota} onChange={(e) => setNota(e.target.value)} maxLength={300}
        placeholder="Algo que quieras recordar…"
        style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1.5px solid var(--border)", background: "var(--surface-3)", fontSize: "14px", fontFamily: "'Nunito', sans-serif", color: "var(--text)", marginBottom: "18px", outline: "none", boxSizing: "border-box" }}
      />
    </>
  );
}

function Guardar({ disabled, onClick }: any) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{ width: "100%", padding: "15px", borderRadius: "100px", border: "none", background: "var(--theme-primary)", color: "#fff", fontWeight: 800, fontSize: "15px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, fontFamily: "'Nunito', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
    >
      <Plus size={18} /> {disabled ? "Guardando…" : "Guardar registro"}
    </button>
  );
}

const botonCirculo: React.CSSProperties = {
  width: "48px", height: "48px", borderRadius: "50%", border: "2px solid var(--border)",
  background: "var(--surface)", color: "var(--theme-primary)", fontSize: "24px", fontWeight: 800,
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: "'Nunito', sans-serif",
};
