const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_cXjoFgmi8aR7@ep-gentle-sound-ay9kiisy.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require'
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
