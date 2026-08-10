import { query } from "../config/db";
query('SELECT titulo, likes, respuestas FROM comunidad_foros').then(r => console.log(r.rows)).catch(e => console.log(e)).finally(() => process.exit(0));
