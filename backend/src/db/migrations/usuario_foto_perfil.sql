-- Foto de perfil para el usuario (mamá/papá/cuidador).
--
-- Se guarda como data URI en base64 dentro de la propia fila, igual que
-- perfiles_bebes.foto_perfil: el filesystem de Render es efímero y se borra
-- en cada redeploy, así que una foto en disco desaparecería sola.
--
-- TEXT (no VARCHAR con límite) porque el base64 de una imagen ya comprimida
-- a 480px ronda los 40-80 KB y no tiene un tope fijo.

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS foto_perfil TEXT;
