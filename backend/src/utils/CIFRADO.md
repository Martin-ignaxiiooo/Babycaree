# Cifrado de datos clínicos

Los campos con información médica se guardan cifrados en la base de datos.
Implementación en `backend/src/utils/cifrado.ts`.

## Campos cifrados

| Tabla | Campos |
|---|---|
| `citas_medicas` | `diagnostico`, `indicaciones`, `resultado_notas`, `receta_foto` |
| `examenes_medicos` | `indicaciones`, `resultado_notas`, `resultado_foto`, `orden_foto` |

**No se cifran** el peso, la talla, las fechas ni los nombres: se usan para
ordenar, filtrar y graficar la curva de crecimiento, y cifrarlos rompería
esas funciones sin aportar mucho (un peso aislado no revela una condición
médica).

## Puesta en marcha

1. Generar la clave:

   ```bash
   openssl rand -hex 32
   ```

2. Cargarla en Render como variable de entorno `ENCRYPTION_KEY`.

3. Guardar una copia en el gestor de contraseñas del equipo. **Esto no es
   opcional** (ver abajo).

No hay migración de datos ni downtime: los registros que ya existan siguen
leyéndose en claro y se cifran solos la próxima vez que se editen.

## ⚠️ Si se pierde la clave

**Los diagnósticos, recetas y resultados cifrados quedan irrecuperables.**
No hay recuperación posible: ni con acceso a la base, ni por Render, ni por
nadie. Por eso la copia en el gestor de contraseñas.

Antes de rotar la clave o cambiar de proveedor de base de datos, hay que
descifrar los datos con la clave vieja y volver a cifrarlos con la nueva.

## Comportamiento sin clave configurada

Si `ENCRYPTION_KEY` no está o es inválida, la app **sigue funcionando** y
guarda en claro, como antes de este cambio. Se registra un error en los
logs del servidor. Es deliberado: es preferible que una madre pueda anotar
el diagnóstico de su hijo a que la app se caiga por una variable mal pegada.

## Detalles técnicos

- **AES-256-GCM**: además de cifrar, autentica. Si alguien altera un byte en
  la base, el descifrado devuelve `null` en vez de texto corrupto — es más
  honesto mostrar "sin datos" que basura ilegible en una ficha médica.
- **IV aleatorio por valor**: cifrar dos veces el mismo texto da resultados
  distintos, así que no se puede deducir qué pacientes comparten diagnóstico
  comparando filas.
- **Formato**: `enc:v1:<iv>:<authTag>:<datos>`, todo en base64. El prefijo
  permite distinguir lo cifrado de lo que no, y el `v1` deja la puerta
  abierta a cambiar de algoritmo más adelante sin romper lo existente.
- **Rendimiento**: ~78 ms para una foto de 2 MB (ida y vuelta). Despreciable
  frente al cold start de Render.

## Qué protege y qué no

Protege contra alguien que obtenga un **dump de la base de datos**: una
credencial filtrada, un backup expuesto, acceso indebido al panel de Neon.

No protege contra alguien que comprometa el **backend en ejecución** (ahí la
clave está en memoria), ni contra un bug de autorización que deje a un
usuario ver datos de otro. Es defensa en profundidad, no una bala de plata.
