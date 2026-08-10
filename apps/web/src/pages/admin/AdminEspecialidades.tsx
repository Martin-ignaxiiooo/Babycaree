import { useEffect, useState } from "react";
import { Stethoscope, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminModal from "../../components/admin/AdminModal";
import { useAdminAuth } from "../../hooks/useAdminAuth";

export default function AdminEspecialidades() {
  const { canManageDirectorio } = useAdminAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ activas: 0, medicos: 0, sinAsignar: 0, masSolicitada: "Ninguna", masSolicitadaTotal: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [formData, setFormData] = useState({
    nombre_visible: "",
    categoria: "Especialidad",
    descripcion_breve: "",
    orden_visualizacion: 0,
    estado: "activa",
  });

  // ── Filtro ──
  const [filterStatus, setFilterStatus] = useState("Todos los estados");

  const filteredData = data.filter((item) => {
    if (filterStatus === "Todos los estados") return true;
    return item.estado === filterStatus.toLowerCase(); // "activa" o "inactiva"
  });

  const handleOpenNew = () => {
    setFormData({
      nombre_visible: "",
      categoria: "Especialidad",
      descripcion_breve: "",
      orden_visualizacion: 0,
      estado: "activa",
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setFormData({
      nombre_visible: item.nombre_visible,
      categoria: item.categoria,
      descripcion_breve: item.descripcion_breve || "",
      orden_visualizacion: item.orden_visualizacion || 0,
      estado: item.estado || "activa",
    });
    setEditId(item.codigo);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (codigo: string) => {
    if (
      !window.confirm("¿Estás seguro de que deseas eliminar esta especialidad?")
    )
      return;

    try {
      const token = localStorage.getItem("admin_token");
      await axios.delete(
        `https://babycare-backend-msyq.onrender.com/api/v1/admin/directorio/especialidades/${codigo}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchData(); // Recargar datos
    } catch (e) {
      alert("Error al eliminar especialidad (puede que esté en uso)");
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) return navigate("/admin/login");
      
      const res = await axios.get(
        "https://babycare-backend-msyq.onrender.com/api/v1/admin/directorio/especialidades",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setData(res.data);

      const statsRes = await axios.get(
        "https://babycare-backend-msyq.onrender.com/api/v1/admin/directorio/especialidades/stats",
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
          `https://babycare-backend-msyq.onrender.com/api/v1/admin/directorio/especialidades/${editId}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      } else {
        await axios.post(
          "https://babycare-backend-msyq.onrender.com/api/v1/admin/directorio/especialidades",
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }
      setIsModalOpen(false);
      fetchData(); // Recargar datos
    } catch (e) {
      alert("Error al guardar especialidad");
    }
  };

  return (
    <div className="admin-content-area">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Especialidades</h1>
        <div className="admin-breadcrumbs">
          Panel de administración / Datos maestros / Especialidades
        </div>
      </div>

      <div className="admin-info-banner">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        Este catálogo alimenta el selector de especialidad en el mantenedor de
        Médicos y los filtros de búsqueda del Directorio Médico en la app. No
        eliminar especialidades en uso: desactivarlas en su lugar.
      </div>

      {/* MÉTRICAS (Dinámicas desde Backend) */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "32px", overflowX: "auto" }}>
        
        <div style={{ flex: "1", background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minWidth: "200px" }}>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1F2937", marginBottom: "8px" }}>{stats.activas}</div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>Especialidades activas</div>
          <div style={{ fontSize: "11px", color: "#10B981", marginTop: "8px" }}>Sincronizado</div>
        </div>

        <div style={{ flex: "1", background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minWidth: "200px" }}>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1F2937", marginBottom: "8px" }}>{stats.medicos}</div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>Médicos profesionales</div>
          <div style={{ fontSize: "11px", color: "#10B981", marginTop: "8px" }}>Asociados a especialidad</div>
        </div>

        <div style={{ flex: "1", background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minWidth: "200px" }}>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1F2937", marginBottom: "8px" }}>{stats.sinAsignar}</div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>Sin médicos asignados</div>
          <div style={{ fontSize: "11px", color: stats.sinAsignar > 0 ? "#EF4444" : "#10B981", marginTop: "8px" }}>
            {stats.sinAsignar > 0 ? "Requiere acción" : "Todas cubiertas"}
          </div>
        </div>

        <div style={{ flex: "1", background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minWidth: "200px" }}>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#1F2937", marginBottom: "8px" }}>{stats.masSolicitada}</div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>Más asignada</div>
          <div style={{ fontSize: "11px", color: "#10B981", marginTop: "8px" }}>{stats.masSolicitadaTotal} médicos de esta rama</div>
        </div>
        
      </div>

      <div className="admin-table-toolbar">
        <div className="admin-filters">
          <select 
            className="admin-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Todos los estados">Todos los estados</option>
            <option value="Activa">Activa</option>
            <option value="Inactiva">Inactiva</option>
          </select>
        </div>
        {canManageDirectorio && (
          <button onClick={handleOpenNew} className="admin-btn">
            + Nueva especialidad
          </button>
        )}
      </div>

      <div className="admin-data-table-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Especialidad</th>
              <th>Código</th>
              <th>Categoría</th>
              <th>Médicos Asociados</th>
              <th>Estado</th>
              {canManageDirectorio && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.codigo}>
                <td className="font-bold text-gray-800">
                  {item.nombre_visible}
                </td>
                <td className="text-gray-500">{item.codigo}</td>
                <td>
                  <span
                    className={`admin-cat-badge ${
                      item.categoria === "Especialidad"
                        ? "admin-cat-yellow"
                        : item.categoria === "Atención general"
                          ? "admin-cat-blue"
                          : "admin-cat-gray"
                    }`}
                  >
                    {item.categoria}
                  </span>
                </td>
                <td>{Math.floor(Math.random() * 40)}</td>
                <td>
                  <span
                    className={`admin-status-badge ${item.estado === "activa" ? "admin-status-active" : "admin-status-inactive"}`}
                  >
                    {item.estado === "activa" ? "Activa" : "Inactiva"}
                  </span>
                </td>
                {canManageDirectorio && (
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
                        onClick={() => handleDelete(item.codigo)}
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
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={canManageDirectorio ? 6 : 5} style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>
                  No hay especialidades que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="admin-pagination-container">
          <div>Mostrando {filteredData.length} especialidades</div>
          <div className="admin-pagination-controls">
            <button className="admin-page-btn active">1</button>
          </div>
        </div>
      </div>

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Especialidad" : "Nueva Especialidad"}
      >
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>Nombre Visible</label>
            <input
              type="text"
              className="admin-form-control"
              required
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              value={formData.nombre_visible}
              onChange={(e) =>
                setFormData({ ...formData, nombre_visible: e.target.value })
              }
            />
          </div>
          <div className="admin-form-group">
            <label>Categoría</label>
            <select
              className="admin-form-control"
              onChange={(e) =>
                setFormData({ ...formData, categoria: e.target.value })
              }
              value={formData.categoria}
            >
              <option value="Especialidad">Especialidad</option>
              <option value="Atención general">Atención general</option>
              <option value="Terapia">Terapia</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label>Estado</label>
            <select
              className="admin-form-control"
              onChange={(e) =>
                setFormData({ ...formData, estado: e.target.value })
              }
              value={formData.estado}
            >
              <option value="activa">Activa</option>
              <option value="inactiva">Inactiva</option>
            </select>
          </div>
          <button type="submit" className="admin-btn">
            Guardar
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
