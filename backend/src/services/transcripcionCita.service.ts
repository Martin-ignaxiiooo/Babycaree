/**
 * Transcripción de notas de voz para agendar citas.
 *
 * Flujo: la app graba un audio corto ("control del Leo el viernes 3 de
 * octubre a las 10 y media con la doctora Pérez en el consultorio"), lo sube
 * acá, y devolvemos los campos ya separados para prellenar el formulario.
 *
 * La transcripción se hace con la API de OpenAI (Whisper) y la extracción de
 * campos con un modelo de texto. Ambas requieren OPENAI_API_KEY configurada
 * en las variables de entorno de Render. Si la clave no está, el endpoint
 * responde 503 con un mensaje claro en vez de fallar de forma confusa.
 *
 * Importante: el audio nunca se guarda en disco ni en la base de datos.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

export const transcripcionDisponible = (): boolean => Boolean(OPENAI_API_KEY);

export interface CitaExtraida {
  fecha_cita: string | null;
  medico: string | null;
  lugar: string | null;
  especialidad: string | null;
  tipo: "control" | "cita";
  notas: string | null;
  transcripcion: string;
}

/** Envía el audio a Whisper y devuelve el texto plano. */
async function transcribirAudio(buffer: Buffer, mimetype: string): Promise<string> {
  // El nombre de archivo importa: Whisper usa la extensión para decidir el
  // decodificador, así que la derivamos del mimetype real.
  const extension = mimetype.includes("wav")
    ? "wav"
    : mimetype.includes("webm")
      ? "webm"
      : mimetype.includes("ogg")
        ? "ogg"
        : mimetype.includes("mpeg") || mimetype.includes("mpga")
          ? "mp3"
          : "m4a";

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mimetype }), `nota.${extension}`);
  form.append("model", "whisper-1");
  form.append("language", "es");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });

  if (!res.ok) {
    const detalle = await res.text();
    throw new Error(`Whisper respondió ${res.status}: ${detalle.slice(0, 300)}`);
  }

  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}

/**
 * Convierte el texto libre en campos estructurados.
 *
 * Se le pasa la fecha actual del servidor para que pueda resolver
 * expresiones relativas ("el viernes", "mañana", "en dos semanas").
 */
async function extraerCampos(texto: string): Promise<Omit<CitaExtraida, "transcripcion">> {
  const ahora = new Date();

  const instrucciones = [
    "Extraes los datos de una cita médica infantil a partir de lo que dictó una madre o padre en español (Chile).",
    `La fecha y hora actual es ${ahora.toISOString()} (zona horaria America/Santiago).`,
    "Resuelve fechas relativas como 'mañana', 'el viernes' o 'la próxima semana' respecto de esa fecha actual.",
    "",
    "Responde SOLO con un objeto JSON válido, sin explicaciones ni markdown, con estas claves:",
    '  "fecha_cita": fecha y hora en formato ISO 8601 con offset, o null si no se menciona ninguna fecha.',
    '  "medico": nombre del profesional, o null.',
    '  "lugar": consultorio, clínica u hospital, o null.',
    '  "especialidad": por ejemplo "Pediatría", "Broncopulmonar", o null.',
    '  "tipo": "control" si es un control sano periódico o control de niño sano; "cita" si es una consulta puntual por un síntoma o motivo concreto.',
    '  "notas": cualquier detalle adicional relevante, o null.',
    "",
    "Si no se menciona una hora explícita pero sí un día, usa las 09:00 de ese día.",
    "No inventes datos que no estén en el texto.",
  ].join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: instrucciones },
        { role: "user", content: texto },
      ],
    }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    throw new Error(`Extracción respondió ${res.status}: ${detalle.slice(0, 300)}`);
  }

  const data = (await res.json()) as any;
  const crudo = data?.choices?.[0]?.message?.content ?? "{}";

  let parsed: any;
  try {
    parsed = JSON.parse(crudo);
  } catch {
    // Si el modelo devolviera algo no parseable, preferimos devolver el
    // formulario vacío antes que romper: el usuario igual puede completarlo.
    parsed = {};
  }

  // Normalizamos: solo aceptamos los dos tipos válidos y descartamos fechas
  // que no se puedan interpretar, para no mandar basura al INSERT.
  const tipo = parsed.tipo === "control" ? "control" : "cita";
  let fecha: string | null = null;
  if (parsed.fecha_cita) {
    const d = new Date(parsed.fecha_cita);
    if (!Number.isNaN(d.getTime())) fecha = d.toISOString();
  }

  const limpiar = (v: any): string | null => {
    if (typeof v !== "string") return null;
    const s = v.trim();
    return s.length > 0 && s.toLowerCase() !== "null" ? s.slice(0, 150) : null;
  };

  return {
    fecha_cita: fecha,
    medico: limpiar(parsed.medico),
    lugar: limpiar(parsed.lugar),
    especialidad: limpiar(parsed.especialidad),
    tipo,
    notas: limpiar(parsed.notas),
  };
}

/** Transcribe el audio y devuelve los campos listos para prellenar el formulario. */
export async function procesarNotaDeVoz(
  buffer: Buffer,
  mimetype: string,
): Promise<CitaExtraida> {
  const transcripcion = await transcribirAudio(buffer, mimetype);

  if (!transcripcion) {
    return {
      fecha_cita: null, medico: null, lugar: null,
      especialidad: null, tipo: "cita", notas: null,
      transcripcion: "",
    };
  }

  const campos = await extraerCampos(transcripcion);
  return { ...campos, transcripcion };
}
