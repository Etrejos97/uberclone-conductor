---
titulo: "UberClone Conductor - 02 Diseño"
materia: "Desarrollo Movil"
tipo: "recurso"
fecha: 2026-10-30
estado: "en progreso"
tags: [desarrollo-movil, proyecto-integrador, diseno, arquitectura]
relacionadas: ["[[Recurso - UberClone Conductor - 01 Requisitos]]", "[[Indice - Desarrollo Movil]]"]
---

# UberClone Conductor: diseño del sistema

Segunda fase del ciclo de vida. Los requisitos dicen qué hace la app ([[Recurso - UberClone Conductor - 01 Requisitos]]); aquí defino cómo se construye: las piezas del sistema, cómo se hablan, dónde vive cada dato y qué pasa cuando algo falla. Los identificadores RF, RN, RNF y VA son los de los requisitos.

## 1. Atributos de calidad que guían el diseño

Ordené las prioridades porque varias decisiones se contradicen entre sí y necesito saber cuál gana.

| Prioridad | Atributo | Qué significa en esta app |
|---|---|---|
| 1 | Integridad del dinero | Una tarifa, una comisión o un saldo nunca quedan mal calculados ni se aplican dos veces. |
| 2 | Seguridad de los secretos | Ninguna llave secreta llega al teléfono ni a Git. |
| 3 | Consistencia del viaje | Un viaje nunca salta de estado ni queda en dos estados a la vez, aunque dos acciones choquen. |
| 4 | Costo cero | Todo cabe en planes gratuitos y sin tarjeta. |
| 5 | Mantenibilidad | Las reglas de negocio viven en un solo lugar y se prueban sin abrir la app. |
| 6 | Tiempo real | Solicitudes, estado del viaje y estado del pago aparecen sin recargar. |

## 2. Vista general

El sistema tiene cinco piezas propias o externas. Firestore es la fuente de verdad del estado; el backend solo existe para lo que necesita una credencial secreta.

```mermaid
flowchart LR
    subgraph Telefono["App Expo (React Native)"]
        UI[Pantallas] --> H[Hooks]
        H --> S[Servicios]
        S --> D[Dominio puro]
    end
    S -- "SDK web firebase" --> FS[(Firestore)]
    S -- "fetch HTTPS" --> BE[Backend Express en Render]
    S -- "fetch GET" --> OSRM[OSRM público]
    S -- "fetch POST multipart" --> CL[Cloudinary]
    BE -- "firebase-admin" --> FS
    BE -- "REST + access_token" --> MP[Mercado Pago]
    BE -- "firebase-admin" --> FCM[Firebase Cloud Messaging]
    FCM -. push .-> Telefono
    MP -. "retorno y webhook" .-> BE
```

| Pieza | Responsabilidad | Qué no hace |
|---|---|---|
| App | Interfaz, validaciones, cálculo de tarifa, transiciones del viaje, ubicación, rutas | No guarda secretos ni confirma pagos de Mercado Pago |
| Firestore | Estado de conductores y viajes, tiempo real | No tiene lógica, salvo las reglas de seguridad |
| Backend | Crear la preferencia de pago, confirmar pagos, crear solicitudes desde Postman, enviar push | No duplica el CRUD que la app ya hace contra Firestore |
| OSRM | Distancia, duración y geometría de una ruta | Nada más |
| Cloudinary | Guardar fotos y devolver su URL | Nada más |

## 3. Decisiones de arquitectura

Cada decisión trae la alternativa que descarté y la razón, para poder revisarla si cambian las condiciones.

| ID | Decisión | Alternativa descartada | Por qué |
|---|---|---|---|
| AD-01 | En la app separo cuatro capas: pantallas, hooks, servicios y dominio. Una pantalla nunca importa Firestore ni hace `fetch`. | Lógica dentro de las pantallas | Con la lógica en las pantallas, la misma regla termina copiada en tres lugares y no se puede probar sin la interfaz. |
| AD-02 | Firestore es la fuente de verdad y la app escribe directo con el SDK web. El backend solo atiende lo que necesita un secreto. | Una API REST propia para todo el CRUD | Con una API para todo escribo el doble de código y pierdo el tiempo real de `onSnapshot`, que es justo lo que pide el flujo de solicitudes. |
| AD-03 | Cada cambio de estado del viaje pasa por `runTransaction` y por un mapa de transiciones permitidas en `tripStateMachine.js`. | `updateDoc` directo | El temporizador de 15 s y el botón Aceptar pueden escribir en el mismo instante. La transacción relee el estado y solo una de las dos gana. |
| AD-04 | El vehículo y los documentos van embebidos en el documento del conductor. Los viajes van en una colección raíz `trips` con `driverId`. | Subcolecciones `drivers/{id}/trips` | El vehículo se lee siempre junto al conductor (relación 1 a 1). Los viajes en la raíz permiten que el backend los busque solo por `tripId`, que es lo que devuelve Mercado Pago. |
| AD-05 | Rutas con el servidor público de OSRM. Guardo en el viaje la geometría simplificada (`overview=simplified`). | Directions y Distance Matrix de Google | Google exige facturación con tarjeta. La geometría completa puede traer miles de puntos y acercarse al límite de 1 MiB por documento. |
| AD-06 | La tarifa final usa la distancia y la duración de la ruta cotizada al crear la solicitud. | Medir la distancia real con el GPS | El pasajero acepta el precio que vio. En las pruebas el teléfono no se mueve y el GPS daría 0 km. El GPS también mete ruido que habría que filtrar. |
| AD-07 | El backend confirma un pago consultando a Mercado Pago con su `access_token` y lo aplica una sola vez dentro de una transacción. | Creer en el `status` que llega en la URL de retorno o en el cuerpo del webhook | Cualquiera puede escribir `?status=approved` en una URL o mandar un POST falso. Si consulto el pago con mi llave, el dato viene de Mercado Pago. |
| AD-08 | Las fotos suben directo de la app a Cloudinary con un preset sin firma, limitado a una carpeta y a formatos de imagen, con una transformación de entrada que reduce las fotos a 1600 px como máximo. Cloudinary no deja fijar un peso máximo en el preset, así que la app comprime la foto al elegirla (`quality` 0,6) y rechaza las de más de 5 MB. | Subida firmada a través del backend | La subida firmada es más segura, pero hace que el registro dependa de que el backend esté despierto. El preset restringido limita el abuso posible a subir imágenes a esa carpeta. |
| AD-09 | Estado global con `useContext`: sesión del conductor, preferencias y formulario de registro. | Redux | Tengo tres estados globales y ninguno con lógica compleja. El resto del estado vive en Firestore y llega por hooks. |
| AD-10 | El módulo de notificaciones se carga con `require` dentro de una función, solo si la app no corre en Expo Go. | Importarlo arriba del archivo | `@react-native-firebase/messaging` es un módulo nativo que no existe en Expo Go: importarlo arriba rompe la app al abrirla. |
| AD-11 | Un solo repositorio: la app en la raíz y el backend en `backend/`. Render despliega con "Root Directory" en `backend`. | Dos repositorios | Un cambio que toca el contrato de la API queda en un solo commit, con la app y el backend juntos. |
| AD-12 | Todo el dinero se maneja en pesos enteros y se redondea en un solo punto, dentro de `calculateFare`. | Decimales con redondeo al mostrar | Con decimales, la suma de comisiones del mes puede no cuadrar con la de cada viaje (RN-05). |
| AD-13 | El mapa es Leaflet 1.9.4 dentro de `react-native-webview`, con teselas de OpenStreetMap. Solo `RouteMap` conoce Leaflet: recibe `center`, `markers` y `route` por props y los pasa a la página con `injectJavaScript`. | `react-native-maps` con Google; MapLibre nativo | Google exige una cuenta de facturación para activar la llave del APK. MapLibre no corre en Expo Go y me obligaría a recompilar con EAS en cada cambio nativo. El WebView viene en Expo Go y en el APK funciona igual, sin llave. |

## 4. Estructura del proyecto

```
uberclone-conductor/
├── App.js                      # Proveedores de contexto + RootNavigator
├── app.config.js               # Config de Expo, package de Android y plugins
├── .env.example                # Variables EXPO_PUBLIC_* sin valores
├── firestore.rules             # Reglas de seguridad versionadas
├── src/
│   ├── config/
│   │   ├── pricing.js          # RN-04: base, km, min, mínima, multiplicadores, comisión
│   │   ├── app.js              # Intervalos, tiempos de espera, tamaño de página, URLs desde env
│   │   └── firebase.js         # initializeApp + getFirestore
│   ├── domain/                 # Funciones puras: sin React, sin red, sin Firestore
│   │   ├── fare.js             # calculateFare (RN-01 a RN-06)
│   │   ├── tripStateMachine.js # Transiciones permitidas (RN-09)
│   │   ├── validators.js       # VA-01 a VA-20, devuelven una clave de error o null
│   │   ├── dateRanges.js       # Hoy, semana (lunes a domingo), mes, rango
│   │   └── driverProfile.js    # Formulario validado + URL de fotos → documento del conductor
│   ├── services/
│   │   ├── driverService.js    # CRUD de drivers en Firestore
│   │   ├── tripService.js      # CRUD y transiciones de trips en Firestore
│   │   ├── apiService.js       # fetch al backend, manejo uniforme de errores
│   │   ├── routeService.js     # OSRM: ruta, distancia, duración
│   │   ├── uploadService.js    # Cloudinary
│   │   ├── notificationService.js # Token FCM, carga condicional (AD-10)
│   │   └── storageService.js   # AsyncStorage: sesión y preferencias
│   ├── hooks/
│   │   ├── useDriverLocation.js
│   │   ├── useTripRequests.js
│   │   ├── useActiveTrip.js
│   │   ├── useEarnings.js
│   │   ├── useTripHistory.js
│   │   └── useCountdown.js
│   ├── context/
│   │   ├── SessionContext.js   # driverId + documento del conductor en tiempo real
│   │   ├── SettingsContext.js  # Idioma, última disponibilidad, función t()
│   │   └── RegistrationContext.js # Estado del formulario de las tres pestañas
│   ├── navigation/
│   │   ├── RootNavigator.js
│   │   ├── RegistrationTabs.js
│   │   ├── MainDrawer.js
│   │   ├── TripStack.js
│   │   └── HistoryStack.js
│   ├── screens/                # Una carpeta por módulo: registration, home, trip, payment...
│   ├── components/             # FormField, SelectField, DateField, CheckboxField, PhotoPicker,
│   │                           # FieldError, FormScrollView, formStyles, RequestCard, RouteMap, StatusBadge,
│   │                           # EmptyState, ErrorState, LoadingState
│   └── i18n/
│       ├── es.js
│       ├── en.js
│       └── format.js           # Pesos y kilómetros con los separadores de cada idioma
└── backend/
    ├── package.json
    ├── .env.example
    └── src/
        ├── index.js            # Express, rutas, manejador de errores
        ├── routes/
        │   ├── health.js
        │   ├── payments.js
        │   └── trips.js
        ├── services/
        │   ├── firebaseAdmin.js
        │   ├── mercadoPago.js  # fetch a la API REST de Mercado Pago
        │   ├── paymentConfirmation.js # Confirmación idempotente (AD-07)
        │   └── pushService.js
        └── middleware/
            ├── validate.js
            ├── simulatorKey.js
            └── errorHandler.js
```

**Regla de dependencias:** `screens → hooks → services → domain`, y `config` lo puede leer cualquiera. Ninguna capa importa a la de arriba. `domain/` no importa nada del proyecto salvo `config/`.

## 5. Navegación y pantallas

```mermaid
flowchart TD
    Root{RootNavigator<br/>¿hay driverId en AsyncStorage?}
    Root -- no --> Reg[RegistrationTabs]
    Root -- sí --> Drawer[MainDrawer]
    Reg --> T1[Datos personales]
    Reg --> T2[Vehículo]
    Reg --> T3[Documentos y pagos]
    Drawer --> Home[Inicio]
    Drawer --> Hist[HistoryStack]
    Drawer --> Earn[Ganancias]
    Drawer --> Prof[Perfil]
    Drawer --> Sett[Configuración]
    Drawer --> Sim[Cliente simulado]
    Hist --> HL[Lista] --> HD[Detalle del viaje]
    Home -- "viaje activo" --> Trip[TripStack]
    Trip --> TR[Viaje en curso] --> Pay[Cobro]
```

- **RootNavigator** decide con `SessionContext`. Mientras lee AsyncStorage muestra una pantalla de carga, para no mostrar el registro un instante a un conductor que ya tiene sesión.
- **RegistrationTabs** (RF-01): las tres pestañas comparten `RegistrationContext`. El botón "Enviar registro" está en las tres, y se habilita con un `useMemo` que valida el formulario completo (RF-03).
- **TripStack** se abre sobre el Drawer cuando `useActiveTrip` encuentra un viaje en `accepted`, `driver_arriving`, `in_progress` o `completed`. Si el conductor cierra la app a mitad de un viaje, al abrirla vuelve al viaje: la navegación sale del estado guardado en Firestore, no de la memoria.
- **Cliente simulado** es una pantalla del Drawer (D-01). Elige origen y destino de una lista de puntos fijos de Medellín, categoría, método de pago y propina. Desde la pantalla de Cobro abre el checkout y califica.

## 6. Modelo de datos

```mermaid
erDiagram
    DRIVER ||--o{ TRIP : "driverId"
    DRIVER {
        string fullName
        string documentNumber
        string phone
        string email
        timestamp birthDate
        string gender
        string photoUrl
        map vehicle
        map documents
        string mercadoPagoEmail
        timestamp termsAcceptedAt
        string approvalStatus
        bool isAvailable
        map location
        number balance
        string fcmToken
        timestamp createdAt
    }
    TRIP {
        string driverId
        string status
        string category
        string paymentMethod
        number tip
        map origin
        map destination
        map route
        map pickupRoute
        map estimate
        number fare
        number commission
        number commissionRate
        number driverEarnings
        string paymentStatus
        string paymentId
        string preferenceId
        number rating
        timestamp createdAt
        timestamp completedAt
        timestamp paidAt
    }
```

### `drivers/{driverId}`

| Campo | Tipo | Notas |
|---|---|---|
| `fullName`, `documentNumber`, `phone`, `email`, `gender` | string | VA-02 a VA-07 |
| `birthDate` | timestamp | VA-05 |
| `photoUrl` | string | URL de Cloudinary |
| `vehicle` | map | `category` (`economy`, `xl`, `premium`), `plate`, `brand`, `model`, `year`, `color`, `capacity`, `photoUrl` |
| `documents` | map | `licenseNumber`, `licensePhotoUrl`, `licenseExpiresAt`, `soatPhotoUrl`, `soatExpiresAt`, `techInspectionPhotoUrl`, `techInspectionExpiresAt` (los dos últimos `null` si no aplica) |
| `mercadoPagoEmail` | string | VA-19 |
| `termsAcceptedAt`, `commissionRateAccepted` | timestamp, number | VA-20: guardo qué porcentaje aceptó |
| `approvalStatus` | string | `pending`, `approved`, `rejected`. Solo lo cambia el aprobador desde la consola |
| `isAvailable` | bool | |
| `location` | map | `latitude`, `longitude`, `updatedAt` |
| `balance` | number | Pesos enteros. Solo cambia con `increment()` |
| `fcmToken` | string o null | Solo existe en el APK |
| `createdAt`, `updatedAt` | timestamp | `serverTimestamp()` |

El idioma y la última disponibilidad no van aquí: son preferencias del teléfono y viven en AsyncStorage (RNF-06).

### `trips/{tripId}`

| Campo | Tipo | Quién lo escribe | Notas |
|---|---|---|---|
| `driverId` | string | Creador | |
| `status` | string | App (transacción) y backend (`paid`) | RN-09 |
| `source` | string | Creador | `simulator` o `api` |
| `category`, `paymentMethod`, `tip` | string, string, number | Creador | `paymentMethod`: `mercadopago` o `cash` |
| `origin`, `destination` | map | Creador | `latitude`, `longitude`, `label` |
| `route` | map | App, al recibir la solicitud | `distanceKm`, `durationMin`, `coordinates` (origen a destino) |
| `pickupRoute` | map | App, al aceptar | Lo mismo, de la ubicación del conductor a la recogida |
| `estimate` | map | App, al recibir | `{ fare, commission, driverEarnings }` |
| `fare`, `commission`, `driverEarnings`, `commissionRate` | number | App, al finalizar | Valores finales. `commissionRate` cumple RN-07 |
| `paymentStatus` | string o null | Backend (`pending`, `approved`, `rejected`) o app (`cash`) | |
| `paymentId`, `preferenceId` | string | Solo el backend | |
| `rating` | number o null | Cliente simulado | 1 a 5 |
| `createdAt`, `acceptedAt`, `startedAt`, `completedAt`, `paidAt`, `cancelledAt`, `rejectedAt` | timestamp | Quien hace la transición | |

Las coordenadas de una ruta se guardan como arreglo de mapas `{ latitude, longitude }`, porque Firestore no admite arreglos dentro de arreglos y así `RouteMap` las recibe sin convertir.

### Índices compuestos

| Consulta | Campos del índice |
|---|---|
| Historial y ganancias | `driverId` ↑, `status` ↑, `completedAt` ↓ |
| Historial filtrado por método | `driverId` ↑, `status` ↑, `paymentMethod` ↑, `completedAt` ↓ |

La consulta de solicitudes (`driverId ==` y `status == 'requested'`) solo usa igualdades y no necesita índice; ordeno el resultado en el cliente. Los índices quedan en `firestore.indexes.json`.

### Consultas

| Hook | Consulta | Tipo |
|---|---|---|
| `useTripRequests` | `driverId == id`, `status == 'requested'` | `onSnapshot` |
| `useActiveTrip` | `driverId == id`, `status in [accepted, driver_arriving, in_progress, completed]` | `onSnapshot` |
| `useEarnings` | `driverId == id`, `status == 'paid'`, `completedAt >= inicio` (el inicio de la semana o del mes, el que sea anterior) | `onSnapshot` |
| `useTripHistory` | `driverId == id`, `status == 'paid'`, rango y método opcionales, `orderBy completedAt desc`, `limit 20`, `startAfter(último)` | `getDocs` por página |

El historial y las ganancias muestran solo viajes `paid`: los rechazados y cancelados no movieron dinero. El saldo se guarda en el conductor y no se calcula, porque calcularlo obligaría a leer todos los viajes de su historia.

### Presupuesto del plan gratuito

El plan gratuito de Firestore da 50.000 lecturas y 20.000 escrituras por día. Con la ubicación cada 5 segundos, una hora Disponible son 720 escrituras. Un viaje completo son unas 10 escrituras. Una jornada de pruebas de 4 horas con 20 viajes queda cerca de 3.100 escrituras, el 16 % del cupo.

## 7. Máquina de estados del viaje

```mermaid
stateDiagram-v2
    [*] --> requested: creador
    requested --> accepted: conductor acepta
    requested --> rejected: conductor rechaza o se cumplen 15 s
    accepted --> driver_arriving: ruta de recogida lista
    accepted --> cancelled: conductor cancela
    driver_arriving --> in_progress: Pasajero a bordo
    driver_arriving --> cancelled: conductor cancela
    in_progress --> completed: Finalizar viaje
    completed --> paid: backend confirma Mercado Pago o conductor marca efectivo
    rejected --> [*]
    cancelled --> [*]
    paid --> [*]
```

`tripStateMachine.js` exporta el mapa de transiciones y `canTransition(from, to)`. `tripService.transition(tripId, from, to, cambios)` hace la escritura así:

1. Abre `runTransaction`.
2. Lee el viaje. Si `status !== from`, lanza `TRIP_STATE_CONFLICT` y no escribe.
3. Valida `canTransition(from, to)`.
4. Escribe `status`, la marca de tiempo de la transición y los `cambios`.

Así, si el temporizador rechaza y el conductor acepta en el mismo segundo, la segunda transacción encuentra `status` distinto de `requested` y falla sin tocar nada. La pantalla muestra "Esta solicitud ya no está disponible".

La única transición que hace el backend es `completed → paid` con Mercado Pago, con la misma comprobación dentro de su propia transacción.

## 8. Dominio: tarifa

```js
// src/domain/fare.js
calculateFare({ distanceKm, durationMin, category, tip }) → { fare, commission, driverEarnings }
```

1. `raw = (BASE + distanceKm × PER_KM + durationMin × PER_MIN) × MULTIPLIER[category]`
2. `fare = max(MINIMUM, round(raw / 100) × 100)` (RN-01, RN-02)
3. `commission = round(fare × COMMISSION_RATE)`
4. `driverEarnings = fare − commission + tip` (RN-03)

Valida la entrada: distancia y duración no negativas, categoría conocida y propina entera no negativa. La especificación no fija una propina máxima; el único tope es `Number.isSafeInteger`, porque por encima JavaScript redondea y la propina guardada no sería la escrita. Con una entrada inválida lanza un error y no devuelve un número, porque una tarifa de `NaN` guardada en Firestore es peor que un error visible.

El monto que paga el pasajero es `fare + tip`. La comisión sale solo de la tarifa.

Casos que la función debe cumplir, sacados de las historias de usuario:

| Entrada | Salida esperada |
|---|---|
| 8,5 km, 22 min, `economy`, propina 0 | fare 19.200, commission 3.840, earnings 15.360 |
| 8,5 km, 22 min, `xl`, propina 0 | fare 26.900, commission 5.380, earnings 21.520 |
| 0,5 km, 2 min, `economy` | fare 6.000 (mínima) |

## 9. Contrato del backend

Base: `EXPO_PUBLIC_API_URL`. Todas las respuestas son JSON salvo `/payments/return`. Los errores tienen siempre esta forma:

```json
{ "error": { "code": "TRIP_NOT_COMPLETED", "message": "El viaje todavía no ha terminado." } }
```

| Método y ruta | Entrada | Respuesta correcta | Errores |
|---|---|---|---|
| `GET /health` | | `200 { "status": "ok" }` | |
| `POST /payments/preference` | `{ tripId, amount }` | `201 { preferenceId, checkoutUrl }` | `400` datos inválidos, `404` viaje no existe, `409` el viaje no está `completed`, ya está pagado o `amount` no es `fare + tip`, `502` Mercado Pago falló |
| `GET /payments/return` | Query de Mercado Pago (`payment_id`, `external_reference`) | `200` HTML: "Pago recibido, vuelve a la app" | El HTML dice que el pago quedó pendiente de verificar |
| `POST /payments/webhook` | Notificación de Mercado Pago | `200` en cuanto confirma | `500` si falla, para que Mercado Pago reintente |
| `POST /payments/sync` | `{ tripId }` | `200 { paymentStatus }` | `404`, `502` |
| `POST /trips/simulate` | Cabecera `X-Simulator-Key`; cuerpo `{ driverId, origin, destination, category, paymentMethod, tip }` | `201 { tripId }` | `401` sin llave, `400`, `404` conductor no existe |

**Por qué la app envía `amount` si el backend puede leerlo:** el backend no confía en ese número. Lee el viaje con `firebase-admin` y rechaza con `409` si no coincide con `fare + tip`. El campo sirve para detectar que la app y Firestore no están de acuerdo antes de cobrar.

**`/payments/sync`** busca en Mercado Pago los pagos con `external_reference = tripId` y aplica la misma confirmación. Cubre dos casos: el pasajero cerró el navegador antes del retorno, o el backend corre en mi PC, donde Mercado Pago no puede llamar el webhook. La pantalla de Cobro tiene el botón "Verificar pago" que la llama.

**`/trips/simulate`** existe para crear una solicitud desde Postman con la app en segundo plano y probar la notificación (D-08). La cabecera con una llave del `.env` evita que cualquiera que conozca la URL de Render llene Firestore de viajes.

### Variables de entorno

| Dónde | Variable | ¿Secreta? |
|---|---|---|
| App | `EXPO_PUBLIC_FIREBASE_API_KEY` y el resto de la configuración web de Firebase | No: identifica el proyecto, la protección está en las reglas |
| App | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_OSRM_URL` | No |
| App | `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`, `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | No: el preset está restringido (AD-08) |
| Backend | `MP_ACCESS_TOKEN` | Sí |
| Backend | `FIREBASE_SERVICE_ACCOUNT` (el JSON de la cuenta de servicio en una línea) | Sí |
| Backend | `SIMULATOR_KEY` | Sí |
| Backend | `PUBLIC_BASE_URL`, `PORT` | No |

Todo lo que empieza por `EXPO_PUBLIC_` queda escrito dentro del APK, así que ahí nunca va un secreto.

## 10. Flujos críticos

### 10.1 Solicitud y aceptación

```mermaid
sequenceDiagram
    participant C as Cliente simulado
    participant FS as Firestore
    participant A as App del conductor
    participant R as OSRM
    C->>FS: crea trip status requested
    FS-->>A: onSnapshot (useTripRequests)
    A->>R: route origen a destino
    R-->>A: distancia, duración, geometría
    A->>A: calculateFare
    A->>FS: guarda route y estimate si no existen
    A->>A: muestra tarjeta y cuenta 15 s
    alt acepta antes de 15 s
        A->>FS: transacción requested a accepted
        A->>R: route ubicación actual a recogida
        A->>FS: transacción accepted a driver_arriving con pickupRoute
    else se cumplen 15 s o rechaza
        A->>FS: transacción requested a rejected
    end
```

- **Quién calcula la estimación:** la app del conductor, al recibir la solicitud, y solo si el viaje todavía no tiene `estimate`. Así hay un solo lugar con `calculateFare` y el backend no necesita copiarlo, venga la solicitud del simulador o de Postman.
- **Cuándo escucha:** `useTripRequests` escucha solo con el conductor Disponible y Inicio a la vista, igual que el envío de ubicación. Cada vez que empieza a escuchar, las solicitudes que llevan más de 15 s esperando se rechazan solas. Para las que creó el mismo teléfono cuento desde la hora del teléfono en que las creó y no desde el `createdAt` del servidor: con el reloj del teléfono adelantado, una solicitud recién creada saldría vencida.
- **Varias solicitudes a la vez:** Inicio muestra todas las pendientes como tarjetas, de la más antigua a la más nueva, cada una con su tarifa, su reloj y sus botones Aceptar y Rechazar. El mapa dibuja la ruta de la tarjeta que el conductor toca, o la de la más antigua.
- **Temporizador:** cada solicitud tiene 15 s desde que aparece en el teléfono. `useCountdown` recibe la hora límite de cada una, usa un solo `setInterval` para todas y lo limpia en el `return` del `useEffect` (RNF-10). Calcula lo que falta con la hora del teléfono, porque `setInterval` se atrasa con la app ocupada. Si el reloj llega a cero mientras el conductor acepta, espero el resultado: la solicitud se rechaza solo si aceptar falla.
- **Cotización:** las rutas se piden de a una, de la más antigua a la más nueva. `routeService` deja al menos 1 s entre dos llamadas a OSRM, vengan de la cotización o de la ruta de recogida, para respetar el límite del servidor público (RNF-08). Si la ruta llega pero falla guardar la tarifa, el reintento guarda la misma ruta sin pedirla otra vez, y la tarjeta dice cuál de las dos cosas falló.
- **Aceptar:** cuando la transacción deja el viaje en `accepted`, la app abre la pantalla del viaje. La ruta de recogida y el paso a `driver_arriving` siguen en segundo plano; si fallan, el viaje queda en `accepted` y la pantalla del viaje vuelve a pedir la ruta. Si la transacción pasa del tiempo límite, leo el viaje en el servidor antes de dar el fallo por bueno, porque pudo confirmarse después; si está en `accepted`, abro el viaje igual. Aceptar y Enviar se marcan en un `useRef` antes del primer `await`, así un doble toque no repite la acción.
- **Decisión local:** las transacciones no cambian la caché de Firestore hasta que responde el servidor, así que la tarjeta se esconde apenas el conductor decide, sin esperar el `onSnapshot`. Si el rechazo falla por red, la tarjeta vuelve a la lista con el aviso y el reloj en cero, para que el conductor la rechace otra vez.
- **Reenvío desde el simulador:** el id del viaje se genera en el teléfono antes de escribir, igual que el del conductor. Un reenvío después de un tiempo límite usa el mismo id y primero le pregunta al servidor si el viaje ya existe, para no crear dos.
- **Variante con Postman:** Postman llama `POST /trips/simulate`, el backend crea el viaje y envía el push al `fcmToken` del conductor. Al tocar la notificación, la app abre y sigue el mismo flujo desde `onSnapshot`.

### 10.2 Cobro con Mercado Pago

```mermaid
sequenceDiagram
    participant A as App
    participant FS as Firestore
    participant B as Backend
    participant MP as Mercado Pago
    A->>FS: transacción in_progress a completed con fare final
    A->>B: POST /payments/preference tripId, amount
    B->>FS: lee el viaje y valida estado y monto
    B->>MP: crea preferencia external_reference tripId
    MP-->>B: id, init_point
    B->>FS: paymentStatus pending, preferenceId
    B-->>A: checkoutUrl
    A->>MP: abre el checkout en el navegador
    MP->>B: GET /payments/return con payment_id
    B->>MP: GET pago por id con access_token
    B->>FS: transacción completed a paid e increment del saldo
    MP->>B: POST /payments/webhook
    B->>FS: misma confirmación, ya pagado, no hace nada
    FS-->>A: onSnapshot muestra Aprobado
```

`paymentConfirmation.confirm(paymentId)`:

1. Consulta el pago en Mercado Pago. De la respuesta toma `status`, `external_reference` (el `tripId`) y `transaction_amount`.
2. Abre una transacción y lee el viaje.
3. Si el viaje ya está `paid`, termina sin escribir. Esto hace la función idempotente: el retorno, el webhook y "Verificar pago" pueden llegar en cualquier orden y cualquier número de veces.
4. Si el monto no coincide con `fare + tip`, marca `paymentStatus: 'rejected'` y registra el error en el log.
5. Si el pago está `approved`, escribe `status: 'paid'`, `paymentStatus`, `paymentId`, `paidAt`, y suma `driverEarnings` al saldo del conductor con `increment()` dentro de la misma transacción.
6. Si está `rejected`, escribe `paymentStatus: 'rejected'` y deja el viaje en `completed`, para poder intentar otro pago.

### 10.3 Cobro en efectivo

La app hace la transacción `completed → paid` con `paymentStatus: 'cash'` y resta la comisión del saldo con `increment(-commission)` en la misma transacción (RN-08). Desde un saldo de 0, un viaje de 19.200 deja el saldo en −3.840 (HU-07).

### 10.4 Registro

1. Cada campo valida al perder el foco con la función de `validators.js` y muestra el error debajo (RF-02). Los errores son claves de traducción, para que cambien con el idioma.
2. Al tocar "Enviar registro", la app sube las fotos a Cloudinary en paralelo con `Promise.allSettled`, que espera todas y dice cuál falló.
3. Si alguna subida falla, no escribe nada en Firestore. Muestra el error en la foto que falló y conserva el formulario. Al reenviar, solo sube las fotos que fallaron o que el conductor cambió.
4. Con todas las URL, crea el conductor con `approvalStatus: 'pending'` y `balance: 0`, guarda el `driverId` en AsyncStorage y entra al Drawer.

Subo las fotos al enviar y no al elegirlas para no dejar imágenes huérfanas en Cloudinary cuando alguien abandona el registro.

### 10.5 Ubicación

`useDriverLocation(isSending)` lee la posición actual al abrir Inicio, para centrar el mapa, y arranca `watchPositionAsync` de `expo-location` cuando `isSending` es `true` y el permiso está concedido. Escribe `location` en el conductor con un intervalo mínimo de 5 s y un desplazamiento mínimo de 10 m, los dos en `config/app.js`. `timeInterval` solo funciona en Android, así que el mínimo de 5 s también lo aplica el hook antes de escribir. Una posición que llega antes de tiempo no se descarta: el hook la manda al cumplirse los 5 s, para que un conductor que se detiene no quede en Firestore con la posición anterior. En la limpieza del `useEffect` llama `subscription.remove()` (RF-09).

Inicio pasa `isSending = isAvailable && useIsFocused()`. El Drawer no desmonta Inicio al cambiar de pantalla: con el conductor en Historial o en Ganancias el envío se pausa, y al volver a Inicio se retoma sin tocar el interruptor.

El valor del interruptor es `isAvailable` del conductor en Firestore. Al abrir la app, Inicio vuelve al último estado guardado en AsyncStorage (RF-10). Si la cuenta deja de estar `approved` o se pierde el permiso de ubicación, Inicio escribe `isAvailable: false` sin esperar al conductor, para que nunca quede Disponible alguien que no puede recibir viajes. Cerrar sesión también lo pasa a No disponible y espera la confirmación, porque una escritura en cola se pierde si la app se cierra sin red. Sin red, Ajustes lo avisa y deja salir de todos modos.

Con el permiso negado, la ubicación del teléfono apagada o un error al revisar el permiso o al seguir al conductor (estado `error`), Inicio lo pasa a No disponible y el interruptor queda deshabilitado con el motivo y un botón para pedir el permiso otra vez, abrir los ajustes o reintentar. Al volver de los ajustes la app revisa el permiso de nuevo.

## 11. Seguridad

### Modelo de amenazas

La app no tiene login (D-04), así que Firestore no puede saber quién escribe. La configuración web de Firebase va dentro del APK y cualquiera que la extraiga puede hablar con la base. Con eso presente, protejo lo que más daño haría:

| Amenaza | Defensa |
|---|---|
| Robar el `access_token` de Mercado Pago | Solo existe en el `.env` del backend y en las variables de Render. Nunca en `EXPO_PUBLIC_*` ni en Git |
| Marcar un viaje como pagado con Mercado Pago sin pagar | Las reglas prohíben al cliente escribir `paymentId`, `preferenceId` y cualquier `paymentStatus` distinto de `cash`. Solo el backend, con `firebase-admin`, escribe la confirmación |
| Falsificar el retorno o el webhook | El backend consulta el pago en Mercado Pago con su llave (AD-07) |
| Cobrar un monto alterado | El backend compara contra `fare + tip` leído de Firestore |
| Auto-aprobarse como conductor | Las reglas prohíben al cliente cambiar `approvalStatus` |
| Subirse el saldo desde la app | Las reglas solo dejan que el cliente baje `balance`, que es lo que hace el cobro en efectivo. Lo que lo sube lo escribe el backend |
| Llenar Firestore desde la API pública | `X-Simulator-Key` en `/trips/simulate` |
| Abusar del preset de Cloudinary | Preset limitado a una carpeta y a formatos de imagen, que reduce cada foto a 1600 px. El peso máximo lo revisa la app (AD-08) |

**Riesgo que acepto:** cualquiera con la configuración puede leer los conductores y viajes, y bajarle el saldo a un conductor con un viaje en efectivo falso. Para cerrarlo hace falta identidad. La evolución natural es Firebase Anonymous Authentication: sigue sin pantalla de login, pero da un `uid` por teléfono con el que las reglas pueden exigir `driverId == request.auth.uid`.

### Reglas de Firestore

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function changed() {
      return request.resource.data.diff(resource.data).affectedKeys();
    }

    match /drivers/{driverId} {
      allow read: if true;
      allow create: if request.resource.data.approvalStatus == 'pending'
                    && request.resource.data.balance == 0;
      allow update: if !changed().hasAny(['approvalStatus', 'createdAt'])
                    && (!changed().hasAny(['balance'])
                        || request.resource.data.balance < resource.data.balance);
      allow delete: if false;
    }

    match /trips/{tripId} {
      allow read: if true;
      allow create: if request.resource.data.status == 'requested'
                    && request.resource.data.paymentStatus == null;
      allow update: if !changed().hasAny(['paymentId', 'preferenceId', 'driverId'])
                    && (!changed().hasAny(['paymentStatus'])
                        || request.resource.data.paymentStatus == 'cash')
                    && (!changed().hasAny(['status'])
                        || request.resource.data.status != 'paid'
                        || request.resource.data.paymentStatus == 'cash');
      allow delete: if false;
    }
  }
}
```

`firebase-admin` no pasa por estas reglas, por eso el backend sí puede escribir la confirmación de Mercado Pago y sumarle al saldo la ganancia del viaje. La consola de Firebase tampoco pasa por ellas, y desde ahí el aprobador cambia `approvalStatus`.

## 12. Manejo de fallas

| Falla | Qué detecta la app | Qué ve el conductor | Recuperación |
|---|---|---|---|
| OSRM no responde | `fetch` con `AbortController` y 8 s de espera | "No pude calcular la ruta" en la tarjeta, con "Reintentar". No puede aceptar sin tarifa | Reintento manual; respaldo con OpenRouteService (RF-37) |
| Backend dormido en Render | Llamo `/health` al abrir la app (RNF-16). En el cobro, espera de 60 s | "Conectando con el servidor de pagos…" | Reintento manual |
| Error 4xx del backend | `apiService` lee `error.code` | El mensaje traducido de ese código | Según el código |
| Error 5xx o red | `apiService` | "No pude completar la operación. Intenta de nuevo." | Reintento manual |
| Firestore no confirma en 15 s | `withTimeout` en `setDoc` y en las transacciones | "Revisa la conexión" | Antes de dar el fallo por bueno, aceptar y reenviar una solicitud le preguntan al servidor si la escritura llegó |
| Conflicto de estado del viaje | `TRIP_STATE_CONFLICT` desde la transacción | "Esta solicitud ya no está disponible" | Ninguna: el otro cambio ganó |
| El pasajero cierra el checkout | El viaje sigue en `completed` con `paymentStatus: 'pending'` | Estado "Pendiente" y botón "Verificar pago" | `/payments/sync` |
| Subida a Cloudinary falla | Respuesta distinta de 200 | Error debajo de la foto | Reenviar; el formulario se conserva |
| Permiso de ubicación negado | `requestForegroundPermissionsAsync` | El interruptor deshabilitado con el motivo | Abrir los ajustes del teléfono |
| Sin conexión | Error del SDK de Firestore o de `fetch` | Estado de error de la pantalla (RNF-11) | El SDK reintenta las escrituras mientras la app siga abierta |

`apiService` centraliza los errores: toda llamada devuelve el JSON o lanza un `ApiError` con `status` y `code`. Las pantallas nunca leen `response.status`.

## 13. Internacionalización

`es.js` y `en.js` exportan el mismo objeto de claves. `SettingsContext` expone `t(clave)` y `setLanguage(idioma)`, que guarda en AsyncStorage y cambia el estado: los textos cambian sin reiniciar (HU-10). Los nombres de estados y categorías se traducen en la interfaz. En Firestore siempre quedan en inglés (RNF-14).

## 14. Dependencias

| Paquete | Para qué |
|---|---|
| `firebase` | Firestore con el SDK web |
| `@react-navigation/native`, `native-stack`, `bottom-tabs`, `drawer` | Navegación (RNF-13) |
| `@react-navigation/elements` | `useHeaderHeight`, para que `FormScrollView` deje el espacio justo del teclado bajo el encabezado |
| `@react-native-async-storage/async-storage` | Sesión y preferencias |
| `react-native-webview` | Mapa de Leaflet con la ruta (AD-13) |
| `expo-location` | Ubicación continua |
| `expo-image-picker` | Cámara y galería |
| `expo-file-system` | Leer la foto elegida como archivo para subirla a Cloudinary; el `fetch` de Expo no acepta el objeto `{ uri, type, name }` dentro de `FormData` |
| `expo-web-browser` | Abrir el checkout de Mercado Pago |
| `@react-native-community/datetimepicker` | Fecha de nacimiento y vencimientos |
| `@react-native-picker/picker` | Listas desplegables de género, color y categoría |
| `expo-checkbox` | Casilla de aceptación de términos (VA-20) |
| `@react-native-firebase/app`, `@react-native-firebase/messaging` | Push, solo en el APK |
| Backend: `express`, `dotenv`, `firebase-admin` | Servidor, variables y acceso administrador a Firestore y FCM |

El backend llama a Mercado Pago con `fetch` (Node 18 o superior) en lugar de su SDK, para que cada llamada a la pasarela quede visible en el código.

## 15. Trazabilidad

| Requisitos | Dónde se cumplen |
|---|---|
| RF-01 a RF-06 | `RegistrationTabs`, `RegistrationContext`, `validators.js`, `uploadService`, `driverService` |
| RF-07 a RF-10 | Pantalla Inicio, `useDriverLocation`, `SettingsContext`, `storageService` |
| RF-11 a RF-16 | Cliente simulado, `useTripRequests`, `useCountdown`, `routeService`, `fare.js`, `notificationService`, `/trips/simulate` |
| RF-17 a RF-20 | `TripStack`, `tripStateMachine.js`, `tripService.transition` |
| RF-21 a RF-25 | Pantalla de Cobro, `apiService`, `/payments/*`, `paymentConfirmation` |
| RF-26 a RF-32 | `useEarnings`, `useTripHistory`, `dateRanges.js`, `HistoryStack`, `EmptyState` |
| RF-33 a RF-35 | Perfil y Configuración, `validators.js`, `storageService` |
| RN-01 a RN-08 | `config/pricing.js`, `fare.js`, transacciones de cobro |
| RN-09 | `tripStateMachine.js` |
| RNF-03 a RNF-05 | Sección 9 (variables) y sección 11 |
| RNF-09 | `useTripHistory` con `FlatList`, `keyExtractor` por `id` y páginas de 20 |
| RNF-10 | Limpieza en `useDriverLocation`, `useCountdown` y cada `onSnapshot` |
| RNF-11 | `apiService`, `ErrorState`, `LoadingState` |

## 16. Riesgos técnicos

| ID | Riesgo | Impacto | Cómo lo controlo |
|---|---|---|---|
| R-01 | El servidor de teselas de OpenStreetMap bloquea clientes que no se identifican | Alto: sin mapa no hay Inicio ni viaje | `RouteMap` agrega `UberCloneConductor/1.0` al User-Agent, muestra la atribución y solo pide las teselas que se ven, como exige la política de uso |
| R-02 | Render tarda en despertar | Medio: el primer cobro puede tardar | `/health` al abrir la app y espera de 60 s en el cobro |
| R-03 | El servidor público de OSRM se cae o limita | Medio: no hay tarifa | Respaldo con OpenRouteService detrás de la misma interfaz de `routeService` |
| R-04 | Sin identidad, la base acepta escrituras de cualquiera con la configuración | Medio | Reglas de la sección 11; Anonymous Authentication como evolución |
| R-05 | Las notificaciones solo se pueden probar en el APK | Bajo | Carga condicional (AD-10) y pruebas con `/trips/simulate` |

## 17. Orden de construcción

Cada módulo termina con la app funcionando en Expo Go y un merge de `dev` a `main`.

1. **Base:** proyecto Expo, `config/`, Firebase, navegación vacía, i18n, `SessionContext` y `SettingsContext`.
2. **Dominio:** `fare.js`, `tripStateMachine.js`, `validators.js`, `dateRanges.js`, con los valores y los casos de la sección 8.
3. **Registro:** las tres pestañas, validaciones, Cloudinary, creación del conductor.
4. **Disponibilidad:** Inicio, `RouteMap` con Leaflet, interruptor, ubicación.
5. **Solicitudes:** cliente simulado, `useTripRequests`, OSRM, temporizador, aceptar y rechazar.
6. **Viaje:** `TripStack`, rutas por etapa, cancelar, finalizar.
7. **Backend y cobro:** Express, `/health`, preferencia, confirmación, efectivo, calificación, despliegue en Render.
8. **Ganancias e historial.**
9. **Perfil y configuración.**
10. **Notificaciones:** FCM, `/trips/simulate`, APK final, donde también pruebo el mapa.

## Siguiente fase

Construcción, siguiendo el orden de la sección 17.
