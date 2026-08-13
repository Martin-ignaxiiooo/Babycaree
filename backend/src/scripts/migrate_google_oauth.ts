import { query } from "../config/db";

// Agrega la columna google_id a usuarios (necesaria para el login real con
// Google). Segura de correr varias veces: usa IF NOT EXISTS.
async function migrate() {
  try {
    await query(`
      ALTER TABLE usuarios
      ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE
    `);
    console.log("Migración completada: columna google_id agregada (o ya existía) en usuarios.");
    process.exit(0);
  } catch (error) {
    console.error("Error en la migración:", error);
    process.exit(1);
  }
}

migrate();
