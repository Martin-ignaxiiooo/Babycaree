-- 2FA por correo para administradores: al loguear, se envía un código de
-- 6 dígitos al correo corporativo registrado (mismo patrón que ya usan
-- los usuarios para recuperar contraseña, ver migration_recovery.sql).
--
-- Reemplaza el enfoque anterior de app autenticadora (TOTP/QR): las
-- columnas dos_fa_secret / dos_fa_activo de admin_2fa.sql quedan sin uso
-- (no se borran, por si se quisiera reactivar ese camino más adelante,
-- pero el login ya no las consulta).
--
-- Es seguro correr este script varias veces.

CREATE TABLE IF NOT EXISTS codigos_2fa_admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_admin UUID NOT NULL REFERENCES administradores(id) ON DELETE CASCADE,
    hash_codigo VARCHAR(64) NOT NULL,
    expira_en TIMESTAMPTZ NOT NULL,
    intentos_fallidos SMALLINT NOT NULL DEFAULT 0,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    ip_solicitud VARCHAR(64),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_codigos_2fa_admin_admin ON codigos_2fa_admin(id_admin);
