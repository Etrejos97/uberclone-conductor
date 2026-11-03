import AsyncStorage from '@react-native-async-storage/async-storage';

// Lo único que la app guarda en el teléfono: la sesión y las preferencias (RF-10).
const KEYS = {
  driverId: 'uberclone:driverId',
  language: 'uberclone:language',
  lastAvailability: 'uberclone:lastAvailability',
};

export async function getDriverId() {
  return AsyncStorage.getItem(KEYS.driverId);
}

export async function saveDriverId(driverId) {
  await AsyncStorage.setItem(KEYS.driverId, driverId);
}

export async function clearDriverId() {
  await AsyncStorage.removeItem(KEYS.driverId);
}

export async function getLanguage() {
  return AsyncStorage.getItem(KEYS.language);
}

export async function saveLanguage(language) {
  await AsyncStorage.setItem(KEYS.language, language);
}

export async function getLastAvailability() {
  const value = await AsyncStorage.getItem(KEYS.lastAvailability);
  return value === 'true';
}

export async function saveLastAvailability(isAvailable) {
  await AsyncStorage.setItem(KEYS.lastAvailability, String(isAvailable));
}