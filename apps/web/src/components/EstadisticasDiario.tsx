import { useEffect, useState, useCallback } from "react";
import { Loader2, TrendingUp, TrendingDown, Minus, Moon, Milk, Baby } from "lucide-react";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

function duracion(min: number): string {
  if (!min) return "—";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m > 0 ? `${m}min` : ""}`.trim() : `${m} min`;
}

/** "cada 2h 30min" a partir de minutos. */
function cadaCuanto(min: number | null): string {
  if (!min) return "—";
  return `cada ${duracion(min)}`;
}

/**
 * Compara dos valores y describe el cambio en palabras.
 * Se ignoran diferencias menores al 10%: en un bebé, una variación chica
 * es ruido normal, y marcarla como "tendencia" sería alarmista.
 */
function comparar(antes: number, ahora: number, unidad: "tomas" | "sueno") {
  if (!antes || !ahora) return null;
  const cambio = ((ahora - antes) / antes) * 100;
  if (Math.abs(cambio) < 10) {
    return { icono: Minus, color: "var(--text-muted)", texto: "se mantiene estable" };
  }
  const subio = cambio > 0;
  const pct = Math.abs(Math.round(cambio));

  if (unidad === "tomas") {
    return subio
      ? { icono: TrendingUp, color: "#1976D2", texto: `come ${pct}% más seguido que hace unos días` }
      : { icono: TrendingDown, color: "#3E8E6E", texto: `las tomas se están espaciando (${pct}% menos)` };
  }
  return subio
    ? { icono: TrendingUp, color: "#3E8E6E", texto: `duerme ${pct}% más que hace unos días` }
    : { icono: TrendingDown, color: "#B27B16", texto: `duerme ${pct}% menos que hace unos días` };
}

/** Gráfico de barras simple, sin librerías: son pocos datos y así no pesa. */
function Lineas({ datos, campo, color, formato }: any) {
  const max = Math.max(...datos.map((d: any) => d[campo]), 1);
  const alto = 110;
  const n = datos.length;

  // Agrupa los días consecutivos que caen en el mismo mes, para mostrar el
  // nombre del mes una sola vez, centrado bajo ese grupo (en vez de
  // repetirlo pegado a cada número de día).
  const grupos: { mes: string; cantidad: number }[] = [];
  datos.forEach((d: any) => {
    const mes = new Date(d.dia + "T12:00:00").toLocaleDateString("es-CL", { month: "short" }).replace(".", "");
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.mes === mes) ultimo.cantidad++;
    else grupos.push({ mes, cantidad: 1 });
  });

  // Coordenadas iguales a las de Evolución de Peso/Talla (Salud.tsx): caja
  // de 340x100 con margen para los ejes, punto centrado en su columna.
  const left = 40, right = 330, top = 10, bottom = 85;
  const x = (i: number) => left + ((i + 0.5) / n) * (right - left);
  const y = (valor: number) => bottom - (valor / max) * (bottom - top);

  const puntos = datos.map((d: any, i: number) => `${x(i)},${y(d[campo])}`).join(" ");

  return (
    <div style={{ marginTop: "14px", display: "flex", gap: "8px" }}>
      {/* Eje Y: escala de referencia para leer el gráfico sin pasar el mouse */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: `${alto}px`, flexShrink: 0 }}>
        <span style={{ fontSize: "9px", color: "#B0ABC4", fontWeight: 700, whiteSpace: "nowrap" }}>{formato(max)}</span>
        <span style={{ fontSize: "9px", color: "#B0ABC4", fontWeight: 700, whiteSpace: "nowrap" }}>{formato(Math.round(max / 2))}</span>
        <span style={{ fontSize: "9px", color: "#B0ABC4", fontWeight: 700 }}>0</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ width: "100%", overflowX: "auto" }}>
          <svg viewBox="0 0 340 100" style={{ width: "100%", height: `${alto}px`, overflow: "visible", minWidth: "260px" }}>
            <rect width="340" height="100" fill="#F9FAFB" rx="8" />
            <line x1={left} y1={top} x2={left} y2={bottom} stroke="#E5E7EB" strokeWidth="0.8" />
            <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#E5E7EB" strokeWidth="0.8" />
            <line x1={left} y1={(top + bottom) / 2} x2={right} y2={(top + bottom) / 2} stroke="#F3F4F6" strokeWidth="0.6" />
            <polyline points={puntos} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
            {datos.map((d: any, i: number) => {
              const valor = d[campo];
              const fecha = new Date(d.dia + "T12:00:00");
              const esUltimo = i === n - 1;
              return (
                <circle key={i} cx={x(i)} cy={y(valor)} r={esUltimo ? 4.5 : 3.5} fill={color} stroke={esUltimo ? "#fff" : "none"} strokeWidth={2}>
                  <title>{`${fecha.toLocaleDateString("es-CL", { day: "numeric", month: "short" })}: ${formato(valor)}`}</title>
                </circle>
              );
            })}
          </svg>
        </div>
        <div style={{ display: "flex", gap: "4px", marginTop: "5px" }}>
          {datos.map((d: any, i: number) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <span style={{ fontSize: "9.5px", color: "#B0ABC4", fontWeight: 700 }}>
                {new Date(d.dia + "T12:00:00").getDate()}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", marginTop: "3px" }}>
          {grupos.map((g, i) => (
            <div key={i} style={{ flex: g.cantidad, textAlign: "center" }}>
              <span style={{ fontSize: "9px", color: "#8A849C", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.3px" }}>
                {g.mes}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Bloque({ titulo, children }: any) {
  return (
    <div style={{ background: "var(--surface)", borderRadius: "20px", padding: "20px 22px", marginBottom: "16px", boxShadow: "0 4px 18px rgba(124,92,191,0.06)" }}>
      <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "17px", color: "var(--text)", margin: "0 0 4px" }}>{titulo}</h3>
      {children}
    </div>
  );
}

function Dato({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div>
      <div style={{ fontSize: "21px", fontWeight: 900, color: "var(--theme-primary)", fontFamily: "'Baloo 2', sans-serif" }}>{valor}</div>
      <div style={{ fontSize: "12.5px", color: "var(--text-muted)", fontWeight: 600, marginTop: "1px" }}>{etiqueta}</div>
    </div>
  );
}

export default function EstadisticasDiario({ bebeId, token, refreshKey }: { bebeId: string; token: string; refreshKey?: number }) {
  const [datos, setDatos] = useState<any>(null);
  const [dias, setDias] = useState(14);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/v1/diario/${bebeId}/registros/estadisticas?dias=${dias}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setDatos(await res.json());
      setError(null);
    } catch {
      setError("No pudimos cargar las estadísticas.");
    } finally {
      setCargando(false);
    }
  }, [bebeId, token, dias]);

  // refreshKey cambia cada vez que se agrega/borra un registro desde la
  // página que contiene este componente (Registro diario), para que los
  // gráficos se actualicen sin tener que recargar la página entera.
  useEffect(() => { cargar(); }, [cargar, refreshKey]);


  if (cargando) {
    return <div style={{ textAlign: "center", padding: "50px", color: "var(--text-muted)" }}><Loader2 size={26} className="spin-icon" /></div>;
  }
  if (error) {
    return <div style={{ background: "#FFF0F0", color: "#D97070", borderRadius: "12px", padding: "14px 16px", fontWeight: 600 }}>{error}</div>;
  }

  // Con pocos días de registro, cualquier promedio engaña. Mejor decirlo
  // que mostrar conclusiones construidas sobre dos datos sueltos.
  if (!datos?.datos_suficientes) {
    return (
      <div style={{ background: "var(--surface)", borderRadius: "20px", padding: "48px 24px", textAlign: "center", boxShadow: "0 4px 18px rgba(124,92,191,0.06)" }}>
        <TrendingUp size={38} color="var(--theme-primary)" style={{ opacity: 0.45 }} />
        <div style={{ fontWeight: 800, color: "var(--text)", marginTop: "12px", fontSize: "16.5px" }}>
          Todavía no hay suficientes datos
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "6px", maxWidth: "380px", margin: "6px auto 0", lineHeight: 1.55 }}>
          Llevas {datos?.dias_con_datos ?? 0} {datos?.dias_con_datos === 1 ? "día" : "días"} con registros.
          Con unos días más podremos mostrarte cada cuánto come, cuánto duerme
          y si eso está cambiando.
        </div>
      </div>
    );
  }

  const tendenciaTomas = comparar(datos.tendencia.tomas_antes, datos.tendencia.tomas_ahora, "tomas");
  const tendenciaSueno = comparar(datos.tendencia.sueno_antes_min, datos.tendencia.sueno_ahora_min, "sueno");

  return (
    <div>
      {/* Selector de período */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
        {[7, 14, 30].map((d) => (
          <button
            key={d} onClick={() => setDias(d)}
            style={{
              padding: "8px 16px", borderRadius: "100px", cursor: "pointer",
              fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "13px",
              border: dias === d ? "2px solid var(--theme-primary)" : "1.5px solid #E4DBF7",
              background: dias === d ? "var(--theme-primary)" : "#fff",
              color: dias === d ? "#fff" : "#8A849C",
            }}
          >
            {d} días
          </button>
        ))}
      </div>

      {/* Tendencias: lo primero, porque es lo que no se ve mirando el diario */}
      {(tendenciaTomas || tendenciaSueno) && (
        <Bloque titulo="Qué está cambiando">
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
            {tendenciaTomas && (
              <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#E3F2FD", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <tendenciaTomas.icono size={17} color={tendenciaTomas.color} />
                </div>
                <span style={{ fontSize: "14.5px", color: "var(--text)", fontWeight: 600 }}>
                  Alimentación: {tendenciaTomas.texto}
                </span>
              </div>
            )}
            {tendenciaSueno && (
              <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#EDE7F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <tendenciaSueno.icono size={17} color={tendenciaSueno.color} />
                </div>
                <span style={{ fontSize: "14.5px", color: "var(--text)", fontWeight: 600 }}>
                  Sueño: {tendenciaSueno.texto}
                </span>
              </div>
            )}
          </div>
        </Bloque>
      )}

      {/* Alimentación */}
      <Bloque titulo="Alimentación">
        <div style={{ display: "flex", gap: "28px", flexWrap: "wrap", marginTop: "10px" }}>
          <Dato valor={cadaCuanto(datos.tomas.intervalo_promedio_min)} etiqueta="come, en promedio" />
          <Dato
            valor={String(Math.round(datos.por_dia.reduce((a: number, d: any) => a + d.tomas, 0) / Math.max(datos.dias_con_datos, 1)))}
            etiqueta="tomas al día"
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", marginTop: "18px", fontSize: "12.5px", color: "var(--text-muted)", fontWeight: 700 }}>
          <Milk size={14} color="#1976D2" /> Tomas por día
        </div>
        <Lineas datos={datos.por_dia} campo="tomas" color="#64B5F6" formato={(v: number) => `${v} tomas`} />
      </Bloque>

      {/* Sueño */}
      <Bloque titulo="Sueño">
        <div style={{ display: "flex", gap: "28px", flexWrap: "wrap", marginTop: "10px" }}>
          <Dato valor={duracion(datos.sueno.tramo_mas_largo_min)} etiqueta="tramo más largo" />
          <Dato valor={duracion(datos.sueno.promedio_noche_min)} etiqueta="promedio de noche" />
          <Dato valor={`${datos.sueno.siestas_por_dia}`} etiqueta="siestas al día" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", marginTop: "18px", fontSize: "12.5px", color: "var(--text-muted)", fontWeight: 700 }}>
          <Moon size={14} color="#7C5CBF" /> Total dormido por día
        </div>
        <Lineas datos={datos.por_dia} campo="sueno_min" color="#A07ADF" formato={duracion} />
      </Bloque>

      {/* Pañales */}
      <Bloque titulo="Pañales">
        <div style={{ marginTop: "10px" }}>
          <Dato
            valor={String(Math.round(datos.por_dia.reduce((a: number, d: any) => a + d.panales, 0) / Math.max(datos.dias_con_datos, 1)))}
            etiqueta="cambios al día, en promedio"
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", marginTop: "18px", fontSize: "12.5px", color: "var(--text-muted)", fontWeight: 700 }}>
          <Baby size={14} color="#B27B16" /> Cambios por día
        </div>
        <Lineas datos={datos.por_dia} campo="panales" color="#F7C873" formato={(v: number) => `${v} pañales`} />
      </Bloque>

      <p style={{ fontSize: "12px", color: "#B0ABC4", textAlign: "center", lineHeight: 1.6, marginTop: "18px" }}>
        Estos números salen de lo que registras y sirven para ver patrones,
        no para diagnosticar. Ante cualquier duda sobre la alimentación o el
        sueño de tu bebé, consulta con su pediatra.
      </p>
    </div>
  );
}
