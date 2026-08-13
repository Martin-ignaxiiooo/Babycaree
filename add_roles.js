require('dotenv').config();
const { Client } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('ERROR: falta la variable de entorno DATABASE_URL (definila en un archivo .env local, nunca hardcodeada).');
  process.exit(1);
}


async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    
    // Add roles one by one and catch errors if they already exist
    try {
      await client.query("ALTER TYPE nivel_permiso_enum ADD VALUE 'papa'");
      console.log("Added 'papa'");
    } catch (e) {
      console.log(e.message);
    }
    
    try {
      await client.query("ALTER TYPE nivel_permiso_enum ADD VALUE 'abuela'");
      console.log("Added 'abuela'");
    } catch (e) {
      console.log(e.message);
    }

  } catch (error) {
    console.error("Migration Error:", error);
  } finally {
    await client.end();
  }
}

run();
