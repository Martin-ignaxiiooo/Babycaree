import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Lock, Mail, ShieldAlert, KeyRound } from "lucide-react";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 2FA state
  const [step, setStep] = useState<1 | 2>(1);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [reenviando, setReenviando] = useState(false);
  const [reenviado, setReenviado] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/v1/admin/auth/login`, {
        email: email.trim(),
        password: password.trim()
      });

      if (res.data.require2FA) {
        setTempToken(res.data.tempToken);
        setStep(2);
      } else {
        localStorage.setItem("admin_token", res.data.token);
        localStorage.setItem("admin_user", JSON.stringify(res.data.user));
        navigate("/admin/panel");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/v1/admin/auth/verificar-2fa`, {
        tempToken,
        code: twoFaCode.trim()
      });

      localStorage.setItem("admin_token", res.data.token);
      localStorage.setItem("admin_user", JSON.stringify(res.data.user));
      navigate("/admin/panel");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Código incorrecto");
    } finally {
      setLoading(false);
    }
  };

  // Reenviar: vuelve a mandar usuario/contraseña, que ya de por sí invalida
  // el código anterior y genera + envía uno nuevo (ver login() en backend).
  const handleReenviar = async () => {
    setReenviando(true);
    setError("");
    setReenviado(false);
    try {
      const res = await axios.post(`${API_URL}/v1/admin/auth/login`, {
        email: email.trim(),
        password: password.trim(),
      });
      if (res.data.tempToken) {
        setTempToken(res.data.tempToken);
        setTwoFaCode("");
        setReenviado(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "No se pudo reenviar el código.");
    } finally {
      setReenviando(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito', sans-serif" }}>
      <div className="auth-box" style={{ width: "100%", maxWidth: "420px", padding: "40px", background: "#1F2937", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <ShieldAlert size={48} color="#F59E0B" style={{ margin: "0 auto 16px" }} />
          <h1 style={{ color: "#fff", fontSize: "24px", fontWeight: 800, margin: 0 }}>Portal de Administración</h1>
          <p style={{ color: "#9CA3AF", fontSize: "14px", marginTop: "8px" }}>
            {step === 1 ? "Solo personal autorizado" : "Verificación de 2 Pasos"}
          </p>
        </div>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #EF4444", color: "#EF4444", padding: "12px", borderRadius: "8px", marginBottom: "24px", fontSize: "14px", textAlign: "center" }}>
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", color: "#9CA3AF", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>CORREO CORPORATIVO</label>
              <div style={{ position: "relative" }}>
                <Mail size={18} color="#6B7280" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
                  onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                  style={{ width: "100%", background: "#374151", border: "1px solid #4B5563", color: "#fff", padding: "12px 12px 12px 42px", borderRadius: "8px", outline: "none", fontSize: "15px" }}
                  placeholder="usuario@iniciativababy.cl"
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", color: "#9CA3AF", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>CONTRASEÑA</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} color="#6B7280" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
                  onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                  style={{ width: "100%", background: "#374151", border: "1px solid #4B5563", color: "#fff", padding: "12px 12px 12px 42px", borderRadius: "8px", outline: "none", fontSize: "15px" }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ background: "#F59E0B", color: "#000", border: "none", padding: "14px", borderRadius: "8px", fontSize: "15px", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", marginTop: "12px", transition: "opacity 0.2s" }}
            >
              {loading ? "Ingresando..." : "Ingresar al Panel"}
            </button>
            
            <button
              type="button"
              onClick={() => navigate("/")}
              style={{ background: "transparent", color: "#9CA3AF", border: "none", fontSize: "13px", cursor: "pointer", marginTop: "8px", textDecoration: "underline" }}
            >
              Volver a la App Principal
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify2FA} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <p style={{ color: "#D1D5DB", fontSize: "14px", textAlign: "center", marginBottom: "8px" }}>
              Te enviamos un código de 6 dígitos a tu correo corporativo. Revisa tu bandeja de entrada (y spam).
            </p>
            
            <div>
              <label style={{ display: "block", color: "#9CA3AF", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>CÓDIGO RECIBIDO POR CORREO</label>
              <div style={{ position: "relative" }}>
                <KeyRound size={18} color="#6B7280" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  value={twoFaCode}
                  onChange={e => setTwoFaCode(e.target.value)}
                  required
                  onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
                  onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                  maxLength={6}
                  style={{ width: "100%", background: "#374151", border: "1px solid #4B5563", color: "#fff", padding: "12px 12px 12px 42px", borderRadius: "8px", outline: "none", fontSize: "18px", letterSpacing: "4px", textAlign: "center" }}
                  placeholder="123456"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || twoFaCode.length < 6}
              style={{ background: "#F59E0B", color: "#000", border: "none", padding: "14px", borderRadius: "8px", fontSize: "15px", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", marginTop: "12px" }}
            >
              {loading ? "Verificando..." : "Verificar Código"}
            </button>

            <button
              type="button"
              onClick={handleReenviar}
              disabled={reenviando}
              style={{ background: "transparent", color: "#9CA3AF", border: "none", fontSize: "13px", cursor: reenviando ? "not-allowed" : "pointer", textDecoration: "underline" }}
            >
              {reenviando ? "Reenviando…" : "¿No te llegó? Reenviar código"}
            </button>
            {reenviado && (
              <p style={{ color: "#86EFAC", fontSize: "12.5px", textAlign: "center", margin: "-8px 0 0" }}>
                Te enviamos un código nuevo.
              </p>
            )}
            
            <button
              type="button"
              onClick={() => { setStep(1); setTwoFaCode(""); setReenviado(false); }}
              style={{ background: "transparent", color: "#9CA3AF", border: "none", fontSize: "13px", cursor: "pointer", marginTop: "8px", textDecoration: "underline" }}
            >
              Volver al inicio de sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
