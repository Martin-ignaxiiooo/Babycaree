import { useState, useEffect } from "react";
import { Mic, MicOff, X, Volume2, Baby, Milk, Moon, Sun, CalendarClock, Ruler } from "lucide-react";
import { useDictado } from "../hooks/useDictado";
import { clasificarDictado, type RegistroDictado, type TipoRegistro } from "../utils/clasificarDictado";
import { hablar, callar, vozActiva } from "../utils/voz";

import { API_URL } from "../config/api";

const ICONOS: Record<TipoRegistro, any> = {
  panal: Baby,
  alimentacion: Milk,
  sueno: Moon,
  despertar: Sun,
  cita: CalendarClock,
  medidas: Ruler,
};

const TITULOS: Record<TipoRegistro, string> = {
  panal: "Cambio de pañal",
  alimentacion: "Alimentación",
  sueno: "Sueño",
  despertar: "Ya despertó",
  cita: "Cita médica",
  medidas: "Medidas",
};

/**
 * Dictado universal: un solo botón para registrar cualquier cosa. A
 * diferencia del dictado de "Agendar cita" (que asume que lo dictado es
 * una cita), acá primero se identifica QUÉ se quiere registrar.
 *
 * La confirmación es mixta a propósito: se lee en voz alta lo que se
 * entendió, pero se decide con botones en pantalla. Responder "sí" por
 * voz obligaría a encender el micrófono otra vez, y con ruido de fondo
 * (llanto, TV) es fácil quedar atrapado repitiendo.
 */
export default function ModalDictadoUniversal({ bebeId, token, onClose, onSaved }: any) {
  const [interpretado, setInterpretado] = useState<RegistroDictado | null>(null);
  const [noReconocido, setNoReconocido] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dictado = useDictado((texto) => {
    const r = clasificarDictado(texto);
    if (!r) {
      setNoReconocido(true);
      setInterpretado(null);
      hablar("No logré identificar qué registrar. Intenta de nuevo.");
      return;
    }
    setNoReconocido(false);
    setInterpretado(r);
    hablar(`Entendido: ${r.resumen}. ¿Confirmo?`);
  });

  // Si se cierra el modal mientras la voz habla, se corta.
  useEffect(() => () => callar(), []);

  const confirmar = async () => {
    if (!interpretado) return;
    setGuardando(true);
    setError(null);
    callar();
    try {
      let res: Response;
      if (interpretado.tipo === "despertar") {
        // Cerrar un sueño necesita el id del que está abierto, que no se
        // puede saber al interpretar el texto: se consulta acá.
        const resumenRes = await fetch(`${API_URL}/v1/diario/${bebeId}/registros/resumen`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const resumen = resumenRes.ok ? await resumenRes.json() : null;
        const suenoAbierto = resumen?.sueno_en_curso;

        if (!suenoAbierto?.id) {
          setError("No hay ningún sueño en curso para cerrar.");
          setGuardando(false);
          return;
        }

        res = await fetch(`${API_URL}/v1/diario/${bebeId}/registros/${suenoAbierto.id}/despertar`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (interpretado.tipo === "cita") {
        res = await fetch(`${API_URL}/v1/salud/${bebeId}/citas`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(interpretado.datos),
        });
      } else if (interpretado.tipo === "medidas") {
        res = await fetch(`${API_URL}/v1/salud/${bebeId}/crecimiento`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            fecha_registro: new Date().toISOString(),
            peso_kg: interpretado.datos.peso_kg,
            talla_cm: interpretado.datos.talla_cm,
            notas: null,
          }),
        });
      } else {
        // Pañal, alimentación y sueño van todos al diario.
        res = await fetch(`${API_URL}/v1/diario/${bebeId}/registros`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(interpretado.datos),
        });
      }

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

  const reintentar = () => {
    callar();
    setInterpretado(null);
    setNoReconocido(false);
    setError(null);
    dictado.empezar();
  };

  const Icono = interpretado ? ICONOS[interpretado.tipo] : null;

  return (
    <div
      onClick={() => { callar(); onClose(); }}
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
            {interpretado ? "¿Está bien?" : "Registrar hablando"}
          </div>
          <button
            onClick={() => { callar(); onClose(); }}
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

        {/* ── Estado inicial / escuchando ── */}
        {!interpretado && !noReconocido && (
          <div style={{ textAlign: "center" }}>
            <button
              onClick={dictado.escuchando ? dictado.detener : dictado.empezar}
              style={{
                width: "76px", height: "76px", borderRadius: "50%", margin: "6px auto 16px",
                background: dictado.escuchando ? "#D97070" : "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "none", cursor: "pointer",
                boxShadow: dictado.escuchando ? "0 0 0 8px rgba(217,112,112,0.15)" : "0 8px 24px var(--theme-shadow-light)",
              }}
            >
              {dictado.escuchando ? <MicOff size={30} color="#fff" /> : <Mic size={30} color="#fff" />}
            </button>
            <div style={{ fontSize: "13.5px", fontWeight: 800, color: "var(--text)", marginBottom: "8px" }}>
              {dictado.escuchando ? "Escuchando…" : "Toca para hablar"}
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Habla normal. Se detiene solo cuando haces una pausa.
            </p>
            <div style={{ background: "var(--surface-2)", borderRadius: "12px", padding: "12px 14px", marginTop: "14px", fontSize: "11.5px", color: "#6B647F", lineHeight: 1.8, textAlign: "left" }}>
              <strong>Puedes decir:</strong><br />
              · "pañal con pipí amarillo"<br />
              · "biberón de 120 mililitros"<br />
              · "cita con el doctor González el lunes a las 5"<br />
              · "pesó 7 kilos 200 y midió 65"
            </div>
          </div>
        )}

        {/* ── No se reconoció ── */}
        {noReconocido && (
          <div>
            {dictado.texto && (
              <div style={{ background: "var(--surface-2)", borderLeft: "3px solid var(--theme-light)", borderRadius: "0 10px 10px 0", padding: "11px 13px", fontSize: "12.5px", color: "var(--text)", fontStyle: "italic", marginBottom: "14px" }}>
                "{dictado.texto}"
              </div>
            )}
            <div style={{ background: "#FFF7ED", borderLeft: "3px solid #F59E0B", borderRadius: "0 10px 10px 0", padding: "12px 14px", fontSize: "12.5px", color: "#92400E", lineHeight: 1.5, marginBottom: "16px" }}>
              No reconocí si esto es alimentación, un pañal, sueño, una cita o medidas. Intenta de nuevo mencionando qué registrar.
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => { callar(); onClose(); }} style={btnSec}>Cerrar</button>
              <button onClick={reintentar} style={btnPri}>Repetir</button>
            </div>
          </div>
        )}

        {/* ── Confirmación ── */}
        {interpretado && (
          <div>
            {dictado.texto && (
              <div style={{ background: "var(--theme-bg-light)", borderLeft: "3px solid var(--theme-light)", borderRadius: "0 10px 10px 0", padding: "11px 13px", fontSize: "12.5px", color: "var(--text)", fontStyle: "italic", marginBottom: "14px" }}>
                "{dictado.texto}"
              </div>
            )}

            {vozActiva() && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--theme-bg-light)", borderRadius: "100px", padding: "7px 13px", fontSize: "11px", color: "var(--theme-primary)", fontWeight: 800, marginBottom: "14px" }}>
                <Volume2 size={14} /> Confirmando en voz alta…
              </div>
            )}

            <div style={{ background: "var(--surface-2)", borderRadius: "14px", padding: "14px 16px", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 800, color: "var(--text)", marginBottom: "10px" }}>
                {Icono && <Icono size={18} color="var(--theme-primary)" />}
                {TITULOS[interpretado.tipo]}
              </div>
              {interpretado.detalles.map((d, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "12.5px", padding: "5px 0", borderBottom: i < interpretado.detalles.length - 1 ? "1px solid var(--border-soft)" : "none" }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>{d.etiqueta}</span>
                  <span style={{ color: "var(--text)", fontWeight: 700, textAlign: "right" }}>{d.valor}</span>
                </div>
              ))}
            </div>

            {error && (
              <p style={{ fontSize: "12.5px", color: "#D97070", fontWeight: 700, margin: "10px 0 0", lineHeight: 1.4 }}>{error}</p>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button onClick={reintentar} disabled={guardando} style={btnSec}>Repetir</button>
              <button onClick={confirmar} disabled={guardando} style={{ ...btnPri, opacity: guardando ? 0.7 : 1 }}>
                {guardando ? "Guardando…" : "Confirmar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const btnSec: React.CSSProperties = {
  flex: 1, padding: "12px", borderRadius: "100px", border: "none",
  background: "var(--surface-2)", color: "var(--text-muted)",
  fontWeight: 800, fontSize: "13.5px", cursor: "pointer", fontFamily: "'Nunito', sans-serif",
};

const btnPri: React.CSSProperties = {
  flex: 1, padding: "12px", borderRadius: "100px", border: "none",
  background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
  color: "#fff", fontWeight: 800, fontSize: "13.5px", cursor: "pointer", fontFamily: "'Nunito', sans-serif",
};
