import { useEffect, useState } from "react";
import { X, Printer, Loader2 } from "lucide-react";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

/**
 * Informe médico para llevar al pediatra.
 *
 * Se genera con window.print() y una hoja de estilos @media print en vez
 * de una librería tipo jsPDF: el navegador ya sabe paginar, respeta las
 * fuentes y permite "Guardar como PDF" desde el mismo diálogo. Sumar una
 * librería de ~300 KB para replicar eso peor no se justificaba.
 *
 * El contenido está pensado para lo que un médico pregunta en la consulta:
 * cuánto pesa, qué vacunas tiene, qué le diagnosticaron antes, y -si hay
 * registro diario- cómo come y duerme.
 */

interface Props {
  bebeId: string;
  perfil: any;
  token: string;
  onClose: () => void;
}

function fecha(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function duracion(min: number): string {
  if (!min) return "—";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}min` : `${m} min`;
}

function calcularEdad(nacimiento?: string | null): string {
  if (!nacimiento) return "—";
  const n = new Date(nacimiento);
  const hoy = new Date();
  let meses = (hoy.getFullYear() - n.getFullYear()) * 12 + (hoy.getMonth() - n.getMonth());
  if (hoy.getDate() < n.getDate()) meses--;
  if (meses < 1) {
    const dias = Math.floor((hoy.getTime() - n.getTime()) / 86400000);
    return `${dias} días`;
  }
  if (meses < 24) return `${meses} ${meses === 1 ? "mes" : "meses"}`;
  const años = Math.floor(meses / 12);
  return `${años} años ${meses % 12} meses`;
}

export default function InformeMedico({ bebeId, perfil, token, onClose }: Props) {
  const [datos, setDatos] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      const h = { Authorization: `Bearer ${token}` };
      try {
        // Se piden en paralelo y con allSettled: si el diario todavía no
        // tiene datos o falla, el informe igual se genera con el resto.
        const [vac, crec, citas, exam, stats] = await Promise.allSettled([
          fetch(`${API_URL}/v1/salud/${bebeId}/vacunas`, { headers: h }),
          fetch(`${API_URL}/v1/salud/${bebeId}/crecimiento`, { headers: h }),
          fetch(`${API_URL}/v1/salud/${bebeId}/citas`, { headers: h }),
          fetch(`${API_URL}/v1/salud/${bebeId}/examenes`, { headers: h }),
          fetch(`${API_URL}/v1/diario/${bebeId}/registros/estadisticas?dias=14`, { headers: h }),
        ]);

        const leer = async (r: PromiseSettledResult<Response>) => {
          if (r.status !== "fulfilled" || !r.value.ok) return null;
          return r.value.json();
        };

        setDatos({
          vacunas: (await leer(vac)) ?? [],
          crecimiento: (await leer(crec)) ?? [],
          citas: (await leer(citas)) ?? [],
          examenes: (await leer(exam)) ?? [],
          stats: await leer(stats),
        });
      } catch {
        setError("No pudimos reunir toda la información.");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [bebeId, token]);

  const aplicadas = (datos?.vacunas ?? []).filter((v: any) => v.aplicada);
  const pendientes = (datos?.vacunas ?? []).filter((v: any) => !v.aplicada);
  const consultas = (datos?.citas ?? []).filter((c: any) => c.diagnostico || c.asistio);
  const ultimoCrec = (datos?.crecimiento ?? [])[0];

  return (
    <div style={ov} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        {/* Barra de acciones: no se imprime */}
        <div style={barra} className="no-imprimir">
          <div>
            <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "18px", color: "#fff", margin: 0 }}>
              Informe médico
            </h3>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12.5px", margin: "2px 0 0" }}>
              Usa “Guardar como PDF” en el diálogo de impresión
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => window.print()} disabled={cargando} style={btnImprimir}>
              <Printer size={16} /> Imprimir / PDF
            </button>
            <button onClick={onClose} style={btnCerrar} aria-label="Cerrar"><X size={18} /></button>
          </div>
        </div>

        <div style={cuerpo} id="informe-medico">
          {cargando ? (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
              <Loader2 size={28} className="spin-icon" />
              <div style={{ marginTop: "12px", fontSize: "14px" }}>Reuniendo el historial…</div>
            </div>
          ) : error ? (
            <div style={{ color: "#D97070", padding: "20px", fontWeight: 600 }}>{error}</div>
          ) : (
            <>
              {/* Encabezado */}
              <div style={{ borderBottom: "2px solid #2D2640", paddingBottom: "14px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h1 style={{ fontSize: "22px", margin: 0, color: "var(--text)", fontFamily: "'Baloo 2', sans-serif" }}>
                      Historial de salud
                    </h1>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6B647F" }}>
                      Generado el {fecha(new Date().toISOString())} · Baby Care
                    </p>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "12.5px", color: "#6B647F" }}>
                    <div style={{ fontWeight: 800, fontSize: "16px", color: "var(--text)" }}>{perfil?.nombre ?? "—"}</div>
                    <div>Nacimiento: {fecha(perfil?.fecha_nacimiento)}</div>
                    <div>Edad: {calcularEdad(perfil?.fecha_nacimiento)}</div>
                    {perfil?.prevision_salud && <div>Previsión: {perfil.prevision_salud}</div>}
                  </div>
                </div>
              </div>

              {/* Medidas actuales */}
              <Seccion titulo="Medidas actuales">
                {ultimoCrec ? (
                  <div style={{ display: "flex", gap: "34px", flexWrap: "wrap" }}>
                    <Medida etiqueta="Peso" valor={ultimoCrec.peso_kg ? `${ultimoCrec.peso_kg} kg` : "—"} />
                    <Medida etiqueta="Talla" valor={ultimoCrec.talla_cm ? `${ultimoCrec.talla_cm} cm` : "—"} />
                    <Medida etiqueta="Última medición" valor={fecha(ultimoCrec.fecha_registro)} />
                  </div>
                ) : <Vacio>Sin mediciones registradas.</Vacio>}
              </Seccion>

              {/* Historial de crecimiento */}
              {datos.crecimiento.length > 1 && (
                <Seccion titulo="Evolución del crecimiento">
                  <Tabla
                    columnas={["Fecha", "Peso", "Talla"]}
                    filas={datos.crecimiento.slice(0, 12).map((c: any) => [
                      fecha(c.fecha_registro),
                      c.peso_kg ? `${c.peso_kg} kg` : "—",
                      c.talla_cm ? `${c.talla_cm} cm` : "—",
                    ])}
                  />
                </Seccion>
              )}

              {/* Vacunas */}
              <Seccion titulo={`Vacunas aplicadas (${aplicadas.length})`}>
                {aplicadas.length > 0 ? (
                  <Tabla
                    columnas={["Vacuna", "Edad indicada", "Fecha de aplicación"]}
                    filas={aplicadas.map((v: any) => [
                      v.nombre,
                      v.meses_edad_recomendada === 0 ? "Al nacer" : `${v.meses_edad_recomendada} meses`,
                      fecha(v.fecha_aplicacion),
                    ])}
                  />
                ) : <Vacio>Sin vacunas registradas como aplicadas.</Vacio>}
              </Seccion>

              {pendientes.length > 0 && (
                <Seccion titulo={`Vacunas pendientes (${pendientes.length})`}>
                  <Tabla
                    columnas={["Vacuna", "Edad indicada"]}
                    filas={pendientes.slice(0, 15).map((v: any) => [
                      v.nombre,
                      v.meses_edad_recomendada === 0 ? "Al nacer" : `${v.meses_edad_recomendada} meses`,
                    ])}
                  />
                </Seccion>
              )}

              {/* Consultas */}
              <Seccion titulo="Consultas y diagnósticos">
                {consultas.length > 0 ? (
                  consultas.slice(0, 15).map((c: any, i: number) => (
                    <div key={i} style={{ borderLeft: "3px solid #7C5CBF", paddingLeft: "12px", marginBottom: "14px" }}>
                      <div style={{ fontWeight: 800, fontSize: "13.5px", color: "var(--text)" }}>
                        {fecha(c.fecha_cita)} · {c.tipo === "control" ? "Control sano" : "Consulta"}
                        {c.especialidad ? ` · ${c.especialidad}` : ""}
                      </div>
                      {c.medico && <div style={{ fontSize: "12.5px", color: "#6B647F" }}>{c.medico}{c.lugar ? ` — ${c.lugar}` : ""}</div>}
                      {c.diagnostico && (
                        <div style={{ fontSize: "13px", marginTop: "5px" }}>
                          <strong>Diagnóstico:</strong> {c.diagnostico}
                        </div>
                      )}
                      {c.indicaciones && (
                        <div style={{ fontSize: "13px", marginTop: "3px" }}>
                          <strong>Indicaciones:</strong> {c.indicaciones}
                        </div>
                      )}
                      {(c.peso_kg || c.talla_cm) && (
                        <div style={{ fontSize: "12.5px", color: "#6B647F", marginTop: "3px" }}>
                          {c.peso_kg ? `Peso: ${c.peso_kg} kg` : ""}{c.peso_kg && c.talla_cm ? " · " : ""}
                          {c.talla_cm ? `Talla: ${c.talla_cm} cm` : ""}
                        </div>
                      )}
                    </div>
                  ))
                ) : <Vacio>Sin consultas registradas.</Vacio>}
              </Seccion>

              {/* Exámenes */}
              {datos.examenes.length > 0 && (
                <Seccion titulo="Exámenes">
                  <Tabla
                    columnas={["Examen", "Estado", "Fecha", "Resultado"]}
                    filas={datos.examenes.slice(0, 15).map((e: any) => [
                      e.nombre,
                      { pendiente: "Pendiente", realizado: "Realizado", omitido: "Descartado" }[e.estado as string] ?? e.estado,
                      fecha(e.fecha_realizacion ?? e.fecha_sugerida),
                      e.resultado_notas ?? "—",
                    ])}
                  />
                </Seccion>
              )}

              {/* Patrones del diario: solo si hay datos suficientes */}
              {datos.stats?.datos_suficientes && (
                <Seccion titulo="Alimentación y sueño (últimos 14 días)">
                  <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", marginBottom: "8px" }}>
                    <Medida
                      etiqueta="Intervalo entre tomas"
                      valor={datos.stats.tomas.intervalo_promedio_min ? duracion(datos.stats.tomas.intervalo_promedio_min) : "—"}
                    />
                    <Medida etiqueta="Sueño nocturno promedio" valor={duracion(datos.stats.sueno.promedio_noche_min)} />
                    <Medida etiqueta="Tramo más largo" valor={duracion(datos.stats.sueno.tramo_mas_largo_min)} />
                    <Medida etiqueta="Siestas al día" valor={String(datos.stats.sueno.siestas_por_dia)} />
                  </div>
                  <p style={{ fontSize: "11.5px", color: "var(--text-muted)", margin: 0 }}>
                    Promedios calculados sobre {datos.stats.dias_con_datos} días con registro.
                  </p>
                </Seccion>
              )}

              <div style={{ borderTop: "1px solid #DDD", marginTop: "24px", paddingTop: "12px", fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                Este informe reúne la información registrada por la familia en Baby Care.
                No reemplaza la ficha clínica ni constituye un documento médico oficial.
              </div>
            </>
          )}
        </div>
      </div>

      {/* Al imprimir: solo el informe, sin el marco de la aplicación */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #informe-medico, #informe-medico * { visibility: visible; }
          #informe-medico {
            position: absolute; left: 0; top: 0; width: 100%;
            padding: 0; margin: 0; max-height: none; overflow: visible;
          }
          .no-imprimir { display: none !important; }
          @page { margin: 1.6cm; }
        }
      `}</style>
    </div>
  );
}

/* ── piezas ── */

function Seccion({ titulo, children }: any) {
  return (
    <div style={{ marginBottom: "22px", breakInside: "avoid" }}>
      <h2 style={{ fontSize: "14px", fontWeight: 900, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px", paddingBottom: "5px", borderBottom: "1px solid #E4DBF7" }}>
        {titulo}
      </h2>
      {children}
    </div>
  );
}

function Medida({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3px" }}>{etiqueta}</div>
      <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--text)" }}>{valor}</div>
    </div>
  );
}

function Tabla({ columnas, filas }: { columnas: string[]; filas: any[][] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
      <thead>
        <tr>
          {columnas.map((c) => (
            <th key={c} style={{ textAlign: "left", padding: "6px 8px", background: "#F6F2FF", color: "#4A3770", fontWeight: 800, fontSize: "11.5px", borderBottom: "1px solid #E4DBF7" }}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filas.map((f, i) => (
          <tr key={i}>
            {f.map((celda, j) => (
              <td key={j} style={{ padding: "6px 8px", borderBottom: "1px solid #F0EDF7", color: "#374151" }}>
                {celda}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Vacio({ children }: any) {
  return <p style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic", margin: 0 }}>{children}</p>;
}

/* ── estilos del modal ── */
const ov: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(45,38,64,0.6)", zIndex: 1000,
  display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
};
const modal: React.CSSProperties = {
  background: "var(--surface)", borderRadius: "20px", width: "100%", maxWidth: "780px",
  maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden",
  fontFamily: "'Nunito', sans-serif",
};
const barra: React.CSSProperties = {
  background: "linear-gradient(120deg, var(--theme-darker), var(--theme-primary))",
  padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px",
};
const cuerpo: React.CSSProperties = { padding: "28px 32px", overflowY: "auto", background: "var(--surface)" };
const btnImprimir: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "7px", background: "var(--surface)",
  color: "var(--theme-primary)", border: "none", borderRadius: "100px",
  padding: "10px 18px", fontWeight: 800, fontSize: "13.5px", cursor: "pointer",
  fontFamily: "'Nunito', sans-serif",
};
const btnCerrar: React.CSSProperties = {
  background: "rgba(255,255,255,0.22)", border: "none", borderRadius: "50%",
  width: "34px", height: "34px", display: "flex", alignItems: "center",
  justifyContent: "center", cursor: "pointer", color: "#fff",
};
