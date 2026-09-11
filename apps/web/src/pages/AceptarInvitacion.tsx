import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Baby } from "lucide-react";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

/**
 * Pantalla a la que lleva el enlace del correo de invitación.
 *
 * A diferencia de /registro (el onboarding completo de 4 pasos, que
 * pide elegir embarazo/nacido y CREAR un bebé), acá la persona solo
 * crea su cuenta -viene invitada a ver el bebé de otra persona, no a
 * registrar uno propio-. El correo viene fijo desde la invitación y no
 * se puede cambiar.
 */
export default function AceptarInvitacion() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [cargando, setCargando] = useState(true);
  const [invitacion, setInvitacion] = useState<any | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [password, setPassword] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/v1/invitaciones/${token}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "No pudimos cargar la invitación.");
        return data;
      })
      .then(setInvitacion)
      .catch((e) => setErrorCarga(e.message))
      .finally(() => setCargando(false));
  }, [token]);

  const aceptar = async () => {
    if (!nombre.trim() || !apellidos.trim() || !password) {
      setErrorForm("Completa tu nombre, apellidos y contraseña.");
      return;
    }
    if (!acepta) {
      setErrorForm("Debes aceptar el tratamiento de datos para continuar.");
      return;
    }
    setGuardando(true);
    setErrorForm(null);
    try {
      const res = await fetch(`${API_URL}/v1/invitaciones/${token}/aceptar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          apellidos: apellidos.trim(),
          password,
          consentimiento_ley_19628: true,
          consentimiento_ley_21719: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo crear la cuenta.");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/seleccionar-perfil");
    } catch (e: any) {
      setErrorForm(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const fondo: React.CSSProperties = {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    padding: "24px", fontFamily: "'Nunito', sans-serif",
    background: "linear-gradient(160deg, var(--theme-bg-light) 0%, var(--page-bg) 100%)",
  };

  const tarjeta: React.CSSProperties = {
    background: "var(--surface)", borderRadius: "26px", padding: "32px 28px",
    width: "100%", maxWidth: "420px", boxShadow: "0 12px 50px rgba(45,38,64,0.12)",
  };

  const input: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: "12px",
    border: "1.5px solid var(--border)", background: "var(--surface-2)",
    fontSize: "14px", fontFamily: "'Nunito', sans-serif", color: "var(--text)",
    outline: "none", boxSizing: "border-box", marginBottom: "14px",
  };

  const label: React.CSSProperties = {
    display: "block", fontSize: "12px", fontWeight: 800, color: "var(--text-muted)", marginBottom: "6px",
  };

  if (cargando) {
    return (
      <div style={fondo}>
        <Loader2 size={30} className="spin-icon" color="var(--theme-primary)" />
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div style={fondo}>
        <div style={{ ...tarjeta, textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>😕</div>
          <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "20px", color: "var(--text)", margin: "0 0 8px" }}>
            No pudimos abrir la invitación
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "22px" }}>{errorCarga}</p>
          <button
            onClick={() => navigate("/")}
            style={{ background: "var(--theme-primary)", color: "#fff", border: "none", borderRadius: "100px", padding: "13px 28px", fontWeight: 800, fontSize: "14px", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}
          >
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }

  // Ya tiene cuenta: no hay nada que crear, solo iniciar sesión. El
  // acceso ya quedó vinculado a su correo al momento de invitarla.
  if (invitacion?.ya_tiene_cuenta) {
    return (
      <div style={fondo}>
        <div style={{ ...tarjeta, textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>💌</div>
          <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "20px", color: "var(--text)", margin: "0 0 8px" }}>
            {invitacion.nombre_invitador} te invitó a ver a {invitacion.nombre_bebe}
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "22px" }}>
            Ya tienes una cuenta con <strong>{invitacion.correo_invitado}</strong>. Inicia sesión y encontrarás a {invitacion.nombre_bebe} en tu lista de perfiles.
          </p>
          <button
            onClick={() => navigate("/")}
            style={{ background: "var(--theme-primary)", color: "#fff", border: "none", borderRadius: "100px", padding: "13px 28px", fontWeight: 800, fontSize: "14px", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={fondo}>
      <div style={tarjeta}>
        <div style={{
          background: "var(--theme-bg-light)", borderLeft: "4px solid var(--theme-primary)",
          borderRadius: "0 12px 12px 0", padding: "14px 16px", marginBottom: "24px",
          display: "flex", gap: "12px", alignItems: "flex-start",
        }}>
          <Baby size={20} color="var(--theme-primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div style={{ fontSize: "13.5px", color: "var(--text)", lineHeight: 1.5 }}>
            <strong>{invitacion.nombre_invitador}</strong> te invitó a ver el perfil de <strong>{invitacion.nombre_bebe}</strong>.
          </div>
        </div>

        <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "21px", color: "var(--text)", margin: "0 0 6px" }}>
          Crea tu cuenta
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "22px", lineHeight: 1.5 }}>
          Solo necesitas esto para ver a {invitacion.nombre_bebe}. No tienes que registrar ningún bebé.
        </p>

        <label style={label}>Correo</label>
        <input value={invitacion.correo_invitado} disabled style={{ ...input, opacity: 0.7, cursor: "not-allowed" }} />

        <label style={label}>Tu nombre</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ana" style={input} />

        <label style={label}>Tus apellidos</label>
        <input value={apellidos} onChange={(e) => setApellidos(e.target.value)} placeholder="Rojas" style={input} />

        <label style={label}>Contraseña</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" style={input} />

        <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "12.5px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "18px", cursor: "pointer" }}>
          <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} style={{ marginTop: "3px", flexShrink: 0 }} />
          Acepto el tratamiento de mis datos personales según la Ley 19.628 y la Ley 21.719.
        </label>

        {errorForm && (
          <p style={{ fontSize: "13px", color: "#D97070", fontWeight: 700, marginBottom: "14px", lineHeight: 1.4 }}>{errorForm}</p>
        )}

        <button
          onClick={aceptar}
          disabled={guardando}
          style={{
            width: "100%", padding: "15px", borderRadius: "100px", border: "none",
            background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
            color: "#fff", fontWeight: 800, fontSize: "15px",
            cursor: guardando ? "not-allowed" : "pointer", opacity: guardando ? 0.7 : 1,
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          {guardando ? "Creando cuenta…" : `Crear cuenta y ver a ${invitacion.nombre_bebe}`}
        </button>
      </div>
    </div>
  );
}
