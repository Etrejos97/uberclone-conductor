import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { clearDriverId, getDriverId, saveDriverId } from '../services/storageService';
import { deleteDriver, subscribeToDriver } from '../services/driverService';
import { useSettings } from './SettingsContext';

const SessionContext = createContext(null);

// La sesión es el id del conductor guardado en el teléfono.
// Con id, la app abre en Inicio; sin id, en el ingreso con la cédula.
// `driver` es su documento de Firestore en tiempo real: si el aprobador cambia
// approvalStatus desde la consola, la app lo ve sin recargar.
export function SessionProvider({ children }) {
  const { setLastAvailability } = useSettings();
  const [driverId, setDriverId] = useState(null);
  const [driver, setDriver] = useState(null);
  const [driverError, setDriverError] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [endedReason, setEndedReason] = useState(null);
  // El aviso verde del ingreso cuando el conductor eliminó su propia cuenta.
  const [endedNotice, setEndedNotice] = useState(null);
  // Mientras el conductor elimina su cuenta, el documento que desaparece es el
  // borrado que él pidió y no una cuenta que alguien más quitó.
  const deletingAccount = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);

  // Si no puedo leer el teléfono no mando al ingreso: un conductor que ya
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
    // Leo la sesión guardada al abrir la app: el estado cambia cuando AsyncStorage responde.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSession();
  }, [loadSession]);

  // Guardo primero en el teléfono. Si falla, el error llega al registro, que
  // reintenta con el mismo conductor en vez de crear otro.
  const startSession = useCallback(async (newDriverId) => {
    await saveDriverId(newDriverId);
    deletingAccount.current = false;
    setEndedReason(null);
    setEndedNotice(null);
    setDriverId(newDriverId);
  }, []);

  // Limpio el estado antes de tocar el teléfono, así la app vuelve al ingreso
  // aunque AsyncStorage falle. La disponibilidad guardada era de este
  // conductor: el siguiente que ingrese arranca No disponible.
  const endSession = useCallback(async () => {
    setDriverId(null);
    setDriver(null);
    setDriverError(null);
    setLastAvailability(false);
    try {
      await clearDriverId();
    } catch (error) {
      console.warn('No pude borrar la sesión del teléfono:', error?.message);
    }
  }, [setLastAvailability]);

  const endDeleted = useCallback(() => {
    setEndedReason(null);
    setEndedNotice('settings.accountDeleted');
    endSession();
  }, [endSession]);

  // CRUD, borrar. La escucha del conductor puede ver el borrado antes de que
  // responda la transacción; las dos salidas terminan en el mismo aviso. Solo
  // el tiempo límite deja la duda de si el borrado llegó: ahí dejo la marca
  // puesta para que la escucha lo tome como el borrado que pidió el conductor.
  // Con cualquier otro error la transacción no escribió nada.
  const deleteAccount = useCallback(async () => {
    deletingAccount.current = true;
    try {
      await deleteDriver(driverId);
    } catch (error) {
      if (error?.code !== 'timeout') deletingAccount.current = false;
      throw error;
    }
    endDeleted();
  }, [driverId, endDeleted]);

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
        // vuelvo al ingreso y digo por qué. Solo lo decido con la respuesta del servidor.
        if (!data && !fromCache) {
          if (deletingAccount.current) {
            endDeleted();
          } else {
            setEndedReason('errors.accountGone');
            endSession();
          }
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
  }, [driverId, endSession, endDeleted, attempt]);

  const value = useMemo(
    () => ({
      driverId,
      driver,
      driverError,
      retryDriver,
      loadError,
      reloadSession: loadSession,
      endedReason,
      endedNotice,
      startSession,
      endSession,
      deleteAccount,
      loading,
    }),
    [
      driverId,
      driver,
      driverError,
      retryDriver,
      loadError,
      loadSession,
      endedReason,
      endedNotice,
      startSession,
      endSession,
      deleteAccount,
      loading,
    ]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession debe usarse dentro de SessionProvider');
  return context;
}