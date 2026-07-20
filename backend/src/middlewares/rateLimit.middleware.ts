import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 100, // Limitar cada IP a 100 peticiones por ventana
  standardHeaders: 'draft-7', // Retorna la info del límite en cabeceras `RateLimit-*`
  legacyHeaders: false, // Deshabilita cabeceras `X-RateLimit-*`
  message: {
    status: 429,
    error: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
