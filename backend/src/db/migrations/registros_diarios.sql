-- Registro diario del bebé: tomas (pecho/biberón), sueño y cambios de pañal.
-- Es el "Daily Log" de la app mobile: lo que una madre registra muchas veces
-- al día, muchas veces de madrugada y con una sola mano.
--
-- Decisiones de diseño:
--  * Una sola tabla con un campo `tipo` en vez de tres tablas separadas: la
--    vista principal es siempre una línea de tiempo cronológica mezclando los
--    tres tipos, así que separarlas obligaría a hacer UNION en cada consulta.
--  * Los campos específicos de cada tipo van como columnas anulables. Son
--    pocas y así se pueden validar e indexar, cosa que un JSON no permitiría
--    de forma tan directa.
--  * `fecha_hora` la manda el cliente (no es DEFAULT NOW()) porque es normal
--    registrar una toma después de que ocurrió: "le di el biberón hace 20 min".
--
-- Es seguro correr este script varias veces.

CREATE TABLE IF NOT EXISTS registros_diarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bebe_id UUID NOT NULL REFERENCES perfiles_bebes(id) ON DELETE CASCADE,
    -- Quién registró el evento: sirve para el caso de cuidado compartido
    -- (mamá, papá, abuela), donde importa saber quién hizo qué.
    registrado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,

    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('toma', 'sueno', 'panal')),
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- ── Campos de 'toma' ───────────────────────────────────────────────
    -- fuente: de dónde comió. 'pecho_izq' / 'pecho_der' / 'biberon'
    fuente VARCHAR(20) CHECK (fuente IN ('pecho_izq', 'pecho_der', 'biberon')),
    -- Solo aplica a biberón. Tope alto (500ml) para no bloquear casos reales.
    cantidad_ml INTEGER CHECK (cantidad_ml > 0 AND cantidad_ml <= 500),
    -- Solo aplica a pecho: cuántos minutos duró la toma.
    duracion_min INTEGER CHECK (duracion_min > 0 AND duracion_min <= 240),

    -- ── Campos de 'sueno' ──────────────────────────────────────────────
    -- Un sueño en curso tiene fin NULL: así la app puede mostrar
    -- "durmiendo hace 40 min" y cerrarlo después.
    sueno_inicio TIMESTAMP WITH TIME ZONE,
    sueno_fin TIMESTAMP WITH TIME ZONE,

    -- ── Campos de 'panal' ──────────────────────────────────────────────
    panal_tipo VARCHAR(20) CHECK (panal_tipo IN ('pis', 'caca', 'mixto')),

    nota TEXT CHECK (char_length(nota) <= 300),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Coherencia por tipo: evita filas sin sentido, como una 'toma' sin
    -- fuente o un 'panal' con cantidad en mililitros.
    CONSTRAINT registros_diarios_campos_por_tipo CHECK (
        (tipo = 'toma'  AND fuente IS NOT NULL
                        AND sueno_inicio IS NULL AND sueno_fin IS NULL
                        AND panal_tipo IS NULL)
     OR (tipo = 'sueno' AND sueno_inicio IS NOT NULL
                        AND fuente IS NULL AND cantidad_ml IS NULL
                        AND duracion_min IS NULL AND panal_tipo IS NULL)
     OR (tipo = 'panal' AND panal_tipo IS NOT NULL
                        AND fuente IS NULL AND cantidad_ml IS NULL
                        AND duracion_min IS NULL
                        AND sueno_inicio IS NULL AND sueno_fin IS NULL)
    ),
    -- Un sueño no puede terminar antes de empezar.
    CONSTRAINT registros_diarios_sueno_coherente CHECK (
        sueno_fin IS NULL OR sueno_inicio IS NULL OR sueno_fin >= sueno_inicio
    )
);

-- La consulta más frecuente por lejos: "dame los eventos de este bebé, del más
-- reciente al más antiguo". DESC en el índice para que el ORDER BY no ordene.
CREATE INDEX IF NOT EXISTS idx_registros_diarios_bebe_fecha
    ON registros_diarios (bebe_id, fecha_hora DESC);

-- Para encontrar rápido un sueño en curso (fin IS NULL) sin escanear todo.
CREATE INDEX IF NOT EXISTS idx_registros_diarios_sueno_abierto
    ON registros_diarios (bebe_id)
    WHERE tipo = 'sueno' AND sueno_fin IS NULL;
