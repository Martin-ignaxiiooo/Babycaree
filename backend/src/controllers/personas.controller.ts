import { Request, Response } from 'express';
import { query } from '../config/db';

export const buscarPersonas = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { q = '', fuente } = req.query;
    const queryText = (q as string).toLowerCase().trim();

    if (!fuente) {
      res.status(400).json({ error: 'Debe especificar una fuente (contactos, familia o todos)' });
      return;
    }

    // Regla de minimización de datos:
    // No permitimos buscar libremente en toda la base de usuarios a menos que sea un correo exacto válido.
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(queryText);

    const buscarEnFamilia = async (): Promise<any[]> => {
      if (queryText.length === 0) return [];
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
      return result.rows;
    };

    const buscarEnContactos = async (): Promise<any[]> => {
      // Busca entre los contactos ya sincronizados, o por correo exacto
      if (isEmail) {
        const result = await query(
          `SELECT id, nombre, apellidos, email FROM usuarios WHERE email = $1 AND id != $2`,
          [queryText, userId]
        );
        return result.rows;
      }
      // En una app real, aquí cruzaríamos contra una tabla de contactos_sincronizados.
      // Dado que no la almacenamos, si busca por nombre y la fuente es "contactos",
      // retorna vacío para no enumerar.
      return [];
    };

    let results: any[] = [];
    // Nota: el frontend usa "familia" para el tab "Otros perfiles" (antes el
    // backend esperaba "perfiles", un nombre distinto — por eso ese tab
    // nunca devolvía resultados). "todos" combina ambas fuentes.
    if (fuente === 'familia') {
      results = await buscarEnFamilia();
    } else if (fuente === 'contactos') {
      results = await buscarEnContactos();
    } else if (fuente === 'todos') {
      const [familia, contactos] = await Promise.all([buscarEnFamilia(), buscarEnContactos()]);
      const vistos = new Set<string>();
      results = [...familia, ...contactos].filter((p) => {
        if (vistos.has(p.id)) return false;
        vistos.add(p.id);
        return true;
      });
    } else {
      res.status(400).json({ error: 'Fuente inválida' });
      return;
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
