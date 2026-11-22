export interface TherapistDashboardSummary {
  totalPatients: number;
  atRiskPatients: number;
  sickModePatients: number;
  unansweredQuestions: number;
}

export interface PatientSummary {
  id?: number;
  patientProfileId?: number;
  patientCode: string;
  gmfcsLevel: string | null;
  cpType: string | null;
  bodyInvolvement?: string | null;
  isSickModeActive: boolean;
  isAtRisk: boolean;
  riskReason: string | null;
  lastActiveAt: string | null;
}

export interface CreatePatientRequest {
  birthDate: string; // YYYY-MM-DD
  gender: string;
  heightCm?: number | null;
  weightKg?: number | null;
  gestationalWeek?: number | null;
  birthWeightGram?: number | null;
  hasNicuHistory?: boolean;
  hasEpilepsy?: boolean;
  hasBotoxHistory?: boolean;
  gmfcsLevel: string;
  cpType: string;
  bodyInvolvement: string;
  assistiveDevices?: string[];
  communicationLevel?: string | null;
  childGameInterest?: string | null;
  caregiverRelation?: string | null;
  parentEducationLevel?: string | null;
  familyIncomeLevel?: string | null;
  accessibleDevices?: string[];
  hasInternet?: boolean;
  appUsageCompetency?: string | null;
}


export interface PatientCreatedResponse {
  patientProfileId: number;
  patientCode: string;
  initialPassword: string;
  gmfcsLevel: string | null;
  cpType: string | null;
}

export interface ExerciseItem {
  id: number;
  title: string;
  category: string;
  difficultyLevel: number;
  mediaUrl: string;
  instructions: string;
  requiredMaterial: string | null;
  warningText: string | null;
  orthosisRequirement: string | null;
  isSickModeCare: boolean;
  createdAt: string;
}

export interface ExerciseRequest {
  title: string;
  category: string;
  difficultyLevel: number;
  mediaUrl: string;
  instructions: string;
  requiredMaterial?: string | null;
  warningText?: string | null;
  orthosisRequirement?: string | null;
  isSickModeCare: boolean;
}

export interface ProgramItemRequest {
  exerciseId: number;
  daysPerWeek: number;
  setsPerDay: number;
  targetReps?: number | null;
  targetDurationSec?: number | null;
  displayOrder?: number;
}

export interface CreateWeeklyProgramRequest {
  programName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  therapistNote?: string | null;
  items: ProgramItemRequest[];
}

export interface ReplyQuestionRequest {
  therapistReply: string;
  therapistAudioUrl?: string | null;
}
