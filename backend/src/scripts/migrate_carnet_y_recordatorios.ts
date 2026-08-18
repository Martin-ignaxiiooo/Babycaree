import { query } from "../config/db";

// Agrega los campos necesarios para:
// 1) El carnet pediátrico digital (RUT y contacto de emergencia del bebé)
// 2) El tracking de qué recordatorios de citas ya se enviaron por correo
//    (para no mandar el mismo recordatorio dos veces)
async function up() {
  try {
    console.log("Agregando columnas para carnet digital...");
    await query(`
      ALTER TABLE perfiles_bebes
      ADD COLUMN IF NOT EXISTS rut VARCHAR(12),
      ADD COLUMN IF NOT EXISTS contacto_emergencia_nombre VARCHAR(100),
      ADD COLUMN IF NOT EXISTS contacto_emergencia_telefono VARCHAR(20);
    `);

    console.log("Agregando columnas para recordatorios de citas...");
    await query(`
      ALTER TABLE citas_medicas
      ADD COLUMN IF NOT EXISTS recordatorio_7d_enviado BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS recordatorio_1d_enviado BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS recordatorio_2h_enviado BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    console.log("Migración exitosa!");
    process.exit(0);
  } catch (error) {
    console.error("Migración falló:", error);
    process.exit(1);
  }
}

up();
