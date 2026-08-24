-- Salud de la MADRE durante el embarazo: peso, presión arterial y síntomas.
--
-- Hasta ahora la app solo registraba peso y talla del BEBÉ. Estas tablas
-- son para la gestante, que en el embarazo es a quien se controla.
--
-- Es seguro correr este script varias veces.

-- ── Registros de peso y presión ──────────────────────────────────────────
-- Van juntos en una tabla porque se toman en el mismo momento (el control
-- prenatal) y casi siempre se registran a la vez. Ambos son opcionales:
-- se puede anotar solo el peso, o solo la presión.
CREATE TABLE IF NOT EXISTS salud_materna (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bebe_id UUID NOT NULL REFERENCES perfiles_bebes(id) ON DELETE CASCADE,
    registrado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,

    fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Rangos amplios a propósito: acotan errores de tipeo evidentes sin
    -- juzgar qué es "normal", que es tarea del médico y no de la app.
    peso_kg DECIMAL(5,2) CHECK (peso_kg IS NULL OR (peso_kg > 25 AND peso_kg < 250)),
    presion_sistolica  SMALLINT CHECK (presion_sistolica  IS NULL OR (presion_sistolica  BETWEEN 60 AND 260)),
    presion_diastolica SMALLINT CHECK (presion_diastolica IS NULL OR (presion_diastolica BETWEEN 30 AND 180)),

    nota TEXT CHECK (nota IS NULL OR char_length(nota) <= 300),
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Un registro vacío no aporta nada.
    CONSTRAINT salud_materna_algo_que_guardar CHECK (
        peso_kg IS NOT NULL OR presion_sistolica IS NOT NULL
    ),
    -- Si se anota presión, van las dos cifras: "120" solo no significa nada.
    CONSTRAINT salud_materna_presion_completa CHECK (
        (presion_sistolica IS NULL) = (presion_diastolica IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_salud_materna_bebe
    ON salud_materna (bebe_id, fecha_registro DESC);

-- ── Síntomas ─────────────────────────────────────────────────────────────
-- Tabla aparte: en un mismo día pueden registrarse varios síntomas, y se
-- consultan por separado del peso.
CREATE TABLE IF NOT EXISTS sintomas_maternos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bebe_id UUID NOT NULL REFERENCES perfiles_bebes(id) ON DELETE CASCADE,
    registrado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,

    fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,
    sintoma VARCHAR(40) NOT NULL,
    nota TEXT CHECK (nota IS NULL OR char_length(nota) <= 300),
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sintomas_maternos_bebe
    ON sintomas_maternos (bebe_id, fecha_registro DESC);

-- ── Meta de peso ─────────────────────────────────────────────────────────
-- El peso previo al embarazo permite mostrar cuánto se lleva subido, que
-- es lo que interesa seguir, en vez del peso absoluto.
ALTER TABLE perfiles_bebes
    ADD COLUMN IF NOT EXISTS peso_pregestacional_kg DECIMAL(5,2);
