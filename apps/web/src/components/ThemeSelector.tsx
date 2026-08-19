import { useState, useEffect } from "react";
import { Palette } from "lucide-react";

type ThemeConfig = {
  id: string;
  name: string;
  primary: string;
  variables: Record<string, string>;
};

const THEMES: ThemeConfig[] = [
  {
    id: "purple",
    name: "Morado Baby Care",
    primary: "#7C5CBF",
    variables: {
      "--theme-primary": "#7C5CBF",
      "--theme-light": "#A07ADF",
      "--theme-dark": "#4A3770",
      "--theme-darker": "#2D2640",
      "--theme-bg-light": "#EDE9F8",
      "--theme-bg-hover": "#E5E0F4",
      "--theme-shadow": "rgba(124, 92, 191, 0.35)",
      "--theme-shadow-light": "rgba(124, 92, 191, 0.12)",
      "--theme-shadow-bg": "rgba(124, 92, 191, 0.2)"
    }
  },
  {
    id: "blue",
    name: "Azul Pediátrico",
    primary: "#3B82F6",
    variables: {
      "--theme-primary": "#3B82F6",
      "--theme-light": "#60A5FA",
      "--theme-dark": "#1E40AF",
      "--theme-darker": "#172554",
      "--theme-bg-light": "#EFF6FF",
      "--theme-bg-hover": "#DBEAFE",
      "--theme-shadow": "rgba(59, 130, 246, 0.35)",
      "--theme-shadow-light": "rgba(59, 130, 246, 0.12)",
      "--theme-shadow-bg": "rgba(59, 130, 246, 0.2)"
    }
  },
  {
    id: "pink",
    name: "Rosa Suave",
    primary: "#EC4899",
    variables: {
      "--theme-primary": "#EC4899",
      "--theme-light": "#F472B6",
      "--theme-dark": "#BE185D",
      "--theme-darker": "#831843",
      "--theme-bg-light": "#FDF2F8",
      "--theme-bg-hover": "#FCE7F3",
      "--theme-shadow": "rgba(236, 72, 153, 0.35)",
      "--theme-shadow-light": "rgba(236, 72, 153, 0.12)",
      "--theme-shadow-bg": "rgba(236, 72, 153, 0.2)"
    }
  },
  {
    id: "green",
    name: "Verde Naturaleza",
    primary: "#10B981",
    variables: {
      "--theme-primary": "#10B981",
      "--theme-light": "#34D399",
      "--theme-dark": "#047857",
      "--theme-darker": "#064E3B",
      "--theme-bg-light": "#ECFDF5",
      "--theme-bg-hover": "#D1FAE5",
      "--theme-shadow": "rgba(16, 185, 129, 0.35)",
      "--theme-shadow-light": "rgba(16, 185, 129, 0.12)",
      "--theme-shadow-bg": "rgba(16, 185, 129, 0.2)"
    }
  },
  {
    id: "gray",
    name: "Gris Elegante",
    primary: "#475569",
    variables: {
      "--theme-primary": "#475569",
      "--theme-light": "#64748B",
      "--theme-dark": "#1E293B",
      "--theme-darker": "#0F172A",
      "--theme-bg-light": "#F1F5F9",
      "--theme-bg-hover": "#E2E8F0",
      "--theme-shadow": "rgba(71, 85, 105, 0.35)",
      "--theme-shadow-light": "rgba(71, 85, 105, 0.12)",
      "--theme-shadow-bg": "rgba(71, 85, 105, 0.2)"
    }
  }
];

export default function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<string>("purple");

  useEffect(() => {
    // Restaurar tema guardado
    const saved = localStorage.getItem("app_theme");
    if (saved) {
      applyTheme(saved);
    }
  }, []);

  const applyTheme = (themeId: string) => {
    const theme = THEMES.find((t) => t.id === themeId);
    if (!theme) return;
    
    // Aplicar variables al :root (documentElement)
    Object.entries(theme.variables).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });
    
    setActiveTheme(themeId);
    localStorage.setItem("app_theme", themeId);
    setIsOpen(false);
  };

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999 }}>
      {isOpen && (
        <div 
          style={{
            position: "absolute",
            bottom: "60px",
            right: "0",
            background: "white",
            padding: "16px",
            borderRadius: "16px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            minWidth: "160px",
            fontFamily: "'Nunito', sans-serif"
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
            Elige tu tema
          </div>
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => applyTheme(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "8px",
                backgroundColor: activeTheme === t.id ? "#F1F5F9" : "transparent",
                transition: "background 0.2s"
              }}
            >
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: t.primary, border: "2px solid white", boxShadow: "0 0 0 1px rgba(0,0,0,0.1)" }} />
              <span style={{ fontSize: "14px", fontWeight: activeTheme === t.id ? 700 : 500, color: "#334155" }}>
                {t.name}
              </span>
            </button>
          ))}
        </div>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "var(--theme-primary)",
          border: "none",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 8px 20px var(--theme-shadow)",
          transition: "transform 0.2s"
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        title="Personalizar colores"
      >
        <Palette size={22} />
      </button>
    </div>
  );
}
