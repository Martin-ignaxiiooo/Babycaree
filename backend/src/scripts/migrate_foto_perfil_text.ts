import { query } from "../config/db";

// Antes, foto_perfil era VARCHAR(255) pensado para guardar solo una URL/ruta
// de archivo. Ahora guardamos la imagen codificada en base64 directamente en
// la fila (data URI), así que necesita mucho más espacio. TEXT no tiene
// límite práctico en Postgres.
async function up() {
  try {
    console.log("Ampliando columna foto_perfil a TEXT...");
    await query(`
      ALTER TABLE perfiles_bebes
      ALTER COLUMN foto_perfil TYPE TEXT;
    `);
    console.log("Migración exitosa!");
    process.exit(0);
  } catch (error) {
    console.error("Migración falló:", error);
    process.exit(1);
  }
}

up();
