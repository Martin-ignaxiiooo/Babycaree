-- Suscripciones a notificaciones push (Web Push / VAPID).
--
-- Una suscripción representa un navegador concreto en un dispositivo
-- concreto, no una persona: la misma madre puede tener el teléfono y el
-- notebook, y ambos deben recibir el aviso. Por eso la clave natural es
-- el endpoint, no el usuario.
--
-- Es seguro correr este script varias veces.

CREATE TABLE IF NOT EXISTS suscripciones_push (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- URL única que el navegador entrega al suscribirse. Es larga (puede
    -- superar los 300 caracteres en algunos navegadores) y es lo que
    -- identifica al dispositivo ante el servicio de push.
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,

    -- Para poder mostrarle al usuario "Chrome en Android" cuando quiera
    -- revocar el permiso desde otro dispositivo.
    user_agent TEXT,

    -- Cuando un envío falla con 404/410, el navegador ya no existe: se
    -- marca en vez de borrar de inmediato, para poder distinguir entre
    -- "nunca se suscribió" y "se dio de baja".
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_error TEXT,

    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_envio TIMESTAMPTZ
);

-- Al enviar se buscan todas las suscripciones activas de un usuario.
CREATE INDEX IF NOT EXISTS idx_suscripciones_push_usuario
    ON suscripciones_push (usuario_id) WHERE activa = TRUE;
