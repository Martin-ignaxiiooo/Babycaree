-- Citas médicas: distinción entre control rutinario y cita puntual, más el
-- seguimiento posterior ("¿cómo te fue?").
--
-- Decisiones:
--  * `tipo` distingue el control sano periódico (el que sigue el calendario
--    del pediatra: 2 meses, 4 meses, etc.) de una cita puntual por un motivo
--    concreto. Importa porque el tono del recordatorio y del seguimiento
--    cambia, y porque una mamá quiere poder filtrar "¿cuándo fue el último
--    control?" sin que se mezclen las consultas por resfríos.
--  * `seguimiento_enviado` es el mismo patrón de flag que ya usan los
--    recordatorios: permite que el cron corra muchas veces sin reenviar.
--  * Los campos de resultado se llenan cuando la madre responde el
--    seguimiento desde la app. Van anulables porque puede no responder.
--
-- Es seguro correr este script varias veces.

-- ── Tipo de cita ─────────────────────────────────────────────────────────
ALTER TABLE citas_medicas
  ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) NOT NULL DEFAULT 'cita';

-- El CHECK se agrega aparte y de forma tolerante: si la tabla ya tiene
-- filas con otro valor, preferimos no romper el deploy.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'citas_medicas_tipo_check'
  ) THEN
    ALTER TABLE citas_medicas
      ADD CONSTRAINT citas_medicas_tipo_check
      CHECK (tipo IN ('control', 'cita'));
  END IF;
END $$;

COMMENT ON COLUMN citas_medicas.tipo IS
  'control = control sano periódico del calendario pediátrico; cita = consulta puntual por un motivo específico';

-- ── Seguimiento post-cita ────────────────────────────────────────────────
ALTER TABLE citas_medicas
  ADD COLUMN IF NOT EXISTS seguimiento_enviado BOOLEAN NOT NULL DEFAULT FALSE;

-- Respuestas que deja la madre después de la cita.
ALTER TABLE citas_medicas
  ADD COLUMN IF NOT EXISTS asistio BOOLEAN;

ALTER TABLE citas_medicas
  ADD COLUMN IF NOT EXISTS resultado_notas TEXT;

ALTER TABLE citas_medicas
  ADD COLUMN IF NOT EXISTS fecha_seguimiento TIMESTAMP WITH TIME ZONE;

-- ── Índices ──────────────────────────────────────────────────────────────
-- El cron de seguimiento busca citas pasadas sin seguimiento enviado.
CREATE INDEX IF NOT EXISTS idx_citas_seguimiento_pendiente
  ON citas_medicas (fecha_cita)
  WHERE seguimiento_enviado = FALSE;

-- Filtrar controles vs citas dentro de un bebé.
CREATE INDEX IF NOT EXISTS idx_citas_bebe_tipo
  ON citas_medicas (bebe_id, tipo, fecha_cita DESC);
