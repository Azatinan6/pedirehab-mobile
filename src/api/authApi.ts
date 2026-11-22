import { apiClient } from './client';
import { AuthResponse, LoginRequest } from '../types/auth';

export const authApi = {
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/api/auth/login', payload);
    return data;
  },
};
