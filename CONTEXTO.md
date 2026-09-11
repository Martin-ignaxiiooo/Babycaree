# Contexto de trabajo — Baby Care

> Este archivo existe para que quien retome el proyecto (humano o Claude)
> no tenga que redescubrir todo esto leyendo código. La arquitectura
> general está en `README.md`; acá va lo que solo se sabe por haber
> trabajado en el proyecto.

## Datos de infraestructura

| Cosa | Valor |
|---|---|
| Repo | `https://github.com/Martin-ignaxiiooo/Babycaree` (público) |
| Web (prod) | `https://babycaree-web.vercel.app` |
| Backend (prod) | `https://babycare-backend-msyq.onrender.com/api` |
| Base de datos | Neon (PostgreSQL) |
| Mobile | Expo SDK 54, target Play Store (no publicada aún) |

## ⚠️ Cómo se corren las migraciones (importante)

**No hay runner de migraciones.** Los archivos en
`backend/src/db/migrations/*.sql` no se ejecutan solos con ningún script
ni al hacer deploy. Hay que copiar el contenido y pegarlo a mano en el
editor SQL de Neon. Todas están escritas para ser **idempotentes**
(`IF NOT EXISTS`, etc.) así que correrlas de más no rompe nada.

Si creás una migración nueva, avisale explícitamente al humano que tiene
que correrla a mano — el código que la necesita puede estar deployado y
fallando en producción hasta que eso pase.

## Seguridad — ver memoria privada del proyecto

Los pendientes de seguridad concretos (rotación de secretos, credenciales
potencialmente expuestas, etc.) **no van en este archivo** porque este
repo es público. Están documentados en la memoria privada del proyecto
(vault de Obsidian, nota `BabyCare.md`) — consultar ahí antes de asumir
que algo ya se resolvió.

## Módulos deshabilitados a propósito (no son bugs)

- **Directorio de Especialistas** (`apps/web/src/pages/Directorio.tsx` y
  `apps/mobile/app/(tabs)/directorio.tsx`): deshabilitado para el público
  con el flag `MODULO_DIRECTORIO_HABILITADO = false` en ambos archivos.
  Muestra pantalla "Módulo en desarrollo". La lógica real (fetch, filtros,
  tarjetas) sigue intacta debajo — para reactivar, poner el flag en `true`
  en los dos archivos.
- El backend de ese módulo (`backend/src/routes/directorio_publico.routes.ts`)
  solo deja `/previsiones` sin login (lo necesita el Onboarding, paso 3,
  antes de que exista sesión). `/medicos` y `/especialidades` piden token
  — la web y mobile ya mandan el header `Authorization`, así que no hay
  que tocar el cliente si se reactiva el módulo.

## Convenciones descubiertas (no están documentadas en otro lado)

- **`rango_edad_meses`** (tabla `articulos_educativos`) es texto libre,
  no un número. Formato esperado: `"0-6 meses"`. Lo parsean con regex
  tanto `backend/src/controllers/home.controller.ts` como
  `apps/mobile/app/(tabs)/consejos.tsx` (función `aplicaAEdad`, acepta
  `"N-M"`, `"N–M"`, `"N a M"`, `"N+"`, o un número exacto). El form de
  admin (`AdminArticulos.tsx`) ya arma este formato con dos inputs
  (desde/hasta) — no volver a un solo número.
- **No se interpretan valores médicos automáticamente en la UI.** Decisión
  tomada a propósito: mostrar algo tipo "tus valores están bien" junto a
  presión arterial u otros signos vitales es un diagnóstico implícito, y
  podría hacer que alguien no consulte cuando debería. No agregar esa
  lógica sin discutirlo primero.
- **Transcripción de voz es gratuita a propósito** (Web Speech API del
  navegador, no Whisper/OpenAI). Es una decisión de costo + privacidad
  (el audio no sale del dispositivo), no un placeholder pendiente de
  mejorar.
- **Anti-bot es honeypot + tiempo mínimo, sin reCAPTCHA.** Decisión
  consciente para no mandar datos de usuarias a terceros. Falla hacia el
  lado permisivo (si el cliente no manda los campos esperados, la
  petición pasa igual) — es intencional, no un bug.

## Build de Android — nota para quien compile local

`apps/mobile/android/` **no está versionado en git** (se genera local con
Expo/Android Studio). Por default Gradle configura muy poca memoria
(512 MiB de heap) y tira `OutOfMemoryError: Java heap space` en proyectos
de este tamaño. Hay que crear a mano `apps/mobile/android/gradle.properties`
con:

```properties
org.gradle.jvmargs=-Xmx3072m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError
org.gradle.parallel=true
android.useAndroidX=true
```

Como no está en git, este ajuste hay que repetirlo cada vez que alguien
clona el proyecto fresco y compila para Android por primera vez.

## Funcionalidad escrita pero no montada

- **Galería de momentos** (`momentos.sql`, controlador y rutas): el
  código existe en el repo pero las rutas nunca se montaron en
  `backend/src/index.ts` y la tabla no está creada. No se sabe si sigue
  siendo deseada — confirmar con el humano antes de terminarla o
  borrarla.

## Cómo trabajar con Claude en este repo

- El repo es **público**, así que `git clone` / `git pull` funcionan sin
  token. Solo hace falta un Personal Access Token (fine-grained, permiso
  `Contents: Read and write` sobre este repo) para **pushear** cambios.
- Pedí cosas acotadas a una carpeta/archivo cuando se pueda — ahorra
  vueltas de exploración (`find`/`grep`) antes de llegar al cambio real.
- Este archivo es el lugar para dejar decisiones, pendientes y trampas
  nuevas a medida que aparecen — mejor que se pierdan en un chat viejo.
