export type ExerciseLogStatus = 'COMPLETED' | 'SKIPPED' | 'SICK_MODE_DONE';

export interface TodayExerciseItem {
  programItemId: number | null;
  exerciseId: number;
  title: string;
  category: string;
  mediaUrl: string;
  instructions: string;
  requiredMaterial: string | null;
  warningText: string | null;
  orthosisRequirement: string | null;
  isSickModeCare: boolean;
  daysPerWeek: number | null;
  setsPerDay: number | null;
  targetReps: number | null;
  targetDurationSec: number | null;
  todayStatus: ExerciseLogStatus | null;
  todayDifficultyEmoji: number | null;
}

export interface PatientTodayDashboard {
  patientCode: string;
  date: string;
  isSickModeActive: boolean;
  activeProgramName: string | null;
  therapistNote: string | null;
  completedCountToday: number;
  totalCountToday: number;
  exercises: TodayExerciseItem[];
}

export interface LogExerciseRequest {
  programItemId: number | null;
  exerciseId: number;
  status: ExerciseLogStatus;
  appliedOrthosisState?: string | null;
  difficultyEmoji?: number | null;
  skipReason?: string | null;
  parentNote?: string | null;
}

export interface ExerciseLogResponse {
  id: number;
  exerciseId: number;
  exerciseTitle: string;
  logDate: string;
  status: ExerciseLogStatus;
  patientIsAtRisk: boolean;
  patientRiskReason: string | null;
}

export interface SickModeStatusResponse {
  isSickModeActive: boolean;
  activatedDate: string | null;
  deactivatedDate: string | null;
}

export interface AppSessionRequest {
  startedAt: string;
  endedAt: string;
  durationSeconds?: number;
}

export interface AskQuestionRequest {
  questionText: string;
  photoUrl?: string | null;
}

export interface QuestionResponse {
  id: number;
  patientProfileId: number;
  patientCode: string;
  questionText: string;
  photoUrl: string | null;
  therapistReply: string | null;
  therapistAudioUrl: string | null;
  isAnswered: boolean;
  askedAt: string;
  answeredAt: string | null;
}
