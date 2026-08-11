import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import TopNav from '../components/TopNav';

export default function Galeria() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", background: "#F8F7FC", fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column" }}>
      
      {/* ── TOP NAV GLOBAL ── */}
      <TopNav user={{}} activePath="/galeria" />

      {/* ── HEADER ── */}
      <div style={{ background: "linear-gradient(135deg, var(--theme-darker) 0%, var(--theme-dark) 100%)", color: "#fff", padding: "48px 40px 48px" }}>
        <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "none", color: "var(--theme-light)", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
          <ArrowLeft size={16} /> Volver al Dashboard
        </button>
        <h1 style={{ fontSize: "36px", fontWeight: 900, margin: 0, display: "flex", alignItems: "center", gap: "16px" }}>
          <ImageIcon size={40} /> Mi Galería
        </h1>
        <div style={{ fontSize: "16px", color: "var(--theme-bg-light)", marginTop: "8px" }}>Tus momentos especiales</div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
        <div style={{ background: "#fff", padding: "48px", borderRadius: "24px", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", maxWidth: "500px" }}>
          <div style={{ width: "80px", height: "80px", background: "var(--theme-bg-light)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <ImageIcon size={40} color="var(--theme-primary)" />
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--theme-darker)", marginBottom: "12px" }}>Módulo en desarrollo</h2>
          <p style={{ fontSize: "15px", color: "#6B7280", lineHeight: 1.6, marginBottom: "32px" }}>
            Estamos construyendo un espacio seguro y encriptado para que puedas guardar y compartir las fotos más hermosas del crecimiento de tu bebé. ¡Estará disponible muy pronto!
          </p>
          <button 
            onClick={() => navigate("/dashboard")}
            style={{ background: "var(--theme-primary)", color: "#fff", border: "none", padding: "14px 32px", borderRadius: "12px", fontSize: "16px", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 12px rgba(124,92,191,0.3)" }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
