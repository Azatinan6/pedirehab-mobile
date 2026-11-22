import * as SecureStore from 'expo-secure-store';
import { BASE_URL, TOKEN_KEY } from './client';

export const mediaApi = {
  uploadMedia: async (uri: string, mimeType: string, fileName: string): Promise<string> => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);

    const response = await fetch(`${BASE_URL}/api/media/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Medya yükleme başarısız oldu.');
    }

    const data = (await response.json()) as { url: string };
    return data.url;
  },
};
