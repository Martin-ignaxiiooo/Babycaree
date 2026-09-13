import {
  extraerHora,
  quitarTildes,
  NUMEROS,
  interpretarDictado,
  type CitaDictada,
} from "./interpretarDictado";

/**
 * Dictado universal: a diferencia de interpretarDictado (que asume que lo
 * dictado ES una cita), acá primero se identifica QUÉ quiere registrar la
 * persona -pañal, alimentación, sueño, cita o medidas- y recién después
 * se extraen los datos de esa categoría.
 *
 * Regla de diseño: lo que no se reconoce como dato estructurado no se
 * descarta, se guarda como nota. Así nunca se pierde lo que se dijo
 * ("pañal con pipí amarillo" → tipo pipí, nota "amarillo").
 */

export type TipoRegistro = "panal" | "alimentacion" | "sueno" | "cita" | "medidas";

export interface RegistroDictado {
  tipo: TipoRegistro;
  /** Texto para leer en voz alta y mostrar en la confirmación. */
  resumen: string;
  /** Pares etiqueta/valor que se muestran en la tarjeta de confirmación. */
  detalles: { etiqueta: string; valor: string }[];
  /** Lo que se enviará al backend, ya listo para el fetch. */
  datos: any;
}

/**
 * Un número dictado: en dígitos ("120", "7,2") o en palabras, incluyendo
 * compuestos con o sin "y" ("sesenta y cinco", "ciento veinte"). El
 * dictado del navegador transcribe de las dos formas según el caso.
 */
const NUM_PALABRA = String.raw`(\d+(?:[.,]\d+)?|[a-z]+(?:\s+(?:y\s+)?[a-z]+)?)`;

/** Convierte "ciento veinte" o "120" a número. Devuelve null si no hay. */
function numeroCercaDe(texto: string, patron: RegExp): number | null {
  const m = texto.match(patron);
  if (!m) return null;
  return aNumero(m[1]);
}

/**
 * Interpreta un número escrito en dígitos o en palabras, incluyendo
 * compuestos con "y": "sesenta y cinco" → 65, "ciento veinte" → 120.
 * El dictado del navegador a veces transcribe los números como palabras,
 * sobre todo cuando se hablan seguidos de una unidad.
 */
function aNumero(bruto: string): number | null {
  const limpio = quitarTildes(bruto.trim().toLowerCase());
  if (/^\d+([.,]\d+)?$/.test(limpio)) return Number(limpio.replace(",", "."));

  // Suma las partes: "sesenta y cinco" = 60 + 5, "ciento veinte" = 100 + 20.
  const partes = limpio.split(/\s+y\s+|\s+/).filter(Boolean);
  let total = 0;
  let encontroAlguno = false;
  for (const p of partes) {
    const v = NUMEROS[p] ?? DECENAS_CENTENAS[p];
    if (v == null) return encontroAlguno ? total : null;
    total += v;
    encontroAlguno = true;
  }
  return encontroAlguno ? total : null;
}

/** Decenas y centenas que no están en el mapa NUMEROS (que llega a 31). */
const DECENAS_CENTENAS: Record<string, number> = {
  // 'un' no está en NUMEROS (tiene 'uno'/'una'), pero es la forma que se
  // usa delante de una unidad: "un metro", "un kilo".
  un: 1,
  cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80,
  noventa: 90, cien: 100, ciento: 100, doscientos: 200, trescientos: 300,
};

/**
 * Quita del texto las partes que ya se interpretaron como datos, para que
 * lo que sobre sirva de nota. Ej: de "pañal con pipí amarillo", tras
 * sacar "pañal" y "pipí", queda "amarillo".
 */
function restoComoNota(texto: string, palabrasUsadas: RegExp[]): string | null {
  let resto = texto;
  for (const p of palabrasUsadas) resto = resto.replace(p, " ");
  resto = resto
    .replace(/\b(con|de|el|la|los|las|un|una|y|que|se|le|tiene|tenia|tenía|venia|venía|estaba|era|fue)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return resto.length >= 3 ? resto : null;
}

export function clasificarDictado(textoOriginal: string, ahora = new Date()): RegistroDictado | null {
  const texto = quitarTildes(textoOriginal.toLowerCase().trim());

  // ── Pañal ────────────────────────────────────────────────────────────
  if (/\b(panal|pipi|pis|caca|popo|pupu|deposicion)\b/.test(texto)) {
    const tienePis = /\b(pipi|pis)\b/.test(texto);
    const tieneCaca = /\b(caca|popo|pupu|deposicion)\b/.test(texto);
    const panalTipo = tienePis && tieneCaca ? "mixto" : tieneCaca ? "caca" : "pis";
    const etiquetaTipo = panalTipo === "mixto" ? "Ambos" : panalTipo === "caca" ? "Popó" : "Pipí";

    const nota = restoComoNota(texto, [
      /\b(panal|cambio|cambie|cambio de)\b/g,
      /\b(pipi|pis|caca|popo|pupu|deposicion)\b/g,
    ]);

    return {
      tipo: "panal",
      resumen: `Cambio de pañal, ${etiquetaTipo.toLowerCase()}`,
      detalles: [
        { etiqueta: "Tipo", valor: etiquetaTipo },
        ...(nota ? [{ etiqueta: "Nota", valor: nota }] : []),
      ],
      datos: { tipo: "panal", panal_tipo: panalTipo, nota },
    };
  }

  // ── Alimentación ─────────────────────────────────────────────────────
  if (/\b(biberon|mamadera|pecho|teta|mamo|mamar|tomo|tomar|lactancia|alimentacion|comio)\b/.test(texto)) {
    const esBiberon = /\b(biberon|mamadera)\b/.test(texto);
    const ml = numeroCercaDe(texto, new RegExp(String.raw`\b${NUM_PALABRA}\s*(?:ml\b|mililitros?)`));
    const min = numeroCercaDe(texto, new RegExp(String.raw`\b${NUM_PALABRA}\s*(?:min\b|minutos?)`));

    const nota = restoComoNota(texto, [
      /\b(biberon|mamadera|pecho|teta|mamo|mamar|tomo|tomar|lactancia|alimentacion|comio)\b/g,
      new RegExp(String.raw`\b${NUM_PALABRA}\s*(?:ml\b|mililitros?|min\b|minutos?)`, "g"),
    ]);

    if (esBiberon) {
      const cantidad = ml ?? 120;
      return {
        tipo: "alimentacion",
        resumen: `Alimentación, biberón de ${cantidad} mililitros`,
        detalles: [
          { etiqueta: "Fuente", valor: "Biberón" },
          { etiqueta: "Cantidad", valor: `${cantidad} ml` },
          ...(nota ? [{ etiqueta: "Nota", valor: nota }] : []),
        ],
        datos: { tipo: "toma", fuente: "biberon", cantidad_ml: cantidad, nota },
      };
    }

    const duracion = min ?? 15;
    return {
      tipo: "alimentacion",
      resumen: `Alimentación, pecho por ${duracion} minutos`,
      detalles: [
        { etiqueta: "Fuente", valor: "Pecho" },
        { etiqueta: "Duración", valor: `${duracion} min` },
        ...(nota ? [{ etiqueta: "Nota", valor: nota }] : []),
      ],
      datos: { tipo: "toma", fuente: "pecho", duracion_min: duracion, nota },
    };
  }

  // ── Sueño ────────────────────────────────────────────────────────────
  if (/\b(durmio|duerme|dormir|siesta|desperto|despierta)\b/.test(texto)) {
    const hora = extraerHora(texto);
    const inicio = new Date(ahora);
    if (hora) inicio.setHours(hora.hora, hora.minuto, 0, 0);

    const etiquetaHora = inicio.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    return {
      tipo: "sueno",
      resumen: `Se durmió a las ${etiquetaHora}`,
      detalles: [
        { etiqueta: "Inicio del sueño", valor: etiquetaHora },
      ],
      datos: { tipo: "sueno", fecha_hora: inicio.toISOString() },
    };
  }

  // ── Medidas ──────────────────────────────────────────────────────────
  if (/\b(peso|pesa|kilos?|kg\b|midio|mide|medir|talla|estatura|centimetros?|cms?\b|metros?)\b/.test(texto)) {
    const kilos = numeroCercaDe(texto, new RegExp(String.raw`\b${NUM_PALABRA}\s*(?:kilos?|kg\b)`))
      ?? numeroCercaDe(texto, new RegExp(String.raw`\b(?:peso|pesa)\s+${NUM_PALABRA}`));
    // "7 kilos 200" → los gramos vienen sueltos después de los kilos.
    const gramos = texto.match(/\b\d+(?:[.,]\d+)?\s*(?:kilos?|kg\b)\s*(?:con\s+)?(\d{2,3})\b/);

    // Talla en metros: "un metro", "un metro veinte", "1,20 metros".
    // Se convierte a centímetros, que es como se guarda.
    // Antes de "metro" se captura UNA sola palabra o número: si se
    // permitiera un compuesto, "un metro veinte" se leería entero como
    // el número de metros y se perdería el "veinte".
    let cm: number | null = null;
    const enMetros = texto.match(
      new RegExp(String.raw`\b(\d+(?:[.,]\d+)?|[a-z]+)\s*metros?\s*(?:(?:con|y)\s+)?${NUM_PALABRA}?`),
    );
    if (enMetros) {
      const metros = aNumero(enMetros[1]);
      if (metros != null) {
        // Lo que sigue al metro son centímetros: "un metro veinte" = 120.
        const resto = enMetros[2] ? aNumero(enMetros[2]) : null;
        cm = Math.round(metros * 100 + (resto ?? 0));
      }
    }

    if (cm == null) {
      cm = numeroCercaDe(texto, new RegExp(String.raw`\b${NUM_PALABRA}\s*(?:centimetros?|cms?\b)`))
        ?? numeroCercaDe(texto, new RegExp(String.raw`\b(?:midio|mide|medir|talla|estatura)\s+(?:de\s+)?${NUM_PALABRA}`));
    }

    let peso = kilos;
    if (peso != null && gramos) peso = peso + Number(gramos[1]) / 1000;

    if (peso == null && cm == null) return null;

    const detalles: { etiqueta: string; valor: string }[] = [];
    if (peso != null) detalles.push({ etiqueta: "Peso", valor: `${peso} kg` });
    if (cm != null) detalles.push({ etiqueta: "Talla", valor: `${cm} cm` });

    return {
      tipo: "medidas",
      resumen: [
        peso != null ? `pesó ${peso} kilos` : null,
        cm != null ? `midió ${cm} centímetros` : null,
      ].filter(Boolean).join(" y "),
      detalles,
      datos: { peso_kg: peso, talla_cm: cm },
    };
  }

  // ── Cita médica ──────────────────────────────────────────────────────
  // Va al final a propósito: "control" y "doctor" son más genéricos y
  // podrían aparecer dentro de frases de otras categorías.
  if (/\b(cita|control|doctor|doctora|dr\b|dra\b|medico|pediatra|matrona|hora con|consulta|urgencia)\b/.test(texto)) {
    const cita: CitaDictada = interpretarDictado(textoOriginal, ahora);
    if (!cita.fecha) {
      // Sin fecha no se puede agendar nada útil.
      return null;
    }
    const tipoFinal = cita.tipo ?? "cita";
    const detalles: { etiqueta: string; valor: string }[] = [
      { etiqueta: "Fecha", valor: cita.fecha.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" }) },
      { etiqueta: "Hora", valor: cita.fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }) },
      { etiqueta: "Tipo", valor: tipoFinal === "control" ? "Control sano" : "Cita médica" },
    ];
    if (cita.medico) detalles.push({ etiqueta: "Médico", valor: cita.medico });
    if (cita.especialidad) detalles.push({ etiqueta: "Especialidad", valor: cita.especialidad });
    if (cita.lugar) detalles.push({ etiqueta: "Lugar", valor: cita.lugar });

    return {
      tipo: "cita",
      resumen: `${tipoFinal === "control" ? "Control sano" : "Cita médica"} el ${cita.fecha.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })} a las ${cita.fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}${cita.medico ? ` con ${cita.medico}` : ""}`,
      detalles,
      datos: {
        fecha_cita: cita.fecha.toISOString(),
        medico: cita.medico || null,
        notas: textoOriginal,
        tipo: tipoFinal,
        especialidad: cita.especialidad || (tipoFinal === "control" ? "Control sano" : "Consulta"),
        lugar: cita.lugar || null,
      },
    };
  }

  return null;
}
