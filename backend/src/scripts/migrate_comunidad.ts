import { query } from "../config/db";

async function migrateComunidad() {
  console.log("Iniciando migración de la base de datos para Comunidad...");

  try {
    // 1. Agregar columnas a comunidad_foros si no existen
    console.log("Alterando tabla comunidad_foros...");
    await query(`
      ALTER TABLE comunidad_foros 
      ADD COLUMN IF NOT EXISTS contenido TEXT,
      ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;
    `);

    // Actualizar contenido por defecto para los registros antiguos que no tengan
    await query(`
      UPDATE comunidad_foros 
      SET contenido = 'Contenido original del foro...'
      WHERE contenido IS NULL;
    `);

    // 2. Crear tabla de respuestas (comentarios)
    console.log("Creando tabla comunidad_respuestas...");
    await query(`
      CREATE TABLE IF NOT EXISTS comunidad_respuestas (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          foro_id UUID NOT NULL REFERENCES comunidad_foros(id) ON DELETE CASCADE,
          usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
          autor_nombre VARCHAR(100) NOT NULL,
          contenido TEXT NOT NULL,
          fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Crear tabla de likes
    console.log("Creando tabla comunidad_likes...");
    await query(`
      CREATE TABLE IF NOT EXISTS comunidad_likes (
          foro_id UUID NOT NULL REFERENCES comunidad_foros(id) ON DELETE CASCADE,
          usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
          fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (foro_id, usuario_id)
      );
    `);

    console.log("Migración de Comunidad completada con éxito. 🎉");
    process.exit(0);
  } catch (error) {
    console.error("Error durante la migración:", error);
    process.exit(1);
  }
}

migrateComunidad();
