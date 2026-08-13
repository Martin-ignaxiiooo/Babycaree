-- Tabla de hitos de desarrollo por mes de embarazo.
-- Antes estos textos estaban hardcodeados en el frontend
-- (apps/web/src/components/BabyGrowthIcon.tsx). Ahora viven acá para poder
-- editarlos sin necesidad de un deploy.
--
-- Es seguro correr este script varias veces.

CREATE TABLE IF NOT EXISTS embarazo_hitos_mes (
    mes INTEGER PRIMARY KEY CHECK (mes BETWEEN 1 AND 9),
    etiqueta VARCHAR(50) NOT NULL,        -- Ej: "Embrión", "Crecimiento"
    rango_semana VARCHAR(30) NOT NULL,    -- Ej: "Semana 4", "Semana 36-40"
    descripcion TEXT NOT NULL             -- Ej: "¡Mitad de camino! El bebé ya tiene pelo y cejas"
);

INSERT INTO embarazo_hitos_mes (mes, etiqueta, rango_semana, descripcion) VALUES
    (1, 'Embrión',       'Semana 4',     'Tu bebé es apenas un embrión pequeño'),
    (2, 'Desarrollo',    'Semana 8',     'Se están formando los órganos principales.'),
    (3, 'Feto',          'Semana 12',    '¡Ya es un feto! Empieza a moverse suavemente'),
    (4, 'Gesticulación', 'Semana 16',    'Tu bebé ya puede gesticular y succionar'),
    (5, 'Crecimiento',   'Semana 20',    '¡Mitad de camino! El bebé ya tiene pelo y cejas'),
    (6, 'Pulmones',      'Semana 24',    'La piel es traslúcida y los pulmones se desarrollan'),
    (7, 'Sentidos',      'Semana 28',    'El bebé ya abre los ojos y percibe la luz'),
    (8, 'Peso',          'Semana 32',    'Ganando peso rápidamente para el nacimiento'),
    (9, 'Final',         'Semana 36-40', '¡Casi listo para conocerte! El desarrollo está completo')
ON CONFLICT (mes) DO UPDATE SET
    etiqueta     = EXCLUDED.etiqueta,
    rango_semana = EXCLUDED.rango_semana,
    descripcion  = EXCLUDED.descripcion;
