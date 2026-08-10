import { useEffect, useState } from "react";
import { Users, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminModal from "../../components/admin/AdminModal";
import { useAdminAuth } from "../../hooks/useAdminAuth";

export default function AdminUsers() {
  const { canManageUsers } = useAdminAuth();
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [stats, setStats] = useState({ registradas: 0, activasPorcentaje: 0, perfilesInfantiles: 0, perfilesPromedio: "0.0", leySanna: 0 });

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        if (!token) return navigate("/admin/login");

        const res = await fetch("http://localhost:3000/api/v1/admin/usuarios", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUsuarios(data);
          
          const statsRes = await axios.get(
            "http://localhost:3000/api/v1/admin/usuarios/stats",
            { headers: { Authorization: `Bearer ${token}` } },
          );
          setStats(statsRes.data);
        } else if (res.status === 401 || res.status === 403) {
          navigate("/admin/login");
        } else {
          const text = await res.text();
          alert(`Error cargando usuarios (${res.status}): ${text}`);
          setUsuarios([]);
        }
      } catch (e: any) {
        alert("Error de conexión con el backend: " + e.message);
        setUsuarios([]);
      }
    };
    fetchUsuarios();
  }, [navigate]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    rol: "user",
    estado_cuenta: "activo"
  });

  // ── Filtros ──
  const [filterStatus, setFilterStatus] = useState("Todos los estados");
  const [filterPrevision, setFilterPrevision] = useState("Toda previsión");
  const [filterRelation, setFilterRelation] = useState("Todas las relaciones");

  const filteredUsers = usuarios.filter((u) => {
    let matchStatus = true;
    let matchRelation = true;

    if (filterStatus !== "Todos los estados") {
      matchStatus = u.estado_cuenta === filterStatus;
    }
    
    // The "rol" field is used for relation (madre, padre, user, etc.)
    if (filterRelation !== "Todas las relaciones") {
      matchRelation = u.rol === filterRelation;
    }

    let matchPrevision = true;
    if (filterPrevision !== "Toda previsión") {
      matchPrevision = !!u.previsiones_bebes && u.previsiones_bebes.toLowerCase().includes(filterPrevision.toLowerCase());
    }

    return matchStatus && matchRelation && matchPrevision;
  });

  const handleOpenNew = () => {
    setFormData({
      nombre: "",
      apellidos: "",
      email: "",
      rol: "user",
      estado_cuenta: "activo"
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (user: any) => {
    setFormData({
      nombre: user.nombre || "",
      apellidos: user.apellidos || "",
      email: user.email || "",
      rol: user.rol || "madre",
      estado_cuenta: user.estado_cuenta || "activo",
    });
    setEditId(user.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "¿Estás seguro de que deseas eliminar este usuario? (Esta acción eliminará sus datos asociados)",
      )
    )
      return;
    try {
      const token = localStorage.getItem("admin_token");
      await axios.delete(`http://localhost:3000/api/v1/admin/usuarios/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsuarios(usuarios.filter((u) => u.id !== id));
    } catch (e) {
      alert("Error al eliminar usuario");
    }
  };

  const handleImpersonate = async (id: string) => {
    try {
      const adminToken = localStorage.getItem("admin_token");
      const res = await axios.post(
        `http://localhost:3000/api/v1/admin/usuarios/${id}/impersonate`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      const { user, token } = res.data;
      
      // Save normal user auth
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      localStorage.removeItem("selectedBabyId"); // Force profile selection
      
      // Dispatch storage event so tabs know
      window.dispatchEvent(new Event('storage'));
      
      // Open app in new tab
      window.open("/dashboard", "_blank");
    } catch (e) {
      alert("Error al acceder a la cuenta del usuario");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      if (isEditing) {
        await axios.put(
          `http://localhost:3000/api/v1/admin/usuarios/${editId}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } else {
        await axios.post(
          `http://localhost:3000/api/v1/admin/usuarios`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        alert("El usuario ha sido creado con éxito.");
      }
      setIsModalOpen(false);
      
      // Refetch usuarios
      const res = await axios.get(
        "http://localhost:3000/api/v1/admin/usuarios",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setUsuarios(res.data);
      
      const statsRes = await axios.get(
        "http://localhost:3000/api/v1/admin/usuarios/stats",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setStats(statsRes.data);
    } catch (e: any) {
      alert(e.response?.data?.error || "Error al actualizar usuario");
    }
  };

  return (
    <div className="admin-content-area">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Cuentas de usuario (App Familias)</h1>
        <div className="admin-breadcrumbs">
          Panel de administración / Gestión de cuentas / Usuarios
        </div>
      </div>

      {/* MÉTRICAS (Dinámicas desde Backend) */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "32px", overflowX: "auto" }}>
        
        <div style={{ flex: "1", background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minWidth: "200px" }}>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1F2937", marginBottom: "8px" }}>{stats.registradas}</div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>Cuentas registradas</div>
          <div style={{ fontSize: "11px", color: "#10B981", marginTop: "8px" }}>En base de datos</div>
        </div>

        <div style={{ flex: "1", background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minWidth: "200px" }}>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1F2937", marginBottom: "8px" }}>{stats.activasPorcentaje}%</div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>Cuentas activas</div>
          <div style={{ fontSize: "11px", color: "#10B981", marginTop: "8px" }}>Proporción activa</div>
        </div>

        <div style={{ flex: "1", background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minWidth: "200px" }}>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1F2937", marginBottom: "8px" }}>{stats.perfilesInfantiles}</div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>Perfiles infantiles</div>
          <div style={{ fontSize: "11px", color: "#10B981", marginTop: "8px" }}>{stats.perfilesPromedio} por cuenta promedio</div>
        </div>

        <div style={{ flex: "1", background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minWidth: "200px" }}>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#EAB308", marginBottom: "8px" }}>Ley Sanna</div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>{stats.leySanna} pendientes</div>
          <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "8px" }}>Trámites en curso</div>
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
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
          <select 
            className="admin-filter-select"
            value={filterPrevision}
            onChange={(e) => setFilterPrevision(e.target.value)}
          >
            <option value="Toda previsión">Toda previsión</option>
            <option value="Fonasa">Fonasa</option>
            <option value="Isapre">Isapre</option>
            <option value="FFAA">Fuerzas Armadas (Capredena/Dipreca)</option>
            <option value="Sin Previsión">Sin Previsión</option>
          </select>
          <select 
            className="admin-filter-select"
            value={filterRelation}
            onChange={(e) => setFilterRelation(e.target.value)}
          >
            <option value="Todas las relaciones">Todas las relaciones</option>
            <option value="madre">Madre</option>
            <option value="padre">Padre</option>
            <option value="tutor">Tutor</option>
            <option value="user">Usuario Genérico</option>
          </select>
        </div>
        {canManageUsers && (
          <button className="admin-btn" onClick={handleOpenNew}>+ Nueva cuenta</button>
        )}
      </div>

      <div className="admin-data-table-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Relación</th>
              <th>Género</th>
              <th>Previsión</th>
              <th>Estado</th>
              <th>Registro</th>
              {canManageUsers && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="admin-user-cell">
                    <div className="admin-avatar admin-avatar-blue">
                      {u.nombre ? u.nombre.substring(0, 1).toUpperCase() : "U"}
                    </div>
                    <div className="admin-user-info">
                      <span className="admin-user-name">
                        {u.nombre} {u.apellidos}
                      </span>
                      <span className="admin-user-id">ID: {u.id}</span>
                    </div>
                  </div>
                </td>
                <td className="text-gray-500">{u.email}</td>
                <td>{u.rol}</td>
                <td className="text-gray-500">
                  {u.cantidad_perfiles > 0
                    ? `${u.cantidad_perfiles} (${u.sexos_bebes})`
                    : "0"}
                </td>
                <td className="text-gray-500 text-sm">
                  {u.previsiones_bebes || "Sin Previsión"}
                </td>
                <td>
                  <span
                    className={`admin-status-badge ${u.estado_cuenta === "activo" ? "admin-status-active" : "admin-status-inactive"}`}
                  >
                    {u.estado_cuenta === "activo" ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="text-gray-500 text-sm">
                  {u.fecha_registro
                    ? new Date(u.fecha_registro).toLocaleDateString()
                    : ""}
                </td>
                {canManageUsers && (
                  <td>
                    <div className="admin-action-buttons">
                      <button
                        className="admin-btn-icon edit"
                        onClick={() => handleEdit(u)}
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
                        onClick={() => handleDelete(u.id)}
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
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                      <button
                        className="admin-btn-icon view"
                        onClick={() => handleImpersonate(u.id)}
                        title="Ingresar como usuario"
                        style={{ color: "#3B82F6", border: "1px solid #E5E7EB", borderRadius: "6px", background: "#EFF6FF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px" }}
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
                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                          <polyline points="10 17 15 12 10 7"></polyline>
                          <line x1="15" y1="12" x2="3" y2="12"></line>
                        </svg>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={canManageUsers ? 8 : 7} style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>
                  No hay cuentas que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="admin-pagination-container">
          <div>Mostrando {filteredUsers.length} cuentas</div>
          <div className="admin-pagination-controls">
            <button className="admin-page-btn active">1</button>
          </div>
        </div>
      </div>

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Usuario" : "Nuevo Usuario"}
      >
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>Nombre</label>
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
            <label>Apellidos</label>
            <input
              type="text"
              className="admin-form-control"
              required
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              value={formData.apellidos}
              onChange={(e) =>
                setFormData({ ...formData, apellidos: e.target.value })
              }
            />
          </div>
          <div className="admin-form-group">
            <label>Relación (Rol)</label>
            <input
              type="text"
              className="admin-form-control"
              required
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              value={formData.rol}
              onChange={(e) =>
                setFormData({ ...formData, rol: e.target.value })
              }
            />
          </div>
          <div className="admin-form-group">
            <label>Estado de Cuenta</label>
            <select
              className="admin-form-control"
              value={formData.estado_cuenta}
              onChange={(e) =>
                setFormData({ ...formData, estado_cuenta: e.target.value })
              }
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="suspendido">Suspendido</option>
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
