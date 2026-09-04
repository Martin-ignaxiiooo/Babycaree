import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Syringe, CheckCircle, Plus, X, FlaskConical, ClipboardCheck, Mic, MicOff, Pencil, Trash2, FileDown, CalendarCheck, TrendingUp } from "lucide-react";
import TopNav from "../components/TopNav";
import DateSelect from "../components/DateSelect";
import TimeSelect from "../components/TimeSelect";
import ExamenesTab from "../components/ExamenesTab";
import ResultadoConsultaModal from "../components/ResultadoConsultaModal";
import EditarCitaModal from "../components/EditarCitaModal";
import InformeMedico from "../components/InformeMedico";
import { useDictado } from "../hooks/useDictado";
import { interpretarDictado } from "../utils/interpretarDictado";

export default function Salud() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [bebeId, setBebeId] = useState<string | null>(null);
  // Controles es la primera pestaña: es lo que se consulta y agenda más
  // seguido, y así el registro por voz queda a un toque de distancia.
  const [activeTab, setActiveTab] = useState<"vacunas" | "controles" | "examenes" | "crecimiento">("controles");
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
  const [perfil, setPerfil] = useState<any>(null);
  const [showInforme, setShowInforme] = useState(false);
  const [showFormCita, setShowFormCita] = useState(false);

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
    { ok: true; cuando: string; duplicado?: string } | { ok: false; motivo: string } | null
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

      // Como el guardado por voz es automático (sin confirmación manual),
      // no bloqueamos con un diálogo: se guarda igual, pero se avisa si ya
      // había otra cita el mismo día, por si fue un dictado duplicado.
      const duplicado = buscarDuplicadoMismoDia(datos.fecha);

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
        duplicado: duplicado
          ? `Ojo: ya tenías otra cita ese mismo día${duplicado.medico ? ` (${duplicado.medico})` : ""}. Revisa que no sea un duplicado.`
          : undefined,
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
        // El informe médico necesita el perfil completo (nombre, fecha de
        // nacimiento, previsión), no solo el estado.
        if (data.perfil) setPerfil({ ...data.perfil, nombre: data.hero?.nombre ?? data.perfil.nombre });
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

  const eliminarCita = async (citaId: string) => {
    if (!confirm("¿Eliminar esta cita? No se puede deshacer.")) return;
    try {
      const res = await fetch(`https://babycare-backend-msyq.onrender.com/api/v1/salud/${bebeId}/citas/${citaId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCitas();
      } else {
        alert("No se pudo eliminar la cita.");
      }
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar la cita.");
    }
  };

  /**
   * ¿Ya hay otra cita el mismo día? Sirve para avisar de un posible
   * duplicado (por ejemplo, dictar la misma cita dos veces por error).
   * `excluirId` deja afuera a la propia cita al editarla.
   */
  const buscarDuplicadoMismoDia = (fecha: Date, excluirId?: string): any | null => {
    return (
      citas.find((c) => {
        if (excluirId && c.id === excluirId) return false;
        const f = new Date(c.fecha_cita);
        return (
          f.getFullYear() === fecha.getFullYear() &&
          f.getMonth() === fecha.getMonth() &&
          f.getDate() === fecha.getDate()
        );
      }) ?? null
    );
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

    const iso = fechaCitaISO();
    if (iso) {
      const duplicado = buscarDuplicadoMismoDia(new Date(iso));
      if (duplicado) {
        const sigue = confirm(
          `Ya tienes otra cita registrada el mismo día` +
          (duplicado.medico ? ` (${duplicado.medico})` : "") +
          `. ¿Quieres guardar igual esta nueva?`
        );
        if (!sigue) return;
      }
    }

    setIsSavingCita(true);
    try {
      const res = await fetch(`https://babycare-backend-msyq.onrender.com/api/v1/salud/${bebeId}/citas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fecha_cita: iso, medico, notas, tipo: tipoCita, especialidad: tipoCita === "control" ? "Control sano" : "Consulta" })
      });
      if (res.ok) {
        setFechaCitaDate("");
        setFechaCitaTime("");
        setMedico("");
        setNotas("");
        setShowFormCita(false);
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

  // Cálculos para los Gráficos de Evolución de Peso y Talla
  const seriePeso = crecimientoData?.serie_peso || [];
  const serieTalla = crecimientoData?.serie_talla || [];
  const etiquetasFecha = crecimientoData?.etiquetas_fecha || [];
  const seriePesoOms = crecimientoData?.serie_peso_oms || [];
  const serieTallaOms = crecimientoData?.serie_talla_oms || [];

  const maxPoints = 6;
  const paddingNeeded = maxPoints - seriePeso.length;
  // El padding va al final del arreglo para que los datos reales queden
  // alineados a la izquierda (antes se rellenaba al principio y los
  // corría hacia la derecha).
  const padEnd = (arr: any[], filler: any) => (paddingNeeded > 0 ? [...arr, ...Array(paddingNeeded).fill(filler)] : arr.slice(-maxPoints));

  const displayPesos = padEnd(seriePeso, null);
  const displayTallas = padEnd(serieTalla, null);
  const displayFechas = padEnd(etiquetasFecha, "");
  const displayPesoOms = padEnd(seriePesoOms, null);
  const displayTallaOms = padEnd(serieTallaOms, null);

  const xPositions = [60, 110, 160, 210, 260, 310];

  // Escala de peso: 0kg (abajo, y=85) a 15kg (arriba, y=10).
  const mapYPeso = (val: number | null) => {
    if (val === null || val === undefined || val === 0) return null;
    const y = 85 - (val * 5);
    return Math.max(10, Math.min(85, y));
  };
  // Escala de talla: 40cm (abajo, y=85) a 120cm (arriba, y=10).
  const mapYTalla = (val: number | null) => {
    if (val === null || val === undefined || val === 0) return null;
    const y = 85 - ((val - 40) / 80) * 75;
    return Math.max(10, Math.min(85, y));
  };

  const buildPoints = (arr: (number | null)[], mapY: (v: number | null) => number | null) => {
    let s = "";
    arr.forEach((w, i) => {
      const y = mapY(w);
      if (y !== null) s += `${xPositions[i]},${y} `;
    });
    return s;
  };

  const pesoPointsString = buildPoints(displayPesos, mapYPeso);
  const pesoOmsPointsString = buildPoints(displayPesoOms, mapYPeso);
  const tallaPointsString = buildPoints(displayTallas, mapYTalla);
  const tallaOmsPointsString = buildPoints(displayTallaOms, mapYTalla);


  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, #FAF9FD 0%, #F6F2FF 100%)", fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column" }}>
      
      {/* ── TOP NAV GLOBAL ── */}
      <TopNav user={user} activePath="/salud" perfilEstado={perfilEstado} />

      {/* ── HEADER ──
          Mismo patrón que Comunidad: banner morado con título+descripción,
          acciones y pestañas ya en el contenido claro de abajo. */}
      <div style={{ background: "linear-gradient(135deg, #8B5FD6 0%, #A47BE8 100%)", paddingBottom: "26px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "16px 40px 0" }}>
          <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "22px", fontWeight: 700, color: "#fff", margin: 0 }}>
            Salud y Crecimiento
          </h1>
          <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.8)", margin: "3px 0 0", fontWeight: 600 }}>
            Administra las vacunas, los controles y el progreso de tu bebé.
          </p>
        </div>
      </div>

      <div className="page-container" style={{ marginTop: "-14px" }}>

        {/* TABS */}
        <div className="responsive-overflow" style={{ display: "flex", gap: "10px", marginBottom: "32px", borderBottom: "1px solid var(--theme-bg-light)", paddingBottom: "16px", whiteSpace: "nowrap" }}>
          <button
            onClick={() => setActiveTab("controles")}
            style={{
              background: activeTab === "controles" ? "linear-gradient(135deg, var(--theme-primary), var(--theme-light))" : "transparent",
              color: activeTab === "controles" ? "#fff" : "var(--text-muted)",
              border: "none", padding: "12px 22px", borderRadius: "100px",
              fontWeight: 800, cursor: "pointer", fontSize: "14.5px",
              display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s",
              fontFamily: "'Nunito', sans-serif",
              boxShadow: activeTab === "controles" ? "0 6px 16px var(--theme-shadow-light)" : "none",
            }}>
            <CalendarCheck size={18} /> {perfilEstado === "embarazo" ? "Controles Prenatales" : "Controles"}
          </button>
          {perfilEstado !== "embarazo" && (
          <button
            onClick={() => setActiveTab("vacunas")}
            style={{
              background: activeTab === "vacunas" ? "linear-gradient(135deg, var(--theme-primary), var(--theme-light))" : "transparent",
              color: activeTab === "vacunas" ? "#fff" : "var(--text-muted)",
              border: "none", padding: "12px 22px", borderRadius: "100px",
              fontWeight: 800, cursor: "pointer", fontSize: "14.5px",
              display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s",
              fontFamily: "'Nunito', sans-serif",
              boxShadow: activeTab === "vacunas" ? "0 6px 16px var(--theme-shadow-light)" : "none",
            }}>
            <Syringe size={18} /> Vacunas
          </button>
          )}
          {perfilEstado !== "embarazo" && (
          <button
            onClick={() => setActiveTab("crecimiento")}
            style={{
              background: activeTab === "crecimiento" ? "linear-gradient(135deg, var(--theme-primary), var(--theme-light))" : "transparent",
              color: activeTab === "crecimiento" ? "#fff" : "var(--text-muted)",
              border: "none", padding: "12px 22px", borderRadius: "100px",
              fontWeight: 800, cursor: "pointer", fontSize: "14.5px",
              display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s",
              fontFamily: "'Nunito', sans-serif",
              boxShadow: activeTab === "crecimiento" ? "0 6px 16px var(--theme-shadow-light)" : "none",
            }}>
            <TrendingUp size={18} /> Crecimiento
          </button>
          )}
          <button
            onClick={() => setActiveTab("examenes")}
            style={{
              background: activeTab === "examenes" ? "linear-gradient(135deg, var(--theme-primary), var(--theme-light))" : "transparent",
              color: activeTab === "examenes" ? "#fff" : "var(--text-muted)",
              border: "none", padding: "12px 22px", borderRadius: "100px",
              fontWeight: 800, cursor: "pointer", fontSize: "14.5px",
              display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s",
              fontFamily: "'Nunito', sans-serif",
              boxShadow: activeTab === "examenes" ? "0 6px 16px var(--theme-shadow-light)" : "none",
            }}>
            <FlaskConical size={18} /> Exámenes
          </button>
          <button
            onClick={() => setShowInforme(true)}
            style={{
              background: "transparent",
              color: "var(--text-muted)",
              border: "none", padding: "12px 22px", borderRadius: "100px",
              fontWeight: 800, cursor: "pointer", fontSize: "14.5px",
              display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s",
              fontFamily: "'Nunito', sans-serif",
            }}>
            <FileDown size={18} /> Informe médico
          </button>
        </div>

        {/* ── CONTENT AREA ── */}
        {activeTab === "vacunas" && (
          <div style={{ background: "var(--surface)", borderRadius: "24px", padding: "32px", boxShadow: "0 6px 24px rgba(124,92,191,0.07)" }}>
            <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "21px", fontWeight: 700, color: "var(--text)", marginBottom: "24px" }}>Calendario de Vacunación</h2>
            
            {vacunas.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No hay vacunas registradas en el sistema.</p>
            ) : (
              /* Pendientes y aplicadas en columnas separadas: antes había que
                 recorrer una lista larga para saber qué falta, que es la
                 única pregunta urgente de esta pantalla. */
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "28px", alignItems: "start" }}>
                {[
                  { titulo: "Pendientes", aplicadas: false },
                  { titulo: "Aplicadas", aplicadas: true },
                ].map(({ titulo, aplicadas }) => {
                  const grupo = vacunas
                    .filter((v) => Boolean(v.aplicada) === aplicadas)
                    .sort((a, b) => a.meses_edad_recomendada - b.meses_edad_recomendada);

                  return (
                    <div key={titulo}>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "14px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text)", margin: 0 }}>{titulo}</h3>
                        <span style={{
                          background: aplicadas ? "#E8F7F1" : "var(--theme-bg-light)",
                          color: aplicadas ? "#3E8E6E" : "var(--theme-primary)",
                          borderRadius: "100px", padding: "2px 10px", fontSize: "12px", fontWeight: 800,
                        }}>
                          {grupo.length}
                        </span>
                      </div>

                      {grupo.length === 0 ? (
                        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                          {aplicadas ? "Todavía no hay vacunas aplicadas." : "¡Ninguna pendiente! Están todas al día."}
                        </p>
                      ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {grupo.map((vacuna) => {
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
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", padding: "16px", background: "var(--surface)", borderRadius: "8px", border: "1px solid #DCFCE7" }}>
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
                        <div style={{ marginTop: "12px", padding: "16px", background: "var(--surface-2)", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
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
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "controles" && (
          <div style={{ background: "var(--surface)", borderRadius: "24px", padding: "32px", boxShadow: "0 6px 24px rgba(124,92,191,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "21px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                {perfilEstado === "embarazo" ? "Controles Prenatales" : "Controles Médicos"}
              </h2>
            </div>

            {/* Registro por voz y registro manual, lado a lado: son dos
                caminos para lo mismo y conviene que se vean como
                alternativas, no como pasos de una secuencia. En pantallas
                angostas la grilla los apila sola. */}
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "var(--text)" }}>Agregar Nueva Cita</h3>

              <div style={{ display: "grid", gridTemplateColumns: dictado.soportado ? "repeat(auto-fit, minmax(290px, 1fr))" : "1fr", gap: "24px", alignItems: "stretch" }}>

              {/* Columna izquierda: dictado por voz (Chrome/Edge). */}
              {dictado.soportado && (
                <div style={{ background: "var(--theme-bg-light)", border: "1.5px solid transparent", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "10px" }}>
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
                    <div style={{ marginTop: "12px", background: "var(--surface)", borderRadius: "12px", padding: "12px 14px", fontSize: "13.5px", color: "var(--text)", fontStyle: "italic" }}>
                      “{dictado.texto}”
                    </div>
                  )}
                  {dictado.error && (
                    <div style={{ marginTop: "10px", color: "#D97070", fontSize: "12.5px", fontWeight: 600 }}>
                      {dictado.error}
                    </div>
                  )}
                  {guardadoPorVoz?.ok === true && (
                    <>
                      <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px", color: "#3E8E6E", fontSize: "13px", fontWeight: 700 }}>
                        <CheckCircle size={16} />
                        Cita guardada para el {guardadoPorVoz.cuando}. Puedes corregir cualquier dato abajo.
                      </div>
                      {guardadoPorVoz.duplicado && (
                        <div style={{ marginTop: "6px", color: "#B27B16", fontSize: "12.5px", fontWeight: 700 }}>
                          ⚠️ {guardadoPorVoz.duplicado}
                        </div>
                      )}
                    </>
                  )}
                  {guardadoPorVoz?.ok === false && (
                    <div style={{ marginTop: "10px", color: "#D97070", fontSize: "12.5px", fontWeight: 600 }}>
                      {guardadoPorVoz.motivo}
                    </div>
                  )}
                </div>
              )}

              {/* Columna derecha: el formulario completo vive en un pop-up.
                  Acá quedaba muy largo al lado del bloque de voz y hacía que
                  la lista de controles empezara demasiado abajo. */}
              <div style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "10px" }}>
                <p style={{ fontSize: "13.5px", color: "var(--text-muted)", margin: 0, lineHeight: 1.55 }}>
                  ¿Prefieres escribirlo? Completa la fecha, el médico y el centro a mano.
                </p>
                <button
                  type="button"
                  onClick={() => setShowFormCita(true)}
                  style={{
                    marginTop: "6px", alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "8px",
                    background: "var(--theme-primary)", color: "#fff", border: "none", borderRadius: "100px",
                    padding: "12px 22px", fontWeight: 800, fontSize: "14px", cursor: "pointer",
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  <Plus size={16} /> Registro manual
                </button>
              </div>

              </div>
            </div>

            {/* Próximos y anteriores, en dos columnas: son dos preguntas
                distintas ("¿qué me toca?" y "¿qué pasó?") y mezclarlas en
                una sola lista obligaba a buscar entre fechas. */}
            <div style={{ borderTop: "1px solid var(--border-soft)", marginTop: "28px", paddingTop: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "28px" }}>
                {[
                  { titulo: perfilEstado === "embarazo" ? "Próximos controles" : "Próximos controles", futuros: true },
                  { titulo: "Controles anteriores", futuros: false },
                ].map(({ titulo, futuros }) => {
                  const ahora = new Date();
                  const lista = citas
                    .filter(c => (new Date(c.fecha_cita) >= ahora) === futuros)
                    // Los próximos, del más cercano al más lejano; los
                    // anteriores, del más reciente hacia atrás.
                    .sort((a, b) => {
                      const da = new Date(a.fecha_cita).getTime();
                      const db = new Date(b.fecha_cita).getTime();
                      return futuros ? da - db : db - da;
                    });

                  return (
                    <div key={titulo}>
                      <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "var(--text)" }}>
                        {titulo}
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "8px" }}>
                        {loading ? (
                          <p style={{ color: "var(--text-muted)" }}>Cargando citas...</p>
                        ) : lista.length === 0 ? (
                          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                            {futuros ? "No tienes controles agendados." : "Todavía no hay controles pasados."}
                          </p>
                        ) : (
                          lista.map(cita => {
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
                              border: "1.5px solid var(--border)", cursor: "pointer", fontFamily: "'Nunito', sans-serif",
                              fontWeight: 800, fontSize: "11.5px", display: "inline-flex",
                              alignItems: "center", gap: "4px", whiteSpace: "nowrap",
                              background: "var(--surface)", color: "var(--text)",
                            }}
                          >
                            <Pencil size={12} /> Editar
                          </button>
                          <button
                            onClick={() => eliminarCita(cita.id)}
                            title="Eliminar esta cita"
                            style={{
                              padding: "6px 10px", borderRadius: "100px",
                              border: "1.5px solid #FBDADA", cursor: "pointer", fontFamily: "'Nunito', sans-serif",
                              fontWeight: 800, fontSize: "11.5px", display: "inline-flex",
                              alignItems: "center", gap: "4px", whiteSpace: "nowrap",
                              background: "var(--surface)", color: "#D97070",
                            }}
                          >
                            <Trash2 size={12} /> Eliminar
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "examenes" && bebeId && (
          <ExamenesTab bebeId={bebeId} token={token!} />
        )}

        {activeTab === "crecimiento" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "21px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
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

            <div className="responsive-grid">
              {/* ── GRÁFICO DE PESO ── */}
              <div style={{ background: "var(--surface)", borderRadius: "24px", padding: "28px", boxShadow: "0 6px 24px rgba(124,92,191,0.07)" }}>
                <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "17px", fontWeight: 700, color: "var(--text)", margin: "0 0 12px 0" }}>
                  Evolución de Peso
                </h3>
                <div style={{ display: "flex", gap: "20px", marginBottom: "14px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>
                    <span style={{ width: "18px", height: "3px", background: "var(--theme-primary)", borderRadius: "2px", display: "inline-block" }} />
                    Peso del bebé
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>
                    <span style={{ width: "18px", height: "0", borderTop: "2px dashed #9CA3AF", display: "inline-block" }} />
                    Promedio OMS
                  </div>
                </div>
                <div style={{ width: "100%", overflowX: "auto" }}>
                  <svg viewBox="0 0 340 120" style={{ width: "100%", height: "auto", overflow: "visible", minWidth: "300px" }}>
                    <rect width="340" height="100" fill="#F9FAFB" rx="8"/>
                    <line x1="40" y1="10" x2="40" y2="85" stroke="#E5E7EB" strokeWidth="0.8"/>
                    <line x1="40" y1="85" x2="330" y2="85" stroke="#E5E7EB" strokeWidth="0.8"/>
                    <line x1="40" y1="35" x2="330" y2="35" stroke="#F3F4F6" strokeWidth="0.6"/>
                    <line x1="40" y1="60" x2="330" y2="60" stroke="#F3F4F6" strokeWidth="0.6"/>
                    <text x="35" y="13" textAnchor="end" fontSize="8" fill="#9CA3AF">15kg</text>
                    <text x="35" y="38" textAnchor="end" fontSize="8" fill="#9CA3AF">10kg</text>
                    <text x="35" y="63" textAnchor="end" fontSize="8" fill="#9CA3AF">5kg</text>
                    <text x="35" y="88" textAnchor="end" fontSize="8" fill="#9CA3AF">0kg</text>
                    {displayFechas.map((fecha: string, idx: number) => (
                      <text key={idx} x={xPositions[idx]} y="105" textAnchor="middle" fontSize="9" fill="#9CA3AF" fontWeight="600">
                        {fecha || ""}
                      </text>
                    ))}
                    {pesoOmsPointsString && (
                      <polyline points={pesoOmsPointsString} fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="4,3"/>
                    )}
                    {pesoPointsString && (
                      <polyline points={pesoPointsString} fill="none" stroke="var(--theme-primary)" strokeWidth="2.5" strokeLinejoin="round"/>
                    )}
                    {displayPesos.map((w: number | null, i: number) => {
                      const y = mapYPeso(w);
                      if (y === null) return null;
                      return <circle key={i} cx={xPositions[i]} cy={y} r={i === maxPoints - 1 && w !== null ? 4.5 : 3.5} 
                        fill="var(--theme-primary)" stroke={i === maxPoints - 1 ? "#fff" : "none"} strokeWidth={2}/>;
                    })}
                  </svg>
                </div>
              </div>

              {/* ── GRÁFICO DE TALLA ── */}
              <div style={{ background: "var(--surface)", borderRadius: "24px", padding: "28px", boxShadow: "0 6px 24px rgba(124,92,191,0.07)" }}>
                <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "17px", fontWeight: 700, color: "var(--text)", margin: "0 0 12px 0" }}>
                  Evolución de Talla
                </h3>
                <div style={{ display: "flex", gap: "20px", marginBottom: "14px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>
                    <span style={{ width: "18px", height: "3px", background: "var(--accent-coral, #E8927C)", borderRadius: "2px", display: "inline-block" }} />
                    Talla del bebé
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>
                    <span style={{ width: "18px", height: "0", borderTop: "2px dashed #9CA3AF", display: "inline-block" }} />
                    Promedio OMS
                  </div>
                </div>
                <div style={{ width: "100%", overflowX: "auto" }}>
                  <svg viewBox="0 0 340 120" style={{ width: "100%", height: "auto", overflow: "visible", minWidth: "300px" }}>
                    <rect width="340" height="100" fill="#F9FAFB" rx="8"/>
                    <line x1="40" y1="10" x2="40" y2="85" stroke="#E5E7EB" strokeWidth="0.8"/>
                    <line x1="40" y1="85" x2="330" y2="85" stroke="#E5E7EB" strokeWidth="0.8"/>
                    <line x1="40" y1="35" x2="330" y2="35" stroke="#F3F4F6" strokeWidth="0.6"/>
                    <line x1="40" y1="60" x2="330" y2="60" stroke="#F3F4F6" strokeWidth="0.6"/>
                    <text x="35" y="13" textAnchor="end" fontSize="8" fill="#9CA3AF">120cm</text>
                    <text x="35" y="38" textAnchor="end" fontSize="8" fill="#9CA3AF">93cm</text>
                    <text x="35" y="63" textAnchor="end" fontSize="8" fill="#9CA3AF">67cm</text>
                    <text x="35" y="88" textAnchor="end" fontSize="8" fill="#9CA3AF">40cm</text>
                    {displayFechas.map((fecha: string, idx: number) => (
                      <text key={idx} x={xPositions[idx]} y="105" textAnchor="middle" fontSize="9" fill="#9CA3AF" fontWeight="600">
                        {fecha || ""}
                      </text>
                    ))}
                    {tallaOmsPointsString && (
                      <polyline points={tallaOmsPointsString} fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="4,3"/>
                    )}
                    {tallaPointsString && (
                      <polyline points={tallaPointsString} fill="none" stroke="var(--accent-coral, #E8927C)" strokeWidth="2.5" strokeLinejoin="round"/>
                    )}
                    {displayTallas.map((w: number | null, i: number) => {
                      const y = mapYTalla(w);
                      if (y === null) return null;
                      return <circle key={i} cx={xPositions[i]} cy={y} r={i === maxPoints - 1 && w !== null ? 4.5 : 3.5} 
                        fill="var(--accent-coral, #E8927C)" stroke={i === maxPoints - 1 ? "#fff" : "none"} strokeWidth={2}/>;
                    })}
                  </svg>
                </div>
              </div>
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
            background: "var(--surface)", padding: "32px", borderRadius: "24px", width: "90%", maxWidth: "400px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "21px", fontWeight: 700, color: "var(--text)", margin: 0 }}>Registrar Medidas</h2>
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


      {/* Pop-up de registro manual. El formulario vivía en la columna
          derecha, pero era largo y empujaba la lista de controles muy
          abajo. Acá aparece solo cuando se necesita. */}
      {showFormCita && (
        <div
          onClick={() => setShowFormCita(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(45,38,64,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--surface)", borderRadius: "24px", width: "100%", maxWidth: "560px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Nunito', sans-serif" }}
          >
            <div style={{ background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "19px", color: "#fff", margin: 0 }}>
                Agregar cita
              </h3>
              <button
                onClick={() => setShowFormCita(false)}
                aria-label="Cerrar"
                style={{ background: "rgba(255,255,255,0.22)", border: "none", borderRadius: "50%", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
              >
                <X size={17} />
              </button>
            </div>

            <div style={{ padding: "22px 24px", overflowY: "auto" }}>
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
                            background: "var(--surface)", outline: "none", boxSizing: "border-box", fontFamily: "Nunito"
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
                          background: "var(--surface)", outline: "none", boxSizing: "border-box", fontFamily: "Nunito"
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
        </div>
      )}

      {showInforme && bebeId && (
        <InformeMedico
          bebeId={bebeId}
          perfil={perfil}
          token={token!}
          onClose={() => setShowInforme(false)}
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
