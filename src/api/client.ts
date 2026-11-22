import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const TOKEN_KEY = 'pedirehab_jwt_token';
export const USER_KEY = 'pedirehab_user_info';

// iOS Simulator doğrudan localhost:8080 görür; Android Emulator 10.0.2.2 kullanır
export const BASE_URL = 'http://192.168.1.101:8080';


// Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Her API isteğinden önce şifreli kasadaki JWT token'ı başlığa ekler
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
