-- Guardar hora y minuto en el registro de vacunas (antes solo se guardaba
-- el día, sin hora).
--
-- De paso corrige un bug de visualización: al ser DATE, Postgres/node-pg
-- devolvía la fecha como medianoche UTC, y el navegador (en horario de
-- Chile, UTC-3/-4) la mostraba un día antes del real. Con hora real
-- guardada correctamente en UTC (y no forzada a medianoche), el problema
-- desaparece para los registros nuevos.
--
-- Los registros viejos (que nunca tuvieron una hora real, solo el día) se
-- migran al mediodía UTC en vez de medianoche: al mediodía UTC es de
-- mañana en Chile (UTC-3/-4) y de tarde/noche en casi cualquier otro huso
-- horario razonable, así que se sigue mostrando el día correcto sin
-- importar en qué zona horaria esté quien lo mire.

ALTER TABLE registro_vacunas
  ALTER COLUMN fecha_aplicacion TYPE TIMESTAMP WITH TIME ZONE
  USING (
    CASE WHEN fecha_aplicacion IS NULL THEN NULL
    ELSE (fecha_aplicacion::text || ' 12:00:00+00')::timestamptz
    END
  );
