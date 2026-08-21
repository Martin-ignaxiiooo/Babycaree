-- Resultado de la consulta y exámenes indicados.
--
-- Contexto: después de una cita, la madre vuelve con información suelta
-- (el peso que le dijeron, un diagnóstico, una receta en papel, órdenes de
-- exámenes). Hoy todo eso se pierde o queda en fotos del carrete. Estas
-- tablas le dan un lugar a cada cosa y la enlazan con la cita que la originó.
--
-- Es seguro correr este script varias veces.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. RESULTADO DE LA CONSULTA
-- ─────────────────────────────────────────────────────────────────────────
-- Se guarda en la propia cita en vez de en una tabla aparte: es una relación
-- uno a uno (una cita tiene un resultado) y así una sola consulta trae la
-- cita con todo lo que pasó en ella.

ALTER TABLE citas_medicas
  ADD COLUMN IF NOT EXISTS peso_kg DECIMAL(5,2)
    CHECK (peso_kg IS NULL OR (peso_kg > 0 AND peso_kg < 60));

ALTER TABLE citas_medicas
  ADD COLUMN IF NOT EXISTS talla_cm DECIMAL(5,2)
    CHECK (talla_cm IS NULL OR (talla_cm > 0 AND talla_cm < 200));

ALTER TABLE citas_medicas
  ADD COLUMN IF NOT EXISTS diagnostico TEXT
    CHECK (diagnostico IS NULL OR char_length(diagnostico) <= 1000);

ALTER TABLE citas_medicas
  ADD COLUMN IF NOT EXISTS indicaciones TEXT
    CHECK (indicaciones IS NULL OR char_length(indicaciones) <= 2000);

-- Foto de la receta, como data URI base64. Mismo criterio que foto_perfil
-- del bebé: el filesystem de Render es efímero y se borra en cada redeploy,
-- así que un archivo en disco se perdería.
ALTER TABLE citas_medicas
  ADD COLUMN IF NOT EXISTS receta_foto TEXT;

COMMENT ON COLUMN citas_medicas.receta_foto IS
  'Data URI base64 de la foto de la receta. El cliente la comprime antes de enviarla.';

-- Enlaza esta cita con la que se agendó como continuación. Permite recorrer
-- el historial ("de este control salió esta próxima hora").
ALTER TABLE citas_medicas
  ADD COLUMN IF NOT EXISTS proxima_cita_id UUID
    REFERENCES citas_medicas(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. EXÁMENES INDICADOS
-- ─────────────────────────────────────────────────────────────────────────
-- Tabla aparte porque de una sola cita pueden salir varios exámenes, y cada
-- uno tiene su propio ciclo de vida (indicado -> realizado -> con resultado).

CREATE TABLE IF NOT EXISTS examenes_medicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bebe_id UUID NOT NULL REFERENCES perfiles_bebes(id) ON DELETE CASCADE,

    -- De qué cita salió la orden. Anulable: se puede registrar un examen
    -- suelto sin haber cargado la cita correspondiente.
    cita_id UUID REFERENCES citas_medicas(id) ON DELETE SET NULL,

    nombre VARCHAR(150) NOT NULL,
    indicaciones TEXT CHECK (indicaciones IS NULL OR char_length(indicaciones) <= 1000),

    fecha_indicacion DATE NOT NULL DEFAULT CURRENT_DATE,
    -- Cuándo debería hacerse. Sirve para el recordatorio.
    fecha_sugerida DATE,
    fecha_realizacion DATE,

    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
      CHECK (estado IN ('pendiente', 'realizado', 'omitido')),

    -- Resultado, cuando ya se hizo.
    resultado_notas TEXT CHECK (resultado_notas IS NULL OR char_length(resultado_notas) <= 2000),
    resultado_foto TEXT,

    -- Flag del recordatorio "¿ya te hiciste el examen?", mismo patrón que
    -- los recordatorios de cita: evita reenvíos si el cron corre varias veces.
    recordatorio_enviado BOOLEAN NOT NULL DEFAULT FALSE,

    registrado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN examenes_medicos.resultado_foto IS
  'Data URI base64 de la foto del resultado. El cliente la comprime antes de enviarla.';

-- Listado de exámenes de un bebé, los pendientes primero.
CREATE INDEX IF NOT EXISTS idx_examenes_bebe
  ON examenes_medicos (bebe_id, estado, fecha_sugerida);

-- El cron busca exámenes pendientes cuya fecha sugerida ya pasó.
CREATE INDEX IF NOT EXISTS idx_examenes_recordatorio_pendiente
  ON examenes_medicos (fecha_sugerida)
  WHERE estado = 'pendiente' AND recordatorio_enviado = FALSE;
