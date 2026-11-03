# Conversación 01: Conexión inicial de Firebase y configuración de entorno

- **Fecha:** 2026-11-03
- **Herramienta:** Antigravity (Gemini 3.8 Flash)
- **Objetivo:** Definir cómo conectar Firebase (SDK Web) sin quemar credenciales, resolver dudas de seguridad sobre la `apiKey`, verificar dependencias y crear la plantilla de variables de entorno `.env.example`.
- **Archivo de exportación:** [01-conexion-firebase.jsonl](01-conexion-firebase.jsonl) (log completo de la sesión)

---

## Registro de interacción

### Mensaje 1 (Usuario)
> Estoy aprendiendo React Native y como proyecto final tengo que hacer la app del conductor de un clon de Uber. Mis requisitos y mi diseño están en docs/requisitos.md y docs/diseno.md. Quiero construirla paso a paso y entender cada parte, porque después tengo que explicarla.
>
> Tengo que usar Expo SDK 58 con JavaScript (no TypeScript), Firebase para los datos y Cloudinary para las fotos. No puedo usar Google Maps porque no tengo facturación.
>
> Te voy a pedir una parte a la vez. Explícame con palabras sencillas lo que hagas y no inventes reglas que no estén en mis documentos; si falta algo, pregúntame. En cada pedido toca solo los archivos de esa parte, no avances a la siguiente y no hagas commits: los hago yo después de revisar.

### Respuesta 1 (Asistente)
Se confirmaron las reglas de trabajo:
- Desarrollo incremental paso a paso sin avanzar sin autorización.
- Edición estricta de archivos por parte.
- Explicaciones pedagógicas y sencillas.
- Fidelidad total al diseño (JS, Expo SDK 58, Firebase Web, Leaflet/OSRM, pesos COP enteros).
- Cero commits automáticos (los gestiona el estudiante).
- Se propuso iniciar por la **Parte 1 (Base)** de la Sección 17 del diseño.

---

### Mensaje 2 (Usuario)
> Quiero conectar la app con Firebase. ¿Qué tengo que crear en la consola y cómo lo conecto desde la app sin dejar los datos del proyecto escritos en el código? ¿La apiKey de Firebase es un secreto?

### Respuesta 2 (Asistente)
1. **¿La apiKey es un secreto?**: No. En clientes web y móviles actúa como identificador público del proyecto. La seguridad real radica en las reglas de Firestore (`firestore.rules`). Los verdaderos secretos (como tokens de pago) residen únicamente en el backend.
2. **Qué crear en Firebase Console**:
   - Proyecto en Firebase.
   - Aplicación Web (`</>`) para obtener `firebaseConfig` (por decisión de arquitectura D-02 / AD-02 usando el SDK web).
   - Base de datos Cloud Firestore.
3. **Manejo de credenciales**:
   - Uso de `.env` con prefijo `EXPO_PUBLIC_` soportado nativamente por Expo.
   - Ignorar `.env` en `.gitignore`.
   - Crear `.env.example` para el repositorio.
   - Archivo `src/config/firebase.js` leyendo `process.env.EXPO_PUBLIC_*`.

---

### Mensaje 3 (Usuario)
> muy bien acabo de agregar el .env con las variables de firebase, lo agregue al gitignore, tambien agregue las reglas de firebase e instale lo necesario para la navegacio, firebase y asyncstorage, revisa que todo haya quedado bien o si hay algo por ajustar

### Respuesta 3 (Asistente)
- Se ejecutó `npx expo-doctor` resultando en 20/20 verificaciones aprobadas.
- Se verificó con `git status` que `.env` está correctamente ignorado por `.gitignore`.
- Se validó que `firestore.rules` coincide con la Sección 11 del diseño.
- Se observó que en `src/config/firebase.js`, para evitar el error `Firebase App named '[DEFAULT]' already exists` al recargar con Fast Refresh, se debía usar `getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()`.
- Se recomendó agregar `.env.example` y recordar importar `react-native-gesture-handler` en `index.js`.

---

### Mensaje 4 (Usuario)
> yo ya ajuste el firebase.js crea tu el .env.example

### Respuesta 4 (Asistente)
- Se creó [.env.example](file:///c:/Dev/proyecto-desarrollo-movil/uberclone-conductor/.env.example) con las variables de Firebase, Cloudinary, Backend y OSRM definidas en el diseño.
- Se validó que el usuario corrigió satisfactoriamente `src/config/firebase.js`.

---

## Archivos involucrados y verificados
- `.gitignore`: Se aseguró la exclusión de `.env`.
- `.env.example`: Creado como plantilla de variables de entorno públicas.
- `src/config/firebase.js`: Inicialización segura del SDK Web de Firebase con verificación de variables requeridas.
- `firestore.rules`: Reglas de seguridad para las colecciones `drivers` y `trips`.
- `package.json`: Validación de compatibilidad con Expo SDK 58.

