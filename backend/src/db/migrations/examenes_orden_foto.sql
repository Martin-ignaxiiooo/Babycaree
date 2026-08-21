-- Foto de la orden de exámenes (el papel que indica qué exámenes hacerse),
-- separada de resultado_foto (que es la foto del RESULTADO una vez hecho
-- el examen). Son dos momentos distintos: primero se indica, después se
-- realiza y se sube el resultado.
--
-- Es seguro correr este script varias veces.

ALTER TABLE examenes_medicos
  ADD COLUMN IF NOT EXISTS orden_foto TEXT;

COMMENT ON COLUMN examenes_medicos.orden_foto IS
  'Data URI base64 de la foto de la orden/indicación médica de este examen (antes de realizarlo). Distinta de resultado_foto, que es la foto del resultado una vez hecho.';
