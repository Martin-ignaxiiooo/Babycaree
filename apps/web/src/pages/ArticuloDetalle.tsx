import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Eye, Star, ThumbsUp } from "lucide-react";
import axios from "axios";

import { API_URL as API_BASE } from "../config/api";
import { formatearArticulo } from "../utils/formatoArticulo";

const API_URL = `${API_BASE}/v1`;

export default function ArticuloDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [articulo, setArticulo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    const fetchDetalle = async () => {
      try {
        const res = await axios.get(`${API_URL}/comunidad/articulos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setArticulo(res.data);
      } catch (error) {
        console.error("Error fetching articulo detalle:", error);
        setError("No pudimos cargar este artículo. Intenta de nuevo en un momento.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetalle();
  }, [id, token, navigate]);

  const handleLike = async () => {
    if (!articulo) return;
    // Optimista: refleja el cambio de inmediato, sin esperar la respuesta
    setArticulo({ ...articulo, has_liked: !articulo.has_liked, likes: (articulo.likes || 0) + (articulo.has_liked ? -1 : 1) });
    try {
      await axios.post(`${API_URL}/comunidad/articulos/${id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revertir si falló
      setArticulo((prev: any) => prev && ({ ...prev, has_liked: !prev.has_liked, likes: (prev.likes || 0) + (prev.has_liked ? -1 : 1) }));
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center", fontFamily: "'Nunito', sans-serif" }}>Cargando artículo...</div>;
  if (error || !articulo) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--page-bg)", fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "40px 24px", textAlign: "center" }}>
        <p style={{ fontSize: "15px", color: "var(--text)", margin: 0, maxWidth: "380px", lineHeight: 1.6 }}>
          {error || "No encontramos este artículo."}
        </p>
        <button
          onClick={() => navigate("/comunidad?tab=articulos")}
          style={{ background: "var(--theme-primary)", color: "#fff", border: "none", borderRadius: "100px", padding: "11px 24px", fontWeight: 800, fontSize: "14px", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}
        >
          Volver a Artículos
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, var(--page-bg) 0%, var(--theme-bg-light) 100%)", fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column" }}>
      
      {/* ── TOP NAV COMPACTA ── */}
      <nav style={{ width: "100%", background: "var(--surface)", padding: "16px 40px", display: "flex", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
        <button 
          onClick={() => navigate("/comunidad?tab=articulos")} 
          style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "15px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <ArrowLeft size={18} /> Volver a Artículos
        </button>
      </nav>

      {/* ── CONTENIDO DEL ARTÍCULO ── */}
      <div className="articulo-detalle" style={{ flex: 1, padding: "32px 24px 56px", maxWidth: "720px", margin: "0 auto", width: "100%" }}>

        {/* Ícono + categoría + datos, en una sola fila compacta. Antes el
            ícono ocupaba un bloque de ~200px de alto que en móvil se comía
            media pantalla sin aportar información. */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px" }}>
          <div className="articulo-detalle-icono" style={{
            width: "56px", height: "56px", borderRadius: "16px", flexShrink: 0,
            background: "var(--theme-bg-light)", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: "28px",
          }}>
            {articulo.imagen_portada}
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: "11.5px", fontWeight: 800, color: "var(--theme-primary)", background: "var(--theme-bg-light)", padding: "4px 11px", borderRadius: "10px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <FileText size={13} /> {articulo.categoria}
            </span>
            <div style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: 600, marginTop: "5px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Eye size={13} /> {articulo.contador_lecturas} vistas</span>
            </div>
          </div>
        </div>

        {/* Título */}
        <h1 className="articulo-detalle-titulo" style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "30px", fontWeight: 700, color: "var(--text)", margin: "0 0 16px 0", lineHeight: "1.28" }}>
          {articulo.titulo}
        </h1>

        {/* Resumen y contenido van directo sobre el fondo, sin una tarjeta
            que agregue otro nivel de padding (antes: 40px del contenedor +
            32px de la tarjeta, dejando muy poco ancho real en móvil). */}
        <p className="articulo-detalle-resumen" style={{ margin: "0 0 20px 0", fontSize: "16.5px", color: "var(--text-muted)", lineHeight: "1.65", fontWeight: 700 }}>
          {articulo.resumen}
        </p>

        <div style={{ height: "1px", background: "var(--theme-bg-light)", marginBottom: "20px" }} />

        {/* El contenido llega como un bloque plano desde el panel de
            administración, así que se interpreta antes de mostrarlo: párrafos
            separados, subtítulos destacados y los rangos de edad como lista.
            Ver utils/formatoArticulo.ts */}
        <div className="articulo-detalle-texto" style={{ fontSize: "16.5px", color: "var(--text)", lineHeight: "1.8" }}>
          {formatearArticulo(articulo.contenido_completo).map((bloque, i) => {
            if (bloque.tipo === "subtitulo") {
              return (
                <h2
                  key={i}
                  style={{
                    fontFamily: "'Baloo 2', sans-serif", fontSize: "21px", fontWeight: 700,
                    color: "var(--text)", margin: "32px 0 12px", lineHeight: 1.3,
                  }}
                >
                  {bloque.texto}
                </h2>
              );
            }
            if (bloque.tipo === "item") {
              return (
                <div
                  key={i}
                  style={{
                    display: "flex", gap: "14px", alignItems: "baseline",
                    padding: "11px 0", borderBottom: "1px solid var(--border-soft)",
                  }}
                >
                  <span style={{
                    flexShrink: 0, minWidth: "104px",
                    fontSize: "13px", fontWeight: 800, color: "var(--theme-primary)",
                  }}>
                    {bloque.etiqueta}
                  </span>
                  <span style={{ minWidth: 0 }}>{bloque.texto}</span>
                </div>
              );
            }
            return (
              <p key={i} style={{ margin: "0 0 18px" }}>
                {bloque.texto}
              </p>
            );
          })}
        </div>

        <div style={{ marginTop: "32px", paddingTop: "20px", borderTop: "1px solid var(--theme-bg-light)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
            {articulo.calificacion_utilidad && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#F59E0B", fontWeight: 700, fontSize: "14px" }}>
                <Star size={17} fill="#F59E0B" /> {articulo.calificacion_utilidad}/5
              </div>
            )}
            <button
              onClick={handleLike}
              className="articulo-detalle-like"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                background: articulo.has_liked
                  ? "linear-gradient(135deg, var(--theme-primary), var(--theme-light))"
                  : "var(--surface-2)",
                color: articulo.has_liked ? "#fff" : "var(--text-muted)",
                border: "none", borderRadius: "100px", padding: "12px 26px",
                fontWeight: 800, fontSize: "14px", cursor: "pointer",
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              <ThumbsUp size={17} fill={articulo.has_liked ? "#fff" : "none"} />
              {articulo.likes || 0} me gusta
            </button>
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--text-muted)", textAlign: "center" }}>
            <strong>Fuente:</strong> {articulo.fuente_citada}
          </div>
        </div>

      </div>
    </div>
  );
}
