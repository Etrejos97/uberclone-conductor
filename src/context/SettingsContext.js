import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import es from '../i18n/es';
import en from '../i18n/en';
import {
  getLanguage,
  getLastAvailability,
  saveLanguage,
  saveLastAvailability,
} from '../services/storageService';

const DICTIONARIES = { es, en };

const SettingsContext = createContext(null);

// Idioma y última disponibilidad. t(clave, params) devuelve el
// texto en el idioma actual y cambia cada {nombre} por params.nombre. Si la
// clave no existe, devuelve la clave para que se note.
export function SettingsProvider({ children }) {
  const [language, setLanguageState] = useState('es');
  const [lastAvailability, setLastAvailabilityState] = useState(false);
  const [loading, setLoading] = useState(true);

  // Si el teléfono no responde, la app sigue con los valores por defecto
  // (español, no disponible): son preferencias, no datos que se pierdan.
  useEffect(() => {
    async function loadSettings() {
      try {
        const [savedLanguage, savedAvailability] = await Promise.all([
          getLanguage(),
          getLastAvailability(),
        ]);
        if (savedLanguage && DICTIONARIES[savedLanguage]) setLanguageState(savedLanguage);
        setLastAvailabilityState(savedAvailability);
      } catch (error) {
        console.warn('No pude leer las preferencias:', error?.message);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const setLanguage = useCallback(async (newLanguage) => {
    setLanguageState(newLanguage);
    try {
      await saveLanguage(newLanguage);
    } catch (error) {
      console.warn('No pude guardar el idioma:', error?.message);
    }
  }, []);

  const setLastAvailability = useCallback(async (isAvailable) => {
    setLastAvailabilityState(isAvailable);
    try {
      await saveLastAvailability(isAvailable);
    } catch (error) {
      console.warn('No pude guardar la disponibilidad:', error?.message);
    }
  }, []);

  const t = useCallback(
    (key, params) => {
      const text = DICTIONARIES[language][key] ?? key;
      if (!params) return text;
      return text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, lastAvailability, setLastAvailability, t, loading }),
    [language, setLanguage, lastAvailability, setLastAvailability, t, loading]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings debe usarse dentro de SettingsProvider');
  return context;
}