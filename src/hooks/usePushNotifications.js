import { useEffect, useRef } from 'react';
import { saveFcmToken } from '../services/driverService';
import {
  getPushToken,
  pushSupported,
  subscribeToTaps,
  subscribeToTokenChanges,
} from '../services/notificationService';
import { useSession } from '../context/SessionContext';
import { useSettings } from '../context/SettingsContext';

// Con la cuenta aprobada guardo el token de FCM en el conductor, y al
// tocar una notificación vuelvo a Inicio, donde está la solicitud. Pido el
// permiso al entrar a Inicio y no al cambiar el idioma: si el conductor lo negó,
// volver a pedirlo en cada cambio molesta.
export default function usePushNotifications(navigation) {
  const { t } = useSettings();
  const { driverId, driver } = useSession();
  const approved = driver?.approvalStatus === 'approved';
  // Solo escribo si el token cambió: abrir la app no gasta una escritura.
  const savedToken = useRef(null);
  const channelName = useRef(null);
  const fcmToken = driver?.fcmToken ?? null;
  const channel = t('notifications.channel');

  // Va antes del efecto que los lee: React corre los efectos en orden.
  useEffect(() => {
    savedToken.current = fcmToken;
    channelName.current = channel;
  }, [fcmToken, channel]);

  useEffect(() => {
    if (!driverId || !approved || !pushSupported()) return undefined;
    let active = true;
    // null borra el token: si el conductor quitó el permiso, el backend deja de
    // contar como avisado a un teléfono que no muestra nada.
    function save(token) {
      if (!active || token === savedToken.current) return;
      const previous = savedToken.current;
      // Lo marco antes de escribir: la escucha del token puede entregar el mismo
      // valor antes de que Firestore responda.
      savedToken.current = token;
      saveFcmToken(driverId, token).catch((error) => {
        savedToken.current = previous;
        console.warn('No pude guardar el token de notificaciones:', error?.code ?? error?.message);
      });
    }
    getPushToken(channelName.current)
      .then(save)
      .catch((error) => console.warn('No pude activar las notificaciones:', error?.code ?? error?.message));
    const stop = subscribeToTokenChanges(save);
    return () => {
      active = false;
      stop();
    };
  }, [driverId, approved]);

  useEffect(() => subscribeToTaps(() => navigation.navigate('Home')), [navigation]);
}