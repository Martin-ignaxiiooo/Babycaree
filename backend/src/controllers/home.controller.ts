import { Request, Response } from "express";
import { query } from "../config/db";

// Helper function to calculate exact age string
function calculateExactAge(dob: Date): string {
  const birth = new Date(dob);
  const now = new Date();
  
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += lastMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  return `${years} años ${months} meses ${days} días`;
}

// Helper to dynamically calculate an approximate WHO weight percentile
function calculateApproxPercentile(weight: number, dob: Date): number {
  if (!weight || weight === 0) return 50;
  const birth = new Date(dob);
  const now = new Date();
  const months = Math.max(0, (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth()));
  
  // Very rough WHO median weight approximation (kg)
  const medianWeight = 3.3 + (months * 0.6);
  
  // Approx standard deviation (12% of median)
  const stdDev = medianWeight * 0.12;
  const zScore = (weight - medianWeight) / stdDev;
  
  // Map z-score to percentile
  if (zScore < -2.5) return 1;
  if (zScore < -2) return 3;
  if (zScore < -1) return 15;
  if (zScore < 0) return Math.max(15, Math.round(50 + (zScore * 35)));
  if (zScore < 1) return Math.min(85, Math.round(50 + (zScore * 35)));
  if (zScore < 2) return 85;
  if (zScore < 2.5) return 97;
  return 99;
}

export const getHomeDashboard = async (req: Request, res: Response) => {
  try {
    const { idPerfil } = req.params;

    // 1. Fetch Profile Data
    const profileRes = await query(
      `SELECT b.*, t.nombre_visible as nombre_prevision 
       FROM perfiles_bebes b 
       LEFT JOIN tipos_prevision t ON b.prevision_salud = t.codigo 
       WHERE b.id = $1`,
      [idPerfil]
    );

    if (profileRes.rows.length === 0) {
      return res.status(404).json({ error: "Perfil no encontrado" });
    }

    const perfil = profileRes.rows[0];
    const userId = (req as any).user?.id || (req as any).user?.userId; // Fallback just in case
    console.log("home.controller: perfil.usuario_id =", perfil.usuario_id, "userId =", userId);
    let rol_acceso = "propietario";

    if (perfil.usuario_id !== userId) {
      const accesoRes = await query(
        `SELECT nivel_permiso FROM accesos_compartidos_bebe 
         WHERE id_perfil_bebe = $1 AND id_usuario_invitado = $2 AND estado = 'activo'`,
        [idPerfil, userId]
      );
      if (accesoRes.rows.length === 0) {
        return res.status(403).json({ error: "No tienes permiso para ver este perfil" });
      }
      rol_acceso = accesoRes.rows[0].nivel_permiso;
    }

    // 2. Fetch Latest Growth Record
    const growthRes = await query(
      `SELECT peso_kg, talla_cm 
       FROM registros_crecimiento 
       WHERE bebe_id = $1 
       ORDER BY fecha_registro DESC LIMIT 1`,
      [idPerfil]
    );

    const peso_kg = growthRes.rows.length > 0 
      ? parseFloat(growthRes.rows[0].peso_kg) 
      : (perfil.peso_nacimiento_g ? perfil.peso_nacimiento_g / 1000 : 0);
      
    const talla_cm = growthRes.rows.length > 0 
      ? parseFloat(growthRes.rows[0].talla_cm) 
      : (perfil.talla_nacimiento_cm ? parseFloat(perfil.talla_nacimiento_cm) : 0);

    let fruta_embarazo = null;
    let semanas_embarazo = null;
    let mes_embarazo = null;
    let hito_embarazo = null;
    let etiqueta_mes_embarazo = null;
    let rango_semana_mes_embarazo = null;

    if (perfil.estado === 'embarazo' && perfil.fecha_estimada_parto) {
      const fur = new Date(perfil.fecha_estimada_parto);
      fur.setDate(fur.getDate() - 280); 
      const hoy = new Date();
      const diffTime = Math.abs(hoy.getTime() - fur.getTime());
      semanas_embarazo = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
      if (semanas_embarazo > 42) semanas_embarazo = 42;
      if (semanas_embarazo < 1) semanas_embarazo = 1;

      const frutaRes = await query(
        `SELECT fruta FROM embarazo_hitos_tamano WHERE semana = $1`,
        [semanas_embarazo]
      );
      if (frutaRes.rows.length > 0) {
        fruta_embarazo = frutaRes.rows[0].fruta;
      } else {
        fruta_embarazo = semanas_embarazo < 4 ? "Semillita" : "Sandía";
      }

      // Hito de desarrollo del mes correspondiente (tabla embarazo_hitos_mes).
      // Cada mes cubre 4 semanas; el mes 9 cubre de la semana 33 en adelante.
      mes_embarazo = Math.min(Math.ceil(semanas_embarazo / 4), 9);
      try {
        const hitoRes = await query(
          `SELECT etiqueta, rango_semana, descripcion FROM embarazo_hitos_mes WHERE mes = $1`,
          [mes_embarazo]
        );
        if (hitoRes.rows.length > 0) {
          hito_embarazo = hitoRes.rows[0].descripcion;
          etiqueta_mes_embarazo = hitoRes.rows[0].etiqueta;
          rango_semana_mes_embarazo = hitoRes.rows[0].rango_semana;
        }
      } catch (e) {
        // Si la tabla todavía no existe en este ambiente, el frontend usa sus
        // valores por defecto en vez de romper el dashboard entero.
        console.error("No se pudo leer embarazo_hitos_mes:", e);
      }
    }

    // 3. Build Hero Object
    const hero = {
      id: perfil.id,
      nombre: perfil.nombre,
      edad_exacta: perfil.fecha_nacimiento ? calculateExactAge(perfil.fecha_nacimiento) : "En gestación",
      prevision: perfil.nombre_prevision || perfil.prevision_salud || "Sin previsión", 
      peso_kg,
      talla_cm,
      percentil: perfil.fecha_nacimiento ? calculateApproxPercentile(peso_kg, perfil.fecha_nacimiento) : 0,
      semanas_embarazo,
      fruta_embarazo,
      mes_embarazo,
      hito_embarazo,
      etiqueta_mes_embarazo,
      rango_semana_mes_embarazo
    };

    // 4. Fetch Notifications
    const notificaciones: any[] = [];
    let total_alertas = 0;

    // A. Vacunas atrasadas/proximas
    const vacunasRes = await query(
      `SELECT v.nombre, rv.fecha_aplicacion
       FROM registro_vacunas rv
       JOIN vacunas_pni v ON rv.vacuna_id = v.id
       WHERE rv.bebe_id = $1 AND rv.aplicada = FALSE
       ORDER BY rv.fecha_aplicacion ASC`,
      [idPerfil]
    );

    vacunasRes.rows.forEach((v: any) => {
      const fecha = new Date(v.fecha_aplicacion);
      const hoy = new Date();
      const diffTime = fecha.getTime() - hoy.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        notificaciones.push({
          tipo: "vacuna_atrasada",
          prioridad: "alta",
          titulo: v.nombre + " — Atrasada",
          dias_atraso: Math.abs(diffDays),
          mensaje: `Atrasada por ${Math.abs(diffDays)} días. Agenda tu hora.`
        });
        total_alertas++;
      } else if (diffDays <= 7) {
        notificaciones.push({
          tipo: "vacuna_proxima",
          prioridad: "media",
          titulo: v.nombre + " — Próxima",
          dias_restantes: diffDays,
          mensaje: `Programada para los próximos ${diffDays} días.`
        });
        total_alertas++;
      }
    });

    // B. Citas Médicas
    const citasRes = await query(
      `SELECT especialidad, fecha_cita, medico
       FROM citas_medicas
       WHERE bebe_id = $1 AND estado = 'programada' AND fecha_cita > NOW()
       ORDER BY fecha_cita ASC`,
      [idPerfil]
    );

    citasRes.rows.forEach((c: any) => {
      const fecha = new Date(c.fecha_cita);
      const hoy = new Date();
      const diffTime = fecha.getTime() - hoy.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) {
        notificaciones.push({
          tipo: "control_proximo",
          prioridad: "media",
          titulo: `Control ${c.especialidad}`,
          dias_restantes: diffDays,
          mensaje: `En ${diffDays} días con ${c.medico}.`
        });
        total_alertas++;
      }
    });

    // C. Artículos Recomendados (Mock)
    const exactAge = calculateExactAge(perfil.fecha_nacimiento);
    const monthsMatch = exactAge.match(/(\d+) meses/);
    const ageMonths = monthsMatch ? monthsMatch[1] : '0';

    notificaciones.push({
      tipo: "articulo",
      prioridad: "baja",
      titulo: `Artículo para los ${ageMonths} meses`,
      mensaje: "Cómo iniciar la alimentación complementaria con BLW."
    });

    // Añadir Mocks visuales si la BD está vacía para que el usuario vea el diseño
    if (vacunasRes.rows.length === 0) {
      notificaciones.push({
        tipo: "vacuna_atrasada",
        prioridad: "alta",
        titulo: "Vacuna Hexavalente 2ª — Atrasada",
        dias_atraso: 5,
        mensaje: "Atrasada por 5 días. Agenda tu hora en el CESFAM."
      });
      total_alertas++;
    }

    if (citasRes.rows.length === 0) {
      notificaciones.push({
        tipo: "control_proximo",
        prioridad: "media",
        titulo: "Control 8 meses",
        dias_restantes: 18,
        mensaje: "En 18 días en CESFAM con Dra. Soto."
      });
      total_alertas++;
    }

    // Sort notifications by priority: alta > media > baja
    const priorityWeight: any = { alta: 1, media: 2, baja: 3 };
    notificaciones.sort((a, b) => priorityWeight[a.prioridad] - priorityWeight[b.prioridad]);

    // 5. Growth Chart Series (Real data)
    const historyRes = await query(
      `SELECT fecha_registro, peso_kg, talla_cm 
       FROM registros_crecimiento 
       WHERE bebe_id = $1 
       ORDER BY fecha_registro ASC`,
      [idPerfil]
    );

    // Si no hay historial pero tenemos datos de nacimiento, usarlos como primer punto
    if (historyRes.rows.length === 0 && (perfil.peso_nacimiento_g || perfil.talla_nacimiento_cm)) {
      historyRes.rows.push({
        fecha_registro: perfil.fecha_nacimiento,
        peso_kg: perfil.peso_nacimiento_g ? (perfil.peso_nacimiento_g / 1000) : null,
        talla_cm: perfil.talla_nacimiento_cm ? parseFloat(perfil.talla_nacimiento_cm) : null
      });
    }

    const birthDate = new Date(perfil.fecha_nacimiento);
    const monthsData: { [key: number]: { pesoSum: number, tallaSum: number, count: number } } = {};

    historyRes.rows.forEach((h: any) => {
      const d = new Date(h.fecha_registro);
      const monthsDiff = (d.getFullYear() - birthDate.getFullYear()) * 12 + (d.getMonth() - birthDate.getMonth());
      const mesVida = d.getDate() < birthDate.getDate() ? Math.max(0, monthsDiff - 1) : Math.max(0, monthsDiff);

      if (!monthsData[mesVida]) {
        monthsData[mesVida] = { pesoSum: 0, tallaSum: 0, count: 0 };
      }
      monthsData[mesVida].pesoSum += parseFloat(h.peso_kg);
      monthsData[mesVida].tallaSum += parseFloat(h.talla_cm);
      monthsData[mesVida].count++;
    });

    // Get up to last 6 months recorded
    const sortedMonths = Object.keys(monthsData).map(Number).sort((a, b) => a - b).slice(-6);

    const serie_peso: number[] = [];
    const serie_talla: number[] = [];
    const etiquetas_fecha: string[] = [];
    const serie_oms: number[] = [];

    // Map sexo to OMS categories
    let omsSexo = "Unisex";
    if (perfil.sexo?.toLowerCase() === "masculino" || perfil.sexo?.toLowerCase() === "niño" || perfil.sexo?.toLowerCase() === "m") {
      omsSexo = "Masculino";
    } else if (perfil.sexo?.toLowerCase() === "femenino" || perfil.sexo?.toLowerCase() === "niña" || perfil.sexo?.toLowerCase() === "f") {
      omsSexo = "Femenino";
    }

    for (const mes of sortedMonths) {
      const data = monthsData[mes];
      serie_peso.push(parseFloat((data.pesoSum / data.count).toFixed(2)));
      serie_talla.push(parseFloat((data.tallaSum / data.count).toFixed(2)));
      etiquetas_fecha.push(`Mes ${mes}`);

      // Fetch OMS data for this month
      const omsRes = await query(
        `SELECT peso_esperado_kg FROM oms_percentiles WHERE mes_vida = $1 AND (sexo = $2 OR sexo = 'Unisex') ORDER BY sexo DESC LIMIT 1`,
        [mes, omsSexo]
      );
      if (omsRes.rows.length > 0) {
        serie_oms.push(parseFloat(omsRes.rows[0].peso_esperado_kg));
      } else {
        serie_oms.push(0);
      }
    }

    const crecimiento = {
      serie_peso: serie_peso.length > 0 ? serie_peso : [0],
      serie_talla: serie_talla.length > 0 ? serie_talla : [0],
      serie_oms: serie_oms.length > 0 ? serie_oms : [0],
      etiquetas_fecha: etiquetas_fecha.length > 0 ? etiquetas_fecha : ["Sin datos"]
    };

    return res.json({
      hero,
      notificaciones: notificaciones.slice(0, 3), // Max 3
      crecimiento,
      total_alertas,
      rol_acceso,
      perfil: {
        estado: perfil.estado,
        fecha_estimada_parto: perfil.fecha_estimada_parto,
        fecha_nacimiento: perfil.fecha_nacimiento,
        semanas_embarazo,
        fruta_embarazo
      }
    });

  } catch (error) {
    console.error("Error en getHomeDashboard:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const addGrowthRecord = async (req: Request, res: Response) => {
  try {
    const { idPerfil } = req.params;
    const { peso, talla } = req.body;

    if (!peso || !talla) {
      return res.status(400).json({ error: "Peso y talla son requeridos" });
    }

    const userId = (req as any).user?.id;
    const accessCheck = await query(
      `SELECT b.id FROM perfiles_bebes b WHERE b.id = $1 AND b.usuario_id = $2
       UNION
       SELECT a.id_perfil_bebe FROM accesos_compartidos_bebe a 
       WHERE a.id_perfil_bebe = $1 AND a.id_usuario_invitado = $2 AND a.estado = 'activo' 
       AND a.nivel_permiso NOT IN ('solo_lectura', 'solo_lectura_galeria')`,
      [idPerfil, userId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: "No tienes permiso para modificar este perfil" });
    }

    await query(
      `INSERT INTO registros_crecimiento (bebe_id, fecha_registro, peso_kg, talla_cm)
       VALUES ($1, CURRENT_DATE, $2, $3)`,
      [idPerfil, peso, talla]
    );

    return res.json({ success: true, message: "Registro guardado correctamente" });
  } catch (error) {
    console.error("Error en addGrowthRecord:", error);
    return res.status(500).json({ error: "Error interno al guardar registro" });
  }
};
