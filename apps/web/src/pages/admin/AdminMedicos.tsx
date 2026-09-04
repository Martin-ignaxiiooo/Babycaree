import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminModal from "../../components/admin/AdminModal";
import { useAdminAuth } from "../../hooks/useAdminAuth";

export default function AdminMedicos() {
  const { canManageDirectorio } = useAdminAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [formData, setFormData] = useState({
    nombre_completo: "",
    rut: "",
    especialidad: "",
    nombre_centro: "",
    prevision_aceptada: "",
  });

  // ── Filtros ──
  const [filterEspecialidad, setFilterEspecialidad] = useState("Toda especialidad");
  const [filterPrevision, setFilterPrevision] = useState("Toda previsión");
  const [filterStatus, setFilterStatus] = useState("Todo estado");

  // Computar listas únicas para los selectores
  const especialidadesUnicas = Array.from(new Set(data.map(m => m.especialidad).filter(Boolean)));
  // Las previsiones pueden ser array o string, normalizamos para sacar las únicas
  const previsionesRaw = data.flatMap(m => {
    if (!m.prevision_aceptada) return [];
    if (typeof m.prevision_aceptada === 'string') return m.prevision_aceptada.split(',').map(s => s.trim());
    if (Array.isArray(m.prevision_aceptada)) return m.prevision_aceptada;
    return [];
  });
  const previsionesUnicas = Array.from(new Set(previsionesRaw)).filter(Boolean);

  const filteredMedicos = data.filter((m) => {
    let matchEspecialidad = true;
    let matchPrevision = true;
    let matchStatus = true;

    if (filterEspecialidad !== "Toda especialidad") {
      matchEspecialidad = m.especialidad === filterEspecialidad;
    }
    if (filterPrevision !== "Toda previsión") {
      if (!m.prevision_aceptada) matchPrevision = false;
      else if (typeof m.prevision_aceptada === 'string') {
        matchPrevision = m.prevision_aceptada.includes(filterPrevision);
      } else if (Array.isArray(m.prevision_aceptada)) {
        matchPrevision = m.prevision_aceptada.includes(filterPrevision);
      }
    }
    if (filterStatus !== "Todo estado") {
      const isVerificado = filterStatus === "Verificado";
      matchStatus = isVerificado 
        ? m.estado_verificacion === "verificado" 
        : m.estado_verificacion !== "verificado";
    }

    return matchEspecialidad && matchPrevision && matchStatus;
  });

  const handleOpenNew = () => {
    setFormData({
      nombre_completo: "",
      rut: "",
      especialidad: "",
      nombre_centro: "",
      prevision_aceptada: "",
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setFormData({
      nombre_completo: item.nombre_completo,
      rut: item.rut || "",
      especialidad: item.especialidad || "",
      nombre_centro: item.nombre_centro || "",
      prevision_aceptada: item.prevision_aceptada || "",
    });
    setEditId(item.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este médico?"))
      return;
    try {
      const token = localStorage.getItem("admin_token");
      await axios.delete(
        `https://babycare-backend-msyq.onrender.com/api/v1/admin/directorio/medicos/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchData();
    } catch  {
      alert("Error al eliminar médico");
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) return navigate("/admin/login");
      const res = await axios.get(
        "https://babycare-backend-msyq.onrender.com/api/v1/admin/directorio/medicos",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setData(res.data);
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
          `https://babycare-backend-msyq.onrender.com/api/v1/admin/directorio/medicos/${editId}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      } else {
        await axios.post(
          "https://babycare-backend-msyq.onrender.com/api/v1/admin/directorio/medicos",
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }
      setIsModalOpen(false);
      fetchData();
    } catch  {
      alert("Error al guardar médico");
    }
  };

  return (
    <div className="admin-content-area">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Médicos</h1>
        <div className="admin-breadcrumbs">
          Panel de administración / Datos maestros / Médicos
        </div>
      </div>

      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="value">{data.length}</div>
          <h3>Médicos registrados</h3>
          <div className="admin-kpi-subtext success">Total en sistema</div>
        </div>
        <div className="admin-kpi-card">
          <div className="value">
            {data.filter((d) => d.estado_verificacion === "verificado").length}
          </div>
          <h3>Perfiles verificados</h3>
          <div className="admin-kpi-subtext success">
            {data.length > 0 ? Math.round((data.filter((d) => d.estado_verificacion === "verificado").length / data.length) * 100) : 0}% del total
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="value">
            {data.filter((d) => d.estado_verificacion !== "verificado").length}
          </div>
          <h3>Pendientes de revisión</h3>
          <div className="admin-kpi-subtext danger">Requieren validación</div>
        </div>
        <div className="admin-kpi-card">
          <div className="value">
            {data.length > 0 
              ? (data.reduce((acc, medico) => acc + parseFloat(medico.calificacion_promedio || "0"), 0) / data.length).toFixed(1)
              : "0.0"}
          </div>
          <h3>Calificación promedio</h3>
          <div className="admin-kpi-subtext success">Sobre 5.0</div>
        </div>
      </div>

      <div className="admin-table-toolbar">
        <div className="admin-filters">
          <select 
            className="admin-filter-select"
            value={filterEspecialidad}
            onChange={(e) => setFilterEspecialidad(e.target.value)}
          >
            <option value="Toda especialidad">Toda especialidad</option>
            {especialidadesUnicas.map(esp => (
              <option key={esp} value={esp}>{esp}</option>
            ))}
          </select>
          <select 
            className="admin-filter-select"
            value={filterPrevision}
            onChange={(e) => setFilterPrevision(e.target.value)}
          >
            <option value="Toda previsión">Toda previsión</option>
            {previsionesUnicas.map(prev => (
              <option key={prev} value={prev}>{prev}</option>
            ))}
          </select>
          <select 
            className="admin-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Todo estado">Todo estado</option>
            <option value="Verificado">Verificado</option>
            <option value="Pendiente">Pendiente revisión</option>
          </select>
        </div>
        {canManageDirectorio && (
          <button onClick={handleOpenNew} className="admin-btn">
            + Nuevo médico
          </button>
        )}
      </div>

      <div className="admin-data-table-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Médico</th>
              <th>Especialidad</th>
              <th>Centro</th>
              <th>Previsión</th>
              <th>Calificación</th>
              <th>Estado</th>
              {canManageDirectorio && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filteredMedicos.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="admin-user-cell">
                    <div className="admin-avatar admin-avatar-blue">
                      {item.nombre_completo
                        ? item.nombre_completo.substring(0, 2).toUpperCase()
                        : "M"}
                    </div>
                    <div className="admin-user-info">
                      <span className="admin-user-name">
                        {item.nombre_completo}
                      </span>
                      <span className="admin-user-id">
                        RUT: {item.rut || "No registra"}
                      </span>
                    </div>
                  </div>
                </td>
                <td>{item.especialidad}</td>
                <td>{item.nombre_centro}</td>
                <td>
                  {item.prevision_aceptada ? (
                    typeof item.prevision_aceptada === 'string' 
                      ? item.prevision_aceptada 
                      : (Array.isArray(item.prevision_aceptada) 
                          ? item.prevision_aceptada.join(", ") 
                          : JSON.stringify(item.prevision_aceptada))
                  ) : "Sin previsión"}
                </td>
                <td>⭐ {item.calificacion_promedio ? parseFloat(item.calificacion_promedio).toFixed(1) : "0.0"}</td>
                <td>
                  <span
                    className={`admin-status-badge ${item.estado_verificacion === "verificado" ? "admin-status-active" : "admin-status-pending"}`}
                  >
                    {item.estado_verificacion === "verificado"
                      ? "Verificado"
                      : "Pendiente revisión"}
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
            {filteredMedicos.length === 0 && (
              <tr>
                <td colSpan={canManageDirectorio ? 7 : 6} style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>
                  No hay médicos que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="admin-pagination-container">
          <div>Mostrando {filteredMedicos.length} médicos</div>
          <div className="admin-pagination-controls">
            <button className="admin-page-btn active">1</button>
          </div>
        </div>
      </div>

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Médico" : "Nuevo Médico"}
      >
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>Nombre Completo</label>
            <input
              type="text"
              className="admin-form-control"
              required
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              value={formData.nombre_completo}
              onChange={(e) =>
                setFormData({ ...formData, nombre_completo: e.target.value })
              }
            />
          </div>
          <div className="admin-form-group">
            <label>RUT</label>
            <input
              type="text"
              className="admin-form-control"
              value={formData.rut}
              onChange={(e) =>
                setFormData({ ...formData, rut: e.target.value })
              }
            />
          </div>
          <div className="admin-form-group">
            <label>Especialidad</label>
            <input
              type="text"
              className="admin-form-control"
              required
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              value={formData.especialidad}
              onChange={(e) =>
                setFormData({ ...formData, especialidad: e.target.value })
              }
            />
          </div>
          <div className="admin-form-group">
            <label>Centro de Atención</label>
            <input
              type="text"
              className="admin-form-control"
              required
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              value={formData.nombre_centro}
              onChange={(e) =>
                setFormData({ ...formData, nombre_centro: e.target.value })
              }
            />
          </div>
          <button type="submit" className="admin-btn">
            Guardar
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
