# Conversación 15: Ingreso con la cédula y borrar (solicitudes y cuenta)

- **Fecha:** 2026-11-12
- **Herramienta:** Claude Code (Claude Sonnet 5.5)
- **Objetivo:** Crear el ingreso con la cédula, sin contraseña, y cerrar la D del CRUD: retirar una solicitud desde el Cliente simulado y eliminar la cuenta desde Configuración. Tenía tres dudas de fondo: cómo buscar al conductor sin que la caché de Firestore responda «no existe», cómo evitar dos conductores con la misma cédula y qué pasa si el conductor acepta una solicitud en el mismo instante en que la retiro.
- **Archivo de exportación:** [15-ingreso-con-cedula-y-borrado.jsonl](15-ingreso-con-cedula-y-borrado.jsonl), con la conversación filtrada (ver la nota al final).

---

## Registro de interacción

### 1. Búsqueda por cédula y unicidad

Pregunté cómo buscar al conductor por cédula sin que la caché diga que no existe y cómo impedir que dos se registren con la misma. Pedí que la IA solo me guiara y no tocara código sin mi aprobación. Antes de responder leyó `driverService.js`, `firebase.js`, `firestore.rules`, `SessionContext.js`, `RootNavigator.js` y las secciones de `Diseno.md` y `Requisitos.md` sobre el ingreso. Encontró que RF-39 y HU-11 ya describían el ingreso con `findDriverIdByDocument`, pero el código no tenía pantalla de ingreso ni esa función.

- **Caché.** Con `getDocs`, sin red, el SDK puede devolver un resultado vacío desde la caché. `getDocsFromServer` y `getDocFromServer` fallan si no hay red, y lo comprobó en los tipos instalados de `@firebase/firestore`. El ingreso debe separar tres resultados: lo encontró, el servidor dijo que no existe, o error de red o timeout. Solo el segundo ofrece el registro; el tercero muestra Reintentar. Es el criterio que ya uso en `driverExists`.
- **Unicidad.** Firestore no tiene restricciones de unicidad, y «buscar y luego crear» tiene una carrera entre dos teléfonos. Las transacciones del cliente no aceptan queries. Propuso un documento `cedulas/{documentNumber}` con `{ driverId }`, escrito en un `writeBatch` junto con el conductor, y descartó dos alternativas: usar la cédula como id del conductor (cambia el id de sesión y la deja expuesta en `trips.driverId`) y un endpoint en el backend con Admin SDK.
- **Huecos del repo.** Editar perfil deja cambiar la cédula a una cuenta pendiente o rechazada, eliminar la cuenta debe liberar la cédula, el reintento tras un timeout debe preguntar al servidor y los conductores ya creados necesitarían un backfill.

Pregunté si eso significaba modificar los índices que ya tenía en Firestore, y la IA aclaró que hablaba de una colección nueva y no de `firestore.indexes.json`.

### 2. Las reglas con `cedulas`

Pregunté si había que modificar las reglas y, tras su respuesta, le pedí agregarlas para publicarlas yo. Cargó el skill de prosa y editó solo `firestore.rules`: un bloque `match /cedulas/{documentNumber}` (leer por id, crear solo en el batch del conductor nuevo, borrar solo si el conductor ya no existe), una condición con `getAfter` en el `create` de `drivers` y `documentNumber` entre los campos que no cambian. Me avisó que no las publicara todavía: sin cambiar `createDriver`, ningún registro se podría crear. No las probó en el Rules Playground.

### 3. Mi primera fase y la revisión

Creé `LoginScreen`, `findDriverIdByDocument` con una query, el chequeo de cédula en `RegistrationContext`, los cambios en `SessionContext`, `RegistrationTabs` y `RootNavigator`, y además `deleteDriver` y `deleteAccount`. La IA leyó el diff, la pantalla nueva y corrió `npx expo lint`. Encontró:

1. Mi servicio buscaba con una query y `createDriver` seguía con un `setDoc` suelto, así que las reglas de `cedulas` habrían roto el registro. Sin ese documento, el chequeo del registro quedaba en «buscar y luego crear».
2. Faltaban 15 claves de traducción en `es.js` y `en.js`.
3. Un error de lint en `SessionContext.js`: yo había quitado el `eslint-disable-next-line react-hooks/set-state-in-effect`.
4. `deleteDriver` y `deleteAccount` no los llamaba ninguna pantalla.

Decidí dejar la query y aceptar la carrera entre dos teléfonos. La IA revirtió `firestore.rules` con `git restore`, restauró el comentario de `SessionContext.js` y confirmó el lint en cero. Los diccionarios los dejé para el final.

### 4. Retirar una solicitud y eliminar la cuenta

Pegué el requisito de la D del CRUD con dos preguntas. La IA leyó `tripService.js`, `useTripRequests.js` y `SettingsScreen.js`.

- **Aceptar y retirar a la vez.** Gana la primera transacción en confirmar y la otra falla sin escribir, como en `transition`. `withdrawRequest` lee el viaje, lo borra solo si sigue en `requested` y lanza el conflicto con el estado actual si no; que ya no exista cuenta como éxito, para que el reintento tras un timeout no falle. Si gana el retiro, la aceptación encuentra el viaje inexistente y `useTripRequests` ya descarta la tarjeta. La regla de `trips` que solo deja borrar en `requested` es la segunda barrera.
- **Eliminar estando Disponible.** No. La regla ya lo prohíbe, un conductor Disponible puede estar recibiendo solicitudes y Configuración no se alcanza durante un viaje. El botón se apaga con una pista, el `Alert` confirma y `DRIVER_AVAILABLE` cubre el caso de ponerse Disponible entre el toque y el borrado.

### 5. Segunda revisión

Escribí `withdrawRequest`, `PendingRequests`, el botón de eliminar en Configuración, la variante `dangerText` de `AppButton` y los diccionarios. La IA leyó el diff completo. Todo estaba bien menos dos cosas:

1. Había borrado `errors.profileAccountChanged` de los dos diccionarios, pero `useProfileEdit.js` todavía la usa: el conductor habría visto la clave cruda. Es el mismo error de la conversación 14.
2. `settings.deleteNeedsOffline` decía «Desconéctate en Inicio», y el estado en la app se llama No disponible.

Le pedí corregir las dos mientras probaba en el teléfono. Restauró la clave en `es.js` y `en.js` con el texto del último commit y cambió el mensaje a «Ponte No disponible en Inicio para eliminar tu cuenta» y su versión en inglés.

### 6. Verificación

`npx expo lint` terminó con 0 errores después de cada corrección. Con `grep` revisó que cada clave usada como texto en el código esté en `es.js` y en `en.js`, sin faltantes. Probé en el teléfono el ingreso con la cédula, retirar solicitudes y eliminar la cuenta, y funcionan bien.

Quedan pendientes:

- Con la query, dos teléfonos que se registren a la vez con la misma cédula pueden crear dos conductores. Lo acepto por ahora.
- Un conductor No disponible puede tener solicitudes `requested`, porque el simulador las crea aunque no esté Disponible. Al eliminar la cuenta quedan huérfanas.
- Actualizar `Diseno.md` y `Requisitos.md` (sección 5, sección 11 y HU-11).

## Nota sobre la exportación

El `.jsonl` de esta carpeta no es la transcripción cruda de Claude Code. La sesión guarda además el contexto del sistema de la herramienta: mis instrucciones personales, mi correo, la lista de mis conectores y el texto de los skills. Ese material no es parte de la conversación y no lo subo al repo.

El archivo tiene una línea por mensaje: lo que escribí, el texto de la IA y un resumen de cada llamada a herramienta (nombre y archivo o comando, sin el contenido; los comandos largos se cortan a 1.500 caracteres). Ocultué mi correo y el nombre de mi cuenta de Windows en las rutas. Quité los recordatorios del sistema que Claude Code agrega a mis mensajes, las notas del editor sobre los archivos abiertos, los resúmenes que genera al compactar el contexto y las notificaciones de tareas en segundo plano, porque no los escribí yo. La sesión empezó con `/clear`, así que el archivo incluye todo desde mi primer mensaje. Es una copia hasta el momento de generarla: termina en el mensaje donde pedí estos archivos, y la transcripción original sigue en mi equipo.
