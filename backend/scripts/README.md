# Scripts del backend

Todos los scripts de administración/debug del proyecto viven acá, organizados por propósito. **No agregar scripts sueltos en la raíz del repo.**

## Estructura

- **`db-tools/`** — Consultas y mutaciones puntuales contra la base de datos (usan `DATABASE_URL` desde `.env`, nunca credenciales hardcodeadas). Ejemplos: revisar usuarios, borrar códigos de recuperación, agregar valores a un enum.
- **`api-tests/`** — Scripts manuales para probar la API en vivo (envío de correo, forgot-password, logs). Usan variables de entorno para credenciales/URLs, no valores hardcodeados.
- **`seeds/`** — Scripts de siembra de datos y setup inicial (`.ts`, corridos con `ts-node`). Pensados para correr una vez por entorno (dev, staging).

## Cómo correr un script

Todos requieren un `.env` local con `DATABASE_URL` (y `SMTP_USER`/`SMTP_PASS` para los de `api-tests` que envían correo):

```bash
cd backend
node scripts/db-tools/check_data.js
npx ts-node scripts/seeds/seed_admin.ts
```

## Reglas

1. **Nunca hardcodear credenciales.** Siempre `process.env.X`, con un chequeo que falle temprano si falta.
2. Si un script es realmente temporal (para debug de una sola vez), no lo commitees: bórralo cuando termines, o agrégalo al `.gitignore`.
3. Si un script se vuelve reutilizable, que quede bien nombrado y en la carpeta que corresponda según esta tabla.
