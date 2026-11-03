# Conversación 02: Constantes, internacionalización, sesión y navegación base

- **Fecha:** 2026-11-03
- **Herramienta:** Antigravity (Gemini 3.8 Flash)
- **Objetivo:** Centralizar constantes de negocio (`pricing.js` y `app.js`), estructurar la internacionalización (`es.js`, `en.js`, `SettingsContext`), implementar la persistencia de sesión sin login (`storageService`, `SessionContext`) y armar el árbol de navegación completo con React Navigation (Root, Tabs, Drawer, Stacks y componentes de estado).
- **Archivo de exportación:** [02-navegacion-y-contextos-base.jsonl](02-navegacion-y-contextos-base.jsonl) (log técnico completo de la sesión)

---

## Registro de interacción

### 1. Constantes y reglas de negocio
- **Petición del usuario:** Consulta sobre conveniencia de centralizar números fijos (edad mínima, capacidad XL, tarifas, comisión) en un archivo de constantes.
- **Respuesta y diseño:** Se explicó la importancia de evitar "números mágicos" y se crearon:
  - `src/config/pricing.js`: Valores financieros de las reglas RN-01 a RN-05 (tarifa base 3.500 COP, km 1.200 COP, min 250 COP, mínima 6.000 COP, comisión 20%, multiplicadores de categoría).
  - `src/config/app.js`: Parámetros operativos y de validación (edad mínima 18, capacidad XL 6, técnico-mecánica 5 años, 15 s timeout solicitud, 20 viajes por página).
- **Ajustes del usuario:** El usuario convirtió las constantes en exportaciones nombradas, añadió listas desplegables `GENDERS` y `VEHICLE_COLORS` en inglés (RNF-14) y variables de Cloudinary en `.env`.

### 2. Internacionalización y preferencias
- **Petición del usuario:** Revisión de la configuración de idiomas español e inglés usando `AsyncStorage` para recordar la selección.
- **Revisión y feedback:**
  - `src/services/storageService.js`: Funciones con clave de nombres (`uberclone:...`) para `driverId`, `language` y `lastAvailability`.
  - `src/i18n/es.js` y `src/i18n/en.js`: Diccionarios simétricos de 32 claves.
  - `src/context/SettingsContext.js`: Carga en paralelo con `Promise.all`, actualización optimista y función `t(key, params)` con soporte de interpolación.

### 3. Persistencia de sesión sin login
- **Petición del usuario:** Cómo estructurar la navegación según la presencia del id en el teléfono y qué hacer si la lectura falla.
- **Respuesta y diseño:**
  - Renderizado condicional en `RootNavigator` para evitar redirecciones forzadas y eliminar el parpadeo de pantalla (*flash of wrong screen*).
  - Manejo de fallas: no asumir cuenta inexistente ante un fallo de disco; almacenar el error y mostrar pantalla de aviso con botón "Reintentar".
- **Implementación del usuario:** `src/context/SessionContext.js` con `loadSession`, `startSession` y `endSession`.

### 4. Arquitectura de navegación con React Navigation
- **Petición del usuario:** Armar la navegación completa previa a las pantallas funcionales (Tabs de registro, Drawer principal con 6 secciones, Stacks de historial y viaje).
- **Construcción inicial:** Se añadieron navegadores en `src/navigation/` (`RootNavigator`, `RegistrationTabs`, `MainDrawer`, `HistoryStack`, `TripStack`), `SafeAreaProvider` en `App.js` y `react-native-gesture-handler` en `index.js`.
- **Modularización por el usuario:**
  - Organización de pantallas en carpetas modulares (`src/screens/{history, home, payment, profile, registration, settings, simulator, trip}/`).
  - Creación de componentes reutilizables en `src/components/` (`ScreenPlaceholder`, `LoadingState`, `ErrorState`).
  - Verificación en `App.js` de la conexión a Firebase leyendo `db.app.options.projectId`.
- **Detección de incidencias y corrección:**
  - Se identificó la falta de `src/screens/earnings/EarningsScreen.js` requerida por `MainDrawer.js`. Se creó el archivo.
  - Se detectó diferencia de ruta singular/plural (`trip` vs `trips`), corregida en la carpeta.
  - Se reincorporó `SafeAreaProvider` en `App.js` para asegurar el cálculo de márgenes seguros en dispositivos móviles.
  - Se corrigió desajuste menor de dependencias con `npx expo install --fix`.
  - Se verificó todo con `npx expo-doctor` obteniendo 20/20 verificaciones aprobadas.

