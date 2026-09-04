import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  MessageCircle, FileText, ChevronRight, ThumbsUp, MessageSquare, Clock, X
} from "lucide-react";
import axios from "axios";
import TopNav from "../components/TopNav";

const API_URL = "https://babycare-backend-msyq.onrender.com/api/v1";

// Corta el resumen a un largo fijo de caracteres para que todas las
// tarjetas midan parecido. El artículo completo se ve al hacer clic en la
// tarjeta (ya navega a /comunidad/articulo/:id), así que acá solo importa
// no cortar a mitad de palabra.
function truncarTexto(texto: string, maxCaracteres: number): string {
  if (!texto || texto.length <= maxCaracteres) return texto || "";
  const cortado = texto.slice(0, maxCaracteres);
  const ultimoEspacio = cortado.lastIndexOf(" ");
  return `${cortado.slice(0, ultimoEspacio > 0 ? ultimoEspacio : maxCaracteres)}…`;
}

export default function Comunidad() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const tabInicial = new URLSearchParams(location.search).get("tab") === "articulos" ? "articulos" : "foros";
  const [activeTab, setActiveTab] = useState<"foros" | "articulos">(tabInicial);
  const [forosData, setForosData] = useState<any[]>([]);

  // Se calculan sobre los foros ya cargados: no hace falta otra llamada.
  const categorias = Object.entries(
    forosData.reduce((acc: Record<string, number>, f: any) => {
      const c = f.categoria || "Sin categoría";
      acc[c] = (acc[c] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([nombre, total]) => ({ nombre, total: total as number }))
    .sort((a, b) => b.total - a.total);

  const masComentados = [...forosData]
    .filter((f: any) => (f.respuestas ?? 0) > 0)
    .sort((a: any, b: any) => (b.respuestas ?? 0) - (a.respuestas ?? 0))
    .slice(0, 4);
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

  const handleLikeArticulo = async (e: React.MouseEvent, articuloId: string) => {
    e.stopPropagation(); // Evita que se dispare la navegación al detalle del artículo
    try {
      await axios.post(`${API_URL}/comunidad/articulos/${articuloId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error("Error toggling like de artículo:", error);
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
      background: "linear-gradient(165deg, #FAF9FD 0%, #F6F2FF 100%)",
      fontFamily: "'Nunito', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* ── TOP NAV ── */}
      <TopNav user={user} activePath="/comunidad" />

      {/* ── MAIN CONTENT ── */}
      {/* Cabecera morada, igual que Inicio y Perfil: las tres pantallas
          del rediseño comparten el mismo encabezado. */}
      <div style={{ background: "linear-gradient(135deg, #8B5FD6 0%, #A47BE8 100%)", paddingBottom: "70px" }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "26px 32px 0" }}>
          <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "31px", fontWeight: 700, color: "#fff", margin: 0 }}>
            Comunidad
          </h1>
          <p style={{ fontSize: "14.5px", color: "rgba(255,255,255,0.8)", margin: "6px 0 0", fontWeight: 600 }}>
            Conecta, comparte y aprende con otras familias.
          </p>
        </div>
      </div>

      <div className="page-container" style={{ marginTop: "-50px" }}>
        
        <div style={{ marginBottom: "24px", display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: "16px" }}>
          {activeTab === "foros" && (
            <button style={{ 
              background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))", color: "#fff", border: "none", 
              padding: "12px 24px", borderRadius: "14px", fontWeight: 800, 
              cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
              boxShadow: "0 8px 20px var(--theme-shadow-light)"
            }} onClick={() => setShowModal(true)}>
              <MessageCircle size={20} />
              Crear nuevo tema
            </button>
          )}
        </div>

        <div className="responsive-overflow" style={{ display: "flex", gap: "10px", marginBottom: "32px", borderBottom: "1px solid var(--theme-bg-light)", paddingBottom: "16px", whiteSpace: "nowrap" }}>
          <button 
            onClick={() => setActiveTab("foros")}
            style={{ 
              background: activeTab === "foros" ? "linear-gradient(135deg, var(--theme-primary), var(--theme-light))" : "transparent",
              color: activeTab === "foros" ? "#fff" : "#8A849C",
              border: "none", padding: "12px 22px", borderRadius: "100px", 
              fontWeight: 800, cursor: "pointer", fontSize: "14.5px",
              display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s",
              boxShadow: activeTab === "foros" ? "0 6px 16px var(--theme-shadow-light)" : "none",
            }}>
            <MessageSquare size={18} /> Temas a compartir
          </button>
          <button 
            onClick={() => setActiveTab("articulos")}
            style={{ 
              background: activeTab === "articulos" ? "linear-gradient(135deg, var(--theme-primary), var(--theme-light))" : "transparent",
              color: activeTab === "articulos" ? "#fff" : "#8A849C",
              border: "none", padding: "12px 22px", borderRadius: "100px", 
              fontWeight: 800, cursor: "pointer", fontSize: "14.5px",
              display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s",
              boxShadow: activeTab === "articulos" ? "0 6px 16px var(--theme-shadow-light)" : "none",
            }}>
            <FileText size={18} /> Artículos educativos
          </button>
        </div>

        {/* FOROS: contenido a la izquierda, barra lateral a la derecha,
            como en el diseño. */}
        {activeTab === "foros" && (
        <div className="comunidad-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.9fr) minmax(260px, 1fr)", gap: "22px", alignItems: "start" }}>
          <div style={{ display: "grid", gap: "16px" }}>

            {/* Compositor: abre el mismo modal que el botón de arriba, pero
                acá arriba del feed es donde uno espera encontrarlo. */}
            <div
              onClick={() => setShowModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: "14px",
                background: "var(--surface)", borderRadius: "20px", padding: "16px 18px",
                boxShadow: "0 6px 20px rgba(124,92,191,0.08)", cursor: "pointer",
              }}
            >
              <div style={{
                width: "42px", height: "42px", borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 900, fontSize: "17px", fontFamily: "'Baloo 2', sans-serif",
              }}>
                {(user?.nombre ?? "?").charAt(0).toUpperCase()}
              </div>
              <div style={{
                flex: 1, background: "var(--surface-2)", border: "1px solid var(--border)",
                borderRadius: "100px", padding: "12px 18px",
                fontSize: "14px", color: "var(--text-muted)",
              }}>
                ¿Qué quieres compartir hoy?
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                style={{
                  background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
                  color: "#fff", border: "none", borderRadius: "100px", padding: "11px 22px",
                  fontWeight: 800, fontSize: "13.5px", cursor: "pointer", whiteSpace: "nowrap",
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                Publicar
              </button>
            </div>

            {loading ? <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Cargando foros...</div> : forosData.map(foro => (
              <div key={foro.id} onClick={() => navigate(`/comunidad/foro/${foro.id}`)} style={{ 
                background: "var(--surface)", padding: "24px", borderRadius: "20px", 
                boxShadow: "0 6px 20px rgba(124,92,191,0.08)", display: "flex", 
                alignItems: "center", cursor: "pointer", transition: "transform 0.2s",
                borderLeft: "4px solid var(--accent-coral)", flexWrap: "wrap", gap: "16px"
              }} onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}>
                <div style={{ flex: 1, minWidth: "300px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--theme-primary)", background: "var(--theme-bg-light)", padding: "4px 12px", borderRadius: "12px" }}>
                      {foro.categoria}
                    </span>
                    <span style={{ fontSize: "13px", color: "#9CA3AF" }}>Por {foro.autor_nombre} · {foro.tiempo_publicacion}</span>
                  </div>
                  <h3 style={{ margin: "0", fontFamily: "'Baloo 2', sans-serif", fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>{foro.titulo}</h3>
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

          {/* Barra lateral. Muestra las categorías reales que existen en los
              temas publicados, con su conteo. El mockup traía 'Grupos
              populares' y 'Tendencias'. Se usan esos nombres, pero los
              datos salen de los foros reales: los grupos son las categorías
              que existen y las tendencias los temas con más actividad. Los
              números se mueven solos a medida que hay más conversación. */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ background: "var(--surface)", borderRadius: "20px", padding: "22px", boxShadow: "0 6px 20px rgba(124,92,191,0.08)" }}>
              <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "17px", fontWeight: 700, color: "var(--text)", margin: "0 0 14px" }}>
                Grupos Populares
              </h3>

              {categorias.length === 0 ? (
                <p style={{ fontSize: "13.5px", color: "var(--text-muted)", margin: 0 }}>
                  Todavía no hay temas publicados.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                  {categorias.map(({ nombre, total }) => (
                    <div key={nombre} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", background: "var(--surface-2)", borderRadius: "12px", padding: "11px 14px" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text)" }}>{nombre}</span>
                      <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--theme-primary)", background: "var(--theme-bg-light)", borderRadius: "100px", padding: "3px 10px" }}>
                        {total}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: "var(--surface)", borderRadius: "20px", padding: "22px", boxShadow: "0 6px 20px rgba(124,92,191,0.08)" }}>
              <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "17px", fontWeight: 700, color: "var(--text)", margin: "0 0 8px" }}>
                Tendencias
              </h3>
              {masComentados.length === 0 ? (
                <p style={{ fontSize: "13.5px", color: "var(--text-muted)", margin: 0 }}>
                  Aún no hay conversación.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                  {masComentados.map((f: any) => (
                    <button
                      key={f.id}
                      onClick={() => navigate(`/comunidad/foro/${f.id}`)}
                      style={{ background: "none", border: "none", textAlign: "left", cursor: "pointer", padding: 0, fontFamily: "'Nunito', sans-serif" }}
                    >
                      <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text)", lineHeight: 1.4 }}>{f.titulo}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {f.respuestas} {f.respuestas === 1 ? "respuesta" : "respuestas"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* ARTICULOS */}
        {activeTab === "articulos" && (
          <div className="responsive-grid">
            {loading ? <div style={{ padding: "40px", color: "#6B7280", gridColumn: "1/-1", textAlign: "center" }}>Cargando artículos...</div> : articulosData.map(art => (
              <div key={art.id} onClick={() => navigate(`/comunidad/articulo/${art.id}`)} style={{ 
                background: "var(--surface)", borderRadius: "22px", overflow: "hidden",
                boxShadow: "0 6px 20px rgba(124,92,191,0.08)", cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                display: "flex", flexDirection: "column"
              }} onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 16px 32px rgba(124,92,191,0.16)"; }} onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(124,92,191,0.08)"; }}>
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
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: 800, color: "var(--text)" }}>{art.titulo}</h3>
                  <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#6B7280", lineHeight: "1.5", flex: 1 }}>
                    {truncarTexto(art.resumen, 120)}
                  </p>
                  {art.resumen && art.resumen.length > 120 && (
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--theme-primary)", marginBottom: "16px" }}>
                      Leer artículo completo →
                    </span>
                  )}
                  <button
                    onClick={(e) => handleLikeArticulo(e, art.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px", alignSelf: "flex-start",
                      background: "none", border: "none", cursor: "pointer", padding: "4px 0",
                      marginTop: "8px",
                      color: art.has_liked ? "var(--theme-primary)" : "#6B7280",
                    }}
                  >
                    <ThumbsUp size={16} fill={art.has_liked ? "var(--theme-primary)" : "none"} />
                    <span style={{ fontWeight: 700, fontSize: "13px" }}>{art.likes || 0}</span>
                  </button>
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
          <div style={{ background: "var(--surface)", borderRadius: "24px", width: "100%", maxWidth: "600px", padding: "32px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "var(--text)" }}>Crear nuevo tema</h2>
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
                  style={{ width: "100%", padding: "12px 16px", border: "1px solid #D1D5DB", borderRadius: "12px", fontSize: "15px", outline: "none", background: "var(--surface)" }}
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

    <style>{`
        @media (max-width: 900px) {
          .comunidad-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
