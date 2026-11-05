# Conversación 06: Parte 3, contexto del registro, pantallas e Inicio

- **Fecha:** 2026-11-05
- **Herramienta:** Claude Code (Claude Sonnet 5.5)
- **Objetivo:** Diseñar y revisar el resto de la Parte 3: el guardado del conductor, el contexto que comparte el formulario entre las tres pestañas, las pantallas del registro, el botón de envío e Inicio con el estado de la cuenta.
- **Archivo de exportación:** [06-registro-contexto-y-pantallas.jsonl](06-registro-contexto-y-pantallas.jsonl), con la conversación filtrada (ver la nota al final).

---

## Registro de interacción

### 1. Plan inicial

Pegué el contexto del proyecto, las reglas de trabajo y la lista de lo que faltaba de la Parte 3 (`driverService`, `RegistrationContext`, claves de i18n y las tres pantallas). Pedí un plan y recomendaciones, sin escribir código todavía.

### 2. `withTimeout` y la regla de no escribir sin orden

Pregunté si convenía empezar por un `withTimeout`. La IA escribió el archivo en vez de solo contestar. Le dije que no vuelva a escribir código si yo no se lo pido, y la regla quedó en la memoria del proyecto.

Reescribí `withTimeout.js` con un tiempo fijo de 15 s (`SAVE_TIMEOUT_MS`). La revisión aclaró dos cosas: lanza un error con `code = 'timeout'` y no cancela la escritura, que puede llegar al servidor después. Por eso quien llama debe preguntarle al servidor si llegó antes de dar el fallo por bueno.

Durante esa revisión, `npx expo lint` instaló ESLint sin que yo lo pidiera (cambió `package.json` y `package-lock.json` y creó `eslint.config.js`). Pedí revertirlo y quedó comprobado con `git` y `npm ls`. ESLint no está en el proyecto.

### 3. `driverService`

Escribí `driverService.js` con base en el formulario aceptado y pedí feedback. La revisión encontró el problema del reintento: si el primer guardado pasa del tiempo límite pero llega al servidor, volver a escribir el conductor con `createdAt: serverTimestamp()` cuenta como actualización y `firestore.rules` la rechaza con `permission-denied`.

La solución: generar el `driverId` en el cliente, reusarlo en cada reintento y preguntar con `driverExists` (usa `getDocFromServer`) antes de volver a crear. Pedí arreglar esos problemas y no tocar nada más.

### 4. `driverProfile` y la escucha en tiempo real

Escribí `driverProfile.js` y cambié `SessionContext` para escuchar el documento del conductor con `onSnapshot`. Pregunté si con eso Inicio muestra un cambio de `approvalStatus` sin recargar. La respuesta fue que sí, con una condición: `driver` es `null` hasta el primer snapshot y Inicio tiene que manejar ese caso.

También encontró que `toDriverProfile` repetía campos del sistema que ya pone `createDriver` (`approvalStatus`, `balance` y otros). Pedí corregirlo para que reusar el perfil al editarlo no reinicie el saldo ni la aprobación.

### 5. Preguntas de diseño del registro

Pregunté cómo compartir el formulario entre las tres pestañas, qué hacer si falla la subida de una foto y qué pasa con un doble toque en "Enviar registro". Usé estas respuestas:

- Un contexto por encima de las pestañas.
- Subir con `Promise.allSettled`, mostrar el error junto a cada foto que falló y guardar en caché las que ya subieron (por `uri`).
- Frenar el doble toque con un `useRef` puesto antes del primer `await`, más un estado `submitting` para la interfaz.

### 6. `RegistrationContext`

Escribí el contexto con esas recomendaciones y pedí feedback. Recibí cuatro:

1. `try/catch/finally` en `submit`.
2. Un mensaje distinto para fallas de conexión.
3. El caso `permission-denied` al reintentar.
4. Bloquear los campos mientras se envía.

Pedí aplicarlas y conectar lo pendiente: el provider en `RegistrationTabs` y las claves de i18n. La IA aplicó las tres primeras en el contexto. La cuarta quedó para las pantallas. Me entregó un reporte de lo que cambió frente a lo que yo había escrito.

### 7. Pantallas, layout e Inicio

Pregunté cómo armar las tres pantallas, el botón de envío en las tres y un Inicio con el estado de la cuenta. La IA propuso la estructura y dejó tres decisiones abiertas que los documentos no resuelven: qué hacer con una cuenta rechazada, el texto "te avisaremos" y el aviso de lo que falta para habilitar el botón.

Escribí las pantallas, `RegistrationLayout` e Inicio, y pedí revisar el diff y las claves de i18n. La revisión encontró:

- `errors.saveConnection` no existía, y el contexto la usa.
- Las listas mostraban "Seleccionar..." fijo en español.
- `DateField` usaba `onChange`, deprecado en datetimepicker 9.2.1. Lo comprobó en el código de `node_modules`: no truena al descartar el calendario, solo avisa en desarrollo.
- Los campos seguían editables durante el envío, y `submit` guarda lo que había al tocar el botón.

### 8. Correcciones y bitácora

Pedí aplicar esas cuatro correcciones y recibí otro reporte por archivo. Después pedí actualizar `AI_LOG.md` y completar la evidencia en `docs/ai/`.

---

## Quién escribió qué

| Archivo | Lo escribí yo | Lo que aplicó la IA a mi pedido |
|---|---|---|
| `withTimeout.js` | Reescribí la primera versión | La primera versión, que no había pedido, y un ajuste menor |
| `driverService.js` | Sí | Correcciones del reintento y de los comentarios |
| `driverProfile.js` | Sí | Quitó los campos del sistema repetidos y el import de `COMMISSION_RATE`, y reescribió el comentario de cabecera |
| `SessionContext.js` | Sí | Nada |
| `RegistrationContext.js` | Sí | Reestructuró `submit` (`try/catch/finally`, mensaje de conexión, caso `permission-denied`) y puso mayúscula inicial en dos comentarios |
| `RegistrationTabs.js` | El comentario | Montó el `RegistrationProvider` |
| `RegistrationLayout.js` | Sí | Bloqueo de los campos mientras se envía y cierre del teclado al enviar |
| Pantallas de registro e Inicio | Sí | `placeholder` traducido en las cuatro listas |
| `DateField.js` | Sí | `onChange` por `onValueChange` |
| `es.js` y `en.js` | Reescribí los archivos con mis textos | Las primeras claves de error del envío, y después `errors.saveConnection` y el ajuste de `errors.saveFailed` |

## Verificación

- Leí `Diseno.md` y `firestore.rules` para comprobar el reintento: crear exige `approvalStatus == 'pending'` y `balance == 0`, y actualizar no deja cambiar `approvalStatus` ni `createdAt`.
- Parseé con Babel los archivos cambiados para descartar errores de sintaxis.
- Comparé `es.js` y `en.js` con un script en Node: 108 claves en cada uno, mismos placeholders y todas las claves usadas están definidas, incluidas las dinámicas (`gender.*`, `category.*`, `color.*`, `approval.*`).
- Revisé en `node_modules` cómo despacha `onChange`, `onValueChange` y `onDismiss` el datetimepicker 9.2.1.
- No corrí lint y no probé el registro en el teléfono ni contra Firestore.

## Pendiente

- Probar el registro completo en el teléfono: subida de fotos, guardado, y que Inicio cambie al modificar `approvalStatus` desde la consola.
- Decidir el mensaje y la acción para una cuenta rechazada.
- Inicio se queda en "Cargando..." si la app abre sin conexión y no hay documento en caché.
- Parte 4: mapa, disponibilidad y ubicación.

## Nota sobre la exportación

El `.jsonl` de esta carpeta no es la transcripción cruda de Claude Code. La sesión guarda además el contexto del sistema de la herramienta: mis instrucciones personales, mi correo y la lista de mis conectores. Ese material no es parte de la conversación y no lo subo al repo.

El archivo tiene una línea por mensaje: lo que escribí, el texto de la IA y un resumen de cada llamada a herramienta (nombre y archivo o comando, sin el contenido). Oculté mi correo y el nombre de mi cuenta de Windows en las rutas. Es una copia hasta el momento de generarla; la transcripción original sigue en mi equipo.
