import { pool } from "../config/db";

const previsiones = [
  { codigo: 'PREV-FON-A', nombre: 'FONASA A', tipo: 'Público', orden: 1 },
  { codigo: 'PREV-FON-B', nombre: 'FONASA B', tipo: 'Público', orden: 2 },
  { codigo: 'PREV-FON-C', nombre: 'FONASA C', tipo: 'Público', orden: 3 },
  { codigo: 'PREV-FON-D', nombre: 'FONASA D', tipo: 'Público', orden: 4 },
  { codigo: 'PREV-ISA-BAN', nombre: 'ISAPRE Banmédica', tipo: 'Privado', orden: 5 },
  { codigo: 'PREV-ISA-COL', nombre: 'ISAPRE Colmena', tipo: 'Privado', orden: 6 },
  { codigo: 'PREV-ISA-CON', nombre: 'ISAPRE Consalud', tipo: 'Privado', orden: 7 },
  { codigo: 'PREV-ISA-CRU', nombre: 'ISAPRE CruzBlanca', tipo: 'Privado', orden: 8 },
  { codigo: 'PREV-ISA-NMA', nombre: 'ISAPRE Nueva Masvida', tipo: 'Privado', orden: 9 },
  { codigo: 'PREV-ISA-VID', nombre: 'ISAPRE Vida Tres', tipo: 'Privado', orden: 10 },
  { codigo: 'PREV-ISA-ESE', nombre: 'ISAPRE Esencial', tipo: 'Privado', orden: 11 },
  { codigo: 'PREV-FFAA', nombre: 'Fuerzas Armadas (CAPREDENA/DIPRECA)', tipo: 'FFAA', orden: 12 },
  { codigo: 'PREV-PART', nombre: 'Particular (Sin Previsión)', tipo: 'Particular', orden: 13 },
];

const migrations = [
  { old: 'FONASA A (Indigente)', new: 'PREV-FON-A' },
  { old: 'FONASA B', new: 'PREV-FON-B' },
  { old: 'FONASA C', new: 'PREV-FON-C' },
  { old: 'FONASA D', new: 'PREV-FON-D' },
  { old: 'ISAPRE', new: 'PREV-ISA-CON' },
  { old: 'FFAA', new: 'PREV-FFAA' }
];

async function seedPrevisiones() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log("Iniciando inyección de previsiones...");

    // 1. Inyectar previsiones
    for (const p of previsiones) {
      await client.query(
        `INSERT INTO tipos_prevision (codigo, nombre_visible, tipo, orden_visualizacion)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (codigo) DO UPDATE 
         SET nombre_visible = EXCLUDED.nombre_visible, 
             tipo = EXCLUDED.tipo, 
             orden_visualizacion = EXCLUDED.orden_visualizacion`,
        [p.codigo, p.nombre, p.tipo, p.orden]
      );
    }
    console.log("✅ Previsiones maestras insertadas correctamente.");

    // 2. Migrar perfiles_bebes
    for (const m of migrations) {
      const result = await client.query(
        `UPDATE perfiles_bebes SET prevision_salud = $1 WHERE prevision_salud = $2`,
        [m.new, m.old]
      );
      if (result.rowCount && result.rowCount > 0) {
        console.log(`✅ Migrados ${result.rowCount} bebés de '${m.old}' a '${m.new}'`);
      }
    }

    await client.query('COMMIT');
    console.log("Proceso finalizado con éxito.");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error durante el seedeo:", error);
  } finally {
    client.release();
    process.exit(0);
  }
}

seedPrevisiones();
