import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Save } from "lucide-react";
import TopNav from "../components/TopNav";
import { useNotificaciones } from "../hooks/useNotificaciones";

export default function MiPerfil() {
  const notif = useNotificaciones();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  
  // Initialize with local storage data for now
  const initialUser = JSON.parse(localStorage.getItem("user") || "{}");
  
  const [formData, setFormData] = useState({
    nombre: initialUser.nombre || "",
    apellidos: initialUser.apellidos || "",
    email: initialUser.email || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  // Las cuentas creadas con Google no tienen contraseña propia todavía: a
  // esas no se les pide la "actual" (no existe una que puedan conocer).
  const [tienePassword, setTienePassword] = useState(true);

  React.useEffect(() => {
    fetch("https://babycare-backend-msyq.onrender.com/api/profiles/me/password-estado", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setTienePassword(d.definida !== false); })
      .catch(() => {});
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("https://babycare-backend-msyq.onrender.com/api/profiles/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nombre: formData.nombre, apellidos: formData.apellidos })
      });

      // Los datos del perfil se reflejan siempre que el servidor los haya
      // guardado. Antes, si además fallaba el cambio de contraseña, se salía
      // de la función antes de llegar acá: el nombre/apellido sí quedaba
      // guardado en la base pero la pantalla seguía mostrando el valor viejo,
      // dando la impresión de que "solo cambió la contraseña".
      let perfilGuardado = false;
      if (res.ok) {
        const updatedUser = await res.json();
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('storage'));
        perfilGuardado = true;
      }

      let passwordChanged = false;
      let errorPassword = "";

      // Si el usuario escribió una contraseña nueva, se intenta cambiarla
      // siempre. Antes, si además tenía contraseña propia y dejaba vacía la
      // "actual", esta condición daba falso y el cambio se saltaba EN
      // SILENCIO: la pantalla decía "Perfil actualizado exitosamente" y el
      // usuario creía haber cambiado su contraseña, pero al cerrar sesión ya
      // no podía entrar con la nueva (nunca se guardó).
      if (passwordData.newPassword) {
        if (tienePassword && !passwordData.currentPassword) {
          errorPassword = "Debes ingresar tu contraseña actual para poder cambiarla.";
        } else {
          const passRes = await fetch("https://babycare-backend-msyq.onrender.com/api/profiles/me/password", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(passwordData)
          });

          if (passRes.ok) {
            passwordChanged = true;
            setTienePassword(true);
            setPasswordData({ currentPassword: "", newPassword: "" });
          } else {
            const err = await passRes.json().catch(() => ({}));
            errorPassword = err.error || "No se pudo actualizar la contraseña.";
          }
        }
      }

      if (!perfilGuardado) {
        const err = await res.json().catch(() => ({}));
        setMessage(err.error || "Error al actualizar el perfil.");
        return;
      }

      if (errorPassword) {
        // El perfil sí se guardó; se avisa solo de lo que falló.
        setMessage(`Datos guardados, pero la contraseña no: ${errorPassword}`);
        return;
      }

      setMessage(`Perfil actualizado exitosamente.${passwordChanged ? " Contraseña actualizada." : ""}`);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      console.error(error);
      setMessage("Error al actualizar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, #FAF9FD 0%, #F6F2FF 100%)", fontFamily: "'Nunito', sans-serif" }}>
      <TopNav user={initialUser} activePath="/mi-perfil" />

      {/* Cabecera morada con el saludo y el avatar, como en el diseño. La
          tarjeta del formulario flota sobre ella con margen negativo. */}
      <div style={{ background: "linear-gradient(135deg, #8B5FD6 0%, #A47BE8 100%)", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 24px 0" }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginBottom: "20px", fontWeight: 700, fontSize: "14px", fontFamily: "'Nunito', sans-serif", padding: 0 }}
          >
            <ArrowLeft size={16} /> Volver
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "62px", height: "62px", borderRadius: "50%", flexShrink: 0,
              background: "rgba(255,255,255,0.2)", border: "2.5px solid rgba(255,255,255,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Baloo 2', sans-serif", fontSize: "24px", fontWeight: 800, color: "#fff",
            }}>
              {(formData.nombre || initialUser?.nombre || "?").trim().charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "28px", fontWeight: 700, color: "#fff", margin: 0 }}>
                Hola, {(formData.nombre || initialUser?.nombre || "").split(" ")[0]}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.75)", margin: "2px 0 0", fontWeight: 600, fontSize: "14px" }}>
                {initialUser?.email ?? ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "680px", margin: "-60px auto 48px", background: "var(--surface)", padding: "36px 40px", borderRadius: "24px", boxShadow: "0 10px 40px rgba(90,60,150,0.12)", position: "relative" }}>
        <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "22px", fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>Mis datos</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "28px", fontWeight: 600, fontSize: "14px" }}>Actualiza los datos personales de tu cuenta.</p>

        {message && (
          <div style={{ padding: "14px 16px", background: message.includes("Error") ? "#FEF0F0" : "#F0FBF4", color: message.includes("Error") ? "#DC6B6B" : "#2F8F5B", borderRadius: "14px", marginBottom: "24px", fontWeight: 700, fontSize: "14px" }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>Nombre</label>
            <div style={{ position: "relative" }}>
              <User size={18} style={{ position: "absolute", left: "14px", top: "13px", color: "var(--theme-light)" }} />
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required style={{ width: "100%", padding: "12px 14px 12px 42px", border: "2px solid #EDE9F8", borderRadius: "14px", outline: "none", boxSizing: "border-box", fontSize: "15px" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>Apellidos</label>
            <div style={{ position: "relative" }}>
              <User size={18} style={{ position: "absolute", left: "14px", top: "13px", color: "var(--theme-light)" }} />
              <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} required style={{ width: "100%", padding: "12px 14px 12px 42px", border: "2px solid #EDE9F8", borderRadius: "14px", outline: "none", boxSizing: "border-box", fontSize: "15px" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>Correo Electrónico</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: "14px", top: "13px", color: "#B0ABC4" }} />
              <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled style={{ width: "100%", padding: "12px 14px 12px 42px", border: "2px solid #EDE9F8", borderRadius: "14px", outline: "none", boxSizing: "border-box", background: "#FAF9FD", color: "var(--text-muted)", fontSize: "15px" }} title="El correo no se puede cambiar por ahora" />
            </div>
          </div>

          <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "17px", fontWeight: 700, color: "var(--text)", marginTop: "12px", marginBottom: "4px" }}>
            {tienePassword ? "Cambiar Contraseña (Opcional)" : "Crear una Contraseña (Opcional)"}
          </h3>
          {!tienePassword && (
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: 0, marginBottom: "4px", lineHeight: 1.5 }}>
              Entraste con Google, así que todavía no tienes una contraseña propia.
              Si defines una, vas a poder entrar también con tu correo.
            </p>
          )}
          {tienePassword && (
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>Contraseña Actual</label>
              <div style={{ position: "relative" }}>
                <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} placeholder="Ingresa tu contraseña actual" style={{ width: "100%", padding: "12px 14px", border: "2px solid #EDE9F8", borderRadius: "14px", outline: "none", boxSizing: "border-box", fontSize: "15px" }} />
              </div>
            </div>
          )}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>Nueva Contraseña</label>
            <div style={{ position: "relative" }}>
              <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} placeholder="Ingresa tu nueva contraseña" style={{ width: "100%", padding: "12px 14px", border: "2px solid #EDE9F8", borderRadius: "14px", outline: "none", boxSizing: "border-box", fontSize: "15px" }} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))", color: "#fff", padding: "15px", border: "none", borderRadius: "16px", fontWeight: 800, fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "12px", boxShadow: "0 10px 26px var(--theme-shadow)" }}>
            <Save size={18} />
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>

        {/* Notificaciones push */}
        <div style={{ borderTop: "1px solid var(--border-soft)", marginTop: "32px", paddingTop: "26px" }}>
          <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "19px", color: "var(--text)", margin: "0 0 6px" }}>
            Avisos en el teléfono
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 16px" }}>
            Recibe las vacunas, controles y exámenes pendientes como notificación,
            además del correo.
          </p>

          {notif.estado === "cargando" && (
            <p style={{ fontSize: "13.5px", color: "var(--text-muted)" }}>Revisando…</p>
          )}

          {notif.estado === "activo" && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ background: "#E8F7F1", color: "#3E8E6E", padding: "8px 14px", borderRadius: "100px", fontWeight: 800, fontSize: "13px" }}>
                ✓ Activadas en este dispositivo
              </span>
              <button
                onClick={notif.desactivar}
                disabled={notif.procesando}
                style={{ background: "none", border: "none", color: "var(--text-muted)", textDecoration: "underline", cursor: "pointer", fontSize: "13px", fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}
              >
                Desactivar
              </button>
            </div>
          )}

          {notif.estado === "inactivo" && (
            <button
              onClick={notif.activar}
              disabled={notif.procesando}
              style={{ background: "var(--theme-primary)", color: "#fff", border: "none", borderRadius: "100px", padding: "13px 24px", fontWeight: 800, fontSize: "14px", cursor: notif.procesando ? "not-allowed" : "pointer", opacity: notif.procesando ? 0.6 : 1, fontFamily: "'Nunito', sans-serif" }}
            >
              {notif.procesando ? "Activando…" : "Activar notificaciones"}
            </button>
          )}

          {notif.estado === "bloqueado" && (
            <Aviso>
              Bloqueaste las notificaciones para este sitio. Para activarlas,
              entra a los ajustes del navegador para esta página y permite las
              notificaciones.
            </Aviso>
          )}

          {notif.estado === "requiere_instalar" && (
            <Aviso>
              En iPhone y iPad las notificaciones solo funcionan si instalas la
              app: toca “Compartir” y luego “Agregar a pantalla de inicio”.
            </Aviso>
          )}

          {notif.estado === "no_soportado" && (
            <Aviso>Este navegador no admite notificaciones. Los avisos te seguirán llegando por correo.</Aviso>
          )}

          {notif.estado === "no_disponible" && (
            <Aviso>Las notificaciones no están disponibles por ahora. Los avisos te seguirán llegando por correo.</Aviso>
          )}

          {notif.error && (
            <p style={{ color: "#D97070", fontSize: "13px", fontWeight: 600, marginTop: "10px" }}>{notif.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)", borderRadius: "14px", padding: "14px 16px", fontSize: "13.5px", color: "var(--text-muted)", lineHeight: 1.6 }}>
      {children}
    </div>
  );
}
