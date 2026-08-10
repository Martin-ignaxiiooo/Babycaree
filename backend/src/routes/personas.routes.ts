import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { buscarPersonas, sincronizarContactos } from '../controllers/personas.controller';
import rateLimit from 'express-rate-limit';

const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // 20 peticiones
  message: { error: 'Demasiadas solicitudes de búsqueda. Por favor intente más tarde.' }
});

const router = Router();

router.use(verifyToken);

router.get('/buscar', searchLimiter, buscarPersonas);
router.post('/sincronizar-contactos', sincronizarContactos);

export default router;
