import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AdminModal from "../../components/admin/AdminModal";
import { useAdminAuth } from "../../hooks/useAdminAuth";

export default function AdminPrevision() {
  const { canManageDirectorio } = useAdminAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [formData, setFormData] = useState({
    nombre_visible: "",
    tipo: "Público",
    orden_visualizacion: 0,
  });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) return navigate("/admin/login");
      const res = await axios.get(
        "https://babycare-backend-msyq.onrender.com/api/v1/admin/directorio/prevision",
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

  const handleOpenNew = () => {
    setFormData({
      nombre_visible: "",
      tipo: "Público",
      orden_visualizacion: 0,
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setFormData({
      nombre_visible: item.nombre_visible,
      tipo: item.tipo,
      orden_visualizacion: item.orden_visualizacion || 0,
    });
    setEditId(item.codigo);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (codigo: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta previsión?"))
      return;
    try {
      const token = localStorage.getItem("admin_token");
      await axios.delete(
        `https://babycare-backend-msyq.onrender.com/api/v1/admin/directorio/prevision/${codigo}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchData();
    } catch  {
      alert("Error al eliminar previsión");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      if (isEditing) {
        await axios.put(
          `https://babycare-backend-msyq.onrender.com/api/v1/admin/directorio/prevision/${editId}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      } else {
        await axios.post(
          "https://babycare-backend-msyq.onrender.com/api/v1/admin/directorio/prevision",
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }
      setIsModalOpen(false);
      fetchData();
    } catch  {
      alert("Error al guardar previsión");
    }
  };

  return (
    <div className="admin-content-area">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Previsión de salud</h1>
        <div className="admin-breadcrumbs">
          Panel de administración / Datos maestros / Previsión de salud
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
        Estos valores alimentan los selectores de previsión en el registro de
        usuarios y los filtros del directorio médico. No eliminar valores en
        uso: desactivarlos en su lugar.
      </div>

      <div className="admin-table-toolbar justify-end">
        {canManageDirectorio && (
          <button onClick={handleOpenNew} className="admin-btn">
            + Nuevo registro
          </button>
        )}
      </div>

      <div className="admin-data-table-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Usuarios Asociados</th>
              <th>Estado</th>
              {canManageDirectorio && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={canManageDirectorio ? 6 : 5} className="text-center py-8 text-gray-500">
                  No hay registros
                </td>
              </tr>
            )}
            {data.map((item) => (
              <tr key={item.codigo}>
                <td className="text-gray-500">{item.codigo}</td>
                <td className="font-bold text-gray-800">
                  {item.nombre_visible}
                </td>
                <td>
                  <span
                    className={`admin-cat-badge ${
                      item.tipo === "Público"
                        ? "admin-cat-blue"
                        : item.tipo === "Privado"
                          ? "admin-cat-yellow"
                          : "admin-cat-gray"
                    }`}
                  >
                    {item.tipo}
                  </span>
                </td>
                <td>{item.usuarios_asociados || 0}</td>
                <td>
                  <span className={`admin-status-badge admin-status-active`}>
                    Activa
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
          </tbody>
        </table>
      </div>

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Previsión" : "Nueva Previsión"}
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
            <label>Tipo</label>
            <select
              className="admin-form-control"
              value={formData.tipo}
              onChange={(e) =>
                setFormData({ ...formData, tipo: e.target.value })
              }
            >
              <option value="Público">Público</option>
              <option value="Privado">Privado</option>
              <option value="Institucional">Institucional</option>
              <option value="Sin previsión">Sin previsión</option>
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
