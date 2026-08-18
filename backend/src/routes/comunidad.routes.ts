import { Router, Request, Response } from "express";
import { query } from "../config/db";
import { verifyToken, AuthRequest } from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyToken);

router.get("/foros", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const result = await query(`
      SELECT 
        cf.id, cf.titulo, cf.contenido, cf.autor_nombre, cf.categoria, cf.tiempo_publicacion, cf.fecha_creacion,
        (SELECT COUNT(*)::int FROM comunidad_likes WHERE foro_id = cf.id) as likes,
        (SELECT COUNT(*)::int FROM comunidad_respuestas WHERE foro_id = cf.id) as respuestas,
        EXISTS(SELECT 1 FROM comunidad_likes cl WHERE cl.foro_id = cf.id AND cl.usuario_id = $1) as has_liked
      FROM comunidad_foros cf 
      WHERE cf.estado = 'activo' 
      ORDER BY cf.fecha_creacion DESC
    `, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching foros:", error);
    res.status(500).json({ error: "Error al obtener foros" });
  }
});

// Obtener un foro y sus respuestas
router.get("/foros/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const foroId = req.params.id;
    
    const foroRes = await query(`
      SELECT 
        cf.id, cf.titulo, cf.contenido, cf.autor_nombre, cf.categoria, cf.tiempo_publicacion, cf.fecha_creacion,
        (SELECT COUNT(*)::int FROM comunidad_likes WHERE foro_id = cf.id) as likes,
        (SELECT COUNT(*)::int FROM comunidad_respuestas WHERE foro_id = cf.id) as respuestas,
        EXISTS(SELECT 1 FROM comunidad_likes cl WHERE cl.foro_id = cf.id AND cl.usuario_id = $1) as has_liked
      FROM comunidad_foros cf 
      WHERE cf.id = $2 AND cf.estado = 'activo'
    `, [userId, foroId]);

    if (foroRes.rows.length === 0) {
      return res.status(404).json({ error: "Foro no encontrado" });
    }

    const respuestasRes = await query(`
      SELECT * FROM comunidad_respuestas 
      WHERE foro_id = $1 
      ORDER BY fecha_creacion ASC
    `, [foroId]);

    res.json({
      foro: foroRes.rows[0],
      respuestas: respuestasRes.rows
    });
  } catch (error) {
    console.error("Error fetching foro detail:", error);
    res.status(500).json({ error: "Error al obtener detalle del foro" });
  }
});

// Crear un nuevo foro
router.post("/foros", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { titulo, contenido, categoria } = req.body;

    if (typeof titulo !== "string" || typeof contenido !== "string") {
      return res.status(400).json({ error: "Título y contenido son obligatorios" });
    }
    const tituloTrim = titulo.trim();
    const contenidoTrim = contenido.trim();
    if (tituloTrim.length === 0 || tituloTrim.length > 200) {
      return res.status(400).json({ error: "El título debe tener entre 1 y 200 caracteres" });
    }
    if (contenidoTrim.length === 0 || contenidoTrim.length > 5000) {
      return res.status(400).json({ error: "El contenido debe tener entre 1 y 5000 caracteres" });
    }

    // Obtener nombre del usuario
    const userRes = await query("SELECT nombre, apellidos FROM usuarios WHERE id = $1", [userId]);
    const autorNombre = `${userRes.rows[0].nombre} ${userRes.rows[0].apellidos}`;

    const result = await query(`
      INSERT INTO comunidad_foros (titulo, contenido, autor_nombre, categoria, usuario_id, tiempo_publicacion)
      VALUES ($1, $2, $3, $4, $5, 'Hace un momento')
      RETURNING *
    `, [tituloTrim, contenidoTrim, autorNombre, categoria || 'General', userId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating foro:", error);
    res.status(500).json({ error: "Error al crear el foro" });
  }
});

// Dar o quitar Like
router.post("/foros/:id/like", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const foroId = req.params.id;

    // Verificar si ya le dio like
    const checkRes = await query("SELECT 1 FROM comunidad_likes WHERE foro_id = $1 AND usuario_id = $2", [foroId, userId]);
    
    if (checkRes.rows.length > 0) {
      // Ya le dio like -> Quitar like
      await query("DELETE FROM comunidad_likes WHERE foro_id = $1 AND usuario_id = $2", [foroId, userId]);
      await query("UPDATE comunidad_foros SET likes = GREATEST(likes - 1, 0) WHERE id = $1", [foroId]);
      res.json({ liked: false });
    } else {
      // No le ha dado like -> Dar like
      await query("INSERT INTO comunidad_likes (foro_id, usuario_id) VALUES ($1, $2)", [foroId, userId]);
      await query("UPDATE comunidad_foros SET likes = likes + 1 WHERE id = $1", [foroId]);
      res.json({ liked: true });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "Error al procesar el like" });
  }
});

// Comentar en un foro
router.post("/foros/:id/respuestas", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const foroId = req.params.id;
    const { contenido } = req.body;

    if (typeof contenido !== "string") {
      return res.status(400).json({ error: "El contenido es obligatorio" });
    }
    const contenidoTrim = contenido.trim();
    if (contenidoTrim.length === 0 || contenidoTrim.length > 2000) {
      return res.status(400).json({ error: "El contenido debe tener entre 1 y 2000 caracteres" });
    }

    const userRes = await query("SELECT nombre, apellidos FROM usuarios WHERE id = $1", [userId]);
    const autorNombre = `${userRes.rows[0].nombre} ${userRes.rows[0].apellidos}`;

    const result = await query(`
      INSERT INTO comunidad_respuestas (foro_id, usuario_id, autor_nombre, contenido)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [foroId, userId, autorNombre, contenidoTrim]);

    // Incrementar contador de respuestas
    await query("UPDATE comunidad_foros SET respuestas = respuestas + 1 WHERE id = $1", [foroId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating respuesta:", error);
    res.status(500).json({ error: "Error al crear la respuesta" });
  }
});

router.get("/articulos", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const result = await query(`
      SELECT a.*,
        EXISTS(SELECT 1 FROM comunidad_articulo_likes l WHERE l.articulo_id = a.id AND l.usuario_id = $1) as has_liked
      FROM articulos_educativos a
      WHERE a.estado = 'publicado'
      ORDER BY a.fecha_creacion DESC
    `, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching articulos:", error);
    res.status(500).json({ error: "Error al obtener articulos" });
  }
});

// Obtener un articulo específico
router.get("/articulos/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const articuloId = req.params.id;
    
    // Sumar 1 al contador de lecturas
    await query("UPDATE articulos_educativos SET contador_lecturas = contador_lecturas + 1 WHERE id = $1", [articuloId]);

    const result = await query(`
      SELECT a.*,
        EXISTS(SELECT 1 FROM comunidad_articulo_likes l WHERE l.articulo_id = a.id AND l.usuario_id = $2) as has_liked
      FROM articulos_educativos a
      WHERE a.id = $1 AND a.estado = 'publicado'
    `, [articuloId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Artículo no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching articulo:", error);
    res.status(500).json({ error: "Error al obtener artículo" });
  }
});

// Dar o quitar like a un artículo
router.post("/articulos/:id/like", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const articuloId = req.params.id;

    const checkRes = await query(
      "SELECT 1 FROM comunidad_articulo_likes WHERE articulo_id = $1 AND usuario_id = $2",
      [articuloId, userId]
    );

    if (checkRes.rows.length > 0) {
      await query("DELETE FROM comunidad_articulo_likes WHERE articulo_id = $1 AND usuario_id = $2", [articuloId, userId]);
      await query("UPDATE articulos_educativos SET likes = GREATEST(likes - 1, 0) WHERE id = $1", [articuloId]);
      res.json({ liked: false });
    } else {
      await query("INSERT INTO comunidad_articulo_likes (articulo_id, usuario_id) VALUES ($1, $2)", [articuloId, userId]);
      await query("UPDATE articulos_educativos SET likes = likes + 1 WHERE id = $1", [articuloId]);
      res.json({ liked: true });
    }
  } catch (error) {
    console.error("Error toggling like de artículo:", error);
    res.status(500).json({ error: "Error al procesar el like" });
  }
});

export default router;
