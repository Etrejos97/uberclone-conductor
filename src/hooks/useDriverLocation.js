import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import * as Location from 'expo-location';
import { LOCATION_DISTANCE_M, LOCATION_INTERVAL_MS } from '../config/app';
import { updateLocation } from '../services/driverService';
import { useSession } from '../context/SessionContext';

function toCoords(location) {
  return { latitude: location.coords.latitude, longitude: location.coords.longitude };
}

// Ubicación del conductor.
// `status` es 'checking' mientras revisa el permiso, 'ready' si puede leer la
// ubicación, 'denied' sin permiso, 'servicesOff' con la ubicación del teléfono
// apagada y 'error' si no pudo revisar el permiso o el seguimiento se cayó. Con
// cualquier estado distinto de 'ready', Inicio pasa al conductor a No disponible.
// La posición para el mapa se lee siempre; seguir al conductor y escribir en
// Firestore solo pasa mientras `isSending` es true.
export default function useDriverLocation(isSending) {
  const { driverId } = useSession();
  const [status, setStatus] = useState('checking');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [position, setPosition] = useState(null);
  // La última posición conocida puede ser vieja. Esto dice que ya pasó la lectura
  // actual, para quien necesita calcular una ruta desde aquí.
  const [positionReady, setPositionReady] = useState(false);
  const [error, setError] = useState(null);
  const lastSentAt = useRef(0);

  // Con `ask` muestra el diálogo del sistema; sin él solo revisa el permiso.
  const check = useCallback(async (ask) => {
    try {
      const permission = ask
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();
      setCanAskAgain(permission.canAskAgain);
      if (!permission.granted) {
        setStatus('denied');
        return;
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        setStatus('servicesOff');
        return;
      }
    } catch (reason) {
      console.warn('No se pudo revisar el permiso de ubicación:', reason?.message);
      setStatus('error');
      return;
    }
    setStatus('ready');
    setError(null);
    // Con el permiso listo, una posición que no llega no bloquea al conductor:
    // solo lo aviso, y el seguimiento la trae después.
    try {
      // La última posición conocida llega al instante; la actual puede tardar.
      const last = await Location.getLastKnownPositionAsync();
      if (last) setPosition(toCoords(last));
      setPosition(toCoords(await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })));
      setPositionReady(true);
    } catch (reason) {
      console.warn('No se pudo leer la ubicación:', reason?.message);
      setError('errors.locationFailed');
      // Sin lectura actual, la última conocida es lo mejor que hay.
      setPositionReady(true);
    }
  }, []);

  useEffect(() => {
    check(true);
  }, [check]);

  // Si el conductor vuelve de los ajustes del teléfono, reviso otra vez sin preguntar.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check(false);
    });
    return () => subscription.remove();
  }, [check]);

  // Lo que hace el botón debajo del interruptor: pedir el permiso otra vez o,
  // si el sistema ya no deja preguntar, abrir los ajustes de la app. Con
  // 'error', revisar otra vez vuelve a arrancar el seguimiento.
  const fix = useCallback(() => {
    if (status === 'denied' && !canAskAgain) Linking.openSettings();
    else check(true);
  }, [status, canAskAgain, check]);

  useEffect(() => {
    if (status !== 'ready') return undefined;
    let subscription = null;
    let cancelled = false;
    let pending = null;
    let timer = null;

    function send(coords) {
      lastSentAt.current = Date.now();
      updateLocation(driverId, coords)
        .then(() => setError(null))
        .catch((reason) => {
          console.warn('No se pudo guardar la ubicación:', reason?.code ?? reason?.message);
          setError('errors.locationSaveFailed');
        });
    }

    function handlePosition(location) {
      const coords = toCoords(location);
      // En el mapa local se actualiza siempre para seguir al conductor en pantalla.
      setPosition(coords);
      setPositionReady(true);

      // A Firestore solo se envía si el conductor está disponible y con sesión.
      if (!isSending || !driverId) return;

      // timeInterval solo funciona en Android: en iOS el mínimo de 5 s lo pongo
      // aquí. La posición que llega antes de tiempo no se pierde: la mando
      // cuando se cumplen los 5 s, por si el conductor se detiene ahí.
      const wait = LOCATION_INTERVAL_MS - (Date.now() - lastSentAt.current);
      if (wait <= 0) {
        send(coords);
        return;
      }
      pending = coords;
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          send(pending);
        }, wait);
      }
    }

    // El conductor no puede seguir Disponible con la ubicación congelada.
    function handleError(message) {
      if (cancelled) return;
      console.warn('Falló el seguimiento de la ubicación:', message);
      setStatus('error');
    }

    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: LOCATION_INTERVAL_MS,
        distanceInterval: LOCATION_DISTANCE_M,
      },
      handlePosition,
      handleError
    )
      .then((started) => {
        // Si la limpieza corrió mientras el seguimiento arrancaba, lo apago apenas llega.
        if (cancelled) started.remove();
        else subscription = started;
      })
      .catch((reason) => handleError(reason?.message));

    // Al pasar a No disponible o salir de Inicio se corta el envío.
    return () => {
      cancelled = true;
      subscription?.remove();
      clearTimeout(timer);
      // Un envío fallido deja de importar cuando ya no estoy enviando.
      setError((current) => (current === 'errors.locationSaveFailed' ? null : current));
    };
  }, [isSending, status, driverId]);

  return { status, canAskAgain, position, positionReady, error, fix };
}