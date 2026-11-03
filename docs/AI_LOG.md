# Bitácora de uso de IA

Registro cada vez que uso una herramienta de IA en este proyecto: qué le pedí,
qué usé de la respuesta y cómo lo verifiqué. La evidencia es la conversación con el
agente, en docs/ai/. Cada fila entra en el mismo commit que el código.

| # | Fecha | Herramienta | Qué pedí | Qué usé | Cómo lo verifiqué o qué cambié | Evidencia |
|---|---|---|---|---|---|---|
| 1 | 2026-11-03 | Antigravity (Gemini 3.8 Flash) | Conexión de Firebase, dudas sobre apiKey en cliente, revisión de dependencias y configuración de variables de entorno. | Conceptos de apiKey vs reglas, plantilla de `.env.example`, ajuste con `getApps()` en `firebase.js`. | Verificado con `npx expo-doctor` (20/20 pasados), `git status` para confirmar exclusión de `.env`, y revisión de `firestore.rules`. | [Resumen (.md)](ai/01-conexion-firebase.md) · [Exportación (.jsonl)](ai/01-conexion-firebase.jsonl) |
