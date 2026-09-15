# 🔄 Estándares de Git y Commits - Babycaree

**Versión**: 1.0  
**Vigente desde**: 14 de Septiembre, 2026  
**Responsable**: Claude (Organizador de Código)

---

## 📋 Flujo de Trabajo

### Paso 1: FETCH (Detectar cambios remotos)
```bash
git fetch origin
git status
```

**Propósito**: Detectar conflictos antes de hacer cambios locales.  
**Obligatorio**: SÍ, antes de cada sesión de desarrollo.

---

### Paso 2: DESARROLLO LOCAL

Trabajar en cambios localmente sin preocupación.

```bash
# Crear cambios...
# Editar archivos...
# Testing local...
```

---

### Paso 3: VALIDACIÓN PRE-COMMIT

Antes de staged, validar que el código cumpla estándares:

#### Backend
```bash
cd backend
npm run build          # Compilar TypeScript
tsc --noEmit          # Verificar tipos
```

#### Frontend
```bash
cd apps/web
vite build            # Compilar build
tsc --noEmit          # Verificar tipos
```

#### Base de Datos
```bash
# Verificar sintaxis SQL de migraciones
# Confirmar IF NOT EXISTS en all statements
# Validar que sean idempotentes
```

---

### Paso 4: STAGING LOCAL

```bash
# Ver cambios
git status

# Agregar archivos específicos (no todo de una)
git add backend/src/controllers/nuevo.ts
git add apps/web/src/components/Nuevo.tsx
git add backend/src/db/migrations/nueva.sql

# Verificar staging
git status
```

**Propósito**: Revisar exactamente qué se va a commitear.

---

### Paso 5: SOLICITUD DE APROBACIÓN

Mostrarle a César:

```
✓ Cambios listos para revisar:

**Backend**:
  - nuevo controlador en controllers/
  - 2 nuevos endpoints

**Frontend**:
  - Nuevo modal ModalDictado.tsx
  - Integración con API

**Database**:
  - Nueva migración: migracion.sql
  - Agrega columna en tabla usuarios

**Validaciones**:
  ✓ tsc --noEmit (sin errores)
  ✓ vite build (sin warnings críticos)
  ✓ SQL con IF NOT EXISTS

Esperando aprobación + PAT...
```

---

### Paso 6: COMMIT

Una vez aprobado y con PAT:

```bash
git commit -m "[backend] Agregar endpoint de invitaciones

- Crear nuevo controlador invitaciones.controller.ts
- Agregar rutas en invitaciones.routes.ts
- Implementar servicio de tokens
- Agregar migración invitacion_token.sql

Cierra: #123 (si hay issue)"
```

**Formato de commit**:
```
[área] Título corto (50 caracteres max)

Descripción detallada (si es necesario)
- Punto 1
- Punto 2
- Punto 3

Cierra: #issue_number (si aplica)
```

**Áreas válidas**:
- `[backend]` - Cambios en Node.js/Express
- `[frontend]` - Cambios en React/Vercel
- `[db]` - Migraciones SQL
- `[docs]` - Documentación
- `[devops]` - CI/CD, configuración, deploy
- `[chore]` - Actualizaciones de dependencias, etc

---

### Paso 7: PUSH

```bash
git push origin main
```

**Requisito**: Debes tener el PAT de César.

---

## 📝 Ejemplos de Commits

### Ejemplo 1: Feature completa (backend + db)
```
[backend] Implementar sistema de invitaciones

- Crear migration: invitacion_token.sql
  - Nueva tabla invitacion_token
  - Campos: token, email, expires_at
- Crear controlador invitaciones.controller.ts
  - GET /invitations/:token
  - POST /invitations/validate
- Agregar rutas en invitaciones.routes.ts
- Actualizar middleware de auth para bypass token
- Agregar tests en test_api.ts

Cierra: #45
```

### Ejemplo 2: Feature frontend
```
[frontend] Crear modal de dictado universal

- Crear ModalDictadoUniversal.tsx
  - Interfaz limpia con botón grabar
  - Clasificación automática por intent
  - Confirmación de datos extraídos
- Crear utils/clasificarDictado.ts
  - Lógica de clasificación (pañal, alimentación, sueño, cita, medidas)
  - Extracción de datos estructurados
- Integrar Web Speech API en utils/voz.ts
  - Síntesis de confirmación
  - Manejo de errores
- Agregar modal a RegistroDiario.tsx

Cierra: #46
```

### Ejemplo 3: Solo base de datos
```
[db] Agregar preferencias de recordatorios de citas

- Nueva tabla: preferencia_recordatorio_cita
- Campos: usuario_id, hora_recordatorio, activo
- Agregar constrain FK a usuarios
- Insertar valores por defecto (5 ventanas)

Cierra: #47
```

### Ejemplo 4: Bugfix
```
[frontend] Corregir mapeo de horas en dictado

- Bug: "a las 5" se mapeaba a 5 AM en lugar de 5 PM
- Fix: Horas 1-7 sin AM/PM son treated como PM
- Actualizar extraerHora() en clasificarDictado.ts
- Agregar casos de test

Cierra: #bug-123
```

### Ejemplo 5: Documentación
```
[docs] Agregar guía de sistema de voz

- Crear VOICE_SYSTEM.md con:
  - Explicación del flujo
  - Intents soportados
  - Ejemplos de inputs/outputs
  - Parámetros configurables
- Actualizar README con referencias

No funcionalidad, solo documentación
```

---

## ✅ Checklist Pre-Push

Antes de cada `git push`, verificar:

### Code Quality
- [ ] `tsc --noEmit` sin errores en backend
- [ ] `tsc --noEmit` sin errores en frontend
- [ ] `vite build` sin warnings críticos
- [ ] `npm run build` en backend sin errores
- [ ] No hay `console.log()` de debug
- [ ] No hay `// TODO` sin resolver

### Git
- [ ] `git fetch origin` ejecutado
- [ ] `git status` muestra solo cambios deseados
- [ ] Commits son descriptivos
- [ ] Mensaje de commit sigue el formato
- [ ] `.gitignore` es respetado (sin .env, dist/, node_modules/)

### Base de Datos (si hay migraciones)
- [ ] Archivo SQL tiene nombre descriptivo
- [ ] Usa `IF NOT EXISTS` o `IF NOT NULL`
- [ ] Es idempotente (puede ejecutarse N veces)
- [ ] Documentado en MIGRATIONS_LOG.md
- [ ] Validado por César

### Documentación
- [ ] README actualizado si hay cambios mayores
- [ ] APIs nuevas documentadas
- [ ] MIGRATIONS_LOG.md actualizado
- [ ] CODE_ORGANIZATION.md actualizado si cambió estructura

### Seguridad
- [ ] No hay credenciales en commits
- [ ] No hay API keys hardcodeadas
- [ ] `.env.example` actualizado con nuevas vars
- [ ] Variables sensibles documentadas

---

## 🚫 Qué NO Hacer

```bash
# ❌ NO: Commitear todo de una
git add .
git commit -m "updated"
git push

# ✅ SÍ: Commitear lógicamente
git add backend/src/controllers/nuevo.ts
git commit -m "[backend] Nuevo controlador"
git add apps/web/src/components/Nuevo.tsx
git commit -m "[frontend] Nuevo componente"

# ❌ NO: Mensajes de commit genéricos
"updated"
"bug fix"
"changes"

# ✅ SÍ: Mensajes descriptivos
"[backend] Agregar endpoint POST /users/:id/profile"
"[frontend] Corregir responsive en móvil"
"[db] Migración para agregar columna active"

# ❌ NO: Push sin fetch
git push sin hacer git fetch antes

# ✅ SÍ: Fetch primero
git fetch origin
git status  # verificar conflictos
git push

# ❌ NO: Commitear node_modules, dist/, .env
git add node_modules/
git add dist/
git add .env

# ✅ SÍ: Usar .gitignore
.gitignore debe tener:
  node_modules/
  dist/
  .env
  .env.local
  *.log
```

---

## 📊 Historial de Commits Esperado

```
commit a1b2c3d
[frontend] Crear ModalDictadoUniversal
- Componente de modal
- Integración con clasificador
- Web Speech API

commit d4e5f6g
[backend] Agregar rutas de dictado
- Nuevos endpoints
- Validación de datos

commit h7i8j9k
[db] Migración para preferencias de voz
- Nueva tabla
- Valores por defecto

commit l0m1n2o
[docs] Actualizar README y VOICE_SYSTEM.md
- Documentación
```

---

## 🔐 Seguridad de PAT

**Importante**: El PAT es personal de César y solo se usa para push.

```bash
# Cuando César proporciona PAT:
# 1. Se usa SOLO para git push
# 2. NO se guarda en archivos
# 3. NO se comparte o comitea
# 4. Se regenera después de cada uso si es possible
# 5. NO se usa para clonar (usar HTTPS normal)

# Uso correcto:
git push https://github.com/Martin-ignaxiiooo/Babycaree.git \
  --force-with-lease \
  -u origin main

# Con PAT:
git push https://PAT_AQUI@github.com/Martin-ignaxiiooo/Babycaree.git \
  -u origin main

# O configurar como credential helper:
git credential approve
host=github.com
protocol=https
username=PAT
password=VALOR_DEL_PAT
```

---

## 🚀 Deploy Automático Post-Push

Después de un push exitoso a `main`:

1. **GitHub** recibe el push
2. **Render** (backend) → webhook → build y deploy automático (5-10 min)
3. **Vercel** (frontend) → webhook → build y deploy automático (3-5 min)
4. **Database** → Migraciones se documentan, César ejecuta cuando sea necesario

**Cómo validar**:
- Backend: https://babycare-backend-msyq.onrender.com (health check)
- Frontend: https://babycaree-web.vercel.app (abrir en navegador)

---

## 📞 Contacto y Escalaciones

Si hay problema durante push:

1. **Conflicto de merge**:
   - Resolver localmente con `git merge origin/main`
   - Actualizar MIGRATIONS_LOG.md si hay conflicto en migraciones
   - Commit: `[chore] Resolver conflictos de merge`

2. **Deploy fallido en Render/Vercel**:
   - Revisar logs en dashboard
   - Validar nuevamente `tsc --noEmit` y `vite build`
   - Hacer revert si es necesario: `git revert COMMIT_HASH`

3. **Problema en base de datos**:
   - Contactar a César
   - Checar MIGRATIONS_LOG.md
   - Posible rollback SQL si es necesario

---

**Versión**: 1.0  
**Última actualización**: 14 de Septiembre, 2026  
**Próxima revisión**: Después del primer mes
