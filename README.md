# UberClone Conductor

App del conductor de un servicio de transporte: registro con fotos y documentos,
ingreso con la cédula, disponibilidad con ubicación en tiempo real, solicitudes
con notificaciones, viaje con ruta en el mapa, cobro con Mercado Pago o en
efectivo, ganancias e historial. React Native con Expo SDK 58 y JavaScript,
Firestore, Cloudinary y un backend en Express desplegado en Render.

## Instalar el APK

El APK de Android está en
[Releases](https://github.com/Etrejos97/uberclone-conductor/releases/latest).
Lo descargo en el teléfono, lo abro y permito instalar apps desde el navegador.
Las notificaciones solo llegan en el APK, no en Expo Go.

Para entrar hace falta un conductor aprobado: me registro desde la app y en la
consola de Firebase, **Firestore Database > drivers**, cambio su
`approvalStatus` a `approved`.

## Correr la app en desarrollo

Necesito Node 22 o más nuevo y Expo Go para el SDK 58 en el teléfono.

1. `npm install`
2. Copiar `.env.example` como `.env` y llenar las variables (tabla de abajo).
3. En la consola de Firebase:
   - **Firestore Database > Reglas**: pegar `firestore.rules` y **Publicar**.
   - **Firestore Database > Índices > Compuesto**: crear los dos índices de
     `firestore.indexes.json` sobre la colección `trips`.
4. `npx expo start` y abrir el proyecto con Expo Go. Si no carga en la red,
   `npx expo start --tunnel`.

## Backend

Express en `backend/`. Crea el cobro de Mercado Pago, confirma el pago con la
llave secreta y crea solicitudes de prueba con notificación.

1. `cd backend` y `npm install`
2. Copiar `backend/.env.example` como `backend/.env` y llenar las variables.
3. `npm start`. `GET http://localhost:3000/health` responde `{"status":"ok"}`.

En Render es un Web Service con **Root Directory** `backend`, **Build Command**
`npm install`, **Start Command** `npm start`, las variables de `backend/.env`
menos `PORT` y el health check en `/health`. El plan gratuito apaga el
servicio después de 15 minutos sin tráfico: la primera petición tarda cerca de
un minuto.

| Ruta | Para qué |
|---|---|
| `GET /health` | Despertar el servicio y comprobar que responde |
| `POST /payments/preference` | Crear el checkout de Mercado Pago de un viaje |
| `GET /payments/return`, `POST /payments/webhook`, `POST /payments/sync` | Confirmar el pago con Mercado Pago |
| `POST /trips/simulate` | Crear una solicitud desde Postman y notificar al conductor. Pide la cabecera `X-Simulator-Key`; el cuerpo está en `docs/diseno.md`, sección 9 |

## Variables de entorno

Los valores reales nunca van a Git. Todo lo que empieza por `EXPO_PUBLIC_`
queda dentro de la app, así que ahí no va ningún secreto.

| Variable | Archivo | Qué es |
|---|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID` | `.env` | La configuración web de Firebase: Configuración del proyecto > Tus apps |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`, `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | `.env` | La nube de Cloudinary y su preset sin firma |
| `EXPO_PUBLIC_API_URL` | `.env` | La URL del backend: la de Render, o `http://<IP del PC>:3000` con el backend local |
| `EXPO_PUBLIC_OSRM_URL` | `.env` | El servidor de rutas OSRM; vacía usa el público |
| `MP_ACCESS_TOKEN` | `backend/.env` | El access token de prueba de Mercado Pago |
| `FIREBASE_SERVICE_ACCOUNT` | `backend/.env` | El JSON de la cuenta de servicio de Firebase, en una línea |
| `SIMULATOR_KEY` | `backend/.env` | La llave que pide `POST /trips/simulate` |
| `PUBLIC_BASE_URL` | `backend/.env` | La URL pública del backend, para el retorno y el webhook de Mercado Pago |
| `PORT` | `backend/.env` | El puerto en el PC; Render pone el suyo |
| `GOOGLE_SERVICES_JSON` | expo.dev | `google-services.json` como variable de tipo archivo, solo para EAS Build |

## Compilar el APK

Las variables `EXPO_PUBLIC_` y `GOOGLE_SERVICES_JSON` van en el ambiente
`preview` de expo.dev (`eas env:set`), porque EAS no sube el `.env` ni
`google-services.json`. Después:

```bash
eas build -p android --profile preview
```

## Estado

- Registro en tres pestañas con validación por campo, fotos en Cloudinary y la
  cuenta "Pendiente de aprobación".
- Ingreso con la cédula, sin contraseña.
- Disponibilidad con la ubicación en Firestore mientras Inicio está a la vista.
- Solicitudes con reloj de 15 s, ruta y tarifa con la ganancia neta; aviso por
  notificación en el APK.
- Viaje con ruta a la recogida y al destino, cancelación y finalización.
- Cobro con Mercado Pago Checkout Pro (pruebas) o en efectivo, y calificación.
- Ganancias del día, la semana y el mes, saldo e historial con filtros.
- Perfil, renovación de documentos, idioma español / inglés, cierre de sesión y
  eliminación de la cuenta.
- Cliente simulado dentro de la app para crear y retirar solicitudes.

## Estructura

```text
App.js            fuentes, pantalla de carga y navegación
src/
├── components/   botones, campos, mapa, tarjetas y estados de carga y error
├── config/       Firebase, reglas de negocio y tarifas
├── context/      idioma, sesión y formulario del registro
├── domain/       tarifa, estados del viaje, validaciones, fechas y ganancias (sin React)
├── hooks/        ubicación, solicitudes, viaje, cobro, ganancias e historial
├── i18n/         textos en español e inglés
├── navigation/   stack raíz, pestañas del registro, menú lateral y stacks
├── screens/      una carpeta por pantalla
├── services/     Firestore, Cloudinary, rutas, backend y notificaciones
└── theme.js      colores, fuentes y espacios de toda la app
backend/src/
├── middleware/   validación, llave del simulador y errores
├── routes/       health, payments y trips
└── services/     Firebase Admin, Mercado Pago, confirmación del pago y FCM
docs/             requisitos, diseño y bitácora de IA
```
