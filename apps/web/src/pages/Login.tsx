import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Shield, Heart, TrendingUp, Lock, Eye, EyeOff } from "lucide-react";

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
        width: 396,
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
        className="auth-right-panel"
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
            <h2
              style={{
                fontSize: "28px",
                fontWeight: 900,
                color: "var(--theme-darker)",
                marginBottom: "6px",
              }}
            >
              Bienvenida de vuelta 👋
            </h2>
            <p
              style={{
                fontSize: "15px",
                color: "#8A849C",
                fontWeight: 500,
                marginBottom: "32px",
              }}
            >
              Ingresa para ver el seguimiento de tu bebé
            </p>

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
                  Intenta nuevamente en <strong>{minutosBloqueo} min</strong> o{" "}
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
                  marginBottom: "24px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  color: "#7F1D1D",
                }}
              >
                <span style={{ fontSize: "16px" }}>⚠️</span>
                <div>
                  <strong>{error}</strong>
                  {intentosRestantes !== null && intentosRestantes > 0 && (
                    <div style={{ marginTop: "6px", fontSize: "12px" }}>
                      Te quedan <strong>{intentosRestantes}</strong> intento
                      {intentosRestantes !== 1 ? "s" : ""} antes del bloqueo.
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          marginTop: "8px",
                        }}
                      >
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background:
                                i < 5 - intentosRestantes
                                  ? "#DC2626"
                                  : "var(--theme-bg-light)",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!bloqueado && (
              <form onSubmit={handleSubmit}>
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
                    Correo electrónico
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
                    Contraseña
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tu contraseña"
                      autoComplete="current-password"
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
                      onClick={() => setShowPwd(!showPwd)}
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
                      {showPwd ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "28px",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      fontSize: "14px",
                      color: "#8A849C",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={recordar}
                      onChange={(e) => setRecordar(e.target.checked)}
                      style={{ accentColor: "var(--theme-primary)", marginRight: "8px" }}
                    />
                    Recordar sesión
                  </label>
                  <Link
                    to="/recuperar-contrasena"
                    style={{
                      fontSize: "14px",
                      color: "var(--theme-primary)",
                      fontWeight: 800,
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
                    padding: "18px",
                    borderRadius: "20px",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    background: loading
                      ? "#E5E3EC"
                      : "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
                    color: loading ? "#B0ABC4" : "white",
                    fontSize: "18px",
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
                  {loading ? "Ingresando..." : "Ingresar a mi cuenta"}
                </button>

                <div
                  style={{
                    textAlign: "center",
                    fontSize: "13px",
                    color: "#9C94BC",
                    margin: "24px 0",
                    fontWeight: 600,
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
                        border: "2px dashed var(--theme-bg-light)",
                        borderRadius: "16px",
                      }}
                    >
                      Login con Google no disponible por ahora
                    </div>
                  )}
                  {GOOGLE_CLIENT_ID && !googleReady && !googleError && (
                    <div
                      style={{ fontSize: "13px", color: "#B0ABC4", padding: "10px" }}
                    >
                      Cargando Google...
                    </div>
                  )}
                </div>
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
                  padding: "18px",
                  borderRadius: "20px",
                  border: "none",
                  cursor: "pointer",
                  background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
                  color: "white",
                  fontSize: "18px",
                  fontWeight: 800,
                  fontFamily: "'Nunito', sans-serif",
                  boxShadow: "0 8px 24px var(--theme-shadow)",
                }}
              >
                Recuperar contraseña
              </button>
            )}
          </div>

          <p
            style={{
              textAlign: "center",
              marginTop: "32px",
              fontSize: "15px",
              color: "#8A849C",
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
              Regístrate gratis
            </Link>
          </p>
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
