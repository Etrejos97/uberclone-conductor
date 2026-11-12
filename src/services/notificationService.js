import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// La solicitud nueva llega como notificación de Firebase Cloud Messaging
// cuando la app está en segundo plano. El backend la envía con firebase-admin al
// token nativo de FCM que guardo en el conductor (fcmToken).

// El canal de Android de las solicitudes. El backend lo nombra en cada mensaje y
// app.config.js lo deja como canal por defecto de FCM.
export const REQUESTS_CHANNEL = 'requests';

// Expo Go en Android no recibe notificaciones remotas desde el SDK 53.
// Cargo el módulo con require dentro de la función, solo en el APK, para que
// Expo Go ni siquiera lo abra. StoreClient es Expo Go o un development build;
// la app no usa development build.
export function pushSupported() {
  return Platform.OS === 'android' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

function loadNotifications() {
  return pushSupported() ? require('expo-notifications') : null;
}

let handlerSet = false;

// Con la app abierta la notificación también se muestra arriba: el conductor
// puede estar en Ganancias, donde Inicio no escucha las solicitudes. En Android,
// sin sonido el aviso no baja de la barra.
function showWhileOpen(Notifications) {
  if (handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Crea el canal, pide el permiso y devuelve el token de FCM. Devuelve null en
// Expo Go o si el conductor no da el permiso. El canal va antes del token: en
// Android 13, sin un canal el sistema no muestra el pedido de permiso. Si el
// conductor ya lo negó del todo, Android no deja volver a preguntar.
export async function getPushToken(channelName) {
  const Notifications = loadNotifications();
  if (!Notifications) return null;
  showWhileOpen(Notifications);
  await Notifications.setNotificationChannelAsync(REQUESTS_CHANNEL, {
    name: channelName,
    importance: Notifications.AndroidImportance.MAX,
  });
  let { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status !== 'granted' && canAskAgain) ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== 'granted') return null;
  const { data } = await Notifications.getDevicePushTokenAsync();
  return data;
}

// FCM puede cambiar el token; el viejo deja de servir. Devuelve la función que
// corta la escucha, para el return del useEffect.
export function subscribeToTokenChanges(onToken) {
  const Notifications = loadNotifications();
  if (!Notifications) return () => {};
  const subscription = Notifications.addPushTokenListener(({ data }) => onToken(data));
  return () => subscription.remove();
}

// El conductor tocó una notificación con la app abierta o en segundo plano. Si
// la app estaba cerrada, abre en Inicio sin ayuda: es la primera pantalla.
export function subscribeToTaps(onTap) {
  const Notifications = loadNotifications();
  if (!Notifications) return () => {};
  const subscription = Notifications.addNotificationResponseReceivedListener((response) =>
    onTap(response.notification.request.content.data ?? {})
  );
  return () => subscription.remove();
}