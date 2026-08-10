import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    usuarios: 0,
    bebes: 0,
    articulos: 0,
    medicos: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        if (!token) return navigate("/admin/login");
        const res = await axios.get(
          "https://babycare-backend-msyq.onrender.com/api/v1/admin/dashboard/stats",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setStats(res.data);
      } catch (e: any) {
        if (e.response?.status === 401 || e.response?.status === 403)
          navigate("/admin/login");
      }
    };
    fetchStats();
  }, [navigate]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Resumen General</h1>
      </div>

      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <h3>Total Usuarios</h3>
          <div className="value">{stats.usuarios}</div>
        </div>
        <div className="admin-kpi-card">
          <h3>Bebés Registrados</h3>
          <div className="value">{stats.bebes}</div>
        </div>
        <div className="admin-kpi-card">
          <h3>Artículos Publicados</h3>
          <div className="value">{stats.articulos}</div>
        </div>
        <div
          className="admin-kpi-card"
          style={{ borderLeftColor: "var(--admin-success)" }}
        >
          <h3>Médicos Verificados</h3>
          <div className="value">{stats.medicos}</div>
        </div>
      </div>

      <div className="admin-data-table-container mt-8 p-4">
        <h3 className="text-lg font-bold mb-4">
          Bienvenido al Panel de Administración
        </h3>
        <p className="text-gray-600">
          Usa el menú lateral para navegar entre los distintos mantenedores.
          Recuerda que todas tus acciones quedan registradas en la Bitácora de
          Auditoría.
        </p>
      </div>
    </div>
  );
}
