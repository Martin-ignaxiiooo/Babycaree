import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Plus, X, Check, Trash2, Sparkles, Heart } from "lucide-react";
import DateSelect from "../components/DateSelect";

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

  const handleDeleteBaby = async (e: React.MouseEvent, baby: any) => {
    e.stopPropagation();
    const esDueño = user && baby.usuario_id === user.id;
    const mensaje = esDueño
      ? "¿Estás segura de que quieres eliminar este perfil? Esta acción no se puede deshacer y borra todos sus datos (vacunas, controles, fotos, etc.) para todas las personas con acceso."
      : "Este perfil no es tuyo, lo tienes por invitación. Al quitarlo solo desaparece de TU lista — el dueño y otros familiares con acceso lo van a seguir viendo normalmente. ¿Quitarlo de tu lista?";
    if (!window.confirm(mensaje)) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/profiles/babies/${baby.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBabies();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error al eliminar el perfil.");
    }
  };

  if (loading || !user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito', sans-serif", background: "linear-gradient(160deg, #F6F2FF 0%, #FDF1F5 100%)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "50%",
            border: "4px solid var(--theme-bg-light)", borderTopColor: "var(--theme-primary)",
            animation: "spin 0.8s linear infinite",
          }} />
          <span style={{ color: "var(--theme-dark)", fontWeight: 700 }}>Cargando tus perfiles...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #F6F2FF 0%, #FDF1F5 55%, #FFF8EE 100%)",
      fontFamily: "'Nunito', sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "4rem 1.5rem 3rem",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Blobs decorativos, muy sutiles, solo estética */}
      <div style={{ position: "absolute", top: "-80px", left: "-100px", width: "320px", height: "320px", borderRadius: "50%", background: "radial-gradient(circle, rgba(160,122,223,0.18), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-100px", right: "-80px", width: "380px", height: "380px", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,143,163,0.14), transparent 70%)", pointerEvents: "none" }} />

      <div style={{ textAlign: "center", marginBottom: "3rem", position: "relative", maxWidth: "560px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          background: "var(--theme-bg-light)", color: "var(--theme-primary)",
          padding: "6px 16px", borderRadius: "100px", fontSize: "13px", fontWeight: 800,
          marginBottom: "18px",
        }}>
          <Sparkles size={14} /> Baby Care
        </div>
        <h1 style={{ fontFamily: "'Baloo 2', 'Nunito', sans-serif", fontSize: "2.1rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.6rem", lineHeight: 1.2 }}>
          ¿A quién vamos a cuidar hoy, {user.nombre}?
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.05rem" }}>Elige un perfil para ver su panel, o agrega uno nuevo</p>
      </div>

      <div style={{ display: "flex", gap: "1.75rem", flexWrap: "wrap", justifyContent: "center", maxWidth: "920px", position: "relative" }}>
        {babies.map((baby) => (
          <div
            key={baby.id}
            onClick={() => handleSelectBaby(baby.id)}
            style={{
              background: "white",
              padding: "2rem 1.75rem",
              borderRadius: "26px",
              boxShadow: "0 10px 34px rgba(124,92,191,0.1)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
              width: "220px",
              position: "relative",
              border: "1px solid rgba(124,92,191,0.06)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.boxShadow = "0 20px 45px rgba(124,92,191,0.2)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 34px rgba(124,92,191,0.1)";
            }}
          >
            <div style={{
              width: "84px", height: "84px", borderRadius: "50%",
              background: "linear-gradient(135deg, var(--theme-bg-light), var(--accent-coral-light))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2rem", fontWeight: 800, color: "var(--theme-primary)",
              overflow: "hidden", flexShrink: 0,
              boxShadow: "0 0 0 4px white, 0 0 0 5px rgba(124,92,191,0.1)",
              fontFamily: "'Baloo 2', sans-serif",
            }}>
              {baby.foto_perfil ? (
                <img src={baby.foto_perfil} alt={baby.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : baby.estado === "embarazo" ? (
                <Heart size={30} color="var(--accent-coral)" fill="var(--accent-coral)" />
              ) : (
                baby.nombre.charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "1.15rem", fontWeight: 700, color: "var(--text)" }}>
                {baby.estado === "embarazo" ? `Embarazo de ${baby.nombre}` : baby.nombre}
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--theme-primary)", marginTop: "4px", fontWeight: 700 }}>Ver panel →</p>
            </div>
            <button
              onClick={(e) => handleDeleteBaby(e, baby)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "#FFF0F0",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#DC6B6B",
                cursor: "pointer",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#FFDEDE"}
              onMouseOut={(e) => e.currentTarget.style.background = "#FFF0F0"}
              title="Eliminar perfil"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        {/* Create new baby button */}
        <div
          onClick={() => setIsModalOpen(true)}
          style={{
            background: "rgba(255,255,255,0.5)",
            padding: "2rem 1.75rem",
            borderRadius: "26px",
            border: "2.5px dashed rgba(124,92,191,0.3)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            width: "220px",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = "var(--theme-primary)";
            e.currentTarget.style.background = "rgba(255,255,255,0.85)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = "rgba(124,92,191,0.3)";
            e.currentTarget.style.background = "rgba(255,255,255,0.5)";
          }}
        >
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--theme-bg-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--theme-primary)" }}>
            <Plus size={28} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "1.05rem", fontWeight: 700, color: "var(--theme-primary)" }}>Agregar perfil</h2>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(45,38,64,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ background: "white", padding: "2.25rem", borderRadius: "26px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto", position: "relative", boxShadow: "0 30px 70px rgba(45,38,64,0.3)" }}>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{ position: "absolute", right: "18px", top: "18px", background: "#F3F1F9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-muted)" }}
            >
              <X size={18} />
            </button>
            <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--text)", marginBottom: "1.5rem" }}>Agregar un perfil</h2>

            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => setBabyForm({...babyForm, flow: "hijo"})}
                style={{ flex: 1, padding: "12px", borderRadius: "14px", border: babyForm.flow === "hijo" ? "2px solid var(--theme-primary)" : "2px solid #E5E7EB", background: babyForm.flow === "hijo" ? "var(--theme-bg-light)" : "white", fontWeight: 700, color: babyForm.flow === "hijo" ? "var(--theme-primary)" : "#6B7280", cursor: "pointer" }}
              >
                Bebé nacido
              </button>
              <button
                type="button"
                onClick={() => setBabyForm({...babyForm, flow: "embarazo"})}
                style={{ flex: 1, padding: "12px", borderRadius: "14px", border: babyForm.flow === "embarazo" ? "2px solid var(--theme-primary)" : "2px solid #E5E7EB", background: babyForm.flow === "embarazo" ? "var(--theme-bg-light)" : "white", fontWeight: 700, color: babyForm.flow === "embarazo" ? "var(--theme-primary)" : "#6B7280", cursor: "pointer" }}
              >
                Estoy embarazada
              </button>
            </div>

            <form onSubmit={handleCreateBaby} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>{babyForm.flow === "hijo" ? "Nombre del bebé *" : "Apodo o nombre del bebé *"}</label>
                <input required type="text" placeholder={babyForm.flow === "hijo" ? "Ej: Sofía" : "Ej: Porotito"} value={babyForm.nombre} onChange={(e) => setBabyForm({...babyForm, nombre: e.target.value})} style={{ width: "100%", padding: "12px 14px", border: "2px solid #EDE9F8", borderRadius: "14px", outline: "none", boxSizing: "border-box", fontSize: "15px" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>{babyForm.flow === "hijo" ? "Fecha nacimiento *" : "Última Regla (FUR) *"}</label>
                  <DateSelect required value={babyForm.fecha_nacimiento} onChange={(isoDate) => setBabyForm({...babyForm, fecha_nacimiento: isoDate})} max={new Date().toISOString().split("T")[0]} variant="light" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>Sexo</label>
                  <select value={babyForm.sexo} onChange={(e) => setBabyForm({...babyForm, sexo: e.target.value})} style={{ width: "100%", padding: "12px 14px", border: "2px solid #EDE9F8", borderRadius: "14px", outline: "none", boxSizing: "border-box", fontSize: "15px" }}>
                    <option value="">Seleccionar...</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>Previsión de salud *</label>
                <select required value={babyForm.prevision} onChange={(e) => setBabyForm({...babyForm, prevision: e.target.value})} style={{ width: "100%", padding: "12px 14px", border: "2px solid #EDE9F8", borderRadius: "14px", outline: "none", boxSizing: "border-box", fontSize: "15px" }}>
                  <option value="">Seleccione previsión</option>
                  {previsiones.map(p => (
                    <option key={p.codigo} value={p.codigo}>{p.nombre_visible}</option>
                  ))}
                </select>
              </div>

              {babyForm.flow === "hijo" && (
                <div style={{ background: "var(--theme-bg-light)", padding: "1.4rem", borderRadius: "16px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: 700, color: "var(--text)", cursor: "pointer" }}>
                    <div
                      onClick={() => setBabyForm({...babyForm, es_prematuro: !babyForm.es_prematuro})}
                      style={{ width: "24px", height: "24px", borderRadius: "7px", border: "2px solid var(--theme-primary)", display: "flex", alignItems: "center", justifyContent: "center", background: babyForm.es_prematuro ? "var(--theme-primary)" : "white", cursor: "pointer", flexShrink: 0 }}
                    >
                      {babyForm.es_prematuro && <Check size={14} color="white" />}
                    </div>
                    Mi bebé nació prematuro
                  </label>
                  {babyForm.es_prematuro && (
                    <div style={{ marginTop: "1rem" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>Semanas de gestación al nacer *</label>
                      <input required={babyForm.es_prematuro} type="number" min="20" max="36" placeholder="Ej: 34" value={babyForm.semanas_gestacion} onChange={(e) => setBabyForm({...babyForm, semanas_gestacion: e.target.value})} style={{ width: "100%", padding: "12px 14px", border: "2px solid var(--border)", borderRadius: "14px", outline: "none", boxSizing: "border-box", fontSize: "15px" }} />
                    </div>
                  )}
                </div>
              )}

              <button disabled={isSaving} type="submit" style={{
                width: "100%", padding: "16px",
                background: isSaving ? "#D1D5DB" : "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
                color: "white", border: "none", borderRadius: "16px", fontSize: "16px", fontWeight: 800, marginTop: "8px",
                cursor: isSaving ? "not-allowed" : "pointer",
                boxShadow: isSaving ? "none" : "0 10px 26px var(--theme-shadow)",
                fontFamily: "'Nunito', sans-serif",
              }}>
                {isSaving ? "Guardando..." : "Guardar perfil"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
