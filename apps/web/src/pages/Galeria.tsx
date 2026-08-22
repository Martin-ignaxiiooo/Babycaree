import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Sparkles } from 'lucide-react';
import TopNav from '../components/TopNav';

export default function Galeria() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, #FAF9FD 0%, #F6F2FF 100%)", fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column" }}>
      
      {/* ── TOP NAV GLOBAL ── */}
      <TopNav user={{}} activePath="/galeria" />

      {/* ── HEADER ── */}
      {/* El fondo ocupa todo el ancho, pero el contenido se limita al mismo
          max-width que .page-container (1400px) para que quede alineado con
          el contenido de abajo, igual que en la pantalla de Inicio. */}
      <div style={{ background: "linear-gradient(120deg, var(--theme-darker) 0%, #3A2E5C 55%, var(--theme-dark) 100%)", color: "#fff" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "48px 40px 48px" }}>
        <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "none", color: "var(--theme-light)", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
          <ArrowLeft size={16} /> Volver al Dashboard
        </button>
        <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "32px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "14px" }}>
          <ImageIcon size={34} /> Mi Galería
        </h1>
        <div style={{ fontSize: "15px", color: "rgba(255,255,255,0.75)", marginTop: "8px", fontWeight: 600 }}>Tus momentos especiales</div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
        <div style={{ background: "#fff", padding: "52px 44px", borderRadius: "28px", textAlign: "center", boxShadow: "0 10px 40px rgba(124,92,191,0.1)", maxWidth: "500px" }}>
          <div style={{ width: "84px", height: "84px", background: "linear-gradient(135deg, var(--theme-bg-light), var(--accent-coral-light))", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <ImageIcon size={38} color="var(--theme-primary)" />
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "var(--accent-gold-light)", color: "#8A6D1D",
            padding: "5px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: 800,
            marginBottom: "16px",
          }}>
            <Sparkles size={12} /> Próximamente
          </div>
          <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "23px", fontWeight: 700, color: "var(--theme-darker)", marginBottom: "12px" }}>Módulo en desarrollo</h2>
          <p style={{ fontSize: "15px", color: "#8A849C", lineHeight: 1.6, marginBottom: "32px" }}>
            Estamos construyendo un espacio seguro y encriptado para que puedas guardar y compartir las fotos más hermosas del crecimiento de tu bebé. ¡Estará disponible muy pronto!
          </p>
          <button 
            onClick={() => navigate("/dashboard")}
            style={{ background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))", color: "#fff", border: "none", padding: "14px 32px", borderRadius: "14px", fontSize: "15px", fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 26px var(--theme-shadow)" }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
