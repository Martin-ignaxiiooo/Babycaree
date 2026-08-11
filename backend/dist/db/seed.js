"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const bcrypt_1 = __importDefault(require("bcrypt"));
const vacunasIniciales = [
    { id: 1, nombre: "BCG", enfermedades: "Tuberculosis", meses: 0 },
    { id: 2, nombre: "Hepatitis B", enfermedades: "Hepatitis B", meses: 0 },
    {
        id: 3,
        nombre: "Hexavalente",
        enfermedades: "Hepatitis B, Difteria, Tétanos, Tos Convulsiva, Hib, Polio",
        meses: 2,
    },
    {
        id: 4,
        nombre: "Neumocócica Conjugada",
        enfermedades: "Enfermedades por Neumococo",
        meses: 2,
    },
    {
        id: 5,
        nombre: "Hexavalente",
        enfermedades: "Hepatitis B, Difteria, Tétanos, Tos Convulsiva, Hib, Polio",
        meses: 4,
    },
    {
        id: 6,
        nombre: "Neumocócica Conjugada",
        enfermedades: "Enfermedades por Neumococo",
        meses: 4,
    },
    {
        id: 7,
        nombre: "Hexavalente",
        enfermedades: "Hepatitis B, Difteria, Tétanos, Tos Convulsiva, Hib, Polio",
        meses: 6,
    },
    {
        id: 8,
        nombre: "Tres Vírica",
        enfermedades: "Sarampión, Rubéola, Parotiditis",
        meses: 12,
    },
    {
        id: 9,
        nombre: "Meningocócica Recombinante",
        enfermedades: "Enfermedades por Meningococo B",
        meses: 12,
    },
    {
        id: 10,
        nombre: "Neumocócica Conjugada",
        enfermedades: "Enfermedades por Neumococo",
        meses: 12,
    },
    {
        id: 11,
        nombre: "Meningocócica Conjugada",
        enfermedades: "Enfermedades por Meningococo A, C, W, Y",
        meses: 12,
    },
    {
        id: 12,
        nombre: "Hexavalente",
        enfermedades: "Hepatitis B, Difteria, Tétanos, Tos Convulsiva, Hib, Polio",
        meses: 18,
    },
    { id: 13, nombre: "Hepatitis A", enfermedades: "Hepatitis A", meses: 18 },
    { id: 14, nombre: "Varicela", enfermedades: "Varicela", meses: 18 },
    {
        id: 15,
        nombre: "Fiebre Amarilla",
        enfermedades: "Fiebre Amarilla (Solo Isla de Pascua)",
        meses: 18,
    },
    {
        id: 16,
        nombre: "Tres Vírica",
        enfermedades: "Sarampión, Rubéola, Parotiditis",
        meses: 36,
    },
];
const seed = async () => {
    try {
        console.log("Iniciando proceso de seeding...");
        // Crear tablas primero si no existen
        const schemaSql = `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS usuarios (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          nombre VARCHAR(100) NOT NULL,
          apellidos VARCHAR(100) NOT NULL,
          rol VARCHAR(50) DEFAULT 'user',
          consentimiento_ley_19628 BOOLEAN DEFAULT FALSE,
          consentimiento_ley_21719 BOOLEAN DEFAULT FALSE,
          fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          ultima_conexion TIMESTAMP WITH TIME ZONE
      );

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

      CREATE TABLE IF NOT EXISTS vacunas_pni (
          id INTEGER PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL,
          enfermedades_previene TEXT,
          meses_edad_recomendada INTEGER NOT NULL
      );

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
    `;
        await db_1.pool.query(schemaSql);
        console.log("Tablas verificadas/creadas.");
        // Limpiar tablas para insertar de cero
        await db_1.pool.query("TRUNCATE TABLE usuarios, perfiles_bebes, vacunas_pni, registro_vacunas CASCADE");
        console.log("Tablas limpiadas.");
        // Insertar vacunas
        for (const v of vacunasIniciales) {
            await db_1.pool.query("INSERT INTO vacunas_pni (id, nombre, enfermedades_previene, meses_edad_recomendada) VALUES ($1, $2, $3, $4)", [v.id, v.nombre, v.enfermedades, v.meses]);
        }
        // Crear un usuario de prueba
        const passwordHash = await bcrypt_1.default.hash("123456", 10);
        const userRes = await db_1.pool.query("INSERT INTO usuarios (email, password_hash, nombre, apellidos) VALUES ($1, $2, $3, $4) RETURNING id", ["mama@test.com", passwordHash, "Laura", "González"]);
        const userId = userRes.rows[0].id;
        // Crear un bebé de prueba que tenga 3 meses de edad aprox
        const fechaNacimiento = new Date();
        fechaNacimiento.setMonth(fechaNacimiento.getMonth() - 3);
        const isoDate = fechaNacimiento.toISOString().split("T")[0];
        // Para forzar un UUID específico para que la URL frontend sea fácil de probar
        const bebeId = "11111111-1111-1111-1111-111111111111";
        await db_1.pool.query("INSERT INTO perfiles_bebes (id, usuario_id, nombre, fecha_nacimiento, sexo, es_prematuro) VALUES ($1, $2, $3, $4, $5, $6)", [bebeId, userId, "Mateo", isoDate, "M", false]);
        // Asignar vacunas aplicadas (las de 0 y 2 meses)
        const vacunasAplicadas = [1, 2, 3, 4]; // BCG, Hep B, Hexavalente (2m), Neumo (2m)
        for (const vacId of vacunasAplicadas) {
            await db_1.pool.query("INSERT INTO registro_vacunas (bebe_id, vacuna_id, aplicada, fecha_aplicacion) VALUES ($1, $2, $3, $4)", [bebeId, vacId, true, new Date().toISOString().split("T")[0]]);
        }
        console.log("¡Seeding completado con éxito!");
        console.log(`URL de prueba sugerida: http://localhost:3002/?bebe=${bebeId}`);
    }
    catch (error) {
        console.error("Error durante el seeding:", error);
    }
    finally {
        db_1.pool.end();
    }
};
seed();
