interface TimeSelectProps {
  /** Valor en formato "HH:mm" (24h), o "" si está vacío */
  value: string;
  onChange: (time: string) => void;
  required?: boolean;
  variant?: "light" | "dark";
}

/**
 * Selector de hora con 2 dropdowns (Hora / Minuto) en formato 24h, hermano
 * visual de DateSelect. Evita el control nativo type="time", cuyo formato
 * (12h con AM/PM vs 24h) también depende del idioma del navegador.
 */
export default function TimeSelect({
  value,
  onChange,
  required,
  variant = "light",
}: TimeSelectProps) {
  const [hour, minute] = value ? value.split(":") : ["", ""];

  const pad = (n: string | number) => String(n).padStart(2, "0");

  const emit = (newHour: string, newMinute: string) => {
    if (newHour !== "" && newMinute !== "") {
      onChange(`${pad(newHour)}:${pad(newMinute)}`);
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

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

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
        aria-label="Hora"
        required={required}
        value={hour !== "" ? parseInt(hour, 10) : ""}
        onChange={(e) => emit(e.target.value, minute)}
        style={selectStyle}
      >
        <option value="" style={{ color: emptyOptionColor }}>Hora</option>
        {hours.map((h) => (
          <option key={h} value={h}>{pad(h)}</option>
        ))}
      </select>
      <div style={dividerStyle} />
      <select
        aria-label="Minuto"
        required={required}
        value={minute !== "" ? parseInt(minute, 10) : ""}
        onChange={(e) => emit(hour, e.target.value)}
        style={selectStyle}
      >
        <option value="" style={{ color: emptyOptionColor }}>Min</option>
        {minutes.map((m) => (
          <option key={m} value={m}>{pad(m)}</option>
        ))}
      </select>
    </div>
  );
}
