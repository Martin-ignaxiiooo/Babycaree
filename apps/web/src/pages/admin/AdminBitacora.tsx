import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminBitacora() {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        if (!token) return navigate("/admin/login");
        const res = await axios.get(
          "https://babycare-backend-msyq.onrender.com/api/v1/admin/bitacora",
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
    fetchData();
  }, [navigate]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-purple-600" /> Bitácora de Auditoría
          </h1>
          <p className="text-gray-600 text-sm">
            Registro inmutable de todas las acciones administrativas
          </p>
        </div>
      </div>

      <div className="admin-data-table-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Administrador</th>
              <th>Acción</th>
              <th>Tabla Afectada</th>
              <th>Registro ID</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td className="font-medium text-gray-900">
                  {new Date(item.fecha_hora_utc).toLocaleString()}
                </td>
                <td>
                  {item.admin_nombre} ({item.rol})
                </td>
                <td>
                  <span
                    className={`admin-status-badge ${item.accion === "CREATE" ? "admin-status-active" : item.accion === "DELETE" ? "admin-status-inactive" : "bg-blue-100 text-blue-800"}`}
                  >
                    {item.accion}
                  </span>
                </td>
                <td>{item.tabla_afectada}</td>
                <td
                  className="text-sm font-mono text-gray-500"
                  style={{
                    maxWidth: "200px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.id_registro}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  No hay registros de auditoría
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
