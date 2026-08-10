import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, FileText, Eye, Star } from "lucide-react";
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

  if (loading) return <div style={{ padding: "40px", textAlign: "center", fontFamily: "'Nunito', sans-serif" }}>Cargando artículo...</div>;
  if (!articulo) return <div style={{ padding: "40px", textAlign: "center", fontFamily: "'Nunito', sans-serif" }}>Artículo no encontrado.</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7FC", fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column" }}>
      
      {/* ── TOP NAV COMPACTA ── */}
      <nav style={{ width: "100%", background: "#fff", padding: "16px 40px", display: "flex", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
        <button 
          onClick={() => navigate("/comunidad")} 
          style={{ background: "none", border: "none", color: "#6B7280", fontSize: "15px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <ArrowLeft size={18} /> Volver a Artículos
        </button>
      </nav>

      {/* ── CONTENIDO DEL ARTÍCULO ── */}
      <div style={{ flex: 1, padding: "40px", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
        
        {/* Cabecera visual */}
        <div style={{ background: "var(--theme-bg-light)", borderRadius: "24px", padding: "60px 40px", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "32px", fontSize: "80px", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}>
          {articulo.imagen_portada}
        </div>

        {/* Metadatos */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--theme-primary)", background: "var(--theme-bg-light)", padding: "6px 16px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
            <FileText size={16} /> {articulo.categoria}
          </span>
          <div style={{ display: "flex", gap: "16px", color: "#6B7280", fontWeight: 600, fontSize: "14px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Clock size={16} /> Lectura recomendada ({articulo.rango_edad_meses})</span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Eye size={16} /> {articulo.contador_lecturas} vistas</span>
          </div>
        </div>

        {/* Título */}
        <h1 style={{ fontSize: "36px", fontWeight: 900, color: "var(--theme-darker)", margin: "0 0 24px 0", lineHeight: "1.2" }}>
          {articulo.titulo}
        </h1>

        <div style={{ background: "#fff", padding: "32px", borderRadius: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
          <p style={{ margin: "0 0 32px 0", fontSize: "18px", color: "#4B5563", lineHeight: "1.6", fontWeight: 600 }}>
            {articulo.resumen}
          </p>

          <div style={{ fontSize: "16px", color: "#374151", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
            {articulo.contenido_completo}
          </div>

          <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "2px dashed #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "14px", color: "#9CA3AF" }}>
              <strong>Fuente:</strong> {articulo.fuente_citada}
            </div>
            {articulo.calificacion_utilidad && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#F59E0B", fontWeight: 700 }}>
                <Star size={18} fill="#F59E0B" /> {articulo.calificacion_utilidad}/5
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
