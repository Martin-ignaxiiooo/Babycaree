# 📝 Registro de Migraciones - Babycaree

**Última actualización**: 14 de Septiembre, 2026  
**Base de datos**: PostgreSQL (Render)  
**Ubicación archivos**: `/backend/src/db/migrations/`

---

## ✅ Migraciones Ejecutadas

| # | Archivo | Descripción | Fecha | Estado | César |
|---|---------|-------------|-------|--------|-------|
| 1 | `admin_2fa.sql` | Autenticación 2FA para admin | ? | ✅ | Ejecutada |
| 2 | `admin_2fa_por_correo.sql` | 2FA por correo para admin | ? | ✅ | Ejecutada |
| 3 | `admin_bloqueo_intentos.sql` | Bloqueo por intentos fallidos | ? | ✅ | Ejecutada |
| 4 | `citas_tipo_y_seguimiento.sql` | Tipos de citas y seguimiento | ? | ✅ | Ejecutada |
| 5 | `comunidad_respuestas_es_admin.sql` | Flag admin en respuestas comunidad | ? | ✅ | Ejecutada |
| 6 | `consulta_resultado_y_examenes.sql` | Consultas, resultados, exámenes | ? | ✅ | Ejecutada |
| 7 | `embarazo_hitos_mes.sql` | Hitos del embarazo por mes | ? | ✅ | Ejecutada |
| 8 | `examenes_orden_foto.sql` | Orden de foto en exámenes | ? | ✅ | Ejecutada |
| 9 | `invitacion_token.sql` | Sistema de invitaciones con token | ? | ✅ | Ejecutada |
| 10 | `password_definida.sql` | Flag password_definida en usuarios | ? | ✅ | Ejecutada |
| 11 | `preferencias_recordatorios_citas.sql` | 5 ventanas de recordatorios | ? | ✅ | Ejecutada |
| 12 | `registro_diario_pecho_unificado.sql` | Opción unificada de pecho | ? | ✅ | Ejecutada |
| 13 | `registros_diarios.sql` | Tabla de registros diarios | ? | ✅ | Ejecutada |
| 14 | `salud_materna.sql` | Datos de salud materna | ? | ✅ | Ejecutada |
| 15 | `suscripciones_push.sql` | Suscripciones a push notifications | ? | ✅ | Ejecutada |
| 16 | `vacunas_fecha_con_hora.sql` | Vacunas con fecha y hora | ? | ✅ | Ejecutada |
| 17 | `usuario_foto_perfil.sql` | Foto de perfil del usuario (mamá/papá) | 2026-09-14 | ⏳ | **Pendiente** |

**Total migraciones**: 17 (+ 1 en schema.sql base) — 16 ejecutadas, 1 pendiente

---

## 📋 Detalle de Migraciones

### 1. admin_2fa.sql
```sql
-- Autenticación 2FA para adminstradores
-- Campos: 2fa_enabled, 2fa_secret
```

### 2. admin_2fa_por_correo.sql
```sql
-- 2FA usando código por correo
-- Campos: email_2fa_code, email_2fa_expiry
```

### 3. admin_bloqueo_intentos.sql
```sql
-- Bloqueo de cuenta por intentos fallidos
-- Campos: login_attempts, locked_until
```

### 4. citas_tipo_y_seguimiento.sql
```sql
-- Tipos de citas médicas y seguimiento
-- Nuevas tablas: cita_tipo, cita_seguimiento
```

### 5. comunidad_respuestas_es_admin.sql
```sql
-- Flag para marcar respuestas de admin en foro
-- Campo: es_admin (boolean)
```

### 6. consulta_resultado_y_examenes.sql
```sql
-- Consultas médicas, resultados y exámenes
-- Nuevas tablas: consulta, resultado, examen
```

### 7. embarazo_hitos_mes.sql
```sql
-- Hitos del embarazo por mes de gestación
-- Nueva tabla: embarazo_hito
```

### 8. examenes_orden_foto.sql
```sql
-- Campo de orden en fotos de exámenes
-- Campo: orden (integer)
```

### 9. invitacion_token.sql
```sql
-- Sistema de invitaciones con token para bypass de onboarding
-- Nueva tabla: invitacion_token
-- Campos: token, email, expires_at
```

### 10. password_definida.sql
```sql
-- Flag para saber si usuario ya definió contraseña
-- Campo: password_definida (boolean)
```

### 11. preferencias_recordatorios_citas.sql
```sql
-- 5 ventanas de tiempo para recordatorios de citas
-- Nueva tabla: preferencia_recordatorio_cita
-- Campos: hora_recordatorio (5 opciones)
```

### 12. registro_diario_pecho_unificado.sql
```sql
-- Opción unificada de pecho reemplazando izquierdo/derecho
-- Campo: pecho (unified option)
```

### 13. registros_diarios.sql
```sql
-- Tabla principal de registros diarios (pañal, alimentación, sueño)
-- Nueva tabla: registro_diario
-- Campos: tipo, hora, datos
```

### 14. salud_materna.sql
```sql
-- Datos de salud materna (peso, presión, síntomas)
-- Nueva tabla: salud_materna
```

### 15. suscripciones_push.sql
```sql
-- Suscripciones a push notifications
-- Nueva tabla: suscripcion_push
-- Campos: subscription_token, endpoint, auth
```

### 16. vacunas_fecha_con_hora.sql
```sql
-- Vacunas con fecha y hora específica
-- Campo: hora (time)
```

### 17. usuario_foto_perfil.sql ⏳ PENDIENTE DE EJECUTAR
```sql
-- Foto de perfil del usuario (mamá/papá/cuidador)
-- Campo: foto_perfil TEXT (data URI base64, igual que perfiles_bebes)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS foto_perfil TEXT;
```
**Ejecutar en Render:**
```bash
psql "$DATABASE_URL" -f backend/src/db/migrations/usuario_foto_perfil.sql
```

---

## 📅 Próximas Migraciones Planeadas

### Pendientes de crear:

| Descripción | Prioridad | Archivos afectados |
|-------------|-----------|-------------------|
| Preferencias de voz (device-specific) | Media | localStorage solo |
| Analytics de uso | Baja | Nueva tabla |
| Auditoría de cambios | Media | Nueva tabla de logs |

---

## 🔄 Proceso de Nueva Migración

### Cuando César quiera agregar una migración:

1. **Crear archivo**
   ```
   backend/src/db/migrations/XXX_nombre_descriptivo.sql
   ```

2. **Escribir con IF NOT EXISTS**
   ```sql
   ALTER TABLE usuarios
   ADD COLUMN IF NOT EXISTS nuevo_campo VARCHAR(255);
   ```

3. **Documentar aquí**
   ```markdown
   | # | Archivo | Descripción | Fecha | Estado |
   |---|---------|-------------|-------|--------|
   | 17 | nuevo.sql | Descripción | DD/MM | ⏳ |
   ```

4. **Ejecutar en Render**
   ```bash
   psql -U usuario -d babycaree < backend/src/db/migrations/nuevo.sql
   ```

5. **Marcar como completada**
   - Cambiar estado a ✅
   - Agregar fecha en YYYY-MM-DD

---

## 🐛 Problemas Reportados

Ninguno actualmente.

---

## ⚠️ Acción requerida

`usuario_foto_perfil.sql` está en el repo pero **aún no se ha ejecutado** en la
base de Render. Hasta que se ejecute, la subida de foto en Mi Perfil devolverá
error 500 (`column "foto_perfil" does not exist`).

---

## 📞 Responsables

- **Creación**: Claude (Organizador de Código)
- **Ejecución**: César (Propietario, acceso a Render psql)
- **Validación**: Ambos

---

**Última verificación**: 14 de Septiembre, 2026
