import { pool } from "../config/db";

async function seedDirectorio() {
  try {
    console.log("Seeding Directorio...");

    // 1. Insert Especialidades Medicas
    await pool.query(`
      INSERT INTO especialidades_medicas (codigo, nombre_visible, categoria, descripcion_breve, orden_visualizacion, estado)
      VALUES 
        ('PED', 'Pediatría General', 'atencion_general', 'Atención integral del niño', 1, 'activa'),
        ('NEO', 'Neonatología', 'especialidad', 'Especialistas en recién nacidos', 2, 'activa'),
        ('NUT', 'Nutrición Pediátrica', 'especialidad', 'Especialistas en alimentación', 3, 'activa'),
        ('NEU', 'Neurología Infantil', 'especialidad', 'Desarrollo neurológico', 4, 'activa')
      ON CONFLICT (codigo) DO NOTHING;
    `);

    // 2. Insert Tipos de Centro de Atencion
    await pool.query(`
      INSERT INTO tipos_centro_atencion (codigo, nombre_visible, icono, requiere_convenio, estado)
      VALUES 
        ('CLI', 'Clínica Privada', '🏥', false, 'activo'),
        ('HOS', 'Hospital Público', '🏢', false, 'activo'),
        ('CON', 'Consulta Particular', '⚕️', false, 'activo')
      ON CONFLICT (codigo) DO NOTHING;
    `);

    // 3. Clear existing medicos for a fresh start (optional, but good for this seed)
    await pool.query(`TRUNCATE TABLE medicos_directorio CASCADE;`);

    // 4. Insert 10 Medicos
    const medicos = [
      { nombre: "Dra. Ana López", rut: "12345678-9", esp: "PED", centro: "CLI", nomCentro: "Clínica Alemana", prev: ["Consalud", "Banmédica", "Colmena"], tel: "+56912345671", calif: 4.8 },
      { nombre: "Dr. Carlos Valenzuela", rut: "13456789-0", esp: "NEO", centro: "HOS", nomCentro: "Hospital San José", prev: ["Fonasa", "Banmédica"], tel: "+56912345672", calif: 4.9 },
      { nombre: "Dra. Sofía Rojas", rut: "14567890-1", esp: "NUT", centro: "CON", nomCentro: "Centro Médico SaludNiño", prev: ["Vida Tres", "CruzBlanca", "Particular"], tel: "+56912345673", calif: 4.7 },
      { nombre: "Dr. Miguel Fernández", rut: "15678901-2", esp: "PED", centro: "CLI", nomCentro: "Clínica Santa María", prev: ["Consalud", "Banmédica", "Fonasa"], tel: "+56912345674", calif: 4.5 },
      { nombre: "Dra. Laura Gómez", rut: "16789012-3", esp: "NEU", centro: "CLI", nomCentro: "Clínica Las Condes", prev: ["Colmena", "CruzBlanca", "Banmédica"], tel: "+56912345675", calif: 5.0 },
      { nombre: "Dr. Roberto Silva", rut: "17890123-4", esp: "PED", centro: "HOS", nomCentro: "Hospital Calvo Mackenna", prev: ["Fonasa"], tel: "+56912345676", calif: 4.6 },
      { nombre: "Dra. Carmen Pizarro", rut: "18901234-5", esp: "NEO", centro: "CLI", nomCentro: "Clínica Indisa", prev: ["Consalud", "Vida Tres", "Nueva Masvida"], tel: "+56912345677", calif: 4.8 },
      { nombre: "Dr. Fernando Soto", rut: "19012345-6", esp: "NUT", centro: "HOS", nomCentro: "Hospital Roberto del Río", prev: ["Fonasa"], tel: "+56912345678", calif: 4.9 },
      { nombre: "Dra. Patricia Muñoz", rut: "20123456-7", esp: "PED", centro: "CON", nomCentro: "IntegraMédica", prev: ["Fonasa", "Consalud", "Banmédica"], tel: "+56912345679", calif: 4.4 },
      { nombre: "Dr. Andrés Vargas", rut: "21234567-8", esp: "NEU", centro: "CON", nomCentro: "RedSalud", prev: ["Fonasa", "Colmena", "CruzBlanca"], tel: "+56912345670", calif: 4.7 }
    ];

    for (const m of medicos) {
      await pool.query(`
        INSERT INTO medicos_directorio (nombre_completo, rut, especialidad, id_tipo_centro, nombre_centro, prevision_aceptada, telefono_contacto, estado_verificacion, calificacion_promedio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'verificado', $8)
      `, [m.nombre, m.rut, m.esp, m.centro, m.nomCentro, m.prev, m.tel, m.calif]);
    }

    console.log("Seed successful! 10 Medicos inserted.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding directorio:", error);
    process.exit(1);
  }
}

seedDirectorio();
