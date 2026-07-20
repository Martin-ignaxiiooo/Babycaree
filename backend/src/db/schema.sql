-- db/schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Usuarios (Adultos/Cuidadores)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    rol VARCHAR(50) DEFAULT 'user', -- user, admin, specialist
    consentimiento_ley_19628 BOOLEAN DEFAULT FALSE,
    consentimiento_ley_21719 BOOLEAN DEFAULT FALSE,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ultima_conexion TIMESTAMP WITH TIME ZONE
);

-- Tabla de Perfiles de Bebés
CREATE TABLE IF NOT EXISTS perfiles_bebes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo VARCHAR(20),
    es_prematuro BOOLEAN DEFAULT FALSE,
    semanas_gestacion INTEGER CHECK (semanas_gestacion >= 20 AND semanas_gestacion <= 42),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Calendario de Vacunas PNI
CREATE TABLE IF NOT EXISTS vacunas_pni (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    enfermedades_previene TEXT,
    meses_edad_recomendada INTEGER NOT NULL -- 0 para RN, 2 para 2 meses, etc.
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
