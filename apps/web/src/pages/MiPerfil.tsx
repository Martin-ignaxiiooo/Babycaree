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

      let passwordChanged = false;
      if (passwordData.currentPassword && passwordData.newPassword) {
        const passRes = await fetch("https://babycare-backend-msyq.onrender.com/api/profiles/me/password", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(passwordData)
        });
        
        if (!passRes.ok) {
          const err = await passRes.json();
          setMessage(err.error || "Error al actualizar la contraseña.");
          setLoading(false);
          return;
        }
        passwordChanged = true;
      }

      if (res.ok) {
        const updatedUser = await res.json();
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Emit a custom event so other components can update their state
        window.dispatchEvent(new Event('storage'));
        
        setMessage(`Perfil actualizado exitosamente.${passwordChanged ? " Contraseña actualizada." : ""}`);
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        const err = await res.json();
        setMessage(err.error || "Error al actualizar el perfil.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Error al actualizar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7FC", fontFamily: "'Nunito', sans-serif" }}>
      <TopNav user={initialUser} activePath="/mi-perfil" />

      <div className="auth-box" style={{ maxWidth: "600px", margin: "40px auto", background: "#fff", padding: "40px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "#6B7280", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginBottom: "24px", fontWeight: 700 }}>
          <ArrowLeft size={16} /> Volver
        </button>

        <h1 style={{ fontSize: "24px", fontWeight: 900, color: "var(--theme-darker)", marginBottom: "8px" }}>Modificar Mi Perfil</h1>
        <p style={{ color: "#6B7280", marginBottom: "32px" }}>Actualiza tus datos personales de la cuenta.</p>

        {message && (
          <div style={{ padding: "12px", background: message.includes("Error") ? "#FEE2E2" : "#D1FAE5", color: message.includes("Error") ? "#EF4444" : "#065F46", borderRadius: "8px", marginBottom: "24px", fontWeight: 700 }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--theme-darker)", marginBottom: "8px" }}>Nombre</label>
            <div style={{ position: "relative" }}>
              <User size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "#9CA3AF" }} />
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required style={{ width: "100%", padding: "12px 12px 12px 40px", border: "1px solid #E5E7EB", borderRadius: "8px", outline: "none" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--theme-darker)", marginBottom: "8px" }}>Apellidos</label>
            <div style={{ position: "relative" }}>
              <User size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "#9CA3AF" }} />
              <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} required style={{ width: "100%", padding: "12px 12px 12px 40px", border: "1px solid #E5E7EB", borderRadius: "8px", outline: "none" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--theme-darker)", marginBottom: "8px" }}>Correo Electrónico</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "#9CA3AF" }} />
              <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled style={{ width: "100%", padding: "12px 12px 12px 40px", border: "1px solid #E5E7EB", borderRadius: "8px", outline: "none", background: "#F9FAFB", color: "#6B7280" }} title="El correo no se puede cambiar por ahora" />
            </div>
          </div>

          <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--theme-darker)", marginTop: "16px", marginBottom: "8px" }}>Cambiar Contraseña (Opcional)</h3>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--theme-darker)", marginBottom: "8px" }}>Contraseña Actual</label>
            <div style={{ position: "relative" }}>
              <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} placeholder="Ingresa tu contraseña actual" style={{ width: "100%", padding: "12px", border: "1px solid #E5E7EB", borderRadius: "8px", outline: "none" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--theme-darker)", marginBottom: "8px" }}>Nueva Contraseña</label>
            <div style={{ position: "relative" }}>
              <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} placeholder="Ingresa tu nueva contraseña" style={{ width: "100%", padding: "12px", border: "1px solid #E5E7EB", borderRadius: "8px", outline: "none" }} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ background: "var(--theme-primary)", color: "#fff", padding: "14px", border: "none", borderRadius: "8px", fontWeight: 800, fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "12px" }}>
            <Save size={18} />
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
