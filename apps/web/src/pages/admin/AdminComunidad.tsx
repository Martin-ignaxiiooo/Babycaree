import React, { useEffect, useState } from "react";
import { MessageCircle, Trash2, Search, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAdminAuth } from "../../hooks/useAdminAuth";

export default function AdminComunidad() {
  const { canManageComunidad } = useAdminAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ total_foros: 0, total_comentarios: 0 });
  const [expandedForoId, setExpandedForoId] = useState<string | null>(null);
  const [comentarios, setComentarios] = useState<{ [key: string]: any[] }>({});
  const [loadingComentarios, setLoadingComentarios] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [nuevoComentario, setNuevoComentario] = useState<{ [foroId: string]: string }>({});

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) return navigate("/admin/login");
      const res = await axios.get(
        "https://babycare-backend-msyq.onrender.com/api/v1/admin/comunidad/foros",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setData(res.data);

      const statsRes = await axios.get(
        "https://babycare-backend-msyq.onrender.com/api/v1/admin/comunidad/stats",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setStats(statsRes.data);
    } catch (e: any) {
      if (e.response?.status === 401 || e.response?.status === 403)
        navigate("/admin/login");
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const toggleForo = async (foroId: string) => {
    if (expandedForoId === foroId) {
      setExpandedForoId(null);
      return;
    }
    setExpandedForoId(foroId);
    
    if (!comentarios[foroId]) {
      setLoadingComentarios(foroId);
      try {
        const token = localStorage.getItem("admin_token");
        const res = await axios.get(
          `https://babycare-backend-msyq.onrender.com/api/v1/admin/comunidad/foros/${foroId}/comentarios`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setComentarios(prev => ({ ...prev, [foroId]: res.data }));
      } catch (e) {
        alert("Error al cargar comentarios");
      } finally {
        setLoadingComentarios(null);
      }
    }
  };

  const handleDeleteComentario = async (comentarioId: string, foroId: string) => {
    if (!window.confirm("¿Estás seguro de eliminar permanentemente este comentario?")) return;
    try {
      const token = localStorage.getItem("admin_token");
      await axios.delete(
        `https://babycare-backend-msyq.onrender.com/api/v1/admin/comunidad/comentarios/${comentarioId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Remove from state
      setComentarios(prev => ({
        ...prev,
        [foroId]: prev[foroId].filter(c => c.id !== comentarioId)
      }));
      // Actualizar contador
      fetchData();
    } catch (e) {
      alert("Error al eliminar el comentario");
    }
  };

  const handlePostComentario = async (foroId: string) => {
    const texto = nuevoComentario[foroId];
    if (!texto || texto.trim() === "") return;
    try {
      const token = localStorage.getItem("admin_token");
      const res = await axios.post(
        `https://babycare-backend-msyq.onrender.com/api/v1/admin/comunidad/foros/${foroId}/comentarios`,
        { contenido: texto },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComentarios(prev => ({
        ...prev,
        [foroId]: [...(prev[foroId] || []), res.data]
      }));
      setNuevoComentario(prev => ({ ...prev, [foroId]: "" }));
      fetchData();
    } catch (e) {
      alert("Error al publicar el comentario");
    }
  };

  const filteredData = data.filter(item => 
    item.titulo.toLowerCase().includes(search.toLowerCase()) || 
    item.autor_nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-content-area">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Foros y Comentarios</h1>
        <div className="admin-breadcrumbs">
          Panel de administración / Comunidad / Moderación
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "32px", overflowX: "auto" }}>
        <div style={{ flex: "1", background: "var(--surface)", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minWidth: "200px" }}>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1F2937", marginBottom: "8px" }}>{stats.total_foros}</div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>Foros Activos</div>
          <div style={{ fontSize: "11px", color: "#10B981", marginTop: "8px" }}>Visibles en la app</div>
        </div>
        <div style={{ flex: "1", background: "var(--surface)", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minWidth: "200px" }}>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1F2937", marginBottom: "8px" }}>{stats.total_comentarios}</div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>Comentarios Totales</div>
          <div style={{ fontSize: "11px", color: "#10B981", marginTop: "8px" }}>Interacciones de usuarios</div>
        </div>
        <div style={{ flex: "1", background: "var(--surface)", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minWidth: "200px" }}>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1F2937", marginBottom: "8px" }}>{data.reduce((acc, curr) => acc + (curr.likes || 0), 0)}</div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>Likes Totales</div>
          <div style={{ fontSize: "11px", color: "#10B981", marginTop: "8px" }}>Reacciones positivas</div>
        </div>
      </div>

      <div className="admin-table-toolbar">
        <div className="admin-filters">
          <div style={{ position: "relative" }}>
            <Search size={16} color="#9CA3AF" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text" 
              placeholder="Buscar foros..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "8px 16px 8px 36px", borderRadius: "8px", border: "1px solid #E5E7EB", outline: "none", fontSize: "13px", width: "250px", color: "#4B5563" }}
            />
          </div>
        </div>
      </div>

      <div className="admin-data-table-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>TÍTULO DEL FORO</th>
              <th>AUTOR</th>
              <th>FECHA</th>
              <th>LIKES</th>
              <th>COMENTARIOS</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <React.Fragment key={item.id}>
                <tr style={{ background: expandedForoId === item.id ? "#F3F4F6" : "transparent" }}>
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-avatar admin-avatar-green">
                        {item.titulo ? item.titulo.substring(0, 2).toUpperCase() : "FO"}
                      </div>
                      <div className="admin-user-info">
                        <span className="admin-user-name">{item.titulo}</span>
                        <span className="admin-user-id">
                          ID: {item.id.substring(0, 8)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500, color: "#374151" }}>{item.autor_nombre}</span>
                  </td>
                  <td>{new Date(item.fecha_creacion).toLocaleDateString('es-CL')}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: "#3B82F6" }}>{item.likes}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: "#8B5CF6" }}>{item.respuestas}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleForo(item.id)}
                      style={{ 
                        background: "var(--surface)", 
                        border: "1px solid #E5E7EB", 
                        padding: "6px 12px", 
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "#4B5563",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                      }}
                    >
                      {expandedForoId === item.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />} 
                      Moderación
                    </button>
                  </td>
                </tr>
                {expandedForoId === item.id && (
                  <tr>
                    <td colSpan={6} style={{ padding: 0, borderBottom: "none" }}>
                      <div style={{ background: "var(--surface-2)", padding: "24px", borderBottom: "1px solid #E5E7EB" }}>
                        <h4 style={{ margin: "0 0 16px 0", color: "#374151", display: "flex", alignItems: "center", gap: "8px" }}>
                          <MessageCircle size={18} color="#8B5CF6"/> Comentarios de la publicación
                        </h4>
                        {loadingComentarios === item.id ? (
                          <div style={{ color: "#6B7280", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "16px", height: "16px", border: "2px solid #E5E7EB", borderTopColor: "#8B5CF6", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                            Cargando comentarios...
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {comentarios[item.id]?.length === 0 ? (
                              <div style={{ background: "var(--surface)", padding: "16px", borderRadius: "8px", border: "1px dashed #D1D5DB", color: "#6B7280", fontSize: "14px", fontStyle: "italic", textAlign: "center" }}>
                                No hay comentarios en este foro.
                              </div>
                            ) : (
                              comentarios[item.id]?.map((com: any) => (
                                <div key={com.id} style={{ background: com.es_admin ? "#EFF6FF" : "#fff", padding: "16px", borderRadius: "8px", border: com.es_admin ? "1px solid #93C5FD" : "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "flex-start", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: "14px", color: com.es_admin ? "#1E3A8A" : "#1F2937", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: com.es_admin ? "#2563EB" : "#E0E7FF", color: com.es_admin ? "white" : "#4338CA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
                                        {com.autor_nombre ? com.autor_nombre.substring(0, 2).toUpperCase() : "U"}
                                      </div>
                                      {com.autor_nombre} 
                                      {com.es_admin && <span style={{ background: "#DBEAFE", color: "#1D4ED8", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold" }}>ADMIN</span>}
                                      <span style={{ fontWeight: 400, color: "#9CA3AF", fontSize: "12px" }}>• {new Date(com.fecha_creacion).toLocaleString('es-CL')}</span>
                                    </div>
                                    <div style={{ fontSize: "14px", color: "#4B5563", lineHeight: "1.5", marginLeft: "32px" }}>{com.contenido}</div>
                                  </div>
                                  <div style={{ display: "flex", gap: "8px" }}>
                                    {canManageComunidad && (
                                      <button
                                        onClick={() => setNuevoComentario(prev => ({ ...prev, [item.id]: `@${com.autor_nombre}: ` }))}
                                        style={{ background: "#F3F4F6", border: "none", color: "#4B5563", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s", fontSize: "12px", fontWeight: 500 }}
                                        onMouseOver={(e) => (e.currentTarget.style.background = "#E5E7EB")}
                                        onMouseOut={(e) => (e.currentTarget.style.background = "#F3F4F6")}
                                        title="Responder"
                                      >
                                        Responder
                                      </button>
                                    )}
                                    {canManageComunidad && (
                                      <button
                                        onClick={() => handleDeleteComentario(com.id, item.id)}
                                        style={{ background: "#FEE2E2", border: "none", color: "#EF4444", padding: "8px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
                                        onMouseOver={(e) => (e.currentTarget.style.background = "#FECACA")}
                                        onMouseOut={(e) => (e.currentTarget.style.background = "#FEE2E2")}
                                        title="Eliminar Comentario"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                            {canManageComunidad && (
                              <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                                <input 
                                  type="text" 
                                  placeholder="Escribe un comentario o respuesta como administrador..." 
                                  value={nuevoComentario[item.id] || ""}
                                  onChange={(e) => setNuevoComentario(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #D1D5DB", outline: "none", fontSize: "14px" }}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handlePostComentario(item.id); }}
                                />
                                <button 
                                  onClick={() => handlePostComentario(item.id)}
                                  style={{ background: "#4F46E5", color: "white", border: "none", padding: "0 20px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}
                                >
                                  Enviar
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "60px 40px", color: "#6B7280" }}>
                  No se encontraron foros que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div className="admin-table-footer">
          <span className="admin-table-showing">
            Mostrando {filteredData.length} foros
          </span>
          <div className="admin-table-pagination">
            <button className="admin-page-btn active">1</button>
          </div>
        </div>
      </div>
    </div>
  );
}
