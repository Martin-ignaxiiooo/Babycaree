import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Shield,
  Heart,
  TrendingUp,
  Lock,
  Baby,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";
const TOTAL_STEPS = 4;

// ─── Input reutilizable FUERA de cualquier componente (fix de re-render) ──────
interface InputFieldProps {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showToggle?: boolean;
  show?: boolean;
  onToggle?: () => void;
}

function InputField({
  label,
  type,
  placeholder,
  value,
  onChange,
  showToggle,
  show,
  onToggle,
}: InputFieldProps) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "13px",
          fontWeight: 700,
          color: "var(--theme-darker)",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginBottom: "10px",
        }}
      >
        {label} <span style={{ color: "#F4A0A0" }}>*</span>
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={showToggle ? (show ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete="off"
          style={{
            width: "100%",
            padding: "16px 20px",
            paddingRight: showToggle ? "54px" : "20px",
            border: "2px solid var(--theme-bg-light)",
            borderRadius: "18px",
            fontSize: "17px",
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 500,
            color: "var(--theme-darker)",
            background: "#FDFCFF",
            outline: "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "var(--theme-primary)";
            e.target.style.boxShadow = "0 0 0 5px var(--theme-shadow-light)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--theme-bg-light)";
            e.target.style.boxShadow = "none";
          }}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            style={{
              position: "absolute",
              right: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9C94BC",
              padding: "4px",
            }}
          >
            {show ? <EyeOff size={22} /> : <Eye size={22} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  const pct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;
  const labels = ["Inicio", "Cuenta", "Bebé", "Legal"];
  return (
    <div style={{ marginBottom: "3rem" }}>
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        {/* Línea de fondo */}
        <div
          style={{
            position: "absolute",
            top: "22px",
            left: "24px",
            right: "24px",
            height: "5px",
            background: "var(--theme-bg-light)",
            borderRadius: "5px",
            zIndex: 0,
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: "5px",
              background: "linear-gradient(90deg, var(--theme-primary), #F4A0A0)",
              width: `${pct}%`,
              transition: "width 0.6s ease-out",
            }}
          />
        </div>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
          <div
            key={n}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: 800,
                transition: "all 0.3s",
                background:
                  n < step ? "#6DBE9E" : n === step ? "var(--theme-primary)" : "var(--theme-bg-light)",
                color: n <= step ? "white" : "#9C94BC",
                boxShadow:
                  n === step ? "0 6px 20px rgba(124,92,191,0.45)" : "none",
                transform: n === step ? "scale(1.18)" : "scale(1)",
              }}
            >
              {n < step ? <Check size={20} strokeWidth={3} /> : n}
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: n === step ? "var(--theme-primary)" : "#B0ABC4",
              }}
            >
              {labels[n - 1]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Trust Badge ───────────────────────────────────────────────────────────────
function TrustBadge() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "18px 22px",
        borderRadius: "20px",
        background: "var(--theme-bg-light)",
        border: "1px solid rgba(124,92,191,0.15)",
        marginBottom: "28px",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: "46px",
          height: "46px",
          borderRadius: "50%",
          background: "var(--theme-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Lock size={20} color="white" />
      </div>
      <div>
        <p
          style={{
            fontSize: "15px",
            fontWeight: 800,
            color: "var(--theme-darker)",
            marginBottom: "3px",
          }}
        >
          Registro seguro con cifrado bancario
        </p>
        <p style={{ fontSize: "14px", color: "#8A849C", lineHeight: 1.4 }}>
          Tus datos se resguardan bajo la Ley 19.628 y 21.719 de Chile.
        </p>
      </div>
      <Shield
        size={24}
        color="rgba(124,92,191,0.4)"
        style={{ marginLeft: "auto", flexShrink: 0 }}
      />
    </div>
  );
}

// ─── Paso 1: Selección ─────────────────────────────────────────────────────────
function StepOne({
  flow,
  setFlow,
}: {
  flow: string | null;
  setFlow: (v: string) => void;
}) {
  const options = [
    {
      id: "hijo",
      icon: Baby,
      accent: "#F4A0A0",
      accentBg: "rgba(244,160,160,0.12)",
      label: "Registrar a mi bebé",
      desc: "Para bebés que ya están en tus brazos. Haremos juntos el seguimiento de su crecimiento, vacunas y controles pediátricos.",
    },
    {
      id: "embarazo",
      icon: Sparkles,
      accent: "var(--theme-primary)",
      accentBg: "rgba(124,92,191,0.08)",
      label: "Registrar mi embarazo",
      desc: "Te acompañaremos semana a semana con amor e información hasta el gran día del nacimiento.",
    },
  ];

  return (
    <div>
      <TrustBadge />
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {options.map(({ id, icon: Icon, accent, accentBg, label, desc }) => {
          const active = flow === id;
          return (
            <div
              key={id}
              onClick={() => setFlow(id)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "18px",
                padding: "20px 22px",
                borderRadius: "20px",
                cursor: "pointer",
                border: `2px solid ${active ? accent : "transparent"}`,
                background: active ? accentBg : "white",
                boxShadow: active
                  ? `0 8px 30px rgba(0,0,0,0.07), 0 0 0 0px ${accent}`
                  : "0 2px 12px rgba(0,0,0,0.04)",
                transform: active ? "scale(1.01)" : "scale(1)",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 6px 24px rgba(0,0,0,0.08)";
                  (e.currentTarget as HTMLElement).style.transform =
                    "scale(1.005)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 2px 12px rgba(0,0,0,0.04)";
                  (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                }
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: "52px",
                  height: "52px",
                  borderRadius: "18px",
                  background: active ? accent : "#F0EEF8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.25s",
                }}
              >
                <Icon size={24} color={active ? "white" : "#9C94BC"} />
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    color: "var(--theme-darker)",
                    marginBottom: "6px",
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#8A849C",
                    lineHeight: 1.5,
                    fontWeight: 500,
                  }}
                >
                  {desc}
                </p>
              </div>
              <div
                style={{
                  flexShrink: 0,
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  border: `2px solid ${active ? accent : "#DDD"}`,
                  background: active ? accent : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: "2px",
                  transition: "all 0.25s",
                }}
              >
                {active && <Check size={12} strokeWidth={3} color="white" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Paso 2: Cuenta ────────────────────────────────────────────────────────────
function StepTwo({ account, setAccount, error }: any) {
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {error && <ErrorBanner message={error} />}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        <InputField
          label="Nombre"
          type="text"
          placeholder="Tu nombre"
          value={account.nombre}
          onChange={(e) =>
            setAccount((prev: any) => ({ ...prev, nombre: e.target.value }))
          }
        />
        <InputField
          label="Apellidos"
          type="text"
          placeholder="Tus apellidos"
          value={account.apellidos}
          onChange={(e) =>
            setAccount((prev: any) => ({ ...prev, apellidos: e.target.value }))
          }
        />
      </div>
      <InputField
        label="Correo electrónico"
        type="email"
        placeholder="tu.email@correo.com"
        value={account.email}
        onChange={(e) =>
          setAccount((prev: any) => ({ ...prev, email: e.target.value }))
        }
      />
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        <InputField
          label="Contraseña"
          type="password"
          placeholder="Mín. 8 caracteres"
          value={account.password}
          onChange={(e) =>
            setAccount((prev: any) => ({ ...prev, password: e.target.value }))
          }
          showToggle
          show={showPwd}
          onToggle={() => setShowPwd((v) => !v)}
        />
        <InputField
          label="Confirmar"
          type="password"
          placeholder="Repite la clave"
          value={account.passwordConfirm}
          onChange={(e) =>
            setAccount((prev: any) => ({
              ...prev,
              passwordConfirm: e.target.value,
            }))
          }
          showToggle
          show={showConfirm}
          onToggle={() => setShowConfirm((v) => !v)}
        />
      </div>
    </div>
  );
}

// ─── Paso 3: Bebé ──────────────────────────────────────────────────────────────
function StepThree({ baby, setBaby, flow, error }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {error && <ErrorBanner message={error} />}
      <InputField
        label={flow === "hijo" ? "Nombre del bebé" : "Nombre provisional"}
        type="text"
        placeholder="Ej: Sofía"
        value={baby.nombre}
        onChange={(e) =>
          setBaby((prev: any) => ({ ...prev, nombre: e.target.value }))
        }
      />
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--theme-darker)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: "8px",
            }}
          >
            {flow === "hijo" ? "Fecha nacimiento" : "Última Regla (FUR)"}{" "}
            <span style={{ color: "#F4A0A0" }}>*</span>
          </label>
          <input
            type="date"
            value={baby.fecha_nacimiento}
            onChange={(e) =>
              setBaby((prev: any) => ({
                ...prev,
                fecha_nacimiento: e.target.value,
              }))
            }
            max={new Date().toISOString().split("T")[0]}
            style={{
              width: "100%",
              padding: "14px 18px",
              border: "2px solid var(--theme-bg-light)",
              borderRadius: "16px",
              fontSize: "15px",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 500,
              color: "var(--theme-darker)",
              background: "#FDFCFF",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--theme-darker)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: "8px",
            }}
          >
            Sexo{" "}
            <span
              style={{
                fontSize: "11px",
                color: "#B0ABC4",
                fontWeight: 500,
                textTransform: "none",
              }}
            >
              (opcional)
            </span>
          </label>
          <select
            value={baby.sexo}
            onChange={(e) =>
              setBaby((prev: any) => ({ ...prev, sexo: e.target.value }))
            }
            style={{
              width: "100%",
              padding: "14px 18px",
              border: "2px solid var(--theme-bg-light)",
              borderRadius: "16px",
              fontSize: "15px",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 500,
              color: "var(--theme-darker)",
              background: "#FDFCFF",
              outline: "none",
              cursor: "pointer",
              boxSizing: "border-box",
            }}
          >
            <option value="">Seleccionar...</option>
            <option value="Femenino">Femenino</option>
            <option value="Masculino">Masculino</option>
          </select>
        </div>
      </div>

      {/* Prevision de salud */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--theme-darker)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: "8px",
            marginTop: "16px",
          }}
        >
          Previsión de salud <span style={{ color: "#F4A0A0" }}>*</span>
        </label>
        <select
          value={baby.prevision}
          onChange={(e) =>
            setBaby((prev: any) => ({ ...prev, prevision: e.target.value }))
          }
          style={{
            width: "100%",
            padding: "14px 18px",
            border: "2px solid var(--theme-bg-light)",
            borderRadius: "16px",
            fontSize: "15px",
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 500,
            color: "var(--theme-darker)",
            background: "#FDFCFF",
            outline: "none",
            cursor: "pointer",
            boxSizing: "border-box",
            marginBottom: "8px",
          }}
        >
          <option value="">Seleccione previsión</option>
          <option value="FONASA A (Indigente)">FONASA A (Indigente)</option>
          <option value="FONASA B">FONASA B</option>
          <option value="FONASA C">FONASA C</option>
          <option value="FONASA D">FONASA D</option>
          <option value="ISAPRE">ISAPRE</option>
          <option value="FFAA">Fuerzas Armadas</option>
        </select>
      </div>

      {flow === "hijo" && (
        <div
          onClick={() =>
            setBaby((prev: any) => ({
              ...prev,
              es_prematuro: !prev.es_prematuro,
            }))
          }
          style={{
            padding: "18px",
            borderRadius: "18px",
            border: "2px dashed #DDD9F0",
            cursor: "pointer",
            transition: "border-color 0.2s",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "8px",
                flexShrink: 0,
                border: `2px solid ${baby.es_prematuro ? "var(--theme-primary)" : "#CCC"}`,
                background: baby.es_prematuro ? "var(--theme-primary)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              {baby.es_prematuro && (
                <Check size={13} strokeWidth={3} color="white" />
              )}
            </div>
            <span
              style={{ fontSize: "15px", fontWeight: 700, color: "var(--theme-darker)" }}
            >
              Mi bebé nació prematuro
            </span>
          </label>
          {baby.es_prematuro && (
            <div
              style={{ marginTop: "16px", paddingLeft: "34px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--theme-darker)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: "8px",
                }}
              >
                Semanas de gestación al nacer{" "}
                <span style={{ color: "#F4A0A0" }}>*</span>
              </label>
              <input
                type="number"
                placeholder="Ej: 34"
                min="20"
                max="36"
                value={baby.semanas_gestacion}
                onChange={(e) =>
                  setBaby((prev: any) => ({
                    ...prev,
                    semanas_gestacion: e.target.value,
                  }))
                }
                style={{
                  width: "140px",
                  padding: "12px 16px",
                  border: "2px solid var(--theme-bg-light)",
                  borderRadius: "14px",
                  fontSize: "15px",
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 500,
                  color: "var(--theme-darker)",
                  background: "#FDFCFF",
                  outline: "none",
                }}
              />
              <p
                style={{ marginTop: "6px", fontSize: "12px", color: "#8A849C" }}
              >
                Calcularemos su edad corregida automáticamente.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Paso 4: Consentimientos ────────────────────────────────────────────────────
function StepFour({ consents, setConsents, error }: any) {
  const items = [
    {
      key: "cb1",
      title: "Términos y Política de Privacidad",
      badge: null,
      desc: "Acepto el funcionamiento de la plataforma y confirmo que mis datos personales se gestionan con la máxima privacidad.",
    },
    {
      key: "cb2",
      title: "Tratamiento de Datos Sensibles de Salud",
      badge: "Ley 19.628",
      desc: "Declaro ser tutor legal y autorizo el tratamiento encriptado de los datos de salud pediátrica de mi bebé.",
    },
    {
      key: "cb3",
      title: "Notificaciones de Salud Pediátrica",
      badge: null,
      desc: "Acepto recibir recordatorios de vacunas y controles del Programa Nacional de Inmunizaciones (PNI).",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {error && (
        <ErrorBanner message="Debes aceptar los tres consentimientos para continuar." />
      )}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          padding: "14px 18px",
          borderRadius: "16px",
          background: "#E8F7F1",
          border: "1px solid rgba(109,190,158,0.3)",
          marginBottom: "6px",
        }}
      >
        <Shield
          size={18}
          color="#6DBE9E"
          style={{ flexShrink: 0, marginTop: "1px" }}
        />
        <p
          style={{
            fontSize: "13px",
            color: "#3A7A5A",
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          Tienes derecho a acceder, rectificar y eliminar tus datos en cualquier
          momento. Protegidos bajo la Ley 21.719 de Protección de Datos
          Personales de Chile.
        </p>
      </div>
      {items.map(({ key, title, badge, desc }) => {
        const checked = consents[key as keyof typeof consents];
        return (
          <div
            key={key}
            onClick={() =>
              setConsents((prev: any) => ({ ...prev, [key]: !prev[key] }))
            }
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "16px",
              padding: "18px 20px",
              borderRadius: "18px",
              cursor: "pointer",
              border: `2px solid ${checked ? "rgba(109,190,158,0.5)" : error ? "rgba(244,160,160,0.4)" : "var(--theme-bg-light)"}`,
              background: checked ? "#F2FAF6" : "white",
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: "22px",
                height: "22px",
                borderRadius: "8px",
                border: `2px solid ${checked ? "#6DBE9E" : "#CCC"}`,
                background: checked ? "#6DBE9E" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                marginTop: "2px",
              }}
            >
              {checked && <Check size={13} strokeWidth={3} color="white" />}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 800,
                    color: "var(--theme-darker)",
                  }}
                >
                  {title}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "20px",
                    background: "#FFE5E5",
                    color: "#C06060",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Obligatorio
                </span>
                {badge && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: "20px",
                      background: "var(--theme-bg-light)",
                      color: "var(--theme-primary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: "#8A849C",
                  lineHeight: 1.5,
                  fontWeight: 500,
                }}
              >
                {desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Error Banner ──────────────────────────────────────────────────────────────
function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 16px",
        borderRadius: "14px",
        background: "#FFF0F0",
        border: "1px solid rgba(244,160,160,0.4)",
      }}
    >
      <AlertCircle size={16} color="#F4A0A0" style={{ flexShrink: 0 }} />
      <p style={{ fontSize: "14px", color: "#D97070", fontWeight: 600 }}>
        {message}
      </p>
    </div>
  );
}

// ─── Success Screen ────────────────────────────────────────────────────────────
function SuccessScreen({
  babyName,
  onContinue,
}: {
  babyName: string;
  onContinue: () => void;
}) {
  return (
    <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
      <div
        style={{
          position: "relative",
          display: "inline-block",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            width: "110px",
            height: "110px",
            borderRadius: "50%",
            background: "#E8F7F1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckCircle2 size={54} color="#6DBE9E" strokeWidth={1.5} />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "-4px",
            right: "-4px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#F4A0A0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Heart size={16} color="white" fill="white" />
        </div>
      </div>
      <h2
        style={{
          fontSize: "28px",
          fontWeight: 900,
          color: "var(--theme-darker)",
          marginBottom: "12px",
        }}
      >
        ¡Bienvenida a la familia!
      </h2>
      <p
        style={{
          color: "#8A849C",
          fontSize: "16px",
          lineHeight: 1.6,
          marginBottom: "2.5rem",
        }}
      >
        El espacio seguro para{" "}
        <strong style={{ color: "var(--theme-darker)" }}>{babyName}</strong> está listo.
        Empieza a registrar cada momento especial.
      </p>
      <button
        onClick={onContinue}
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: "18px",
          border: "none",
          cursor: "pointer",
          background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
          color: "white",
          fontSize: "17px",
          fontWeight: 800,
          fontFamily: "'Nunito', sans-serif",
          boxShadow: "0 10px 28px rgba(124,92,191,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        Entrar a mi panel <ChevronRight size={20} />
      </button>
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [flow, setFlow] = useState<string | null>(null);
  const [account, setAccount] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [accountError, setAccountError] = useState("");
  const [baby, setBaby] = useState({
    nombre: "",
    fecha_nacimiento: "",
    sexo: "",
    prevision: "",
    es_prematuro: false,
    semanas_gestacion: "",
  });
  const [babyError, setBabyError] = useState("");
  const [consents, setConsents] = useState({
    cb1: false,
    cb2: false,
    cb3: false,
  });
  const [consentError, setConsentError] = useState(false);
  const [successBabyName, setSuccessBabyName] = useState("");

  const validateAccount = () => {
    if (
      !account.nombre ||
      !account.apellidos ||
      !account.email ||
      !account.password
    ) {
      setAccountError("Por favor completa todos los campos.");
      return false;
    }
    if (account.password.length < 8) {
      setAccountError("La contraseña debe tener al menos 8 caracteres.");
      return false;
    }
    if (account.password !== account.passwordConfirm) {
      setAccountError("Las contraseñas no coinciden. Inténtalo de nuevo.");
      return false;
    }
    setAccountError("");
    return true;
  };

  const validateBaby = () => {
    if (!baby.nombre || !baby.fecha_nacimiento || !baby.prevision) {
      setBabyError("El nombre, fecha y previsión son obligatorios.");
      return false;
    }
    setBabyError("");
    return true;
  };

  const handleNext = async () => {
    if (step === 1 && flow) {
      setStep(2);
    } else if (step === 2) {
      if (validateAccount()) setStep(3);
    } else if (step === 3) {
      if (validateBaby()) setStep(4);
    } else if (step === 4) {
      if (!consents.cb1 || !consents.cb2 || !consents.cb3) {
        setConsentError(true);
        return;
      }
      setConsentError(false);
      setLoading(true);
      try {
        const authRes = await axios.post(`https://babycare-backend-msyq.onrender.com/api/auth/register`, {
          email: account.email,
          password: account.password,
          nombre: account.nombre,
          apellidos: account.apellidos,
        });
        const userToken = authRes.data.token;
        
        // Guardamos el token en localStorage para que el usuario esté "logueado" inmediatamente
        localStorage.setItem("token", userToken);
        localStorage.setItem("user", JSON.stringify(authRes.data.user));

        const babyRes = await axios.post(
          `https://babycare-backend-msyq.onrender.com/api/profiles/babies`,
          {
            nombre: baby.nombre,
            fecha_nacimiento: baby.fecha_nacimiento,
            sexo: baby.sexo || "N/A",
            prevision_salud: baby.prevision,
            es_prematuro: baby.es_prematuro,
            semanas_gestacion: baby.es_prematuro
              ? parseInt(baby.semanas_gestacion)
              : null,
          },
          { headers: { Authorization: `Bearer ${userToken}` } },
        );
        
        // Guardamos el ID del bebé recién creado para entrar directo a su perfil
        localStorage.setItem("selectedBabyId", babyRes.data.id);
        
        setSuccessBabyName(baby.nombre);
        setStep(5);
      } catch (err: any) {
        alert(
          err.response?.data?.error ||
            "Ocurrió un error. Por favor intenta de nuevo.",
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const stepTitles = [
    "¡Hola! ¿A quién vamos a cuidar?",
    "Crea tu espacio seguro",
    flow === "hijo" ? "Cuéntanos sobre tu bebé" : "Cuéntanos sobre tu embarazo",
    "Un pacto de confianza",
  ];
  const stepSubtitles = [
    "Elige el camino que más se adapte a tu momento.",
    "Solo lo necesario para proteger tu cuenta.",
    "Personalizaremos el seguimiento de salud con estos datos.",
    "Necesitamos tu consentimiento informado para cuidarte.",
  ];

  const valueProps = [
    {
      icon: Shield,
      color: "var(--theme-primary)",
      bg: "var(--theme-bg-light)",
      title: "Privacidad Absoluta",
      desc: "Ley 19.628 y 21.719. Tus datos son solo tuyos.",
    },
    {
      icon: Heart,
      color: "#F4A0A0",
      bg: "#FFF0F0",
      title: "Control de Salud",
      desc: "Vacunas del PNI y controles de pediatría siempre al día.",
    },
    {
      icon: TrendingUp,
      color: "#6DBE9E",
      bg: "#E8F7F1",
      title: "Hitos del Desarrollo",
      desc: "Seguimiento preciso según su edad corregida y real.",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#F8F7FC",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      {/* Panel Izquierdo */}
      <div
        style={{
          display: "none",
          flexDirection: "column",
          justifyContent: "space-between",
          flexShrink: 0,
          padding: "3rem 2.5rem",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(155deg, var(--theme-darker) 0%, var(--theme-dark) 55%, var(--theme-primary) 100%)",
          width: "40%",
          minWidth: "360px",
          maxWidth: "500px",
        }}
        className="lg-panel"
        id="left-panel"
      >
        {/* blob decorativo */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(244,160,160,0.25), transparent)",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            left: "-60px",
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, var(--theme-shadow-bg), transparent)",
            zIndex: 0,
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "3.5rem",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Heart size={22} color="#F4A0A0" fill="#F4A0A0" />
            </div>
            <span
              style={{
                color: "white",
                fontWeight: 900,
                fontSize: "20px",
                letterSpacing: "-0.01em",
              }}
            >
              Iniciativa Baby
            </span>
          </div>
          <h1
            style={{
              fontSize: "2.4rem",
              fontWeight: 900,
              color: "white",
              lineHeight: 1.15,
              marginBottom: "16px",
            }}
          >
            Un abrazo digital para cada pequeño gran paso.
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "16px",
              lineHeight: 1.6,
              marginBottom: "3.5rem",
            }}
          >
            Tecnología con ternura. Rigor médico con calidez materna. Todo en un
            solo lugar.
          </p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "28px" }}
          >
            {valueProps.map(({ icon: Icon, color, bg, title, desc }) => (
              <div
                key={title}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: "46px",
                    height: "46px",
                    borderRadius: "16px",
                    background: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  <Icon size={22} color={color} />
                </div>
                <div>
                  <p
                    style={{
                      fontWeight: 800,
                      color: "white",
                      fontSize: "15px",
                      marginBottom: "4px",
                    }}
                  >
                    {title}
                  </p>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      fontSize: "13px",
                      lineHeight: 1.5,
                    }}
                  >
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px 20px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            marginTop: "3rem",
          }}
        >
          <Lock size={18} color="#F4A0A0" />
          <div>
            <p style={{ color: "white", fontSize: "13px", fontWeight: 800 }}>
              Cifrado AES-256 de nivel bancario
            </p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>
              Tus datos en manos seguras, siempre.
            </p>
          </div>
        </div>
      </div>

      {/* Panel Derecho */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2.5rem",
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: "720px" }}>
          {/* Card principal */}
          <div
            style={{
              background: "white",
              borderRadius: "32px",
              boxShadow: "0 12px 50px rgba(45,38,64,0.09)",
              padding: "4rem 4.5rem",
            }}
          >
            {step < 5 && (
              <>
                <ProgressBar step={step} />
                <div style={{ marginBottom: "2.5rem" }}>
                  <h2
                    style={{
                      fontSize: "32px",
                      fontWeight: 900,
                      color: "var(--theme-darker)",
                      marginBottom: "10px",
                    }}
                  >
                    {stepTitles[step - 1]}
                  </h2>
                  <p
                    style={{
                      fontSize: "18px",
                      color: "#8A849C",
                      fontWeight: 500,
                    }}
                  >
                    {stepSubtitles[step - 1]}
                  </p>
                </div>
              </>
            )}

            {step === 1 && <StepOne flow={flow} setFlow={setFlow} />}
            {step === 2 && (
              <StepTwo
                account={account}
                setAccount={setAccount}
                error={accountError}
              />
            )}
            {step === 3 && (
              <StepThree
                baby={baby}
                setBaby={setBaby}
                flow={flow}
                error={babyError}
              />
            )}
            {step === 4 && (
              <StepFour
                consents={consents}
                setConsents={setConsents}
                error={consentError}
              />
            )}
            {step === 5 && (
              <SuccessScreen
                babyName={successBabyName}
                onContinue={() => navigate("/dashboard")}
              />
            )}

            {step < 5 && (
              <div style={{ display: "flex", gap: "14px", marginTop: "3rem" }}>
                {step > 1 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    disabled={loading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "18px 28px",
                      borderRadius: "18px",
                      border: "2px solid var(--theme-bg-light)",
                      background: "white",
                      color: "#8A849C",
                      fontSize: "17px",
                      fontWeight: 700,
                      fontFamily: "'Nunito', sans-serif",
                      cursor: "pointer",
                    }}
                  >
                    <ChevronLeft size={22} /> Volver
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={loading || (step === 1 && !flow)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "20px 28px",
                    borderRadius: "20px",
                    border: "none",
                    cursor:
                      loading || (step === 1 && !flow)
                        ? "not-allowed"
                        : "pointer",
                    background:
                      loading || (step === 1 && !flow)
                        ? "#E5E3EC"
                        : "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
                    color:
                      loading || (step === 1 && !flow) ? "#B0ABC4" : "white",
                    fontSize: "19px",
                    fontWeight: 800,
                    fontFamily: "'Nunito', sans-serif",
                    boxShadow:
                      loading || (step === 1 && !flow)
                        ? "none"
                        : "0 12px 32px rgba(124,92,191,0.4)",
                    transition: "all 0.25s",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && flow)
                      (e.currentTarget as HTMLElement).style.transform =
                        "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "";
                  }}
                >
                  {loading ? (
                    <>
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          border: "3px solid rgba(255,255,255,0.3)",
                          borderTopColor: "white",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />{" "}
                      Procesando...
                    </>
                  ) : step === 4 ? (
                    <>
                      Confirmar y Crear Cuenta{" "}
                      <Check size={20} strokeWidth={3} />
                    </>
                  ) : (
                    <>
                      Siguiente <ChevronRight size={22} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {step < 5 && (
            <p
              style={{
                textAlign: "center",
                marginTop: "24px",
                fontSize: "15px",
                color: "#8A849C",
              }}
            >
              ¿Ya tienes cuenta?{" "}
              <Link
                to="/"
                style={{
                  fontWeight: 800,
                  color: "var(--theme-primary)",
                  textDecoration: "none",
                }}
              >
                Inicia sesión aquí
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Mostrar panel izquierdo en pantallas grandes via CSS */}
      <style>{`
        @media (min-width: 1024px) {
          #left-panel { display: flex !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
