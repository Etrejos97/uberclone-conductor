import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearDriverId, getDriverId, saveDriverId } from '../services/storageService';

const SessionContext = createContext(null);

// La sesión es el id del conductor guardado en el teléfono.
// Con id, la app abre en Inicio; sin id, en el registro.
export function SessionProvider({ children }) {
  const [driverId, setDriverId] = useState(null);
  const [loadError, setLoadError] = useState(null);
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

  // Guardo primero en el teléfono: si falla, el error le llega a quien llamó.
  const startSession = useCallback(async (newDriverId) => {
    await saveDriverId(newDriverId);
    setDriverId(newDriverId);
  }, []);

  // Limpio el estado antes de tocar el teléfono, así la app vuelve al registro
  // aunque AsyncStorage falle.
  const endSession = useCallback(async () => {
    setDriverId(null);
    try {
      await clearDriverId();
    } catch (error) {
      console.warn('No pude borrar la sesión del teléfono:', error?.message);
    }
  }, []);

  const value = useMemo(
    () => ({ driverId, loadError, reloadSession: loadSession, startSession, endSession, loading }),
    [driverId, loadError, loadSession, startSession, endSession, loading]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession debe usarse dentro de SessionProvider');
  return context;
}