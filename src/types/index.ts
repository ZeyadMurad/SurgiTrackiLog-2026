export type SupportedLanguage = 'en' | 'ar' | 'de';

export interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  country: string;
  medicalQualification: string;
  currentPosition: string;
  specialty: string;
  hospitals: string;
  biography: string;
  profilePhotoUrl?: string;
  role: 'normal_user' | 'super_admin';
  preferredLanguage: SupportedLanguage;
  theme: 'light' | 'dark' | 'system';
  deletedByAdmin?: boolean;
  status?: 'active' | 'deleted';
  emailVerified?: boolean;
  showProgressStats?: boolean;
  showPortfolioToFollowers?: boolean;
  requireApprovalToFollow?: boolean;
  followers?: string[];
  following?: string[];
  pendingFollowRequests?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InvestigationItem {
  name: string;
  category: 'Laboratory' | 'Imaging' | 'Cardiac' | 'Other';
  date: string;
  result: string;
  summary: string;
  attachmentName?: string;
  attachmentUrl?: string;
}

export interface ClinicalCase {
  id: string;
  userId: string;
  traineeId?: string;
  supervisorId?: string; // Linked to a specific supervisor
  supervisorName?: string;
  caseReference: string; // e.g., CAS-2026-001 - Strict anonymity!
  patientAge: number;
  patientSex?: 'Male' | 'Female' | 'Other' | 'Undisclosed';
  presentationDate: string;
  hospital: string;
  department: string;
  specialty: string;

  // 5.2 Clinical History
  chiefComplaint: string;
  historyOfPresentIllness: string;
  durationOfSymptoms: string;
  relevantMedicalHistory: string;
  surgicalHistory: string;
  drugHistory: string;
  allergies: string;
  familyHistory?: string;
  socialHistory?: string;

  // 5.3 Clinical Examination
  examination: {
    general?: string;
    vitals?: string;
    cardiovascular?: string;
    respiratory?: string;
    abdominal?: string;
    neurological?: string;
    local?: string;
    other?: string;
    customEntries?: { title: string; findings: string }[];
  };

  // 5.4 Investigations
  investigations: InvestigationItem[];

  // 5.5 Diagnosis
  primaryDiagnosis: string;
  secondaryDiagnoses?: string;
  differentialDiagnosis?: string;
  icd10Code?: string;
  clinicalAssessment?: string;

  // 5.6 Management
  management: {
    initial?: string;
    medical?: string;
    surgical?: string;
    treatmentPlan?: string;
    outcome?: string;
    complications?: string;
  };

  // 5.7 Surgical Procedure (if applicable)
  surgicalProcedure?: {
    procedureName: string;
    procedureDate: string;
    specialty: string;
    indication: string;
    surgicalApproach: string;
    operativeFindings: string;
    procedureSummary: string;
    anaesthesiaType?: string;
    outcome: string;
    participationRole: 'Observer' | 'Assisted' | 'First Assistant' | 'Second Assistant' | 'Performed Specific Steps Under Direct Supervision' | 'Performed Under Supervision' | 'Other';
  };

  // 5.8 Follow-up
  followUp?: {
    followUpDate?: string;
    clinicalProgress?: string;
    woundStatus?: string;
    complications?: string;
    additionalTreatment?: string;
    finalOutcome?: string;
  };

  // 5.9 Attachments (anonymized clinical educational media)
  attachments?: {
    id: string;
    title: string;
    type: 'clinical_photo' | 'operative_photo' | 'wound_photo' | 'video' | 'document';
    url: string;
    consentConfirmed: boolean;
    uploadedAt: string;
  }[];

  // 5.10 Community & Social Publishing
  isPublished?: boolean;
  publishedAt?: string;
  authorName?: string;
  authorSpecialty?: string;
  authorHospital?: string;
  authorPhotoUrl?: string;
  likesCount?: number;
  likedByUserIds?: string[];
  likedByUsers?: { userId: string; fullName: string; specialty?: string; photoUrl?: string }[];
  commentsCount?: number;
  comments?: CaseComment[];

  createdAt: string;
  updatedAt: string;
}

export interface CaseComment {
  id: string;
  userId: string;
  userName: string;
  userSpecialty?: string;
  userPhotoUrl?: string;
  commentText: string;
  createdAt: string;
}

export interface Supervisor {
  id: string;
  userId: string;
  fullName: string;
  academicDegree: string; // e.g. MD, PhD, FRCS, FEBVS
  academicTitle: string; // e.g. Prof., Dr. med., Priv.-Doz.
  professionalPosition: string; // Consultant Surgeon, Professor of Surgery, Associate Professor, Specialist Surgeon, Senior Registrar, Attending Surgeon
  specialty: string;
  subspecialty?: string;
  department: string;
  hospital: string;
  university?: string;
  country: string;
  email?: string;
  additionalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SurgicalParticipationLevel =
  | 'Observer'
  | 'Assisted'
  | 'First Assistant'
  | 'Second Assistant'
  | 'Scrubbed and Assisted'
  | 'Performed Specific Steps Under Direct Supervision'
  | 'Performed Under Supervision'
  | 'Other';

export interface TrainingRecord {
  id: string;
  userId: string;
  supervisorId: string; // Belongs strictly to this supervisor
  trainingDate: string;
  procedureDate: string;
  hospital: string;
  department: string;
  specialty: string;
  activityType: string; // Operation, Ward Rounds, Outpatient Clinic, Case Discussion, On-Call
  procedureName: string;
  clinicalCaseRef?: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakDurationMinutes: number;
  netTrainingHours: number; // Auto-calculated: (End - Start) - Break
  surgicalExposure: string;
  participationRole: SurgicalParticipationLevel;
  participationGerman?: string; // German legal term
  descriptionOfParticipation: string;
  responsibilities: string;
  surgicalTechniquesObserved?: string;
  surgicalTechniquesPracticed?: string;
  supervisionLevel: 'Direct Supervision' | 'Indirect Supervision' | 'Observational';
  skillsAcquired: string[];
  learningPoints?: string;
  supervisorFeedback?: string;
  additionalNotes?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingSession {
  id: string;
  userId: string;
  supervisorId?: string;
  supervisorName?: string;
  hospital: string;
  department: string;
  trainingDate: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakDurationMinutes: number;
  netTrainingHours: number; // Auto-calculated
  sessionType: 'Theatre' | 'Clinical Ward' | 'Outpatient' | 'Simulation Lab' | 'Academic Teaching' | 'Emergency Call';
  trainingActivities: string;
  skillsPracticed: string[];
  notes?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SkillExposureLevel =
  | 'Observed'
  | 'Assisted'
  | 'Performed Specific Steps Under Direct Supervision'
  | 'Performed Under Direct Supervision'
  | 'Performed Under Supervision'
  | 'Performed Independently'
  | 'Assessed by Supervisor'
  | 'Other';

export type CompetencyStatus =
  | 'Not Yet Assessed'
  | 'Learning'
  | 'Practicing'
  | 'Supervisor Assessed'
  | 'Competent'
  | 'Competency Confirmed'
  | 'Mastered';

export interface UserSkill {
  id: string;
  userId: string;
  traineeId?: string;
  supervisorId?: string; // Linked to a specific supervisor
  supervisorName?: string;
  name: string;
  nameGerman?: string;
  specialty: string;
  category: string; // Basic Surgical, Vascular, Operative Field, Wound Closure, Emergency
  exposureLevel: SkillExposureLevel;
  competencyStatus: CompetencyStatus;
  totalRecordedSessions: number;
  totalDocumentedHours: number;
  lastPracticedDate?: string;
  supervisors: string[];
  hospitals: string[];
  feedbackNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationLetter {
  id: string;
  userId: string;
  supervisorId: string;
  supervisorName: string;
  language: SupportedLanguage;
  title: string;
  letterDate: string;
  recipient: string;
  content: string;
  status: 'draft' | 'finalized';
  createdAt: string;
  updatedAt: string;
}

export interface SurgicalArticle {
  id: string;
  title: string;
  publisher: string;
  category: string;
  publishedDate: string;
  summary: string;
  url: string;
  sourceType: string;
  imageUrl?: string;
  journalImpact?: string;
  readTime?: string;
}

export interface SavedArticle extends SurgicalArticle {
  userId: string;
  savedAt: string;
}

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime?: string;
  syncError?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'general' | 'urgent' | 'clinical' | 'administrative';
  senderEmail: string;
  senderName: string;
  createdAt: string;
  readByUserIds?: string[];
}

export interface NotificationReply {
  id: string;
  notificationId: string;
  notificationTitle: string;
  userId: string;
  userEmail: string;
  userName: string;
  replyMessage: string;
  createdAt: string;
}

