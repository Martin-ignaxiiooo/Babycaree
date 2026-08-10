# Arquitectura del Proyecto - Iniciativa Baby

Este proyecto es un **monorepo** con 3 capas bien separadas.

## Estructura
\\\
baby_care/
├── apps/web/             <- FRONTEND (React + Vite)
│   └── src/
│       ├── pages/        <- Páginas de usuarios + Admin
│       └── components/   <- Componentes reutilizables
│
└── backend/              <- BACKEND (Node + Express)
    └── src/
        ├── controllers/  <- Lógica de negocio
        ├── routes/       <- Endpoints REST
        ├── middlewares/  <- Auth, rate-limit, uploads
        ├── config/       <- PostgreSQL, Redis, Mailer
        ├── db/           <- schema.sql
        ├── microservices/  <- MICROSERVICIOS INTERNOS
        │   ├── directorio/ <- Médicos, centros, especialidades
        │   ├── vacunas/    <- PNI
        │   ├── oms/        <- Percentiles OMS
        │   ├── articulos/  <- Artículos educativos
        │   ├── bitacora/   <- Auditoría
        │   └── dashboard/  <- Stats admin
        └── scripts/      <- Seeds y migraciones (solo dev)
\\\

## Para correr el proyecto
Backend: cd backend && npm run dev  (http://localhost:3000)
Frontend: cd apps/web && npm run dev  (http://localhost:5173)

