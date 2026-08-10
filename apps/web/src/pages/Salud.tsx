import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Syringe, Activity, Save, CheckCircle, Bell } from "lucide-react";

export default function Salud() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [bebeId, setBebeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"vacunas">("vacunas");
  const [loading, setLoading] = useState(true);

  const [vacunas, setVacunas] = useState<any[]>([]);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    // Obtener el bebé activo
    fetch("http://localhost:3000/api/profiles/babies", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setBebeId(data[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(err => console.error(err));
  }, [token, navigate]);

  useEffect(() => {
    if (bebeId && token) {
      if (activeTab === "vacunas") fetchVacunas();
    }
  }, [bebeId, activeTab, token]);

  const fetchVacunas = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/v1/salud/${bebeId}/vacunas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setVacunas(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };



  const toggleVacuna = async (vacunaId: number, aplicadaActual: boolean) => {
    try {
      const res = await fetch(`http://localhost:3000/api/v1/salud/${bebeId}/vacunas/${vacunaId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          aplicada: !aplicadaActual,
          fecha_aplicacion: !aplicadaActual ? new Date().toISOString().split('T')[0] : null
        })
      });
      
      if (res.ok) {
        fetchVacunas();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const updateVacunaInfo = async (vacunaId: number, field: string, value: string) => {
    // Busca el estado actual en la UI para no perder el 'aplicada'
    const vacuna = vacunas.find(v => v.vacuna_id === vacunaId);
    if (!vacuna) return;

    try {
      await fetch(`http://localhost:3000/api/v1/salud/${bebeId}/vacunas/${vacunaId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          aplicada: vacuna.aplicada,
          [field]: value
        })
      });
    } catch (error) {
      console.error(error);
    }
  };



  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Cargando módulo de salud...</div>;
  if (!bebeId) return <div style={{ padding: "40px", textAlign: "center" }}>Debes registrar un bebé primero.</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7FC", fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column" }}>
      
      {/* ── TOP NAV GLOBAL ── */}
      <nav style={{
        width: "100%", background: "var(--theme-darker)", color: "#fff", padding: "16px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 4px 12px rgba(0,0,0,.15)"
      }}>
        <div style={{ fontSize: "24px", fontWeight: 800, cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
          Iniciativa<span style={{ color: "var(--theme-light)" }}>Baby</span>
        </div>
        
        <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "24px", fontWeight: 600, fontSize: "15px" }}>
            <span style={{ cursor: "pointer", color: "white" }} onClick={() => navigate("/dashboard")}>Inicio</span>
            <span style={{ cursor: "pointer", color: "var(--theme-light)" }}>Salud</span>
            <span style={{ cursor: "pointer", color: "white" }} onClick={() => navigate("/comunidad")}>Comunidad</span>
          </div>
          <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.2)" }}></div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ position: "relative", cursor: "pointer" }}><Bell size={22} /></div>
            <div 
              onClick={() => navigate("/mi-perfil")}
              style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--theme-light)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", cursor: "pointer" }}
            >
              {user?.nombre ? user.nombre.charAt(0).toUpperCase() : "U"}
            </div>
          </div>
        </div>
      </nav>

      {/* ── HEADER ── */}
      <div style={{ background: "linear-gradient(135deg, var(--theme-darker) 0%, var(--theme-dark) 100%)", color: "#fff", padding: "48px 40px 0" }}>
        <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "none", color: "var(--theme-light)", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
          <ArrowLeft size={16} /> Volver al Dashboard
        </button>
        
        <div style={{ display: "flex", alignItems: "center", gap: "24px", paddingBottom: "32px" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "var(--theme-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <Syringe size={40} />
          </div>
          <div>
            <h1 style={{ fontSize: "36px", fontWeight: 900, margin: 0 }}>Salud y Crecimiento</h1>
            <div style={{ fontSize: "16px", color: "var(--theme-bg-light)", marginTop: "4px" }}>Administra las vacunas y el progreso de tu bebé</div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: "32px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <button 
            style={{ padding: "16px 0", background: "none", border: "none", borderBottom: activeTab === "vacunas" ? "3px solid #fff" : "3px solid transparent", color: activeTab === "vacunas" ? "#fff" : "rgba(255,255,255,0.6)", fontSize: "16px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            onClick={() => setActiveTab("vacunas")}
          >
            <Syringe size={18} /> Vacunas PNI
          </button>

        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div style={{ flex: 1, padding: "40px", width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
        
        {activeTab === "vacunas" && (
          <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--theme-darker)", marginBottom: "24px" }}>Calendario de Vacunación</h2>
            
            {vacunas.length === 0 ? (
              <p style={{ color: "#6B7280" }}>No hay vacunas registradas en el sistema.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {vacunas.map((vacuna) => (
                  <div key={vacuna.vacuna_id} style={{ display: "flex", alignItems: "flex-start", gap: "20px", padding: "20px", border: "1px solid #E5E7EB", borderRadius: "12px", background: vacuna.aplicada ? "#F0FDF4" : "#fff" }}>
                    
                    <button 
                      onClick={() => toggleVacuna(vacuna.vacuna_id, vacuna.aplicada)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: "4px" }}
                    >
                      {vacuna.aplicada ? <CheckCircle size={28} color="#16A34A" /> : <div style={{ width: "28px", height: "28px", borderRadius: "50%", border: "2px solid #D1D5DB" }}></div>}
                    </button>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: vacuna.aplicada ? "#166534" : "var(--theme-darker)" }}>{vacuna.nombre}</h3>
                          <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "12px" }}>{vacuna.enfermedades_previene}</div>
                        </div>
                        <div style={{ background: "var(--theme-bg-light)", color: "var(--theme-dark)", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: 800 }}>
                          {vacuna.meses_edad_recomendada === 0 ? "Recién nacido" : `${vacuna.meses_edad_recomendada} meses`}
                        </div>
                      </div>

                      {vacuna.aplicada && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "12px", padding: "16px", background: "#fff", borderRadius: "8px", border: "1px solid #DCFCE7" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#166534", marginBottom: "4px" }}>Fecha de aplicación</label>
                            <input 
                              type="date" 
                              defaultValue={vacuna.fecha_aplicacion ? vacuna.fecha_aplicacion.split('T')[0] : ""}
                              onBlur={(e) => updateVacunaInfo(vacuna.vacuna_id, "fecha_aplicacion", e.target.value)}
                              style={{ width: "100%", padding: "8px", border: "1px solid #E5E7EB", borderRadius: "6px", fontSize: "14px", outline: "none" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#166534", marginBottom: "4px" }}>Notas / Reacciones</label>
                            <input 
                              type="text" 
                              placeholder="Fiebre leve, etc."
                              defaultValue={vacuna.notas || ""}
                              onBlur={(e) => updateVacunaInfo(vacuna.vacuna_id, "notas", e.target.value)}
                              style={{ width: "100%", padding: "8px", border: "1px solid #E5E7EB", borderRadius: "6px", fontSize: "14px", outline: "none" }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}



      </div>
    </div>
  );
}
