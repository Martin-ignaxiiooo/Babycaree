import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Shield, Heart, TrendingUp, Lock, Eye, EyeOff } from "lucide-react";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

type Step = "email" | "code" | "reset" | "success" | "lockout";

interface PasswordReq {
  len: boolean;
  upper: boolean;
  num: boolean;
}

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Código OTP
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const [codeError, setCodeError] = useState("");
  const [intentosRestantes, setIntentosRestantes] = useState(3);
  const [resendSeconds, setResendSeconds] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Reset password
  const [recoveryToken, setRecoveryToken] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [passReqs, setPassReqs] = useState<PasswordReq>({
    len: false,
    upper: false,
    num: false,
  });

  // ── Timer de reenvío ──────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "code") return;
    setResendSeconds(45);
    setCanResend(false);
    const interval = setInterval(() => {
      setResendSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const fmtTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Paso 1: enviar correo ─────────────────────────────────────────────────
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !email.includes("@")) {
      setError("Ingresa un correo válido.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
    } catch {
      // La respuesta siempre es OK (evita enumeración de cuentas)
    } finally {
      setLoading(false);
      setStep("code"); // Siempre avanzar
    }
  };

  // ── Paso 2: verificar código ──────────────────────────────────────────────
  const handleDigitInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number,
  ) => {
    const val = e.target.value.replace(/[^0-9]/g, "").slice(-1);
    const updated = [...codeDigits];
    updated[idx] = val;
    setCodeDigits(updated);
    setCodeError("");
    if (val && idx < 5) codeRefs.current[idx + 1]?.focus();
  };

  const handleDigitKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number,
  ) => {
    if (e.key === "Backspace" && !codeDigits[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = codeDigits.join("");
    if (code.length < 6) {
      setCodeError("Ingresa los 6 dígitos del código.");
      return;
    }
    setLoading(true);
    setCodeError("");
    try {
      const res = await axios.post(`${API_URL}/auth/verify-code`, {
        email,
        codigo: code,
      });
      setRecoveryToken(res.data.recovery_token);
      setStep("reset");
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.bloqueado) {
        setStep("lockout");
      } else {
        setCodeError(data?.error || "Código incorrecto.");
        if (data?.intentos_restantes !== undefined)
          setIntentosRestantes(data.intentos_restantes);
        setCodeDigits(["", "", "", "", "", ""]);
        codeRefs.current[0]?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/resend-code`, { email });
    } catch {
      // silencioso
    } finally {
      setLoading(false);
      setStep("code"); // reinicia timer
      setCodeDigits(["", "", "", "", "", ""]);
      setIntentosRestantes(3);
      setCodeError("");
    }
  };

  // ── Paso 3: nueva contraseña ──────────────────────────────────────────────
  const checkPassReqs = (val: string) => {
    setPassReqs({
      len: val.length >= 8,
      upper: /[A-Z]/.test(val),
      num: /[0-9]/.test(val),
    });
  };

  const passStrength = Object.values(passReqs).filter(Boolean).length;
  const strengthColors = ["var(--theme-bg-light)", "var(--theme-bg-light)", "var(--theme-bg-light)"];
  if (passStrength === 1) strengthColors[0] = "#F4A0A0"; // Rojo tenue
  else if (passStrength === 2) {
    strengthColors[0] = "var(--theme-primary)"; // Morado
    strengthColors[1] = "var(--theme-primary)";
  } else if (passStrength === 3) {
    strengthColors[0] = "#6DBE9E"; // Verde
    strengthColors[1] = "#6DBE9E";
    strengthColors[2] = "#6DBE9E";
  }

  const strengthLabel =
    passStrength === 0
      ? "Fortaleza de la contraseña"
      : passStrength === 1
        ? "Débil"
        : passStrength === 2
          ? "Media"
          : "Fuerte";

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!passReqs.len || !passReqs.upper || !passReqs.num) {
      setError("La contraseña no cumple los requisitos mínimos.");
      return;
    }
    if (newPass !== confirmPass) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        recovery_token: recoveryToken,
        nueva_contrasena: newPass,
      });
      setStep("success");
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Error al actualizar la contraseña.",
      );
    } finally {
      setLoading(false);
    }
  };

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

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#F8F7FC",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      {/* ─── Panel Izquierdo ─── */}
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
        id="left-panel"
      >
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

      {/* ─── Panel Derecho ─── */}
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
        <div style={{ width: "100%", maxWidth: "460px" }}>
          <div
            className="auth-box"
            style={{
              background: "white",
              borderRadius: "32px",
              boxShadow: "0 12px 50px rgba(45,38,64,0.09)",
              padding: "3.5rem",
            }}
          >
            {/* ── PASO 1: CORREO ─────────────────────────────────────────── */}
            {step === "email" && (
              <>
                <button
                  onClick={() => navigate("/")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--theme-primary)",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    padding: 0,
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  ← Volver al login
                </button>
                <h2
                  style={{
                    fontSize: "28px",
                    fontWeight: 900,
                    color: "var(--theme-darker)",
                    marginBottom: "6px",
                  }}
                >
                  Recuperar contraseña
                </h2>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#8A849C",
                    fontWeight: 500,
                    marginBottom: "24px",
                  }}
                >
                  Ingresa el correo con el que te registraste. Te enviaremos un
                  código de 6 dígitos.
                </p>

                <div
                  style={{
                    background: "#E8F7F1",
                    borderRadius: "14px",
                    padding: "14px",
                    fontSize: "13px",
                    marginBottom: "24px",
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                    color: "#166534",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>🔒</span>
                  <div>
                    <strong>Por tu seguridad:</strong> El código expira en 10
                    minutos y solo puede usarse una vez.
                  </div>
                </div>

                {error && (
                  <div
                    style={{
                      background: "#FFF0F0",
                      borderLeft: "4px solid #DC2626",
                      borderRadius: "12px",
                      padding: "14px",
                      fontSize: "14px",
                      marginBottom: "24px",
                      color: "#7F1D1D",
                    }}
                  >
                    ⚠️ {error}
                  </div>
                )}

                <form onSubmit={handleSendEmail}>
                  <div style={{ marginBottom: "24px" }}>
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
                      Correo electrónico registrado
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="maria@correo.cl"
                      autoComplete="email"
                      style={{
                        width: "100%",
                        padding: "16px 20px",
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
                        e.target.style.boxShadow =
                          "0 0 0 5px var(--theme-shadow-light)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "var(--theme-bg-light)";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "18px",
                      borderRadius: "20px",
                      border: "none",
                      cursor: loading ? "not-allowed" : "pointer",
                      background: loading
                        ? "#E5E3EC"
                        : "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
                      color: loading ? "#B0ABC4" : "white",
                      fontSize: "17px",
                      fontWeight: 800,
                      fontFamily: "'Nunito', sans-serif",
                      boxShadow: loading
                        ? "none"
                        : "0 8px 24px var(--theme-shadow)",
                      transition: "all 0.25s",
                    }}
                    onMouseEnter={(e) => {
                      if (!loading)
                        (e.currentTarget as HTMLElement).style.transform =
                          "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "";
                    }}
                  >
                    {loading
                      ? "Enviando..."
                      : "Enviar código de verificación →"}
                  </button>

                  <p
                    style={{
                      textAlign: "center",
                      fontSize: "12px",
                      color: "#9CA3AF",
                      marginTop: "20px",
                      lineHeight: 1.5,
                    }}
                  >
                    Por seguridad, si el correo no está registrado igual
                    mostraremos el mensaje de confirmación, sin indicar si la
                    cuenta existe.
                  </p>
                </form>
              </>
            )}

            {/* ── PASO 2: CÓDIGO OTP ─────────────────────────────────────── */}
            {step === "code" && (
              <>
                <button
                  onClick={() => {
                    setStep("email");
                    setCodeDigits(["", "", "", "", "", ""]);
                    setCodeError("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--theme-primary)",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    padding: 0,
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  ← Cambiar correo
                </button>
                <h2
                  style={{
                    fontSize: "28px",
                    fontWeight: 900,
                    color: "var(--theme-darker)",
                    marginBottom: "6px",
                  }}
                >
                  Ingresa el código
                </h2>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#8A849C",
                    fontWeight: 500,
                    marginBottom: "24px",
                  }}
                >
                  Revisa el buzón de <strong>{email}</strong>. Si no lo ves,
                  revisa la carpeta de Spam.
                </p>

                {codeError && (
                  <div
                    style={{
                      background: "#FFF0F0",
                      borderLeft: "4px solid #DC2626",
                      borderRadius: "12px",
                      padding: "14px",
                      fontSize: "14px",
                      marginBottom: "24px",
                      color: "#7F1D1D",
                    }}
                  >
                    <div>
                      ⚠️ {codeError}
                      {intentosRestantes > 0 && (
                        <span>
                          {" "}
                          Te quedan <strong>{intentosRestantes}</strong> intento
                          {intentosRestantes !== 1 ? "s" : ""}.
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <form onSubmit={handleVerifyCode}>
                  <div
                    style={{
                      display: "flex",
                      gap: "4px",
                      justifyContent: "center",
                      marginBottom: "20px",
                    }}
                  >
                    {codeDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          codeRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitInput(e, i)}
                        onKeyDown={(e) => handleDigitKeyDown(e, i)}
                        style={{
                          width: "48px",
                          height: "56px",
                          textAlign: "center",
                          fontSize: "24px",
                          fontWeight: 800,
                          borderRadius: "14px",
                          border: "2px solid",
                          borderColor: codeError
                            ? "#DC2626"
                            : digit
                              ? "var(--theme-primary)"
                              : "var(--theme-bg-light)",
                          background: codeError
                            ? "#FFF0F0"
                            : digit
                              ? "#fff"
                              : "#FDFCFF",
                          color: "var(--theme-darker)",
                          outline: "none",
                          fontFamily: "'Nunito', sans-serif",
                          transition: "border-color 0.2s",
                        }}
                        onFocus={(e) => {
                          if (!codeError) e.target.style.borderColor = "var(--theme-primary)";
                        }}
                        onBlur={(e) => {
                          if (!codeError && !digit)
                            e.target.style.borderColor = "var(--theme-bg-light)";
                        }}
                      />
                    ))}
                  </div>

                  {/* Indicador de intentos */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "6px",
                      margin: "12px 0 24px",
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background:
                            i < 3 - intentosRestantes ? "#DC2626" : "var(--theme-bg-light)",
                        }}
                      />
                    ))}
                  </div>

                  {/* Reenviar */}
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: "14px",
                      color: "#8A849C",
                      marginBottom: "24px",
                    }}
                  >
                    ¿No te llegó?{" "}
                    <span
                      onClick={handleResend}
                      style={{
                        color: canResend ? "var(--theme-primary)" : "#9CA3AF",
                        cursor: canResend ? "pointer" : "not-allowed",
                        fontWeight: canResend ? 800 : 500,
                        textDecoration: canResend ? "underline" : "none",
                      }}
                    >
                      Reenviar
                    </span>
                    {!canResend && (
                      <span
                        style={{
                          display: "inline-block",
                          background: "var(--theme-bg-light)",
                          color: "var(--theme-primary)",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "12px",
                          fontWeight: 700,
                          marginLeft: "8px",
                        }}
                      >
                        {fmtTimer(resendSeconds)}
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "18px",
                      borderRadius: "20px",
                      border: "none",
                      cursor: loading ? "not-allowed" : "pointer",
                      background: loading
                        ? "#E5E3EC"
                        : "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
                      color: loading ? "#B0ABC4" : "white",
                      fontSize: "17px",
                      fontWeight: 800,
                      fontFamily: "'Nunito', sans-serif",
                      boxShadow: loading
                        ? "none"
                        : "0 8px 24px var(--theme-shadow)",
                      transition: "all 0.25s",
                    }}
                    onMouseEnter={(e) => {
                      if (!loading)
                        (e.currentTarget as HTMLElement).style.transform =
                          "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "";
                    }}
                  >
                    {loading ? "Verificando..." : "Verificar código →"}
                  </button>
                </form>
              </>
            )}

            {/* ── PASO 3: NUEVA CONTRASEÑA ─────────────────────────────────── */}
            {step === "reset" && (
              <>
                <h2
                  style={{
                    fontSize: "28px",
                    fontWeight: 900,
                    color: "var(--theme-darker)",
                    marginBottom: "6px",
                  }}
                >
                  Crea una nueva contraseña
                </h2>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#8A849C",
                    fontWeight: 500,
                    marginBottom: "24px",
                  }}
                >
                  Tu identidad fue verificada. Elige una contraseña segura.
                </p>

                <div
                  style={{
                    background: "#E8F7F1",
                    borderRadius: "14px",
                    padding: "14px",
                    fontSize: "13px",
                    marginBottom: "24px",
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                    color: "#166534",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>✅</span>
                  <div>
                    <strong>Código verificado.</strong> Tienes 15 minutos para
                    completar este paso.
                  </div>
                </div>

                {error && (
                  <div
                    style={{
                      background: "#FFF0F0",
                      borderLeft: "4px solid #DC2626",
                      borderRadius: "12px",
                      padding: "14px",
                      fontSize: "14px",
                      marginBottom: "24px",
                      color: "#7F1D1D",
                    }}
                  >
                    ⚠️ {error}
                  </div>
                )}

                <form onSubmit={handleResetPassword}>
                  <div style={{ marginBottom: "20px" }}>
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
                      Nueva contraseña
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showNewPwd ? "text" : "password"}
                        value={newPass}
                        onChange={(e) => {
                          setNewPass(e.target.value);
                          checkPassReqs(e.target.value);
                        }}
                        placeholder="Mínimo 8 caracteres"
                        style={{
                          width: "100%",
                          padding: "16px 20px",
                          paddingRight: "54px",
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
                          e.target.style.boxShadow =
                            "0 0 0 5px var(--theme-shadow-light)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "var(--theme-bg-light)";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPwd(!showNewPwd)}
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
                        {showNewPwd ? (
                          <EyeOff size={22} />
                        ) : (
                          <Eye size={22} />
                        )}
                      </button>
                    </div>

                    {/* Barra de fortaleza */}
                    <div style={{ display: "flex", gap: "6px", marginTop: "12px" }}>
                      {strengthColors.map((color, i) => (
                        <div
                          key={i}
                          style={{
                            height: "6px",
                            flex: 1,
                            borderRadius: "3px",
                            background: color,
                            transition: "background 0.3s",
                          }}
                        />
                      ))}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color:
                          passStrength === 3
                            ? "#16A34A"
                            : passStrength === 2
                              ? "var(--theme-primary)"
                              : passStrength === 1
                                ? "#DC2626"
                                : "#9CA3AF",
                        marginTop: "8px",
                        fontWeight: 700,
                      }}
                    >
                      {strengthLabel}
                    </div>
                  </div>

                  {/* Checklist */}
                  <div
                    style={{
                      background: "#FDFCFF",
                      border: "2px solid var(--theme-bg-light)",
                      borderRadius: "16px",
                      padding: "16px",
                      marginBottom: "20px",
                    }}
                  >
                    {[
                      { key: "len", label: "Mínimo 8 caracteres" },
                      { key: "upper", label: "Al menos 1 letra mayúscula" },
                      { key: "num", label: "Al menos 1 número" },
                    ].map(({ key, label }) => (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px",
                          marginBottom: "8px",
                          color: passReqs[key as keyof PasswordReq]
                            ? "#16A34A"
                            : "#8A849C",
                          fontWeight: passReqs[key as keyof PasswordReq]
                            ? 700
                            : 500,
                        }}
                      >
                        <span>
                          {passReqs[key as keyof PasswordReq] ? "✓" : "○"}
                        </span>
                        {label}
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: "28px" }}>
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
                      Confirmar nueva contraseña
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showConfirmPwd ? "text" : "password"}
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        placeholder="Repite la contraseña"
                        style={{
                          width: "100%",
                          padding: "16px 20px",
                          paddingRight: "54px",
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
                          e.target.style.boxShadow =
                            "0 0 0 5px var(--theme-shadow-light)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "var(--theme-bg-light)";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPwd(!showConfirmPwd)}
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
                        {showConfirmPwd ? (
                          <EyeOff size={22} />
                        ) : (
                          <Eye size={22} />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "18px",
                      borderRadius: "20px",
                      border: "none",
                      cursor: loading ? "not-allowed" : "pointer",
                      background: loading
                        ? "#E5E3EC"
                        : "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
                      color: loading ? "#B0ABC4" : "white",
                      fontSize: "17px",
                      fontWeight: 800,
                      fontFamily: "'Nunito', sans-serif",
                      boxShadow: loading
                        ? "none"
                        : "0 8px 24px var(--theme-shadow)",
                      transition: "all 0.25s",
                    }}
                    onMouseEnter={(e) => {
                      if (!loading)
                        (e.currentTarget as HTMLElement).style.transform =
                          "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "";
                    }}
                  >
                    {loading
                      ? "Guardando..."
                      : "Guardar nueva contraseña →"}
                  </button>
                </form>
              </>
            )}

            {/* ── PASO 4: ÉXITO ────────────────────────────────────────────── */}
            {step === "success" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
                <h2
                  style={{
                    fontSize: "28px",
                    fontWeight: 900,
                    color: "var(--theme-darker)",
                    marginBottom: "12px",
                  }}
                >
                  ¡Contraseña actualizada!
                </h2>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#8A849C",
                    lineHeight: 1.6,
                    marginBottom: "32px",
                  }}
                >
                  Tu contraseña fue cambiada con éxito. Por seguridad, cerramos
                  todas las sesiones activas en otros dispositivos.
                </p>
                <button
                  onClick={() => navigate("/")}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "18px",
                    borderRadius: "20px",
                    border: "none",
                    cursor: "pointer",
                    background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
                    color: "white",
                    fontSize: "17px",
                    fontWeight: 800,
                    fontFamily: "'Nunito', sans-serif",
                    boxShadow: "0 8px 24px var(--theme-shadow)",
                    transition: "all 0.25s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform =
                      "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "";
                  }}
                >
                  Ir a iniciar sesión →
                </button>
              </div>
            )}

            {/* ── BLOQUEO ──────────────────────────────────────────────────── */}
            {step === "lockout" && (
              <>
                <div
                  style={{
                    background: "#FFF0F0",
                    borderRadius: "20px",
                    padding: "24px",
                    textAlign: "center",
                    marginBottom: "24px",
                  }}
                >
                  <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔒</div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "#DC2626",
                      marginBottom: "8px",
                    }}
                  >
                    Demasiados intentos fallidos
                  </div>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#7F1D1D",
                      lineHeight: 1.5,
                    }}
                  >
                    Por tu seguridad, bloqueamos la verificación de código para esta
                    cuenta.
                  </p>
                </div>

                <div
                  style={{
                    background: "#FEF3C7",
                    borderRadius: "14px",
                    padding: "14px",
                    fontSize: "14px",
                    marginBottom: "16px",
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    color: "#92400E",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>⏱️</span>
                  <div>
                    <strong>Podrás intentar nuevamente en:</strong> 15:00 minutos
                  </div>
                </div>

                <div
                  style={{
                    background: "#F0F9FF",
                    borderRadius: "14px",
                    padding: "14px",
                    fontSize: "14px",
                    marginBottom: "24px",
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    color: "#0369A1",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>💬</span>
                  <div>
                    <strong>¿Necesitas ayuda?</strong> Contáctanos a{" "}
                    <span style={{ fontWeight: 700 }}>soporte@iniciativababy.cl</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/")}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "18px",
                    borderRadius: "20px",
                    border: "none",
                    cursor: "pointer",
                    background: "var(--theme-bg-light)",
                    color: "var(--theme-primary)",
                    fontSize: "17px",
                    fontWeight: 800,
                    fontFamily: "'Nunito', sans-serif",
                    transition: "all 0.25s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--theme-bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--theme-bg-light)";
                  }}
                >
                  Volver al login
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          #left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
