import { query } from "../config/db";

// Extiende el sistema de "likes" (que ya existía para posts de foros) a los
// artículos educativos.
async function up() {
  try {
    console.log("Agregando columna likes a articulos_educativos...");
    await query(`
      ALTER TABLE articulos_educativos
      ADD COLUMN IF NOT EXISTS likes INTEGER NOT NULL DEFAULT 0;
    `);

    console.log("Creando tabla comunidad_articulo_likes...");
    await query(`
      CREATE TABLE IF NOT EXISTS comunidad_articulo_likes (
          articulo_id UUID NOT NULL REFERENCES articulos_educativos(id) ON DELETE CASCADE,
          usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
          fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (articulo_id, usuario_id)
      );
    `);

    console.log("Migración exitosa!");
    process.exit(0);
  } catch (error) {
    console.error("Migración falló:", error);
    process.exit(1);
  }
}

up();
