-- Columnas de 2FA (TOTP) para administradores. El código que las usa ya
-- existe (admin_2fa.controller.ts, admin.controller.ts) pero nunca se
-- crearon en el schema: sin esto, activar 2FA fallaría en producción.
--
-- Es seguro correr este script varias veces.

ALTER TABLE administradores
  ADD COLUMN IF NOT EXISTS dos_fa_secret VARCHAR(255);

ALTER TABLE administradores
  ADD COLUMN IF NOT EXISTS dos_fa_activo BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN administradores.dos_fa_secret IS
  'Secreto TOTP en base32, usado por speakeasy para generar/verificar códigos de Google Authenticator u otra app similar.';
COMMENT ON COLUMN administradores.dos_fa_activo IS
  'TRUE solo después de que el admin escaneó el QR y confirmó un código válido (ver enable2fa). requiere_2fa es la política; dos_fa_activo es si ya está configurado.';
