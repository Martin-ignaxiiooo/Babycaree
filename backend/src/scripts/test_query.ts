import { query } from "../config/db";

async function test() {
  try {
    const foroId = "fd0238b1-9471-46b9-9515-1c51979280ff";
    // I need a valid user id. I will get the first one.
    const userRes = await query("SELECT id FROM usuarios LIMIT 1");
    if (!userRes.rows.length) return console.log("No users");
    const userId = userRes.rows[0].id;
    
    console.log("Testing with userId:", userId, "foroId:", foroId);

    const foroRes = await query(`
      SELECT 
        cf.id, cf.titulo, cf.contenido, cf.autor_nombre, cf.categoria, cf.tiempo_publicacion, cf.fecha_creacion,
        (SELECT COUNT(*)::int FROM comunidad_likes WHERE foro_id = cf.id) as likes,
        (SELECT COUNT(*)::int FROM comunidad_respuestas WHERE foro_id = cf.id) as respuestas,
        EXISTS(SELECT 1 FROM comunidad_likes cl WHERE cl.foro_id = cf.id AND cl.usuario_id = $1) as has_liked
      FROM comunidad_foros cf 
      WHERE cf.id = $2 AND cf.estado = 'activo'
    `, [userId, foroId]);
    console.log("Foro Detail Query Result:", foroRes.rows);
  } catch (error) {
    console.error("Query failed:", error);
  } finally {
    process.exit(0);
  }
}
test();
