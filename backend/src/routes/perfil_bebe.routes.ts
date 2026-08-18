import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { uploadFotoMemoria } from '../middlewares/uploadMemoria.middleware';
import {
  getPerfil,
  actualizarPerfil,
  subirFotoPerfil,
  eliminarFotoPerfil,
  listarAccesos,
  invitarAcceso,
  modificarPermiso,
  revocarAcceso,
  listarAuditoria
} from '../controllers/perfil_bebe.controller';

const router = Router();

router.use(verifyToken);

router.get('/:id', getPerfil);
router.patch('/:id', actualizarPerfil);
router.post('/:id/foto', uploadFotoMemoria.single('foto'), subirFotoPerfil);
router.delete('/:id/foto', eliminarFotoPerfil);
router.get('/:id/accesos', listarAccesos);
router.post('/:id/accesos/invitar', invitarAcceso);
router.patch('/:id/accesos/:idAcceso', modificarPermiso);
router.delete('/:id/accesos/:idAcceso', revocarAcceso);
router.get('/:id/auditoria', listarAuditoria);

export default router;
