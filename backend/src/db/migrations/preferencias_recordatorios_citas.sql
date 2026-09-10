-- Preferencias de notificaciones por correo para recordatorios de citas.
--
-- Antes, el cron de recordatorios (citaReminders.service.ts) usaba 3
-- ventanas fijas e iguales para todos los usuarios (7 días, 1 día, 2
-- horas antes), sin forma de desactivarlas ni de elegir cuáles recibir.
--
-- Con esto, cada usuario controla:
--   - Si quiere recibir estos correos en absoluto.
--   - Cuáles de las 5 ventanas disponibles quiere recibir (puede elegir
--     varias, ninguna, o todas). Guardadas como horas-antes-de-la-cita
--     para poder representar tanto días como "2 horas antes" con la
--     misma columna.
--
-- Como cada destinatario de una misma cita (dueño + familiares con
-- acceso) puede tener una configuración distinta, el registro de "ya se
-- envió este recordatorio" deja de ser una columna en citas_medicas
-- (que asumía una sola configuración para todos) y pasa a ser una tabla
-- aparte, por cita + usuario + ventana.

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS recordatorios_citas_activos BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS recordatorios_citas_horas INTEGER[] NOT NULL DEFAULT '{168,24,2}';
  -- Default = comportamiento actual: 7 días (168h), 1 día (24h), 2 horas.

CREATE TABLE IF NOT EXISTS recordatorios_citas_enviados (
  id SERIAL PRIMARY KEY,
  cita_id UUID NOT NULL REFERENCES citas_medicas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  horas_antes INTEGER NOT NULL,
  fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cita_id, usuario_id, horas_antes)
);
