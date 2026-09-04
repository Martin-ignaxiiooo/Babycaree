import React from 'react';
import TopNav from '../components/TopNav';

export default function Galeria() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(165deg, #FAF9FD 0%, #F6F2FF 100%)",
      fontFamily: "'Nunito', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      <TopNav user={{}} activePath="/galeria" />
      <div className="page-container" style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", textAlign: "center", flex: 1, padding: "60px 20px",
      }}>
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>🚧</div>
        <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "26px", fontWeight: 700, color: "var(--text)", margin: "0 0 8px 0" }}>
          Módulo en desarrollo
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-muted)", maxWidth: "420px", fontWeight: 600 }}>
          La Galería está en construcción. Muy pronto vas a poder guardar y compartir los momentos más especiales del crecimiento de tu bebé acá.
        </p>
      </div>
    </div>
  );
}

