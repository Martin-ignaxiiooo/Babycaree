import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Milk, Moon, Baby, Plus, X,
  Droplets, Sun, NotebookPen,
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

/** Colores e ícono por tipo de registro, usados en los botones rápidos. */
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
  // Un familiar invitado como solo lectura puede ver el diario pero no
  // escribir en él: se le ocultan los botones en vez de dejar que fallen.
  const [soloLectura, setSoloLectura] = useState(false);

  const [resumen, setResumen] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Formulario abierto (null = ninguno). Se abre uno a la vez para que la
  // pantalla no se llene de campos cuando se registra con una sola mano.
  const [abierto, setAbierto] = useState<Tipo | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Campos del formulario
  const [fuente, setFuente] = useState<"pecho" | "biberon">("biberon");
  const [cantidadMl, setCantidadMl] = useState(120);
  const [duracionMin, setDuracionMin] = useState(15);
  const [panalTipo, setPanalTipo] = useState<"pis" | "caca" | "mixto">("pis");
  const [nota, setNota] = useState("");
  // Cambia cada vez que se agrega/borra un registro, para que
  // EstadisticasDiario (los gráficos de Patrones) se refresque también sin
  // tener que recargar la página entera.
  const [refreshKey, setRefreshKey] = useState(0);

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
      const [resRes, homeRes] = await Promise.all([
        fetch(`${API_URL}/v1/diario/${bebeId}/registros/resumen`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/v1/home/${bebeId}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!resRes.ok) throw new Error();
      setResumen(await resRes.json());
      if (homeRes.ok) {
        const home = await homeRes.json();
        setSoloLectura(["solo_lectura", "solo_lectura_galeria"].includes(home.rol_acceso));
      }
      setError(null);
    } catch {
      setError("No pudimos cargar los registros.");
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
      setRefreshKey((k) => k + 1);
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
    setRefreshKey((k) => k + 1);
  };

  const suenoEnCurso = resumen?.sueno_en_curso;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, var(--page-bg) 0%, var(--theme-bg-light) 100%)" }}>
      <TopNav
        user={user}
        activePath="/diario"
        onLogout={() => { localStorage.clear(); navigate("/"); }}
      />

      {/* Cabecera: mismo color/gradiente morado que Comunidad y Salud. */}
      <div style={{ background: "linear-gradient(135deg, #8B5FD6 0%, #A47BE8 100%)", color: "#fff" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "16px 40px 12px" }}>
          <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "22px", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <NotebookPen size={22} /> Registro diario
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", marginTop: "3px", fontSize: "12.5px" }}>
            Tomas, sueño y pañales. Lo del día a día, a mano.
          </p>
        </div>
      </div>

      <div className="page-container" style={{ padding: "28px 40px 60px" }}>
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
            {!soloLectura && (
            <button
              onClick={() => despertar(suenoEnCurso.id)}
              style={{ background: "var(--surface)", color: "var(--theme-primary)", border: "none", borderRadius: "100px", padding: "11px 22px", fontWeight: 800, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", fontFamily: "'Nunito', sans-serif" }}
            >
              <Sun size={16} /> Ya despertó
            </button>
            )}
          </div>
        )}

        {soloLectura && (
          <div style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)", borderRadius: "14px", padding: "13px 16px", marginBottom: "16px", fontSize: "13.5px", color: "var(--text-muted)", fontWeight: 600 }}>
            Tienes acceso de solo lectura a este perfil: puedes ver el diario, pero no agregar ni borrar registros.
          </div>
        )}

        {/* Registro rápido */}
        {!soloLectura && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "16px" }}>
          <BotonRapido tipo="toma" activo={abierto === "toma"} onClick={() => setAbierto(abierto === "toma" ? null : "toma")} label="Registrar toma" />
          {!suenoEnCurso && (
            <BotonRapido tipo="sueno" activo={false} onClick={() => registrar({ tipo: "sueno", sueno_inicio: new Date().toISOString() })} label="Se durmió" />
          )}
          <BotonRapido tipo="panal" activo={abierto === "panal"} onClick={() => setAbierto(abierto === "panal" ? null : "panal")} label="Cambio de pañal" />
        </div>
        )}

        {/* Resumen de hoy */}
        {resumen && (
          <>
          <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "20px", color: "var(--text)", margin: "0 0 14px" }}>
            Últimos registros de hoy
          </h2>
          <div className="diario-resumen-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "14px", marginBottom: "26px" }}>
            <Tarjeta icono={<Milk size={19} color="#1976D2" />} bg="#E3F2FD" valor={resumen.hoy.tomas} etiqueta="tomas hoy" />
            <Tarjeta icono={<Droplets size={19} color="#0288D1" />} bg="#E1F5FE" valor={`${resumen.hoy.ml_total} ml`} etiqueta="de biberón" />
            <Tarjeta icono={<Moon size={19} color="#7C5CBF" />} bg="#EDE7F6" valor={duracionTexto(resumen.hoy.sueno_min)} etiqueta="durmiendo" />
            <Tarjeta icono={<Baby size={19} color="#B27B16" />} bg="#FFF4E0" valor={resumen.hoy.panales} etiqueta="pañales" />
          </div>
          </>
        )}

        {/* Formulario de toma */}
        {abierto === "toma" && (
          <Modal titulo="Registrar alimentación" onClose={() => setAbierto(null)}>
            <Etiqueta>¿De dónde comió?</Etiqueta>
            <div style={{ display: "flex", gap: "14px", justifyContent: "center", marginBottom: "18px" }}>
              <OpcionIcono emoji="🤱" label="Pecho" activo={fuente === "pecho"} onClick={() => setFuente("pecho")} />
              <OpcionIcono emoji="🍼" label="Biberón" activo={fuente === "biberon"} onClick={() => setFuente("biberon")} />
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
          </Modal>
        )}

        {/* Formulario de pañal */}
        {abierto === "panal" && (
          <Modal titulo="Cambio de pañal" onClose={() => setAbierto(null)}>
            <Etiqueta>¿Qué había?</Etiqueta>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px" }}>
              {([["pis", "Pipí"], ["caca", "Popó"], ["mixto", "Ambos"]] as const).map(([v, l]) => (
                <Opcion key={v} activo={panalTipo === v} onClick={() => setPanalTipo(v)}>{l}</Opcion>
              ))}
            </div>
            <CampoNota nota={nota} setNota={setNota} />
            <Guardar disabled={guardando} onClick={() => registrar({ tipo: "panal", panal_tipo: panalTipo })} />
          </Modal>
        )}

        {error && (
          <div style={{ background: "#FFF0F0", color: "#D97070", borderRadius: "12px", padding: "12px 16px", fontSize: "13.5px", fontWeight: 600, marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {/* Patrones: antes vivía en una pestaña separada; ahora reemplaza
            el listado plano de "Últimos registros" al final de esta misma
            vista. */}
        <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "20px", color: "var(--text)", margin: "26px 0 14px" }}>
          Patrones
        </h2>
        {bebeId && <EstadisticasDiario bebeId={bebeId} token={token!} refreshKey={refreshKey} />}
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

function Modal({ titulo, onClose, children }: any) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(45,38,64,0.5)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)", borderRadius: "22px", width: "100%", maxWidth: "420px",
          maxHeight: "90vh", overflowY: "auto", padding: "24px", boxShadow: "0 20px 60px rgba(45,38,64,0.3)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>
            {titulo}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: "var(--surface-2)", border: "none", borderRadius: "50%",
              width: "30px", height: "30px", display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: "var(--text-muted)", flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
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

/** Igual que Opcion, pero con un ícono grande arriba en vez de solo
    texto (usado para elegir Pecho/Biberón al registrar una toma). */
function OpcionIcono({ emoji, label, activo, onClick }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: "0 1 110px", padding: "18px 10px", borderRadius: "18px", cursor: "pointer",
        fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "13.5px",
        border: activo ? "2px solid var(--theme-primary)" : "2px solid #E4DBF7",
        background: activo ? "linear-gradient(135deg, var(--theme-primary), var(--theme-light))" : "#fff",
        color: activo ? "#fff" : "var(--theme-darker)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
      }}
    >
      <span style={{ fontSize: "30px", lineHeight: 1 }}>{emoji}</span>
      {label}
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
