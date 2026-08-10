import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bell, LogOut, MessageCircle, FileText, ChevronRight, ThumbsUp, MessageSquare, Clock, X
} from "lucide-react";
import axios from "axios";

const API_URL = "https://babycare-backend-msyq.onrender.com/api/v1";

export default function Comunidad() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  
  const [activeTab, setActiveTab] = useState<"foros" | "articulos">("foros");
  const [forosData, setForosData] = useState<any[]>([]);
  const [articulosData, setArticulosData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevoContenido, setNuevoContenido] = useState("");
  const [nuevaCategoria, setNuevaCategoria] = useState("General");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [forosRes, articulosRes] = await Promise.all([
        axios.get(`${API_URL}/comunidad/foros`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/comunidad/articulos`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setForosData(forosRes.data);
      setArticulosData(articulosRes.data);
    } catch (error) {
      console.error("Error fetching comunidad data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchData();
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleLike = async (e: React.MouseEvent, foroId: string) => {
    e.stopPropagation(); // Evita que se dispare la navegación al detalle del post
    try {
      await axios.post(`${API_URL}/comunidad/foros/${foroId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Recargar datos para ver el nuevo contador de likes
      fetchData();
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleCrearPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !nuevoContenido.trim()) return;

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/comunidad/foros`, {
        titulo: nuevoTitulo,
        contenido: nuevoContenido,
        categoria: nuevaCategoria
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      setNuevoTitulo("");
      setNuevoContenido("");
      fetchData();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Hubo un error al crear el tema.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F8F7FC",
      fontFamily: "'Nunito', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* ── TOP NAV ── */}
      <nav style={{
        width: "100%", background: "var(--theme-darker)", color: "#fff", padding: "16px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky",
        top: 0, zIndex: 100, boxShadow: "0 4px 12px rgba(0,0,0,.15)"
      }}>
        <div style={{ fontSize: "24px", fontWeight: 800, cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
          Iniciativa<span style={{ color: "var(--theme-light)" }}>Baby</span>
        </div>
        
        <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "24px", fontWeight: 600, fontSize: "15px" }}>
            <span style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color="var(--theme-light)"} onMouseLeave={e => e.currentTarget.style.color="white"} onClick={() => navigate("/dashboard")}>Inicio</span>
            <span style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color="var(--theme-light)"} onMouseLeave={e => e.currentTarget.style.color="white"} onClick={() => navigate("/salud")}>Salud</span>
            <span style={{ cursor: "pointer", color: "var(--theme-light)" }}>Comunidad</span>
          </div>
          <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.2)" }}></div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => alert("No tienes nuevas notificaciones")}>
              <Bell size={22} />
            </div>
            <div 
              onClick={() => navigate("/mi-perfil")}
              style={{ 
                width: "36px", height: "36px", borderRadius: "50%", 
                background: "var(--theme-primary)", display: "flex", 
                alignItems: "center", justifyContent: "center", fontWeight: "bold",
                fontSize: "16px", cursor: "pointer", border: "2px solid rgba(255,255,255,0.2)"
              }}>
              {user?.nombre?.[0]?.toUpperCase() || "U"}
            </div>
            <button onClick={handleLogout} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", display: "flex", alignItems: "center" }} title="Cerrar sesión">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, padding: "40px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        
        <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: 800, color: "var(--theme-darker)", margin: "0 0 8px 0" }}>Comunidad</h1>
            <p style={{ fontSize: "16px", color: "#6B7280", margin: 0 }}>Comparte experiencias, resuelve dudas y aprende con otros padres y especialistas.</p>
          </div>
          {activeTab === "foros" && (
            <button style={{ 
              background: "var(--theme-primary)", color: "#fff", border: "none", 
              padding: "12px 24px", borderRadius: "12px", fontWeight: 800, 
              cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
              boxShadow: "0 4px 12px rgba(124,92,191,0.3)"
            }} onClick={() => setShowModal(true)}>
              <MessageCircle size={20} />
              Crear nuevo tema
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: "16px", marginBottom: "32px", borderBottom: "2px solid #E5E7EB", paddingBottom: "16px", overflowX: "auto" }}>
          <button 
            onClick={() => setActiveTab("foros")}
            style={{ 
              background: activeTab === "foros" ? "var(--theme-primary)" : "transparent",
              color: activeTab === "foros" ? "#fff" : "#6B7280",
              border: "none", padding: "12px 24px", borderRadius: "12px", 
              fontWeight: 800, cursor: "pointer", fontSize: "15px",
              display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s"
            }}>
            <MessageSquare size={18} /> Foros de debate
          </button>
          <button 
            onClick={() => setActiveTab("articulos")}
            style={{ 
              background: activeTab === "articulos" ? "var(--theme-primary)" : "transparent",
              color: activeTab === "articulos" ? "#fff" : "#6B7280",
              border: "none", padding: "12px 24px", borderRadius: "12px", 
              fontWeight: 800, cursor: "pointer", fontSize: "15px",
              display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s"
            }}>
            <FileText size={18} /> Artículos educativos
          </button>
        </div>

        {/* FOROS */}
        {activeTab === "foros" && (
          <div style={{ display: "grid", gap: "16px" }}>
            {loading ? <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>Cargando foros...</div> : forosData.map(foro => (
              <div key={foro.id} onClick={() => navigate(`/comunidad/foro/${foro.id}`)} style={{ 
                background: "#fff", padding: "24px", borderRadius: "16px", 
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", 
                alignItems: "center", cursor: "pointer", transition: "transform 0.2s",
                borderLeft: "4px solid var(--theme-light)", flexWrap: "wrap", gap: "16px"
              }} onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}>
                <div style={{ flex: 1, minWidth: "300px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--theme-primary)", background: "var(--theme-bg-light)", padding: "4px 12px", borderRadius: "12px" }}>
                      {foro.categoria}
                    </span>
                    <span style={{ fontSize: "13px", color: "#9CA3AF" }}>Por {foro.autor_nombre} · {foro.tiempo_publicacion}</span>
                  </div>
                  <h3 style={{ margin: "0", fontSize: "18px", fontWeight: 800, color: "var(--theme-darker)" }}>{foro.titulo}</h3>
                </div>
                <div style={{ display: "flex", gap: "24px", color: "#6B7280" }}>
                  <div 
                    onClick={(e) => handleLike(e, foro.id)} 
                    style={{ 
                      display: "flex", alignItems: "center", gap: "6px", cursor: "pointer",
                      color: foro.has_liked ? "var(--theme-primary)" : "#6B7280",
                      background: foro.has_liked ? "var(--theme-bg-light)" : "transparent",
                      padding: "4px 8px", borderRadius: "8px", transition: "0.2s"
                    }}
                  >
                    <ThumbsUp size={18} fill={foro.has_liked ? "var(--theme-primary)" : "none"} /> 
                    <span style={{ fontWeight: 600 }}>{foro.likes}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <MessageCircle size={18} /> <span style={{ fontWeight: 600 }}>{foro.respuestas}</span>
                  </div>
                  <ChevronRight size={24} style={{ color: "#D1D5DB" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ARTICULOS */}
        {activeTab === "articulos" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
            {loading ? <div style={{ padding: "40px", color: "#6B7280", gridColumn: "1/-1", textAlign: "center" }}>Cargando artículos...</div> : articulosData.map(art => (
              <div key={art.id} onClick={() => navigate(`/comunidad/articulo/${art.id}`)} style={{ 
                background: "#fff", borderRadius: "20px", overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)", cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                display: "flex", flexDirection: "column"
              }} onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 12px 24px rgba(0,0,0,0.1)"; }} onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.05)"; }}>
                <div style={{ height: "160px", background: "var(--theme-bg-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "64px" }}>
                  {art.imagen_portada}
                </div>
                <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--theme-primary)", background: "var(--theme-bg-light)", padding: "4px 12px", borderRadius: "12px" }}>
                      {art.categoria}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#6B7280", fontWeight: 600 }}>
                      <Clock size={14} /> 5 min
                    </span>
                  </div>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: 800, color: "var(--theme-darker)" }}>{art.titulo}</h3>
                  <p style={{ margin: "0", fontSize: "14px", color: "#6B7280", lineHeight: "1.5", flex: 1 }}>{art.resumen}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* MODAL CREAR POST */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", 
          justifyContent: "center", zIndex: 1000, padding: "20px"
        }}>
          <div style={{ background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "600px", padding: "32px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "var(--theme-darker)" }}>Crear nuevo tema</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCrearPost}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#4B5563", marginBottom: "8px" }}>Título</label>
                <input 
                  type="text" required value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)}
                  placeholder="¿Cuál es tu duda o experiencia?"
                  style={{ width: "100%", padding: "12px 16px", border: "1px solid #D1D5DB", borderRadius: "12px", fontSize: "15px", outline: "none" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#4B5563", marginBottom: "8px" }}>Categoría</label>
                <select 
                  value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)}
                  style={{ width: "100%", padding: "12px 16px", border: "1px solid #D1D5DB", borderRadius: "12px", fontSize: "15px", outline: "none", background: "#fff" }}
                >
                  <option value="Desarrollo">Desarrollo</option>
                  <option value="Salud">Salud</option>
                  <option value="Nutrición">Nutrición</option>
                  <option value="Sueño">Sueño</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#4B5563", marginBottom: "8px" }}>Contenido</label>
                <textarea 
                  required value={nuevoContenido} onChange={e => setNuevoContenido(e.target.value)}
                  placeholder="Escribe los detalles aquí..." rows={5}
                  style={{ width: "100%", padding: "12px 16px", border: "1px solid #D1D5DB", borderRadius: "12px", fontSize: "15px", outline: "none", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#6B7280", fontWeight: 700, padding: "12px 24px", cursor: "pointer", borderRadius: "12px" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} style={{ background: "var(--theme-primary)", color: "#fff", border: "none", fontWeight: 800, padding: "12px 32px", cursor: "pointer", borderRadius: "12px", opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? "Publicando..." : "Publicar Tema"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
