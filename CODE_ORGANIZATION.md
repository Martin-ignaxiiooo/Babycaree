# 📋 Babycaree - Guía de Organización de Código

**Versión**: 1.0  
**Fecha**: 14 de Septiembre, 2026  
**Responsable**: Claude (Organizador de Código)  
**Propietario del Proyecto**: César

---

## 📊 Estructura Actual del Proyecto

```
Babycaree/
├── backend/                          # Node.js + Express + PostgreSQL
│   ├── src/
│   │   ├── controllers/              # Lógica de endpoints (auth, home, salud, etc)
│   │   ├── services/                 # Servicios reutilizables (push, citas, etc)
│   │   ├── routes/                   # Definición de rutas por dominio
│   │   ├── middlewares/              # Auth, rate limit, upload, etc
│   │   ├── config/                   # Configuración (DB, mailer)
│   │   ├── db/                       # Migraciones SQL y schema
│   │   ├── microservices/            # Servicios especializados (OMS, vacunas, etc)
│   │   ├── utils/                    # Utilidades (cifrado, percentiles, contraseñas)
│   │   ├── scripts/                  # Scripts de testing, seeding, migrations
│   │   └── index.ts                  # Punto de entrada
│   ├── database/                     # Archivos de BD (configuración local)
│   ├── dist/                         # Build compilado (NO commitear)
│   ├── package.json
│   └── tsconfig.json
│
├── apps/web/                         # React + TypeScript + Vite (Vercel)
│   ├── src/
│   │   ├── components/               # Componentes React (common, admin, modales)
│   │   ├── pages/                    # Páginas principales (admin, etc)
│   │   ├── config/                   # Configuración de la app
│   │   ├── hooks/                    # Custom hooks
│   │   ├── assets/                   # Imágenes y recursos
│   │   ├── utils/                    # Funciones auxiliares
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── apps/mobile/                      # React Native / Expo (opcional)
│   ├── app/
│   ├── components/
│   ├── constants/
│   ├── assets/
│   └── scripts/
│
├── backend/src/db/migrations/        # 🔑 MIGRACIONES CENTRALIZADAS
│   ├── admin_2fa.sql
│   ├── invitacion_token.sql
│   ├── preferencias_recordatorios_citas.sql
│   ├── registro_diario_pecho_unificado.sql
│   └── ... (17 migraciones más)
│
├── tools/
│   └── codemods/                     # Transformaciones de código
│
├── README.md
├── CONTEXTO.md
└── package.json (monorepo)
```

---

## 🎯 Mi Rol: Organizador Principal de Código

### Responsabilidades Clave

#### 1️⃣ **Base de Datos (PostgreSQL - Render)**

**Ubicación**: `/backend/src/db/migrations/`

```
✅ Responsabilidades:
   • Crear nuevas migraciones con formato: NOMBRE_DESCRIPTIVO.sql
   • Usar IF NOT EXISTS en todas las operaciones
   • Validar sintaxis SQL
   • Documentar en MIGRATIONS_LOG.md
   • Coordinar ejecución con César en Render psql

⚠️ Estándares:
   • Nombres: snake_case, descriptivos
   • Ejemplo: preferencias_recordatorios_citas.sql
   • Siempre idempotentes (ejecutables múltiples veces)

📋 Flujo:
   1. Creo archivo: backend/src/db/migrations/XXX_descripcion.sql
   2. Valido con: cat archivo.sql | psql (localmente si es posible)
   3. Incluyo en commit
   4. César ejecuta: psql -U usuario -d babycaree < archivo.sql
```

**Migraciones Actuales** (17 archivos):
- `admin_2fa.sql` - Autenticación de 2 factores admin
- `invitacion_token.sql` - Sistema de invitaciones con token
- `preferencias_recordatorios_citas.sql` - Recordatorios de citas (5 ventanas)
- `registro_diario_pecho_unificado.sql` - Opción unificada de pecho
- `salud_materna.sql` - Datos de salud materna
- ... y 12 más

---

#### 2️⃣ **Backend (Node.js/Express - Render)**

**Ubicación**: `/backend/src/`

```
✅ Responsabilidades:
   • Mantener limpia la estructura de carpetas
   • Validar TypeScript: tsc --noEmit
   • Revisar endpoints nuevos
   • Coordinar despliegue en Render

📂 Estructura de carpetas:
   controllers/         → Lógica de endpoints
   services/            → Lógica reutilizable (citaReminders, push, etc)
   routes/              → Definición de rutas
   middlewares/         → Auth, rate limit, uploads
   config/              → DB, mailer
   db/                  → Migraciones y schema
   microservices/       → Servicios especializados:
      ├── oms/          → Percentiles OMS
      ├── vacunas/      → Gestión de vacunas
      ├── comunidad/    → Foros y comunidad
      ├── dashboard/    → Dashboard
      └── ...
   utils/               → Helpers (cifrado, contraseñas, percentiles)
   scripts/             → Testing, seeding, migrations

🔍 Controllers Actuales:
   • admin.controller.ts - Panel de administración
   • auth.controller.ts - Autenticación y OAuth
   • home.controller.ts - Dashboard principal
   • salud.controller.ts - Historial de salud
   • registro_diario.controller.ts - Registro diario (voice dictation)
   • perfil_bebe.controller.ts - Perfil del bebé
   • invitaciones.controller.ts - Sistema de invitaciones
   • examenes.controller.ts - Exámenes médicos
   • ... y más

✔️ Validación antes de push:
   npm run build
   tsc --noEmit
   Migraciones SQL validadas
   Cambios en .env.example documentados
```

---

#### 3️⃣ **Frontend (React/TypeScript - Vercel)**

**Ubicación**: `/apps/web/src/`

```
✅ Responsabilidades:
   • Mantener estructura de componentes
   • Validar build: vite build
   • Revisar responsividad (móvil/desktop)
   • Coordinar despliegue en Vercel

📂 Estructura de carpetas:
   components/          → Componentes React
      ├── common/       → Header, Nav, Layout, etc
      ├── modals/       → ModalDictadoUniversal, etc
      └── admin/        → Componentes de admin
   pages/               → Páginas principales (admin, etc)
   config/              → Configuración
   hooks/               → Custom hooks
   assets/              → Imágenes
   utils/               → Funciones auxiliares:
      ├── clasificarDictado.ts - Clasificación de voz
      ├── voz.ts - Web Speech API
      └── ...
   App.tsx
   main.tsx

⚠️ Estándares:
   • localStorage para preferencias device-specific (ej: voice confirmation)
   • DB para preferencias account-level
   • Componentes: PascalCase, archivos: camelCase
   • Styles: Tailwind + CSS custom properties
   • Sin "Volver al Dashboard" - usar navegación del menú

✔️ Validación antes de push:
   npm run build (vite build)
   tsc --noEmit
   Responsividad testeada (mobile/tablet/desktop)
   Temas oscuro/claro validados
```

---

#### 4️⃣ **Control de Versiones (GitHub)**

**Ubicación**: https://github.com/Martin-ignaxiiooo/Babycaree

```
✅ Responsabilidades:
   • Detectar conflictos: git fetch antes de todo
   • Commits claros y organizados
   • Staging local para revisión
   • Esperar PAT de César
   • Push limpio y trazable

📋 Flujo pre-push:

   1. FETCH (detectar cambios remotos)
      git fetch origin
      git status

   2. VALIDACIÓN
      ✓ tsc --noEmit
      ✓ vite build
      ✓ Migraciones SQL IF NOT EXISTS
      ✓ Documentación actualizada

   3. STAGING LOCAL
      git add .
      git status (revisar cambios)
      Solicito aprobación a César

   4. CONFIRMAR Y PUSHEAR
      Espero: OK + PAT
      git commit -m "Commit descriptivo"
      git push origin main (con PAT)

💬 Formato de commits:
   Ejemplo 1:
   [backend] Agregar endpoint de invitaciones con token
   - Crear migration: invitacion_token.sql
   - Implementar servicio de tokens
   - Agregar rutas en invitaciones.routes.ts

   Ejemplo 2:
   [frontend] Implementar dictado universal de voz
   - Crear ModalDictadoUniversal.tsx
   - Agregar clasificarDictado.ts
   - Integrar Web Speech API

   Ejemplo 3:
   [db] Migración para unificar opción de pecho
   - Agregar columna unified_pecho
   - Migrar datos existentes
   - Actualizar constraints

⚠️ Protecciones:
   • Fetch ANTES de cada push
   • PAT obligatorio para push
   • Commits descriptivos
   • No commitear: dist/, node_modules/, .env
```

---

## 📚 Documentación por Mantener

### En el Repo

| Archivo | Contenido | Actualizar cuando |
|---------|-----------|-------------------|
| `CODE_ORGANIZATION.md` | Esta guía | Cambios en estructura |
| `CONTEXTO.md` | Contexto del proyecto | Cambios significativos |
| `README.md` | Descripción general | Nueva feature importante |
| `backend/src/db/schema.sql` | Schema actual | Nueva tabla/columna |
| `backend/src/utils/CIFRADO.md` | Docs de cifrado | Cambios en cifrado |

### Por Crear

| Archivo | Contenido |
|---------|-----------|
| `docs/MIGRATIONS_LOG.md` | Registro de migraciones ejecutadas |
| `docs/API.md` | Endpoints, tipos, autenticación |
| `docs/DATABASE.md` | Schema, relaciones, tipos |
| `docs/ARCHITECTURE.md` | Diagrama de componentes |
| `docs/VOICE_SYSTEM.md` | Sistema de dictado universal |
| `docs/DEPLOYMENT.md` | Guía de despliegue |

---

## 🔧 Checklist de Deploy

### Antes de CADA Push

```
Base de Datos:
  ☐ Migraciones SQL con IF NOT EXISTS
  ☐ Sin DROP sin cuidado
  ☐ Nombres descriptivos

Backend:
  ☐ npm run build (sin errores)
  ☐ tsc --noEmit (sin errores)
  ☐ Controllers/services organizados
  ☐ Nuevos endpoints documentados

Frontend:
  ☐ vite build (sin errores críticos)
  ☐ tsc --noEmit (sin errores)
  ☐ Responsividad testeada
  ☐ Temas oscuro/claro validados

Git:
  ☐ git fetch origin (detectar conflictos)
  ☐ Commits descriptivos
  ☐ .gitignore respetado
  ☐ PAT obtenido de César

Documentación:
  ☐ APIs nuevas documentadas
  ☐ Cambios en DB reflejados
  ☐ README actualizado si es necesario
```

---

## 🚀 Flujo de Deploy Automático

```
1. Git Push (con PAT de César)
   ↓
2. GitHub webhook dispara
   ↓
3. Render Backend:
   - Detecta push en main
   - Ejecuta npm install
   - Ejecuta npm run build
   - Deploy automático
   ↓
4. Vercel Frontend:
   - Detecta push en main
   - Ejecuta npm install
   - Ejecuta vite build
   - Deploy automático
   ↓
5. Base de Datos:
   - Migraciones se documentan
   - César ejecuta en psql cuando sea necesario
```

---

## 🎨 Estándares de Código

### TypeScript
```typescript
// ✅ Correcto
interface Usuario {
  id: string;
  email: string;
  nombre: string;
}

const getUsuario = async (id: string): Promise<Usuario> => {
  // implementación
};

// ❌ Evitar
const getUser: any = (id) => {
  // sin tipos
};
```

### SQL
```sql
-- ✅ Correcto (idempotente)
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS nuevo_campo VARCHAR(255);

CREATE TABLE IF NOT EXISTS nueva_tabla (
  id SERIAL PRIMARY KEY,
  ...
);

-- ❌ Evitar
ALTER TABLE usuarios
ADD COLUMN nuevo_campo VARCHAR(255);

DROP TABLE tabla_vieja;
```

### React
```typescript
// ✅ Correcto
interface ComponenteProps {
  titulo: string;
  onClose: () => void;
}

const MiComponente: React.FC<ComponenteProps> = ({ titulo, onClose }) => {
  return (
    <div>
      <h1>{titulo}</h1>
      <button onClick={onClose}>Cerrar</button>
    </div>
  );
};

// ❌ Evitar
const MiComponente = ({ titulo, onClose }: any) => {
  return (
    <div>
      <h1>{titulo}</h1>
      ...
    </div>
  );
};
```

---

## 📞 Comunicación y Contacto

| Persona | Rol | Responsabilidades |
|---------|-----|-------------------|
| **César** | Propietario + Ejecutor de BD | Aprueba cambios, ejecuta migraciones en Render, da PAT |
| **Claude** | Organizador de Código | Estructura, validación, documentación, commits, push |

---

## 🔄 Próximos Pasos

1. ✅ **Documentar estructura actual** (Este archivo)
2. ⏳ **Crear docs/ con guías específicas**
3. ⏳ **Establecer pre-commit hooks** (opcional)
4. ⏳ **CI/CD en GitHub Actions** (opcional)
5. ⏳ **Revisar y refactor de estructura si es necesario**

---

**Versión del documento**: 1.0  
**Última actualización**: 14 de Septiembre, 2026  
**Próxima revisión**: Después del primer mes de seguimiento
