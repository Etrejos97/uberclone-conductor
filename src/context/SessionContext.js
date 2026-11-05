import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearDriverId, getDriverId, saveDriverId } from '../services/storageService';
import { subscribeToDriver } from '../services/driverService';

const SessionContext = createContext(null);

// La sesión es el id del conductor guardado en el teléfono.
// Con id, la app abre en Inicio; sin id, en el registro.
// `driver` es su documento de Firestore en tiempo real: si el aprobador cambia
// approvalStatus desde la consola, la app lo ve sin recargar.
export function SessionProvider({ children }) {
  const [driverId, setDriverId] = useState(null);
  const [driver, setDriver] = useState(null);
  const [driverError, setDriverError] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [endedReason, setEndedReason] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);

  // Si no puedo leer el teléfono no mando al registro: un conductor que ya
  // está registrado crearía una cuenta duplicada. Muestro el error con Reintentar.
  const loadSession = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setDriverId(await getDriverId());
    } catch (error) {
      console.warn('No pude leer la sesión:', error?.message);
      setLoadError('errors.sessionReadFailed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Guardo primero en el teléfono. Si falla, el error llega al registro, que
  // reintenta con el mismo conductor en vez de crear otro.
  const startSession = useCallback(async (newDriverId) => {
    await saveDriverId(newDriverId);
    setEndedReason(null);
    setDriverId(newDriverId);
  }, []);

  // Limpio el estado antes de tocar el teléfono, así la app vuelve al registro
  // aunque AsyncStorage falle.
  const endSession = useCallback(async () => {
    setDriverId(null);
    setDriver(null);
    setDriverError(null);
    try {
      await clearDriverId();
    } catch (error) {
      console.warn('No pude borrar la sesión del teléfono:', error?.message);
    }
  }, []);

  // Firestore cierra la escucha después de un error. Cambiar `attempt` vuelve
  // a ejecutar el efecto y la abre de nuevo.
  const retryDriver = useCallback(() => {
    setDriverError(null);
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!driverId) return undefined;
    const unsubscribe = subscribeToDriver(
      driverId,
      (data, fromCache) => {
        setDriverError(null);
        // Un id guardado que ya no existe en Firestore no abre ninguna cuenta:
        // vuelvo al registro y digo por qué. Solo lo decido con la respuesta del servidor.
        if (!data && !fromCache) {
          setEndedReason('errors.accountGone');
          endSession();
          return;
        }
        setDriver(data);
      },
      (error) => {
        console.warn('Falló la escucha del conductor:', error?.code ?? error?.message);
        setDriverError('errors.driverLoadFailed');
      }
    );
    return unsubscribe;
  }, [driverId, endSession, attempt]);

  const value = useMemo(
    () => ({
      driverId,
      driver,
      driverError,
      retryDriver,
      loadError,
      reloadSession: loadSession,
      endedReason,
      startSession,
      endSession,
      loading,
    }),
    [driverId, driver, driverError, retryDriver, loadError, loadSession, endedReason, startSession, endSession, loading]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession debe usarse dentro de SessionProvider');
  return context;
}