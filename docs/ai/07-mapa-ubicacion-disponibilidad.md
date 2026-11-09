# Conversación 07: Mapa con Leaflet, ubicación en tiempo real y disponibilidad del conductor

- **Fecha:** 2026-11-09
- **Herramienta:** Antigravity (Gemini 3.8 Flash)
- **Objetivo:** Diseñar e implementar la visualización del mapa con Leaflet/OSM en un WebView, la captura y seguimiento de ubicación con `expo-location`, el control de disponibilidad del conductor con sincronización en Firestore (respetando filtros de tiempo y distancia), el manejo de permisos/estados de GPS y el cierre de sesión seguro.
- **Archivo de exportación:** [07-mapa-ubicacion-disponibilidad.jsonl](07-mapa-ubicacion-disponibilidad.jsonl)

---

## Registro de interacción

### 1. Consulta inicial sobre dependencias y permisos
Se consultó qué librerías nativas se requieren en Expo para mostrar un mapa sin facturación de Google (Leaflet + OpenStreetMap) y leer la ubicación del conductor, así como los permisos requeridos.
- **Respuesta/Uso:** Se identificaron `expo-location` y `react-native-webview`. Se definieron los permisos necesarios en `app.config.js` (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` y `locationWhenInUsePermission`).

### 2. Arquitectura de Leaflet en WebView sin recargas
Se consultó cómo embeber Leaflet dentro de `react-native-webview` sin que el mapa parpadee ni se recargue al recibir nuevas coordenadas, y qué ocurre en escenarios sin conexión a internet.
- **Respuesta/Uso:** Mantener el HTML estático fuera del ciclo de renderizado del componente y comunicar los cambios de coordenadas mediante scripts inyectados / mensajes para actualizar dinámicamente los marcadores con `setLatLng` y `panTo`. Se documentó el comportamiento de la caché HTTP de teselas en el WebView y la necesidad obligatoria de red para sincronizar con Firestore.

### 3. Revisión del componente `RouteMap.js`
Se presentó la implementación de [RouteMap.js](../../src/components/RouteMap.js) utilizando `L.circleMarker` para evitar fallas de assets externos y `applicationNameForUserAgent` conforme a la directiva de OpenStreetMap.
- **Feedback:** Se validó el desacoplamiento limpio y se sugirieron mejoras en el seguimiento del mapa (`map.panTo`), tooltips táctiles permanentes y seguridad en el parseo de mensajes.

### 4. Especificación y diseño del seguimiento de ubicación
Se definieron los requerimientos para el seguimiento:
- Mapa siempre actualizado localmente.
- Firestore actualizado únicamente cuando el conductor está Disponible, con intervalo mínimo de 5 segundos y tras recorrer al menos 10 metros.
- Manejo de permisos denegados, servicios de ubicación del dispositivo apagados y detección de retorno desde Ajustes mediante `AppState`.
- Pausa del GPS y de envíos al navegar a otras pantallas del menú lateral.

### 5. Creación y revisión de `useDriverLocation.js` y `driverService.js`
Se implementaron el hook `useDriverLocation.js`, las constantes en `app.js` y las funciones `setAvailability`, `setUnavailableBeforeLogout` y `updateLocation` en `driverService.js`.
- **Revisión del diff y corrección:** Se detectó un bug crítico: el hook condicionaba la suscripción a `Location.watchPositionAsync` a que `isSending` fuera `true`, lo cual congelaba el mapa si el conductor estaba No disponible. Se aplicó la corrección solicitada para mantener la suscripción activa siempre que el estado sea `'ready'`, limitando `isSending` únicamente al despacho de actualizaciones hacia Firestore.

### 6. Integración en `HomeScreen.js`, `SettingsScreen.js` y diccionarios
Se conectó la interfaz con el switch de disponibilidad, el mapa y las salvaguardas:
- En `HomeScreen.js`: solo permite ponerse Disponible si la cuenta está aprobada y la ubicación lista; deshabilita la activación pero permite la desactivación; restaura la última disponibilidad guardada (`lastAvailability`); muestra motivos claros si la ubicación o cuenta están bloqueadas con botón de acción (`fix`); y pausa la transmisión con `useIsFocused`.
- En `SettingsScreen.js`: logout seguro mediante `setUnavailableBeforeLogout` con timeout para evitar conductores fantasma en Firestore si no hay conexión, ofreciendo salida forzada (`logoutAnyway`) si el usuario lo decide.
- Diccionarios `es.js` y `en.js`: actualización completa de textos y motivos de error.

---

## Verificación

- Verificación de tipos y linter con `npm run lint` (`expo lint`).
- Verificación de compatibilidad con reglas de Firestore (`firestore.rules`).
- Comprobación de integridad de diffs con Git.
