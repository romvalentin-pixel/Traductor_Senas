import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// SecureStore no está disponible en web; se usa AsyncStorage como fallback
// para que la app también pueda probarse en el navegador durante el desarrollo.
async function secureStoreAvailable(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (await secureStoreAvailable()) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

export async function getSecureItem(key: string): Promise<string | null> {
  if (await secureStoreAvailable()) {
    return SecureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(key);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (await secureStoreAvailable()) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  await AsyncStorage.removeItem(key);
}
