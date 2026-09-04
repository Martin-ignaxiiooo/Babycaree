import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminModal from "../../components/admin/AdminModal";
import { useAdminAuth } from "../../hooks/useAdminAuth";

export default function AdminArticulos() {
  const { canManageArticulos } = useAdminAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ publicados: 0, borradores: 0, lecturasTotales: 0, utilidadPromedio: "0.0" });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [formData, setFormData] = useState({
    titulo: "",
    categoria: "",
    rango_edad_meses: "",
    resumen: "",
    contenido_completo: "",
    fuente_citada: "",
    estado: "borrador",
  });

  // El backend guarda rango_edad_meses como texto libre ("0-6 meses"),
  // formato que ya esperan el controlador de inicio y la app mobile para
  // recomendar artículos según la edad del bebé. Acá lo editamos como dos
  // números (desde/hasta) y lo combinamos a ese mismo formato al guardar.
  const [rangoDesde, setRangoDesde] = useState(0);
  const [rangoHasta, setRangoHasta] = useState(0);

  const parseRango = (valor: any): { desde: number; hasta: number } => {
    const match = String(valor || "").match(/(\d+)\s*[-–a]\s*(\d+)/);
    if (match) return { desde: parseInt(match[1], 10), hasta: parseInt(match[2], 10) };
    const exacto = String(valor || "").match(/(\d+)/);
    const n = exacto ? parseInt(exacto[1], 10) : 0;
    return { desde: n, hasta: n };
  };

  // ── Filtros ──
  const [filterCategory, setFilterCategory] = useState("Toda categoría");
  const [filterAge, setFilterAge] = useState("Todo rango de edad");
  const [filterStatus, setFilterStatus] = useState("Todo estado");

  const categoriasUnicas = Array.from(new Set(data.map((a: any) => a.categoria).filter(Boolean)));
  const rangosEdadUnicos = Array.from(new Set(data.map((a: any) => a.rango_edad_meses).filter((val: any) => val !== undefined && val !== null)));

  const filteredArticulos = data.filter((a) => {
    let matchCategory = true;
    let matchAge = true;
    let matchStatus = true;

    if (filterCategory !== "Toda categoría") matchCategory = a.categoria === filterCategory;
    if (filterAge !== "Todo rango de edad") matchAge = a.rango_edad_meses === filterAge;
    if (filterStatus !== "Todo estado") matchStatus = a.estado === filterStatus.toLowerCase();

    return matchCategory && matchAge && matchStatus;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenNew = () => {
    setFormData({
      titulo: "",
      categoria: "",
      rango_edad_meses: "0-6 meses",
      resumen: "",
      contenido_completo: "",
      fuente_citada: "",
      estado: "borrador",
    });
    setRangoDesde(0);
    setRangoHasta(6);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    const { desde, hasta } = parseRango(item.rango_edad_meses);
    setFormData({
      titulo: item.titulo || "",
      categoria: item.categoria || "",
      rango_edad_meses: item.rango_edad_meses || "",
      resumen: item.resumen || "",
      contenido_completo: item.contenido_completo || "",
      fuente_citada: item.fuente_citada || "",
      estado: item.estado || "borrador",
    });
    setRangoDesde(desde);
    setRangoHasta(hasta);
    setEditId(item.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este artículo?"))
      return;
    try {
      const token = localStorage.getItem("admin_token");
      await axios.delete(`https://babycare-backend-msyq.onrender.com/api/v1/admin/articulos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch  {
      alert("Error al eliminar artículo");
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) return navigate("/admin/login");
      const res = await axios.get(
        "https://babycare-backend-msyq.onrender.com/api/v1/admin/articulos",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setData(res.data);

      const statsRes = await axios.get(
        "https://babycare-backend-msyq.onrender.com/api/v1/admin/articulos/stats",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      if (isEditing) {
        await axios.put(
          `https://babycare-backend-msyq.onrender.com/api/v1/admin/articulos/${editId}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      } else {
        await axios.post(
          "https://babycare-backend-msyq.onrender.com/api/v1/admin/articulos",
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }
      setIsModalOpen(false);
      fetchData();
    } catch  {
      alert("Error al guardar artículo");
    }
  };

  return (
    <div className="admin-content-area">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Artículos educativos</h1>
        <div className="admin-breadcrumbs">
          Panel de administración / Contenido / Artículos
        </div>
      </div>

      {/* MÉTRICAS (Dinámicas desde Backend) */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "32px", overflowX: "auto" }}>
        
        <div style={{ flex: "1", background: "var(--surface)", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minWidth: "200px" }}>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1F2937", marginBottom: "8px" }}>{stats.publicados}</div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>Artículos publicados</div>
          <div style={{ fontSize: "11px", color: "#10B981", marginTop: "8px" }}>Visibles en la app</div>
        </div>

        <div style={{ flex: "1", background: "var(--surface)", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minWidth: "200px" }}>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1F2937", marginBottom: "8px" }}>{stats.borradores}</div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>Borradores</div>
          <div style={{ fontSize: "11px", color: stats.borradores > 0 ? "#EF4444" : "#10B981", marginTop: "8px" }}>
            {stats.borradores > 0 ? "Pendientes de revisión" : "Todo publicado"}
          </div>
        </div>

        <div style={{ flex: "1", background: "var(--surface)", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minWidth: "200px" }}>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1F2937", marginBottom: "8px" }}>{stats.lecturasTotales}</div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>Lecturas totales</div>
          <div style={{ fontSize: "11px", color: "#10B981", marginTop: "8px" }}>Histórico de la plataforma</div>
        </div>

        <div style={{ flex: "1", background: "var(--surface)", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minWidth: "200px" }}>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1F2937", marginBottom: "8px" }}>{stats.utilidadPromedio}</div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>Utilidad promedio</div>
          <div style={{ fontSize: "11px", color: "#10B981", marginTop: "8px" }}>Sobre 5 estrellas</div>
        </div>
        
      </div>

      <div className="admin-table-toolbar">
        <div className="admin-filters">
          <select 
            className="admin-filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="Toda categoría">Toda categoría</option>
            {categoriasUnicas.map((cat: any) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select 
            className="admin-filter-select"
            value={filterAge}
            onChange={(e) => setFilterAge(e.target.value)}
          >
            <option value="Todo rango de edad">Todo rango de edad</option>
            {rangosEdadUnicos.map((rango: any) => (
              <option key={rango} value={rango}>{rango}</option>
            ))}
          </select>
          <select 
            className="admin-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Todo estado">Todo estado</option>
            <option value="Publicado">Publicado</option>
            <option value="Borrador">Borrador</option>
          </select>
        </div>
        {canManageArticulos && (
          <button onClick={handleOpenNew} className="admin-btn">
            + Nuevo artículo
          </button>
        )}
      </div>

      <div className="admin-data-table-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Categoría</th>
              <th>Rango de Edad</th>
              <th>Fuente</th>
              <th>Lecturas</th>
              <th>Estado</th>
              {canManageArticulos && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filteredArticulos.map((item: any) => (
              <tr key={item.id}>
                <td>
                  <div className="admin-user-cell">
                    <div className="admin-avatar admin-avatar-green">
                      {item.titulo
                        ? item.titulo.substring(0, 2).toUpperCase()
                        : "A"}
                    </div>
                    <div className="admin-user-info">
                      <span className="admin-user-name">{item.titulo}</span>
                      <span className="admin-user-id">
                        {item.estado === "publicado"
                          ? "Publicado"
                          : "Borrador — sin publicar"}
                      </span>
                    </div>
                  </div>
                </td>
                <td>{item.categoria}</td>
                <td>{item.rango_edad_meses}</td>
                <td>{item.fuente_citada || "MINSAL"}</td>
                <td>{item.lecturas || 0}</td>
                <td>
                  <span
                    className={`admin-status-badge ${item.estado === "publicado" ? "admin-status-active" : "admin-status-pending"}`}
                  >
                    {item.estado === "publicado" ? "Publicado" : "Borrador"}
                  </span>
                </td>
                {canManageArticulos && (
                  <td>
                    <div className="admin-action-buttons">
                      <button
                        className="admin-btn-icon edit"
                        onClick={() => handleEdit(item)}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </button>
                      <button
                        className="admin-btn-icon delete"
                        onClick={() => handleDelete(item.id)}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filteredArticulos.length === 0 && (
              <tr>
                <td colSpan={canManageArticulos ? 7 : 6} style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>
                  No hay artículos que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="admin-pagination-container">
          <div>Mostrando {filteredArticulos.length} artículos</div>
          <div className="admin-pagination-controls">
            <button className="admin-page-btn active">1</button>
          </div>
        </div>
      </div>

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Artículo" : "Nuevo Artículo"}
      >
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>Título</label>
            <input
              type="text"
              className="admin-form-control"
              required
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              value={formData.titulo}
              onChange={(e) =>
                setFormData({ ...formData, titulo: e.target.value })
              }
            />
          </div>
          <div className="admin-form-group">
            <label>Categoría</label>
            <input
              type="text"
              className="admin-form-control"
              required
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              value={formData.categoria}
              onChange={(e) =>
                setFormData({ ...formData, categoria: e.target.value })
              }
            />
          </div>
          <div className="admin-form-group">
            <label>Rango Edad (Meses)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="number"
                min={0}
                className="admin-form-control"
                required
                aria-label="Edad desde (meses)"
                placeholder="Desde"
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                value={rangoDesde}
                onChange={(e) => {
                  const desde = parseInt(e.target.value) || 0;
                  setRangoDesde(desde);
                  setFormData({ ...formData, rango_edad_meses: `${desde}-${rangoHasta} meses` });
                }}
              />
              <span style={{ color: "#6B7280", fontWeight: 600 }}>a</span>
              <input
                type="number"
                min={0}
                className="admin-form-control"
                required
                aria-label="Edad hasta (meses)"
                placeholder="Hasta"
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                value={rangoHasta}
                onChange={(e) => {
                  const hasta = parseInt(e.target.value) || 0;
                  setRangoHasta(hasta);
                  setFormData({ ...formData, rango_edad_meses: `${rangoDesde}-${hasta} meses` });
                }}
              />
              <span style={{ color: "#6B7280", fontSize: "13px" }}>meses</span>
            </div>
            {rangoHasta < rangoDesde && (
              <span style={{ color: "#DC2626", fontSize: "12px" }}>
                "Hasta" debería ser mayor o igual que "Desde"
              </span>
            )}
          </div>
          <div className="admin-form-group">
            <label>Contenido Corto (Resumen)</label>
            <textarea
              className="admin-form-control"
              rows={3}
              required
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              value={formData.resumen}
              onChange={(e) =>
                setFormData({ ...formData, resumen: e.target.value })
              }
            ></textarea>
          </div>
          {isEditing && (
            <div className="admin-form-group">
              <label>Estado</label>
              <select
                className="admin-form-control"
                value={formData.estado}
                onChange={(e) =>
                  setFormData({ ...formData, estado: e.target.value })
                }
              >
                <option value="borrador">Borrador</option>
                <option value="publicado">Publicado</option>
              </select>
            </div>
          )}
          <button type="submit" className="admin-btn">
            Guardar
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
