import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Save, ChevronRight } from "lucide-react";
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
    <div style={{ minHeight: "100vh", background: "#F7F5FC", fontFamily: "'Nunito', sans-serif" }}>
      <TopNav user={initialUser} activePath="/mi-perfil" />

      {/* Cabecera morada; las tarjetas flotan sobre ella. */}
      <div style={{ background: "linear-gradient(135deg, #8B5FD6 0%, #A47BE8 100%)", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "24px 32px 0" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.85)", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px", fontFamily: "'Nunito', sans-serif", padding: 0 }}
          >
            <ArrowLeft size={16} /> Volver
          </button>
          <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "32px", fontWeight: 700, color: "#fff", margin: 0 }}>
            Hola, {formData.nombre || "!"}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: "1180px", margin: "-60px auto 0", padding: "0 32px 48px" }}>
        <div className="perfil-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 320px) minmax(0, 1fr)", gap: "20px", alignItems: "start" }}>

          {/* ── Columna izquierda: identidad ── */}
          <Tarjeta style={{ textAlign: "center" }}>
            <div style={{
              width: "104px", height: "104px", borderRadius: "50%", margin: "0 auto 16px",
              background: "linear-gradient(135deg, #8B5FD6, #C0A9EE)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: "38px", fontWeight: 900, fontFamily: "'Baloo 2', sans-serif",
            }}>
              {(formData.nombre || "?").charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize: "19px", fontWeight: 800, color: "#8B5FD6", fontFamily: "'Baloo 2', sans-serif" }}>
              {formData.nombre} {formData.apellidos}
            </div>
            <div style={{ fontSize: "13.5px", color: "#8A849C", marginTop: "4px", wordBreak: "break-all" }}>
              {formData.email}
            </div>
          </Tarjeta>

          {/* ── Columna derecha ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Datos de la cuenta */}
            <Tarjeta>
              <Titulo>Editar Perfil</Titulo>
              <form onSubmit={handleSave} style={{ marginTop: "18px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                  <Campo etiqueta="Nombre" icono={<User size={16} color="#A99FC4" />}>
                    <input name="nombre" value={formData.nombre} onChange={handleChange} style={input} />
                  </Campo>
                  <Campo etiqueta="Apellidos" icono={<User size={16} color="#A99FC4" />}>
                    <input name="apellidos" value={formData.apellidos} onChange={handleChange} style={input} />
                  </Campo>
                </div>

                <Campo etiqueta="Correo electrónico" icono={<Mail size={16} color="#A99FC4" />}>
                  <input value={formData.email} disabled style={{ ...input, background: "#F3F1F8", color: "#A99FC4", cursor: "not-allowed" }} />
                </Campo>

                <div style={{ borderTop: "1px solid #EDE7F9", marginTop: "18px", paddingTop: "18px" }}>
                  <Titulo pequeno>
                    {tienePassword ? "Cambiar contraseña" : "Definir una contraseña"}
                  </Titulo>
                  {!tienePassword && (
                    <p style={{ fontSize: "13px", color: "#8A849C", margin: "6px 0 0", lineHeight: 1.55 }}>
                      Entraste con Google, así que todavía no tienes una contraseña propia.
                      Define una si quieres poder entrar también con tu correo.
                    </p>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: tienePassword ? "repeat(auto-fit, minmax(200px, 1fr))" : "1fr", gap: "14px", marginTop: "12px" }}>
                    {tienePassword && (
                      <Campo etiqueta="Contraseña actual">
                        <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} placeholder="••••••••" style={input} />
                      </Campo>
                    )}
                    <Campo etiqueta="Contraseña nueva">
                      <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} placeholder="••••••••" style={input} />
                    </Campo>
                  </div>
                </div>

                {message && (
                  <div style={{
                    marginTop: "16px", padding: "12px 14px", borderRadius: "12px", fontSize: "13.5px", fontWeight: 700,
                    background: message.includes("Error") || message.includes("No se") || message.includes("Debes") ? "#FFF0F0" : "#E8F7F1",
                    color: message.includes("Error") || message.includes("No se") || message.includes("Debes") ? "#D97070" : "#3E8E6E",
                  }}>
                    {message}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{ ...btnPrimario, marginTop: "18px", opacity: loading ? 0.6 : 1 }}>
                  <Save size={17} /> {loading ? "Guardando…" : "Guardar Cambios"}
                </button>
              </form>
            </Tarjeta>

            {/* Notificaciones */}
            <Tarjeta>
              <Titulo>Notificaciones</Titulo>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginTop: "16px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                  <div style={{ fontSize: "14.5px", fontWeight: 800, color: "#3F3A52" }}>Citas y vacunas</div>
                  <div style={{ fontSize: "12.5px", color: "#8A849C", marginTop: "2px" }}>
                    Avisos en el teléfono, además del correo.
                  </div>
                </div>

                {notif.estado === "cargando" && <span style={{ fontSize: "13px", color: "#A99FC4" }}>Revisando…</span>}

                {notif.estado === "activo" && (
                  <Interruptor activo onClick={notif.desactivar} disabled={notif.procesando} />
                )}
                {notif.estado === "inactivo" && (
                  <Interruptor activo={false} onClick={notif.activar} disabled={notif.procesando} />
                )}
              </div>

              {/* Los estados que no se resuelven con un interruptor se explican. */}
              {["bloqueado", "requiere_instalar", "no_soportado", "no_disponible"].includes(notif.estado) && (
                <div style={{ marginTop: "14px" }}>
                  <Aviso>
                    {notif.estado === "bloqueado" && "Bloqueaste las notificaciones para este sitio. Para activarlas, permítelas en los ajustes del navegador para esta página."}
                    {notif.estado === "requiere_instalar" && "En iPhone y iPad las notificaciones solo funcionan si instalas la app: toca “Compartir” y luego “Agregar a pantalla de inicio”."}
                    {notif.estado === "no_soportado" && "Este navegador no admite notificaciones. Los avisos te seguirán llegando por correo."}
                    {notif.estado === "no_disponible" && "Las notificaciones no están disponibles por ahora. Los avisos te seguirán llegando por correo."}
                  </Aviso>
                </div>
              )}

              {notif.error && (
                <p style={{ color: "#D97070", fontSize: "13px", fontWeight: 600, marginTop: "10px" }}>{notif.error}</p>
              )}
            </Tarjeta>

            {/* Privacidad */}
            <Tarjeta>
              <Titulo>Privacidad</Titulo>
              <button
                onClick={() => {
                  const id = localStorage.getItem("selectedBabyId");
                  navigate(id ? `/perfil/${id}?tab=compartir` : "/seleccionar-perfil");
                }}
                style={filaEnlace}
              >
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "14.5px", fontWeight: 800, color: "#3F3A52" }}>Datos compartidos</div>
                  <div style={{ fontSize: "12.5px", color: "#8A849C", marginTop: "2px" }}>
                    Gestiona quién más puede ver el perfil de tu bebé.
                  </div>
                </div>
                <ChevronRight size={18} color="#A99FC4" style={{ flexShrink: 0 }} />
              </button>
            </Tarjeta>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .perfil-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

/* ── piezas ── */

function Tarjeta({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", borderRadius: "20px", padding: "24px 26px", boxShadow: "0 6px 28px rgba(90,60,150,0.08)", ...style }}>
      {children}
    </div>
  );
}

function Titulo({ children, pequeno }: { children: React.ReactNode; pequeno?: boolean }) {
  return (
    <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: pequeno ? "16px" : "19px", fontWeight: 700, color: "#3F3A52", margin: 0 }}>
      {children}
    </h2>
  );
}

function Campo({ etiqueta, icono, children }: { etiqueta: string; icono?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: "12px" }}>
      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 800, color: "#8A849C", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "7px" }}>
        {icono} {etiqueta}
      </label>
      {children}
    </div>
  );
}

/** Interruptor tipo switch, como en el diseño. */
function Interruptor({ activo, onClick, disabled }: { activo: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={activo}
      style={{
        width: "52px", height: "30px", borderRadius: "100px", border: "none", flexShrink: 0,
        background: activo ? "linear-gradient(135deg, #8B5FD6, #A47BE8)" : "#DDD6EC",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
        position: "relative", transition: "background .2s",
      }}
    >
      <span style={{
        position: "absolute", top: "3px", left: activo ? "25px" : "3px",
        width: "24px", height: "24px", borderRadius: "50%", background: "#fff",
        transition: "left .2s", boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
      }} />
    </button>
  );
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#FAF8FE", border: "1px solid #EDE7F9", borderRadius: "14px", padding: "14px 16px", fontSize: "13.5px", color: "#6B647F", lineHeight: 1.6 }}>
      {children}
    </div>
  );
}

const input: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: "12px",
  border: "1px solid #E4DBF7", background: "#FAF8FE", fontSize: "14.5px",
  fontFamily: "'Nunito', sans-serif", color: "#3F3A52", outline: "none", boxSizing: "border-box",
};

const btnPrimario: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
  background: "linear-gradient(135deg, #8B5FD6, #A47BE8)", color: "#fff", border: "none",
  borderRadius: "12px", padding: "14px 28px", fontWeight: 800, fontSize: "14.5px",
  cursor: "pointer", fontFamily: "'Nunito', sans-serif",
  boxShadow: "0 6px 16px rgba(139,95,214,0.28)",
};

const filaEnlace: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
  width: "100%", background: "#FAF8FE", border: "1px solid #EDE7F9", borderRadius: "14px",
  padding: "14px 16px", cursor: "pointer", marginTop: "16px", fontFamily: "'Nunito', sans-serif",
};
