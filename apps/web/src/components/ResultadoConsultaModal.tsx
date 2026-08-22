import React, { useState } from "react";
import { X, Camera, Loader2, Trash2, Mic, MicOff, FileText } from "lucide-react";
import { useDictado } from "../hooks/useDictado";
import { interpretarExamenesDictados } from "../utils/interpretarDictado";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

/**
 * Comprime la foto antes de subirla. Las recetas son texto, así que se
 * prioriza que se lea bien (lado largo generoso) sobre que pese poco.
 */
function comprimirImagen(file: File, maxDim = 1400, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("El archivo no es una imagen válida"));
      img.onload = () => {
        const escala = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No se pudo procesar la imagen"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface Props {
  bebeId: string;
  cita: any;
  token: string;
  onClose: () => void;
  onGuardado: () => void;
}

export default function ResultadoConsultaModal({ bebeId, cita, token, onClose, onGuardado }: Props) {
  const esControl = cita?.tipo === "control";

  const [asistio, setAsistio] = useState<boolean>(cita?.asistio ?? true);
  const [peso, setPeso] = useState(cita?.peso_kg ? String(cita.peso_kg) : "");
  const [talla, setTalla] = useState(cita?.talla_cm ? String(cita.talla_cm) : "");
  const [diagnostico, setDiagnostico] = useState(cita?.diagnostico ?? "");
  const [indicaciones, setIndicaciones] = useState(cita?.indicaciones ?? "");
  const [recetaFoto, setRecetaFoto] = useState<string | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  // Exámenes que salieron de esta consulta. Se crean junto con el resultado.
  const [examenes, setExamenes] = useState<{ nombre: string; fecha_sugerida: string }[]>([]);
  const [nuevoExamen, setNuevoExamen] = useState("");
  const [nuevoExamenFecha, setNuevoExamenFecha] = useState("");

  // Foto de la orden/indicación de exámenes (el papel del médico), distinta
  // de la receta y distinta de la foto del RESULTADO (que se sube después,
  // cuando el examen ya se hizo, desde la pestaña de Exámenes).
  const [ordenExamenFoto, setOrdenExamenFoto] = useState<string | null>(null);
  const [subiendoFotoExamen, setSubiendoFotoExamen] = useState(false);

  // Dictado por voz para agregar exámenes sin escribir: "hemograma y
  // radiografía de tórax para el martes" agrega dos exámenes con esa fecha.
  const dictadoExamenes = useDictado((texto) => {
    const { nombres, fecha } = interpretarExamenesDictados(texto);
    if (nombres.length === 0) return;
    const fechaStr = fecha
      ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`
      : "";
    setExamenes((prev) => [...prev, ...nombres.map((nombre) => ({ nombre, fecha_sugerida: fechaStr }))]);
  });

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const elegirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("La receta debe ser una imagen JPG, PNG o WEBP.");
      return;
    }
    setSubiendoFoto(true);
    setError(null);
    try {
      setRecetaFoto(await comprimirImagen(file));
    } catch {
      setError("No pudimos procesar esa imagen. Prueba con otra.");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const elegirFotoExamenes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("La orden de exámenes debe ser una imagen JPG, PNG o WEBP.");
      return;
    }
    setSubiendoFotoExamen(true);
    setError(null);
    try {
      setOrdenExamenFoto(await comprimirImagen(file));
    } catch {
      setError("No pudimos procesar esa imagen. Prueba con otra.");
    } finally {
      setSubiendoFotoExamen(false);
    }
  };

  const agregarExamen = () => {
    const nombre = nuevoExamen.trim();
    if (!nombre) return;
    setExamenes((prev) => [...prev, { nombre, fecha_sugerida: nuevoExamenFecha }]);
    setNuevoExamen("");
    setNuevoExamenFecha("");
  };

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/v1/salud/${bebeId}/citas/${cita.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          asistio,
          estado: "completada",
          peso_kg: peso || null,
          talla_cm: talla || null,
          diagnostico: diagnostico.trim() || null,
          indicaciones: indicaciones.trim() || null,
          receta_foto: recetaFoto,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo guardar el resultado.");
      }

      // Los exámenes se crean después: si alguno falla, el resultado de la
      // consulta ya quedó guardado y no se pierde lo escrito. La foto de la
      // orden (si se subió) se adjunta a todos, porque suele ser un mismo
      // papel con varios exámenes indicados.
      for (const ex of examenes) {
        await fetch(`${API_URL}/v1/salud/${bebeId}/examenes`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            nombre: ex.nombre,
            fecha_sugerida: ex.fecha_sugerida || null,
            cita_id: cita.id,
            orden_foto: ordenExamenFoto,
          }),
        }).catch(() => {});
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
          <div>
            <div style={headerTag}>{esControl ? "Control sano" : "Cita médica"}</div>
            <h3 style={headerTitle}>¿Cómo te fue?</h3>
          </div>
          <button onClick={onClose} style={closeBtn} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div style={body}>
          {/* Asistencia */}
          <label style={label}>¿Asististe?</label>
          <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
            <button
              type="button"
              onClick={() => setAsistio(true)}
              style={asistio ? toggleOn : toggleOff}
            >
              Sí, fuimos
            </button>
            <button
              type="button"
              onClick={() => setAsistio(false)}
              style={!asistio ? toggleOn : toggleOff}
            >
              No pudimos ir
            </button>
          </div>

          {asistio && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={label}>Peso (kg)</label>
                  <input
                    type="number" step="0.01" inputMode="decimal"
                    value={peso} onChange={(e) => setPeso(e.target.value)}
                    placeholder="5.80" style={input}
                  />
                </div>
                <div>
                  <label style={label}>Talla (cm)</label>
                  <input
                    type="number" step="0.1" inputMode="decimal"
                    value={talla} onChange={(e) => setTalla(e.target.value)}
                    placeholder="58.5" style={input}
                  />
                </div>
              </div>
              <p style={ayuda}>
                Si anotas peso o talla, se agregan solos a la curva de crecimiento.
              </p>

              <label style={label}>Diagnóstico</label>
              <textarea
                value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)}
                placeholder={esControl ? "Todo dentro de lo normal…" : "Qué dijo el médico…"}
                style={{ ...input, minHeight: "72px", resize: "vertical" }}
              />

              <label style={label}>Indicaciones y tratamiento</label>
              <textarea
                value={indicaciones} onChange={(e) => setIndicaciones(e.target.value)}
                placeholder="Medicamentos, dosis, cuidados…"
                style={{ ...input, minHeight: "72px", resize: "vertical" }}
              />

              {/* Receta */}
              <label style={label}>Foto de la receta</label>
              {recetaFoto ? (
                <div style={{ position: "relative", marginBottom: "16px" }}>
                  <img src={recetaFoto} alt="Receta" style={preview} />
                  <button
                    type="button" onClick={() => setRecetaFoto(null)}
                    style={borrarFotoBtn} aria-label="Quitar foto"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ) : (
                <label style={uploadBox}>
                  {subiendoFoto ? (
                    <Loader2 size={20} className="spin-icon" />
                  ) : (
                    <>
                      <Camera size={20} color="var(--theme-primary)" />
                      <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--theme-primary)" }}>
                        Subir foto de la receta
                      </span>
                    </>
                  )}
                  <input
                    type="file" accept="image/jpeg,image/png,image/webp"
                    onChange={elegirFoto} style={{ display: "none" }}
                  />
                </label>
              )}

              {/* Exámenes: foto de la orden, justo debajo de la receta */}
              <label style={label}>Subir exámenes</label>
              {ordenExamenFoto ? (
                <div style={{ position: "relative", marginBottom: "16px" }}>
                  <img src={ordenExamenFoto} alt="Orden de exámenes" style={preview} />
                  <button
                    type="button" onClick={() => setOrdenExamenFoto(null)}
                    style={borrarFotoBtn} aria-label="Quitar foto"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ) : (
                <label style={uploadBox}>
                  {subiendoFotoExamen ? (
                    <Loader2 size={20} className="spin-icon" />
                  ) : (
                    <>
                      <FileText size={20} color="var(--theme-primary)" />
                      <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--theme-primary)" }}>
                        Subir foto de la orden de exámenes
                      </span>
                    </>
                  )}
                  <input
                    type="file" accept="image/jpeg,image/png,image/webp"
                    onChange={elegirFotoExamenes} style={{ display: "none" }}
                  />
                </label>
              )}

              {/* Exámenes indicados */}
              <label style={label}>¿Te indicaron exámenes?</label>

              {/* Dictado por voz: "hemograma y radiografía de tórax para el martes" */}
              {dictadoExamenes.soportado && (
                <button
                  type="button"
                  onClick={dictadoExamenes.escuchando ? dictadoExamenes.detener : dictadoExamenes.empezar}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "7px",
                    padding: "9px 16px", borderRadius: "100px", border: "none",
                    cursor: "pointer", fontFamily: "'Nunito', sans-serif",
                    fontWeight: 800, fontSize: "12.5px", color: "#fff", marginBottom: "10px",
                    background: dictadoExamenes.escuchando ? "#D97070" : "var(--theme-primary)",
                  }}
                >
                  {dictadoExamenes.escuchando ? <MicOff size={14} /> : <Mic size={14} />}
                  {dictadoExamenes.escuchando ? "Detener" : "Dictar exámenes"}
                </button>
              )}
              {dictadoExamenes.texto && (
                <div style={{ ...transcripcionPreview, marginBottom: "10px" }}>“{dictadoExamenes.texto}”</div>
              )}
              {dictadoExamenes.error && (
                <div style={{ color: "#D97070", fontSize: "12px", fontWeight: 600, marginBottom: "10px" }}>
                  {dictadoExamenes.error}
                </div>
              )}
              {examenes.map((ex, i) => (
                <div key={i} style={examenRow}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--text)" }}>
                      {ex.nombre}
                    </div>
                    {ex.fecha_sugerida && (
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Para el {ex.fecha_sugerida}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setExamenes((p) => p.filter((_, j) => j !== i))}
                    style={borrarExamenBtn} aria-label="Quitar examen"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                <input
                  value={nuevoExamen}
                  onChange={(e) => setNuevoExamen(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregarExamen(); } }}
                  placeholder="Ej: Hemograma"
                  style={{ ...input, marginBottom: 0, flex: 2 }}
                />
                <input
                  type="date"
                  value={nuevoExamenFecha}
                  onChange={(e) => setNuevoExamenFecha(e.target.value)}
                  style={{ ...input, marginBottom: 0, flex: 1.2 }}
                />
                <button type="button" onClick={agregarExamen} style={agregarBtn}>
                  Añadir
                </button>
              </div>
              <p style={ayuda}>
                Te recordaremos por correo si pasa la fecha y no lo has marcado como hecho.
              </p>
            </>
          )}

          {error && <div style={errorBox}>{error}</div>}
        </div>

        <div style={footer}>
          <button onClick={onClose} style={cancelBtn} disabled={guardando}>
            Cancelar
          </button>
          <button onClick={guardar} style={saveBtn} disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar resultado"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── estilos ── */
const ov: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(45,38,64,0.55)", zIndex: 1000,
  display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
};
const modal: React.CSSProperties = {
  background: "var(--surface)", borderRadius: "24px", width: "100%", maxWidth: "520px",
  maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden",
  fontFamily: "'Nunito', sans-serif",
};
const header: React.CSSProperties = {
  background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
  padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start",
};
const headerTag: React.CSSProperties = {
  fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.85)",
  textTransform: "uppercase", letterSpacing: "0.06em",
};
const headerTitle: React.CSSProperties = {
  fontFamily: "'Baloo 2', sans-serif", fontSize: "21px", color: "#fff", margin: "2px 0 0",
};
const closeBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.22)", border: "none", borderRadius: "50%",
  width: "30px", height: "30px", display: "flex", alignItems: "center",
  justifyContent: "center", cursor: "pointer", color: "#fff", flexShrink: 0,
};
const body: React.CSSProperties = { padding: "22px 24px", overflowY: "auto" };
const label: React.CSSProperties = {
  display: "block", fontSize: "12.5px", fontWeight: 800,
  color: "var(--text)", marginBottom: "6px", marginTop: "4px",
};
const input: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: "12px",
  border: "1.5px solid var(--border)", background: "var(--surface-3)", fontSize: "14px",
  fontFamily: "'Nunito', sans-serif", color: "var(--text)",
  marginBottom: "14px", outline: "none", boxSizing: "border-box",
};
const ayuda: React.CSSProperties = {
  fontSize: "12px", color: "var(--text-muted)", margin: "-8px 0 16px", lineHeight: 1.5,
};
const toggleOn: React.CSSProperties = {
  flex: 1, padding: "11px", borderRadius: "12px", border: "2px solid var(--theme-primary)",
  background: "var(--theme-primary)", color: "#fff", fontWeight: 800,
  fontSize: "13.5px", cursor: "pointer", fontFamily: "'Nunito', sans-serif",
};
const toggleOff: React.CSSProperties = {
  flex: 1, padding: "11px", borderRadius: "12px", border: "2px solid var(--border)",
  background: "var(--surface)", color: "var(--text-muted)", fontWeight: 700,
  fontSize: "13.5px", cursor: "pointer", fontFamily: "'Nunito', sans-serif",
};
const transcripcionPreview: React.CSSProperties = {
  background: "var(--theme-bg-light)", borderRadius: "10px", padding: "10px 12px",
  fontSize: "12.5px", color: "var(--text)", fontStyle: "italic",
};
const uploadBox: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
  padding: "20px", border: "2px dashed #D9CDF2", borderRadius: "14px",
  background: "var(--surface-3)", cursor: "pointer", marginBottom: "16px",
};
const preview: React.CSSProperties = {
  width: "100%", maxHeight: "220px", objectFit: "contain",
  borderRadius: "12px", border: "1.5px solid var(--border)", background: "var(--surface-3)",
};
const borrarFotoBtn: React.CSSProperties = {
  position: "absolute", top: "8px", right: "8px", background: "rgba(45,38,64,0.75)",
  border: "none", borderRadius: "50%", width: "28px", height: "28px", color: "#fff",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};
const examenRow: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "8px", background: "var(--theme-bg-light)",
  borderRadius: "12px", padding: "10px 12px", marginBottom: "8px",
};
const borrarExamenBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
  display: "flex", alignItems: "center",
};
const agregarBtn: React.CSSProperties = {
  padding: "0 16px", borderRadius: "12px", border: "none",
  background: "var(--theme-primary)", color: "#fff", fontWeight: 800,
  fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap",
  fontFamily: "'Nunito', sans-serif",
};
const errorBox: React.CSSProperties = {
  background: "#FFF0F0", color: "#D97070", borderRadius: "12px",
  padding: "12px 14px", fontSize: "13px", fontWeight: 600, marginTop: "8px",
};
const footer: React.CSSProperties = {
  display: "flex", gap: "10px", padding: "16px 24px",
  borderTop: "1px solid var(--border-soft)", background: "var(--surface-3)",
};
const cancelBtn: React.CSSProperties = {
  flex: 1, padding: "13px", borderRadius: "100px", border: "1.5px solid var(--border)",
  background: "var(--surface)", color: "var(--text-muted)", fontWeight: 800, fontSize: "14px",
  cursor: "pointer", fontFamily: "'Nunito', sans-serif",
};
const saveBtn: React.CSSProperties = {
  flex: 2, padding: "13px", borderRadius: "100px", border: "none",
  background: "var(--theme-primary)", color: "#fff", fontWeight: 800,
  fontSize: "14px", cursor: "pointer", fontFamily: "'Nunito', sans-serif",
};
