import { Request, Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const result = await query('SELECT id, email, nombre, apellidos, rol, consentimiento_ley_19628, consentimiento_ley_21719 FROM usuarios WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error in getMe:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createBabyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { nombre, fecha_nacimiento, sexo, es_prematuro, semanas_gestacion } = req.body;

    if (!nombre || !fecha_nacimiento) {
      return res.status(400).json({ error: 'Nombre y fecha de nacimiento son obligatorios' });
    }

    if (es_prematuro && !semanas_gestacion) {
      return res.status(400).json({ error: 'Las semanas de gestación son obligatorias para bebés prematuros' });
    }

    const result = await query(
      'INSERT INTO perfiles_bebes (usuario_id, nombre, fecha_nacimiento, sexo, es_prematuro, semanas_gestacion) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, nombre, fecha_nacimiento, sexo, es_prematuro || false, semanas_gestacion || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error in createBabyProfile:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getMyBabies = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const result = await query('SELECT * FROM perfiles_bebes WHERE usuario_id = $1 ORDER BY fecha_creacion DESC', [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error in getMyBabies:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getPublicBabyProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Obtener datos del bebé
    const babyRes = await query('SELECT id, nombre, fecha_nacimiento, sexo, es_prematuro, semanas_gestacion FROM perfiles_bebes WHERE id = $1', [id]);
    
    if (babyRes.rows.length === 0) {
      return res.status(404).json({ error: 'Perfil de bebé no encontrado' });
    }
    
    const baby = babyRes.rows[0];

    // Obtener calendario de vacunas
    const vacunasRes = await query(`
      SELECT vp.id as vacuna_id, vp.nombre, vp.enfermedades_previene, vp.meses_edad_recomendada,
             rv.aplicada, rv.fecha_aplicacion, rv.lugar_aplicacion 
      FROM vacunas_pni vp
      LEFT JOIN registro_vacunas rv ON vp.id = rv.vacuna_id AND rv.bebe_id = $1
      ORDER BY vp.meses_edad_recomendada ASC, vp.id ASC
    `, [id]);

    res.json({
      baby,
      vacunas: vacunasRes.rows
    });

  } catch (error) {
    console.error('Error in getPublicBabyProfile:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
