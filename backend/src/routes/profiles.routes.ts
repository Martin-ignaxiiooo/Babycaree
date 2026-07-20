import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { getMe, createBabyProfile, getMyBabies, getPublicBabyProfile } from '../controllers/profiles.controller';

const router = Router();

// Rutas Públicas
router.get('/public/:id', getPublicBabyProfile);

// Rutas Protegidas
router.use(verifyToken);

router.get('/me', getMe);
router.post('/babies', createBabyProfile);
router.get('/babies', getMyBabies);

export default router;
