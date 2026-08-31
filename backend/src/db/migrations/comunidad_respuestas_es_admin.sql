-- Comunidad: distinguir comentarios del equipo BabyCare de los de usuarias,
-- y permitir que el equipo comente sin estar atado a una cuenta de usuaria.
--
-- Decisiones:
--  * `es_admin` marca los comentarios creados desde el panel de moderación
--    (createAdminComentario ya inserta este valor, y getComentarios ya lo
--    lee — el código llegó antes que la columna).
--  * `usuario_id` pasa a ser anulable: un comentario de admin no pertenece
--    a ninguna cuenta de usuaria, y el insert de admin ya manda NULL ahí.
--    Sin este cambio, cualquier comentario de admin fallaría igual que la
--    lectura, solo que en el momento de crear en vez de listar.
--
-- Es seguro correr este script varias veces.

-- ── Columna es_admin ─────────────────────────────────────────────────────
ALTER TABLE comunidad_respuestas
  ADD COLUMN IF NOT EXISTS es_admin BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN comunidad_respuestas.es_admin IS
  'TRUE cuando el comentario lo creó el equipo BabyCare desde el panel de moderación, no una usuaria';

-- ── usuario_id anulable ──────────────────────────────────────────────────
-- Los comentarios de admin no tienen usuario_id (se inserta NULL); la
-- columna era NOT NULL, lo que rompería ese insert.
ALTER TABLE comunidad_respuestas
  ALTER COLUMN usuario_id DROP NOT NULL;

-- ── Índice ───────────────────────────────────────────────────────────────
-- Útil si en algún momento se quiere filtrar/destacar comentarios del
-- equipo dentro de un foro.
CREATE INDEX IF NOT EXISTS idx_comunidad_respuestas_es_admin
  ON comunidad_respuestas (foro_id, es_admin);
