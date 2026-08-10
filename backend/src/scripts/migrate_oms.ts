import { query } from "../config/db";

async function up() {
  try {
    console.log("Creating oms_percentiles table...");
    await query(`
      CREATE TABLE IF NOT EXISTS oms_percentiles (
        id SERIAL PRIMARY KEY,
        mes_vida INTEGER NOT NULL,
        sexo VARCHAR(20) NOT NULL, -- 'Masculino', 'Femenino', 'Unisex'
        peso_esperado_kg DECIMAL(5,2) NOT NULL,
        talla_esperada_cm DECIMAL(5,2) NOT NULL,
        fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(mes_vida, sexo)
      );
    `);
    
    // Seed some initial data to avoid empty graph at first
    console.log("Seeding initial OMS data...");
    
    // We insert dummy average values (Unisex) up to 6 months
    const values = [
      [0, 'Unisex', 3.3, 50.0],
      [1, 'Unisex', 4.5, 54.0],
      [2, 'Unisex', 5.6, 58.0],
      [3, 'Unisex', 6.4, 61.0],
      [4, 'Unisex', 7.0, 63.5],
      [5, 'Unisex', 7.5, 66.0],
      [6, 'Unisex', 7.9, 67.5]
    ];
    
    for (const v of values) {
      await query(`
        INSERT INTO oms_percentiles (mes_vida, sexo, peso_esperado_kg, talla_esperada_cm) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (mes_vida, sexo) DO NOTHING
      `, v);
    }
    
    console.log("Migration successful!");
    process.exit(0);
  } catch (e) {
    console.error("Migration failed:", e);
    process.exit(1);
  }
}

up();
