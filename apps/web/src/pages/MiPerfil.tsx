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

          <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "17px", fontWeight: 700, color: "var(--theme-darker)", marginTop: "12px", marginBottom: "4px" }}>Cambiar Contraseña (Opcional)</h3>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--theme-darker)", marginBottom: "8px" }}>Contraseña Actual</label>
            <div style={{ position: "relative" }}>
              <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} placeholder="Ingresa tu contraseña actual" style={{ width: "100%", padding: "12px 14px", border: "2px solid #EDE9F8", borderRadius: "14px", outline: "none", boxSizing: "border-box", fontSize: "15px" }} />
            </div>
          </div>
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
