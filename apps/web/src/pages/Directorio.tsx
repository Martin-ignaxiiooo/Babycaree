import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bell, LogOut, Search, MapPin, Star, Phone, ShieldCheck, User 
} from "lucide-react";
import axios from "axios";
import TopNav from "../components/TopNav";

const API_URL = "https://babycare-backend-msyq.onrender.com/api/v1";

// Directorio de médicos deshabilitado para el público mientras se termina
// de definir/verificar el contenido. La funcionalidad real queda intacta
// abajo (fetch, filtros, tarjetas) — para reactivarla, poner esto en true.
const MODULO_DIRECTORIO_HABILITADO = false;

function ModuloEnDesarrollo({ user }: { user: any }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(165deg, #FAF9FD 0%, #F6F2FF 100%)",
      fontFamily: "'Nunito', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      <TopNav user={user} activePath="/directorio" />
      <div className="page-container" style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", textAlign: "center", flex: 1, padding: "60px 20px",
      }}>
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>🚧</div>
        <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "26px", fontWeight: 700, color: "var(--text)", margin: "0 0 8px 0" }}>
          Módulo en desarrollo
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-muted)", maxWidth: "420px", fontWeight: 600 }}>
          El Directorio de Especialistas está en construcción. Muy pronto vas a poder buscar médicos y especialistas para tu bebé acá.
        </p>
      </div>
    </div>
  );
}

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
    if (!MODULO_DIRECTORIO_HABILITADO) {
      setLoading(false);
      return;
    }
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

  if (!MODULO_DIRECTORIO_HABILITADO) {
    return <ModuloEnDesarrollo user={user} />;
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(165deg, #FAF9FD 0%, #F6F2FF 100%)",
      fontFamily: "'Nunito', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* ── TOP NAV ── */}
      <TopNav user={user} activePath="/directorio" />

      {/* ── MAIN CONTENT ── */}
      <div className="page-container">
        
        {/* Header & Search */}
        <div style={{ marginBottom: "36px" }}>
          <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "30px", fontWeight: 700, color: "var(--text)", margin: "0 0 8px 0" }}>Directorio de Especialistas</h1>
          <p style={{ fontSize: "15px", color: "var(--text-muted)", margin: "0 0 24px 0", fontWeight: 600 }}>Encuentra a los mejores médicos y especialistas para tu bebé.</p>
          
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 300px", position: "relative" }}>
              <Search size={19} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--theme-light)" }} />
              <input 
                type="text" 
                placeholder="Buscar por nombre o centro médico..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  width: "100%", padding: "14px 16px 14px 48px", boxSizing: "border-box",
                  borderRadius: "14px", border: "2px solid #EDE9F8", 
                  fontSize: "15px", outline: "none",
                }}
              />
            </div>
            
            <select 
              value={selectedEspecialidad}
              onChange={(e) => setSelectedEspecialidad(e.target.value)}
              style={{ 
                flex: "0 1 250px", padding: "14px 16px", 
                borderRadius: "14px", border: "2px solid #EDE9F8", 
                fontSize: "15px", outline: "none", background: "var(--surface)", cursor: "pointer"
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
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Cargando directorio...</div>
        ) : filteredMedicos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", background: "var(--surface)", borderRadius: "22px", boxShadow: "0 6px 24px rgba(124,92,191,0.07)" }}>
            No se encontraron médicos con esos criterios.
          </div>
        ) : (
          <div className="responsive-grid">
            {filteredMedicos.map(medico => (
              <div key={medico.id} style={{ 
                background: "var(--surface)", borderRadius: "22px", padding: "24px",
                boxShadow: "0 6px 24px rgba(124,92,191,0.08)",
                display: "flex", flexDirection: "column", gap: "16px",
                transition: "transform 0.2s, box-shadow 0.2s", cursor: "default"
              }} onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 16px 32px rgba(124,92,191,0.16)"; }} onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 6px 24px rgba(124,92,191,0.08)"; }}>
                
                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <div style={{ 
                    width: "56px", height: "56px", borderRadius: "50%", 
                    background: "linear-gradient(135deg, var(--theme-bg-light), var(--accent-coral-light))", color: "var(--theme-primary)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <User size={30} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <h3 style={{ margin: "0 0 4px 0", fontFamily: "'Baloo 2', sans-serif", fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>
                        {medico.nombre_completo}
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "var(--accent-gold-light)", color: "#8A6D1D", padding: "4px 8px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>
                        <Star size={14} fill="currentColor" /> {medico.calificacion_promedio}
                      </div>
                    </div>
                    <div style={{ color: "var(--theme-primary)", fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>
                      {medico.especialidad_nombre}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--theme-bg-light)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-muted)", fontSize: "14px" }}>
                    <MapPin size={18} style={{ color: "var(--theme-light)" }} />
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {medico.centro_icono && <span>{medico.centro_icono}</span>}
                      {medico.nombre_centro}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", color: "var(--text-muted)", fontSize: "14px" }}>
                    <ShieldCheck size={18} style={{ color: "var(--theme-light)", marginTop: "2px" }} />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {medico.prevision_aceptada.map((prev, idx) => (
                        <span key={idx} style={{ background: "var(--theme-bg-light)", color: "var(--theme-dark)", padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700 }}>
                          {prev}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-muted)", fontSize: "14px" }}>
                    <Phone size={18} style={{ color: "var(--theme-light)" }} />
                    <span>{medico.telefono_contacto}</span>
                  </div>
                </div>

                <button style={{ 
                  marginTop: "auto", width: "100%", background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))", 
                  color: "#fff", border: "none", padding: "13px", borderRadius: "14px", 
                  fontWeight: 800, fontSize: "15px", cursor: "pointer",
                  boxShadow: "0 6px 16px var(--theme-shadow-light)",
                }}
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
