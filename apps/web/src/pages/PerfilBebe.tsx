import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import CryptoJS from "crypto-js";
import { 
  ArrowLeft, Camera, User, Search, Lock, Bell, IdCard
} from "lucide-react";
import TopNav from "../components/TopNav";
import DateSelect from "../components/DateSelect";
import CarnetDigital from "../components/CarnetDigital";

export default function PerfilBebe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get("tab") as "detalle" | "compartir" | null;
  const [activeTab, setActiveTab] = useState<"detalle" | "compartir">(tabParam || "detalle");
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab") as "detalle" | "compartir" | null;
    if (tab === "detalle" || tab === "compartir") {
      setActiveTab(tab);
    }
  }, [location.search]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [perfil, setPerfil] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  
  const [accesos, setAccesos] = useState<any[]>([]);
  const [auditoria, setAuditoria] = useState<any[]>([]);
  const [previsiones, setPrevisiones] = useState<any[]>([]);
  
  const [showConfirmGestation, setShowConfirmGestation] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [showCarnet, setShowCarnet] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTab, setSearchTab] = useState<"todos" | "contactos" | "familia">("todos");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedInvite, setSelectedInvite] = useState<any>(null);
  const [invitePerm, setInvitePerm] = useState("solo_lectura");
  


  const [errorPerfil, setErrorPerfil] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://babycare-backend-msyq.onrender.com/api/v1/directorio/previsiones")
      .then(r => r.json())
      .then(data => setPrevisiones(data))
      .catch(e => console.error("Error fetching previsiones", e));
  }, []);

  useEffect(() => {
    if (token && id) {
      fetchPerfil();
      if (activeTab === "compartir") {
        fetchAccesos();
        fetchAuditoria();
      }
    }
  }, [token, id, activeTab]);

  const fetchPerfil = async () => {
    try {
      const res = await fetch(`https://babycare-backend-msyq.onrender.com/api/v1/perfiles-bebe/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPerfil(data);
        setEditData(data);
        setErrorPerfil(null);
      } else {
        const err = await res.json();
        setErrorPerfil(err.error || "No se pudo cargar el perfil del bebé.");
      }
    } catch (error) {
      console.error(error);
      setErrorPerfil("Error de red al intentar conectar con el servidor.");
    }
  };

  const fetchAccesos = async () => {
    try {
      const res = await fetch(`https://babycare-backend-msyq.onrender.com/api/v1/perfiles-bebe/${id}/accesos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setAccesos(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAuditoria = async () => {
    try {
      const res = await fetch(`https://babycare-backend-msyq.onrender.com/api/v1/perfiles-bebe/${id}/auditoria`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setAuditoria(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSave = async (confirmado = false) => {
    try {
      const res = await fetch(`https://babycare-backend-msyq.onrender.com/api/v1/perfiles-bebe/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...editData, confirmado })
      });

      if (res.status === 409) {
        setShowConfirmGestation(true);
        setPendingSave(true);
        return;
      }

      if (res.ok) {
        setEditMode(false);
        fetchPerfil();
        setShowConfirmGestation(false);
        setPendingSave(false);
        alert("Cambios guardados exitosamente.");
      } else {
        const err = await res.json();
        alert(err.error || "Error al guardar los cambios.");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión al guardar.");
    }
  };



  const buscarPersonas = async (query = searchQuery, fuente = searchTab) => {
    try {
      if (!query && fuente !== "todos") {
        setSearchResults([]);
        return;
      }
      const res = await fetch(`https://babycare-backend-msyq.onrender.com/api/v1/personas/buscar?q=${encodeURIComponent(query)}&fuente=${fuente}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSearchResults(await res.json());
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSincronizarContactos = async () => {
    const mockContacts = [
      { email: "prueba@iniciativababy.cl", name: "Contacto Prueba" },
      { email: "admin2@correo.cl", name: "Admin 2" }
    ];
    const hashes = mockContacts.map(c => CryptoJS.SHA256(c.email.trim().toLowerCase()).toString(CryptoJS.enc.Hex));
    
    try {
      const res = await fetch(`https://babycare-backend-msyq.onrender.com/api/v1/personas/sincronizar-contactos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ hashes })
      });
      if (res.ok) {
        alert("Contactos sincronizados. Busca en 'Mis contactos'.");
        setSearchTab("contactos");
        buscarPersonas("", "contactos");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleInvitar = async (targetEmail?: string) => {
    const correo = targetEmail || (selectedInvite ? selectedInvite.email : searchQuery);
    if (!correo) return;
    setIsInviting(true);
    try {
      const res = await fetch(`https://babycare-backend-msyq.onrender.com/api/v1/perfiles-bebe/${id}/accesos/invitar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          correo_invitado: correo,
          nivel_permiso: invitePerm
        })
      });
      if (res.ok) {
        alert("Invitación enviada");
        setSelectedInvite(null);
        setSearchQuery("");
        fetchAccesos();
        fetchAuditoria();
      } else {
         const err = await res.json();
         alert(err.error || "Error al invitar.");
      }
    } catch (error) {
      console.error(error);
      alert("Error de red al intentar invitar.");
    } finally {
      setIsInviting(false);
    }
  };

  const revocarAcceso = async (idAcceso: string) => {
    if (!window.confirm("¿Seguro que deseas revocar este acceso?")) return;
    try {
      const res = await fetch(`https://babycare-backend-msyq.onrender.com/api/v1/perfiles-bebe/${id}/accesos/${idAcceso}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAccesos();
        fetchAuditoria();
      } else {
        const err = await res.json();
        alert(err.error || "Error al revocar");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const modificarPermiso = async (idAcceso: string, nivel_permiso: string) => {
    try {
      const res = await fetch(`https://babycare-backend-msyq.onrender.com/api/v1/perfiles-bebe/${id}/accesos/${idAcceso}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nivel_permiso })
      });
      if (res.ok) {
        fetchAccesos();
        fetchAuditoria();
      } else {
        const err = await res.json();
        alert(err.error || "Error al modificar permiso");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const inputStyle = { width: "100%", padding: "12px", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "14px", outline: "none", color: "var(--theme-darker)" };
  const readOnlyStyle = { padding: "12px", background: "var(--theme-bg-light)", borderRadius: "8px", fontSize: "14px", color: "var(--theme-darker)", border: "1px dashed var(--theme-primary)" };
  const cardStyle = { background: "#fff", padding: "24px", borderRadius: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: "24px", width: "100%" };
  const labelStyle = { display: "block", fontSize: "12px", fontWeight: 700, color: "#6B7280", marginBottom: "6px" };

  if (errorPerfil) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F8F7FC", padding: "20px" }}>
           <h2 style={{ color: "#EF4444", marginBottom: "16px" }}>Error al cargar el perfil</h2>
           <p style={{ color: "#6B7280", marginBottom: "24px" }}>{errorPerfil}</p>
           <button style={{ background: "var(--theme-primary)", color: "#fff", padding: "12px 24px", borderRadius: "12px", fontWeight: 700 }} onClick={() => fetchPerfil()}>Intentar de nuevo</button>
           <button style={{ marginTop: "16px", background: "transparent", border: "1px solid var(--theme-primary)", color: "var(--theme-primary)", padding: "12px 24px", borderRadius: "12px", fontWeight: 700 }} onClick={() => navigate("/dashboard")}>Volver al Inicio</button>
      </div>
    );
  }

  if (!perfil) return <div style={{ padding: "40px", textAlign: "center", color: "var(--theme-primary)" }}>Cargando perfil...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7FC", fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column" }}>
      
      {/* ── TOP NAV GLOBAL ── */}
      <TopNav user={user} activePath="/dashboard" />

      {/* ── PERFIL HEADER (Full width) ── */}
      <div style={{ background: "linear-gradient(135deg, var(--theme-darker) 0%, var(--theme-dark) 100%)", color: "#fff", padding: "48px 40px 0" }}>
        <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "none", color: "var(--theme-light)", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
          <ArrowLeft size={16} /> Volver al Dashboard
        </button>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ width: "96px", height: "96px", borderRadius: "50%", background: "var(--theme-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", border: "4px solid var(--theme-primary)" }}>
              👶
            </div>
            <div>
              <h1 style={{ fontSize: "36px", fontWeight: 900, margin: 0 }}>{perfil.nombre}</h1>
              <div style={{ fontSize: "16px", color: "var(--theme-bg-light)", marginTop: "4px" }}>Apodo: {perfil.apodo || "No definido"}</div>
            </div>
          </div>

          {activeTab === "detalle" && (
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                style={{ background: !editMode ? "#fff" : "transparent", color: !editMode ? "var(--theme-darker)" : "#fff", border: "2px solid #fff", padding: "10px 24px", borderRadius: "24px", fontSize: "15px", fontWeight: 800, cursor: "pointer", transition: "0.2s" }}
                onClick={() => setEditMode(false)}
              >
                👁️ Vista de lectura
              </button>
              <button 
                style={{ background: editMode ? "#fff" : "transparent", color: editMode ? "var(--theme-darker)" : "#fff", border: "2px solid #fff", padding: "10px 24px", borderRadius: "24px", fontSize: "15px", fontWeight: 800, cursor: "pointer", transition: "0.2s" }}
                onClick={() => setEditMode(true)}
              >
                ✏️ Editar Perfil
              </button>
            </div>
          )}
        </div>

        {/* TABS CONTAINER */}
        <div style={{ display: "flex", gap: "32px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <button 
            style={{ padding: "16px 0", background: "none", border: "none", borderBottom: activeTab === "detalle" ? "3px solid #fff" : "3px solid transparent", color: activeTab === "detalle" ? "#fff" : "rgba(255,255,255,0.6)", fontSize: "16px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            onClick={() => { setActiveTab("detalle"); navigate(`/perfil/${id}?tab=detalle`, { replace: true }); }}
          >
            <User size={18} /> Datos del bebé
          </button>
          <button 
            style={{ padding: "16px 0", background: "none", border: "none", borderBottom: activeTab === "compartir" ? "3px solid #fff" : "3px solid transparent", color: activeTab === "compartir" ? "#fff" : "rgba(255,255,255,0.6)", fontSize: "16px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            onClick={() => { setActiveTab("compartir"); navigate(`/perfil/${id}?tab=compartir`, { replace: true }); }}
          >
            <Lock size={18} /> Compartir acceso
          </button>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="page-container" style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}>
        
        {activeTab === "detalle" && (
          <div style={{ width: "100%" }}>
            
            {editMode && (
              <div style={{ background: "var(--theme-bg-light)", borderLeft: "4px solid var(--theme-primary)", padding: "16px 20px", borderRadius: "0 12px 12px 0", marginBottom: "32px", display: "flex", gap: "16px" }}>
                <div style={{ fontSize: "24px" }}>✏️</div>
                <div>
                  <h4 style={{ fontSize: "16px", color: "var(--theme-darker)", margin: "0 0 4px", fontWeight: 800 }}>Modo edición activo</h4>
                  <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>Modifica los datos y recuerda presionar "Guardar cambios" al final de la página.</p>
                </div>
              </div>
            )}

            <div className="responsive-grid">
              {/* DATOS GENERALES */}
              <div style={cardStyle}>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--theme-darker)", marginBottom: "20px", borderBottom: "1px solid #E5E7EB", paddingBottom: "12px" }}>Datos Generales</h3>
                
                <div style={{ marginBottom: "16px" }}>
                  <label style={labelStyle}>Nombre completo</label>
                  {editMode ? <input type="text" name="nombre" value={editData.nombre || ""} onChange={handleChange} style={inputStyle} /> : <div style={readOnlyStyle}>{perfil.nombre}</div>}
                </div>
                
                <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Apodo</label>
                    {editMode ? <input type="text" name="apodo" value={editData.apodo || ""} onChange={handleChange} style={inputStyle} /> : <div style={readOnlyStyle}>{perfil.apodo || "-"}</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Sexo registrado</label>
                    {editMode ? (
                      <select name="sexo" value={editData.sexo || ""} onChange={handleChange} style={inputStyle}>
                        <option value="">Seleccione</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="No especificado">No especificado</option>
                      </select>
                    ) : (
                      <div style={readOnlyStyle}>{perfil.sexo || "-"}</div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Fecha de nacimiento</label>
                    {editMode ? <DateSelect value={editData.fecha_nacimiento ? editData.fecha_nacimiento.split('T')[0] : ""} onChange={(isoDate) => setEditData({ ...editData, fecha_nacimiento: isoDate })} max={new Date().toISOString().split('T')[0]} variant="light" /> : <div style={readOnlyStyle}>{perfil.fecha_nacimiento ? new Date(perfil.fecha_nacimiento).toLocaleDateString('es-CL') : "-"}</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Previsión de salud</label>
                    {editMode ? (
                      <select name="prevision_salud" value={editData.prevision_salud || ""} onChange={handleChange} style={inputStyle}>
                        <option value="">Seleccione</option>
                        {previsiones.map(p => (
                          <option key={p.codigo} value={p.codigo}>{p.nombre_visible}</option>
                        ))}
                      </select>
                    ) : (
                      <div style={readOnlyStyle}>{perfil.nombre_prevision || perfil.prevision_salud || "-"}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* DATOS DE NACIMIENTO */}
              <div style={cardStyle}>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--theme-darker)", marginBottom: "20px", borderBottom: "1px solid #E5E7EB", paddingBottom: "12px" }}>Datos de Nacimiento</h3>
                
                <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Peso al nacer (g)</label>
                    {editMode ? <input type="number" name="peso_nacimiento_g" value={editData.peso_nacimiento_g || ""} onChange={handleChange} style={inputStyle} /> : <div style={readOnlyStyle}>{perfil.peso_nacimiento_g || "-"}</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Talla al nacer (cm)</label>
                    {editMode ? <input type="number" name="talla_nacimiento_cm" value={editData.talla_nacimiento_cm || ""} onChange={handleChange} style={inputStyle} /> : <div style={readOnlyStyle}>{perfil.talla_nacimiento_cm || "-"}</div>}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Semanas de gestación al nacer</label>
                  {editMode ? <input type="number" name="semanas_gestacion_nac" value={editData.semanas_gestacion_nac || ""} onChange={handleChange} style={inputStyle} /> : <div style={readOnlyStyle}>{perfil.semanas_gestacion_nac || "-"}</div>}
                </div>
              </div>

              {/* INFORMACIÓN DE SALUD */}
              <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--theme-darker)", marginBottom: "20px", borderBottom: "1px solid #E5E7EB", paddingBottom: "12px" }}>Información Médica</h3>
                
                <div className="hero-stats-grid" style={{ marginBottom: "24px" }}>
                  <div>
                    <label style={labelStyle}>Tipo de sangre</label>
                    {editMode ? (
                      <select name="tipo_sangre" value={editData.tipo_sangre || ""} onChange={handleChange} style={inputStyle}>
                        <option value="">Seleccione</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="No se">No sé</option>
                      </select>
                    ) : (
                      <div style={readOnlyStyle}>{perfil.tipo_sangre || "-"}</div>
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>Pediatra de cabecera</label>
                    {editMode ? <input type="text" name="pediatra_nombre" value={editData.pediatra_nombre || ""} onChange={handleChange} style={inputStyle} /> : <div style={readOnlyStyle}>{perfil.pediatra_nombre || "-"}</div>}
                  </div>
                  <div>
                    <label style={labelStyle}>Centro de salud</label>
                    {editMode ? <input type="text" name="centro_salud" value={editData.centro_salud || ""} onChange={handleChange} style={inputStyle} /> : <div style={readOnlyStyle}>{perfil.centro_salud || "-"}</div>}
                  </div>
                </div>

                <div className="hero-stats-grid">
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Alergias conocidas</label>
                    {editMode ? <textarea name="alergias" rows={3} value={editData.alergias || ""} onChange={handleChange} style={inputStyle}></textarea> : <div style={{ ...readOnlyStyle, minHeight: "80px" }}>{perfil.alergias || "-"}</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Condiciones médicas crónicas</label>
                    {editMode ? <textarea name="condiciones_cronicas" rows={3} value={editData.condiciones_cronicas || ""} onChange={handleChange} style={inputStyle}></textarea> : <div style={{ ...readOnlyStyle, minHeight: "80px" }}>{perfil.condiciones_cronicas || "-"}</div>}
                  </div>
                </div>
              </div>

              {/* CARNET DIGITAL: RUT Y CONTACTO DE EMERGENCIA */}
              <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--theme-darker)", marginBottom: "6px", borderBottom: "1px solid #E5E7EB", paddingBottom: "12px" }}>Carnet Digital</h3>
                <p style={{ fontSize: "13px", color: "#8A849C", margin: "10px 0 20px" }}>Estos datos aparecen en el carnet pediátrico digital que puedes mostrar en el consultorio.</p>

                <div className="hero-stats-grid" style={{ marginBottom: "16px" }}>
                  <div>
                    <label style={labelStyle}>RUT del bebé (opcional)</label>
                    {editMode ? <input type="text" name="rut" placeholder="12.345.678-9" value={editData.rut || ""} onChange={handleChange} style={inputStyle} /> : <div style={readOnlyStyle}>{perfil.rut || "-"}</div>}
                  </div>
                  <div>
                    <label style={labelStyle}>Contacto de emergencia — nombre</label>
                    {editMode ? <input type="text" name="contacto_emergencia_nombre" value={editData.contacto_emergencia_nombre || ""} onChange={handleChange} style={inputStyle} /> : <div style={readOnlyStyle}>{perfil.contacto_emergencia_nombre || "-"}</div>}
                  </div>
                  <div>
                    <label style={labelStyle}>Contacto de emergencia — teléfono</label>
                    {editMode ? <input type="tel" name="contacto_emergencia_telefono" placeholder="+56 9 1234 5678" value={editData.contacto_emergencia_telefono || ""} onChange={handleChange} style={inputStyle} /> : <div style={readOnlyStyle}>{perfil.contacto_emergencia_telefono || "-"}</div>}
                  </div>
                </div>

                {!editMode && (
                  <button
                    type="button"
                    onClick={() => setShowCarnet(true)}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      background: "var(--theme-bg-light)", color: "var(--theme-primary)",
                      border: "none", borderRadius: "12px", padding: "12px 20px",
                      fontWeight: 800, fontSize: "14px", cursor: "pointer",
                    }}
                  >
                    <IdCard size={18} />
                    Ver carnet digital
                  </button>
                )}
              </div>
            </div>

            {editMode && (
              <div style={{ textAlign: "right", marginTop: "16px" }}>
                <button 
                  style={{ background: "var(--theme-primary)", color: "#fff", border: "none", padding: "16px 40px", borderRadius: "12px", fontSize: "16px", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 12px rgba(124,92,191,0.3)" }}
                  onClick={() => handleSave(false)}
                >
                  💾 Guardar todos los cambios
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "compartir" && (
          <div className="responsive-grid" style={{ width: "100%" }}>
            
            {/* LEFT COLUMN: LIST & SEARCH */}
            <div>
              <div style={{ background: "#FFFBEB", borderLeft: "4px solid #F59E0B", padding: "16px 20px", borderRadius: "0 12px 12px 0", marginBottom: "32px", display: "flex", gap: "16px" }}>
                <div style={{ fontSize: "24px" }}>🔒</div>
                <div>
                  <h4 style={{ fontSize: "16px", color: "#92400E", margin: "0 0 4px", fontWeight: 800 }}>Tú controlas quién ve los datos</h4>
                  <p style={{ fontSize: "14px", color: "#92400E", margin: 0 }}>Solo tú puedes invitar, cambiar permisos o revocar accesos de familiares.</p>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--theme-darker)", margin: 0 }}>Personas con acceso</h3>
                  <div style={{ fontSize: "12px", background: "var(--theme-bg-light)", color: "var(--theme-darker)", padding: "4px 12px", borderRadius: "12px", fontWeight: 800 }}>{accesos.length} activos</div>
                </div>

                {accesos.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>
                    Aún no has compartido el acceso con nadie.
                  </div>
                ) : (
                  accesos.map(acceso => (
                    <div key={acceso.id} style={{ display: "flex", alignItems: "center", padding: "16px", border: "1px solid #E5E7EB", borderRadius: "12px", marginBottom: "12px" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--theme-bg-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", marginRight: "16px" }}>🧑‍.</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--theme-darker)" }}>{acceso.usuario_invitado?.nombre || "Usuario"}</div>
                        <div style={{ fontSize: "13px", color: "#6B7280" }}>{acceso.usuario_invitado?.email}</div>
                      </div>
                      <select value={acceso.nivel_permiso} onChange={(e) => modificarPermiso(acceso.id, e.target.value)} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "#F9FAFB", color: "var(--theme-darker)", fontWeight: 700, marginRight: "16px" }}>
                        <option value="solo_lectura">Solo lectura</option>
                        <option value="papa">Papá (Acceso a todo)</option>
                        <option value="abuela">Abuela (Acceso a todo)</option>
                        <option value="ver_editar">Ver y editar</option>
                      </select>
                      <button onClick={() => revocarAcceso(acceso.id)} style={{ background: "#FEE2E2", color: "#EF4444", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Revocar</button>
                    </div>
                  ))
                )}
              </div>

              <div style={cardStyle}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "18px", fontWeight: 800, color: "var(--theme-darker)", marginBottom: "20px" }}>
                  <Search size={20} style={{ color: "var(--theme-primary)" }} /> Buscar a quién compartir
                </h3>
                
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  <button onClick={() => setSearchTab("todos")} style={{ flex: 1, padding: "10px", borderRadius: "12px", border: "none", background: searchTab === "todos" ? "var(--theme-primary)" : "#F3F4F6", color: searchTab === "todos" ? "#fff" : "#4B5563", fontWeight: 700, cursor: "pointer" }}>Todos</button>
                  <button onClick={() => setSearchTab("contactos")} style={{ flex: 1, padding: "10px", borderRadius: "12px", border: "1px solid #E5E7EB", background: searchTab === "contactos" ? "var(--theme-primary)" : "#F9FAFB", color: searchTab === "contactos" ? "#fff" : "#4B5563", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>📱 Mis contactos</button>
                  <button onClick={() => setSearchTab("familia")} style={{ flex: 1, padding: "10px", borderRadius: "12px", border: "1px solid #E5E7EB", background: searchTab === "familia" ? "var(--theme-primary)" : "#F9FAFB", color: searchTab === "familia" ? "#fff" : "#4B5563", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>👥 Otros perfiles</button>
                </div>
                
                <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "24px" }}>Busca entre tus contactos, familiares ya registrados en Iniciativa Baby, o escribe un correo para invitar a alguien nuevo.</p>

                <div style={{ position: "relative", marginBottom: "24px" }}>
                  <Search size={20} style={{ position: "absolute", left: "16px", top: "14px", color: "#9CA3AF" }} />
                  <input 
                    type="text" 
                    placeholder="Busca por nombre o correo electrónico..." 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.length > 2) buscarPersonas(e.target.value);
                    }}
                    style={{ width: "100%", padding: "14px 16px 14px 48px", borderRadius: "12px", border: "1px solid #E5E7EB", fontSize: "15px", outline: "none", color: "var(--theme-darker)" }}
                  />
                </div>

                {searchResults.length > 0 && (
                  <div>
                    {searchResults.map(res => (
                      <div key={res.email} style={{ display: "flex", alignItems: "center", padding: "12px", borderBottom: "1px solid #F3F4F6" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--theme-bg-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", marginRight: "12px" }}>🧑</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--theme-darker)" }}>
                            {res.nombre || "Usuario"} 
                            {res.en_app && <span style={{ marginLeft: "8px", fontSize: "10px", background: "#D1FAE5", color: "#065F46", padding: "2px 8px", borderRadius: "12px" }}>En la app</span>}
                          </div>
                          <div style={{ fontSize: "13px", color: "#6B7280" }}>{res.email}</div>
                        </div>
                        <select 
                          value={invitePerm} 
                          onChange={e => setInvitePerm(e.target.value)} 
                          style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "#F9FAFB", color: "var(--theme-darker)", fontWeight: 700, marginRight: "12px", fontSize: "12px" }}
                        >
                          <option value="solo_lectura">Solo lectura</option>
                          <option value="papa">Papá (Acceso a todo)</option>
                          <option value="abuela">Abuela (Acceso a todo)</option>
                          <option value="ver_editar">Ver y editar</option>
                        </select>
                        <button 
                          onClick={() => { setSelectedInvite(res); handleInvitar(res.email); }} 
                          disabled={isInviting}
                          style={{ background: "var(--theme-primary)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "20px", fontWeight: 700, cursor: isInviting ? "not-allowed" : "pointer", fontSize: "13px", opacity: isInviting ? 0.6 : 1 }}
                        >
                          {isInviting ? "Enviando..." : "Invitar"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {searchQuery.includes("@") && searchQuery.includes(".") && !searchResults.some(res => res.email.toLowerCase() === searchQuery.trim().toLowerCase()) && (
                  <div style={{ display: "flex", alignItems: "center", padding: "12px", borderBottom: "1px solid #F3F4F6" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--theme-bg-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", marginRight: "12px" }}>✉️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--theme-darker)" }}>
                        Invitar por correo electrónico
                      </div>
                      <div style={{ fontSize: "13px", color: "#6B7280" }}>{searchQuery.trim()}</div>
                    </div>
                    <select 
                      value={invitePerm} 
                      onChange={e => setInvitePerm(e.target.value)} 
                      style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "#F9FAFB", color: "var(--theme-darker)", fontWeight: 700, marginRight: "12px", fontSize: "12px" }}
                    >
                      <option value="solo_lectura">Solo lectura</option>
                      <option value="papa">Papá (Acceso a todo)</option>
                      <option value="abuela">Abuela (Acceso a todo)</option>
                      <option value="ver_editar">Ver y editar</option>
                    </select>
                    <button 
                      onClick={() => { setSelectedInvite(null); handleInvitar(); }} 
                      disabled={isInviting}
                      style={{ background: "var(--theme-primary)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "20px", fontWeight: 700, cursor: isInviting ? "not-allowed" : "pointer", fontSize: "13px", opacity: isInviting ? 0.6 : 1 }}
                    >
                      {isInviting ? "Enviando..." : "Enviar invitación"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: AUDIT */}
            <div>
              <div style={cardStyle}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--theme-darker)", marginBottom: "16px" }}>Historial de actividad</h3>
                <div>
                  {auditoria.length === 0 ? (
                    <div style={{ fontSize: "13px", color: "#6B7280", textAlign: "center", padding: "20px" }}>Sin registros aún.</div>
                  ) : (
                    auditoria.map(log => (
                      <div key={log.id} style={{ marginBottom: "16px", paddingLeft: "16px", borderLeft: "2px solid var(--theme-light)", position: "relative" }}>
                        <div style={{ position: "absolute", left: "-5px", top: "6px", width: "8px", height: "8px", borderRadius: "50%", background: "var(--theme-primary)" }}></div>
                        <div style={{ fontSize: "13px", color: "var(--theme-darker)", fontWeight: 500 }}>{log.descripcion}</div>
                        <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>{new Date(log.fecha_hora_utc).toLocaleString('es-CL')}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {showCarnet && perfil && (
        <CarnetDigital perfil={perfil} onClose={() => setShowCarnet(false)} />
      )}
    </div>
  );
}
