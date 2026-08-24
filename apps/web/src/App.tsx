import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import SeleccionarPerfil from "./pages/SeleccionarPerfil";
import Dashboard from "./pages/Dashboard";
import PerfilBebe from "./pages/PerfilBebe";
import InfoEmbarazoSemana from "./pages/InfoEmbarazoSemana";
import Galeria from "./pages/Galeria";
import Calendario from "./pages/Calendario";
import SaludMaterna from "./pages/SaludMaterna";
import RegistroDiario from "./pages/RegistroDiario";
import Salud from "./pages/Salud";
import Comunidad from "./pages/Comunidad";
import ForoDetalle from "./pages/ForoDetalle";
import ArticuloDetalle from "./pages/ArticuloDetalle";
import MiPerfil from "./pages/MiPerfil";
import Directorio from "./pages/Directorio";
import ForgotPassword from "./pages/ForgotPassword";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAdmins from "./pages/admin/AdminAdmins";
import AdminVacunas from "./pages/admin/AdminVacunas";
import AdminMedicos from "./pages/admin/AdminMedicos";
import AdminArticulos from "./pages/admin/AdminArticulos";
import AdminOMS from "./pages/admin/AdminOMS";
import AdminBitacora from "./pages/admin/AdminBitacora";
import AdminComunidad from "./pages/admin/AdminComunidad";
import AdminPrevision from "./pages/admin/AdminPrevision";
import AdminCentros from "./pages/admin/AdminCentros";
import AdminEspecialidades from "./pages/admin/AdminEspecialidades";
import ThemeSelector from "./components/ThemeSelector";
import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <ThemeSelector />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/registro" element={<Onboarding />} />
        <Route path="/seleccionar-perfil" element={<SeleccionarPerfil />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/perfil/:id" element={<PerfilBebe />} />
        <Route path="/embarazo/:id/info" element={<InfoEmbarazoSemana />} />
        <Route path="/galeria" element={<Galeria />} />
        <Route path="/diario" element={<RegistroDiario />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/mi-salud" element={<SaludMaterna />} />
        <Route path="/salud" element={<Salud />} />
        <Route path="/comunidad" element={<Comunidad />} />
        <Route path="/comunidad/foro/:id" element={<ForoDetalle />} />
        <Route path="/comunidad/articulo/:id" element={<ArticuloDetalle />} />
        <Route path="/directorio" element={<Directorio />} />
        <Route path="/mi-perfil" element={<MiPerfil />} />
        <Route path="/recuperar-contrasena" element={<ForgotPassword />} />

        {/* Rutas de Administración */}
        <Route
          path="/admin/panel"
          element={
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <AdminLayout>
              <AdminUsers />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/administradores"
          element={
            <AdminLayout>
              <AdminAdmins />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/vacunas"
          element={
            <AdminLayout>
              <AdminVacunas />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/medicos"
          element={
            <AdminLayout>
              <AdminMedicos />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/articulos"
          element={
            <AdminLayout>
              <AdminArticulos />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/bitacora"
          element={
            <AdminLayout>
              <AdminBitacora />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/prevision"
          element={
            <AdminLayout>
              <AdminPrevision />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/centros"
          element={
            <AdminLayout>
              <AdminCentros />
            </AdminLayout>
          }
        />
          <Route
            path="/admin/especialidades"
            element={
              <AdminLayout>
                <AdminEspecialidades />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/oms"
            element={
              <AdminLayout>
                <AdminOMS />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/comunidad"
            element={
              <AdminLayout>
                <AdminComunidad />
              </AdminLayout>
            }
          />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
