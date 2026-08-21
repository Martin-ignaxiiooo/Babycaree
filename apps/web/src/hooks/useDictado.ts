import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Dictado por voz usando la Web Speech API del navegador.
 *
 * Es gratis y no sale del dispositivo hacia un servidor nuestro: el
 * navegador hace el reconocimiento. Funciona en Chrome y Edge; Firefox aún
 * no la implementa, por eso exponemos `soportado` para poder esconder el
 * botón en vez de mostrar algo que no anda.
 */

// La API todavía va con prefijo en varios navegadores.
function obtenerSpeechRecognition(): any {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

// Cuánto silencio esperamos antes de dar por terminado el dictado.
const SILENCIO_MS = 2000;

export function useDictado(onTextoFinal?: (texto: string) => void) {
  const [soportado, setSoportado] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  // Guardamos el callback en una ref para no tener que recrear el
  // reconocedor cada vez que el componente se re-renderiza.
  const callbackRef = useRef(onTextoFinal);
  callbackRef.current = onTextoFinal;

  useEffect(() => {
    const SR = obtenerSpeechRecognition();
    if (!SR) return;

    setSoportado(true);
    const recognition = new SR();
    recognition.lang = "es-CL";
    recognition.continuous = true;
    // Con interimResults vemos el texto mientras se habla, que da la
    // sensación de que está funcionando en vez de un silencio incómodo.
    recognition.interimResults = true;

    let acumulado = "";
    let temporizadorSilencio: ReturnType<typeof setTimeout> | null = null;

    const limpiarTemporizador = () => {
      if (temporizadorSilencio) {
        clearTimeout(temporizadorSilencio);
        temporizadorSilencio = null;
      }
    };

    // Cada vez que llega texto nuevo (aunque sea parcial), reiniciamos la
    // cuenta: solo se corta el dictado tras SILENCIO_MS sin novedades, no
    // por un tiempo fijo desde que se apretó el botón.
    const armarTemporizador = () => {
      limpiarTemporizador();
      temporizadorSilencio = setTimeout(() => {
        try {
          recognition.stop();
        } catch {
          // Si ya estaba detenido, no importa.
        }
      }, SILENCIO_MS);
    };

    recognition.onresult = (event: any) => {
      let parcial = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const fragmento = event.results[i][0].transcript;
        if (event.results[i].isFinal) acumulado += fragmento + " ";
        else parcial += fragmento;
      }
      setTexto((acumulado + parcial).trim());
      armarTemporizador();
    };

    recognition.onerror = (event: any) => {
      limpiarTemporizador();
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("No pudimos usar el micrófono. Revisa los permisos del navegador.");
      } else if (event.error === "no-speech") {
        setError("No escuchamos nada. Intenta hablar más cerca del micrófono.");
      } else if (event.error !== "aborted") {
        setError("Hubo un problema con el dictado. Intenta de nuevo.");
      }
      setEscuchando(false);
    };

    recognition.onend = () => {
      limpiarTemporizador();
      setEscuchando(false);
      const limpio = acumulado.trim();
      if (limpio) callbackRef.current?.(limpio);
    };

    recognitionRef.current = { recognition, reset: () => { acumulado = ""; limpiarTemporizador(); } };

    return () => {
      limpiarTemporizador();
      try {
        recognition.abort();
      } catch {
        // Si ya estaba detenido, no importa.
      }
    };
  }, []);


  const empezar = useCallback(() => {
    const ref = recognitionRef.current;
    if (!ref) return;
    setError(null);
    setTexto("");
    ref.reset();
    try {
      ref.recognition.start();
      setEscuchando(true);
    } catch {
      // start() lanza si ya estaba corriendo; lo ignoramos.
    }
  }, []);

  const detener = useCallback(() => {
    try {
      recognitionRef.current?.recognition.stop();
    } catch {
      // Ídem.
    }
    setEscuchando(false);
  }, []);

  return { soportado, escuchando, texto, error, empezar, detener };
}
