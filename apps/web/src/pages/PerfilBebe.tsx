import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  User, Search, Lock, IdCard, Baby, Plus
} from "lucide-react";
import TopNav from "../components/TopNav";
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
  const [isInviting, setIsInviting] = useState(false);
  // Antes había un botón para elegir manualmente "Vista de lectura" o
  // "Editar Perfil". Ahora se muestra siempre en modo edición, excepto
  // cuando el acceso de la persona es de solo lectura -en cuyo caso no
  // hay opción de cambiarlo, simplemente no puede editar.
  const [soloLectura, setSoloLectura] = useState(false);
  const editMode = !soloLectura;
  
  const [perfil, setPerfil] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  
  const [accesos, setAccesos] = useState<any[]>([]);
  // Persona ya registrada que corresponde al correo escrito en el buscador
  // (null si el correo no existe todavía en Baby Care).
  const [personaPorCorreo, setPersonaPorCorreo] = useState<any | null>(null);
  const [previsiones, setPrevisiones] = useState<any[]>([]);
  
  const [showConfirmGestation, setShowConfirmGestation] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [showCarnet, setShowCarnet] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  // Antes había 3 botones (Todos / Mis contactos / Otros perfiles) para
  // cambiar esto; se quitaron, así que la búsqueda siempre usa "todos"
  // (que combina familiares vinculados + búsqueda por correo exacto).
  const searchTab = "todos";
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
      }
    }
  }, [token, id, activeTab]);

  useEffect(() => {
    if (!token || !id) return;
    fetch(`https://babycare-backend-msyq.onrender.com/api/v1/home/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSoloLectura(["solo_lectura", "solo_lectura_galeria"].includes(data.rol_acceso));
      })
      .catch(() => {});
  }, [token, id]);

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

  // Cuando lo escrito es un correo válido, se consulta si ya pertenece a
  // alguien registrado para poder mostrar su nombre antes de invitar.
  useEffect(() => {
    const correo = searchQuery.trim().toLowerCase();
    const esCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
    if (!esCorreo) {
      setPersonaPorCorreo(null);
      return;
    }
    let cancelado = false;
    const t = setTimeout(() => {
      fetch(`https://babycare-backend-msyq.onrender.com/api/v1/personas/buscar?q=${encodeURIComponent(correo)}&fuente=contactos`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((data: any[]) => {
          if (cancelado) return;
          const encontrada = (data || []).find((p) => p.email?.toLowerCase() === correo);
          setPersonaPorCorreo(encontrada ?? null);
        })
        .catch(() => { if (!cancelado) setPersonaPorCorreo(null); });
    }, 350); // pequeña espera para no consultar en cada tecla
    return () => { cancelado = true; clearTimeout(t); };
  }, [searchQuery, token]);

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
      } else {
        const err = await res.json();
        alert(err.error || "Error al modificar permiso");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const inputStyle = { width: "100%", padding: "12px 14px", border: "2px solid #EDE9F8", borderRadius: "12px", fontSize: "14px", outline: "none", color: "var(--text)", boxSizing: "border-box" as const };
  const readOnlyStyle = { padding: "12px 14px", background: "var(--theme-bg-light)", borderRadius: "12px", fontSize: "14px", color: "var(--text)", border: "1px dashed var(--theme-light)" };
  const cardStyle = { background: "var(--surface)", padding: "26px", borderRadius: "22px", boxShadow: "0 6px 24px rgba(124,92,191,0.07)", marginBottom: "24px", width: "100%" };
  const labelStyle = { display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" };

  if (errorPerfil) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--page-bg)", padding: "20px" }}>
           <h2 style={{ color: "#EF4444", marginBottom: "16px" }}>Error al cargar el perfil</h2>
           <p style={{ color: "#6B7280", marginBottom: "24px" }}>{errorPerfil}</p>
           <button style={{ background: "var(--theme-primary)", color: "#fff", padding: "12px 24px", borderRadius: "12px", fontWeight: 700 }} onClick={() => fetchPerfil()}>Intentar de nuevo</button>
           <button style={{ marginTop: "16px", background: "transparent", border: "1px solid var(--theme-primary)", color: "var(--theme-primary)", padding: "12px 24px", borderRadius: "12px", fontWeight: 700 }} onClick={() => navigate("/dashboard")}>Volver al Inicio</button>
      </div>
    );
  }

  if (!perfil) return <div style={{ padding: "40px", textAlign: "center", color: "var(--theme-primary)" }}>Cargando perfil...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, #FAF9FD 0%, #F6F2FF 100%)", fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column" }}>
      
      {/* ── TOP NAV GLOBAL ── */}
      <TopNav user={user} activePath="/perfil" />

      {/* ── PERFIL HEADER (Full width) ── */}
      {/* El fondo ocupa todo el ancho, pero el contenido se limita al mismo
          max-width que .page-container (1400px) para que quede alineado con
          el contenido de abajo, igual que en la pantalla de Inicio. */}
      <div style={{ background: "linear-gradient(135deg, #8B5FD6 0%, #A47BE8 100%)", color: "#fff" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px 40px 0" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: "18px", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div>
              <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "26px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                <Baby size={24} /> {perfil.nombre}
              </h1>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", marginTop: "3px", fontWeight: 600 }}>Apodo: {perfil.apodo || "No definido"}</div>
            </div>
          </div>

          {activeTab === "detalle" && soloLectura && (
            <div style={{
              background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.35)",
              borderRadius: "100px", padding: "8px 18px", fontSize: "13px", fontWeight: 800,
            }}>
              👁️ Solo lectura
            </div>
          )}
        </div>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="page-container" style={{ marginTop: "-14px" }}>

        {/* TABS: mismo patrón de píldoras que usa Salud.tsx */}
        <div className="responsive-overflow" style={{ display: "flex", gap: "10px", marginBottom: "32px", borderBottom: "1px solid var(--theme-bg-light)", paddingBottom: "16px", whiteSpace: "nowrap" }}>
          <button
            onClick={() => { setActiveTab("detalle"); navigate(`/perfil/${id}?tab=detalle`, { replace: true }); }}
            style={{
              background: activeTab === "detalle" ? "linear-gradient(135deg, var(--theme-primary), var(--theme-light))" : "transparent",
              color: activeTab === "detalle" ? "#fff" : "var(--text-muted)",
              border: "none", padding: "12px 22px", borderRadius: "100px",
              fontWeight: 800, cursor: "pointer", fontSize: "14.5px",
              display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s",
              fontFamily: "'Nunito', sans-serif",
              boxShadow: activeTab === "detalle" ? "0 6px 16px var(--theme-shadow-light)" : "none",
            }}>
            <User size={18} /> Datos del bebé
          </button>
          <button
            onClick={() => { setActiveTab("compartir"); navigate(`/perfil/${id}?tab=compartir`, { replace: true }); }}
            style={{
              background: activeTab === "compartir" ? "linear-gradient(135deg, var(--theme-primary), var(--theme-light))" : "transparent",
              color: activeTab === "compartir" ? "#fff" : "var(--text-muted)",
              border: "none", padding: "12px 22px", borderRadius: "100px",
              fontWeight: 800, cursor: "pointer", fontSize: "14.5px",
              display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s",
              fontFamily: "'Nunito', sans-serif",
              boxShadow: activeTab === "compartir" ? "0 6px 16px var(--theme-shadow-light)" : "none",
            }}>
            <Lock size={18} /> Compartir acceso
          </button>
        </div>

        <div style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}>
        
        {activeTab === "detalle" && (
          <div style={{ width: "100%" }}>

            <div className="responsive-grid">
              {/* DATOS GENERALES */}
              <div style={cardStyle}>
                <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "19px", fontWeight: 700, color: "var(--text)", marginBottom: "20px", borderBottom: "1px solid var(--theme-bg-light)", paddingBottom: "12px" }}>Datos Generales</h3>
                
                <div style={{ marginBottom: "16px" }}>
                  <label style={labelStyle}>Nombre completo</label>
                  {editMode ? <input type="text" name="nombre" value={editData.nombre || ""} onChange={handleChange} style={inputStyle} /> : <div style={readOnlyStyle}>{perfil.nombre}</div>}
                </div>
                
                <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "160px" }}>
                    <label style={labelStyle}>Apodo</label>
                    {editMode ? <input type="text" name="apodo" value={editData.apodo || ""} onChange={handleChange} style={inputStyle} /> : <div style={readOnlyStyle}>{perfil.apodo || "-"}</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: "160px" }}>
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

                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "160px" }}>
                    <label style={labelStyle}>Fecha de nacimiento</label>
                    {editMode ? <input type="date" name="fecha_nacimiento" value={editData.fecha_nacimiento ? editData.fecha_nacimiento.split('T')[0] : ""} onChange={handleChange} max={new Date().toISOString().split('T')[0]} style={inputStyle} /> : <div style={readOnlyStyle}>{perfil.fecha_nacimiento ? new Date(perfil.fecha_nacimiento).toLocaleDateString('es-CL') : "-"}</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: "160px" }}>
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
                <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "19px", fontWeight: 700, color: "var(--text)", marginBottom: "20px", borderBottom: "1px solid var(--theme-bg-light)", paddingBottom: "12px" }}>Datos de Nacimiento</h3>
                
                <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "160px" }}>
                    <label style={labelStyle}>Peso al nacer (kg)</label>
                    {editMode ? (
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ej. 3.5"
                        name="peso_nacimiento_kg_display"
                        value={editData.peso_nacimiento_g ? (Number(editData.peso_nacimiento_g) / 1000) : ""}
                        onChange={(e) => {
                          const kg = e.target.value;
                          setEditData({ ...editData, peso_nacimiento_g: kg ? Math.round(parseFloat(kg) * 1000) : "" });
                        }}
                        style={inputStyle}
                      />
                    ) : (
                      <div style={readOnlyStyle}>{perfil.peso_nacimiento_g ? `${(perfil.peso_nacimiento_g / 1000).toFixed(2)} kg` : "-"}</div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: "160px" }}>
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
                <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "19px", fontWeight: 700, color: "var(--text)", marginBottom: "20px", borderBottom: "1px solid var(--theme-bg-light)", paddingBottom: "12px" }}>Información Médica</h3>
                
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
                  <div style={{ flex: 1, minWidth: "160px" }}>
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
                  <div style={{ flex: 1, minWidth: "160px" }}>
                    <label style={labelStyle}>Pediatra de cabecera</label>
                    {editMode ? <input type="text" name="pediatra_nombre" value={editData.pediatra_nombre || ""} onChange={handleChange} style={inputStyle} /> : <div style={readOnlyStyle}>{perfil.pediatra_nombre || "-"}</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: "160px" }}>
                    <label style={labelStyle}>Centro de salud</label>
                    {editMode ? <input type="text" name="centro_salud" value={editData.centro_salud || ""} onChange={handleChange} style={inputStyle} /> : <div style={readOnlyStyle}>{perfil.centro_salud || "-"}</div>}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "160px" }}>
                    <label style={labelStyle}>Alergias conocidas</label>
                    {editMode ? <textarea name="alergias" rows={3} value={editData.alergias || ""} onChange={handleChange} style={inputStyle}></textarea> : <div style={{ ...readOnlyStyle, minHeight: "80px" }}>{perfil.alergias || "-"}</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: "160px" }}>
                    <label style={labelStyle}>Condiciones médicas crónicas</label>
                    {editMode ? <textarea name="condiciones_cronicas" rows={3} value={editData.condiciones_cronicas || ""} onChange={handleChange} style={inputStyle}></textarea> : <div style={{ ...readOnlyStyle, minHeight: "80px" }}>{perfil.condiciones_cronicas || "-"}</div>}
                  </div>
                </div>
              </div>

              {/* CARNET DIGITAL */}
              <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
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
              </div>
            </div>

            {editMode && (
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <button 
                  style={{ background: "var(--theme-primary)", color: "#fff", border: "none", padding: "16px 40px", borderRadius: "12px", fontSize: "16px", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 12px rgba(124,92,191,0.3)", display: "inline-flex", alignItems: "center", gap: "8px" }}
                  onClick={() => handleSave(false)}
                >
                  <Plus size={18} /> Guardar cambios
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "compartir" && (
          <div style={{ width: "100%" }}>
            
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
                  <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "19px", fontWeight: 700, color: "var(--text)", margin: 0 }}>Personas con acceso</h3>
                  <div style={{ fontSize: "12px", background: "var(--theme-bg-light)", color: "var(--text)", padding: "4px 12px", borderRadius: "12px", fontWeight: 800 }}>{accesos.length} activos</div>
                </div>

                {accesos.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>
                    Aún no has compartido el acceso con nadie.
                  </div>
                ) : (
                  accesos.map(acceso => {
                    // El backend devuelve estos campos planos (no dentro de
                    // un objeto 'usuario_invitado', como se leía antes: por
                    // eso siempre aparecía "Usuario" sin correo).
                    const nombreCompleto = [acceso.nombre, acceso.apellidos].filter(Boolean).join(" ");
                    const pendiente = acceso.estado === "pendiente";
                    return (
                    <div key={acceso.id} style={{ display: "flex", alignItems: "center", padding: "16px", border: "1px solid #E5E7EB", borderRadius: "12px", marginBottom: "12px", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--theme-bg-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>🧑</div>
                      <div style={{ flex: 1, minWidth: "160px" }}>
                        <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)" }}>
                          {nombreCompleto || "Invitación pendiente"}
                        </div>
                        <div style={{ fontSize: "13px", color: "#6B7280" }}>
                          {acceso.email_usuario || acceso.correo_invitado}
                        </div>
                        <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "3px" }}>
                          {pendiente
                            ? "Aún no acepta la invitación"
                            : acceso.ultima_conexion
                              ? `Último ingreso: ${new Date(acceso.ultima_conexion).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}`
                              : "Sin ingresos registrados"}
                        </div>
                      </div>
                      <select value={acceso.nivel_permiso} onChange={(e) => modificarPermiso(acceso.id, e.target.value)} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "var(--surface-2)", color: "var(--text)", fontWeight: 700 }}>
                        <option value="solo_lectura">Solo lectura</option>
                        <option value="papa">Papá (Acceso a todo)</option>
                        <option value="abuela">Abuela (Acceso a todo)</option>
                        <option value="ver_editar">Ver y editar</option>
                      </select>
                      <button onClick={() => revocarAcceso(acceso.id)} style={{ background: "#FEE2E2", color: "#EF4444", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Revocar</button>
                    </div>
                    );
                  })
                )}
              </div>

              <div style={cardStyle}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "'Baloo 2', sans-serif", fontSize: "19px", fontWeight: 700, color: "var(--text)", marginBottom: "20px" }}>
                  <Search size={20} style={{ color: "var(--theme-primary)" }} /> Buscar a quién compartir
                </h3>
                
                <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "24px" }}>Busca entre tus contactos, familiares ya registrados en Baby Care, o escribe un correo para invitar a alguien nuevo.</p>

                <div style={{ position: "relative", marginBottom: "24px" }}>
                  <Search size={20} style={{ position: "absolute", left: "16px", top: "14px", color: "#9CA3AF" }} />
                  <input 
                    type="text" 
                    placeholder="Busca por correo electrónico" 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.trim().length > 2) buscarPersonas(e.target.value, searchTab);
                      else if (e.target.value.trim().length === 0) setSearchResults([]);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        buscarPersonas(searchQuery, searchTab);
                      }
                    }}
                    style={{ width: "100%", padding: "14px 16px 14px 48px", borderRadius: "12px", border: "1px solid #E5E7EB", fontSize: "15px", outline: "none", color: "var(--text)" }}
                  />
                </div>

                {searchResults.length > 0 && (
                  <div>
                    {searchResults.map(res => (
                      <div key={res.email} style={{ display: "flex", alignItems: "center", padding: "12px", borderBottom: "1px solid #F3F4F6" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--theme-bg-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", marginRight: "12px" }}>🧑</div>
                        <div style={{ flex: 1, minWidth: "160px" }}>
                          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>
                            {res.nombre || "Usuario"} 
                            {res.en_app && <span style={{ marginLeft: "8px", fontSize: "10px", background: "#D1FAE5", color: "#065F46", padding: "2px 8px", borderRadius: "12px" }}>En la app</span>}
                          </div>
                          <div style={{ fontSize: "13px", color: "#6B7280" }}>{res.email}</div>
                        </div>
                        <select 
                          value={invitePerm} 
                          onChange={e => setInvitePerm(e.target.value)} 
                          style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "var(--surface-2)", color: "var(--text)", fontWeight: 700, marginRight: "12px", fontSize: "12px" }}
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
                
                {searchQuery.includes("@") && searchQuery.includes(".") && !searchResults.some(res => res.email.toLowerCase() === searchQuery.trim().toLowerCase()) && (() => {
                  // Si el correo escrito ya pertenece a alguien registrado, se
                  // muestra su nombre (viene de la búsqueda por correo exacto
                  // del backend) en vez del texto genérico "Invitar por correo".
                  const yaRegistrado = personaPorCorreo;
                  return (
                  <div style={{ display: "flex", alignItems: "center", padding: "12px", borderBottom: "1px solid #F3F4F6", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--theme-bg-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
                      {yaRegistrado ? "🧑" : "✉️"}
                    </div>
                    <div style={{ flex: 1, minWidth: "160px" }}>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>
                        {yaRegistrado
                          ? [yaRegistrado.nombre, yaRegistrado.apellidos].filter(Boolean).join(" ")
                          : "Invitar por correo electrónico"}
                      </div>
                      <div style={{ fontSize: "13px", color: "#6B7280" }}>{searchQuery.trim()}</div>
                      {yaRegistrado && (
                        <div style={{ fontSize: "12px", color: "#3E8E6E", fontWeight: 700, marginTop: "2px" }}>
                          Ya tiene cuenta en Baby Care
                        </div>
                      )}
                    </div>
                    <select 
                      value={invitePerm} 
                      onChange={e => setInvitePerm(e.target.value)} 
                      style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "var(--surface-2)", color: "var(--text)", fontWeight: 700, fontSize: "12px" }}
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
                      {isInviting ? "Enviando..." : yaRegistrado ? "Invitar" : "Enviar invitación"}
                    </button>
                  </div>
                  );
                })()}
              </div>
            </div>

          </div>
        )}

        </div>
      </div>

      {showCarnet && perfil && (
        <CarnetDigital perfil={perfil} onClose={() => setShowCarnet(false)} />
      )}
    </div>
  );
}
