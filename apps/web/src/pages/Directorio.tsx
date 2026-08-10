import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bell, LogOut, Search, MapPin, Star, Phone, ShieldCheck, User 
} from "lucide-react";
import axios from "axios";

const API_URL = "https://babycare-backend-msyq.onrender.com/api/v1";

interface Medico {
  id: string;
  nombre_completo: string;
  especialidad: string;
  especialidad_nombre: string;
  id_tipo_centro: string;
  centro_icono: string;
  nombre_centro: string;
  prevision_aceptada: string[];
  telefono_contacto: string;
  calificacion_promedio: string;
}

interface Especialidad {
  codigo: string;
  nombre_visible: string;
}

export default function Directorio() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEspecialidad, setSelectedEspecialidad] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        const [medicosRes, espRes] = await Promise.all([
          axios.get(`${API_URL}/directorio/medicos`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/directorio/especialidades`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setMedicos(medicosRes.data);
        setEspecialidades(espRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const filteredMedicos = medicos.filter(medico => {
    const matchesSearch = medico.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          medico.nombre_centro.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEsp = selectedEspecialidad ? medico.especialidad === selectedEspecialidad : true;
    return matchesSearch && matchesEsp;
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F8F7FC",
      fontFamily: "'Nunito', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* ── TOP NAV ── */}
      <nav style={{
        width: "100%",
        background: "var(--theme-darker)",
        color: "#fff",
        padding: "16px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 4px 12px rgba(0,0,0,.15)"
      }}>
        <div style={{ fontSize: "24px", fontWeight: 800, cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
          Iniciativa<span style={{ color: "var(--theme-light)" }}>Baby</span>
        </div>
        
        <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "24px", fontWeight: 600, fontSize: "15px" }}>
            <span style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color="var(--theme-light)"} onMouseLeave={e => e.currentTarget.style.color="white"} onClick={() => navigate("/dashboard")}>Inicio</span>
            <span style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color="var(--theme-light)"} onMouseLeave={e => e.currentTarget.style.color="white"} onClick={() => navigate("/salud")}>Salud</span>
            <span style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color="var(--theme-light)"} onMouseLeave={e => e.currentTarget.style.color="white"} onClick={() => navigate("/comunidad")}>Comunidad</span>
          </div>
          <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.2)" }}></div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => alert("No tienes nuevas notificaciones")}>
              <Bell size={22} />
            </div>
            <div 
              onClick={() => navigate("/mi-perfil")}
              style={{ 
                width: "36px", height: "36px", borderRadius: "50%", 
                background: "var(--theme-primary)", display: "flex", 
                alignItems: "center", justifyContent: "center", fontWeight: "bold",
                fontSize: "16px", cursor: "pointer", border: "2px solid rgba(255,255,255,0.2)"
              }}>
              {user?.nombre?.[0]?.toUpperCase() || "U"}
            </div>
            <button onClick={handleLogout} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", display: "flex", alignItems: "center" }} title="Cerrar sesión">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, padding: "40px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        
        {/* Header & Search */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "var(--theme-darker)", margin: "0 0 8px 0" }}>Directorio de Especialistas</h1>
          <p style={{ fontSize: "16px", color: "#6B7280", margin: "0 0 24px 0" }}>Encuentra a los mejores médicos y especialistas para tu bebé.</p>
          
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 300px", position: "relative" }}>
              <Search size={20} style={{ position: "absolute", left: "16px", top: "14px", color: "#9CA3AF" }} />
              <input 
                type="text" 
                placeholder="Buscar por nombre o centro médico..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  width: "100%", padding: "14px 16px 14px 48px", 
                  borderRadius: "12px", border: "1px solid #E5E7EB", 
                  fontSize: "15px", outline: "none", boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                }}
              />
            </div>
            
            <select 
              value={selectedEspecialidad}
              onChange={(e) => setSelectedEspecialidad(e.target.value)}
              style={{ 
                flex: "0 1 250px", padding: "14px 16px", 
                borderRadius: "12px", border: "1px solid #E5E7EB", 
                fontSize: "15px", outline: "none", background: "#fff", cursor: "pointer"
              }}>
              <option value="">Todas las especialidades</option>
              {especialidades.map(e => (
                <option key={e.codigo} value={e.codigo}>{e.nombre_visible}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Directory Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>Cargando directorio...</div>
        ) : filteredMedicos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6B7280", background: "#fff", borderRadius: "16px" }}>
            No se encontraron médicos con esos criterios.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px" }}>
            {filteredMedicos.map(medico => (
              <div key={medico.id} style={{ 
                background: "#fff", borderRadius: "20px", padding: "24px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                display: "flex", flexDirection: "column", gap: "16px",
                transition: "transform 0.2s, box-shadow 0.2s", cursor: "default"
              }} onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 12px 24px rgba(0,0,0,0.1)"; }} onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.05)"; }}>
                
                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <div style={{ 
                    width: "56px", height: "56px", borderRadius: "50%", 
                    background: "var(--theme-bg-light)", color: "var(--theme-primary)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <User size={32} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: 800, color: "var(--theme-darker)" }}>
                        {medico.nombre_completo}
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#FEF3C7", color: "#D97706", padding: "4px 8px", borderRadius: "8px", fontSize: "13px", fontWeight: 700 }}>
                        <Star size={14} fill="currentColor" /> {medico.calificacion_promedio}
                      </div>
                    </div>
                    <div style={{ color: "var(--theme-primary)", fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>
                      {medico.especialidad_nombre}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#6B7280", fontSize: "14px" }}>
                    <MapPin size={18} style={{ color: "#9CA3AF" }} />
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {medico.centro_icono && <span>{medico.centro_icono}</span>}
                      {medico.nombre_centro}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", color: "#6B7280", fontSize: "14px" }}>
                    <ShieldCheck size={18} style={{ color: "#9CA3AF", marginTop: "2px" }} />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {medico.prevision_aceptada.map((prev, idx) => (
                        <span key={idx} style={{ background: "#F3F4F6", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>
                          {prev}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#6B7280", fontSize: "14px" }}>
                    <Phone size={18} style={{ color: "#9CA3AF" }} />
                    <span>{medico.telefono_contacto}</span>
                  </div>
                </div>

                <button style={{ 
                  marginTop: "auto", width: "100%", background: "var(--theme-primary)", 
                  color: "#fff", border: "none", padding: "12px", borderRadius: "12px", 
                  fontWeight: 700, fontSize: "15px", cursor: "pointer",
                  transition: "background 0.2s"
                }} onMouseEnter={e => e.currentTarget.style.background="var(--theme-dark)"} onMouseLeave={e => e.currentTarget.style.background="var(--theme-primary)"}
                onClick={() => alert(`Llamando a ${medico.nombre_completo}: ${medico.telefono_contacto}`)}>
                  Agendar Cita
                </button>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
