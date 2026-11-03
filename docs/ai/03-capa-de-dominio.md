# Conversación 03: Capa de Dominio (funciones puras)

- **Fecha:** 2026-11-03
- **Herramienta:** Antigravity (Gemini 3.8 Flash)
- **Objetivo:** Implementar y validar las funciones puras de la capa de dominio (`src/domain/`), completamente desacopladas de React, red y Firestore: cálculo de tarifas (`fare.js`), máquina de estados del viaje (`tripStateMachine.js`), validaciones del registro y perfil (`validators.js`) y cálculo de rangos temporales para ganancias e historial (`dateRanges.js`).
- **Archivo de exportación:** [03-capa-de-dominio.jsonl](03-capa-de-dominio.jsonl) (log técnico completo de la sesión)

---

## Registro de interacción

### 1. Cálculo de tarifas (`fare.js`)
- **Petición del usuario:** Revisión y feedback de la implementación inicial de `calculateFare`.
- **Revisión y feedback:**
  - Se verificó el cumplimiento de las reglas **RN-01 a RN-06** y los casos de prueba de la Sección 8 del diseño:
    - 8,5 km, 22 min, `economy`: tarifa 19.200 COP, comisión 3.840 COP, ganancia 15.360 COP.
    - 8,5 km, 22 min, `xl`: tarifa 26.900 COP, comisión 5.380 COP, ganancia 21.520 COP.
    - 0,5 km, 2 min, `economy`: tarifa 6.000 COP (mínima aplicada).
  - Recomendaciones aplicadas: uso de `Object.hasOwn` en lugar del operador `in` para evitar propiedades del prototipo de JS, asignación por defecto `{}` para evitar caídas por llamadas sin argumentos y extensión explícita `.js` en importaciones ESM.

### 2. Máquina de estados del viaje (`tripStateMachine.js`)
- **Petición del usuario:** Cómo controlar las transiciones de estado para que un viaje solo avance según el diseño (`requested → accepted → driver_arriving → in_progress → completed → paid`), cómo evitar saltos indebidos y cómo manejar colisiones en el mismo segundo.
- **Respuesta y diseño:**
  - Explicación del concepto de Máquina de Estados Finita (FSM) pura con mapa de transiciones permitidas (`TRANSITIONS`) y función guardia `canTransition(from, to)`.
  - Explicación de la decisión **AD-03**: en la capa de servicios se usará `runTransaction` de Firestore para garantizar que si dos eventos ocurren en el mismo instante (ej. temporizador vence vs conductor presiona aceptar), solo la primera gane y la segunda detecte el conflicto.
- **Implementación del usuario:** `src/domain/tripStateMachine.js` con estados, transiciones, `ACTIVE_STATUSES`, `canTransition`, `isActive` e `isFinal`.

### 3. Validaciones con internacionalización (`validators.js`)
- **Petición del usuario:** Cómo escribir las validaciones para poder probarlas sin pantallas y hacer que el mensaje de error salga en el idioma del conductor.
- **Respuesta y diseño:**
  - Desacoplamiento de capas: la función validadora es pura y devuelve `null` si el valor es válido o una clave abstracta (ej. `'errors.underage'`, `'errors.plateInvalid'`).
  - La UI traduce en caliente invocando `t(error)` contra `src/i18n/{es,en}.js`, permitiendo cambiar de idioma sin revalidar.
- **Implementación del usuario:** `src/domain/validators.js` cubriendo las reglas **VA-01 a VA-20**, inyección de `today` para determinismo en pruebas, normalización de placas, cálculo de revisión técnico-mecánica ($\ge 5$ años según Ley 769) y validador integral `validateRegistration`.

### 4. Rangos temporales (`dateRanges.js`)
- **Petición del usuario:** Estructuración y revisión de rangos para Ganancias e Historial (**RF-26** y **RF-29**).
- **Implementación del usuario:** `src/domain/dateRanges.js` utilizando intervalos semiabiertos $[start, end)$ (`start <= fecha < end`), cálculo de semana de lunes a domingo con ajuste modular `(getDay() + 6) % 7`, inicio/fin de mes e intervalo personalizado `customRange`.

### 5. Verificación integral (`checkDomain.js` y `expo-doctor`)
- Se resolvieron los requerimientos de resolución ESM en Node agregando extensiones explícitas `.js`.
- Se ejecutó el script de verificación `node src/domain/checkDomain.js` comprobando con exactitud todos los casos de prueba de tarifas, máquina de estados, validaciones de cédula, placa, edad, revisión técnico-mecánica y cálculo de semanas.
- Se ejecutó `npx expo-doctor` obteniendo **20/20 verificaciones pasadas sin errores**.

