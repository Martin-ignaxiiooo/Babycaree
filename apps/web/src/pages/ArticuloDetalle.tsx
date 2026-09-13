import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, FileText, Eye, Star, ThumbsUp } from "lucide-react";
import axios from "axios";

const API_URL = "https://babycare-backend-msyq.onrender.com/api/v1";

export default function ArticuloDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [articulo, setArticulo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        alert("No se pudo cargar el artículo.");
        navigate("/comunidad");
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
  if (!articulo) return <div style={{ padding: "40px", textAlign: "center", fontFamily: "'Nunito', sans-serif" }}>Artículo no encontrado.</div>;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, var(--page-bg) 0%, var(--theme-bg-light) 100%)", fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column" }}>
      
      {/* ── TOP NAV COMPACTA ── */}
      <nav style={{ width: "100%", background: "var(--surface)", padding: "16px 40px", display: "flex", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
        <button 
          onClick={() => navigate("/comunidad?tab=articulos")} 
          style={{ background: "none", border: "none", color: "#6B7280", fontSize: "15px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <ArrowLeft size={18} /> Volver a Artículos
        </button>
      </nav>

      {/* ── CONTENIDO DEL ARTÍCULO ── */}
      <div className="articulo-detalle" style={{ flex: 1, padding: "32px 24px 48px", maxWidth: "800px", margin: "0 auto", width: "100%" }}>

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
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={13} /> {articulo.rango_edad_meses}</span>
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
        <p className="articulo-detalle-resumen" style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#4B4560", lineHeight: "1.6", fontWeight: 700 }}>
          {articulo.resumen}
        </p>

        <div style={{ height: "1px", background: "var(--theme-bg-light)", marginBottom: "20px" }} />

        <div className="articulo-detalle-texto" style={{ fontSize: "16px", color: "#374151", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
          {articulo.contenido_completo}
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
                color: articulo.has_liked ? "#fff" : "#4B5563",
                border: "none", borderRadius: "100px", padding: "12px 26px",
                fontWeight: 800, fontSize: "14px", cursor: "pointer",
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              <ThumbsUp size={17} fill={articulo.has_liked ? "#fff" : "none"} />
              {articulo.likes || 0} me gusta
            </button>
          </div>
          <div style={{ fontSize: "11.5px", color: "#9CA3AF", textAlign: "center" }}>
            <strong>Fuente:</strong> {articulo.fuente_citada}
          </div>
        </div>

      </div>
    </div>
  );
}
