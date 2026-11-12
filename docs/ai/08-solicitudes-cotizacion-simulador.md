# Conversación 08: Solicitudes de viaje, cotización con OSRM, cliente simulado y temporizador en Inicio

- **Fecha:** 2026-11-09
- **Herramienta:** Antigravity (Gemini 3.8 Flash)
- **Objetivo:** Diseñar e implementar el flujo completo de solicitudes de viaje (Módulo 5 / RF-11 a RF-16): modelo de datos en Firestore para `trips`, pantalla de Cliente simulado con prevención de doble envío y timeout, servicio de rutas OSRM con limitación de tasa (1 req/s), formateo i18n de pesos y distancias, cotización automática bajo demanda, cuenta regresiva de 15 segundos y visualización interactiva de tarjetas sobre el mapa en Inicio.
- **Archivo de exportación:** [08-solicitudes-cotizacion-simulador.jsonl](08-solicitudes-cotizacion-simulador.jsonl)

---

## Registro de interacción

### 1. Modelo de datos de viajes y pantalla de Cliente Simulado
Se consultó cómo estructurar el documento en Firestore (`trips/{tripId}`) desde la pantalla de prueba del cliente simulado para probar el flujo sin app de pasajero, y cómo blindar la creación ante doble pulsación del botón o caídas de conexión:
- **Respuesta/Uso:** Se detallaron los campos del creador según la sección 6 de `Diseno.md` y `firestore.rules` (obligatoriedad de `status: 'requested'`, `paymentStatus: null` y fechas en el servidor). Se definió el uso de `useRef` para bloqueo síncrono previo al primer `await`, generación del ID en el cliente (`newTripId`) para mantener idempotencia en reintentos, y verificación con `getTripStatusFromServer` tras posibles caídas de red con `withTimeout`.

### 2. Revisión de `tripService.js`, `validators.js` y corrección en `SimulatorScreen.js`
Se revisó la implementación de `src/services/tripService.js` (`createTrip`, `subscribeToRequests`, `saveEstimate`, `transition`, `isTripConflict`), `validators.js` (validación de propina entera segura y destinos distintos) y `SimulatorScreen.js`.
- **Feedback y ajuste:** Se comprobó que el servicio cumple estrictamente con `firestore.rules` y la máquina de estados. Se corrigió un bug en `SimulatorScreen.js` donde `category` se leía de `driver?.category` en vez de `driver?.vehicle?.category`, asegurando la preselección adecuada del vehículo del conductor.

### 3. Servicio de rutas con OSRM y formateo por idioma
Se consultó cómo solicitar la ruta con `fetch` a OSRM respetando los límites del servidor público (1 req/s conforme a `RNF-08`), qué hacer si no responde (timeout de 8 s) o no hay camino (`NoRoute`), y cómo formatear moneda ($ COP entera) y distancias (km con coma o punto) según el idioma:
- **Respuesta/Uso:** Se explicó la estructura de parámetros (`overview=simplified`, `geometries=geojson`, coordenadas en orden `lon,lat`), mapeo de coordenadas a objetos `{ latitude, longitude }` para Leaflet/Firestore, y la implementación de una cola/reserva de turnos virtual con `reserveSlot`.

### 4. Revisión de `routeService.js` y `format.js`
Se revisaron `src/services/routeService.js` y `src/i18n/format.js`:
- **Feedback:** Se validó el algoritmo determinista de reservas temporales (`reserveSlot`), el control de aborto por tiempo (`ROUTE_TIMEOUT_MS`) y la clasificación de errores (`timeout`, `network`, `noRoute`). En `format.js` se validó el formateo aritmético/regex sin dependencias del motor `Intl`, soportando pesos colombianos enteros sin decimales (`formatMoney`), kilómetros con un decimal (`formatKm`) y fechas en 24h / 12h AM-PM (`formatDateTime`).

### 5. Recepción de solicitudes en tiempo real, cotización y temporizador
Se consultó cómo recibir solicitudes en tiempo real solo cuando el conductor está Disponible en Inicio, dónde y cuándo calcular la tarifa, cómo gestionar múltiples solicitudes con cuenta regresiva de 15 segundos y cómo resolver la condición de carrera si el reloj llega a cero cuando el conductor toca Aceptar:
- **Respuesta/Uso:** Se aclaró que la tarifa se cotiza bajo demanda en la app al recibir la solicitud si no tiene `estimate` (`routeService` + `calculateFare`), persistiendo el resultado con `saveEstimate`. Se explicó la arquitectura de `useCountdown` con un único intervalo y hora real (`Date.now()`), y la protección transaccional en `tripService.transition`: si expira mientras se acepta, el temporizador espera la transacción; y a nivel de base de datos, `runTransaction` garantiza que solo una transición gana, avisando con `TRIP_STATE_CONFLICT` si ya no está disponible.

### 6. Revisión de `useCountdown.js`, `useTripRequests.js`, `RequestCard.js`, `HomeScreen.js` e i18n
Se verificaron los dos hooks, el componente de tarjeta, la integración en pantalla y los archivos de traducción:
- **Feedback:** Se comprobó la limpieza de solicitudes vencidas al conectar, la deduplicación de rutas cotizadas ante fallas de escritura, la prevención de doble aceptación con `accepting.current`, el dibujo dinámico en el mapa según la tarjeta seleccionada (o la más antigua), y la paridad exacta de 162 claves en `es.js` y `en.js`.

---

## Verificación

- `npx expo-doctor`: 20/20 comprobaciones aprobadas sin observaciones.
- `npx expo lint`: Verificado sin errores sintácticos ni de importación en los nuevos módulos.
- Script de paridad de traducción en Node: 162/162 claves idénticas entre `es.js` y `en.js`.
- Pruebas unitarias de formateo (`format.js`) ejecutadas con Node.
