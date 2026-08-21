import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

export default function AdminSeguridad() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [activo, setActivo] = useState(false);

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [generando, setGenerando] = useState(false);
  const [activando, setActivando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const token = () => {
    const t = localStorage.getItem("admin_token");
    if (!t) navigate("/admin/login");
    return t;
  };

  useEffect(() => {
    const consultarEstado = async () => {
      const t = token();
      if (!t) return;
      try {
        const res = await axios.get(`${API_URL}/v1/admin/auth/2fa/estado`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        setActivo(!!res.data.activo);
      } catch (err: any) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          navigate("/admin/login");
        }
      } finally {
        setCargando(false);
      }
    };
    consultarEstado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generarQR = async () => {
    const t = token();
    if (!t) return;
    setGenerando(true);
    setError("");
    try {
      const res = await axios.post(
        `${API_URL}/v1/admin/auth/2fa/generate`,
        {},
        { headers: { Authorization: `Bearer ${t}` } }
      );
      setQrCodeUrl(res.data.qrCodeUrl);
      setSecret(res.data.secret);
    } catch (err: any) {
      setError(err?.response?.data?.error || "No se pudo generar el código QR.");
    } finally {
      setGenerando(false);
    }
  };

  const activar2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = token();
    if (!t || !codigo.trim()) return;
    setActivando(true);
    setError("");
    try {
      await axios.post(
        `${API_URL}/v1/admin/auth/2fa/enable`,
        { token: codigo.trim() },
        { headers: { Authorization: `Bearer ${t}` } }
      );
      setActivo(true);
      setExito(true);
      setQrCodeUrl(null);
      setSecret(null);
      setCodigo("");
    } catch (err: any) {
      setError(err?.response?.data?.error || "El código no es válido. Revisa la hora de tu teléfono e intenta de nuevo.");
    } finally {
      setActivando(false);
    }
  };

  if (cargando) {
    return (
      <div className="admin-content-area">
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <Loader2 size={28} className="spin-icon" />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-content-area">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Seguridad de tu cuenta</h1>
        <div className="admin-breadcrumbs">Verificación en dos pasos (2FA)</div>
      </div>

      <div style={{ maxWidth: "560px" }}>
        {activo ? (
          <div
            style={{
              background: "#F0FDF4",
              border: "1px solid #86EFAC",
              borderRadius: "16px",
              padding: "24px",
              display: "flex",
              gap: "14px",
              alignItems: "flex-start",
            }}
          >
            <ShieldCheck size={26} color="#16A34A" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <div style={{ fontWeight: 800, color: "#166534", fontSize: "16px" }}>
                La verificación en dos pasos está activada
              </div>
              <p style={{ color: "#166534", fontSize: "14px", marginTop: "6px", lineHeight: 1.6 }}>
                Desde ahora, cada inicio de sesión va a pedirte además el código de tu
                aplicación autenticadora (Google Authenticator, Authy, etc.).
              </p>
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                background: "#FFFBEB",
                border: "1px solid #FDE68A",
                borderRadius: "16px",
                padding: "20px",
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                marginBottom: "24px",
              }}
            >
              <ShieldAlert size={22} color="#B45309" style={{ flexShrink: 0, marginTop: "2px" }} />
              <p style={{ color: "#92400E", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                Tu cuenta todavía no tiene verificación en dos pasos. Es una capa extra de
                seguridad: aunque alguien consiga tu contraseña, no podría entrar sin el
                código de tu teléfono.
              </p>
            </div>

            {exito === false && !qrCodeUrl && (
              <button
                onClick={generarQR}
                disabled={generando}
                style={{
                  background: "var(--theme-primary, #7C5CBF)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "13px 24px",
                  fontWeight: 800,
                  fontSize: "14.5px",
                  cursor: generando ? "not-allowed" : "pointer",
                  opacity: generando ? 0.7 : 1,
                }}
              >
                {generando ? "Generando…" : "Activar verificación en dos pasos"}
              </button>
            )}

            {qrCodeUrl && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "16px",
                  padding: "24px",
                }}
              >
                <ol style={{ paddingLeft: "20px", color: "#374151", fontSize: "14px", lineHeight: 1.9, marginBottom: "20px" }}>
                  <li>
                    Abre una app autenticadora en tu teléfono (Google Authenticator, Microsoft
                    Authenticator, Authy, etc.)
                  </li>
                  <li>Escanea este código:</li>
                </ol>

                <div style={{ textAlign: "center", marginBottom: "18px" }}>
                  <img
                    src={qrCodeUrl}
                    alt="Código QR para configurar 2FA"
                    style={{ width: "200px", height: "200px", border: "1px solid #E5E7EB", borderRadius: "12px" }}
                  />
                </div>

                {secret && (
                  <details style={{ marginBottom: "20px", fontSize: "13px", color: "#6B7280" }}>
                    <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                      ¿No puedes escanear? Ingresa el código manualmente
                    </summary>
                    <code
                      style={{
                        display: "block",
                        marginTop: "8px",
                        padding: "10px 12px",
                        background: "#F9FAFB",
                        borderRadius: "8px",
                        wordBreak: "break-all",
                        fontSize: "12.5px",
                      }}
                    >
                      {secret}
                    </code>
                  </details>
                )}

                <form onSubmit={activar2fa}>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#4B5563", marginBottom: "8px" }}>
                    Ahora escribe el código de 6 dígitos que te muestra la app
                  </label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      style={{
                        flex: 1,
                        padding: "12px 14px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "10px",
                        fontSize: "18px",
                        letterSpacing: "4px",
                        textAlign: "center",
                        outline: "none",
                      }}
                    />
                    <button
                      type="submit"
                      disabled={activando || codigo.length !== 6}
                      style={{
                        background: "var(--theme-primary, #7C5CBF)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "10px",
                        padding: "0 22px",
                        fontWeight: 800,
                        fontSize: "14px",
                        cursor: activando || codigo.length !== 6 ? "not-allowed" : "pointer",
                        opacity: activando || codigo.length !== 6 ? 0.6 : 1,
                      }}
                    >
                      {activando ? "Verificando…" : "Activar"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {error && (
              <div
                style={{
                  marginTop: "16px",
                  background: "#FEF2F2",
                  color: "#B91C1C",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  fontSize: "13.5px",
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
