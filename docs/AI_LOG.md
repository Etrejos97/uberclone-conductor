# Bitácora de uso de IA

Registro cada vez que uso una herramienta de IA en este proyecto: qué le pedí,
qué usé de la respuesta y cómo lo verifiqué. La evidencia es la conversación con el
agente, en docs/ai/. Cada fila entra en el mismo commit que el código.

| # | Fecha | Herramienta | Qué pedí | Qué usé | Cómo lo verifiqué o qué cambié | Evidencia |
|---|---|---|---|---|---|---|
| 1 | 2026-11-03 | Antigravity (Gemini 3.8 Flash) | Conexión de Firebase, dudas sobre apiKey en cliente, revisión de dependencias y configuración de variables de entorno. | Conceptos de apiKey vs reglas, plantilla de `.env.example`, ajuste con `getApps()` en `firebase.js`. | Verificado con `npx expo-doctor` (20/20 pasados), `git status` para confirmar exclusión de `.env`, y revisión de `firestore.rules`. | [Resumen (.md)](ai/01-conexion-firebase.md) · [Exportación (.jsonl)](ai/01-conexion-firebase.jsonl) |
| 2 | 2026-11-03 | Antigravity (Gemini 3.8 Flash) | Centralización de constantes, internacionalización (es/en), manejo de sesión en AsyncStorage y arquitectura completa de navegación con React Navigation. | Estructura de `pricing.js` y `app.js`, `SettingsContext`, `SessionContext`, navegadores (Root, Tabs, Drawer, Stacks), corrección de `EarningsScreen` y `SafeAreaProvider`. | Verificado con `npx expo-doctor` (20/20 pasados), pruebas de importaciones y resolución de módulos en React Navigation. | [Resumen (.md)](ai/02-navegacion-y-contextos-base.md) · [Exportación (.jsonl)](ai/02-navegacion-y-contextos-base.jsonl) |
