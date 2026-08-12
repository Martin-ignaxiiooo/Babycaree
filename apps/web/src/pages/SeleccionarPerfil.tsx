import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Plus, X, Check, Trash2 } from "lucide-react";

const API_URL = "https://babycare-backend-msyq.onrender.com/api";

export default function SeleccionarPerfil() {
  const navigate = useNavigate();
  const [babies, setBabies] = useState<any[]>([]);
  const [previsiones, setPrevisiones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [babyForm, setBabyForm] = useState({
    flow: "hijo", // "hijo" | "embarazo"
    nombre: "",
    fecha_nacimiento: "",
    sexo: "",
    prevision: "",
    es_prematuro: false,
    semanas_gestacion: "",
    peso: "",
    talla: "",
  });

  const fetchBabies = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/profiles/babies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBabies(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrevisiones = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/v1/directorio/previsiones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrevisiones(res.data);
    } catch (err) {
      console.error("Error al obtener previsiones", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      navigate("/");
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchBabies();
    fetchPrevisiones();
  }, [navigate]);

  const handleSelectBaby = (babyId: string) => {
    localStorage.setItem("selectedBabyId", babyId);
    navigate("/dashboard");
  };

  const handleCreateBaby = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!babyForm.nombre || !babyForm.fecha_nacimiento || !babyForm.prevision) {
      alert("Por favor completa los campos obligatorios (nombre, fecha y previsión).");
      return;
    }
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      
      let fechaEstimadaParto = null;
      if (babyForm.flow === "embarazo" && babyForm.fecha_nacimiento) {
        const fur = new Date(babyForm.fecha_nacimiento);
        fur.setDate(fur.getDate() + 280);
        fechaEstimadaParto = fur.toISOString().split('T')[0];
      }

      await axios.post(`${API_URL}/profiles/babies`, {
        nombre: babyForm.nombre,
        fecha_nacimiento: babyForm.flow === "hijo" ? babyForm.fecha_nacimiento : null,
        estado: babyForm.flow === "embarazo" ? "embarazo" : "nacido",
        fecha_estimada_parto: fechaEstimadaParto,
        sexo: babyForm.sexo || "N/A",
        prevision_salud: babyForm.prevision,
        es_prematuro: babyForm.es_prematuro,
        semanas_gestacion: babyForm.es_prematuro ? parseInt(babyForm.semanas_gestacion) : null,
        peso_nacimiento_g: babyForm.peso ? Math.round(parseFloat(babyForm.peso) * 1000) : null,
        talla_nacimiento_cm: babyForm.talla ? parseFloat(babyForm.talla) : null,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsModalOpen(false);
      setBabyForm({ flow: "hijo", nombre: "", fecha_nacimiento: "", sexo: "", prevision: "", es_prematuro: false, semanas_gestacion: "", peso: "", talla: "" });
      fetchBabies();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error al crear el perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBaby = async (e: React.MouseEvent, babyId: string) => {
    e.stopPropagation();
    if (!window.confirm("¿Estás seguro de que quieres eliminar este perfil? Esta acción no se puede deshacer.")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/profiles/babies/${babyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBabies();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error al eliminar el perfil.");
    }
  };

  if (loading || !user) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito', sans-serif" }}>Cargando perfiles...</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7FC", fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem 2rem" }}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "var(--theme-darker)", marginBottom: "1rem" }}>
          ¿A quién vamos a cuidar hoy, {user.nombre}?
        </h1>
        <p style={{ color: "#8A849C", fontSize: "1.1rem" }}>Selecciona un perfil para ver su panel de control</p>
      </div>

      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", justifyContent: "center", maxWidth: "900px" }}>
        {babies.map((baby) => (
          <div 
            key={baby.id}
            onClick={() => handleSelectBaby(baby.id)}
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "24px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
              width: "220px",
              position: "relative",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow = "0 15px 40px rgba(124,92,191,0.15)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.05)";
            }}
          >
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--theme-bg-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: "var(--theme-primary)" }}>
              {baby.nombre.charAt(0).toUpperCase()}
            </div>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--theme-darker)" }}>{baby.nombre}</h2>
              <p style={{ fontSize: "0.9rem", color: "#8A849C", marginTop: "4px" }}>Ver panel</p>
            </div>
            <button 
              onClick={(e) => handleDeleteBaby(e, baby.id)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ef4444",
                cursor: "pointer",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)"}
              onMouseOut={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
              title="Eliminar perfil"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {/* Create new baby button */}
        <div 
          onClick={() => setIsModalOpen(true)}
          style={{
            background: "transparent",
            padding: "2rem",
            borderRadius: "24px",
            border: "2px dashed #DDD9F0",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
            width: "220px",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = "var(--theme-primary)";
            e.currentTarget.style.background = "rgba(124,92,191,0.02)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = "#DDD9F0";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(124,92,191,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--theme-primary)" }}>
            <Plus size={32} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--theme-primary)" }}>Crear otro perfil</h2>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="auth-box" style={{ background: "white", padding: "2.5rem", borderRadius: "24px", width: "90%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: "absolute", right: "20px", top: "20px", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}
            >
              <X size={24} />
            </button>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--theme-darker)", marginBottom: "1.5rem" }}>Agregar un perfil</h2>
            
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <button 
                type="button"
                onClick={() => setBabyForm({...babyForm, flow: "hijo"})}
                style={{ flex: 1, padding: "12px", borderRadius: "12px", border: babyForm.flow === "hijo" ? "2px solid var(--theme-primary)" : "2px solid #E5E7EB", background: babyForm.flow === "hijo" ? "rgba(124,92,191,0.05)" : "white", fontWeight: 700, color: babyForm.flow === "hijo" ? "var(--theme-primary)" : "#6B7280", cursor: "pointer" }}
              >
                Bebé Nacido
              </button>
              <button 
                type="button"
                onClick={() => setBabyForm({...babyForm, flow: "embarazo"})}
                style={{ flex: 1, padding: "12px", borderRadius: "12px", border: babyForm.flow === "embarazo" ? "2px solid var(--theme-primary)" : "2px solid #E5E7EB", background: babyForm.flow === "embarazo" ? "rgba(124,92,191,0.05)" : "white", fontWeight: 700, color: babyForm.flow === "embarazo" ? "var(--theme-primary)" : "#6B7280", cursor: "pointer" }}
              >
                Estoy en Embarazo
              </button>
            </div>

            <form onSubmit={handleCreateBaby} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--theme-darker)", marginBottom: "6px" }}>{babyForm.flow === "hijo" ? "Nombre del bebé *" : "Apodo o nombre del bebé *"}</label>
                <input required type="text" placeholder={babyForm.flow === "hijo" ? "Ej: Sofía" : "Ej: Porotito"} value={babyForm.nombre} onChange={(e) => setBabyForm({...babyForm, nombre: e.target.value})} style={{ width: "100%", padding: "12px", border: "2px solid #E5E7EB", borderRadius: "12px", outline: "none", boxSizing: "border-box" }} />
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--theme-darker)", marginBottom: "6px" }}>{babyForm.flow === "hijo" ? "Fecha nacimiento *" : "Última Regla (FUR) *"}</label>
                  <input required type="date" value={babyForm.fecha_nacimiento} onChange={(e) => setBabyForm({...babyForm, fecha_nacimiento: e.target.value})} max={new Date().toISOString().split("T")[0]} style={{ width: "100%", padding: "12px", border: "2px solid #E5E7EB", borderRadius: "12px", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--theme-darker)", marginBottom: "6px" }}>Sexo</label>
                  <select value={babyForm.sexo} onChange={(e) => setBabyForm({...babyForm, sexo: e.target.value})} style={{ width: "100%", padding: "12px", border: "2px solid #E5E7EB", borderRadius: "12px", outline: "none", boxSizing: "border-box" }}>
                    <option value="">Seleccionar...</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--theme-darker)", marginBottom: "6px" }}>Previsión de salud *</label>
                <select required value={babyForm.prevision} onChange={(e) => setBabyForm({...babyForm, prevision: e.target.value})} style={{ width: "100%", padding: "12px", border: "2px solid #E5E7EB", borderRadius: "12px", outline: "none", boxSizing: "border-box" }}>
                  <option value="">Seleccione previsión</option>
                  {previsiones.map(p => (
                    <option key={p.codigo} value={p.codigo}>{p.nombre_visible}</option>
                  ))}
                </select>
              </div>

              {babyForm.flow === "hijo" && (
                <div style={{ background: "rgba(124,92,191,0.03)", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(124,92,191,0.1)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: 700, color: "var(--theme-darker)", cursor: "pointer" }}>
                    <div 
                      onClick={() => setBabyForm({...babyForm, es_prematuro: !babyForm.es_prematuro})}
                      style={{ width: "24px", height: "24px", borderRadius: "6px", border: "2px solid var(--theme-primary)", display: "flex", alignItems: "center", justifyContent: "center", background: babyForm.es_prematuro ? "var(--theme-primary)" : "transparent", cursor: "pointer" }}
                    >
                      {babyForm.es_prematuro && <Check size={14} color="white" />}
                    </div>
                    Mi bebé nació prematuro
                  </label>
                  {babyForm.es_prematuro && (
                    <div style={{ marginTop: "1rem" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--theme-darker)", marginBottom: "6px" }}>Semanas de gestación al nacer *</label>
                      <input required={babyForm.es_prematuro} type="number" min="20" max="36" placeholder="Ej: 34" value={babyForm.semanas_gestacion} onChange={(e) => setBabyForm({...babyForm, semanas_gestacion: e.target.value})} style={{ width: "100%", padding: "12px", border: "2px solid #E5E7EB", borderRadius: "12px", outline: "none", boxSizing: "border-box" }} />
                    </div>
                  )}
                </div>
              )}

              <button disabled={isSaving} type="submit" style={{ width: "100%", padding: "16px", background: "var(--theme-primary)", color: "white", border: "none", borderRadius: "16px", fontSize: "16px", fontWeight: 800, marginTop: "8px", cursor: "pointer", opacity: isSaving ? 0.7 : 1 }}>
                {isSaving ? "Guardando..." : "Guardar Perfil"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
