import { apiClient } from './client';
import { QuestionResponse } from '../types/patient';
import {
  CreatePatientRequest,
  CreateWeeklyProgramRequest,
  ExerciseItem,
  ExerciseRequest,
  PatientCreatedResponse,
  PatientSummary,
  ReplyQuestionRequest,
  TherapistDashboardSummary,
} from '../types/therapist';

export const therapistApi = {
  getDashboardSummary: async (): Promise<TherapistDashboardSummary> => {
    const { data } = await apiClient.get<TherapistDashboardSummary>(
      '/api/therapist/analytics/summary'
    );
    return data;
  },

  exportSpssCsv: async (): Promise<string> => {
    const { data } = await apiClient.get<string>('/api/therapist/analytics/export/spss.csv', {
      responseType: 'text',
    });
    return data;
  },

  getPatients: async (onlyAtRisk = false): Promise<PatientSummary[]> => {
    const { data } = await apiClient.get<PatientSummary[]>('/api/therapist/patients', {
      params: { onlyAtRisk },
    });
    return data;
  },

  createPatient: async (payload: CreatePatientRequest): Promise<PatientCreatedResponse> => {
    const { data } = await apiClient.post<PatientCreatedResponse>(
      '/api/therapist/patients',
      payload
    );
    return data;
  },

  assignProgram: async (
    patientProfileId: number,
    payload: CreateWeeklyProgramRequest
  ): Promise<void> => {
    await apiClient.post(`/api/therapist/patients/${patientProfileId}/programs`, payload);
  },

  getExercises: async (onlySickModeCare = false): Promise<ExerciseItem[]> => {
    const { data } = await apiClient.get<ExerciseItem[]>('/api/therapist/exercises', {
      params: { onlySickModeCare },
    });
    return data;
  },

  createExercise: async (payload: ExerciseRequest): Promise<ExerciseItem> => {
    const { data } = await apiClient.post<ExerciseItem>('/api/therapist/exercises', payload);
    return data;
  },

  archiveExercise: async (exerciseId: number): Promise<void> => {
    await apiClient.delete(`/api/therapist/exercises/${exerciseId}`);
  },

  getQuestions: async (onlyUnanswered = false): Promise<QuestionResponse[]> => {
    const { data } = await apiClient.get<QuestionResponse[]>('/api/therapist/questions', {
      params: { onlyUnanswered },
    });
    return data;
  },

  replyQuestion: async (
    questionId: number,
    payload: ReplyQuestionRequest
  ): Promise<QuestionResponse> => {
    const { data } = await apiClient.patch<QuestionResponse>(
      `/api/therapist/questions/${questionId}/reply`,
      payload
    );
    return data;
  },
};
