// Da estructura al texto de los artículos educativos.
//
// El contenido se escribe desde el panel de administración y llega como un
// solo bloque: sin líneas en blanco entre párrafos y, a veces, con el punto
// pegado a la palabra siguiente ("boca abajo.4 a 6 meses:"). Leído así es un
// muro de texto.
//
// Lo ideal es arreglar el contenido en origen. Mientras tanto esto lo
// interpreta al vuelo, sin modificar nada en la base de datos. Si el texto ya
// viene bien separado con líneas en blanco, se respeta tal cual y ninguna de
// las heurísticas se activa.

export type BloqueArticulo =
  | { tipo: "parrafo"; texto: string }
  | { tipo: "subtitulo"; texto: string }
  | { tipo: "item"; etiqueta: string; texto: string };

/** "0 a 3 meses:", "13 a 18 meses:", "2 a 4 años:" */
const RANGO_EDAD = /(\d+\s+a\s+\d+\s+(?:meses|años|semanas))\s*:\s*/gi;

/**
 * Separa oraciones que quedaron pegadas al punto anterior.
 * "cuerpo.0 a 3 meses" -> "cuerpo. 0 a 3 meses"
 * No toca decimales ("1.5 kg") ni abreviaturas en minúscula.
 */
function despegarPuntos(texto: string): string {
  return texto
    .replace(/([a-záéíóúñ])\.(\d)/g, "$1. $2")
    .replace(/([a-záéíóúñ])\.([A-ZÁÉÍÓÚÑ])/g, "$1. $2");
}

/**
 * Detecta subtítulos incrustados en medio del texto: una frase corta en
 * mayúscula inicial que no termina en punto y viene seguida de otra oración,
 * como "Hitos de la Motricidad Gruesa Estas habilidades implican…".
 *
 * Es deliberadamente conservador: solo actúa sobre una lista acotada de
 * encabezados frecuentes, porque adivinarlos por forma produce demasiados
 * falsos positivos con nombres propios y siglas.
 */
const SUBTITULOS_CONOCIDOS = [
  "Hitos de la Motricidad Gruesa",
  "Hitos de la Motricidad Fina",
  "Señales de Alerta",
  "Recomendaciones",
  "Cuándo consultar",
  "Qué esperar",
  "En resumen",
];

function partirPorSubtitulos(texto: string): string[] {
  let partes = [texto];
  for (const sub of SUBTITULOS_CONOCIDOS) {
    const siguiente: string[] = [];
    for (const parte of partes) {
      const i = parte.indexOf(sub);
      if (i === -1) {
        siguiente.push(parte);
        continue;
      }
      const antes = parte.slice(0, i).trim();
      const despues = parte.slice(i + sub.length).trim();
      if (antes) siguiente.push(antes);
      siguiente.push(`\u0000${sub}`); // marca interna de subtítulo
      if (despues) siguiente.push(despues);
    }
    partes = siguiente;
  }
  return partes.filter(Boolean);
}

/** Convierte el contenido plano en bloques listos para renderizar. */
export function formatearArticulo(contenido: string): BloqueArticulo[] {
  if (!contenido?.trim()) return [];

  const yaTieneParrafos = /\n\s*\n/.test(contenido);
  const base = yaTieneParrafos ? contenido : despegarPuntos(contenido);

  // Si el autor ya separó párrafos, se respeta su división.
  const trozosIniciales = yaTieneParrafos
    ? base.split(/\n\s*\n/)
    : partirPorSubtitulos(base);

  const bloques: BloqueArticulo[] = [];

  for (const trozo of trozosIniciales) {
    const limpio = trozo.trim();
    if (!limpio) continue;

    if (limpio.startsWith("\u0000")) {
      bloques.push({ tipo: "subtitulo", texto: limpio.slice(1) });
      continue;
    }

    // Dentro del trozo, cada "N a M meses:" abre un ítem de lista.
    RANGO_EDAD.lastIndex = 0;
    const cortes: { indice: number; etiqueta: string; largo: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = RANGO_EDAD.exec(limpio)) !== null) {
      cortes.push({ indice: m.index, etiqueta: m[1], largo: m[0].length });
    }

    if (cortes.length === 0) {
      bloques.push({ tipo: "parrafo", texto: limpio });
      continue;
    }

    const intro = limpio.slice(0, cortes[0].indice).trim();
    if (intro) bloques.push({ tipo: "parrafo", texto: intro });

    cortes.forEach((corte, i) => {
      const desde = corte.indice + corte.largo;
      const hasta = i + 1 < cortes.length ? cortes[i + 1].indice : limpio.length;
      const cuerpo = limpio.slice(desde, hasta).trim();
      if (cuerpo) {
        bloques.push({ tipo: "item", etiqueta: corte.etiqueta, texto: cuerpo });
      }
    });
  }

  return bloques;
}
