import { query } from "../config/db";

async function test() {
  try {
    const userId = "00000000-0000-0000-0000-000000000000";
    
    console.log("Testing with userId:", userId);

    const foroRes = await query(`
      SELECT 
        cf.id, cf.titulo, cf.contenido, cf.autor_nombre, cf.categoria, cf.tiempo_publicacion, cf.fecha_creacion,
        (SELECT COUNT(*)::int FROM comunidad_likes WHERE foro_id = cf.id) as likes,
        (SELECT COUNT(*)::int FROM comunidad_respuestas WHERE foro_id = cf.id) as respuestas,
        EXISTS(SELECT 1 FROM comunidad_likes cl WHERE cl.foro_id = cf.id AND cl.usuario_id = $1) as has_liked
      FROM comunidad_foros cf 
      WHERE cf.estado = 'activo' 
      ORDER BY cf.fecha_creacion DESC
    `, [userId]);
    console.log("Foros list result count:", foroRes.rows.length);
  } catch (error) {
    console.error("Query failed:", error);
  } finally {
    process.exit(0);
  }
}
test();
