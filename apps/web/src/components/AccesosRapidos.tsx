import { useState, useEffect } from "react";
import {
  Milk, Moon, Baby, Syringe, CalendarClock, X, Mic, MicOff, Plus, Sun, Ruler,
} from "lucide-react";
import { useDictado } from "../hooks/useDictado";
import { interpretarDictado } from "../utils/interpretarDictado";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

/* ────────────────────────────────────────────────────────────────
   Componentes compartidos (mismo estilo que ya usan RegistroDiario.tsx
   y Salud.tsx, reescritos acá para no acoplar este archivo a esas
   páginas).
   ──────────────────────────────────────────────────────────────── */

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

const botonCirculo: React.CSSProperties = {
  width: "48px", height: "48px", borderRadius: "50%", border: "2px solid var(--border)",
  background: "var(--surface)", color: "var(--theme-primary)", fontSize: "24px", fontWeight: 800,
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: "'Nunito', sans-serif",
};

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

function BotonGuardar({ disabled, onClick, texto = "Guardar" }: any) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{ width: "100%", padding: "15px", borderRadius: "100px", border: "none", background: "var(--theme-primary)", color: "#fff", fontWeight: 800, fontSize: "15px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, fontFamily: "'Nunito', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
    >
      <Plus size={18} /> {disabled ? "Guardando…" : texto}
    </button>
  );
}

function MensajeError({ error }: { error: string | null }) {
  if (!error) return null;
  return <p style={{ fontSize: "12.5px", color: "#D97070", fontWeight: 700, marginBottom: "14px", lineHeight: 1.4 }}>{error}</p>;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: "10px",
  fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "'Nunito', sans-serif", color: "var(--text)",
};

/* ────────────────────────────────────────────────────────────────
   Modal: Registrar toma
   ──────────────────────────────────────────────────────────────── */
function ModalRegistrarToma({ bebeId, token, onClose, onSaved }: any) {
  const [fuente, setFuente] = useState<"pecho" | "biberon">("pecho");
  const [cantidadMl, setCantidadMl] = useState(120);
  const [duracionMin, setDuracionMin] = useState(10);
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      const cuerpo = fuente === "biberon"
        ? { tipo: "toma", fuente, cantidad_ml: cantidadMl }
        : { tipo: "toma", fuente, duracion_min: duracionMin };
      const res = await fetch(`${API_URL}/v1/diario/${bebeId}/registros`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...cuerpo, nota: nota.trim() || null }),
      });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "No se pudo guardar. Intenta de nuevo.");
      }
    } catch {
      setError("Error de red. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo="Registrar alimentación" onClose={onClose}>
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
      <MensajeError error={error} />
      <BotonGuardar disabled={guardando} onClick={guardar} />
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────────
   Modal: Cambio de pañal
   ──────────────────────────────────────────────────────────────── */
function ModalCambioPanal({ bebeId, token, onClose, onSaved }: any) {
  const [panalTipo, setPanalTipo] = useState<"pis" | "caca" | "mixto">("pis");
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/v1/diario/${bebeId}/registros`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tipo: "panal", panal_tipo: panalTipo, nota: nota.trim() || null }),
      });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "No se pudo guardar. Intenta de nuevo.");
      }
    } catch {
      setError("Error de red. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo="Cambio de pañal" onClose={onClose}>
      <Etiqueta>¿Qué había?</Etiqueta>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px" }}>
        <Opcion activo={panalTipo === "pis"} onClick={() => setPanalTipo("pis")}>Pipí</Opcion>
        <Opcion activo={panalTipo === "caca"} onClick={() => setPanalTipo("caca")}>Popó</Opcion>
        <Opcion activo={panalTipo === "mixto"} onClick={() => setPanalTipo("mixto")}>Ambos</Opcion>
      </div>
      <CampoNota nota={nota} setNota={setNota} />
      <MensajeError error={error} />
      <BotonGuardar disabled={guardando} onClick={guardar} />
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────────
   Confirmación: Se durmió (no es un formulario, solo confirma la hora)
   ──────────────────────────────────────────────────────────────── */
function ConfirmarSueno({ bebeId, token, onClose, onSaved }: any) {
  const ahora = new Date();
  const [hora, setHora] = useState(`${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const confirmar = async () => {
    setGuardando(true);
    setError(null);
    try {
      const [h, m] = hora.split(":").map(Number);
      const inicio = new Date();
      inicio.setHours(h, m, 0, 0);
      const res = await fetch(`${API_URL}/v1/diario/${bebeId}/registros`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tipo: "sueno", fecha_hora: inicio.toISOString() }),
      });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "No se pudo registrar. Intenta de nuevo.");
      }
    } catch {
      setError("Error de red. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(45,38,64,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: "22px", width: "100%", maxWidth: "360px", padding: "24px 22px", boxShadow: "0 20px 60px rgba(45,38,64,0.3)", textAlign: "center" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--theme-bg-light)", color: "var(--theme-primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <Moon size={24} />
        </div>
        <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "16px", color: "var(--text)", marginBottom: "6px" }}>¿Se durmió ahora?</div>
        <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "18px", lineHeight: 1.5 }}>
          Se registrará como inicio de sueño. Puedes ajustar la hora si no fue justo ahora.
        </p>
        <input
          type="time" value={hora} onChange={(e) => setHora(e.target.value)}
          style={{ display: "inline-block", background: "var(--surface-2)", border: "1.5px solid var(--border)", borderRadius: "100px", padding: "8px 16px", fontSize: "14px", fontWeight: 800, color: "var(--text)", marginBottom: "20px", outline: "none" }}
        />
        {error && (
          <p style={{ fontSize: "12.5px", color: "#D97070", fontWeight: 700, marginBottom: "14px", lineHeight: 1.4 }}>{error}</p>
        )}
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "100px", border: "none", background: "var(--surface-2)", color: "var(--text-muted)", fontWeight: 800, fontSize: "13.5px", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
            Cancelar
          </button>
          <button onClick={confirmar} disabled={guardando} style={{ flex: 1, padding: "12px", borderRadius: "100px", border: "none", background: "var(--theme-primary)", color: "#fff", fontWeight: 800, fontSize: "13.5px", cursor: guardando ? "not-allowed" : "pointer", opacity: guardando ? 0.6 : 1, fontFamily: "'Nunito', sans-serif" }}>
            {guardando ? "Guardando…" : "Sí, confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Modal: Agendar cita — dictado por voz primero; formulario manual
   solo si el navegador no soporta dictado (Firefox, etc.)
   ──────────────────────────────────────────────────────────────── */
function ModalAgendarCita({ bebeId, token, onClose, onSaved }: any) {
  const [resultado, setResultado] = useState<{ ok: true } | { ok: false; motivo: string } | null>(null);
  const [guardandoPorVoz, setGuardandoPorVoz] = useState(false);

  // Formulario manual (fallback sin soporte de dictado)
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [tipoCita, setTipoCita] = useState<"control" | "cita">("control");
  const [medico, setMedico] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [lugar, setLugar] = useState("");
  const [guardandoManual, setGuardandoManual] = useState(false);

  const guardarCita = async (cuerpo: any) => {
    const res = await fetch(`${API_URL}/v1/salud/${bebeId}/citas`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(cuerpo),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || "No se pudo guardar la cita.");
    }
  };

  const dictado = useDictado(async (texto) => {
    const datos = interpretarDictado(texto);
    if (!datos.fecha) {
      setResultado({ ok: false, motivo: "No logramos entender la fecha. Puedes intentar de nuevo o usar el formulario en Salud." });
      return;
    }
    setGuardandoPorVoz(true);
    setResultado(null);
    try {
      const tipoFinal = datos.tipo ?? "cita";
      await guardarCita({
        fecha_cita: datos.fecha.toISOString(),
        medico: datos.medico || null,
        notas: texto,
        tipo: tipoFinal,
        especialidad: datos.especialidad || (tipoFinal === "control" ? "Control sano" : "Consulta"),
        lugar: datos.lugar || null,
      });
      setResultado({ ok: true });
      onSaved();
    } catch (e: any) {
      setResultado({ ok: false, motivo: e.message || "No se pudo guardar la cita." });
    } finally {
      setGuardandoPorVoz(false);
    }
  });

  const [errorManual, setErrorManual] = useState<string | null>(null);

  const guardarManual = async () => {
    if (!fecha || !hora) return;
    setGuardandoManual(true);
    setErrorManual(null);
    try {
      const [anio, mes, dia] = fecha.split("-").map(Number);
      const [h, m] = hora.split(":").map(Number);
      const fechaISO = new Date(anio, mes - 1, dia, h, m).toISOString();
      await guardarCita({
        fecha_cita: fechaISO,
        medico: medico.trim() || null,
        notas: null,
        tipo: tipoCita,
        especialidad: especialidad.trim() || (tipoCita === "control" ? "Control sano" : "Consulta"),
        lugar: lugar.trim() || null,
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setErrorManual(e.message || "No se pudo guardar la cita. Intenta de nuevo.");
    } finally {
      setGuardandoManual(false);
    }
  };

  return (
    <Modal titulo="Agendar cita" onClose={onClose}>
      {dictado.soportado ? (
        <div style={{ textAlign: "center", padding: "10px 0 6px" }}>
          <button
            onClick={dictado.escuchando ? dictado.detener : dictado.empezar}
            style={{
              width: "76px", height: "76px", borderRadius: "50%", margin: "0 auto 16px",
              background: dictado.escuchando ? "#D97070" : "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "none", cursor: "pointer", boxShadow: "0 8px 24px var(--theme-shadow-light)",
            }}
          >
            {dictado.escuchando ? <MicOff size={28} color="#fff" /> : <Mic size={28} color="#fff" />}
          </button>
          <div style={{ fontSize: "13.5px", fontWeight: 800, color: "var(--text)", marginBottom: "8px" }}>
            {guardandoPorVoz ? "Guardando…" : dictado.escuchando ? "Escuchando… toca para detener" : "Toca para dictar la cita"}
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.55, padding: "0 6px" }}>
            Di algo como: "control sano el viernes 3 de octubre a las diez y media con la doctora Pérez". Se detiene y guarda solo, apenas hagas una pausa.
          </p>

          {dictado.texto && (
            <div style={{ marginTop: "16px", background: "var(--surface-2)", borderRadius: "12px", padding: "12px 14px", fontSize: "13px", color: "var(--text)", fontStyle: "italic" }}>
              "{dictado.texto}"
            </div>
          )}

          {resultado && resultado.ok && (
            <div style={{ marginTop: "12px", color: "#3E8E6E", fontSize: "12.5px", fontWeight: 700, lineHeight: 1.5 }}>
              ✓ Cita guardada. Puedes revisarla o corregirla desde Salud.
            </div>
          )}
          {resultado && !resultado.ok && (
            <div style={{ marginTop: "12px", color: "#D97070", fontSize: "12.5px", fontWeight: 700, lineHeight: 1.5 }}>
              {resultado.motivo}
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: "inline-block", fontSize: "10.5px", fontWeight: 800, background: "#FFF4E0", color: "#8A6D1D", padding: "3px 10px", borderRadius: "100px", marginBottom: "14px" }}>
            Dictado no disponible en este navegador
          </div>

          <Etiqueta>Tipo</Etiqueta>
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <Opcion activo={tipoCita === "control"} onClick={() => setTipoCita("control")}>Control sano</Opcion>
            <Opcion activo={tipoCita === "cita"} onClick={() => setTipoCita("cita")}>Cita médica</Opcion>
          </div>

          <Etiqueta>Fecha y hora</Etiqueta>
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inputStyle} />
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} style={inputStyle} />
          </div>

          <Etiqueta>Médico (opcional)</Etiqueta>
          <input type="text" placeholder="Ej. Dra. Pérez" value={medico} onChange={(e) => setMedico(e.target.value)} style={{ ...inputStyle, marginBottom: "16px" }} />

          <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
            <div style={{ flex: 1 }}>
              <Etiqueta>Especialidad</Etiqueta>
              <input type="text" placeholder="Ej. Pediatría" value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <Etiqueta>Lugar</Etiqueta>
              <input type="text" placeholder="Cesfam / Clínica" value={lugar} onChange={(e) => setLugar(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <MensajeError error={errorManual} />
          <BotonGuardar disabled={!fecha || !hora || guardandoManual} onClick={guardarManual} texto="Agendar" />
        </>
      )}
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────────
   Modal: Registrar vacuna — paso 1: elegir cuál (si hay más de una
   pendiente); paso 2: confirmar fecha/hora/notas.
   ──────────────────────────────────────────────────────────────── */
function ModalRegistrarVacuna({ bebeId, token, onClose, onSaved }: any) {
  const [cargando, setCargando] = useState(true);
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [seleccionada, setSeleccionada] = useState<any | null>(null);

  const ahora = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const [fecha, setFecha] = useState(`${ahora.getFullYear()}-${p(ahora.getMonth() + 1)}-${p(ahora.getDate())}`);
  const [hora, setHora] = useState(`${p(ahora.getHours())}:${p(ahora.getMinutes())}`);
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/v1/salud/${bebeId}/vacunas`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: any[]) => {
        const filtradas = (data || [])
          .filter((v) => !v.aplicada && !v.no_corresponde_aun)
          .sort((a, b) => a.meses_edad_recomendada - b.meses_edad_recomendada);
        setPendientes(filtradas);
        if (filtradas.length === 1) setSeleccionada(filtradas[0]);
      })
      .finally(() => setCargando(false));
  }, [bebeId, token]);

  const confirmar = async () => {
    if (!seleccionada) return;
    setGuardando(true);
    setError(null);
    try {
      const [anio, mes, dia] = fecha.split("-").map(Number);
      const [h, m] = hora.split(":").map(Number);
      const fechaISO = new Date(anio, mes - 1, dia, h, m).toISOString();
      const res = await fetch(`${API_URL}/v1/salud/${bebeId}/vacunas/${seleccionada.vacuna_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ aplicada: true, fecha_aplicacion: fechaISO, notas: notas.trim() || null }),
      });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "No se pudo registrar. Intenta de nuevo.");
      }
    } catch {
      setError("Error de red. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo="Registrar vacuna" onClose={onClose}>
      {cargando ? (
        <p style={{ color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "20px 0" }}>Cargando…</p>
      ) : pendientes.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "20px 0" }}>
          No hay vacunas pendientes por ahora. 🎉
        </p>
      ) : !seleccionada ? (
        <div>
          {pendientes.map((v) => {
            return (
              <div
                key={v.vacuna_id}
                onClick={() => setSeleccionada(v)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px", padding: "12px 10px", borderRadius: "14px",
                  marginBottom: "8px", cursor: "pointer", background: "var(--surface-2)",
                }}
              >
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--theme-bg-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Syringe size={16} color="var(--theme-primary)" />
                </div>
                <div>
                  <div style={{ fontSize: "13.5px", fontWeight: 800, color: "var(--text)" }}>{v.nombre}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Recomendada a los {v.meses_edad_recomendada} {v.meses_edad_recomendada === 1 ? "mes" : "meses"}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          {pendientes.length > 1 && (
            <div onClick={() => setSeleccionada(null)} style={{ fontSize: "12px", color: "var(--theme-primary)", fontWeight: 700, cursor: "pointer", marginBottom: "14px" }}>
              ‹ Elegir otra vacuna
            </div>
          )}
          <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Syringe size={18} color="var(--theme-primary)" /> {seleccionada.nombre}
          </div>

          <Etiqueta>Fecha y hora de aplicación</Etiqueta>
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} max={`${ahora.getFullYear()}-${p(ahora.getMonth() + 1)}-${p(ahora.getDate())}`} style={inputStyle} />
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} style={inputStyle} />
          </div>

          <Etiqueta>Notas / Reacciones</Etiqueta>
          <input type="text" placeholder="Fiebre leve, etc." value={notas} onChange={(e) => setNotas(e.target.value)} style={{ ...inputStyle, marginBottom: "18px" }} />

          <MensajeError error={error} />
          <BotonGuardar disabled={guardando} onClick={confirmar} texto="Registrar" />
        </div>
      )}
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────────
   Componente principal: fila de accesos rápidos + modales
   ──────────────────────────────────────────────────────────────── */
type AccionRapida = "toma" | "sueno" | "panal" | "cita" | "vacuna" | null;

export default function AccesosRapidos({ bebeId, token, onRegistrado, sinTitulo, onRegistrarMedidas }: { bebeId: string; token: string; onRegistrado?: () => void; sinTitulo?: boolean; onRegistrarMedidas?: () => void }) {
  const [abierto, setAbierto] = useState<AccionRapida>(null);
  // Objeto {id, sueno_inicio} si hay un sueño abierto, o null si no.
  // Antes se guardaba solo un boolean y se perdía el id, así que no
  // había forma de despertar desde acá cuando ya había uno en curso.
  const [suenoEnCurso, setSuenoEnCurso] = useState<any | null>(null);
  const [despertando, setDespertando] = useState(false);

  const cargarResumen = () => {
    fetch(`${API_URL}/v1/diario/${bebeId}/registros/resumen`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setSuenoEnCurso(data?.sueno_en_curso ?? null))
      .catch(() => {});
  };

  useEffect(() => { cargarResumen(); }, [bebeId, token]);

  const onSaved = () => {
    cargarResumen();
    onRegistrado?.();
  };

  const despertar = async () => {
    if (!suenoEnCurso?.id) return;
    setDespertando(true);
    try {
      const res = await fetch(`${API_URL}/v1/diario/${bebeId}/registros/${suenoEnCurso.id}/despertar`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) onSaved();
    } finally {
      setDespertando(false);
    }
  };

  const botones: { key: AccionRapida; icon: any; label: string; bg: string; color: string; onClick?: () => void }[] = [
    { key: "toma", icon: Milk, label: "Registrar alimentación", bg: "#E3F2FD", color: "#1976D2" },
    suenoEnCurso
      ? { key: null, icon: Sun, label: despertando ? "Despertando…" : "Ya despertó", bg: "#FFF4E0", color: "#B27B16", onClick: despertar }
      : { key: "sueno" as AccionRapida, icon: Moon, label: "Se durmió", bg: "#EDE7F6", color: "#7C5CBF" },
    { key: "panal", icon: Baby, label: "Cambio de pañal", bg: "#FFF4E0", color: "#B27B16" },
    { key: "cita", icon: CalendarClock, label: "Agendar cita", bg: "#D7EEFF", color: "#1E4E8C" },
    { key: "vacuna", icon: Syringe, label: "Registrar vacuna", bg: "#FFE6CD", color: "#8A5212" },
    ...(onRegistrarMedidas
      ? [{ key: null, icon: Ruler, label: "Registrar medidas", bg: "#F7B8C4", color: "#7A3B45", onClick: onRegistrarMedidas }]
      : []),
  ];

  return (
    <div style={{ marginBottom: sinTitulo ? 0 : "22px" }}>
      {!sinTitulo && (
        <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: "0 0 12px 2px" }}>
          Accesos rápidos
        </h3>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "10px" }}>
        {botones.map(({ key, icon: Icon, label, bg, color, onClick }) => (
          <button
            key={label}
            onClick={onClick ?? (() => setAbierto(key))}
            disabled={label === "Despertando…"}
            style={{
              background: "var(--surface)", border: "none", borderRadius: "18px", padding: "14px 8px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer",
              boxShadow: "0 4px 14px rgba(124,92,191,0.08)", fontFamily: "'Nunito', sans-serif",
            }}
          >
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={19} color={color} />
            </div>
            <div style={{ fontSize: "11.5px", fontWeight: 800, color: "var(--text)", textAlign: "center", lineHeight: 1.25 }}>{label}</div>
          </button>
        ))}
      </div>

      {abierto === "toma" && <ModalRegistrarToma bebeId={bebeId} token={token} onClose={() => setAbierto(null)} onSaved={onSaved} />}
      {abierto === "panal" && <ModalCambioPanal bebeId={bebeId} token={token} onClose={() => setAbierto(null)} onSaved={onSaved} />}
      {abierto === "sueno" && <ConfirmarSueno bebeId={bebeId} token={token} onClose={() => setAbierto(null)} onSaved={onSaved} />}
      {abierto === "cita" && <ModalAgendarCita bebeId={bebeId} token={token} onClose={() => setAbierto(null)} onSaved={onSaved} />}
      {abierto === "vacuna" && <ModalRegistrarVacuna bebeId={bebeId} token={token} onClose={() => setAbierto(null)} onSaved={onSaved} />}
    </div>
  );
}
