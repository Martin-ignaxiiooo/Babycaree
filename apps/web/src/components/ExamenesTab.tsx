import React, { useEffect, useState, useCallback } from "react";
import { FlaskConical, Check, Clock, AlertTriangle, Camera, Loader2, Trash2, FileText, Mic, MicOff } from "lucide-react";
import { useDictado } from "../hooks/useDictado";
import { interpretarExamenesDictados } from "../utils/interpretarDictado";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

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

function formatearFecha(f?: string | null) {
  if (!f) return "";
  // Las fechas DATE vienen como YYYY-MM-DD; se parsean como local para que
  // no se corran un día por la zona horaria.
  const [a, m, d] = String(f).slice(0, 10).split("-").map(Number);
  if (!a || !m || !d) return "";
  return new Date(a, m - 1, d).toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

/** Un examen está atrasado si pasó la fecha sugerida y sigue pendiente. */
function estaAtrasado(ex: any): boolean {
  if (ex.estado !== "pendiente" || !ex.fecha_sugerida) return false;
  const [a, m, d] = String(ex.fecha_sugerida).slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d) < new Date(new Date().toDateString());
}

interface Props {
  bebeId: string;
  token: string;
}

export default function ExamenesTab({ bebeId, token }: Props) {
  const [examenes, setExamenes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [fechaSugerida, setFechaSugerida] = useState("");
  const [creando, setCreando] = useState(false);

  // Foto de la orden/indicación (el papel del médico), compartida por los
  // exámenes que se agreguen mientras esté puesta — normalmente es un
  // mismo papel con varios exámenes indicados.
  const [ordenFoto, setOrdenFoto] = useState<string | null>(null);
  const [subiendoOrdenFoto, setSubiendoOrdenFoto] = useState(false);

  // Examen que tiene el formulario de resultado abierto.
  const [abierto, setAbierto] = useState<string | null>(null);
  const [notas, setNotas] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [procesandoFoto, setProcesandoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/v1/salud/${bebeId}/examenes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setExamenes(await res.json());
      setError(null);
    } catch {
      setError("No pudimos cargar los exámenes.");
    } finally {
      setCargando(false);
    }
  }, [bebeId, token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /** Crea uno o varios exámenes de una vez, todos con la misma fecha y foto de orden (si hay). */
  const crearVarios = async (nombres: string[], fecha: string | null) => {
    setCreando(true);
    setError(null);
    try {
      for (const n of nombres) {
        const res = await fetch(`${API_URL}/v1/salud/${bebeId}/examenes`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ nombre: n, fecha_sugerida: fecha || null, orden_foto: ordenFoto }),
        });
        if (!res.ok) throw new Error();
      }
      cargar();
    } catch {
      setError("No se pudo agregar el examen.");
    } finally {
      setCreando(false);
    }
  };

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    await crearVarios([nombre.trim()], fechaSugerida || null);
    setNombre("");
    setFechaSugerida("");
  };

  const elegirOrdenFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("La orden de exámenes debe ser una imagen JPG, PNG o WEBP.");
      return;
    }
    setSubiendoOrdenFoto(true);
    setError(null);
    try {
      setOrdenFoto(await comprimirImagen(file));
    } catch {
      setError("No pudimos procesar esa imagen. Prueba con otra.");
    } finally {
      setSubiendoOrdenFoto(false);
    }
  };

  // Dictado por voz: "hemograma y radiografía de tórax para el martes"
  // agrega ambos exámenes de una vez, con esa misma fecha.
  const dictado = useDictado((texto) => {
    const { nombres, fecha } = interpretarExamenesDictados(texto);
    if (nombres.length === 0) return;
    const fechaStr = fecha
      ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`
      : null;
    crearVarios(nombres, fechaStr);
  });

  const actualizar = async (id: string, cambios: any) => {
    setGuardando(true);
    try {
      const res = await fetch(`${API_URL}/v1/salud/${bebeId}/examenes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(cambios),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error);
      }
      setAbierto(null);
      setNotas("");
      setFoto(null);
      cargar();
    } catch (e: any) {
      setError(e.message || "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este examen del registro?")) return;
    await fetch(`${API_URL}/v1/salud/${bebeId}/examenes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    cargar();
  };

  const elegirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcesandoFoto(true);
    try {
      setFoto(await comprimirImagen(file));
    } catch {
      setError("No pudimos procesar esa imagen.");
    } finally {
      setProcesandoFoto(false);
    }
  };

  const pendientes = examenes.filter((e) => e.estado === "pendiente");
  const atrasados = pendientes.filter(estaAtrasado);

  return (
    <div>
      {/* Resumen */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "22px", flexWrap: "wrap" }}>
        <div style={{ ...chip, background: "#FFF4E0", color: "#B27B16" }}>
          <strong style={chipNum}>{pendientes.length}</strong> pendientes
        </div>
        <div style={{ ...chip, background: "#FFF0F0", color: "#D97070" }}>
          <strong style={chipNum}>{atrasados.length}</strong> atrasados
        </div>
        <div style={{ ...chip, background: "#E8F7F1", color: "#3E8E6E" }}>
          <strong style={chipNum}>{examenes.filter((e) => e.estado === "realizado").length}</strong> realizados
        </div>
      </div>

      {/* Alta rápida */}
      <form onSubmit={crear} style={formCard}>
        <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--theme-darker)", marginBottom: "10px" }}>
          Agregar un examen indicado
        </div>

        {/* Dictado por voz: agrega uno o varios exámenes de una vez. */}
        {dictado.soportado && (
          <button
            type="button"
            onClick={dictado.escuchando ? dictado.detener : dictado.empezar}
            style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              padding: "9px 16px", borderRadius: "100px", border: "none",
              cursor: "pointer", fontFamily: "'Nunito', sans-serif",
              fontWeight: 800, fontSize: "12.5px", color: "#fff", marginBottom: "10px",
              background: dictado.escuchando ? "#D97070" : "var(--theme-primary)",
            }}
          >
            {dictado.escuchando ? <MicOff size={14} /> : <Mic size={14} />}
            {dictado.escuchando ? "Detener" : "Dictar exámenes"}
          </button>
        )}
        {dictado.texto && (
          <div style={{ background: "var(--theme-bg-light)", borderRadius: "10px", padding: "10px 12px", fontSize: "12.5px", color: "var(--theme-darker)", fontStyle: "italic", marginBottom: "10px" }}>
            “{dictado.texto}”
          </div>
        )}
        {dictado.error && (
          <div style={{ color: "#D97070", fontSize: "12px", fontWeight: 600, marginBottom: "10px" }}>
            {dictado.error}
          </div>
        )}

        {/* Foto de la orden: se adjunta a los exámenes que se agreguen mientras esté puesta. */}
        {ordenFoto ? (
          <div style={{ position: "relative", marginBottom: "12px", maxWidth: "260px" }}>
            <img src={ordenFoto} alt="Orden de exámenes" style={{ width: "100%", maxHeight: "160px", objectFit: "contain", borderRadius: "12px", border: "1.5px solid #E4DBF7", background: "#FBFAFE" }} />
            <button
              type="button" onClick={() => setOrdenFoto(null)}
              style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(45,38,64,0.75)", border: "none", borderRadius: "50%", width: "26px", height: "26px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              aria-label="Quitar foto"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 16px", border: "2px dashed #D9CDF2", borderRadius: "12px", background: "#FBFAFE", cursor: "pointer", marginBottom: "12px" }}>
            {subiendoOrdenFoto ? (
              <Loader2 size={18} className="spin-icon" />
            ) : (
              <>
                <FileText size={18} color="var(--theme-primary)" />
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--theme-primary)" }}>
                  Subir foto de la orden
                </span>
              </>
            )}
            <input
              type="file" accept="image/jpeg,image/png,image/webp"
              onChange={elegirOrdenFoto} style={{ display: "none" }}
            />
          </label>
        )}

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            value={nombre} onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Hemograma, ecografía de caderas…"
            style={{ ...input, flex: "2 1 220px", marginBottom: 0 }}
          />
          <input
            type="date" value={fechaSugerida} onChange={(e) => setFechaSugerida(e.target.value)}
            style={{ ...input, flex: "1 1 150px", marginBottom: 0 }}
            title="Fecha sugerida para hacerlo"
          />
          <button type="submit" disabled={creando || !nombre.trim()} style={btnPrimary}>
            {creando ? "Agregando…" : "Agregar"}
          </button>
        </div>
        <p style={{ fontSize: "12px", color: "#8A849C", margin: "10px 0 0" }}>
          Si pones fecha, te avisamos por correo cuando pase y no lo hayas marcado como hecho.
        </p>
      </form>

      {error && <div style={errorBox}>{error}</div>}

      {cargando ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#8A849C" }}>
          <Loader2 size={24} className="spin-icon" />
        </div>
      ) : examenes.length === 0 ? (
        <div style={vacio}>
          <FlaskConical size={38} color="var(--theme-primary)" style={{ opacity: 0.5 }} />
          <div style={{ fontWeight: 800, color: "var(--theme-darker)", marginTop: "10px" }}>
            Sin exámenes registrados
          </div>
          <div style={{ fontSize: "13.5px", color: "#8A849C", marginTop: "4px" }}>
            Cuando el pediatra indique uno, anótalo acá para no olvidarlo.
          </div>
        </div>
      ) : (
        examenes.map((ex) => {
          const atrasado = estaAtrasado(ex);
          const realizado = ex.estado === "realizado";
          const omitido = ex.estado === "omitido";
          return (
            <div key={ex.id} style={{ ...card, opacity: omitido ? 0.6 : 1 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div
                  style={{
                    ...iconCircle,
                    background: realizado ? "#E8F7F1" : atrasado ? "#FFF0F0" : "var(--theme-bg-light)",
                  }}
                >
                  {realizado ? (
                    <Check size={18} color="#3E8E6E" />
                  ) : atrasado ? (
                    <AlertTriangle size={18} color="#D97070" />
                  ) : (
                    <Clock size={18} color="var(--theme-primary)" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: "15px", color: "var(--theme-darker)" }}>
                    {ex.nombre}
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#8A849C", marginTop: "2px" }}>
                    {realizado
                      ? `Realizado ${formatearFecha(ex.fecha_realizacion)}`
                      : omitido
                        ? "Descartado"
                        : ex.fecha_sugerida
                          ? `Sugerido para el ${formatearFecha(ex.fecha_sugerida)}`
                          : "Sin fecha definida"}
                    {ex.cita_especialidad ? ` · de ${ex.cita_especialidad}` : ""}
                    {ex.tiene_orden_foto ? " · 📄 con orden" : ""}
                  </div>
                  {ex.resultado_notas && (
                    <div style={notasBox}>{ex.resultado_notas}</div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <span
                    style={{
                      ...badge,
                      background: realizado ? "#E8F7F1" : atrasado ? "#FFF0F0" : "#FFF4E0",
                      color: realizado ? "#3E8E6E" : atrasado ? "#D97070" : "#B27B16",
                    }}
                  >
                    {realizado ? "Hecho" : omitido ? "Descartado" : atrasado ? "Atrasado" : "Pendiente"}
                  </span>
                  <button onClick={() => eliminar(ex.id)} style={iconBtn} aria-label="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Acciones para exámenes pendientes */}
              {ex.estado === "pendiente" && abierto !== ex.id && (
                <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                  <button onClick={() => setAbierto(ex.id)} style={btnSmallPrimary}>
                    Ya me lo hice
                  </button>
                  <button
                    onClick={() => actualizar(ex.id, { estado: "omitido" })}
                    style={btnSmallGhost}
                  >
                    Ya no corresponde
                  </button>
                </div>
              )}

              {/* Formulario de resultado */}
              {abierto === ex.id && (
                <div style={{ marginTop: "14px", borderTop: "1px solid #EDE9F8", paddingTop: "14px" }}>
                  <textarea
                    value={notas} onChange={(e) => setNotas(e.target.value)}
                    placeholder="¿Qué dijo el resultado? (opcional)"
                    style={{ ...input, minHeight: "64px", resize: "vertical" }}
                  />
                  {foto ? (
                    <div style={{ position: "relative", marginBottom: "12px" }}>
                      <img src={foto} alt="Resultado" style={preview} />
                      <button onClick={() => setFoto(null)} style={borrarFotoBtn} aria-label="Quitar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <label style={uploadBox}>
                      {procesandoFoto ? (
                        <Loader2 size={18} className="spin-icon" />
                      ) : (
                        <>
                          <Camera size={18} color="var(--theme-primary)" />
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--theme-primary)" }}>
                            Subir foto del resultado
                          </span>
                        </>
                      )}
                      <input
                        type="file" accept="image/jpeg,image/png,image/webp"
                        onChange={elegirFoto} style={{ display: "none" }}
                      />
                    </label>
                  )}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => { setAbierto(null); setNotas(""); setFoto(null); }}
                      style={btnSmallGhost} disabled={guardando}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() =>
                        actualizar(ex.id, {
                          estado: "realizado",
                          resultado_notas: notas.trim() || null,
                          resultado_foto: foto,
                        })
                      }
                      style={btnSmallPrimary} disabled={guardando}
                    >
                      {guardando ? "Guardando…" : "Marcar como hecho"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

/* ── estilos ── */
const chip: React.CSSProperties = {
  padding: "10px 16px", borderRadius: "14px", fontSize: "13px", fontWeight: 700,
};
const chipNum: React.CSSProperties = { fontSize: "17px", fontWeight: 900, marginRight: "4px" };
const formCard: React.CSSProperties = {
  background: "#fff", borderRadius: "18px", padding: "18px",
  boxShadow: "0 4px 18px rgba(124,92,191,0.07)", marginBottom: "18px",
};
const input: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: "12px",
  border: "1.5px solid #E4DBF7", background: "#FBFAFE", fontSize: "14px",
  fontFamily: "'Nunito', sans-serif", color: "var(--theme-darker)",
  marginBottom: "12px", outline: "none", boxSizing: "border-box",
};
const btnPrimary: React.CSSProperties = {
  padding: "11px 22px", borderRadius: "12px", border: "none",
  background: "var(--theme-primary)", color: "#fff", fontWeight: 800,
  fontSize: "13.5px", cursor: "pointer", fontFamily: "'Nunito', sans-serif",
  whiteSpace: "nowrap",
};
const btnSmallPrimary: React.CSSProperties = {
  padding: "9px 16px", borderRadius: "100px", border: "none",
  background: "var(--theme-primary)", color: "#fff", fontWeight: 800,
  fontSize: "12.5px", cursor: "pointer", fontFamily: "'Nunito', sans-serif",
};
const btnSmallGhost: React.CSSProperties = {
  padding: "9px 16px", borderRadius: "100px", border: "1.5px solid #E4DBF7",
  background: "#fff", color: "#8A849C", fontWeight: 700,
  fontSize: "12.5px", cursor: "pointer", fontFamily: "'Nunito', sans-serif",
};
const card: React.CSSProperties = {
  background: "#fff", borderRadius: "18px", padding: "16px",
  boxShadow: "0 4px 18px rgba(124,92,191,0.06)", marginBottom: "12px",
};
const iconCircle: React.CSSProperties = {
  width: "38px", height: "38px", borderRadius: "50%", display: "flex",
  alignItems: "center", justifyContent: "center", flexShrink: 0,
};
const badge: React.CSSProperties = {
  padding: "4px 10px", borderRadius: "100px", fontSize: "11px",
  fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.3px",
  whiteSpace: "nowrap",
};
const iconBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", color: "#C4BFD4",
  display: "flex", alignItems: "center", padding: "4px",
};
const notasBox: React.CSSProperties = {
  marginTop: "8px", background: "#FBFAFE", borderRadius: "10px",
  padding: "10px 12px", fontSize: "13px", color: "#6B647F", lineHeight: 1.5,
};
const uploadBox: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
  padding: "16px", border: "2px dashed #D9CDF2", borderRadius: "12px",
  background: "#FBFAFE", cursor: "pointer", marginBottom: "12px",
};
const preview: React.CSSProperties = {
  width: "100%", maxHeight: "200px", objectFit: "contain",
  borderRadius: "12px", border: "1.5px solid #E4DBF7", background: "#FBFAFE",
};
const borrarFotoBtn: React.CSSProperties = {
  position: "absolute", top: "8px", right: "8px", background: "rgba(45,38,64,0.75)",
  border: "none", borderRadius: "50%", width: "26px", height: "26px", color: "#fff",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};
const errorBox: React.CSSProperties = {
  background: "#FFF0F0", color: "#D97070", borderRadius: "12px",
  padding: "12px 14px", fontSize: "13px", fontWeight: 600, marginBottom: "14px",
};
const vacio: React.CSSProperties = {
  textAlign: "center", padding: "48px 20px", background: "#fff",
  borderRadius: "18px", boxShadow: "0 4px 18px rgba(124,92,191,0.06)",
};
