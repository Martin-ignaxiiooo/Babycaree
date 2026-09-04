import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminModal from "../../components/admin/AdminModal";
import { useAdminAuth } from "../../hooks/useAdminAuth";

export default function AdminCentros() {
  const { canManageDirectorio } = useAdminAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [formData, setFormData] = useState({
    codigo: "",
    nombre_visible: "",
    icono: "",
    requiere_convenio: false,
  });

  const handleOpenNew = () => {
    setFormData({
      codigo: "",
      nombre_visible: "",
      icono: "",
      requiere_convenio: false,
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setFormData({
      codigo: item.codigo,
      nombre_visible: item.nombre_visible,
      icono: item.icono || "",
      requiere_convenio: item.requiere_convenio,
    });
    setEditId(item.codigo);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (codigo: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este centro?"))
      return;
    try {
      const token = localStorage.getItem("admin_token");
      await axios.delete(
        `https://babycare-backend-msyq.onrender.com/api/v1/admin/directorio/centros/${codigo}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchData();
    } catch  {
      alert("Error al eliminar centro (puede que esté en uso)");
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) return navigate("/admin/login");
      const res = await axios.get(
        "https://babycare-backend-msyq.onrender.com/api/v1/admin/directorio/centros",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
          `https://babycare-backend-msyq.onrender.com/api/v1/admin/directorio/centros/${editId}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        await axios.post(
          "https://babycare-backend-msyq.onrender.com/api/v1/admin/directorio/centros",
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
      setIsModalOpen(false);
      fetchData();
    } catch  {
      alert("Error al guardar centro");
    }
  };

  return (
    <div className="admin-content-area">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Tipos de centro de atención</h1>
        <div className="admin-breadcrumbs">
          Panel de administración / Datos maestros / Tipos de centro
        </div>
      </div>

      <div className="admin-table-toolbar justify-end">
        {canManageDirectorio && (
          <button onClick={handleOpenNew} className="admin-btn">
            + Nuevo centro
          </button>
        )}
      </div>

      <div className="admin-data-table-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Ícono</th>
              <th>Requiere Convenio</th>
              <th>Email Contacto</th>
              <th>Estado</th>
              {canManageDirectorio && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.codigo}>
                <td className="font-medium text-gray-500">{item.codigo}</td>
                <td className="font-bold text-gray-800">
                  {item.nombre_visible}
                </td>
                <td>{item.icono || "🏥"}</td>
                <td>
                  <span
                    className={
                      item.requiere_convenio
                        ? "text-amber-600 font-bold"
                        : "text-gray-500 font-bold"
                    }
                  >
                    {item.requiere_convenio ? "Sí" : "No"}
                  </span>
                </td>
                <td>{item.email || "-"}</td>
                <td>
                  <span className="admin-status-badge admin-status-active">
                    Activo
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
            {data.length === 0 && (
              <tr>
                <td colSpan={canManageDirectorio ? 6 : 5} className="text-center py-8 text-gray-500">
                  No hay centros registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Centro" : "Nuevo Centro"}
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
            <label>Ícono (Emoji)</label>
            <input
              type="text"
              className="admin-form-control"
              value={formData.icono}
              onChange={(e) =>
                setFormData({ ...formData, icono: e.target.value })
              }
            />
          </div>
          <div className="admin-form-group">
            <label>Requiere Convenio Específico</label>
            <select
              className="admin-form-control"
              value={formData.requiere_convenio ? "true" : "false"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  requiere_convenio: e.target.value === "true",
                })
              }
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
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
