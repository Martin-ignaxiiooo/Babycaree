/**
 * Voz sintetizada del navegador (speechSynthesis), usada para leer en voz
 * alta la confirmación de lo que se entendió al dictar.
 *
 * A diferencia del reconocimiento de voz, esta API sí funciona en todos
 * los navegadores modernos (incluido Firefox). Aun así, si no estuviera
 * disponible, hablar() simplemente no hace nada: la confirmación en
 * pantalla es lo que manda, la voz es un extra.
 */

const CLAVE_VOZ_ACTIVA = "voz_confirmacion_activa";

/** La voz se puede apagar desde Mi Perfil (útil si el bebé duerme). */
export function vozActiva(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CLAVE_VOZ_ACTIVA) !== "false";
}

export function setVozActiva(activa: boolean) {
  localStorage.setItem(CLAVE_VOZ_ACTIVA, activa ? "true" : "false");
}

export function vozSoportada(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function hablar(texto: string) {
  if (!vozSoportada() || !vozActiva()) return;
  try {
    // Corta cualquier frase anterior que siga sonando, para que no se
    // encimen dos confirmaciones si se dicta dos veces seguidas.
    window.speechSynthesis.cancel();

    const frase = new SpeechSynthesisUtterance(texto);
    frase.lang = "es-CL";
    frase.rate = 1;
    frase.pitch = 1;

    // Si hay una voz en español instalada, se prefiere: con el idioma por
    // defecto del sistema, un texto en español puede sonar con acento
    // extranjero o directamente ininteligible.
    const vozEs = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang?.toLowerCase().startsWith("es"));
    if (vozEs) frase.voice = vozEs;

    window.speechSynthesis.speak(frase);
  } catch {
    // La voz nunca debe romper el flujo: si falla, se sigue igual.
  }
}

export function callar() {
  if (!vozSoportada()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignorado a propósito */
  }
}
