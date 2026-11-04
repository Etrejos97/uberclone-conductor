# Conversación 04: Parte 3 – Dependencias e `app.config.js`

- **Fecha:** 2026-11-04
- **Herramienta:** Antigravity (Claude Sonnet 4.6)
- **Objetivo:** Preparar las dependencias nativas necesarias para el formulario de registro del conductor (RF-01 a RF-06) e integrarlas correctamente en `app.config.js`.
- **Archivo de exportación:** _(pendiente de exportar por el usuario)_

---

## Registro de interacción

### 1. Confirmación del estado del proyecto

- Se revisaron `docs/requisitos.md`, `docs/diseno.md` y `docs/AI_LOG.md`.
- Se confirmó que las Partes 1 y 2 están completadas y que el siguiente paso es la Parte 3 (Registro).
- Se identificaron los archivos a crear según la Sección 17 del diseño:
  - `src/context/RegistrationContext.js`
  - `src/services/uploadService.js` y `src/services/driverService.js`
  - Componentes reutilizables en `src/components/`
  - Pantallas en `src/screens/registration/`

### 2. Revisión de dependencias necesarias (Sección 14 del diseño)

- **Pregunta del usuario:** ¿Con las 5 dependencias listadas basta para el registro?
- **Respuesta:** Sí. Cada dependencia cubre exactamente una necesidad del formulario:

| Paquete | Para qué en el registro |
|---|---|
| `expo-image-picker` | Cámara y galería para fotos de perfil, vehículo y documentos (RF-06) |
| `expo-file-system` | Leer el archivo de la foto para subirlo a Cloudinary (AD-08) |
| `@react-native-community/datetimepicker` | Fecha de nacimiento y vencimientos de documentos (VA-05, VA-15 a VA-18) |
| `@react-native-picker/picker` | Listas desplegables de género, categoría y color (VA-06, VA-13) |
| `expo-checkbox` | Casilla de aceptación de términos y comisión (VA-20) |

- El usuario instaló las dependencias con `npx expo install`.

### 3. Revisión de `app.config.js`

- **Lo que hizo el usuario:** Creó `app.config.js` extendiendo `app.json` con:
  - `android.package: 'com.edison.uberconductor'`
  - Plugin `expo-image-picker` con `cameraPermission` en español.
  - Plugin `@react-native-community/datetimepicker`.
- **Observación:** El archivo es correcto. Se recomendó (opcional) agregar `photosPermission` a `expo-image-picker` para cubrir también el acceso a la galería.

### 4. Verificación con `expo-doctor`

- Se ejecutó `npx expo-doctor`: **20/20 verificaciones pasadas, sin errores ni advertencias**.
- Las 5 nuevas dependencias son compatibles con Expo SDK 58 y el resto del proyecto.

