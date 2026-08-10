import rateLimit from "express-rate-limit";

// Límite global: 5000 peticiones por IP en 15 min para evitar bloqueos en pruebas
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Demasiadas peticiones, intenta más tarde.",
  },
});

// Login: 10 intentos por IP en 15 min (el control de 5 intentos por cuenta está en el controller)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Demasiados intentos de inicio de sesión. Intenta en 15 minutos.",
    bloqueado: true,
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
