-- Bloqueo por intentos fallidos para cuentas de administrador.
--
-- Los usuarios normales ya tenían esta protección (ver migration_recovery.sql),
-- pero las cuentas de admin -que son las más valiosas del sistema- solo
-- estaban protegidas por rate limit de IP, que se evade rotando IPs.
--
-- Es seguro correr este script varias veces.

ALTER TABLE administradores
  ADD COLUMN IF NOT EXISTS intentos_login_fallidos SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE administradores
  ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMPTZ;

COMMENT ON COLUMN administradores.intentos_login_fallidos IS
  'Contador de intentos fallidos consecutivos. Se resetea al entrar bien.';
COMMENT ON COLUMN administradores.bloqueado_hasta IS
  'Si tiene fecha futura, la cuenta no puede iniciar sesión hasta ese momento.';
