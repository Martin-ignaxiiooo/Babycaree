import { Request, Response, NextFunction } from "express";

/**
 * Protección anti-bot sin servicios externos.
 *
 * Se eligió esta vía en lugar de reCAPTCHA/hCaptcha porque no requiere
 * API keys ni costo, no envía datos de los usuarios a terceros (relevante
 * para una app con datos de salud infantil) y no le agrega fricción a las
 * personas reales: nadie tiene que resolver ningún puzzle.
 *
 * Dos señales, ambas invisibles para un usuario legítimo:
 *
 *  1. HONEYPOT — un campo de formulario oculto por CSS. Una persona no lo
 *     ve y por lo tanto no lo llena; muchos bots rellenan todos los campos
 *     que encuentran en el HTML. Si viene con contenido, es un bot.
 *
 *  2. TIEMPO MÍNIMO — el frontend manda cuándo se abrió el formulario. Un
 *     humano tarda al menos unos segundos en escribir su correo y una
 *     contraseña; un script envía en milisegundos.
 *
 * Ambas señales son "fail open": si el frontend no las manda (por ejemplo
 * una versión vieja en caché, o un cliente propio), la petición pasa. Es
 * deliberado — es preferible dejar entrar a algún bot antes que bloquear a
 * una madre que no puede registrarse. El rate limit sigue detrás como red.
 */

/** Tiempo mínimo verosímil para completar un formulario, en milisegundos. */
const TIEMPO_MINIMO_MS = 2500;

export const antiBot = (req: Request, res: Response, next: NextFunction) => {
  const { _hp, _ts } = req.body ?? {};

  // 1. Honeypot: si el campo trampa trae algo, es un bot.
  if (typeof _hp === "string" && _hp.trim() !== "") {
    // Se responde 400 genérico, sin revelar que se detectó el honeypot:
    // decirlo le enseñaría al atacante exactamente qué campo omitir.
    return res.status(400).json({ error: "No pudimos procesar el formulario. Recarga la página e intenta de nuevo." });
  }

  // 2. Tiempo: sospechosamente rápido para un humano.
  if (_ts != null) {
    const abiertoEn = Number(_ts);
    if (Number.isFinite(abiertoEn)) {
      const transcurrido = Date.now() - abiertoEn;
      // Se descartan también timestamps del futuro o absurdamente viejos
      // (más de 12 horas): indican un valor manipulado, no un formulario real.
      const plausible = transcurrido >= 0 && transcurrido < 12 * 60 * 60 * 1000;
      if (plausible && transcurrido < TIEMPO_MINIMO_MS) {
        return res.status(400).json({ error: "El formulario se envió demasiado rápido. Intenta de nuevo." });
      }
    }
  }

  next();
};

/**
 * Quita los campos anti-bot del body para que no lleguen al controlador
 * y terminen accidentalmente en la base de datos.
 */
export const limpiarCamposAntiBot = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === "object") {
    delete req.body._hp;
    delete req.body._ts;
  }
  next();
};
