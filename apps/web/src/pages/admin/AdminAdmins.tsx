import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminModal from "../../components/admin/AdminModal";
import { useAdminAuth } from "../../hooks/useAdminAuth";

export default function AdminAdmins() {
  const { isAdminGeneral } = useAdminAuth();
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<any[]>([]);
  const [stats, setStats] = useState({ totales: 0, activas: 0, adminGeneral: 0, accionesSemana: 0 });

  const fetchAdminsData = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) return navigate("/admin/login");

      const res = await fetch("http://localhost:3000/api/v1/admin/administradores", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAdmins(data);

        const statsRes = await axios.get(
          "http://localhost:3000/api/v1/admin/administradores/stats",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStats(statsRes.data);
      } else if (res.status === 401 || res.status === 403) {
        navigate("/admin/login");
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAdminsData();
  }, [navigate]);

  // ── Estado del modal de edición ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [formData, setFormData] = useState({
    nombre_completo: "",
    correo_corporativo: "",
    rol: "admin_general",
    requiere_2fa: true,
    estado: "activo",
  });

  // ── Estado del modal de contraseña ──
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordEditId, setPasswordEditId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [adminName, setAdminName] = useState("");

  // ── Filtros ──
  const [filterRole, setFilterRole] = useState("Todos los roles");
  const [filterStatus, setFilterStatus] = useState("Todos los estados");

  const filteredAdmins = admins.filter((admin) => {
    let matchRole = true;
    let matchStatus = true;

    if (filterRole !== "Todos los roles") {
      matchRole = admin.rol === filterRole;
    }
    if (filterStatus !== "Todos los estados") {
      matchStatus = admin.estado === filterStatus;
    }

    return matchRole && matchStatus;
  });

  const handleOpenNew = () => {
    setFormData({
      nombre_completo: "",
      correo_corporativo: "",
      rol: "admin_general",
      requiere_2fa: true,
      estado: "activo",
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (admin: any) => {
    setFormData({
      nombre_completo: admin.nombre_completo || "",
      correo_corporativo: admin.correo_corporativo || "",
      rol: admin.rol || "admin_general",
      requiere_2fa: admin.requiere_2fa,
      estado: admin.estado || "activo",
    });
    setEditId(admin.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleOpenPasswordModal = (admin: any) => {
    setPasswordEditId(admin.id);
    setAdminName(admin.nombre_completo || "este administrador");
    setNewPassword("");
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    try {
      const token = localStorage.getItem("admin_token");
      await axios.put(
        `http://localhost:3000/api/v1/admin/administradores/${passwordEditId}/password`,
        { nueva_contrasena: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Contraseña actualizada con éxito");
      setIsPasswordModalOpen(false);
    } catch (e: any) {
      alert(e.response?.data?.error || "Error al actualizar contraseña.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este administrador?")) return;
    try {
      const token = localStorage.getItem("admin_token");
      await axios.delete(`http://localhost:3000/api/v1/admin/administradores/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins(admins.filter((a) => a.id !== id));
    } catch (e) {
      alert("Error al eliminar administrador (puede que sea admin_general y no se pueda eliminar)");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      if (isEditing) {
        await axios.put(
          `http://localhost:3000/api/v1/admin/administradores/${editId}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `http://localhost:3000/api/v1/admin/administradores`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Contraseña predeterminada para el nuevo usuario: temporal2026");
      }
      setIsModalOpen(false);
      fetchAdminsData();
    } catch (e: any) {
      alert(e.response?.data?.error || "Error al actualizar administrador");
    }
  };

  return (
    <div className="admin-content-area">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Administradores</h1>
        <div className="admin-breadcrumbs">
          Panel de administración / Gestión de cuentas / Administradores
        </div>
      </div>

      <div className="admin-info-banner">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        Solo el <strong>Administrador General</strong> puede crear, editar o eliminar cuentas de administradores. Cada acción sobre esta tabla queda registrada en la bitácora de auditoría, incluyendo cambios de rol y reseteos de contraseña.
      </div>



      <div className="admin-table-toolbar">
        <div className="admin-filters">
          <select 
            className="admin-filter-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="Todos los roles">Todos los roles</option>
            <option value="admin_general">Admin General</option>
            <option value="auditor">Auditor</option>
            <option value="soporte_cliente">Soporte Cliente</option>
            <option value="editor_contenido">Editor Contenido</option>
          </select>
          <select 
            className="admin-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Todos los estados">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="bloqueado">Bloqueado</option>
          </select>
        </div>
        {isAdminGeneral && (
          <button className="admin-btn" onClick={handleOpenNew}>+ Nuevo administrador</button>
        )}
      </div>

      <div className="admin-data-table-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>ADMINISTRADOR</th>
              <th>CORREO CORPORATIVO</th>
              <th>ROL</th>
              <th>2FA</th>
              <th>ÚLTIMO ACCESO</th>
              <th>ESTADO</th>
              {isAdminGeneral && <th>ACCIONES</th>}
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.map((admin) => (
              <tr key={admin.id}>
                <td>
                  <div className="admin-user-cell">
                    <div className="admin-avatar admin-avatar-purple">
                      {admin.nombre_completo ? admin.nombre_completo.substring(0, 2).toUpperCase() : "A"}
                    </div>
                    <div className="admin-user-info">
                      <span className="admin-user-name">{admin.nombre_completo}</span>
                      <span className="admin-user-id">ID: {admin.id ? admin.id.toString().substring(0, 8) : ""}</span>
                    </div>
                  </div>
                </td>
                <td className="text-gray-500">{admin.correo_corporativo}</td>
                <td>
                  <span className={`admin-cat-badge ${admin.rol === "admin_general" ? "admin-cat-blue" : "admin-cat-gray"}`}>
                    {admin.rol === "admin_general" ? "Administrador General" : (admin.rol || "").replace("_", " ")}
                  </span>
                </td>
                <td>
                  <span className={admin.requiere_2fa ? "text-green-600 font-bold" : "text-gray-400 font-bold"}>
                    {admin.requiere_2fa ? "Activado" : "Desactivado"}
                  </span>
                </td>
                <td className="text-gray-500 text-sm">
                  {admin.ultimo_acceso ? new Date(admin.ultimo_acceso).toLocaleDateString() : "Nunca"}
                </td>
                <td>
                  <span className={`admin-status-badge ${admin.estado === "activo" ? "admin-status-active" : "admin-status-blocked"}`}>
                    {admin.estado === "activo" ? "Activo" : "Bloqueado"}
                  </span>
                </td>
                {isAdminGeneral && (
                  <td>
                    <div className="admin-action-buttons">
                      {/* Editar */}
                      <button className="admin-btn-icon edit" onClick={() => handleEdit(admin)} title="Editar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </button>
                      {/* Cambiar contraseña */}
                      <button className="admin-btn-icon key" onClick={() => handleOpenPasswordModal(admin)} title="Cambiar contraseña">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                        </svg>
                      </button>
                      {/* Eliminar */}
                      <button className="admin-btn-icon delete" onClick={() => handleDelete(admin.id)} title="Eliminar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            {filteredAdmins.length === 0 && (
              <tr>
                <td colSpan={isAdminGeneral ? 7 : 6} style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>
                  No hay administradores que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="admin-pagination-container">
          <div>Mostrando {filteredAdmins.length} administradores</div>
          <div className="admin-pagination-controls">
            <button className="admin-page-btn active">1</button>
          </div>
        </div>
      </div>

      {/* Modal: Crear / Editar administrador */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Administrador" : "Nuevo Administrador"}
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
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              value={formData.nombre_completo}
              onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
            />
          </div>
          <div className="admin-form-group">
            <label>Correo Corporativo</label>
            <input
              type="email"
              className="admin-form-control"
              required
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              value={formData.correo_corporativo}
              onChange={(e) => setFormData({ ...formData, correo_corporativo: e.target.value })}
            />
          </div>
          <div className="admin-form-group">
            <label>Rol</label>
            <select
              className="admin-form-control"
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
            >
              <option value="admin_general">Admin General</option>
              <option value="auditor">Auditor</option>
              <option value="soporte_cliente">Soporte Cliente</option>
              <option value="editor_contenido">Editor Contenido</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label>Estado</label>
            <select
              className="admin-form-control"
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            >
              <option value="activo">Activo</option>
              <option value="bloqueado">Bloqueado</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
            <button type="button" className="admin-btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="admin-btn">
              Guardar
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Modal: Cambiar contraseña */}
      <AdminModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={`Cambiar Contraseña: ${adminName}`}
      >
        <form onSubmit={handlePasswordSubmit}>
          <div className="admin-form-group">
            <label>Nueva Contraseña</label>
            <input
              type="password"
              className="admin-form-control"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Por favor completa este campo")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
              minLength={6}
            />
          </div>
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
            <button type="button" className="admin-btn-secondary" onClick={() => setIsPasswordModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="admin-btn">
              Actualizar Contraseña
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
