import { useEffect, useState } from "react";
import { Syringe, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminModal from "../../components/admin/AdminModal";
import { useAdminAuth } from "../../hooks/useAdminAuth";

export default function AdminVacunas() {
  const { canManageVacunas } = useAdminAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    meses_edad: 0,
    obligatoria: true,
    enfermedades_previene: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenNew = () => {
    setFormData({
      nombre: "",
      meses_edad: 0,
      obligatoria: true,
      enfermedades_previene: "",
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setFormData({
      nombre: item.nombre || "",
      meses_edad: item.meses_edad || 0,
      obligatoria: item.obligatoria,
      enfermedades_previene: item.enfermedades_previene || "",
    });
    setEditId(item.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta vacuna?"))
      return;
    try {
      const token = localStorage.getItem("admin_token");
      await axios.delete(`https://babycare-backend-msyq.onrender.com/api/v1/admin/vacunas/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch  {
      alert("Error al eliminar vacuna");
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) return navigate("/admin/login");
      const res = await axios.get(
        "https://babycare-backend-msyq.onrender.com/api/v1/admin/vacunas",
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
          `https://babycare-backend-msyq.onrender.com/api/v1/admin/vacunas/${editId}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      } else {
        await axios.post(
          "https://babycare-backend-msyq.onrender.com/api/v1/admin/vacunas",
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }
      setIsModalOpen(false);
      fetchData();
    } catch  {
      alert("Error al guardar vacuna");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Syringe className="text-purple-600" /> Calendario de Vacunas
          </h1>
        </div>
        {canManageVacunas && (
          <button
            onClick={handleOpenNew}
            className="admin-btn flex items-center gap-2"
            style={{ width: "auto" }}
          >
            <Plus size={18} /> Nueva Vacuna
          </button>
        )}
      </div>

      <div className="admin-data-table-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Meses Edad</th>
              <th>Obligatoria</th>
              <th>Enfermedades Previene</th>
              {canManageVacunas && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td className="font-medium text-gray-900">{item.nombre}</td>
                <td>{item.meses_edad}</td>
                <td>{item.obligatoria ? "Sí" : "No"}</td>
                <td>{item.enfermedades_previene}</td>
                {canManageVacunas && (
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
            {data.length === 0 && (
              <tr>
                <td colSpan={canManageVacunas ? 5 : 4} className="text-center py-8 text-gray-500">
                  No hay registros (o sin acceso)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Vacuna" : "Nueva Vacuna"}
      >
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>Nombre de Vacuna</label>
            <input
              type="text"
              className="admin-form-control"
              required
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
            />
          </div>
          <div className="admin-form-group">
            <label>Meses de Edad</label>
            <input
              type="number"
              className="admin-form-control"
              required
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              value={formData.meses_edad}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  meses_edad: parseInt(e.target.value),
                })
              }
            />
          </div>
          <div className="admin-form-group">
            <label>Obligatoria (PNI)</label>
            <select
              className="admin-form-control"
              value={formData.obligatoria ? "true" : "false"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  obligatoria: e.target.value === "true",
                })
              }
            >
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label>Enfermedades que previene</label>
            <input
              type="text"
              className="admin-form-control"
              required
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              value={formData.enfermedades_previene}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  enfermedades_previene: e.target.value,
                })
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
