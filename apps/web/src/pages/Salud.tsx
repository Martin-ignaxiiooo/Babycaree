import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Syringe, Activity, Save, CheckCircle, Bell, Plus, X, FlaskConical, ClipboardCheck, Mic, MicOff, Pencil } from "lucide-react";
import TopNav from "../components/TopNav";
import DateSelect from "../components/DateSelect";
import TimeSelect from "../components/TimeSelect";
import ExamenesTab from "../components/ExamenesTab";
import ResultadoConsultaModal from "../components/ResultadoConsultaModal";
import EditarCitaModal from "../components/EditarCitaModal";
import { useDictado } from "../hooks/useDictado";
import { interpretarDictado } from "../utils/interpretarDictado";

export default function Salud() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [bebeId, setBebeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"vacunas" | "controles" | "examenes" | "crecimiento">("vacunas");
  const [loading, setLoading] = useState(true);

  const [vacunas, setVacunas] = useState<any[]>([]);
  // Registro explícito de vacunas: no se guarda nada hasta presionar
  // "Registrar". editingVacunaId marca cuál tarjeta tiene el formulario
  // abierto; formVacuna guarda los valores en borrador (sin persistir).
  const [editingVacunaId, setEditingVacunaId] = useState<number | null>(null);
  const [formVacuna, setFormVacuna] = useState<{ fecha_aplicacion: string; notas: string }>({ fecha_aplicacion: "", notas: "" });
  const [guardandoVacuna, setGuardandoVacuna] = useState(false);

  // Estado para Crecimiento
  const [crecimientoData, setCrecimientoData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pesoInput, setPesoInput] = useState("");
  const [tallaInput, setTallaInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [rolAcceso, setRolAcceso] = useState<string>("propietario");
  const [perfilEstado, setPerfilEstado] = useState<string>("nacido");

  // Estado para Citas / Controles
  const [citas, setCitas] = useState<any[]>([]);
  const [fechaCitaDate, setFechaCitaDate] = useState("");
  const [fechaCitaTime, setFechaCitaTime] = useState("");
  // Se arma como Date y se envía en ISO (con "Z" explícito) para que
  // Postgres no interprete la hora local como si fuera UTC — mismo fix
  // que se aplica al guardado por voz, ver guardarDesdeVoz más abajo.
  const fechaCitaISO = (): string | null => {
    if (!fechaCitaDate || !fechaCitaTime) return null;
    const [anio, mes, dia] = fechaCitaDate.split("-").map(Number);
    const [hora, minuto] = fechaCitaTime.split(":").map(Number);
    const d = new Date(anio, mes - 1, dia, hora, minuto);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };
  const fechaCita = fechaCitaDate && fechaCitaTime ? `${fechaCitaDate}T${fechaCitaTime}` : "";
  const [medico, setMedico] = useState("");
  const [notas, setNotas] = useState("");
  const [isSavingCita, setIsSavingCita] = useState(false);
  // Cita cuyo resultado se está registrando (modal "¿cómo te fue?").
  const [citaResultado, setCitaResultado] = useState<any | null>(null);
  // Cita cuyos datos base (fecha, médico, lugar…) se están corrigiendo.
  const [citaEditando, setCitaEditando] = useState<any | null>(null);

  // control sano vs consulta puntual
  const [tipoCita, setTipoCita] = useState<"control" | "cita">("control");

  // Feedback del guardado automático por voz: null = nada que mostrar.
  const [guardadoPorVoz, setGuardadoPorVoz] = useState<
    { ok: true; cuando: string } | { ok: false; motivo: string } | null
  >(null);
  const [guardandoPorVoz, setGuardandoPorVoz] = useState(false);

  /**
   * Guarda directo con los datos ya interpretados del audio, sin pasar por
   * el estado de React (que todavía no se habría actualizado en este mismo
   * tick). Rellena el formulario igual, por si el usuario quiere revisar o
   * corregir algo después de guardado.
   */
  const guardarDesdeVoz = async (datos: ReturnType<typeof interpretarDictado>, textoOriginal: string) => {
    const p = (n: number) => String(n).padStart(2, "0");

    if (datos.fecha) {
      setFechaCitaDate(`${datos.fecha.getFullYear()}-${p(datos.fecha.getMonth() + 1)}-${p(datos.fecha.getDate())}`);
      setFechaCitaTime(`${p(datos.fecha.getHours())}:${p(datos.fecha.getMinutes())}`);
    }
    if (datos.medico) setMedico(datos.medico);
    if (datos.tipo) setTipoCita(datos.tipo);
    setNotas(textoOriginal);

    // Sin fecha no hay nada que guardar: solo dejamos el formulario
    // rellenado con lo que sí se entendió, para completar a mano.
    if (!datos.fecha) {
      setGuardadoPorVoz({ ok: false, motivo: "No logramos entender la fecha. Revisa el formulario y complétala." });
      return;
    }

    setGuardandoPorVoz(true);
    setGuardadoPorVoz(null);
    try {
      const tipoFinal = datos.tipo ?? "cita";
      const res = await fetch(`https://babycare-backend-msyq.onrender.com/api/v1/salud/${bebeId}/citas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          // toISOString() convierte la hora local (la que realmente se
          // dictó/entendió) a UTC de forma explícita ("Z"). Mandar el string
          // sin offset (como antes) hacía que Postgres lo interpretara en
          // su propio timezone de sesión (UTC), corriendo la hora 3-4 horas.
          fecha_cita: datos.fecha.toISOString(),
          medico: datos.medico || null,
          notas: textoOriginal,
          tipo: tipoFinal,
          especialidad: datos.especialidad || (tipoFinal === "control" ? "Control sano" : "Consulta"),
          lugar: datos.lugar || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo guardar la cita.");
      }

      // Se limpia el formulario, igual que hace el guardado manual.
      setFechaCitaDate("");
      setFechaCitaTime("");
      setMedico("");
      setNotas("");
      fetchCitas();

      setGuardadoPorVoz({
        ok: true,
        cuando: datos.fecha.toLocaleDateString("es-CL", { day: "numeric", month: "long" }),
      });
    } catch (e: any) {
      setGuardadoPorVoz({ ok: false, motivo: e.message || "No se pudo guardar. Intenta con el formulario." });
    } finally {
      setGuardandoPorVoz(false);
    }
  };

  // Dictado por voz para agendar. Usa la Web Speech API del navegador:
  // es gratis y el audio no sale del dispositivo hacia nuestros servidores.
  const dictado = useDictado((textoFinal) => {
    const datos = interpretarDictado(textoFinal);
    guardarDesdeVoz(datos, textoFinal);
  });


  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    const savedBebeId = localStorage.getItem("selectedBabyId");
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!savedBebeId || !uuidRegex.test(savedBebeId)) {
      localStorage.removeItem("selectedBabyId");
      navigate("/seleccionar-perfil");
      return;
    }
    setBebeId(savedBebeId);
    setLoading(false);
  }, [token, navigate]);

  useEffect(() => {
    if (bebeId && token) {
      if (activeTab === "vacunas") fetchVacunas();
      if (activeTab === "crecimiento") fetchCrecimientoData();
      if (activeTab === "controles") fetchCitas();
      
      // Fetch user role and profile state for this baby
      fetch(`https://babycare-backend-msyq.onrender.com/api/v1/home/${bebeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.rol_acceso) setRolAcceso(data.rol_acceso);
        if (data.perfil?.estado) {
          setPerfilEstado(data.perfil.estado);
          if (data.perfil.estado === "embarazo") {
            setActiveTab("controles");
            fetchCitas();
          }
        }
      })
      .catch(console.error);
    }
  }, [bebeId, activeTab, token]);

  const fetchVacunas = async () => {
    try {
      const res = await fetch(`https://babycare-backend-msyq.onrender.com/api/v1/salud/${bebeId}/vacunas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setVacunas(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  const fetchCrecimientoData = async () => {
    try {
      const res = await fetch(`https://babycare-backend-msyq.onrender.com/api/v1/home/${bebeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCrecimientoData(data.crecimiento);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCitas = async () => {
    try {
      const res = await fetch(`https://babycare-backend-msyq.onrender.com/api/v1/salud/${bebeId}/citas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCitas(await res.json());
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveGrowth = async () => {
    if (!pesoInput || !tallaInput || !bebeId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`https://babycare-backend-msyq.onrender.com/api/v1/home/${bebeId}/crecimiento`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ peso: parseFloat(pesoInput), talla: parseFloat(tallaInput) })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setPesoInput("");
        setTallaInput("");
        fetchCrecimientoData();
      }
    } catch (error) {
      console.error(error);
      alert("Error al guardar las medidas");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaCita) return;
    setIsSavingCita(true);
    try {
      const res = await fetch(`https://babycare-backend-msyq.onrender.com/api/v1/salud/${bebeId}/citas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fecha_cita: fechaCitaISO(), medico, notas, tipo: tipoCita, especialidad: tipoCita === "control" ? "Control sano" : "Consulta" })
      });
      if (res.ok) {
        setFechaCitaDate("");
        setFechaCitaTime("");
        setMedico("");
        setNotas("");
        fetchCitas();
      }
    } catch (error) {
      console.error(error);
      alert("Error al guardar la cita");
    } finally {
      setIsSavingCita(false);
    }
  };


  // Abre el formulario de registro para una vacuna (no guarda nada todavía).
  const abrirRegistroVacuna = (vacuna: any) => {
    if (rolAcceso.startsWith('solo_lectura')) return;
    setEditingVacunaId(vacuna.vacuna_id);
    setFormVacuna({
      fecha_aplicacion: vacuna.fecha_aplicacion
        ? vacuna.fecha_aplicacion.split('T')[0]
        : new Date().toISOString().split('T')[0],
      notas: vacuna.notas || "",
    });
  };

  const cancelarRegistroVacuna = () => {
    setEditingVacunaId(null);
    setFormVacuna({ fecha_aplicacion: "", notas: "" });
  };

  // Único punto donde de verdad se guarda algo — recién al presionar
  // "Registrar". Antes cada cambio de fecha/notas se guardaba solo con
  // tocar el campo, sin que el usuario confirmara nada.
  const confirmarRegistroVacuna = async (vacunaId: number) => {
    if (!formVacuna.fecha_aplicacion) return;
    setGuardandoVacuna(true);
    try {
      const res = await fetch(`https://babycare-backend-msyq.onrender.com/api/v1/salud/${bebeId}/vacunas/${vacunaId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          aplicada: true,
          fecha_aplicacion: formVacuna.fecha_aplicacion,
          notas: formVacuna.notas || null,
        })
      });
      if (res.ok) {
        setVacunas(prev => prev.map(v => v.vacuna_id === vacunaId
          ? { ...v, aplicada: true, fecha_aplicacion: formVacuna.fecha_aplicacion, notas: formVacuna.notas }
          : v));
        cancelarRegistroVacuna();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setGuardandoVacuna(false);
    }
  };

  // Desmarcar una vacuna ya registrada sí es inmediato (no requiere llenar
  // datos), pero pide confirmación porque borra la fecha/notas guardadas.
  const desmarcarVacuna = async (vacuna: any) => {
    if (rolAcceso.startsWith('solo_lectura')) return;
    if (!window.confirm(`¿Quitar el registro de "${vacuna.nombre}"? Se borrará la fecha y las notas guardadas.`)) return;
    try {
      const res = await fetch(`https://babycare-backend-msyq.onrender.com/api/v1/salud/${bebeId}/vacunas/${vacuna.vacuna_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ aplicada: false, fecha_aplicacion: null, notas: null })
      });
      if (res.ok) {
        setVacunas(prev => prev.map(v => v.vacuna_id === vacuna.vacuna_id ? { ...v, aplicada: false, fecha_aplicacion: null, notas: null } : v));
      }
    } catch (error) {
      console.error(error);
    }
  };



  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Cargando módulo de salud...</div>;
  if (!bebeId) return <div style={{ padding: "40px", textAlign: "center" }}>Debes registrar un bebé primero.</div>;

  // Cálculos para el Gráfico de Crecimiento
  const seriePeso = crecimientoData?.serie_peso || [];
  const etiquetasFecha = crecimientoData?.etiquetas_fecha || [];
  const serieOms = crecimientoData?.serie_oms || [];
  
  const maxPoints = 6;
  const paddingNeeded = maxPoints - seriePeso.length;
  const displayPesos = paddingNeeded > 0 ? [...Array(paddingNeeded).fill(null), ...seriePeso] : seriePeso.slice(-6);
  const displayFechas = paddingNeeded > 0 ? [...Array(paddingNeeded).fill(""), ...etiquetasFecha] : etiquetasFecha.slice(-6);
  const displayOms = paddingNeeded > 0 ? [...Array(paddingNeeded).fill(null), ...serieOms] : serieOms.slice(-6);

  const xPositions = [60, 110, 160, 210, 260, 310];
  const mapY = (val: number | null) => {
    if (val === null || val === 0) return null;
    const y = 85 - (val * 5); 
    return Math.max(10, Math.min(85, y));
  };

  let pointsString = "";
  displayPesos.forEach((w: number | null, i: number) => {
    const y = mapY(w);
    if (y !== null) pointsString += `${xPositions[i]},${y} `;
  });

  let omsPointsString = "";
  displayOms.forEach((w: number | null, i: number) => {
    const y = mapY(w);
    if (y !== null) omsPointsString += `${xPositions[i]},${y} `;
  });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, #FAF9FD 0%, #F6F2FF 100%)", fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column" }}>
      
      {/* ── TOP NAV GLOBAL ── */}
      <TopNav user={user} activePath="/salud" perfilEstado={perfilEstado} />

      {/* ── HEADER ── */}
      <div style={{ background: "linear-gradient(120deg, var(--theme-darker) 0%, #3A2E5C 55%, var(--theme-dark) 100%)", color: "#fff", padding: "48px 40px 0" }}>
        <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "none", color: "var(--theme-light)", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
          <ArrowLeft size={16} /> Volver al Dashboard
        </button>
        
        <div style={{ display: "flex", alignItems: "center", gap: "24px", paddingBottom: "32px" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "22px", background: "linear-gradient(135deg, var(--accent-coral), var(--theme-light))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 8px 24px rgba(255,143,163,0.3)" }}>
            <Syringe size={38} />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "32px", fontWeight: 700, margin: 0 }}>Salud y Crecimiento</h1>
            <div style={{ fontSize: "15px", color: "rgba(255,255,255,0.75)", marginTop: "4px", fontWeight: 600 }}>Administra las vacunas y el progreso de tu bebé</div>
          </div>
        </div>

        {/* TABS */}
        <div className="responsive-overflow" style={{ display: "flex", gap: "32px", borderBottom: "1px solid rgba(255,255,255,0.1)", whiteSpace: "nowrap" }}>
          {perfilEstado !== "embarazo" && (
            <button 
              style={{ padding: "16px 0", background: "none", border: "none", borderBottom: activeTab === "vacunas" ? "3px solid var(--accent-coral)" : "3px solid transparent", color: activeTab === "vacunas" ? "#fff" : "rgba(255,255,255,0.6)", fontSize: "15px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
              onClick={() => setActiveTab("vacunas")}
            >
              <Syringe size={18} /> Vacunas PNI
            </button>
          )}
          
          <button 
            style={{ padding: "16px 0", background: "none", border: "none", borderBottom: activeTab === "controles" ? "3px solid var(--accent-coral)" : "3px solid transparent", color: activeTab === "controles" ? "#fff" : "rgba(255,255,255,0.6)", fontSize: "15px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            onClick={() => setActiveTab("controles")}
          >
            <Activity size={18} /> {perfilEstado === "embarazo" ? "Controles Prenatales" : "Controles Pediátricos"}
          </button>

          <button 
            style={{ padding: "16px 0", background: "none", border: "none", borderBottom: activeTab === "examenes" ? "3px solid var(--accent-coral)" : "3px solid transparent", color: activeTab === "examenes" ? "#fff" : "rgba(255,255,255,0.6)", fontSize: "15px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            onClick={() => setActiveTab("examenes")}
          >
            <FlaskConical size={18} /> Exámenes
          </button>

          {perfilEstado !== "embarazo" && (
            <button 
              style={{ padding: "16px 0", background: "none", border: "none", borderBottom: activeTab === "crecimiento" ? "3px solid var(--accent-coral)" : "3px solid transparent", color: activeTab === "crecimiento" ? "#fff" : "rgba(255,255,255,0.6)", fontSize: "15px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
              onClick={() => setActiveTab("crecimiento")}
            >
              <Activity size={18} /> Crecimiento
            </button>
          )}
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="page-container">
        
        {activeTab === "vacunas" && (
          <div style={{ background: "#fff", borderRadius: "24px", padding: "32px", boxShadow: "0 6px 24px rgba(124,92,191,0.07)" }}>
            <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "21px", fontWeight: 700, color: "var(--theme-darker)", marginBottom: "24px" }}>Calendario de Vacunación</h2>
            
            {vacunas.length === 0 ? (
              <p style={{ color: "#6B7280" }}>No hay vacunas registradas en el sistema.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {vacunas.map((vacuna) => {
                  const editando = editingVacunaId === vacuna.vacuna_id;
                  return (
                  <div key={vacuna.vacuna_id} style={{ display: "flex", alignItems: "flex-start", gap: "20px", padding: "22px", border: vacuna.aplicada ? "1px solid #DCFCE7" : "1px solid #F1EEFA", borderRadius: "18px", background: vacuna.aplicada ? "#F3FDF6" : "#fff", boxShadow: "0 4px 16px rgba(124,92,191,0.06)" }}>
                    
                    <button 
                      onClick={() => vacuna.aplicada ? desmarcarVacuna(vacuna) : (editando ? cancelarRegistroVacuna() : abrirRegistroVacuna(vacuna))}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: "4px" }}
                      title={vacuna.aplicada ? "Quitar registro" : "Registrar aplicación"}
                    >
                      {vacuna.aplicada ? <CheckCircle size={28} color="#16A34A" /> : <div style={{ width: "28px", height: "28px", borderRadius: "50%", border: editando ? "2px solid var(--theme-primary)" : "2px solid #D1D5DB" }}></div>}
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

                      {/* Ya registrada: se muestra en modo lectura, con opción de editar */}
                      {vacuna.aplicada && !editando && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", padding: "16px", background: "#fff", borderRadius: "8px", border: "1px solid #DCFCE7" }}>
                          <div style={{ fontSize: "13px", color: "#374151" }}>
                            <strong>Aplicada:</strong> {vacuna.fecha_aplicacion ? new Date(vacuna.fecha_aplicacion).toLocaleDateString('es-CL') : "-"}
                            {vacuna.notas && <div style={{ marginTop: "4px", color: "#6B7280" }}>{vacuna.notas}</div>}
                          </div>
                          <button
                            onClick={() => abrirRegistroVacuna(vacuna)}
                            style={{ background: "none", border: "none", color: "var(--theme-primary)", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                          >
                            Editar
                          </button>
                        </div>
                      )}

                      {/* Formulario de registro: no se guarda nada hasta presionar "Registrar" */}
                      {editando && (
                        <div style={{ marginTop: "12px", padding: "16px", background: "#F9FAFB", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#4B5563", marginBottom: "4px" }}>Fecha de aplicación *</label>
                              <DateSelect
                                value={formVacuna.fecha_aplicacion}
                                onChange={(isoDate) => setFormVacuna(f => ({ ...f, fecha_aplicacion: isoDate }))}
                                max={new Date().toISOString().split('T')[0]}
                                variant="light"
                              />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#4B5563", marginBottom: "4px" }}>Notas / Reacciones</label>
                              <input 
                                type="text" 
                                placeholder="Fiebre leve, etc."
                                value={formVacuna.notas}
                                onChange={(e) => setFormVacuna(f => ({ ...f, notas: e.target.value }))}
                                style={{ width: "100%", padding: "8px", border: "1px solid #E5E7EB", borderRadius: "6px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                              />
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "10px" }}>
                            <button
                              onClick={() => confirmarRegistroVacuna(vacuna.vacuna_id)}
                              disabled={!formVacuna.fecha_aplicacion || guardandoVacuna}
                              style={{
                                background: !formVacuna.fecha_aplicacion || guardandoVacuna ? "#D1D5DB" : "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
                                color: "#fff", border: "none", borderRadius: "10px", padding: "10px 20px",
                                fontWeight: 800, fontSize: "14px", cursor: !formVacuna.fecha_aplicacion || guardandoVacuna ? "not-allowed" : "pointer",
                              }}
                            >
                              {guardandoVacuna ? "Guardando..." : "Registrar"}
                            </button>
                            <button
                              onClick={cancelarRegistroVacuna}
                              style={{ background: "none", border: "1px solid #E5E7EB", color: "#6B7280", borderRadius: "10px", padding: "10px 20px", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "controles" && (
          <div style={{ background: "#fff", borderRadius: "24px", padding: "32px", boxShadow: "0 6px 24px rgba(124,92,191,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "21px", fontWeight: 700, color: "var(--theme-darker)", margin: 0 }}>
                {perfilEstado === "embarazo" ? "Controles Prenatales" : "Controles Médicos"}
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "30px" }}>
              {loading ? (
                <p style={{ color: "rgba(0,0,0,0.5)" }}>Cargando citas...</p>
              ) : citas.length === 0 ? (
                <p style={{ color: "rgba(0,0,0,0.5)", fontSize: "14px" }}>No tienes controles registrados aún.</p>
              ) : (
                citas.map(cita => {
                  const date = new Date(cita.fecha_cita);
                  const isPast = date < new Date();
                  return (
                    <div key={cita.id} style={{ 
                      background: isPast ? "#F9FAFB" : "#FDF4FF", 
                      borderRadius: "16px", 
                      padding: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderLeft: `4px solid ${isPast ? "#E5E7EB" : "#D4A5E3"}`
                    }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <h4 style={{ margin: 0, fontSize: "16px", color: isPast ? "#6B7280" : "var(--theme-darker)" }}>
                            {cita.especialidad || cita.notas || "Control Médico"}
                          </h4>
                          <span
                            style={{
                              fontSize: "10.5px", fontWeight: 800, padding: "2px 9px",
                              borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.3px",
                              background: cita.tipo === "control" ? "#E8F7F1" : "var(--theme-bg-light)",
                              color: cita.tipo === "control" ? "#3E8E6E" : "var(--theme-primary)",
                            }}
                          >
                            {cita.tipo === "control" ? "Control" : "Cita"}
                          </span>
                        </div>
                        <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", gap: "10px" }}>
                          <span>{cita.medico || "Sin especificar doctor"}</span>
                          {cita.lugar && <span>• {cita.lugar}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, fontSize: "15px", color: isPast ? "#6B7280" : "#D4A5E3" }}>
                          {date.toLocaleDateString("es-CL", { day: 'numeric', month: 'short' })}
                        </div>
                        <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.5)" }}>
                          {date.toLocaleTimeString("es-CL", { hour: '2-digit', minute:'2-digit' })}
                        </div>
                        <div style={{ display: "flex", gap: "6px", marginTop: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                          <button
                            onClick={() => setCitaEditando(cita)}
                            style={{
                              padding: "6px 10px", borderRadius: "100px",
                              border: "1.5px solid #E4DBF7", cursor: "pointer", fontFamily: "'Nunito', sans-serif",
                              fontWeight: 800, fontSize: "11.5px", display: "inline-flex",
                              alignItems: "center", gap: "4px", whiteSpace: "nowrap",
                              background: "#fff", color: "var(--theme-darker)",
                            }}
                          >
                            <Pencil size={12} /> Editar
                          </button>
                          {/* Solo para citas ya pasadas: registrar lo que ocurrió. */}
                          {isPast && (
                            <button
                              onClick={() => setCitaResultado(cita)}
                              style={{
                                padding: "6px 12px", borderRadius: "100px",
                                border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif",
                                fontWeight: 800, fontSize: "11.5px", display: "inline-flex",
                                alignItems: "center", gap: "5px", whiteSpace: "nowrap",
                                background: cita.diagnostico ? "#E8F7F1" : "var(--theme-primary)",
                                color: cita.diagnostico ? "#3E8E6E" : "#fff",
                              }}
                            >
                              <ClipboardCheck size={13} />
                              {cita.diagnostico ? "Ver resultado" : "¿Cómo te fue?"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Formulario Nueva Cita */}
            <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "var(--theme-darker)" }}>Agregar Nueva Cita</h3>

              {/* Dictado por voz (Chrome/Edge). Se esconde si el navegador no lo soporta. */}
              {dictado.soportado && (
                <div style={{ background: "var(--theme-bg-light)", borderRadius: "16px", padding: "16px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={dictado.escuchando ? dictado.detener : dictado.empezar}
                      disabled={guardandoPorVoz}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "8px",
                        padding: "11px 20px", borderRadius: "100px", border: "none",
                        cursor: guardandoPorVoz ? "not-allowed" : "pointer", fontFamily: "'Nunito', sans-serif",
                        fontWeight: 800, fontSize: "13.5px", color: "#fff",
                        background: dictado.escuchando ? "#D97070" : "var(--theme-primary)",
                        opacity: guardandoPorVoz ? 0.6 : 1,
                      }}
                    >
                      {dictado.escuchando ? <MicOff size={16} /> : <Mic size={16} />}
                      {guardandoPorVoz ? "Guardando…" : dictado.escuchando ? "Detener" : "Dictar la cita"}
                    </button>
                    <span style={{ fontSize: "12.5px", color: "#6B647F", flex: "1 1 220px", lineHeight: 1.5 }}>
                      Di algo como: “control sano el viernes 3 de octubre a las diez y media con la doctora Pérez”. Se detiene y guarda solo, apenas hagas una pausa.
                    </span>
                  </div>
                  {dictado.texto && (
                    <div style={{ marginTop: "12px", background: "#fff", borderRadius: "12px", padding: "12px 14px", fontSize: "13.5px", color: "var(--theme-darker)", fontStyle: "italic" }}>
                      “{dictado.texto}”
                    </div>
                  )}
                  {dictado.error && (
                    <div style={{ marginTop: "10px", color: "#D97070", fontSize: "12.5px", fontWeight: 600 }}>
                      {dictado.error}
                    </div>
                  )}
                  {guardadoPorVoz?.ok === true && (
                    <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px", color: "#3E8E6E", fontSize: "13px", fontWeight: 700 }}>
                      <CheckCircle size={16} />
                      Cita guardada para el {guardadoPorVoz.cuando}. Puedes corregir cualquier dato abajo.
                    </div>
                  )}
                  {guardadoPorVoz?.ok === false && (
                    <div style={{ marginTop: "10px", color: "#D97070", fontSize: "12.5px", fontWeight: 600 }}>
                      {guardadoPorVoz.motivo}
                    </div>
                  )}
                </div>
              )}

              {/* Tipo: control sano vs consulta puntual */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap" }}>
                {(["control", "cita"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipoCita(t)}
                    style={{
                      flex: "1 1 160px", padding: "12px", borderRadius: "14px",
                      cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 800,
                      fontSize: "13.5px", textAlign: "left",
                      border: tipoCita === t ? "2px solid var(--theme-primary)" : "2px solid #E4DBF7",
                      background: tipoCita === t ? "var(--theme-primary)" : "#fff",
                      color: tipoCita === t ? "#fff" : "var(--theme-darker)",
                    }}
                  >
                    {t === "control" ? "Control sano" : "Cita médica"}
                    <div style={{ fontSize: "11.5px", fontWeight: 600, opacity: 0.8, marginTop: "2px" }}>
                      {t === "control" ? "Revisión periódica" : "Por un motivo puntual"}
                    </div>
                  </button>
                ))}
              </div>
              
              <form onSubmit={handleSaveCita} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 220px" }}>
                    <label style={{ display: "block", fontSize: "12px", marginBottom: "8px", color: "#6B7280", fontWeight: 700 }}>Fecha</label>
                    <DateSelect
                      value={fechaCitaDate}
                      onChange={setFechaCitaDate}
                      required
                      variant="light"
                    />
                  </div>
                  <div style={{ flex: "1 1 140px" }}>
                    <label style={{ display: "block", fontSize: "12px", marginBottom: "8px", color: "#6B7280", fontWeight: 700 }}>Hora</label>
                    <TimeSelect
                      value={fechaCitaTime}
                      onChange={setFechaCitaTime}
                      required
                      variant="light"
                    />
                  </div>
                  <div style={{ flex: "1 1 200px" }}>
                    <label style={{ display: "block", fontSize: "12px", marginBottom: "8px", color: "#6B7280", fontWeight: 700 }}>Doctor/Centro (Opcional)</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Dr. Silva - Centro Médico"
                      value={medico}
                      onChange={e => setMedico(e.target.value)}
                      style={{ 
                        width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #E5E7EB", 
                        background: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "Nunito"
                      }} 
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "8px", color: "#6B7280", fontWeight: 700 }}>Notas / Título</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Ecografía Estructural"
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    style={{ 
                      width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #E5E7EB", 
                      background: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "Nunito"
                    }} 
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button 
                    type="submit" 
                    disabled={isSavingCita || !fechaCita}
                    style={{ 
                      background: isSavingCita || !fechaCita ? "#F3F4F6" : "var(--theme-primary)",
                      color: isSavingCita || !fechaCita ? "#9CA3AF" : "#fff",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "12px",
                      fontWeight: 700,
                      cursor: isSavingCita || !fechaCita ? "not-allowed" : "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {isSavingCita ? "Guardando..." : "Guardar Cita"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "examenes" && bebeId && (
          <ExamenesTab bebeId={bebeId} token={token!} />
        )}

        {activeTab === "crecimiento" && (
          <div style={{ background: "#fff", borderRadius: "24px", padding: "32px", boxShadow: "0 6px 24px rgba(124,92,191,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "21px", fontWeight: 700, color: "var(--theme-darker)", margin: 0 }}>
                Evolución de Crecimiento
              </h2>
              {!rolAcceso.startsWith('solo_lectura') && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  style={{
                    background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))", color: "#fff",
                    padding: "8px 16px", borderRadius: "12px", border: "none",
                    fontSize: "13px", fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "6px"
                  }}
                >
                  <Plus size={16} /> Registrar Medidas
                </button>
              )}
            </div>
            
            <div style={{ width: "100%", overflowX: "auto" }}>
              <svg viewBox="0 0 340 120" style={{ width: "100%", height: "auto", overflow: "visible", minWidth: "340px" }}>
                <rect width="340" height="100" fill="#F9FAFB" rx="8"/>
                
                {/* Y Axes Lines */}
                <line x1="40" y1="10" x2="40" y2="85" stroke="#E5E7EB" strokeWidth="0.8"/>
                <line x1="40" y1="85" x2="330" y2="85" stroke="#E5E7EB" strokeWidth="0.8"/>
                <line x1="40" y1="35" x2="330" y2="35" stroke="#F3F4F6" strokeWidth="0.6"/>
                <line x1="40" y1="60" x2="330" y2="60" stroke="#F3F4F6" strokeWidth="0.6"/>
                
                {/* Y Axis Labels */}
                <text x="35" y="13" textAnchor="end" fontSize="8" fill="#9CA3AF">15kg</text>
                <text x="35" y="38" textAnchor="end" fontSize="8" fill="#9CA3AF">10kg</text>
                <text x="35" y="63" textAnchor="end" fontSize="8" fill="#9CA3AF">5kg</text>
                <text x="35" y="88" textAnchor="end" fontSize="8" fill="#9CA3AF">0kg</text>
                
                {/* X Axis Labels (Dates) */}
                {displayFechas.map((fecha: string, idx: number) => (
                  <text key={idx} x={xPositions[idx]} y="105" textAnchor="middle" fontSize="9" fill="#9CA3AF" fontWeight="600">
                    {fecha || ""}
                  </text>
                ))}
                
                {/* P50 reference line (OMS) */}
                {omsPointsString && (
                  <polyline points={omsPointsString} fill="none" stroke="#E5E7EB" strokeWidth="1.5" strokeDasharray="4,3"/>
                )}
                
                {/* Dynamic Data Line */}
                {pointsString && (
                  <polyline points={pointsString} fill="none" stroke="var(--theme-primary)" strokeWidth="2.5" strokeLinejoin="round"/>
                )}
                
                {/* Dynamic Data Points */}
                {displayPesos.map((w: number | null, i: number) => {
                  const y = mapY(w);
                  if (y === null) return null;
                  return <circle key={i} cx={xPositions[i]} cy={y} r={i === maxPoints - 1 && w !== null ? 4.5 : 3.5} 
                    fill="var(--theme-primary)" stroke={i === maxPoints - 1 ? "#fff" : "none"} strokeWidth={2}/>;
                })}
              </svg>
            </div>
          </div>
        )}

      </div>

      {/* ── MODAL REGISTRO CRECIMIENTO ── */}
      {isModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "#fff", padding: "32px", borderRadius: "24px", width: "90%", maxWidth: "400px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "21px", fontWeight: 700, color: "var(--theme-darker)", margin: 0 }}>Registrar Medidas</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={24} color="#6B7280" />
              </button>
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "8px", color: "#4B5563" }}>Peso (kg)</label>
              <input 
                type="number" 
                step="0.01"
                value={pesoInput}
                onChange={e => setPesoInput(e.target.value)}
                placeholder="Ej. 7.4"
                style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #E5E7EB", outline: "none", fontSize: "15px" }}
              />
            </div>

            <div style={{ marginBottom: "32px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "8px", color: "#4B5563" }}>Talla (cm)</label>
              <input 
                type="number" 
                step="0.1"
                value={tallaInput}
                onChange={e => setTallaInput(e.target.value)}
                placeholder="Ej. 67.5"
                style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #E5E7EB", outline: "none", fontSize: "15px" }}
              />
            </div>

            <button 
              onClick={handleSaveGrowth}
              disabled={isSaving || !pesoInput || !tallaInput}
              style={{ 
                width: "100%", background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))", color: "#fff", 
                padding: "16px", borderRadius: "14px", border: "none", 
                fontSize: "16px", fontWeight: 800, cursor: isSaving ? "not-allowed" : "pointer",
                opacity: (isSaving || !pesoInput || !tallaInput) ? 0.6 : 1
              }}
            >
              {isSaving ? "Guardando..." : "Guardar Registro"}
            </button>
          </div>
        </div>
      )}

      {/* Modal: resultado de la consulta */}
      {citaResultado && bebeId && (
        <ResultadoConsultaModal
          bebeId={bebeId}
          cita={citaResultado}
          token={token!}
          onClose={() => setCitaResultado(null)}
          onGuardado={fetchCitas}
        />
      )}

      {/* Modal: corregir fecha, médico, lugar, tipo… de una cita ya creada. */}
      {citaEditando && bebeId && (
        <EditarCitaModal
          bebeId={bebeId}
          cita={citaEditando}
          token={token!}
          onClose={() => setCitaEditando(null)}
          onGuardado={fetchCitas}
        />
      )}
    </div>
  );
}
