import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminModal from "../../components/admin/AdminModal";
import { useAdminAuth } from "../../hooks/useAdminAuth";

export default function AdminOMS() {
  const { canManageOMS } = useAdminAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    registrosTotales: 0,
    mesMaximo: 0,
    fuente: "OMS 2006",
    actualizacion: "Al día",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [formData, setFormData] = useState({
    mes_vida: 0,
    sexo: "Unisex",
    peso_esperado_kg: 0.0,
    talla_esperada_cm: 0.0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) return navigate("/admin/login");

      const res = await axios.get("https://babycare-backend-msyq.onrender.com/api/v1/admin/oms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);

      const statsRes = await axios.get(
        "https://babycare-backend-msyq.onrender.com/api/v1/admin/oms/stats",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
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

  const handleOpenNew = () => {
    setFormData({
      mes_vida: 0,
      sexo: "Unisex",
      peso_esperado_kg: 0.0,
      talla_esperada_cm: 0.0,
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setFormData({
      mes_vida: item.mes_vida,
      sexo: item.sexo,
      peso_esperado_kg: item.peso_esperado_kg,
      talla_esperada_cm: item.talla_esperada_cm,
    });
    setEditId(item.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este registro?"))
      return;
    try {
      const token = localStorage.getItem("admin_token");
      await axios.delete(`https://babycare-backend-msyq.onrender.com/api/v1/admin/oms/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch  {
      alert("Error al eliminar registro");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      if (isEditing) {
        await axios.put(
          `https://babycare-backend-msyq.onrender.com/api/v1/admin/oms/${editId}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      } else {
        await axios.post("https://babycare-backend-msyq.onrender.com/api/v1/admin/oms", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.error || "Error al guardar registro");
    }
  };

  return (
    <div className="admin-content-area">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Mantenedor OMS Percentiles</h1>
        <div className="admin-breadcrumbs">
          Panel de administración / Estándares / OMS
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
        Estos valores alimentan las curvas de crecimiento (líneas punteadas) en
        el Dashboard de los padres.
      </div>

      {/* MÉTRICAS (Dinámicas desde Backend) */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "32px",
          overflowX: "auto",
        }}
      >
        <div
          style={{
            flex: "1",
            background: "var(--surface)",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            minWidth: "200px",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#1F2937",
              marginBottom: "8px",
            }}
          >
            {stats.registrosTotales}
          </div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>
            Registros Totales
          </div>
          <div
            style={{ fontSize: "11px", color: "#10B981", marginTop: "8px" }}
          >
            Puntos de referencia en BD
          </div>
        </div>

        <div
          style={{
            flex: "1",
            background: "var(--surface)",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            minWidth: "200px",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#1F2937",
              marginBottom: "8px",
            }}
          >
            {stats.mesMaximo}
          </div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>
            Mes Máximo Alcanzado
          </div>
          <div
            style={{ fontSize: "11px", color: "#10B981", marginTop: "8px" }}
          >
            Límite actual en curvas
          </div>
        </div>

        <div
          style={{
            flex: "1",
            background: "var(--surface)",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            minWidth: "200px",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#1F2937",
              marginBottom: "8px",
            }}
          >
            {stats.fuente}
          </div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>
            Fuente de Datos
          </div>
          <div
            style={{ fontSize: "11px", color: "#10B981", marginTop: "8px" }}
          >
            Estandar Internacional
          </div>
        </div>

        <div
          style={{
            flex: "1",
            background: "var(--surface)",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            minWidth: "200px",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#1F2937",
              marginBottom: "8px",
            }}
          >
            {stats.actualizacion}
          </div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>
            Estado Base de Datos
          </div>
          <div
            style={{ fontSize: "11px", color: "#10B981", marginTop: "8px" }}
          >
            Operativa
          </div>
        </div>
      </div>

      <div className="admin-table-toolbar">
        <div className="admin-filters">
          <select className="admin-filter-select">
            <option>Todos los sexos</option>
            <option>Masculino</option>
            <option>Femenino</option>
            <option>Unisex</option>
          </select>
        </div>
        {canManageOMS && (
          <button className="admin-btn" onClick={handleOpenNew}>
            <Plus size={16} /> Nuevo registro
          </button>
        )}
      </div>

      <div className="admin-data-table-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Mes de Vida</th>
              <th>Sexo</th>
              <th>Peso Esperado (kg)</th>
              <th>Talla Esperada (cm)</th>
              <th>Creación</th>
              {canManageOMS && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td className="text-gray-500">#{item.id}</td>
                <td>
                  <span className="font-bold">Mes {item.mes_vida}</span>
                </td>
                <td>{item.sexo}</td>
                <td>{item.peso_esperado_kg} kg</td>
                <td>{item.talla_esperada_cm} cm</td>
                <td className="text-gray-500">
                  {new Date(item.fecha_creacion).toLocaleDateString('es-CL')}
                </td>
                {canManageOMS && (
                  <td>
                    <div className="admin-actions">
                      <button
                        className="admin-action-btn"
                        onClick={() => handleEdit(item)}
                      >
                        Editar
                      </button>
                      <button
                        className="admin-action-btn admin-action-danger"
                        onClick={() => handleDelete(item.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={canManageOMS ? 7 : 6} style={{ textAlign: "center", padding: "24px" }}>
                  No hay registros OMS. Agrega nuevos puntos para alimentar la
                  curva.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Registro OMS" : "Nuevo Registro OMS"}
      >
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-form-label">Mes de Vida</label>
            <input
              type="number"
              className="admin-form-input"
              value={formData.mes_vida}
              onChange={(e) =>
                setFormData({ ...formData, mes_vida: parseInt(e.target.value) })
              }
              min="0"
              required
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Sexo</label>
            <select
              className="admin-form-input"
              value={formData.sexo}
              onChange={(e) =>
                setFormData({ ...formData, sexo: e.target.value })
              }
            >
              <option value="Unisex">Unisex</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Peso Esperado (kg)</label>
            <input
              type="number"
              step="0.01"
              className="admin-form-input"
              value={formData.peso_esperado_kg}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  peso_esperado_kg: parseFloat(e.target.value),
                })
              }
              required
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Talla Esperada (cm)</label>
            <input
              type="number"
              step="0.01"
              className="admin-form-input"
              value={formData.talla_esperada_cm}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  talla_esperada_cm: parseFloat(e.target.value),
                })
              }
              required
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
            />
          </div>
          <div
            className="admin-form-actions"
            style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}
          >
            <button
              type="button"
              className="admin-btn"
              style={{ background: "#E5E7EB", color: "#374151" }}
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="admin-btn">
              {isEditing ? "Guardar Cambios" : "Crear Registro"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
