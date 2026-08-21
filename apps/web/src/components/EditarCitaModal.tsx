import React, { useState } from "react";
import { X } from "lucide-react";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

interface Props {
  bebeId: string;
  cita: any;
  token: string;
  onClose: () => void;
  onGuardado: () => void;
}

/** "2026-10-03T13:30:00.000Z" -> { fecha: "2026-10-03", hora: "10:30" } en hora local. */
function partirFechaLocal(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    fecha: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    hora: `${p(d.getHours())}:${p(d.getMinutes())}`,
  };
}

export default function EditarCitaModal({ bebeId, cita, token, onClose, onGuardado }: Props) {
  const inicial = partirFechaLocal(cita.fecha_cita);

  const [fecha, setFecha] = useState(inicial.fecha);
  const [hora, setHora] = useState(inicial.hora);
  const [tipo, setTipo] = useState<"control" | "cita">(cita.tipo === "control" ? "control" : "cita");
  const [medico, setMedico] = useState(cita.medico ?? "");
  const [lugar, setLugar] = useState(cita.lugar ?? "");
  const [especialidad, setEspecialidad] = useState(cita.especialidad ?? "");
  const [notas, setNotas] = useState(cita.notas ?? "");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    if (!fecha || !hora) {
      setError("Completa la fecha y la hora.");
      return;
    }
    const [anio, mes, dia] = fecha.split("-").map(Number);
    const [h, m] = hora.split(":").map(Number);
    const d = new Date(anio, mes - 1, dia, h, m);
    if (Number.isNaN(d.getTime())) {
      setError("La fecha u hora no son válidas.");
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/v1/salud/${bebeId}/citas/${cita.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fecha_cita: d.toISOString(),
          tipo,
          medico: medico.trim() || null,
          lugar: lugar.trim() || null,
          especialidad: especialidad.trim() || null,
          notas: notas.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo guardar el cambio.");
      }
      onGuardado();
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Algo salió mal. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={ov} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <h3 style={headerTitle}>Editar cita</h3>
          <button onClick={onClose} style={closeBtn} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div style={body}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
            {(["control", "cita"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                style={{
                  flex: 1, padding: "11px", borderRadius: "12px", cursor: "pointer",
                  fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "13.5px",
                  border: tipo === t ? "2px solid var(--theme-primary)" : "2px solid #E4DBF7",
                  background: tipo === t ? "var(--theme-primary)" : "#fff",
                  color: tipo === t ? "#fff" : "var(--theme-darker)",
                }}
              >
                {t === "control" ? "Control sano" : "Cita médica"}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={label}>Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>Hora</label>
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} style={input} />
            </div>
          </div>

          <label style={label}>Médico</label>
          <input value={medico} onChange={(e) => setMedico(e.target.value)} placeholder="Dra. Pérez" style={input} />

          <label style={label}>Especialidad</label>
          <input value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} placeholder="Pediatría" style={input} />

          <label style={label}>Lugar</label>
          <input value={lugar} onChange={(e) => setLugar(e.target.value)} placeholder="Cesfam / Clínica" style={input} />

          <label style={label}>Notas</label>
          <textarea
            value={notas} onChange={(e) => setNotas(e.target.value)}
            style={{ ...input, minHeight: "64px", resize: "vertical" }}
          />

          {error && <div style={errorBox}>{error}</div>}
        </div>

        <div style={footer}>
          <button onClick={onClose} style={cancelBtn} disabled={guardando}>Cancelar</button>
          <button onClick={guardar} style={saveBtn} disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

const ov: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(45,38,64,0.55)", zIndex: 1000,
  display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
};
const modal: React.CSSProperties = {
  background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "460px",
  maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden",
  fontFamily: "'Nunito', sans-serif",
};
const header: React.CSSProperties = {
  background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
  padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center",
};
const headerTitle: React.CSSProperties = {
  fontFamily: "'Baloo 2', sans-serif", fontSize: "19px", color: "#fff", margin: 0,
};
const closeBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.22)", border: "none", borderRadius: "50%",
  width: "28px", height: "28px", display: "flex", alignItems: "center",
  justifyContent: "center", cursor: "pointer", color: "#fff", flexShrink: 0,
};
const body: React.CSSProperties = { padding: "20px 22px", overflowY: "auto" };
const label: React.CSSProperties = {
  display: "block", fontSize: "12.5px", fontWeight: 800,
  color: "var(--theme-darker)", marginBottom: "6px", marginTop: "12px",
};
const input: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: "12px",
  border: "1.5px solid #E4DBF7", background: "#FBFAFE", fontSize: "14px",
  fontFamily: "'Nunito', sans-serif", color: "var(--theme-darker)",
  outline: "none", boxSizing: "border-box",
};
const errorBox: React.CSSProperties = {
  background: "#FFF0F0", color: "#D97070", borderRadius: "12px",
  padding: "12px 14px", fontSize: "13px", fontWeight: 600, marginTop: "14px",
};
const footer: React.CSSProperties = {
  display: "flex", gap: "10px", padding: "16px 22px",
  borderTop: "1px solid #EDE9F8", background: "#FBFAFE",
};
const cancelBtn: React.CSSProperties = {
  flex: 1, padding: "13px", borderRadius: "100px", border: "1.5px solid #E4DBF7",
  background: "#fff", color: "#8A849C", fontWeight: 800, fontSize: "14px",
  cursor: "pointer", fontFamily: "'Nunito', sans-serif",
};
const saveBtn: React.CSSProperties = {
  flex: 2, padding: "13px", borderRadius: "100px", border: "none",
  background: "var(--theme-primary)", color: "#fff", fontWeight: 800,
  fontSize: "14px", cursor: "pointer", fontFamily: "'Nunito', sans-serif",
};
