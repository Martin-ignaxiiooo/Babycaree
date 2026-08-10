import { useEffect, useState } from "react";
import { LogOut, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminTopbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const adminUser = localStorage.getItem("admin_user");
    if (adminUser) {
      setUser(JSON.parse(adminUser));
    } else {
      navigate("/admin/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    navigate("/admin/login");
  };

  if (!user) return <header className="admin-topbar"></header>;

  return (
    <header className="admin-topbar">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--admin-bd)" }}>
          Mantenedores
        </h2>
      </div>
      <div className="admin-user-profile">
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 600 }}>{user.nombre}</div>
          <div style={{ fontSize: "0.875rem", color: "#6B7280" }}>
            {user.rol.replace("_", " ").toUpperCase()}
          </div>
        </div>
        <UserCircle size={32} color="var(--admin-bd)" />
        <button
          onClick={handleLogout}
          className="ml-4 text-red-500 hover:text-red-700"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
