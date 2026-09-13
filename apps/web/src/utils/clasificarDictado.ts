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

/** Convierte "ciento veinte" o "120" a número. Devuelve null si no hay. */
function numeroCercaDe(texto: string, patron: RegExp): number | null {
  const m = texto.match(patron);
  if (!m) return null;
  const bruto = m[1];
  if (/^\d+([.,]\d+)?$/.test(bruto)) return Number(bruto.replace(",", "."));
  return NUMEROS[quitarTildes(bruto)] ?? null;
}

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
    const ml = numeroCercaDe(texto, /\b(\d+|[a-z]+)\s*(?:ml\b|mililitros?)/);
    const min = numeroCercaDe(texto, /\b(\d+|[a-z]+)\s*(?:min\b|minutos?)/);

    const nota = restoComoNota(texto, [
      /\b(biberon|mamadera|pecho|teta|mamo|mamar|tomo|tomar|lactancia|alimentacion|comio)\b/g,
      /\b(\d+|[a-z]+)\s*(?:ml\b|mililitros?|min\b|minutos?)/g,
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
  if (/\b(peso|pesa|pesó|kilos?|kg\b|midio|mide|talla|centimetros?|cm\b)\b/.test(texto)) {
    const kilos = numeroCercaDe(texto, /\b(\d+(?:[.,]\d+)?|[a-z]+)\s*(?:kilos?|kg\b)/);
    // "7 kilos 200" → los gramos vienen sueltos después de los kilos.
    const gramos = texto.match(/\b\d+(?:[.,]\d+)?\s*(?:kilos?|kg\b)\s*(\d{2,3})\b/);
    const cm = numeroCercaDe(texto, /\b(\d+(?:[.,]\d+)?|[a-z]+)\s*(?:centimetros?|cm\b)/)
      ?? numeroCercaDe(texto, /\b(?:midio|mide)\s+(\d+(?:[.,]\d+)?)/);

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
