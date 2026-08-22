import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import heroImg from "../assets/madre-bebe-hero.jpg";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

declare global {
  interface Window {
    google?: any;
  }
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recordar, setRecordar] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [intentosRestantes, setIntentosRestantes] = useState<number | null>(
    null,
  );
  const [bloqueado, setBloqueado] = useState(false);
  const [bloqueadoHasta, setBloqueadoHasta] = useState<Date | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIntentosRestantes(null);
    if (!email || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
        recordar_sesion: recordar,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/seleccionar-perfil");
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.bloqueado) {
        setBloqueado(true);
        if (data.bloqueado_hasta)
          setBloqueadoHasta(new Date(data.bloqueado_hasta));
        setError(data.error || "Cuenta bloqueada temporalmente.");
      } else {
        setError(data?.error || "Correo o contraseña incorrectos.");
        if (data?.intentos_restantes !== undefined) {
          setIntentosRestantes(data.intentos_restantes);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleError, setGoogleError] = useState("");

  const handleGoogleCredential = async (response: { credential: string }) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_URL}/auth/google`, {
        credential: response.credential,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      if (res.data.esNuevo) {
        navigate("/registro?origen=google");
      } else {
        navigate("/seleccionar-perfil");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || "No se pudo iniciar sesión con Google.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setGoogleError("Login con Google no configurado");
      return;
    }

    let cancelled = false;

    const initGoogle = () => {
      if (cancelled || !window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: 380,
        shape: "pill",
        text: "continue_with",
      });
      setGoogleReady(true);
    };

    if (window.google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initGoogle();
        }
      }, 200);
      const timeout = setTimeout(() => clearInterval(interval), 8000);
      return () => {
        cancelled = true;
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const minutosBloqueo = bloqueadoHasta
    ? Math.max(
        1,
        Math.ceil((bloqueadoHasta.getTime() - Date.now()) / 60000),
      )
    : 15;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      {/* ─── Panel Izquierdo: foto ─── */}
      <div
        id="left-panel"
        style={{
          display: "none",
          position: "relative",
          flex: "1 1 55%",
          minHeight: "100vh",
          backgroundImage: `url(${heroImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(45,38,64,0.15) 0%, rgba(45,38,64,0.05) 40%, rgba(45,38,64,0.55) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "3rem",
          }}
        >
          <h2
            style={{
              color: "white",
              fontSize: "2.2rem",
              fontWeight: 900,
              margin: 0,
              lineHeight: 1.1,
              textShadow: "0 2px 12px rgba(0,0,0,0.25)",
            }}
          >
            Iniciativa
            <br />
            Baby
          </h2>
          <p
            style={{
              color: "white",
              fontSize: "2.1rem",
              fontWeight: 800,
              lineHeight: 1.25,
              margin: 0,
              maxWidth: "620px",
              textShadow: "0 2px 16px rgba(0,0,0,0.3)",
            }}
          >
            Tu guía amorosa en cada pequeño gran paso
          </p>
        </div>
      </div>

      {/* ─── Panel Derecho: formulario ─── */}
      <div
        className="auth-right-panel"
        style={{
          flex: "1 1 45%",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2.5rem",
          background: "#EDE7F9",
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: "420px" }}>
          <div
            className="auth-box"
            style={{
              background: "white",
              borderRadius: "32px",
              boxShadow: "0 20px 60px rgba(45,38,64,0.14)",
              padding: "2.75rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                marginBottom: "12px",
                lineHeight: 1,
              }}
              aria-hidden="true"
            >
              🧸💗☁️
            </div>

            {/* Bloqueo total */}
            {bloqueado && (
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
                  Tu cuenta está bloqueada temporalmente por {minutosBloqueo}{" "}
                  minuto{minutosBloqueo !== 1 ? "s" : ""}.
                </p>
                <div
                  style={{
                    background: "#FEF3C7",
                    borderRadius: "14px",
                    padding: "12px",
                    fontSize: "13px",
                    marginTop: "16px",
                    color: "#92400E",
                  }}
                >
                  Intenta nuevamente en <strong>{minutosBloqueo} min</strong>{" "}
                  o{" "}
                  <Link
                    to="/recuperar-contrasena"
                    style={{ color: "#D97706", fontWeight: 800 }}
                  >
                    recupera tu contraseña
                  </Link>
                </div>
              </div>
            )}

            {/* Error normal */}
            {error && !bloqueado && (
              <div
                style={{
                  background: "#FFF0F0",
                  borderLeft: "4px solid #DC2626",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  fontSize: "14px",
                  marginBottom: "20px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  color: "#7F1D1D",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: "16px" }}>⚠️</span>
                <div>
                  <strong>{error}</strong>
                  {intentosRestantes !== null && intentosRestantes > 0 && (
                    <div style={{ marginTop: "6px", fontSize: "12px" }}>
                      Te quedan <strong>{intentosRestantes}</strong> intento
                      {intentosRestantes !== 1 ? "s" : ""} antes del bloqueo.
                    </div>
                  )}
                </div>
              </div>
            )}

            {!bloqueado && (
              <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
                <div style={{ position: "relative", marginBottom: "16px" }}>
                  <Mail
                    size={19}
                    color="#B39DDB"
                    style={{
                      position: "absolute",
                      left: "18px",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Correo electrónico"
                    autoComplete="email"
                    style={{
                      width: "100%",
                      padding: "16px 20px 16px 50px",
                      border: "1.5px solid var(--border)",
                      borderRadius: "16px",
                      fontSize: "15px",
                      fontFamily: "'Nunito', sans-serif",
                      fontWeight: 500,
                      color: "var(--text)",
                      background: "var(--surface-3)",
                      outline: "none",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--theme-primary)";
                      e.target.style.boxShadow =
                        "0 0 0 4px var(--theme-shadow-light)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#E4DBF7";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                <div style={{ position: "relative", marginBottom: "10px" }}>
                  <Lock
                    size={19}
                    color="#B39DDB"
                    style={{
                      position: "absolute",
                      left: "18px",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    autoComplete="current-password"
                    style={{
                      width: "100%",
                      padding: "16px 50px 16px 50px",
                      border: "1.5px solid var(--border)",
                      borderRadius: "16px",
                      fontSize: "15px",
                      fontFamily: "'Nunito', sans-serif",
                      fontWeight: 500,
                      color: "var(--text)",
                      background: "var(--surface-3)",
                      outline: "none",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--theme-primary)";
                      e.target.style.boxShadow =
                        "0 0 0 4px var(--theme-shadow-light)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#E4DBF7";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    aria-label={
                      showPwd ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    style={{
                      position: "absolute",
                      right: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#B39DDB",
                      padding: "4px",
                      display: "flex",
                    }}
                  >
                    {showPwd ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    margin: "6px 2px 22px",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={recordar}
                      onChange={(e) => setRecordar(e.target.checked)}
                      style={{
                        accentColor: "var(--theme-primary)",
                        marginRight: "7px",
                      }}
                    />
                    Recordar sesión
                  </label>
                  <Link
                    to="/recuperar-contrasena"
                    style={{
                      fontSize: "13px",
                      color: "var(--theme-primary)",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "16px",
                    borderRadius: "16px",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    background: loading
                      ? "#E5E3EC"
                      : "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
                    color: loading ? "#B0ABC4" : "white",
                    fontSize: "16px",
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
                  {loading ? "Ingresando..." : "Iniciar sesión"}
                </button>

                <div
                  style={{
                    textAlign: "center",
                    fontSize: "12px",
                    color: "#B0ABC4",
                    margin: "22px 0",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  — o continúa con —
                </div>

                <div style={{ display: "flex", justifyContent: "center" }}>
                  <div ref={googleBtnRef} />
                  {!GOOGLE_CLIENT_ID && (
                    <div
                      style={{
                        width: "100%",
                        textAlign: "center",
                        fontSize: "13px",
                        color: "#B0ABC4",
                        padding: "14px",
                        border: "2px dashed #E4DBF7",
                        borderRadius: "16px",
                      }}
                    >
                      Login con Google no disponible por ahora
                    </div>
                  )}
                  {GOOGLE_CLIENT_ID && !googleReady && !googleError && (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#B0ABC4",
                        padding: "10px",
                      }}
                    >
                      Cargando Google...
                    </div>
                  )}
                </div>

                <p
                  style={{
                    textAlign: "center",
                    marginTop: "24px",
                    marginBottom: 0,
                    fontSize: "13px",
                    color: "var(--text-muted)",
                  }}
                >
                  ¿Aún no tienes cuenta?{" "}
                  <Link
                    to="/registro"
                    style={{
                      fontWeight: 800,
                      color: "var(--theme-primary)",
                      textDecoration: "none",
                    }}
                  >
                    Crear una cuenta
                  </Link>
                </p>
              </form>
            )}

            {bloqueado && (
              <button
                onClick={() => navigate("/recuperar-contrasena")}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px",
                  borderRadius: "16px",
                  border: "none",
                  cursor: "pointer",
                  background:
                    "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: 800,
                  fontFamily: "'Nunito', sans-serif",
                  boxShadow: "0 8px 24px var(--theme-shadow)",
                }}
              >
                Recuperar contraseña
              </button>
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
