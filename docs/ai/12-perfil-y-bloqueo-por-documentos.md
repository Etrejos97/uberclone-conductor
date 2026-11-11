# Conversación 12: Perfil y bloqueo por documentos vencidos

- **Fecha:** 2026-11-11
- **Herramienta:** Claude Code (Claude Sonnet 5.5)
- **Objetivo:** Reutilizar los campos y las validaciones del registro en Perfil, definir qué puede cambiar el conductor según el estado de su cuenta, diseñar las pantallas de Perfil y bloquear Inicio cuando un documento está vencido.
- **Archivo de exportación:** [12-perfil-y-bloqueo-por-documentos.jsonl](12-perfil-y-bloqueo-por-documentos.jsonl), con la conversación filtrada (ver la nota al final).

---

## Registro de interacción

### 1. Reutilizar el formulario del registro

Pregunté cómo sacar los campos y la subida de fotos del registro para usarlos también en Perfil, sin copiar las tres pestañas y sin romper el registro. El diseño:

- Un hook `useDriverForm` con los valores, los errores, cuándo mostrarlos y la subida de fotos con caché por `uri`. Las URL de las fotos ya guardadas siembran ese caché, así una foto que no cambió no se vuelve a subir.
- Los campos agrupados en `DriverFormFields.js`, que el registro pone en sus pestañas y Perfil usa según el caso.
- Un contexto de registro delgado que solo crea el conductor.

Cambié las tres pantallas del registro, el contexto y creé el hook y los componentes. La revisión confirmó que el contrato del contexto no cambió.

### 2. Qué cambia el conductor según su cuenta

Definí la política: con la cuenta aprobada no cambia su cédula, su vehículo ni su foto sin que nadie revise; sí cambia el teléfono, el correo y el género sin perder la aprobación; renueva un documento cuando ya venció o le falta menos de una semana, y entonces la cuenta vuelve a revisión. Con la cuenta pendiente o rechazada corrige todo menos la foto. Pregunté cómo validar cada caso. El diseño:

- Cada caso valida solo sus campos (`validateContact`, `validateRenewal`, `validateProfile`). Validar el formulario completo precargado bloquearía el cambio de teléfono a quien tiene un documento vencido.
- Un solo criterio de «por renovar», `isDueForRenewal`, que decide qué documentos se muestran y rechaza una fecha nueva que vuelva a caer en la ventana de 7 días.
- Las reglas de Firestore son la protección real, y la pantalla valida para el conductor.

Escribí los validadores, las funciones de `driverProfile.js`, `updateDriverProfile` y `submitForReview`. La revisión encontró tres puntos:

- Faltaba el texto de `errors.renewalStillDue`.
- `createDriver` había dejado de escribir `isAvailable: false`, y la regla de eliminar cuenta lo exige.
- `expiredDocuments` y `documentsDueForRenewal` reciben los valores del formulario. Con el documento de Firestore, las fechas son `Timestamp` y todos los documentos saldrían vencidos.

### 3. Pantallas de Perfil y bloqueo en Inicio

Pregunté si usar una pantalla de edición para los tres casos o una por cada uno. Elegí una sola, con el modo como parámetro de navegación (`contact`, `renewal` o `full`) y un hook `useProfileEdit` con lo que cambia por modo. El diseño:

- Dos componentes: uno espera a que exista `driver` y otro es el formulario, porque `useDriverForm` solo usa los valores iniciales en el primer render.
- El modo y los datos iniciales se toman al montar. Al renovar, la escucha del conductor ve `pending` antes de terminar el guardado y el formulario no puede cambiar en ese momento.
- Un `ProfileStack` como el del historial.
- En Inicio, sumar «sin documentos vencidos» a `canBeAvailable` cubre el interruptor, la restauración del último estado y el apagado si un documento vence con el conductor disponible. Un botón lleva a Renovar con `initial: false`, para que la flecha vuelva al perfil.

Escribí `useProfileEdit.js`, `ProfileStack.js`, `ProfileEditScreen.js`, `ProfileScreen.js`, el bloque de Inicio y los diccionarios. Eliminé `ScreenPlaceholder`, que quedó sin uso.

### 4. Correcciones de la revisión

Pedí a la IA que aplicara seis correcciones:

- `autoComplete` solo en el correo de la cuenta, y no en el de Mercado Pago, que no lo tenía en el registro.
- Una prop `renewing` en `ExpiringDocumentFields`, para que el selector de Renovar no ofrezca fechas dentro de la ventana de 7 días.
- Un mensaje propio para `permission-denied` (`errors.profileAccountChanged`), porque el aprobador puede cambiar el estado mientras el conductor edita y reintentar no sirve.
- El cálculo de `expired` en Inicio sin `useMemo`, para que un vencimiento con la app abierta se note al volver a Inicio.
- «Falta» sin «Vencido» cuando un documento no tiene fecha.
- `isAvailable: false` otra vez en `createDriver`.

La IA movió `INITIAL_VALUES` a un archivo compartido y lo revirtió, porque decidí dejarlo en el contexto del registro. Quedaron anotados y sin aplicar: los cambios de comentarios de `config/app.js` que no vienen de esta tarea y mostrar «Vence en N días» en el perfil.

### 5. Verificación

Revisé cada diff con la IA. `npx expo lint` y `eslint --no-cache src` dan 0 errores y la advertencia que ya existía en `CheckboxField.js`. `es.js` y `en.js` tienen 284 claves cada uno, sin faltantes, y todas las claves usadas están definidas. Leí `firestore.rules` para comprobar que cada escritura solo toca las claves que permite cada estado de cuenta, y el código de `usePreventRemove` para confirmar el orden entre el bloqueo al guardar y volver al perfil. Lo comprobé en el teléfono. Falta un script de Node que compruebe los bordes de `isDueForRenewal` y que `validateRegistration` dé el mismo resultado que antes del refactor.

## Nota sobre la exportación

El `.jsonl` de esta carpeta no es la transcripción cruda de Claude Code. La sesión guarda además el contexto del sistema de la herramienta: mis instrucciones personales, mi correo, la lista de mis conectores y el texto de los skills. Ese material no es parte de la conversación y no lo subo al repo.

El archivo tiene una línea por mensaje: lo que escribí, el texto de la IA y un resumen de cada llamada a herramienta (nombre y archivo o comando, sin el contenido). Ocultué mi correo y el nombre de mi cuenta de Windows en las rutas. Quité los recordatorios del sistema que Claude Code agrega a mis mensajes, porque no los escribí yo. Solo incluye lo que pasó desde que empecé con Perfil, porque lo anterior ya está en la conversación 11. Es una copia hasta el momento de generarla; la transcripción original sigue en mi equipo.
