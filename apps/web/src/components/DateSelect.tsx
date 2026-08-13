import { useMemo } from "react";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface DateSelectProps {
  /** Valor en formato ISO "yyyy-mm-dd", o "" si está vacío */
  value: string;
  /** Se llama con el nuevo valor en formato ISO "yyyy-mm-dd" (o "" si queda incompleto) */
  onChange: (isoDate: string) => void;
  /** Fecha máxima permitida en formato ISO "yyyy-mm-dd" (opcional) */
  max?: string;
  /** Fecha mínima permitida en formato ISO "yyyy-mm-dd" (opcional) */
  min?: string;
  required?: boolean;
  /** "light" para fondo blanco (formularios claros), "dark" para fondo traslúcido sobre tarjetas oscuras */
  variant?: "light" | "dark";
}

/**
 * Selector de fecha con 3 dropdowns (Día / Mes / Año) en orden chileno.
 * No usa <input type="date"> porque el formato mostrado por ese control nativo
 * depende del idioma configurado en el NAVEGADOR (no del sitio ni del lang del
 * HTML), así que un usuario con Chrome en inglés ve mm/dd/aaaa sin que
 * podamos evitarlo. Con dropdowns propios el orden día/mes/año queda
 * garantizado siempre, en cualquier navegador.
 */
export default function DateSelect({
  value,
  onChange,
  max,
  min,
  required,
  variant = "light",
}: DateSelectProps) {
  const [year, month, day] = value ? value.split("-") : ["", "", ""];

  const maxYear = max ? parseInt(max.split("-")[0], 10) : new Date().getFullYear() + 1;
  const minYear = min ? parseInt(min.split("-")[0], 10) : maxYear - 110;

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = maxYear; y >= minYear; y--) arr.push(y);
    return arr;
  }, [minYear, maxYear]);

  const daysInMonth = useMemo(() => {
    if (!year || !month) return 31;
    return new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
  }, [year, month]);

  const days = useMemo(() => {
    const arr: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [daysInMonth]);

  const pad = (n: string | number) => String(n).padStart(2, "0");

  const emit = (newDay: string, newMonth: string, newYear: string) => {
    if (newDay && newMonth && newYear) {
      onChange(`${newYear}-${pad(newMonth)}-${pad(newDay)}`);
    } else {
      onChange("");
    }
  };

  const isDark = variant === "dark";

  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "stretch",
    borderRadius: "14px",
    border: isDark ? "1px solid rgba(255,255,255,0.15)" : "2px solid var(--theme-bg-light)",
    background: isDark ? "rgba(255,255,255,0.08)" : "#FDFCFF",
    overflow: "hidden",
    transition: "border-color 0.2s, background 0.2s",
  };

  const dividerStyle: React.CSSProperties = {
    width: "1px",
    background: isDark ? "rgba(255,255,255,0.15)" : "var(--theme-bg-light)",
    alignSelf: "stretch",
    margin: "8px 0",
  };

  const chevron = isDark
    ? "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'><path d='M1 1L5 5L9 1' stroke='rgba(255,255,255,0.55)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>"
    : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'><path d='M1 1L5 5L9 1' stroke='%237C5CBF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>";

  const selectStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    padding: "13px 26px 13px 12px",
    border: "none",
    background: `url("${chevron}") no-repeat right 10px center`,
    color: isDark ? "white" : "var(--theme-darker)",
    outline: "none",
    fontFamily: "'Nunito', sans-serif",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
  };

  const emptyOptionColor = isDark ? "rgba(255,255,255,0.45)" : "#B0ABC4";

  return (
    <div
      style={containerStyle}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--theme-light)";
        if (isDark) e.currentTarget.style.background = "rgba(255,255,255,0.14)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.15)" : "var(--theme-bg-light)";
        if (isDark) e.currentTarget.style.background = "rgba(255,255,255,0.08)";
      }}
    >
      <select
        aria-label="Día"
        required={required}
        value={day ? parseInt(day, 10) : ""}
        onChange={(e) => emit(e.target.value, month, year)}
        style={{ ...selectStyle, flex: "0 1 56px" }}
      >
        <option value="" style={{ color: emptyOptionColor }}>Día</option>
        {days.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <div style={dividerStyle} />
      <select
        aria-label="Mes"
        required={required}
        value={month ? parseInt(month, 10) : ""}
        onChange={(e) => emit(day, e.target.value, year)}
        style={{ ...selectStyle, flex: "1 1 96px" }}
      >
        <option value="" style={{ color: emptyOptionColor }}>Mes</option>
        {MESES.map((nombre, idx) => (
          <option key={nombre} value={idx + 1}>{nombre}</option>
        ))}
      </select>
      <div style={dividerStyle} />
      <select
        aria-label="Año"
        required={required}
        value={year || ""}
        onChange={(e) => emit(day, month, e.target.value)}
        style={{ ...selectStyle, flex: "0 1 74px" }}
      >
        <option value="" style={{ color: emptyOptionColor }}>Año</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}
