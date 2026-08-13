import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, ThumbsUp, Send } from "lucide-react";
import axios from "axios";

const API_URL = "https://babycare-backend-msyq.onrender.com/api/v1";

export default function ForoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [foro, setForo] = useState<any>(null);
  const [respuestas, setRespuestas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDetalle = async () => {
    try {
      const res = await axios.get(`${API_URL}/comunidad/foros/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForo(res.data.foro);
      setRespuestas(res.data.respuestas);
    } catch (error) {
      console.error("Error fetching foro detalle:", error);
      alert("No se pudo cargar el foro.");
      navigate("/comunidad");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchDetalle();
  }, [id, token, navigate]);

  const handleLike = async () => {
    try {
      await axios.post(`${API_URL}/comunidad/foros/${id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDetalle();
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleComentar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/comunidad/foros/${id}/respuestas`, {
        contenido: nuevoComentario
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNuevoComentario("");
      fetchDetalle();
    } catch (error) {
      console.error("Error commenting:", error);
      alert("Hubo un error al publicar el comentario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center", fontFamily: "'Nunito', sans-serif" }}>Cargando foro...</div>;
  if (!foro) return <div style={{ padding: "40px", textAlign: "center", fontFamily: "'Nunito', sans-serif" }}>Foro no encontrado.</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7FC", fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column" }}>
      
      {/* ── HEADER ── */}
      <div style={{ background: "var(--theme-darker)", color: "#fff", padding: "32px 40px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>
          <button 
            onClick={() => navigate("/comunidad")} 
            style={{ background: "none", border: "none", color: "var(--theme-light)", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginBottom: "24px", padding: 0 }}
          >
            <ArrowLeft size={16} /> Volver a Comunidad
          </button>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--theme-darker)", background: "var(--theme-light)", padding: "4px 12px", borderRadius: "12px" }}>
              {foro.categoria}
            </span>
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>Por {foro.autor_nombre} · {new Date(foro.fecha_creacion).toLocaleDateString('es-CL')}</span>
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: 900, margin: "0 0 16px 0", lineHeight: "1.2" }}>{foro.titulo}</h1>
          <p style={{ fontSize: "16px", lineHeight: "1.6", margin: "0 0 24px 0", color: "rgba(255,255,255,0.9)", whiteSpace: "pre-wrap" }}>
            {foro.contenido}
          </p>

          <div style={{ display: "flex", gap: "24px", color: "rgba(255,255,255,0.8)" }}>
            <div 
              style={{ display: "flex", alignItems: "center", gap: "6px", color: foro.has_liked ? "var(--theme-light)" : "rgba(255,255,255,0.7)", padding: "6px 0", cursor: "pointer" }}
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await axios.post(`${API_URL}/comunidad/foros/${id}/like`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  fetchDetalle();
                } catch (error) {
                  console.error("Error toggling like:", error);
                }
              }}
            >
              <ThumbsUp size={18} fill={foro.has_liked ? "var(--theme-light)" : "none"} /> 
              <span style={{ fontWeight: 600 }}>{foro.likes} Likes</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 0" }}>
              <MessageCircle size={18} /> <span style={{ fontWeight: 600 }}>{foro.respuestas} Respuestas</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RESPUESTAS ── */}
      <div style={{ flex: 1, padding: "40px", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
        
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--theme-darker)", marginBottom: "24px" }}>Comentarios</h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
          {respuestas.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#6B7280", background: "#fff", borderRadius: "16px", border: "1px dashed #D1D5DB" }}>
              Sé el primero en comentar.
            </div>
          ) : respuestas.map(res => (
            <div key={res.id} style={{ background: "#fff", padding: "24px", borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--theme-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px" }}>
                  {res.autor_nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--theme-darker)", fontSize: "15px" }}>{res.autor_nombre}</div>
                  <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{new Date(res.fecha_creacion).toLocaleString('es-CL')}</div>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: "15px", color: "#4B5563", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                {res.contenido}
              </p>
            </div>
          ))}
        </div>

        {/* ── AGREGAR COMENTARIO ── */}
        <div style={{ background: "#fff", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 800, color: "var(--theme-darker)" }}>Agregar un comentario</h3>
          <form onSubmit={handleComentar} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <textarea 
              required value={nuevoComentario} onChange={e => setNuevoComentario(e.target.value)}
              placeholder="Escribe tu respuesta aquí..." rows={4}
              style={{ width: "100%", padding: "16px", border: "1px solid #D1D5DB", borderRadius: "12px", fontSize: "15px", outline: "none", resize: "none", fontFamily: "inherit" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" disabled={isSubmitting} style={{ background: "var(--theme-primary)", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "12px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", opacity: isSubmitting ? 0.7 : 1 }}>
                <Send size={18} /> {isSubmitting ? "Enviando..." : "Enviar respuesta"}
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
