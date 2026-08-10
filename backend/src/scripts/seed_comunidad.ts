import { pool } from "../config/db";

async function seedComunidad() {
  try {
    console.log("Creando tablas si no existen...");
    await pool.query(`
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
    `);

    console.log("Truncando tablas...");
    await pool.query("TRUNCATE TABLE comunidad_foros CASCADE;");
    await pool.query("TRUNCATE TABLE articulos_educativos CASCADE;");

    console.log("Insertando foros...");
    const foros = [
      { titulo: "¿Cómo mejorar el sueño del bebé a los 3 meses?", autor_nombre: "María S.", respuestas: 24, likes: 15, tiempo_publicacion: "hace 2 horas", categoria: "Sueño" },
      { titulo: "Alimentación complementaria: ¿Por dónde empezar?", autor_nombre: "Carla P.", respuestas: 45, likes: 32, tiempo_publicacion: "hace 5 horas", categoria: "Nutrición" },
      { titulo: "Dudas sobre vacunas de los 6 meses", autor_nombre: "Dr. González", respuestas: 12, likes: 8, tiempo_publicacion: "hace 1 día", categoria: "Salud" },
      { titulo: "Juguetes Montessori para estimular el desarrollo", autor_nombre: "Ana L.", respuestas: 38, likes: 55, tiempo_publicacion: "hace 2 días", categoria: "Desarrollo" }
    ];

    for (const f of foros) {
      await pool.query(`
        INSERT INTO comunidad_foros (titulo, autor_nombre, respuestas, likes, tiempo_publicacion, categoria)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [f.titulo, f.autor_nombre, f.respuestas, f.likes, f.tiempo_publicacion, f.categoria]);
    }

    console.log("Insertando articulos...");
    const articulos = [
      { titulo: "Guía definitiva del sueño infantil", categoria: "Sueño", rango_edad: "0-6 meses", resumen: "Todo lo que necesitas saber sobre las regresiones de sueño y cómo establecer rutinas saludables.", cont: "Contenido...", fuente: "OMS", img: "🌙" },
      { titulo: "Introducción a la alimentación BLW", categoria: "Nutrición", rango_edad: "6-12 meses", resumen: "El método Baby Led Weaning explicado paso a paso para padres primerizos.", cont: "Contenido...", fuente: "Pediatría", img: "🥦" },
      { titulo: "Calendario de vacunas 2026", categoria: "Salud", rango_edad: "0-24 meses", resumen: "Mantente al día con las vacunas obligatorias y opcionales para proteger a tu bebé.", cont: "Contenido...", fuente: "Minsal", img: "💉" },
      { titulo: "Hitos del desarrollo motriz", categoria: "Desarrollo", rango_edad: "0-12 meses", resumen: "Desde sostener la cabeza hasta los primeros pasos: qué esperar mes a mes.", cont: "Contenido...", fuente: "Asociación de Pediatría", img: "👶" }
    ];

    for (const a of articulos) {
      // Usamos imagen_portada para guardar el emoji como MVP
      await pool.query(`
        INSERT INTO articulos_educativos (titulo, categoria, rango_edad_meses, resumen, contenido_completo, fuente_citada, imagen_portada, estado)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'publicado')
      `, [a.titulo, a.categoria, a.rango_edad, a.resumen, a.cont, a.fuente, a.img]);
    }

    console.log("Seed successful!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding comunidad:", err);
    process.exit(1);
  }
}

seedComunidad();
