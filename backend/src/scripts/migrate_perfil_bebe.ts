import { query } from "../config/db";

async function up() {
  try {
    console.log("Starting migration for Perfil del Bebe module...");

    // Ensure pgcrypto is active for the hashes
    await query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // 1. ALTER usuarios table
    console.log("Adding hash columns to usuarios...");
    await query(`
      ALTER TABLE usuarios
      ADD COLUMN IF NOT EXISTS correo_hash VARCHAR(64) GENERATED ALWAYS AS (encode(digest(lower(trim(email)), 'sha256'), 'hex')) STORED,
      ADD COLUMN IF NOT EXISTS telefono_hash VARCHAR(64);
    `);

    // 2. ALTER perfiles_bebes table
    console.log("Adding new columns to perfiles_bebes...");
    await query(`
      ALTER TABLE perfiles_bebes DROP COLUMN IF EXISTS es_prematuro;
      ALTER TABLE perfiles_bebes
      ADD COLUMN IF NOT EXISTS apodo VARCHAR(30),
      ADD COLUMN IF NOT EXISTS prevision_salud VARCHAR(50),
      ADD COLUMN IF NOT EXISTS foto_perfil VARCHAR(255),
      ADD COLUMN IF NOT EXISTS peso_nacimiento_g INTEGER CHECK (peso_nacimiento_g BETWEEN 500 AND 6000),
      ADD COLUMN IF NOT EXISTS talla_nacimiento_cm DECIMAL(5,2) CHECK (talla_nacimiento_cm BETWEEN 25 AND 65),
      ADD COLUMN IF NOT EXISTS semanas_gestacion_nac INTEGER CHECK (semanas_gestacion_nac BETWEEN 22 AND 44),
      ADD COLUMN IF NOT EXISTS es_prematuro BOOLEAN GENERATED ALWAYS AS (semanas_gestacion_nac < 37) STORED,
      ADD COLUMN IF NOT EXISTS tipo_sangre VARCHAR(10) CHECK (tipo_sangre IN ('O+','O-','A+','A-','B+','B-','AB+','AB-','No se')),
      ADD COLUMN IF NOT EXISTS alergias TEXT CHECK (char_length(alergias) <= 500),
      ADD COLUMN IF NOT EXISTS condiciones_cronicas TEXT CHECK (char_length(condiciones_cronicas) <= 500),
      ADD COLUMN IF NOT EXISTS pediatra_nombre VARCHAR(100),
      ADD COLUMN IF NOT EXISTS centro_salud VARCHAR(150);
    `);

    // 3. CREATE ENUM TYPES (IF NOT EXISTS requires DO block in PG)
    console.log("Creating ENUM types...");
    await query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nivel_permiso_enum') THEN
              CREATE TYPE nivel_permiso_enum AS ENUM ('solo_lectura', 'solo_lectura_galeria', 'ver_editar');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_acceso_enum') THEN
              CREATE TYPE estado_acceso_enum AS ENUM ('pendiente', 'activo', 'revocado', 'expirado');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_accion_enum') THEN
              CREATE TYPE tipo_accion_enum AS ENUM ('edicion_dato', 'invitacion_creada', 'permiso_modificado', 'acceso_revocado', 'qr_regenerado', 'qr_emergencia_generado');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nivel_importancia_enum') THEN
              CREATE TYPE nivel_importancia_enum AS ENUM ('normal', 'alto');
          END IF;
      END$$;
    `);

    // 4. CREATE accesos_compartidos_bebe
    console.log("Creating accesos_compartidos_bebe...");
    await query(`
      CREATE TABLE IF NOT EXISTS accesos_compartidos_bebe (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        id_perfil_bebe UUID NOT NULL REFERENCES perfiles_bebes(id) ON DELETE CASCADE,
        id_usuario_invitado UUID REFERENCES usuarios(id),
        correo_invitado VARCHAR(255) NOT NULL,
        nivel_permiso nivel_permiso_enum NOT NULL,
        ver_salud BOOLEAN NOT NULL DEFAULT true,
        ver_galeria BOOLEAN NOT NULL DEFAULT false,
        ver_datos_personales BOOLEAN NOT NULL DEFAULT true,
        recibir_notificaciones BOOLEAN NOT NULL DEFAULT false,
        estado estado_acceso_enum NOT NULL DEFAULT 'pendiente',
        invitado_por UUID NOT NULL REFERENCES usuarios(id),
        fecha_invitacion TIMESTAMPTZ NOT NULL DEFAULT now(),
        fecha_aceptacion TIMESTAMPTZ,
        fecha_expiracion TIMESTAMPTZ,
        es_qr_temporal BOOLEAN NOT NULL DEFAULT false,
        token_qr_hash VARCHAR(64),
        CONSTRAINT ver_galeria_solo_si_nivel_valido CHECK (
          NOT (ver_galeria = true AND nivel_permiso NOT IN ('solo_lectura_galeria'))
        )
      );

      CREATE INDEX IF NOT EXISTS idx_accesos_perfil ON accesos_compartidos_bebe (id_perfil_bebe);
      CREATE INDEX IF NOT EXISTS idx_accesos_token_qr ON accesos_compartidos_bebe (token_qr_hash);
    `);

    // 5. CREATE auditoria_perfil_bebe
    console.log("Creating auditoria_perfil_bebe...");
    await query(`
      CREATE TABLE IF NOT EXISTS auditoria_perfil_bebe (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        id_perfil_bebe UUID NOT NULL REFERENCES perfiles_bebes(id),
        id_usuario_ejecutor UUID NOT NULL REFERENCES usuarios(id),
        tipo_accion tipo_accion_enum NOT NULL,
        campo_modificado VARCHAR(60),
        valor_anterior JSONB,
        valor_nuevo JSONB,
        nivel_importancia nivel_importancia_enum NOT NULL DEFAULT 'normal',
        fecha_hora_utc TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    
    // Optional: REVOKE UPDATE, DELETE ON auditoria_perfil_bebe FROM app_role;
    // We assume the DB user in the connection string has DDL rights, so we can't easily restrict it without knowing the roles.
    
    console.log("Migration successful!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

up();
