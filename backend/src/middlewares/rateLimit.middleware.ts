import rateLimit from "express-rate-limit";

// Límite global: 100 peticiones por IP en 1 min para evitar bloqueos masivos
export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Demasiadas peticiones, intenta más tarde.",
  },
});

// Login: 5 intentos por IP en 1 min (prevención estricta de fuerza bruta)
export const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Demasiados intentos de inicio de sesión. Intenta en 15 minutos.",
    bloqueado: true,
  },
});

// Registro: 10 cuentas nuevas por IP en 1 hora (evita creación masiva de cuentas por bots)
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Demasiados registros desde esta conexión. Intenta más tarde.",
  },
});

// Verificación de 2FA de admin: 5 intentos por IP en 5 min (defensa en profundidad
// contra fuerza bruta del código TOTP, además del límite global)
export const adminTwoFaLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Demasiados intentos de verificación 2FA. Intenta en unos minutos.",
  },
});

// Solicitud de código: 10 solicitudes por IP en 1 hora
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Demasiadas solicitudes de recuperación. Intenta más tarde.",
  },
});

// Verificación de código: 15 intentos por IP en 15 min
export const codeVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Demasiados intentos de verificación. Intenta más tarde.",
  },
});
