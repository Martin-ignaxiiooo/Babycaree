import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Save } from "lucide-react";
import TopNav from "../components/TopNav";

export default function MiPerfil() {
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

      <div style={{ maxWidth: "600px", margin: "48px auto", background: "#fff", padding: "40px", borderRadius: "26px", boxShadow: "0 10px 40px rgba(124,92,191,0.1)" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "#8A849C", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginBottom: "24px", fontWeight: 700 }}>
          <ArrowLeft size={16} /> Volver
        </button>

        <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "26px", fontWeight: 700, color: "var(--theme-darker)", marginBottom: "8px" }}>Modificar Mi Perfil</h1>
        <p style={{ color: "#8A849C", marginBottom: "32px", fontWeight: 600, fontSize: "14px" }}>Actualiza tus datos personales de la cuenta.</p>

        {message && (
          <div style={{ padding: "14px 16px", background: message.includes("Error") ? "#FEF0F0" : "#F0FBF4", color: message.includes("Error") ? "#DC6B6B" : "#2F8F5B", borderRadius: "14px", marginBottom: "24px", fontWeight: 700, fontSize: "14px" }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--theme-darker)", marginBottom: "8px" }}>Nombre</label>
            <div style={{ position: "relative" }}>
              <User size={18} style={{ position: "absolute", left: "14px", top: "13px", color: "var(--theme-light)" }} />
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required style={{ width: "100%", padding: "12px 14px 12px 42px", border: "2px solid #EDE9F8", borderRadius: "14px", outline: "none", boxSizing: "border-box", fontSize: "15px" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--theme-darker)", marginBottom: "8px" }}>Apellidos</label>
            <div style={{ position: "relative" }}>
              <User size={18} style={{ position: "absolute", left: "14px", top: "13px", color: "var(--theme-light)" }} />
              <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} required style={{ width: "100%", padding: "12px 14px 12px 42px", border: "2px solid #EDE9F8", borderRadius: "14px", outline: "none", boxSizing: "border-box", fontSize: "15px" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--theme-darker)", marginBottom: "8px" }}>Correo Electrónico</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: "14px", top: "13px", color: "#B0ABC4" }} />
              <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled style={{ width: "100%", padding: "12px 14px 12px 42px", border: "2px solid #EDE9F8", borderRadius: "14px", outline: "none", boxSizing: "border-box", background: "#FAF9FD", color: "#8A849C", fontSize: "15px" }} title="El correo no se puede cambiar por ahora" />
            </div>
          </div>

          <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "17px", fontWeight: 700, color: "var(--theme-darker)", marginTop: "12px", marginBottom: "4px" }}>
            {tienePassword ? "Cambiar Contraseña (Opcional)" : "Crear una Contraseña (Opcional)"}
          </h3>
          {!tienePassword && (
            <p style={{ color: "#8A849C", fontSize: "13px", marginTop: 0, marginBottom: "4px", lineHeight: 1.5 }}>
              Entraste con Google, así que todavía no tienes una contraseña propia.
              Si defines una, vas a poder entrar también con tu correo.
            </p>
          )}
          {tienePassword && (
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--theme-darker)", marginBottom: "8px" }}>Contraseña Actual</label>
              <div style={{ position: "relative" }}>
                <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} placeholder="Ingresa tu contraseña actual" style={{ width: "100%", padding: "12px 14px", border: "2px solid #EDE9F8", borderRadius: "14px", outline: "none", boxSizing: "border-box", fontSize: "15px" }} />
              </div>
            </div>
          )}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--theme-darker)", marginBottom: "8px" }}>Nueva Contraseña</label>
            <div style={{ position: "relative" }}>
              <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} placeholder="Ingresa tu nueva contraseña" style={{ width: "100%", padding: "12px 14px", border: "2px solid #EDE9F8", borderRadius: "14px", outline: "none", boxSizing: "border-box", fontSize: "15px" }} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))", color: "#fff", padding: "15px", border: "none", borderRadius: "16px", fontWeight: 800, fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "12px", boxShadow: "0 10px 26px var(--theme-shadow)" }}>
            <Save size={18} />
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
