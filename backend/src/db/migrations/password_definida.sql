-- Distingue las cuentas que tienen una contraseña elegida por el usuario de
-- las creadas vía Google, a las que se les asigna un password_hash aleatorio
-- que el usuario nunca ve (ver auth.controller.ts, login con Google).
--
-- El problema que resuelve: esas cuentas no podían establecer una contraseña
-- desde "Mi perfil", porque el formulario exige la "contraseña actual" — que
-- en su caso es una cadena aleatoria imposible de conocer. El cambio fallaba
-- silenciosamente y después no podían entrar con correo/contraseña.
--
-- Es seguro correr este script varias veces.

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS password_definida BOOLEAN NOT NULL DEFAULT TRUE;

-- Las cuentas existentes creadas con Google que nunca definieron contraseña
-- se marcan como tal. Heurística: tienen google_id. Si alguna de ellas sí
-- había definido contraseña por el flujo de recuperación, puede volver a
-- usar ese mismo flujo — no pierde acceso.
UPDATE usuarios
SET password_definida = FALSE
WHERE google_id IS NOT NULL;

COMMENT ON COLUMN usuarios.password_definida IS
  'FALSE en cuentas creadas vía Google que aún no eligieron una contraseña propia: a esas se les permite establecerla sin pedir la actual.';
