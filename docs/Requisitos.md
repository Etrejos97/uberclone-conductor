---
titulo: "UberClone Conductor - 01 Requisitos"
materia: "Desarrollo Movil"
tipo: "recurso"
fecha: 2026-10-30
estado: "en progreso"
tags: [desarrollo-movil, proyecto-integrador, requisitos]
relacionadas: ["[[2026-11-12 - Actividad - Proyecto]]", "[[Indice - Desarrollo Movil]]"]
---

# UberClone Conductor: requisitos

Primera fase del ciclo de vida de la app. Aquí defino qué debe hacer la app, sin decidir todavía cómo se construye: eso va en la fase de diseño.

## La app

UberClone Conductor es una app móvil para Android e iOS, inspirada en Uber, desde el lado del conductor. El conductor se registra con sus datos, su vehículo y sus documentos, se pone disponible, recibe solicitudes de viaje en tiempo real, lleva al pasajero, cobra con Mercado Pago o en efectivo y consulta sus ganancias netas después de la comisión de la plataforma.

## Decisiones de alcance

| ID | Decisión |
|---|---|
| D-01 | No construyo app de pasajero. Una pantalla de prueba hace de cliente: crea el viaje en estado `requested` y paga en el checkout que abre la misma app. |
| D-02 | La base de datos es Firestore con el SDK web de `firebase`. |
| D-03 | Las fotos van a Cloudinary (plan gratuito), porque Firebase Storage puede exigir el plan de pago Blaze. |
| D-04 | La app no tiene login. La sesión es el id del conductor guardado en AsyncStorage al registrarse: si existe, la app abre en Inicio; si no, en el registro. |
| D-05 | La pasarela es Mercado Pago Checkout Pro con cuentas y tarjetas de prueba. |
| D-06 | El backend de pagos es Node.js con Express. Descarto Cloud Functions porque desplegarlas exige el plan de pago Blaze, y no voy a registrar tarjeta en Firebase. |
| D-07 | El cliente simulado fija la propina al crear la solicitud y califica el viaje después del pago. |
| D-08 | Desarrollo en Expo Go y pruebo las notificaciones al final, en el APK, porque Expo Go no recibe notificaciones push en Android. Para probar con la app en segundo plano, creo la solicitud con Postman contra el backend. |
| D-09 | Calculo rutas, distancias y duraciones con el servicio `route` del servidor público de OSRM, con `fetch` y sin llave. Descarto Directions y Distance Matrix de Google porque exigen activar facturación con tarjeta. Pido la geometría en GeoJSON para dibujar la ruta sin decodificar polilíneas. |
| D-10 | El backend de pagos corre en el plan gratuito de Render, que no pide tarjeta. En desarrollo corre en mi PC y el teléfono lo alcanza por la IP de la red WiFi. |
| D-11 | Trabajo en la rama `dev` y hago merge a `main` cuando un módulo funciona. No uso Pull Requests. |
| D-12 | Muestro el mapa con Leaflet dentro de un WebView y teselas de OpenStreetMap. Descarto `react-native-maps` porque en el APK necesita una llave de Maps SDK for Android, y Google exige una cuenta de facturación para activarla. |

## Actores

- **Conductor**: único usuario de la app.
- **Cliente simulado**: la pantalla de prueba de D-01. Pide el viaje, paga, deja propina y califica.
- **Backend de pagos**: servidor Express que crea el cobro con la llave secreta y confirma el resultado con Mercado Pago.
- **Pasarela**: Mercado Pago, en modo de prueba.
- **Aprobador**: quien cambia a mano el estado de la cuenta en Firestore.

## Requisitos funcionales

Prioridad: **Alta** si la app no cumple su propósito sin él, **Media** si el flujo principal funciona sin él, **Baja** si es opcional.

### Registro

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El registro tiene tres pestañas con navegación Tab: Datos personales, Vehículo, Documentos y pagos. | Alta |
| RF-02 | Cada campo se valida con las reglas de la tabla de validaciones, y el error aparece debajo del campo, nunca en un `Alert`. | Alta |
| RF-03 | El botón "Enviar registro" se habilita solo cuando las tres pestañas están completas y válidas. | Alta |
| RF-04 | Al enviar, la cuenta queda en estado "Pendiente de aprobación". | Alta |
| RF-05 | El conductor no puede ponerse Disponible hasta que su cuenta pase a "Aprobado". | Alta |
| RF-06 | Las fotos de perfil, vehículo y documentos se toman con la cámara o se eligen de la galería, se suben a Cloudinary y en Firestore guardo su URL. | Alta |

### Disponibilidad y ubicación

| ID | Requisito | Prioridad |
|---|---|---|
| RF-07 | La pantalla Inicio muestra el mapa con la ubicación actual y un interruptor Disponible / No disponible. | Alta |
| RF-08 | Mientras el conductor está Disponible, la app actualiza su ubicación en Firestore cada pocos segundos. | Alta |
| RF-09 | El envío de ubicación se detiene al pasar a No disponible o al salir de la pantalla. | Alta |
| RF-10 | La app recuerda el idioma y el último estado de disponibilidad entre aperturas. | Media |

### Solicitudes

| ID | Requisito | Prioridad |
|---|---|---|
| RF-11 | La pantalla de prueba crea un viaje `requested` con origen, destino, categoría, método de pago y propina. | Alta |
| RF-12 | La solicitud llega en tiempo real y muestra origen, destino, distancia, duración, categoría, método de pago, tarifa estimada y ganancia neta estimada. | Alta |
| RF-13 | La solicitud tiene un temporizador de 15 segundos; si llega a cero, se rechaza sola. | Alta |
| RF-14 | El conductor acepta (`accepted`) o rechaza (`rejected`) la solicitud. | Alta |
| RF-15 | Si la app está en segundo plano, el conductor recibe una notificación de la solicitud nueva con `@react-native-firebase/messaging`. Esto solo funciona en un build propio (el APK o un development build), no en Expo Go. | Alta |
| RF-16 | La app calcula distancia y duración con OSRM dos veces por viaje: al crear la solicitud y al aceptarla. Convierte los metros a km y los segundos a minutos antes de pasarlos a `calculateFare`. | Alta |

### Viaje en curso

| ID | Requisito | Prioridad |
|---|---|---|
| RF-17 | Al aceptar, la app dibuja la ruta al punto de recogida con la geometría que devuelve OSRM y el viaje pasa a `driver_arriving`. | Alta |
| RF-18 | Al tocar "Pasajero a bordo", el viaje pasa a `in_progress` y la ruta cambia hacia el destino. | Alta |
| RF-19 | Al tocar "Finalizar viaje", el viaje pasa a `completed` y la app calcula la tarifa final con la misma función de la estimación. | Alta |
| RF-20 | Antes de `in_progress`, el conductor puede cancelar el viaje y este pasa a `cancelled`. | Media |

### Cobro

| ID | Requisito | Prioridad |
|---|---|---|
| RF-21 | Para cobrar con Mercado Pago, la app envía el `tripId` y el monto al backend, el backend crea la preferencia de pago, la app abre Checkout Pro y el cliente simulado paga con una tarjeta de prueba. | Alta |
| RF-22 | Cuando Mercado Pago devuelve a la URL de retorno, el backend consulta el pago en Mercado Pago y guarda `paymentStatus`, `paymentId` y `status: paid` en el viaje. | Alta |
| RF-23 | En pago en efectivo, el conductor marca el cobro como recibido y el viaje pasa a `paid`. Si Mercado Pago rechazó el pago, el conductor también puede cobrarlo en efectivo y el viaje queda como pago en efectivo. | Alta |
| RF-24 | La pantalla de cobro muestra tarifa final, comisión, ganancia neta y estado del pago (Aprobado, Pendiente, Rechazado o Efectivo), y se actualiza en tiempo real. | Alta |
| RF-25 | Después del pago, el cliente simulado califica el viaje de 1 a 5 y el viaje guarda el `rating`. | Media |

### Ganancias e historial

| ID | Requisito | Prioridad |
|---|---|---|
| RF-26 | La pantalla Ganancias muestra, para hoy, la semana y el mes: número de viajes, total facturado, comisiones, propinas, ganancia neta y promedio por viaje. | Alta |
| RF-27 | La app muestra el saldo del conductor: ganancias de viajes pagados con Mercado Pago menos comisiones de viajes en efectivo. Puede quedar negativo. | Alta |
| RF-28 | El historial lista los viajes del más reciente al más antiguo y carga 20 por vez. | Alta |
| RF-29 | El historial filtra por Hoy, Semana, Mes, Rango de fechas y método de pago. | Alta |
| RF-30 | Cada viaje de la lista muestra fecha y hora, origen → destino, categoría, tarifa, ganancia neta y estado del pago. | Alta |
| RF-31 | El detalle de un viaje dibuja la ruta guardada y muestra duración, distancia, comisión, propina y calificación del pasajero. | Media |
| RF-32 | Si no hay viajes en el filtro elegido, la app muestra un mensaje en lugar de una lista en blanco. | Alta |

### Perfil

| ID | Requisito | Prioridad |
|---|---|---|
| RF-33 | El conductor edita sus datos, su vehículo y sus documentos. | Media |
| RF-34 | El conductor cambia el idioma entre español e inglés. | Media |
| RF-35 | El conductor cierra sesión: la app borra el id guardado y vuelve al registro. Como no hay login, la cuenta anterior queda en Firestore pero el teléfono ya no la abre. | Media |

### Opcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-36 | Convertir coordenadas en dirección con Nominatim. | Baja |
| RF-37 | Usar OpenRouteService como respaldo cuando el servidor público de OSRM no responda. | Baja |
| RF-38 | Pago dividido real entre plataforma y conductor. | Baja |

## Reglas de negocio

| ID | Regla |
|---|---|
| RN-01 | Tarifa = max(Mínima, (Base + km × Valor km + min × Valor min) × Multiplicador de categoría). |
| RN-02 | La tarifa se redondea al múltiplo de 100 COP más cercano antes de calcular la comisión. |
| RN-03 | Comisión = Tarifa × 0,20. Ganancia neta = Tarifa − Comisión + Propina. La propina va completa al conductor. |
| RN-04 | Base 3.500, valor por km 1.200, valor por minuto 250, mínima 6.000, multiplicadores 1,0 / 1,4 / 1,8 (Económico / XL / Premium), comisión 20 %. Todos viven en `src/config/pricing.js`. |
| RN-05 | Todos los valores son pesos colombianos enteros. |
| RN-06 | Una sola función pura `calculateFare({ distanceKm, durationMin, category, tip })` devuelve `{ fare, commission, driverEarnings }`, y la uso tanto en la estimación como en el cierre. |
| RN-07 | Cada viaje guarda el `commissionRate` aplicado, para que un cambio de porcentaje no altere el historial. |
| RN-08 | En efectivo, la plataforma no recibe el dinero, así que la comisión se descuenta del saldo del conductor. |
| RN-09 | Un viaje solo avanza así: `requested → accepted → driver_arriving → in_progress → completed → paid`. Desde `requested` puede ir a `rejected`, y antes de `in_progress` a `cancelled`. |

## Validaciones del registro

| ID | Campo | Regla |
|---|---|---|
| VA-01 | Foto de perfil | Obligatoria, de cámara o galería. |
| VA-02 | Nombre completo | Solo letras y espacios, máximo 50 caracteres. |
| VA-03 | Documento de identidad | Numérico, de 6 a 10 dígitos. |
| VA-04 | Celular | Numérico, 10 dígitos. |
| VA-05 | Fecha de nacimiento | Selector de fecha; mayor de 18 años. |
| VA-06 | Género | Lista desplegable. |
| VA-07 | Correo | Formato con @ y dominio. |
| VA-08 | Idioma | Español o inglés. |
| VA-09 | Categoría | Económico, XL o Premium. |
| VA-10 | Placa | Formato ABC123; la paso a mayúsculas antes de validar. |
| VA-11 | Marca y modelo | Texto, máximo 30 caracteres cada uno. |
| VA-12 | Año | 4 dígitos, desde 2010 y no mayor al año actual. |
| VA-13 | Color | Lista desplegable. |
| VA-14 | Capacidad | Entero según la categoría: Económico y Premium exigen 4, XL de 6 a 8. |
| VA-15 | Foto del vehículo | Obligatoria; debe verse la placa. |
| VA-16 | Licencia | Número de 6 a 10 dígitos (en Colombia es el de la cédula), foto y vencimiento posterior a hoy. |
| VA-17 | SOAT | Foto; vencimiento posterior a hoy y como máximo un año después del día anterior al registro, que es lo que dura un SOAT comprado ese día. |
| VA-18 | Revisión técnico-mecánica | Foto y vencimiento posterior a hoy. La pido cuando el vehículo tiene 5 años o más contados desde el año del modelo (Ley 769 de 2002, art. 52, para carros particulares). |
| VA-19 | Correo de Mercado Pago | Formato de correo válido. |
| VA-20 | Términos | Checkbox obligatorio, con el porcentaje de comisión visible. |

Ningún campo puede quedar vacío.

## Requisitos no funcionales

| ID | Tipo | Requisito |
|---|---|---|
| RNF-01 | Plataforma | React Native con Expo, en JavaScript, para Android e iOS. |
| RNF-02 | Distribución | Publico un APK de Android. |
| RNF-03 | Seguridad | El `access_token` de Mercado Pago vive solo en el backend, en un `.env` que no subo a Git. El repo trae un `.env.example` con los nombres sin valores. |
| RNF-04 | Seguridad | Uso solo credenciales de prueba en todo el proyecto. |
| RNF-05 | Privacidad | No guardo números de cuenta ni de tarjeta en la app ni en AsyncStorage. |
| RNF-06 | Persistencia | AsyncStorage guarda solo preferencias y sesión; todo lo demás va a Firestore. |
| RNF-07 | Costo | Me quedo en los planes gratuitos y no registro tarjeta de crédito en Firebase. |
| RNF-08 | Uso justo | Llamo a OSRM solo en los dos momentos de RF-16 y al cambiar de etapa del viaje, nunca dentro de un ciclo ni con cada cambio de ubicación, porque el servidor público admite una solicitud por segundo como máximo. El detalle del historial dibuja la ruta guardada en el viaje sin volver a pedirla. |
| RNF-09 | Rendimiento | El historial usa `FlatList` con el `id` del viaje como llave y consultas de 20 en 20. |
| RNF-10 | Recursos | El seguimiento de ubicación, el temporizador y las suscripciones en tiempo real se cancelan en la función de limpieza del `useEffect`. |
| RNF-11 | Errores | Cada pantalla que consulta datos muestra su estado de carga y de error. Ante un 4xx o 5xx la app muestra un mensaje que el conductor entienda. |
| RNF-12 | Código | Uso `useState`, `useEffect` con limpieza, `useContext` o Redux, `useMemo` para los totales, `useCallback` para aceptar y rechazar, y los hooks `useDriverLocation`, `useTripRequests` y `useEarnings`. |
| RNF-13 | Navegación | Stack para el viaje, Tabs para el registro y Drawer para perfil, historial, ganancias y configuración. |
| RNF-14 | Datos | Los nombres de colecciones y campos en Firestore van en inglés, y cada documento lleva `createdAt` para ordenar. |
| RNF-15 | Proceso | Trabajo en la rama `dev` y hago merge a `main` al terminar cada módulo, con la app probada en Expo Go. |
| RNF-16 | Disponibilidad | El backend expone `GET /health`. Render apaga el servicio gratuito tras 15 minutos sin tráfico y tarda en despertar, así que la app llama a `/health` al abrirse para que el backend esté despierto cuando el conductor cobre. |

## Historias de usuario

**HU-01. Registrarme** (RF-01 a RF-06)
Como conductor quiero registrar mis datos, mi vehículo y mis documentos para que aprueben mi cuenta.
- Si dejo vacío el nombre y paso a otro campo, veo el error debajo del nombre y ningún `Alert`.
- Con la placa `abc123` el campo queda válido y se guarda `ABC123`.
- Con categoría XL y capacidad 4, veo un error en capacidad y "Enviar registro" sigue deshabilitado.
- Con categoría Económico y capacidad 5, veo el mismo error. Con capacidad 4 el campo queda válido.
- Con una fecha de nacimiento de hace 17 años, el campo muestra un error.
- Con las tres pestañas válidas se habilita el botón, y al enviar veo "Pendiente de aprobación".

**HU-02. Ponerme disponible** (RF-05, RF-07 a RF-10)
Como conductor aprobado quiero ponerme Disponible para recibir viajes.
- Con la cuenta pendiente, el interruptor no cambia y veo el motivo.
- Mientras estoy Disponible y me muevo, mi ubicación en Firestore cambia sin que toque nada.
- Al pasar a No disponible, no llegan más actualizaciones.
- Si cierro y abro la app, el idioma y el último estado se conservan.

**HU-03. Simular una solicitud** (RF-11)
Como desarrollador quiero crear una solicitud de prueba para probar el flujo sin app de pasajero.
- Al crearla, aparece en Firestore un viaje `requested` con origen, destino, categoría, método de pago y propina.

**HU-04. Decidir una solicitud** (RF-12 a RF-16)
Como conductor quiero ver los datos del viaje antes de aceptarlo para decidir si me conviene.
- Con 8,5 km, 22 min, Económico y sin propina, la tarjeta muestra tarifa 19.200 y ganancia 15.360.
- Si no toco nada en 15 segundos, el viaje queda `rejected` y la tarjeta desaparece.
- Al aceptar, el viaje queda `accepted`.
- Con la app en segundo plano, llega una notificación de la solicitud nueva.

**HU-05. Llevar al pasajero** (RF-17 a RF-20)
Como conductor quiero ver la ruta en cada etapa del viaje para llegar sin perderme.
- Tras aceptar, veo la ruta a la recogida y el estado `driver_arriving`.
- Al tocar "Pasajero a bordo", la ruta apunta al destino y el estado es `in_progress`.
- Al finalizar, el estado es `completed` y la tarifa final coincide con `calculateFare`.
- En `in_progress` el botón de cancelar ya no aparece.

**HU-06. Cobrar con Mercado Pago** (RF-21, RF-22, RF-24, RF-25)
Como conductor quiero cobrar con Mercado Pago para no manejar efectivo.
- Al pagar con una tarjeta de prueba aprobada, el viaje queda `paid` con `paymentId`, y mi pantalla de cobro muestra "Aprobado" sin recargar.
- Con una tarjeta de prueba rechazada, veo "Rechazado" y el viaje no pasa a `paid`.
- Busco la llave secreta en el código de la app y no aparece.
- Después del pago, el cliente simulado califica con 4 y el viaje guarda `rating: 4`.

**HU-07. Cobrar en efectivo** (RF-23, RF-27)
Como conductor quiero registrar un pago en efectivo para que cuente en mis ganancias.
- Con saldo 0, al cobrar en efectivo un viaje de 19.200, mi saldo queda en −3.840.

**HU-08. Ver mis ganancias** (RF-26, RF-27)
Como conductor quiero ver cuánto gané hoy, esta semana y este mes.
- Con dos viajes pagados hoy, uno Económico (19.200) y uno XL (26.900), sin propinas: 2 viajes, facturado 46.100, comisiones 9.220, ganancia neta 36.880, promedio 18.440.

**HU-09. Consultar mi historial** (RF-28 a RF-32)
Como conductor quiero revisar mis viajes anteriores.
- El primer viaje de la lista es el más reciente.
- Con 25 viajes, la primera carga trae 20 y los otros 5 llegan al bajar.
- Con el filtro "efectivo", todos los viajes de la lista tienen método de pago efectivo.
- En un día sin viajes, veo un mensaje en lugar de la lista vacía.

**HU-10. Editar mi perfil** (RF-33 a RF-35)
Como conductor quiero actualizar mis datos y el idioma.
- Al cambiar a inglés, los textos de la app cambian sin reiniciarla.
- Al editar el perfil se aplican las mismas validaciones del registro.
- Al cerrar sesión, vuelvo al registro y AsyncStorage queda sin el id del conductor.

## Preguntas abiertas

Ninguna.

## Siguiente fase

Diseño: [[Recurso - UberClone Conductor - 02 Diseno]].
