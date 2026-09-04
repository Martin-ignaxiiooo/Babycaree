import crypto from "crypto";

/**
 * Cifrado de campos clínicos sensibles (diagnósticos, indicaciones, recetas
 * y resultados de exámenes) antes de guardarlos en la base de datos.
 *
 * POR QUÉ
 * Son datos de salud de menores. Si alguien obtuviera un dump de la base
 * -una credencial filtrada, un backup expuesto, acceso indebido al panel de
 * Neon- estos campos son los que no deberían poder leerse. La Ley 21.719
 * chilena los trata como datos sensibles.
 *
 * QUÉ NO PROTEGE
 * No protege contra alguien que comprometa el backend en ejecución: ahí la
 * clave está en memoria. Es defensa en profundidad, no una bala de plata.
 *
 * CÓMO
 * AES-256-GCM, que además de cifrar autentica: si alguien altera un byte
 * del dato en la base, el descifrado falla en vez de devolver basura
 * silenciosamente. Cada valor lleva su propio IV aleatorio, así que cifrar
 * dos veces el mismo texto da resultados distintos (no se puede deducir que
 * dos pacientes tienen el mismo diagnóstico comparando las filas).
 *
 * FORMATO EN LA BASE
 *   enc:v1:<iv en base64>:<authTag en base64>:<datos en base64>
 * El prefijo permite convivir con datos viejos sin cifrar: si un valor no
 * empieza con "enc:", se devuelve tal cual. Eso hace la migración gradual y
 * sin downtime.
 *
 * ⚠️ LA CLAVE
 * Vive en ENCRYPTION_KEY (64 caracteres hex = 32 bytes). SI SE PIERDE, LOS
 * DATOS SON IRRECUPERABLES: no hay forma de descifrarlos, ni Anthropic ni
 * nadie puede ayudarte. Guárdala en al menos dos lugares (el gestor de
 * contraseñas del equipo y las variables de entorno de Render).
 * Generar con:  openssl rand -hex 32
 */

const PREFIJO = "enc:v1:";
const ALGORITMO = "aes-256-gcm";

let claveCache: Buffer | null | undefined;

/**
 * Devuelve la clave, o null si no está configurada.
 * Se cachea para no re-parsear el hex en cada operación.
 */
function obtenerClave(): Buffer | null {
  if (claveCache !== undefined) return claveCache;

  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    claveCache = null;
    return null;
  }

  const limpia = raw.trim();
  if (!/^[0-9a-fA-F]{64}$/.test(limpia)) {
    // Se avisa fuerte pero no se tira el servidor: es preferible que la app
    // siga funcionando (guardando en claro, como antes) a que se caiga
    // entera por una variable mal pegada.
    console.error(
      "[cifrado] ENCRYPTION_KEY no es válida: se esperan 64 caracteres hexadecimales " +
      "(generar con `openssl rand -hex 32`). Los datos clínicos se guardarán SIN CIFRAR."
    );
    claveCache = null;
    return null;
  }

  claveCache = Buffer.from(limpia, "hex");
  return claveCache;
}

/** True si el valor ya está cifrado por nosotros. */
export const estaCifrado = (valor: unknown): boolean =>
  typeof valor === "string" && valor.startsWith(PREFIJO);

/**
 * Cifra un valor. Devuelve null/undefined tal cual (un campo vacío no se
 * cifra) y no vuelve a cifrar algo ya cifrado.
 */
export function cifrar<T extends string | null | undefined>(valor: T): T {
  if (valor == null || valor === "") return valor;
  if (estaCifrado(valor)) return valor;

  const clave = obtenerClave();
  if (!clave) return valor; // Sin clave configurada, se guarda como antes.

  try {
    const iv = crypto.randomBytes(12); // 96 bits, el tamaño recomendado para GCM
    const cipher = crypto.createCipheriv(ALGORITMO, clave, iv);
    const cifrado = Buffer.concat([cipher.update(valor as string, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${PREFIJO}${iv.toString("base64")}:${authTag.toString("base64")}:${cifrado.toString("base64")}` as T;
  } catch (error) {
    console.error("[cifrado] Error cifrando un valor:", error);
    // Se devuelve el original antes que perder el dato del usuario.
    return valor;
  }
}

/**
 * Descifra un valor. Si no está cifrado (dato antiguo), lo devuelve igual.
 */
export function descifrar<T extends string | null | undefined>(valor: T): T {
  if (valor == null || valor === "") return valor;
  if (!estaCifrado(valor)) return valor; // Dato viejo, guardado antes del cifrado.

  const clave = obtenerClave();
  if (!clave) {
    console.error("[cifrado] Hay datos cifrados pero falta ENCRYPTION_KEY. No se pueden leer.");
    return null as T;
  }

  try {
    const partes = (valor as string).slice(PREFIJO.length).split(":");
    if (partes.length !== 3) throw new Error("formato inesperado");

    const [ivB64, tagB64, datosB64] = partes;
    const decipher = crypto.createDecipheriv(ALGORITMO, clave, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));

    const plano = Buffer.concat([
      decipher.update(Buffer.from(datosB64, "base64")),
      decipher.final(),
    ]);
    return plano.toString("utf8") as T;
  } catch (error) {
    // Llegar acá significa clave equivocada o dato alterado. Se devuelve
    // null en vez de texto corrupto: es más honesto mostrar "sin datos" que
    // basura ilegible en una ficha médica.
    console.error("[cifrado] No se pudo descifrar un valor (¿clave distinta o dato alterado?)");
    return null as T;
  }
}

/** Descifra varios campos de un objeto, devolviendo una copia. */
export function descifrarCampos<T extends Record<string, any>>(
  fila: T | null | undefined,
  campos: string[],
): T | null | undefined {
  if (!fila) return fila;
  const copia: Record<string, any> = { ...fila };
  for (const campo of campos) {
    if (campo in copia) copia[campo] = descifrar(copia[campo]);
  }
  return copia as T;
}

/** Igual que descifrarCampos, para listados. */
export function descifrarFilas<T extends Record<string, any>>(
  filas: T[],
  campos: string[],
): T[] {
  return filas.map((f) => descifrarCampos(f, campos) as T);
}
