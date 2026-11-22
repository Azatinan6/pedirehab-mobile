import { apiClient } from './client';
import {
  AppSessionRequest,
  AskQuestionRequest,
  ExerciseLogResponse,
  LogExerciseRequest,
  PatientTodayDashboard,
  QuestionResponse,
  SickModeStatusResponse,
} from '../types/patient';

export const patientApi = {
  getTodayDashboard: async (): Promise<PatientTodayDashboard> => {
    const { data } = await apiClient.get<PatientTodayDashboard>('/api/patient/dashboard/today');
    return data;
  },

  logExercise: async (payload: LogExerciseRequest): Promise<ExerciseLogResponse> => {
    const { data } = await apiClient.post<ExerciseLogResponse>('/api/patient/logs', payload);
    return data;
  },

  toggleSickMode: async (active: boolean): Promise<SickModeStatusResponse> => {
    const { data } = await apiClient.post<SickModeStatusResponse>('/api/patient/sick-mode', {
      active,
    });
    return data;
  },

  recordSession: async (payload: AppSessionRequest): Promise<void> => {
    await apiClient.post('/api/patient/sessions', payload);
  },

  getQuestions: async (): Promise<QuestionResponse[]> => {
    const { data } = await apiClient.get<QuestionResponse[]>('/api/patient/questions');
    return data;
  },

  askQuestion: async (payload: AskQuestionRequest): Promise<QuestionResponse> => {
    const { data } = await apiClient.post<QuestionResponse>('/api/patient/questions', payload);
    return data;
  },
};
