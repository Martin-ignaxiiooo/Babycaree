-- Antes 'fuente' distinguía pecho izquierdo/derecho ('pecho_izq' /
-- 'pecho_der'). Se deja de pedir esa distinción: de ahora en adelante
-- el formulario solo pregunta Pecho o Biberón.
--
-- Los registros ya existentes con 'pecho_izq'/'pecho_der' NO se tocan
-- (se decidió no migrarlos); por eso la restricción se actualiza para
-- SUMAR 'pecho' como valor válido, sin sacar los dos viejos -si los
-- sacáramos, esta migración fallaría por violar la restricción contra
-- las filas que ya existen con esos valores.

-- 'registros_diarios_fuente_check' es el nombre por defecto que Postgres
-- le puso a esta restricción (convención: tabla_columna_check). Si por
-- algún motivo no es ese el nombre real, se puede verificar con:
--   SELECT conname FROM pg_constraint WHERE conrelid = 'registros_diarios'::regclass AND contype = 'c';

ALTER TABLE registros_diarios DROP CONSTRAINT IF EXISTS registros_diarios_fuente_check;

ALTER TABLE registros_diarios
  ADD CONSTRAINT registros_diarios_fuente_check
  CHECK (fuente IN ('pecho_izq', 'pecho_der', 'pecho', 'biberon'));
