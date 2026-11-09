import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { createChunkedStorage, type StorageAdapter } from './chunkedStorage';

export type { StorageAdapter };

/**
 * Adaptador de storage para a sessão do Supabase.
 *
 * Nativo: expo-secure-store com chunking (ver chunkedStorage.ts). O Expo não
 * garante valores grandes (historicamente o iOS recusava mais de ~2048 bytes)
 * e a sessão com JWT passa disso.
 *
 * Web: AsyncStorage (localStorage), somente para desenvolvimento web; o app
 * alvo é Android e iOS.
 */
const nativeStorage = createChunkedStorage({
  get: (k) => SecureStore.getItemAsync(k),
  set: (k, v) => SecureStore.setItemAsync(k, v),
  del: (k) => SecureStore.deleteItemAsync(k),
});

if (Platform.OS === 'web' && !__DEV__) {
  console.warn(
    'MyFluenti: na web a sessão fica no AsyncStorage (localStorage), que não é armazenamento seguro. A web não é plataforma alvo; use Android ou iOS.',
  );
}

export const authStorage: StorageAdapter =
  Platform.OS === 'web' ? AsyncStorage : nativeStorage;
