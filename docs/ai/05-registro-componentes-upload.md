# Conversación 05: Parte 3 – Componentes de formulario y uploadService

- **Fecha:** 2026-11-04
- **Herramienta:** Antigravity (Claude Sonnet 4.6)
- **Objetivo:** Diseñar y revisar los componentes reutilizables del formulario de registro, corregir `SelectField.js` y crear `uploadService.js` para subir fotos a Cloudinary.
- **Archivo de exportación:** _(pendiente de exportar por el usuario)_

---

## Registro de interacción

### 1. Propuesta de componentes reutilizables

- Se propusieron 7 componentes en `src/components/` para cubrir todos los campos del formulario sin repetir lógica:

| Componente | Para qué |
|---|---|
| `FieldError` | Muestra el error rojo debajo de cualquier campo con espacio reservado |
| `FormField` | Texto libre (nombre, cédula, placa, email, etc.) |
| `SelectField` | Listas desplegables (género, categoría, color) |
| `DateField` | Selector de fecha nativo con texto + ícono de calendario |
| `PhotoPicker` | Cámara o galería con compresión (expo-image-picker) |
| `CheckboxField` | Casilla de términos y comisión |
| `FormScrollView` | Contenedor que empuja el formulario sobre el teclado |

- Decisiones acordadas:
  - `FieldError` con espacio **siempre reservado** (el formulario no salta al aparecer el error).
  - `DateField` muestra la fecha seleccionada en texto + ícono 📅.
  - El error solo aparece si el campo fue tocado (`touched[campo] === true`).

### 2. Revisión de archivos creados por el usuario

El usuario escribió 4 archivos:

**`src/i18n/errorParams.js`** ✅ Correcto. Centraliza los parámetros de los mensajes de error en un único lugar atado a `config/app.js`.

**`src/components/formStyles.js`** ✅ Correcto. Exporta `colors` como objeto separado (disponible para props) y `formStyles` como `StyleSheet`.

**`src/components/SelectField.js`** ⚠️ Problema detectado y corregido:
  - Importaba `useSettings` directamente, rompiendo la regla de que los componentes reutilizables no deben conocer el contexto.
  - Se eliminó el import y se agregó la prop `placeholder = 'Seleccionar...'` para que la pantalla pase el texto ya traducido.

**`src/components/CheckboxField.js`** ✅ Correcto. Patrón de accesibilidad correcto: `Pressable` como único control anunciado, con la `Checkbox` interna oculta via `importantForAccessibility`. Sugerencia menor: agregar `accessible={false}` para compatibilidad iOS si se llega a necesitar.

### 3. Diseño e implementación de `uploadService.js`

Se explicó el flujo completo antes de escribir el código:

- **Problema de `fetch` en Android:** no puede adjuntar `{ uri, type, name }` en `FormData`. Solución: `expo-file-system` lee el archivo como base64.
- **Barreras para fotos pesadas (AD-08):**
  1. Compresión al elegir (`quality: 0.6` en `expo-image-picker`).
  2. Rechazo si `fileSize > 5 MB` en `validatePhotoFile()` (nunca llega al `fetch`).
- **Sin internet:** `fetch` lanza `TypeError`. Se distingue del timeout (`AbortError`) para dar mensajes distintos.
- **`AbortController`** con `UPLOAD_TIMEOUT_MS = 30 s` para no dejar el `fetch` esperando indefinidamente en conexiones lentas.
- **`Promise.allSettled`** para subir hasta 5 fotos en paralelo sin que el fallo de una cancele las demás.

Funciones exportadas por `src/services/uploadService.js`:

| Función | Uso |
|---|---|
| `uploadPhoto(uri)` | Sube una sola foto, devuelve `secure_url` o lanza `Error` |
| `uploadPhotos(photoMap)` | Sube varias en paralelo, devuelve `{ urls, errors }` |

