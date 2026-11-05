# UberClone Conductor

App del conductor de un servicio de transporte: registro con fotos y
documentos, disponibilidad con ubicación, solicitudes de viaje, cobro e
historial. React Native con Expo SDK 58, JavaScript, Firestore y Cloudinary.

## Cómo correrla

1. `npm install`
2. Copiar `.env.example` como `.env` y llenar las variables de Firebase y Cloudinary.
3. Publicar `firestore.rules` en la consola de Firebase (Firestore Database > Reglas).
4. `npx expo start` y abrir el proyecto con Expo Go (SDK 58). Si no carga en
   la red, `npx expo start --tunnel`.

## Estado

- Registro en tres pestañas con validación por campo, fotos en Cloudinary y
  creación del conductor en Firestore como "Pendiente de aprobación".
- Cambio de idioma español / inglés y cierre de sesión.

## Estructura

src/
├── components/   campos del formulario y estados de carga y error
├── config/       Firebase, reglas de negocio y tarifas
├── context/      idioma, sesión y formulario del registro
├── domain/       tarifa, estados del viaje, validaciones y fechas (sin React)
├── i18n/         textos en español e inglés
├── navigation/   stack raíz, pestañas del registro, menú lateral y viaje
├── screens/      una carpeta por pantalla
└── services/     Firestore, Cloudinary y AsyncStorage

## Uso de IA

Construí la app con ayuda del agente de Antigravity en VS Code. Cada uso está en `docs/AI_LOG.md`,
con su evidencia en `docs/ai/`.