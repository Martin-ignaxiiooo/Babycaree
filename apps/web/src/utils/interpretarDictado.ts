/**
 * Interpreta en español lo que se dictó para agendar una cita.
 *
 * Corre entero en el navegador: no hay API de pago ni datos que salgan del
 * dispositivo. Es un parser por reglas, así que no entiende cualquier frase,
 * pero cubre bien la forma en que la gente dicta una hora médica. Cuando no
 * logra deducir algo devuelve null y el usuario completa ese campo a mano.
 */

export interface CitaDictada {
  fecha: Date | null;
  tipo: "control" | "cita" | null;
  medico: string | null;
  lugar: string | null;
  especialidad: string | null;
}

const DIAS_SEMANA: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, miércoles: 3,
  jueves: 4, viernes: 5, sabado: 6, sábado: 6,
};

const MESES: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9,
  noviembre: 10, diciembre: 11,
};

// Números escritos con palabras, para horas y días dictados.
const NUMEROS: Record<string, number> = {
  una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
  siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12,
  trece: 13, catorce: 14, quince: 15, dieciseis: 16, dieciséis: 16,
  diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20,
  veintiuno: 21, veintidos: 22, veintidós: 22, veintitres: 23, veintitrés: 23,
  veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintiséis: 26,
  veintisiete: 27, veintiocho: 28, veintinueve: 29, treinta: 30,
  treintaiuno: 31,
};

const ESPECIALIDADES = [
  "pediatría", "pediatria", "broncopulmonar", "dermatología", "dermatologia",
  "neurología", "neurologia", "cardiología", "cardiologia", "oftalmología",
  "oftalmologia", "otorrino", "otorrinolaringología", "traumatología",
  "traumatologia", "gastroenterología", "gastroenterologia", "nutrición",
  "nutricion", "kinesiología", "kinesiologia", "fonoaudiología",
  "fonoaudiologia", "odontología", "odontologia", "matrona", "urgencia",
];

function quitarTildes(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function capitalizar(s: string): string {
  return s
    .split(/\s+/)
    .map((p) => (p.length > 2 ? p[0].toUpperCase() + p.slice(1) : p))
    .join(" ");
}

/**
 * Corta un nombre capturado cuando aparece una palabra que ya no le
 * pertenece: conectores, o expresiones de tiempo y lugar que el regex
 * pudo haber absorbido ("pediatra mañana", "cesfam norte pasado mañana").
 */
const CORTE_NOMBRE =
  /\b(hoy|ma[ñn]ana|pasado|el|la|los|las|en|a|de|del|para|con|y|pr[óo]ximo|pr[óo]xima|lunes|martes|mi[ée]rcoles|jueves|viernes|s[áa]bado|domingo|control|sano|sana|cita|consulta|urgencia|dijo|dijeron|dice|dicen|comentó|indic[óo]|recomend[óo]|que|debemos|tenemos|vamos|hay)\b.*$/;

function recortarNombre(s: string): string {
  return s.replace(CORTE_NOMBRE, "").trim();
}

/** Extrae la hora: "a las 10 y media", "a las 15:30", "a las tres de la tarde". */
function extraerHora(texto: string): { hora: number; minuto: number } | null {
  // Formato numérico directo: 10:30, 15.45
  const conDosPuntos = texto.match(/\b(\d{1,2})[:.](\d{2})\b/);
  if (conDosPuntos) {
    const h = Number(conDosPuntos[1]);
    const m = Number(conDosPuntos[2]);
    if (h <= 23 && m <= 59) return { hora: h, minuto: m };
  }

  // "a las diez y media", "a las diez treinta" (sin "y"), "a las 10 y cuarto"
  const m = texto.match(
    /a\s+las?\s+(\d{1,2}|[a-záéíóúñ]+)(?:\s+(?:y\s+)?(media|cuarto|treinta|quince|\d{1,2}))?/
  );
  if (!m) return null;

  const bruto = m[1];
  let hora = /^\d+$/.test(bruto) ? Number(bruto) : NUMEROS[quitarTildes(bruto)] ?? NaN;
  if (Number.isNaN(hora) || hora > 23) return null;

  let minuto = 0;
  if (m[2]) {
    if (m[2] === "media" || m[2] === "treinta") minuto = 30;
    else if (m[2] === "cuarto" || m[2] === "quince") minuto = 15;
    else minuto = Number(m[2]) || 0;
  }

  // "de la tarde" / "de la noche" convierte a formato 24h.
  const esTarde = /de\s+la\s+(tarde|noche)|pm\b/.test(texto);
  if (esTarde && hora < 12) hora += 12;

  return { hora, minuto: Math.min(minuto, 59) };
}

/** Extrae la fecha, resolviendo expresiones relativas contra la fecha actual. */
function extraerFecha(texto: string, ahora: Date): Date | null {
  const base = new Date(ahora);
  base.setSeconds(0, 0);

  // "3 de octubre" / "tres de octubre" (con año opcional)
  const conMes = texto.match(
    /\b(\d{1,2}|[a-záéíóúñ]+)\s+de\s+([a-záéíóúñ]+)(?:\s+(?:de\s+)?(\d{4}))?/
  );
  if (conMes) {
    const nombreMes = quitarTildes(conMes[2]);
    const mesIdx = MESES[nombreMes] ?? MESES[conMes[2]];
    if (mesIdx != null) {
      const diaBruto = conMes[1];
      const dia = /^\d+$/.test(diaBruto) ? Number(diaBruto) : NUMEROS[quitarTildes(diaBruto)];
      if (dia && dia >= 1 && dia <= 31) {
        const anio = conMes[3] ? Number(conMes[3]) : base.getFullYear();
        const d = new Date(anio, mesIdx, dia);
        // Sin año explícito y ya pasó: se asume el año siguiente.
        if (!conMes[3] && d < base) d.setFullYear(anio + 1);
        return d;
      }
    }
  }

  // Formato numérico: 03/10/2026 o 3-10
  const numerica = texto.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (numerica) {
    const dia = Number(numerica[1]);
    const mes = Number(numerica[2]) - 1;
    if (dia >= 1 && dia <= 31 && mes >= 0 && mes <= 11) {
      let anio = numerica[3] ? Number(numerica[3]) : base.getFullYear();
      if (anio < 100) anio += 2000;
      const d = new Date(anio, mes, dia);
      if (!numerica[3] && d < base) d.setFullYear(anio + 1);
      return d;
    }
  }

  if (/\bpasado\s+mañana\b/.test(texto)) {
    const d = new Date(base);
    d.setDate(d.getDate() + 2);
    return d;
  }
  // "mañana" (día siguiente) es distinto de "de la mañana" / "por la
  // mañana" (que solo indica AM, ej: "a las diez de la mañana"). Sin este
  // cuidado, cualquier hora dicha con "de la mañana" hacía que la fecha
  // saltara al día siguiente sin que nadie lo pidiera.
  if (/\bmañana\b/.test(texto) && !/(?:de|por|en)\s+la\s+mañana\b/.test(texto)) {
    const d = new Date(base);
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (/\bhoy\b/.test(texto)) return new Date(base);

  // "en dos semanas", "en 3 días", "en un mes"
  const enPlazo = texto.match(/\ben\s+(\d+|[a-záéíóúñ]+)\s+(d[ií]as?|semanas?|mes(?:es)?)\b/);
  if (enPlazo) {
    const bruto = enPlazo[1];
    const cantidad = /^\d+$/.test(bruto) ? Number(bruto) : NUMEROS[quitarTildes(bruto)] ?? 1;
    const d = new Date(base);
    const unidad = quitarTildes(enPlazo[2]);
    if (unidad.startsWith("dia")) d.setDate(d.getDate() + cantidad);
    else if (unidad.startsWith("semana")) d.setDate(d.getDate() + cantidad * 7);
    else d.setMonth(d.getMonth() + cantidad);
    return d;
  }

  // "el viernes", "el próximo lunes"
  const conDia = texto.match(
    /\b(?:el\s+)?(?:pr[óo]ximo\s+)?(domingo|lunes|martes|mi[ée]rcoles|jueves|viernes|s[áa]bado)\b/
  );
  if (conDia) {
    const objetivo = DIAS_SEMANA[quitarTildes(conDia[1])] ?? DIAS_SEMANA[conDia[1]];
    if (objetivo != null) {
      const d = new Date(base);
      let delta = (objetivo - d.getDay() + 7) % 7;
      // "el viernes" dicho un viernes se entiende como el de la próxima semana.
      if (delta === 0 || /pr[óo]ximo/.test(conDia[0])) delta = delta === 0 ? 7 : delta;
      d.setDate(d.getDate() + delta);
      return d;
    }
  }

  return null;
}

export function interpretarDictado(textoOriginal: string, ahora = new Date()): CitaDictada {
  const texto = textoOriginal.toLowerCase().trim();

  // ── Tipo ──────────────────────────────────────────────────────────────
  let tipo: CitaDictada["tipo"] = null;
  if (/control\s+(sano|de\s+ni[ñn]o\s+sano)|ni[ñn]o\s+sano|control\b/.test(texto)) {
    tipo = "control";
  } else if (/\b(cita|consulta|hora|urgencia|control\s+de)\b/.test(texto)) {
    tipo = "cita";
  }

  // ── Fecha y hora ──────────────────────────────────────────────────────
  const fechaBase = extraerFecha(texto, ahora);
  let fecha: Date | null = null;
  if (fechaBase) {
    const hora = extraerHora(texto);
    fecha = new Date(fechaBase);
    // Sin hora dictada se asume la mañana, que es lo habitual para un control.
    fecha.setHours(hora?.hora ?? 9, hora?.minuto ?? 0, 0, 0);
  }

  // ── Médico ────────────────────────────────────────────────────────────
  let medico: string | null = null;
  const conMedico = texto.match(
    /\b(?:con\s+)?(?:el\s+|la\s+)?(doctora?|dra?\.?|matrona|pediatra)\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)?)/
  );
  if (conMedico) {
    // Cortamos si lo que sigue es otra parte de la frase, no un apellido.
    const nombre = recortarNombre(conMedico[2]);
    // "con el pediatra mañana" no da un nombre: "pediatra" es el rol, no
    // la persona. Solo lo tomamos si quedó algo distinto del propio rol.
    const esRolSolo = /^(pediatra|matrona|doctora?|dra?\.?)$/.test(nombre);
    if (nombre && !esRolSolo) {
      const tratamiento = /^dra?\.?$/.test(conMedico[1])
        ? conMedico[1].startsWith("dra")
          ? "Dra."
          : "Dr."
        : capitalizar(conMedico[1]);
      medico = `${tratamiento} ${capitalizar(nombre)}`.trim();
    }
  }

  // ── Lugar ─────────────────────────────────────────────────────────────
  let lugar: string | null = null;
  const conLugar = texto.match(
    /\ben\s+(?:el\s+|la\s+)?((?:cesfam|consultorio|cl[íi]nica|hospital|centro\s+m[ée]dico|posta)(?:\s+[a-záéíóúñ0-9]+){0,3})/
  );
  if (conLugar) {
    const limpio = recortarNombre(conLugar[1]) || conLugar[1].trim();
    lugar = capitalizar(limpio);
  }

  // ── Especialidad ──────────────────────────────────────────────────────
  let especialidad: string | null = null;
  for (const esp of ESPECIALIDADES) {
    if (texto.includes(esp)) {
      especialidad = capitalizar(esp);
      break;
    }
  }
  if (!especialidad && tipo === "control") especialidad = "Control sano";

  return { fecha, tipo, medico, lugar, especialidad };
}
