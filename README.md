# Arquitectura del Proyecto - Iniciativa Baby

Este proyecto es un **monorepo** con capas bien separadas.

## Estructura
```
baby_care/
├── apps/
│   ├── web/                 <- FRONTEND web (React + Vite) — deploy en Vercel
│   │   └── src/
│   │       ├── pages/        <- Páginas de usuarios + Admin
│   │       └── components/   <- Componentes reutilizables
│   └── mobile/               <- FRONTEND móvil (Expo / React Native)
│
└── backend/                 <- BACKEND (Node + Express) — deploy en Render
    └── src/
        ├── controllers/      <- Lógica de negocio
        ├── routes/           <- Endpoints REST
        ├── middlewares/       <- Auth, rate-limit, uploads
        ├── config/            <- PostgreSQL, Redis, Mailer
        ├── db/                <- schema.sql
        └── microservices/    <- MICROSERVICIOS INTERNOS
            ├── directorio/    <- Médicos, centros, especialidades
            ├── vacunas/       <- PNI
            ├── oms/           <- Percentiles OMS
            ├── articulos/     <- Artículos educativos
            ├── bitacora/      <- Auditoría
            └── dashboard/     <- Stats admin

backend/scripts/              <- Seeds, herramientas de DB y tests manuales de API
                                  (ver backend/scripts/README.md)
tools/codemods/                <- Scripts únicos de refactor ya aplicados (referencia histórica)
```

## Para correr el proyecto
- Backend: `cd backend && npm run dev` (http://localhost:3000)
- Frontend web: `cd apps/web && npm run dev` (http://localhost:5173)
- Mobile: `cd apps/mobile && npm start`

