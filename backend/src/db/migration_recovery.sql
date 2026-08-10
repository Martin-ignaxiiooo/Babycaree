-- Agregar columnas de bloqueo de login a la tabla usuarios
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS intentos_login_fallidos SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMPTZ;

-- Tabla de códigos de recuperación de contraseña
CREATE TABLE IF NOT EXISTS codigos_recuperacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    hash_codigo VARCHAR(64) NOT NULL,
    expira_en TIMESTAMPTZ NOT NULL,
    intentos_fallidos SMALLINT NOT NULL DEFAULT 0,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    ip_solicitud INET NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_codigos_recuperacion_usuario ON codigos_recuperacion(id_usuario);
