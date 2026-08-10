import { Request, Response } from 'express';
import { query } from '../config/db';

export const buscarPersonas = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { q = '', fuente } = req.query;
    const queryText = (q as string).toLowerCase().trim();

    if (!fuente) {
      res.status(400).json({ error: 'Debe especificar una fuente (contactos o perfiles)' });
      return;
    }

    // Regla de minimización de datos: 
    // No permitimos buscar libremente en toda la base de usuarios a menos que sea un correo exacto válido.
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(queryText);
    let results: any[] = [];

    if (fuente === 'perfiles') {
      // Busca familiares que ya tengan acceso a *otros* perfiles del mismo usuario.
      if (queryText.length > 0) {
        const result = await query(
          `SELECT DISTINCT u.id, u.nombre, u.apellidos, u.email 
           FROM accesos_compartidos_bebe a
           JOIN perfiles_bebes p ON a.id_perfil_bebe = p.id
           JOIN usuarios u ON a.id_usuario_invitado = u.id
           WHERE p.usuario_id = $1 AND u.id != $1
           AND (LOWER(u.nombre) LIKE $2 OR LOWER(u.apellidos) LIKE $2 OR LOWER(u.email) = $3)
           LIMIT 5`,
          [userId, `%${queryText}%`, queryText]
        );
        results = result.rows;
      }
    } else if (fuente === 'contactos') {
      // Busca entre los contactos ya sincronizados, o por correo exacto
      if (isEmail) {
        const result = await query(
          `SELECT id, nombre, apellidos, email FROM usuarios WHERE email = $1 AND id != $2`,
          [queryText, userId]
        );
        results = result.rows;
      } else {
        // En una app real, aquí cruzaríamos contra una tabla de contactos_sincronizados.
        // Dado que no la almacenamos, si busca por nombre y la fuente es "contactos",
        // retorna vacío para no enumerar.
        results = [];
      }
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar personas' });
  }
};

export const sincronizarContactos = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    // req.body.hashes es un array de hashes de correo/teléfono
    const { hashes } = req.body;

    if (!hashes || !Array.isArray(hashes) || hashes.length === 0) {
      res.json([]);
      return;
    }

    // Comparamos los hashes recibidos con los hashes precomputados en usuarios
    const result = await query(
      `SELECT id, nombre, apellidos, email 
       FROM usuarios 
       WHERE (correo_hash = ANY($1) OR telefono_hash = ANY($1)) AND id != $2`,
      [hashes, userId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al sincronizar contactos' });
  }
};
