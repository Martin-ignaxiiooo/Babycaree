-- db/schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla de Usuarios (Adultos/Cuidadores)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    rol VARCHAR(20) DEFAULT 'madre', -- madre, padre, admin, especialista, etc.
    consentimiento_ley_19628 BOOLEAN DEFAULT FALSE,
    consentimiento_ley_21719 BOOLEAN DEFAULT FALSE,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ultima_conexion TIMESTAMP WITH TIME ZONE,
    correo_hash VARCHAR(64) GENERATED ALWAYS AS (encode(digest(lower(trim(email)), 'sha256'), 'hex')) STORED,
    telefono_hash VARCHAR(64),
    google_id VARCHAR(255) UNIQUE
);

-- Tabla de Perfiles de Bebés
CREATE TABLE IF NOT EXISTS perfiles_bebes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo VARCHAR(20),
    es_prematuro BOOLEAN GENERATED ALWAYS AS (semanas_gestacion_nac < 37) STORED,
    semanas_gestacion INTEGER CHECK (semanas_gestacion >= 20 AND semanas_gestacion <= 42),
    estado VARCHAR(20) DEFAULT 'nacido', -- 'nacido' o 'embarazo'
    fecha_estimada_parto DATE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    apodo VARCHAR(30),
    prevision_salud VARCHAR(50),
    foto_perfil TEXT, -- data URI base64 de la foto de perfil (subida por el usuario)
    peso_nacimiento_g INTEGER CHECK (peso_nacimiento_g BETWEEN 500 AND 6000),
    talla_nacimiento_cm DECIMAL(5,2) CHECK (talla_nacimiento_cm BETWEEN 25 AND 65),
    semanas_gestacion_nac INTEGER CHECK (semanas_gestacion_nac BETWEEN 22 AND 44),
    tipo_sangre VARCHAR(10) CHECK (tipo_sangre IN ('O+','O-','A+','A-','B+','B-','AB+','AB-','No se')),
    alergias TEXT CHECK (char_length(alergias) <= 500),
    condiciones_cronicas TEXT CHECK (char_length(condiciones_cronicas) <= 500),
    pediatra_nombre VARCHAR(100),
    centro_salud VARCHAR(150),
    rut VARCHAR(12),
    contacto_emergencia_nombre VARCHAR(100),
    contacto_emergencia_telefono VARCHAR(20)
);

-- Calendario de Vacunas PNI
CREATE TABLE IF NOT EXISTS vacunas_pni (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    enfermedades_previene TEXT,
    meses_edad_recomendada INTEGER NOT NULL -- 0 para RN, 2 para 2 meses, etc.
);

-- Accesos Compartidos
CREATE TYPE nivel_permiso_enum AS ENUM ('solo_lectura', 'solo_lectura_galeria', 'ver_editar');
CREATE TYPE estado_acceso_enum AS ENUM ('pendiente', 'activo', 'revocado', 'expirado');

CREATE TABLE IF NOT EXISTS accesos_compartidos_bebe (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_perfil_bebe UUID NOT NULL REFERENCES perfiles_bebes(id) ON DELETE CASCADE,
  id_usuario_invitado UUID REFERENCES usuarios(id),
  correo_invitado VARCHAR(255) NOT NULL,
  nivel_permiso nivel_permiso_enum NOT NULL,
  ver_salud BOOLEAN NOT NULL DEFAULT true,
  ver_galeria BOOLEAN NOT NULL DEFAULT false,
  ver_datos_personales BOOLEAN NOT NULL DEFAULT true,
  recibir_notificaciones BOOLEAN NOT NULL DEFAULT false,
  estado estado_acceso_enum NOT NULL DEFAULT 'pendiente',
  invitado_por UUID NOT NULL REFERENCES usuarios(id),
  fecha_invitacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_aceptacion TIMESTAMPTZ,
  fecha_expiracion TIMESTAMPTZ,
  es_qr_temporal BOOLEAN NOT NULL DEFAULT false,
  token_qr_hash VARCHAR(64),
  CONSTRAINT ver_galeria_solo_si_nivel_valido CHECK (
    NOT (ver_galeria = true AND nivel_permiso NOT IN ('solo_lectura_galeria'))
  )
);

CREATE INDEX idx_accesos_perfil ON accesos_compartidos_bebe (id_perfil_bebe);
CREATE INDEX idx_accesos_token_qr ON accesos_compartidos_bebe (token_qr_hash);

-- Auditoria Perfil
CREATE TYPE tipo_accion_enum AS ENUM (
  'edicion_dato', 'invitacion_creada', 'permiso_modificado',
  'acceso_revocado', 'qr_regenerado', 'qr_emergencia_generado'
);
CREATE TYPE nivel_importancia_enum AS ENUM ('normal', 'alto');

CREATE TABLE IF NOT EXISTS auditoria_perfil_bebe (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_perfil_bebe UUID NOT NULL REFERENCES perfiles_bebes(id),
  id_usuario_ejecutor UUID NOT NULL REFERENCES usuarios(id),
  tipo_accion tipo_accion_enum NOT NULL,
  campo_modificado VARCHAR(60),
  valor_anterior JSONB,
  valor_nuevo JSONB,
  nivel_importancia nivel_importancia_enum NOT NULL DEFAULT 'normal',
  fecha_hora_utc TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Percentiles OMS
CREATE TABLE IF NOT EXISTS oms_percentiles (
    id SERIAL PRIMARY KEY,
    mes_vida INTEGER NOT NULL,
    sexo VARCHAR(20) NOT NULL,
    peso_esperado_kg DECIMAL(5,2) NOT NULL,
    talla_esperada_cm DECIMAL(5,2) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mes_vida, sexo)
);

-- Registro de Vacunación de cada bebé
CREATE TABLE IF NOT EXISTS registro_vacunas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bebe_id UUID REFERENCES perfiles_bebes(id) ON DELETE CASCADE,
    vacuna_id INTEGER REFERENCES vacunas_pni(id) ON DELETE RESTRICT,
    fecha_aplicacion DATE,
    aplicada BOOLEAN DEFAULT FALSE,
    lugar_aplicacion VARCHAR(255),
    notas TEXT,
    UNIQUE(bebe_id, vacuna_id)
);

-- Registros de Crecimiento (Peso y Talla)
CREATE TABLE IF NOT EXISTS registros_crecimiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bebe_id UUID REFERENCES perfiles_bebes(id) ON DELETE CASCADE,
    fecha_registro DATE NOT NULL,
    peso_kg DECIMAL(5,2),
    talla_cm DECIMAL(5,2),
    notas TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Citas Médicas
CREATE TABLE IF NOT EXISTS citas_medicas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bebe_id UUID REFERENCES perfiles_bebes(id) ON DELETE CASCADE,
    especialidad VARCHAR(100),
    medico VARCHAR(150),
    lugar VARCHAR(150),
    fecha_cita TIMESTAMP WITH TIME ZONE NOT NULL,
    notas TEXT,
    estado VARCHAR(20) DEFAULT 'programada', -- programada, completada, cancelada
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recordatorio_7d_enviado BOOLEAN NOT NULL DEFAULT FALSE,
    recordatorio_1d_enviado BOOLEAN NOT NULL DEFAULT FALSE,
    recordatorio_2h_enviado BOOLEAN NOT NULL DEFAULT FALSE
);

-- ==========================================
-- TABLAS PARA PANEL DE ADMINISTRACIÓN
-- ==========================================

CREATE TABLE IF NOT EXISTS administradores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_completo VARCHAR(100) NOT NULL,
    correo_corporativo VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(50) NOT NULL, -- admin_general, editor_contenido, moderador_comunidad, soporte_cliente, auditor
    hash_contrasena VARCHAR(255) NOT NULL,
    requiere_2fa BOOLEAN DEFAULT TRUE,
    estado VARCHAR(20) DEFAULT 'activo', -- activo, inactivo, bloqueado
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    notas_internas TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tipos_prevision (
    codigo VARCHAR(50) PRIMARY KEY,
    nombre_visible VARCHAR(60) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- publico, privado, sin_prevision
    orden_visualizacion INTEGER UNIQUE NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo'
);

CREATE TABLE IF NOT EXISTS especialidades_medicas (
    codigo VARCHAR(50) PRIMARY KEY,
    nombre_visible VARCHAR(80) NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- atencion_general, especialidad, terapias
    descripcion_breve TEXT,
    orden_visualizacion INTEGER UNIQUE NOT NULL,
    estado VARCHAR(20) DEFAULT 'activa'
);

CREATE TABLE IF NOT EXISTS tipos_centro_atencion (
    codigo VARCHAR(50) PRIMARY KEY,
    nombre_visible VARCHAR(60) NOT NULL,
    icono VARCHAR(10) NOT NULL,
    requiere_convenio BOOLEAN NOT NULL DEFAULT FALSE,
    estado VARCHAR(20) DEFAULT 'activo'
);

CREATE TABLE IF NOT EXISTS medicos_directorio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_completo VARCHAR(100) NOT NULL,
    rut VARCHAR(20) UNIQUE NOT NULL,
    especialidad VARCHAR(50) REFERENCES especialidades_medicas(codigo) ON DELETE RESTRICT,
    id_tipo_centro VARCHAR(50) REFERENCES tipos_centro_atencion(codigo) ON DELETE RESTRICT,
    nombre_centro VARCHAR(150) NOT NULL,
    prevision_aceptada TEXT[] NOT NULL,
    telefono_contacto VARCHAR(20),
    estado_verificacion VARCHAR(20) DEFAULT 'pendiente', -- verificado, pendiente, rechazado
    calificacion_promedio DECIMAL(3,2),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articulos_educativos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    rango_edad_meses VARCHAR(20) NOT NULL,
    resumen TEXT NOT NULL,
    contenido_completo TEXT NOT NULL,
    fuente_citada VARCHAR(50) NOT NULL,
    imagen_portada VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'borrador', -- publicado, borrador, archivado
    fecha_publicacion TIMESTAMP WITH TIME ZONE,
    contador_lecturas INTEGER DEFAULT 0,
    calificacion_utilidad DECIMAL(3,2),
    likes INTEGER NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Likes de artículos educativos (comunidad_likes es solo para posts de foros)
CREATE TABLE IF NOT EXISTS comunidad_articulo_likes (
    articulo_id UUID NOT NULL REFERENCES articulos_educativos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (articulo_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS comunidad_foros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    autor_nombre VARCHAR(100) NOT NULL,
    respuestas INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    tiempo_publicacion VARCHAR(50) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bitacora_auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_admin UUID REFERENCES administradores(id) ON DELETE SET NULL,
    rol VARCHAR(50),
    accion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(50) NOT NULL,
    id_registro VARCHAR(255),
    valores_anteriores JSONB,
    valores_nuevos JSONB,
    fecha_hora_utc TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_origen VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS sesiones_admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_admin UUID REFERENCES administradores(id) ON DELETE CASCADE,
    token_jti VARCHAR(255) UNIQUE NOT NULL,
    ip_origen VARCHAR(50),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valido BOOLEAN DEFAULT TRUE
);
