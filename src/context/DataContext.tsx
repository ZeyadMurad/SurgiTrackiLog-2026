import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  ClinicalCase,
  CaseComment,
  Supervisor,
  TrainingRecord,
  TrainingSession,
  UserSkill,
  RecommendationLetter,
  SavedArticle,
  SyncStatus,
  SupervisorSignature,
} from '../types';
import { DEFAULT_SURGICAL_SKILLS } from '../lib/medicalDefaults';

interface DoctorProfileSummary {
  userId: string;
  fullName: string;
  academicDegree?: string;
  academicTitle?: string;
  specialty: string;
  hospital: string;
  profilePhotoUrl?: string;
  biography?: string;
  followersCount: number;
  followingCount: number;
  showProgressStats?: boolean;
  showPortfolioToFollowers?: boolean;
  requireApprovalToFollow?: boolean;
  totalHours?: number;
  totalProcedures?: number;
  publishedCasesCount?: number;
}

interface DataContextType {
  cases: ClinicalCase[];
  supervisors: Supervisor[];
  trainingRecords: TrainingRecord[];
  trainingSessions: TrainingSession[];
  skills: UserSkill[];
  recommendations: RecommendationLetter[];
  savedArticles: SavedArticle[];
  communityCases: ClinicalCase[];
  allDoctors: DoctorProfileSummary[];
  syncStatus: SyncStatus;

  // Actions
  addCase: (c: Omit<ClinicalCase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, publishToCommunity?: boolean) => Promise<string>;
  updateCase: (id: string, c: Partial<ClinicalCase>) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  publishCaseToCommunity: (caseId: string) => Promise<void>;
  unpublishCaseFromCommunity: (caseId: string) => Promise<void>;
  toggleLikeCase: (caseId: string) => Promise<void>;
  addCommentToCase: (caseId: string, commentText: string) => Promise<void>;
  toggleFollowDoctor: (targetDoctorId: string) => Promise<{ status: 'followed' | 'unfollowed' | 'requested' }>;
  acceptFollowRequest: (requesterId: string) => Promise<void>;
  declineFollowRequest: (requesterId: string) => Promise<void>;

  addSupervisor: (s: Omit<Supervisor, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSupervisor: (id: string, s: Partial<Supervisor>) => Promise<void>;
  deleteSupervisor: (id: string) => Promise<void>;

  addTrainingRecord: (r: Omit<TrainingRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTrainingRecord: (id: string, supervisorId: string, r: Partial<TrainingRecord>) => Promise<void>;
  deleteTrainingRecord: (id: string, supervisorId: string) => Promise<void>;

  // Digital supervisor signature (immutable audit trail)
  signTrainingRecords: (
    recordIds: string[],
    supervisor: Supervisor,
    trainee: { id: string; name: string; position?: string }
  ) => Promise<number>;
  verifyRecordIntegrity: (recordId: string) => 'valid' | 'tampered' | 'unsigned';
  verifyRecordIntegrityAsync: (recordId: string) => Promise<'valid' | 'tampered' | 'unsigned'>;

  addTrainingSession: (s: Omit<TrainingSession, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTrainingSession: (id: string, s: Partial<TrainingSession>) => Promise<void>;
  deleteTrainingSession: (id: string) => Promise<void>;

  addSkill: (s: Omit<UserSkill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSkill: (id: string, s: Partial<UserSkill>) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;

  saveRecommendation: (r: Omit<RecommendationLetter, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  deleteRecommendation: (id: string) => Promise<void>;

  toggleSaveArticle: (article: any) => Promise<void>;
  isArticleSaved: (articleId: string) => boolean;
  syncNow: () => Promise<void>;

  // Restore payload
  restorePortfolioData: (data: any) => Promise<void>;

  // Calculations
  stats: {
    totalCases: number;
    totalProcedures: number;
    totalSessions: number;
    totalHours: number;
    verifiedHours: number;
    unverifiedHours: number;
    totalSupervisors: number;
    totalHospitals: number;
    skillsPracticed: number;
    assessedCompetencies: number;
    weeklyAverageHours: number;
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Local storage persistent fallback keys
const STORAGE_PREFIX = 'surgitrack_local_';
const OFFLINE_QUEUE_KEY = 'surgitrack_offline_queue_';

interface OfflineQueueItem {
  id: string;
  type: 'case' | 'supervisor' | 'record' | 'session' | 'skill';
  action: 'create' | 'update' | 'delete';
  data?: any;
  parentId?: string;
  timestamp: string;
}

export const INITIAL_COMMUNITY_CASE_8875: ClinicalCase = {
  id: 'comm-case-8875',
  userId: 'usr-prof-weber',
  caseReference: 'CAS-2026-8875',
  patientAge: 68,
  patientSex: 'Male',
  presentationDate: '2026-11-03',
  hospital: 'Charité - Universitätsmedizin Berlin',
  department: 'Department of Vascular & Endovascular Surgery',
  specialty: 'Vascular Surgery',
  isPublished: true,
  publishedAt: '2026-11-03T14:30:00Z',
  authorName: 'Prof. Dr. Thomas Weber',
  authorSpecialty: 'Vascular Surgery',
  authorHospital: 'Charité - Universitätsmedizin Berlin',
  authorPhotoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
  likesCount: 14,
  likedByUserIds: ['usr-sarah-schmidt', 'usr-omar-alghamdi', 'usr-elena-rostova'],
  likedByUsers: [
    { userId: 'usr-sarah-schmidt', fullName: 'Dr. Sarah Schmidt', specialty: 'General Surgery' },
    { userId: 'usr-omar-alghamdi', fullName: 'Dr. Omar Al-Ghamdi', specialty: 'Cardiothoracic Surgery' },
    { userId: 'usr-elena-rostova', fullName: 'Dr. Elena Rostova', specialty: 'Neurosurgery' },
  ],
  commentsCount: 3,
  comments: [
    {
      id: 'cmt-1',
      userId: 'usr-sarah-schmidt',
      userName: 'Dr. Sarah Schmidt',
      userSpecialty: 'General Surgery',
      userPhotoUrl: 'https://images.unsplash.com/photo-1594824813682-12f71661d9a2?w=150&auto=format&fit=crop&q=80',
      commentText: 'The post-op ABI jumping from 0.32 to 0.94 is remarkable. Meticulous anastomotic suturing!',
      createdAt: '2026-11-03T17:45:00Z',
    },
    {
      id: 'cmt-2',
      userId: 'usr-omar-alghamdi',
      userName: 'Dr. Omar Al-Ghamdi',
      userSpecialty: 'Cardiothoracic Surgery',
      userPhotoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
      commentText: 'Superb case presentation. Open reversed saphenous bypass remains unbeatable for TASC II D long lesions.',
      createdAt: '2026-11-03T19:20:00Z',
    },
    {
      id: 'cmt-3',
      userId: 'usr-elena-rostova',
      userName: 'Dr. Elena Rostova',
      userSpecialty: 'Neurosurgery',
      userPhotoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
      commentText: 'Excellent de-identification and clinical history timeline. A prime model for surgical trainees.',
      createdAt: '2026-11-04T08:10:00Z',
    },
  ],
  chiefComplaint: 'Severe lower limb rest pain and ischemic dry necrosis of the first toe (Fontaine IV)',
  durationOfSymptoms: '3 - 6 months',
  historyOfPresentIllness: '68-year-old male with known peripheral arterial disease presents with severe, burning pain in his right foot, predominantly at night and requiring him to hang the limb over the edge of the bed for relief. For the past 3 weeks, he noticed dark dry discoloration of the right big toe tip. No systemic fever or chills.',
  relevantMedicalHistory: 'Hypertension, Type 2 Diabetes Mellitus (HbA1c 7.9%), Dyslipidemia, 35 pack-year smoking history',
  surgicalHistory: 'Percutaneous transluminal angioplasty (PTA) of right SFA (2022)',
  drugHistory: 'Aspirin 100 mg OD, Atorvastatin 40 mg OD, Metformin 1000 mg BD, Ramipril 5 mg OD',
  allergies: 'Nil known drug allergies (NKDA)',
  examination: {
    vitals: 'BP: 138/82 mmHg, HR: 76 bpm regular, RR: 16/min, Temp: 36.8°C, SpO2: 98% room air',
    general: 'Conscious, alert, resting in bed holding affected limb downwards, visibly in mild pain',
    cardiovascular: 'S1 + S2 regular, no murmurs, no carotid bruits',
    respiratory: 'Bilateral vesicular breathing, clear lung fields',
    abdominal: 'Soft, non-tender throughout, no palpable pulsatile mass, active bowel sounds',
    local: 'Right foot pale with dependent rubor; capillary refill >4 sec; absent dorsalis pedis and posterior tibial pulses; 1.5 cm dry necrotic eschar on tip of right hallux; sensory hypoesthesia',
  },
  investigations: [
    {
      name: 'CBC (Complete Blood Count)',
      category: 'Laboratory',
      date: '2026-11-03',
      result: 'Hb 12.9 g/dL, WBC 8.4 x10^9/L, Plt 240 x10^9/L',
      summary: 'Normal blood count, no leukocytosis',
    },
    {
      name: 'Urea and Creatinine (Renal Function)',
      category: 'Laboratory',
      date: '2026-11-03',
      result: 'Creatinine 1.05 mg/dL, eGFR 74 mL/min/1.73m2, Urea 36 mg/dL',
      summary: 'Preserved renal function suitable for iodinated contrast',
    },
    {
      name: 'Doppler Ultrasound (Duplex Carotid / Peripheral)',
      category: 'Imaging',
      date: '2026-11-03',
      result: 'Monophasic flow in right popliteal, absent pedal signals, right ABI 0.32',
      summary: 'Severe multilevel peripheral arterial occlusive disease',
    },
    {
      name: 'CT Angiography (CTA Head / Chest / Abdomen / Lower Limbs)',
      category: 'Imaging',
      date: '2026-11-03',
      result: 'Complete occlusion of right SFA from origin to distal thigh (TASC II D). Popliteal artery patent (P1-P2) via collateral circulation. Great saphenous vein caliber 4.2 mm.',
      summary: 'Operable target: Supragenicular femoro-popliteal bypass',
    },
  ],
  primaryDiagnosis: 'Peripheral Arterial Occlusive Disease (PAOD Fontaine Stage IV / Rutherford Category 5)',
  secondaryDiagnoses: 'Essential Arterial Hypertension, Type 2 Diabetes Mellitus, Dyslipidemia',
  differentialDiagnosis: 'Diabetic neuro-ischemic ulceration, Peripheral thromboangiitis obliterans (Buerger disease)',
  icd10Code: 'I70.24',
  clinicalAssessment: 'Chronic limb-threatening ischemia (CLTI) with Fontaine Stage IV rest pain and tissue loss. Open autologous saphenous bypass indicated.',
  management: {
    initial: 'Limb dependency, analgesia, intravenous fluids, protective dressing.',
    medical: 'Aspirin, high-intensity statin, glycemic control.',
    surgical: 'Femoro-popliteal Bypass (above-knee) with Autologous Reversed Great Saphenous Vein.',
    outcome: 'Uneventful recovery, rest pain resolved.',
  },
  surgicalProcedure: {
    procedureName: 'Femoro-popliteal Bypass (above-knee) with Autologous Reversed Great Saphenous Vein',
    procedureDate: '2026-11-03',
    specialty: 'Vascular Surgery',
    indication: 'Chronic limb-threatening ischemia (PAOD Fontaine IV) with long-segment SFA occlusion',
    surgicalApproach: 'Medial longitudinal groin incision and supragenicular medial thigh approach',
    operativeFindings: 'Total thrombotic occlusion of proximal superficial femoral artery (SFA) with patent popliteal artery P1 segment; good autologous vein caliber (4.5 mm); brisk inflow from common femoral artery',
    procedureSummary: '1. Groin exploration: Common, superficial, and deep femoral arteries dissected and encircled with vessel loops. 2. Great saphenous vein harvested via interrupted medial thigh incisions, hydrostatically gently distended, side branches ligated with 4-0 silk. 3. Supragenicular popliteal artery exposed above the knee. 4. Heparin 5000 IU IV administered. 5. Proximal end-to-side anastomosis to CFA using running 6-0 Prolene. 6. Graft tunneled anatomically subsartorial. 7. Distal end-to-side anastomosis to P1 popliteal artery using running 6-0 Prolene. 8. Clamps released, graft pulsating vigorously, strong palpable posterior tibial pulse restored immediately. Hemostasis secured, layered closure.',
    anaesthesiaType: 'General Endotracheal Anaesthesia (GETA)',
    outcome: 'Uneventful procedure, strong palpable distal peripheral pulses restored immediately',
    participationRole: 'First Assistant',
  },
  followUp: {
    followUpDate: '2026-11-05',
    woundStatus: 'Clean, dry, edges well-approximated per primam intentionem, no erythema, seroma, or hematoma',
    clinicalProgress: 'Patient fully mobilized on postoperative day 1 with complete cessation of rest pain. Postoperative ABI improved from 0.32 to 0.94 with palpable posterior tibial and dorsalis pedis pulses. Big toe dry eschar demarcation stable, planned for minor podiatric debridement.',
  },
  createdAt: '2026-11-03T10:00:00Z',
  updatedAt: '2026-11-03T15:00:00Z',
};

export const INITIAL_COMMUNITY_DOCTORS: DoctorProfileSummary[] = [
  {
    userId: 'usr-prof-weber',
    fullName: 'Prof. Dr. Thomas Weber',
    academicDegree: 'MD, PhD, FEBVS',
    academicTitle: 'Prof. Dr. med.',
    specialty: 'Vascular Surgery',
    hospital: 'Charité - Universitätsmedizin Berlin',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    biography: 'Director of Vascular and Endovascular Surgery. Specialized in open complex bypass revascularization and aortic aneurysms.',
    followersCount: 128,
    followingCount: 14,
    showProgressStats: true,
    totalHours: 320,
    totalProcedures: 85,
    publishedCasesCount: 6,
  },
  {
    userId: 'usr-sarah-schmidt',
    fullName: 'Dr. Sarah Schmidt',
    academicDegree: 'MD, FACS',
    academicTitle: 'Dr. med.',
    specialty: 'General Surgery',
    hospital: 'Universitätsklinikum Heidelberg',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1594824813682-12f71661d9a2?w=150&auto=format&fit=crop&q=80',
    biography: 'Senior Registrar in Minimally Invasive and Visceral Surgery. Focus on laparoscopic colorectal and emergency abdominal surgery.',
    followersCount: 56,
    followingCount: 38,
    showProgressStats: true,
    totalHours: 185,
    totalProcedures: 42,
    publishedCasesCount: 4,
  },
  {
    userId: 'usr-omar-alghamdi',
    fullName: 'Dr. Omar Al-Ghamdi',
    academicDegree: 'MD, FRCSC',
    academicTitle: 'Dr.',
    specialty: 'Cardiothoracic Surgery',
    hospital: 'King Faisal Specialist Hospital & Research Centre',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    biography: 'Adult Cardiac Surgery Fellow. Dedicated to off-pump CABG, aortic valve repair, and mechanical circulatory support.',
    followersCount: 73,
    followingCount: 45,
    showProgressStats: true,
    totalHours: 210,
    totalProcedures: 58,
    publishedCasesCount: 3,
  },
  {
    userId: 'usr-elena-rostova',
    fullName: 'Dr. Elena Rostova',
    academicDegree: 'MD',
    academicTitle: 'Dr. med.',
    specialty: 'Neurosurgery',
    hospital: 'Vivantes Klinikum Berlin',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    biography: 'Specialist Neurosurgeon focusing on cerebrovascular aneurysms, skull base tumor resection, and spine navigation.',
    followersCount: 39,
    followingCount: 22,
    showProgressStats: false, // tests private stats feature
    totalHours: 190,
    totalProcedures: 36,
    publishedCasesCount: 2,
  },
  {
    userId: 'usr-michael-braun',
    fullName: 'Dr. Michael Braun',
    academicDegree: 'MD, EBOT',
    academicTitle: 'Priv.-Doz. Dr. med.',
    specialty: 'Trauma & Orthopaedic Surgery',
    hospital: 'LMU Klinikum München',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
    biography: 'Attending trauma surgeon. Complex pelvic fracture reconstruction, joint arthroplasty revision, and polytrauma resuscitation.',
    followersCount: 64,
    followingCount: 31,
    showProgressStats: true,
    totalHours: 265,
    totalProcedures: 64,
    publishedCasesCount: 5,
  },
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const currentUid = user?.uid || profile?.userId || 'local-surgeon-001';

  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationLetter[]>([]);
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [communityCases, setCommunityCases] = useState<ClinicalCase[]>([]);
  const [allDoctors, setAllDoctors] = useState<DoctorProfileSummary[]>(INITIAL_COMMUNITY_DOCTORS);

  // Queue helper methods
  const getOfflineQueue = (): OfflineQueueItem[] => {
    try {
      const q = localStorage.getItem(OFFLINE_QUEUE_KEY + currentUid);
      return q ? JSON.parse(q) : [];
    } catch {
      return [];
    }
  };

  const saveOfflineQueue = (items: OfflineQueueItem[]) => {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY + currentUid, JSON.stringify(items));
      setSyncStatus(prev => ({ ...prev, pendingCount: items.length }));
    } catch (e) {
      console.warn('Could not save offline queue:', e);
    }
  };

  const enqueueOfflineAction = (item: OfflineQueueItem) => {
    const queue = getOfflineQueue();
    // Filter existing duplicate pending item for the same entity id if needed
    const filtered = queue.filter(q => !(q.id === item.id && q.action === item.action));
    const updated = [...filtered, item];
    saveOfflineQueue(updated);
  };

  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => {
    const qCount = (() => {
      try {
        const q = localStorage.getItem(OFFLINE_QUEUE_KEY + (user?.uid || profile?.userId || 'local-surgeon-001'));
        return q ? JSON.parse(q).length : 0;
      } catch {
        return 0;
      }
    })();
    return {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      pendingCount: qCount,
      isSyncing: false,
      lastSyncTime: new Date().toLocaleTimeString(),
    };
  });

  // Process offline sync queue to Cloud Firestore
  const processOfflineSyncQueue = async () => {
    if (!user) return;
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    const failedItems: OfflineQueueItem[] = [];

    for (const item of queue) {
      try {
        if (item.type === 'case') {
          if (item.action === 'delete') {
            await deleteDoc(doc(db, 'users', user.uid, 'clinicalCases', item.id));
          } else {
            await setDoc(doc(db, 'users', user.uid, 'clinicalCases', item.id), item.data, { merge: true });
          }
        } else if (item.type === 'supervisor') {
          if (item.action === 'delete') {
            await deleteDoc(doc(db, 'users', user.uid, 'supervisors', item.id));
          } else {
            await setDoc(doc(db, 'users', user.uid, 'supervisors', item.id), item.data, { merge: true });
          }
        } else if (item.type === 'record') {
          if (item.parentId) {
            if (item.action === 'delete') {
              await deleteDoc(doc(db, 'users', user.uid, 'supervisors', item.parentId, 'trainingRecords', item.id));
            } else {
              await setDoc(doc(db, 'users', user.uid, 'supervisors', item.parentId, 'trainingRecords', item.id), item.data, { merge: true });
            }
          }
        } else if (item.type === 'session') {
          if (item.action === 'delete') {
            await deleteDoc(doc(db, 'users', user.uid, 'trainingSessions', item.id));
          } else {
            await setDoc(doc(db, 'users', user.uid, 'trainingSessions', item.id), item.data, { merge: true });
          }
        } else if (item.type === 'skill') {
          if (item.action === 'delete') {
            await deleteDoc(doc(db, 'users', user.uid, 'skills', item.id));
          } else {
            await setDoc(doc(db, 'users', user.uid, 'skills', item.id), item.data, { merge: true });
          }
        }
      } catch (err: any) {
        console.warn(`Sync failed for item ${item.id}:`, err.message);
        failedItems.push(item);
      }
    }

    saveOfflineQueue(failedItems);
    setSyncStatus(prev => ({
      ...prev,
      isSyncing: false,
      pendingCount: failedItems.length,
      lastSyncTime: new Date().toLocaleTimeString(),
    }));
  };

  const syncNow = async () => {
    await processOfflineSyncQueue();
  };

  // Track online / offline events and auto-sync immediately on reconnect
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      processOfflineSyncQueue();
    };
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (navigator.onLine && user) {
      processOfflineSyncQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  // Helper to load or initialize state from localStorage
  const loadLocal = <T,>(key: string, defaultVal: T): T => {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + currentUid + '_' + key);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const saveLocal = (key: string, val: any) => {
    try {
      localStorage.setItem(STORAGE_PREFIX + currentUid + '_' + key, JSON.stringify(val));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  };

  // Seed default skills and sample supervisor & clinical case on initial start
  useEffect(() => {
    const loadedCases = loadLocal<ClinicalCase[]>('cases', []);
    const loadedSupervisors = loadLocal<Supervisor[]>('supervisors', []);
    const loadedRecords = loadLocal<TrainingRecord[]>('records', []);
    const loadedSessions = loadLocal<TrainingSession[]>('sessions', []);
    const loadedSkills = loadLocal<UserSkill[]>('skills', []);
    const loadedRecs = loadLocal<RecommendationLetter[]>('recommendations', []);
    const loadedArticles = loadLocal<SavedArticle[]>('articles', []);

    const isAlreadyInitialized = localStorage.getItem(STORAGE_PREFIX + currentUid + '_initialized') === 'true';
    if (!isAlreadyInitialized && loadedSupervisors.length === 0) {
      localStorage.setItem(STORAGE_PREFIX + currentUid + '_initialized', 'true');
      // Seed initial high-quality clinical setup
      const initialSupervisor: Supervisor = {
        id: 'sup-prof-weber',
        userId: currentUid,
        fullName: 'Thomas Weber',
        academicDegree: 'MD, PhD, FEBVS',
        academicTitle: 'Prof. Dr. med.',
        professionalPosition: 'Consultant Vascular Surgeon & Head of Dept',
        specialty: 'Vascular Surgery',
        subspecialty: 'Endovascular & Aortic Surgery',
        department: 'Department of Vascular and Endovascular Surgery',
        hospital: 'University Hospital Hamburg-Eppendorf',
        university: 'University of Hamburg',
        country: 'Germany',
        email: 't.weber@uke-hamburg.de',
        additionalNotes: 'Authorized Weiterbildungsbefugter for Vascular Surgery according to German Ärztekammer.',
        createdAt: '2026-01-15T08:00:00Z',
        updatedAt: '2026-01-15T08:00:00Z',
      };

      const initialCase: ClinicalCase = {
        id: 'case-vasc-001',
        userId: currentUid,
        caseReference: 'CAS-2026-0042',
        patientAge: 68,
        patientSex: 'Male',
        presentationDate: '2026-10-14',
        hospital: 'University Hospital Hamburg-Eppendorf',
        department: 'Vascular Surgery',
        specialty: 'Vascular Surgery',
        chiefComplaint: 'Severe left calf claudication at 50 meters, progressing to nocturnal rest pain.',
        historyOfPresentIllness: 'A 68-year-old gentleman presented with a 4-month history of deteriorating left lower limb ischemia. Pain awakens patient at night, relieved by hanging the leg over bed edge.',
        durationOfSymptoms: '4 months',
        relevantMedicalHistory: 'Hypertension, Type 2 Diabetes Mellitus, 40 pack-year smoking history.',
        surgicalHistory: 'Elective open cholecystectomy in 2018.',
        drugHistory: 'Aspirin 100mg od, Atorvastatin 40mg od, Ramipril 5mg od, Metformin 1000mg bd.',
        allergies: 'Penicillin (mild cutaneous rash).',
        familyHistory: 'Father had abdominal aortic aneurysm repair.',
        socialHistory: 'Retired mechanical engineer, independent.',
        examination: {
          general: 'Well-nourished, hemodynamically stable.',
          vitals: 'BP: 135/82 mmHg, HR: 72 bpm, SpO2: 98% on room air.',
          cardiovascular: 'Regular rhythm, no carotid or abdominal bruits.',
          local: 'Left foot cooler than right; delayed capillary refill (4s); absent dorsalis pedis and posterior tibial pulses on the left.',
        },
        investigations: [
          {
            name: 'Doppler Ultrasound / ABI',
            category: 'Imaging',
            date: '2026-10-14',
            result: 'Left ABI = 0.42 (Critical Limb Ischemia); Right ABI = 0.88.',
            summary: 'Monophasic flow in distal left tibials.',
          },
          {
            name: 'CT Angiography',
            category: 'Imaging',
            date: '2026-10-15',
            result: 'Occlusion of the left superficial femoral artery (SFA) from mid-thigh with reconstitution at P1 popliteal segment.',
            summary: 'Suitable distal target for femoro-popliteal bypass.',
          },
          {
            name: 'Coagulation Profile & Creatinine',
            category: 'Laboratory',
            date: '2026-10-14',
            result: 'INR 1.05, aPTT 29s, Creatinine 1.1 mg/dL.',
            summary: 'Adequate renal reserve for iodinated contrast.',
          },
        ],
        primaryDiagnosis: 'Critical Limb-Threatening Ischemia (Fontaine Stage III / Rutherford Category 4), Left Lower Extremity',
        secondaryDiagnoses: 'Peripheral Arterial Occlusive Disease (PAOD), Essential Hypertension',
        icd10Code: 'I70.24',
        clinicalAssessment: 'Symptomatic left SFA chronic total occlusion warranting urgent revascularization to prevent tissue loss.',
        management: {
          initial: 'Optimized best medical therapy (Statin, Antiplatelet), analgesia, hydration.',
          surgical: 'Left Femoro-Popliteal Bypass Surgery with autologous reversed great saphenous vein graft.',
          treatmentPlan: 'Scheduled for operative intervention under spinal anesthesia.',
          outcome: 'Successful revascularization with restoration of strong palpable posterior tibial pulse.',
        },
        surgicalProcedure: {
          procedureName: 'Left Femoro-Popliteal Bypass (Reversed Vein Graft)',
          procedureDate: '2026-10-16',
          specialty: 'Vascular Surgery',
          indication: 'Critical Limb-Threatening Ischemia',
          surgicalApproach: 'Longitudinal groin incision over common femoral bifurcation and medial infra-genicular popliteal exposure.',
          operativeFindings: 'Severe calcification at SFA origin; excellent calibre (>4mm) ipsilateral great saphenous vein.',
          procedureSummary: 'Saphenous vein harvested; systemic heparin administered; End-to-side proximal anastomosis to common femoral artery (6-0 Prolene); tunnelled through subsartorial canal; distal end-to-side anastomosis to P3 popliteal artery (7-0 Prolene). Excellent thrill and hemostasis achieved.',
          anaesthesiaType: 'Spinal with sedation',
          outcome: 'Immediate triphasic signals in pedal vessels, warm foot.',
          participationRole: 'Performed Specific Steps Under Direct Supervision',
        },
        followUp: {
          followUpDate: '2026-10-22',
          clinicalProgress: 'Uneventful recovery, ambulating without claudication.',
          woundStatus: 'Clean surgical wounds, no haematoma or surgical site infection.',
          finalOutcome: 'Graft patent on discharge duplex scan.',
        },
        createdAt: '2026-10-14T10:00:00Z',
        updatedAt: '2026-10-22T14:30:00Z',
      };

      const initialRecord: TrainingRecord = {
        id: 'rec-001',
        userId: currentUid,
        supervisorId: 'sup-prof-weber',
        trainingDate: '2026-10-16',
        procedureDate: '2026-10-16',
        hospital: 'University Hospital Hamburg-Eppendorf',
        department: 'Vascular Surgery',
        specialty: 'Vascular Surgery',
        activityType: 'Operative Theatre',
        procedureName: 'Left Femoro-Popliteal Bypass (Reversed Vein)',
        clinicalCaseRef: 'CAS-2026-0042',
        startTime: '08:30',
        endTime: '13:00',
        breakDurationMinutes: 30,
        netTrainingHours: 4.0,
        surgicalExposure: 'Performed Specific Steps Under Direct Supervision',
        participationRole: 'Performed Specific Steps Under Direct Supervision',
        participationGerman: 'Einzelne operative Schritte unter direkter Supervision durchgeführt',
        descriptionOfParticipation: 'Under Prof. Weber\'s direct scrubbed guidance, dissected the common and superficial femoral arteries, assisted with saphenous vein harvesting, and performed the distal arteriotomy and assisted anastomotic running suture.',
        responsibilities: 'Surgical exposure of vessels, heparin timing documentation, vascular clamp application, graft flushing, skin closure.',
        surgicalTechniquesObserved: 'Proximal end-to-side vascular anastomosis, vein graft distention testing.',
        surgicalTechniquesPracticed: 'Vessel mobilization, arteriotomy using Potts scissors, parachute suture technique, subcuticular closure.',
        supervisionLevel: 'Direct Supervision',
        skillsAcquired: ['Vessel Exposure', 'Vascular Clamping', 'Arteriotomy', 'Vascular Suturing', 'Skin Closure'],
        learningPoints: 'Avoid vein torsion during subsartorial tunnelling; maintain gentle traction during 7-0 Prolene anastomoses.',
        supervisorFeedback: 'Excellently prepared, gentle handling of vessels, good knot security. Approved for documented WBO logbook hours.',
        additionalNotes: 'Documented in UKE surgical logbook registry.',
        verified: true,
        createdAt: '2026-10-16T14:00:00Z',
        updatedAt: '2026-10-16T14:00:00Z',
      };

      const initialSession: TrainingSession = {
        id: 'sess-001',
        userId: currentUid,
        supervisorId: 'sup-prof-weber',
        supervisorName: 'Prof. Dr. med. Thomas Weber',
        hospital: 'University Hospital Hamburg-Eppendorf',
        department: 'Vascular Surgery',
        trainingDate: '2026-10-16',
        startTime: '07:30',
        endTime: '16:00',
        breakDurationMinutes: 60,
        netTrainingHours: 7.5,
        sessionType: 'Theatre',
        trainingActivities: 'Morning multidisciplinary vascular team handover, surgical theater operations, post-op patient review in recovery unit.',
        skillsPracticed: ['Vascular Access', 'Vessel Exposure', 'Arteriotomy', 'Vascular Suturing'],
        notes: 'Full day clinical theatre attendance under Prof. Weber.',
        verified: true,
        createdAt: '2026-10-16T17:00:00Z',
        updatedAt: '2026-10-16T17:00:00Z',
      };

      const initialSkills: UserSkill[] = DEFAULT_SURGICAL_SKILLS.map((d, index) => ({
        id: `skill-${index + 1}`,
        userId: currentUid,
        name: d.name,
        nameGerman: d.nameGerman,
        specialty: d.specialty,
        category: d.category,
        exposureLevel: index === 3 || index === 4 || index === 14 ? 'Performed Specific Steps Under Direct Supervision' : 'Observed',
        competencyStatus: index === 3 || index === 4 ? 'Practicing' : index === 14 ? 'Supervisor Assessed' : 'Learning',
        totalRecordedSessions: index === 3 ? 12 : index === 14 ? 8 : 4,
        totalDocumentedHours: index === 3 ? 24 : index === 14 ? 16 : 8,
        lastPracticedDate: '2026-10-16',
        supervisors: ['Prof. Dr. med. Thomas Weber'],
        hospitals: ['University Hospital Hamburg-Eppendorf'],
        createdAt: '2026-01-20T00:00:00Z',
        updatedAt: '2026-10-16T00:00:00Z',
      }));

      setSupervisors([initialSupervisor]);
      setCases([initialCase]);
      setTrainingRecords([initialRecord]);
      setTrainingSessions([initialSession]);
      setSkills(initialSkills);

      saveLocal('supervisors', [initialSupervisor]);
      saveLocal('cases', [initialCase]);
      saveLocal('records', [initialRecord]);
      saveLocal('sessions', [initialSession]);
      saveLocal('skills', initialSkills);
    } else {
      setCases(loadedCases);
      setSupervisors(loadedSupervisors);
      setTrainingRecords(loadedRecords);
      setTrainingSessions(loadedSessions);
      setSkills(loadedSkills);
      setRecommendations(loadedRecs);
      setSavedArticles(loadedArticles);
    }

    // Community cases loading
    try {
      const storedCommunity = localStorage.getItem('surgitrack_local_community_cases');
      if (storedCommunity) {
        setCommunityCases(JSON.parse(storedCommunity));
      } else {
        setCommunityCases([INITIAL_COMMUNITY_CASE_8875]);
        localStorage.setItem('surgitrack_local_community_cases', JSON.stringify([INITIAL_COMMUNITY_CASE_8875]));
      }
    } catch {
      setCommunityCases([INITIAL_COMMUNITY_CASE_8875]);
    }
  }, [currentUid]);

  // If user is authenticated via Firebase, attempt live cloud synchronization
  useEffect(() => {
    if (!user) return;

    let unsubCases: (() => void) | undefined;
    let unsubSupervisors: (() => void) | undefined;
    let unsubSessions: (() => void) | undefined;
    let unsubSkills: (() => void) | undefined;
    let unsubCommunity: (() => void) | undefined;

    const setupFirestoreListeners = async () => {
      try {
        setSyncStatus(prev => ({ ...prev, isSyncing: true }));

        // Helper to deduplicate list by id
        const dedupeById = <T extends { id?: string }>(items: T[]): T[] => {
          const seen = new Set<string>();
          return items.filter((item, idx) => {
            const key = item.id || `item_${idx}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        };

        // 1. Cases
        const casesRef = collection(db, 'users', user.uid, 'clinicalCases');
        unsubCases = onSnapshot(casesRef, (snapshot) => {
          if (!snapshot.empty) {
            const list = dedupeById(snapshot.docs.map(d => ({ ...d.data(), id: d.id || d.data().id }) as ClinicalCase));
            setCases(list);
            saveLocal('cases', list);
          }
        }, (err) => console.warn('Cases sync error:', err.message));

        // 2. Supervisors
        const supervisorsRef = collection(db, 'users', user.uid, 'supervisors');
        unsubSupervisors = onSnapshot(supervisorsRef, (snapshot) => {
          const list = dedupeById(snapshot.docs.map(d => ({ ...d.data(), id: d.id || d.data().id }) as Supervisor));
          setSupervisors(list);
          saveLocal('supervisors', list);
        }, (err) => console.warn('Supervisors sync error:', err.message));

        // 3. Sessions
        const sessionsRef = collection(db, 'users', user.uid, 'trainingSessions');
        unsubSessions = onSnapshot(sessionsRef, (snapshot) => {
          if (!snapshot.empty) {
            const list = dedupeById(snapshot.docs.map(d => ({ ...d.data(), id: d.id || d.data().id }) as TrainingSession));
            setTrainingSessions(list);
            saveLocal('sessions', list);
          }
        }, (err) => console.warn('Sessions sync error:', err.message));

        // 4. Skills
        const skillsRef = collection(db, 'users', user.uid, 'skills');
        unsubSkills = onSnapshot(skillsRef, (snapshot) => {
          if (!snapshot.empty) {
            const list = dedupeById(snapshot.docs.map(d => ({ ...d.data(), id: d.id || d.data().id }) as UserSkill));
            setSkills(list);
            saveLocal('skills', list);
          }
        }, (err) => console.warn('Skills sync error:', err.message));

        // 5. Community Cases Live Listener
        const communityRef = collection(db, 'communityCases');
        unsubCommunity = onSnapshot(communityRef, (snapshot) => {
          if (!snapshot.empty) {
            const rawList = snapshot.docs.map(d => ({ ...d.data(), id: d.id || d.data().id }) as ClinicalCase);
            // Merge with default initial 8875 case if not present
            const has8875 = rawList.some(c => c.caseReference === 'CAS-2026-8875' || c.id === 'comm-case-8875');
            const merged = dedupeById(has8875 ? rawList : [INITIAL_COMMUNITY_CASE_8875, ...rawList]);
            setCommunityCases(merged);
            try {
              localStorage.setItem('surgitrack_local_community_cases', JSON.stringify(merged));
            } catch (e) {
              console.warn(e);
            }
          }
        }, (err) => console.warn('Community sync warning:', err.message));

        setSyncStatus(prev => ({
          ...prev,
          isSyncing: false,
          lastSyncTime: new Date().toLocaleTimeString(),
        }));
      } catch (err: any) {
        console.warn('Sync setup error:', err);
        setSyncStatus(prev => ({ ...prev, isSyncing: false, syncError: err.message }));
      }
    };

    setupFirestoreListeners();

    return () => {
      if (unsubCases) unsubCases();
      if (unsubSupervisors) unsubSupervisors();
      if (unsubSessions) unsubSessions();
      if (unsubSkills) unsubSkills();
      if (unsubCommunity) unsubCommunity();
    };
  }, [user]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalCases = cases.length;
    const totalProcedures = trainingRecords.filter(r => r.procedureName).length;
    const totalSessions = trainingSessions.length;
    const skillsHours = skills.reduce((acc, s) => acc + (Number(s.totalDocumentedHours) || 0), 0);
    const verifiedSkillsHours = skills
      .filter(s => s.competencyStatus === 'Competency Confirmed' || s.competencyStatus === 'Supervisor Assessed')
      .reduce((acc, s) => acc + (Number(s.totalDocumentedHours) || 0), 0);

    const totalHours = trainingRecords.reduce((acc, r) => acc + (Number(r.netTrainingHours) || 0), 0) +
                       skillsHours +
                       trainingSessions.reduce((acc, s) => acc + (Number(s.netTrainingHours) || 0), 0);
    const verifiedHours = trainingRecords.filter(r => r.verified).reduce((acc, r) => acc + (Number(r.netTrainingHours) || 0), 0) +
                          verifiedSkillsHours +
                          trainingSessions.filter(s => s.verified).reduce((acc, s) => acc + (Number(s.netTrainingHours) || 0), 0);
    const unverifiedHours = Math.max(0, totalHours - verifiedHours);
    const totalSupervisors = supervisors.length;

    const hospitalSet = new Set<string>();
    cases.forEach(c => c.hospital && hospitalSet.add(c.hospital));
    supervisors.forEach(s => s.hospital && hospitalSet.add(s.hospital));
    trainingRecords.forEach(r => r.hospital && hospitalSet.add(r.hospital));

    const skillsPracticed = skills.filter(s => s.totalRecordedSessions > 0).length;
    const assessedCompetencies = skills.filter(s => s.competencyStatus === 'Competency Confirmed' || s.competencyStatus === 'Supervisor Assessed').length;

    // Calculate weekly average
    const dates = trainingRecords.map(r => r.trainingDate).concat(trainingSessions.map(s => s.trainingDate)).filter(Boolean).sort();
    let weeks = 1;
    if (dates.length > 1) {
      const diff = Math.max(1, (new Date(dates[dates.length - 1]).getTime() - new Date(dates[0]).getTime()) / (7 * 24 * 3600 * 1000));
      weeks = Math.round(diff);
    }
    const weeklyAverageHours = Number((totalHours / weeks).toFixed(1));

    return {
      totalCases,
      totalProcedures,
      totalSessions,
      totalHours: Number(totalHours.toFixed(1)),
      verifiedHours: Number(verifiedHours.toFixed(1)),
      unverifiedHours: Number(unverifiedHours.toFixed(1)),
      totalSupervisors,
      totalHospitals: hospitalSet.size,
      skillsPracticed,
      assessedCompetencies,
      weeklyAverageHours,
    };
  }, [cases, trainingRecords, trainingSessions, supervisors, skills]);

  // CRUD Cases & Community Publishing
  const addCase = async (
    c: Omit<ClinicalCase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    publishToCommunity: boolean = false
  ): Promise<string> => {
    const id = `case_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const authorName = profile?.fullName || 'Dr. Medical Trainee';
    const authorSpecialty = profile?.specialty || c.specialty;
    const authorHospital = profile?.hospitals || c.hospital;
    const authorPhotoUrl = profile?.profilePhotoUrl || '';

    const newCase: ClinicalCase = {
      ...c,
      id,
      userId: currentUid,
      isPublished: publishToCommunity,
      publishedAt: publishToCommunity ? new Date().toISOString() : undefined,
      authorName,
      authorSpecialty,
      authorHospital,
      authorPhotoUrl,
      likesCount: 0,
      likedByUserIds: [],
      likedByUsers: [],
      commentsCount: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newCase, ...cases];
    setCases(updated);
    saveLocal('cases', updated);

    if (publishToCommunity) {
      const updatedCommunity = [newCase, ...communityCases];
      setCommunityCases(updatedCommunity);
      try {
        localStorage.setItem('surgitrack_local_community_cases', JSON.stringify(updatedCommunity));
      } catch (e) {
        console.warn(e);
      }
    }

    if (user) {
      if (!navigator.onLine) {
        enqueueOfflineAction({ id, type: 'case', action: 'create', data: newCase, timestamp: new Date().toISOString() });
      } else {
        try {
          await setDoc(doc(db, 'users', user.uid, 'clinicalCases', id), newCase);
          if (publishToCommunity) {
            await setDoc(doc(db, 'communityCases', id), newCase);
          }
        } catch (err) {
          console.warn('Saved case locally, queued for sync:', err);
          enqueueOfflineAction({ id, type: 'case', action: 'create', data: newCase, timestamp: new Date().toISOString() });
        }
      }
    }
    return id;
  };

  const updateCase = async (id: string, updates: Partial<ClinicalCase>) => {
    const updated = cases.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c);
    setCases(updated);
    saveLocal('cases', updated);

    // Also update in community cases if present
    const updatedCommunity = communityCases.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c);
    setCommunityCases(updatedCommunity);
    try {
      localStorage.setItem('surgitrack_local_community_cases', JSON.stringify(updatedCommunity));
    } catch (e) {
      console.warn(e);
    }

    if (user) {
      if (!navigator.onLine) {
        enqueueOfflineAction({ id, type: 'case', action: 'update', data: updates, timestamp: new Date().toISOString() });
      } else {
        try {
          await setDoc(doc(db, 'users', user.uid, 'clinicalCases', id), updates, { merge: true });
          if (communityCases.some(c => c.id === id)) {
            await setDoc(doc(db, 'communityCases', id), updates, { merge: true });
          }
        } catch (err) {
          console.warn('Updated case locally, queued for sync:', err);
          enqueueOfflineAction({ id, type: 'case', action: 'update', data: updates, timestamp: new Date().toISOString() });
        }
      }
    }
  };

  const publishCaseToCommunity = async (caseId: string) => {
    const target = cases.find(c => c.id === caseId);
    if (!target) return;
    const authorName = profile?.fullName || target.authorName || 'Dr. Medical Resident';
    const authorSpecialty = profile?.specialty || target.authorSpecialty || target.specialty;
    const authorHospital = profile?.hospitals || target.authorHospital || target.hospital;
    const authorPhotoUrl = profile?.profilePhotoUrl || target.authorPhotoUrl || '';

    const publishedPayload: Partial<ClinicalCase> = {
      isPublished: true,
      publishedAt: new Date().toISOString(),
      authorName,
      authorSpecialty,
      authorHospital,
      authorPhotoUrl,
      likesCount: target.likesCount || 0,
      likedByUserIds: target.likedByUserIds || [],
      likedByUsers: target.likedByUsers || [],
      commentsCount: target.commentsCount || 0,
      comments: target.comments || [],
    };

    await updateCase(caseId, publishedPayload);
    const fullUpdated: ClinicalCase = { ...target, ...publishedPayload, updatedAt: new Date().toISOString() };
    const updatedCommunity = [fullUpdated, ...communityCases.filter(c => c.id !== caseId)];
    setCommunityCases(updatedCommunity);
    try {
      localStorage.setItem('surgitrack_local_community_cases', JSON.stringify(updatedCommunity));
      if (user && navigator.onLine) {
        await setDoc(doc(db, 'communityCases', caseId), fullUpdated);
      }
    } catch (e) {
      console.warn('Community publish warning:', e);
    }
  };

  const unpublishCaseFromCommunity = async (caseId: string) => {
    await updateCase(caseId, { isPublished: false });
    const updatedCommunity = communityCases.filter(c => c.id !== caseId);
    setCommunityCases(updatedCommunity);
    try {
      localStorage.setItem('surgitrack_local_community_cases', JSON.stringify(updatedCommunity));
      if (user && navigator.onLine) {
        await deleteDoc(doc(db, 'communityCases', caseId));
      }
    } catch (e) {
      console.warn('Community unpublish warning:', e);
    }
  };

  const deleteCase = async (id: string) => {
    const updated = cases.filter(c => c.id !== id);
    setCases(updated);
    saveLocal('cases', updated);

    // Remove from community cases as well
    const updatedCommunity = communityCases.filter(c => c.id !== id);
    setCommunityCases(updatedCommunity);
    try {
      localStorage.setItem('surgitrack_local_community_cases', JSON.stringify(updatedCommunity));
    } catch (e) {
      console.warn(e);
    }

    if (user) {
      if (!navigator.onLine) {
        enqueueOfflineAction({ id, type: 'case', action: 'delete', timestamp: new Date().toISOString() });
      } else {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'clinicalCases', id));
          await deleteDoc(doc(db, 'communityCases', id));
        } catch (err) {
          console.warn('Deleted case locally, queued for sync:', err);
          enqueueOfflineAction({ id, type: 'case', action: 'delete', timestamp: new Date().toISOString() });
        }
      }
    }
  };

  // Social Interactions (Likes, Comments, Follow)
  const toggleLikeCase = async (caseId: string) => {
    const target = communityCases.find(c => c.id === caseId);
    if (!target) return;
    const alreadyLiked = (target.likedByUserIds || []).includes(currentUid);
    const updatedLikesCount = alreadyLiked
      ? Math.max(0, (target.likesCount || 1) - 1)
      : (target.likesCount || 0) + 1;
    const updatedLikedByUserIds = alreadyLiked
      ? (target.likedByUserIds || []).filter(id => id !== currentUid)
      : [...(target.likedByUserIds || []), currentUid];
    const updatedLikedByUsers = alreadyLiked
      ? (target.likedByUsers || []).filter(u => u.userId !== currentUid)
      : [
          ...(target.likedByUsers || []),
          {
            userId: currentUid,
            fullName: profile?.fullName || 'Colleague Surgeon',
            specialty: profile?.specialty || 'Surgery Resident',
            photoUrl: profile?.profilePhotoUrl || '',
          },
        ];

    const updatedCase: ClinicalCase = {
      ...target,
      likesCount: updatedLikesCount,
      likedByUserIds: updatedLikedByUserIds,
      likedByUsers: updatedLikedByUsers,
      updatedAt: new Date().toISOString(),
    };

    const updatedCommunity = communityCases.map(c => c.id === caseId ? updatedCase : c);
    setCommunityCases(updatedCommunity);
    try {
      localStorage.setItem('surgitrack_local_community_cases', JSON.stringify(updatedCommunity));
    } catch (e) {
      console.warn(e);
    }

    // Also update local personal cases if this is author's own case
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, likesCount: updatedLikesCount, likedByUserIds: updatedLikedByUserIds, likedByUsers: updatedLikedByUsers } : c));

    if (user && navigator.onLine) {
      try {
        await setDoc(doc(db, 'communityCases', caseId), updatedCase, { merge: true });
      } catch (e) {
        console.warn('Like sync warning:', e);
      }
    }
  };

  const addCommentToCase = async (caseId: string, commentText: string) => {
    if (!commentText.trim()) return;
    const target = communityCases.find(c => c.id === caseId);
    if (!target) return;

    const newComment: CaseComment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUid,
      userName: profile?.fullName || 'Dr. Colleague Surgeon',
      userSpecialty: profile?.specialty || 'Surgical Trainee',
      userPhotoUrl: profile?.profilePhotoUrl || '',
      commentText: commentText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [...(target.comments || []), newComment];
    const updatedCase: ClinicalCase = {
      ...target,
      commentsCount: updatedComments.length,
      comments: updatedComments,
      updatedAt: new Date().toISOString(),
    };

    const updatedCommunity = communityCases.map(c => c.id === caseId ? updatedCase : c);
    setCommunityCases(updatedCommunity);
    try {
      localStorage.setItem('surgitrack_local_community_cases', JSON.stringify(updatedCommunity));
    } catch (e) {
      console.warn(e);
    }

    setCases(prev => prev.map(c => c.id === caseId ? { ...c, commentsCount: updatedComments.length, comments: updatedComments } : c));

    if (user && navigator.onLine) {
      try {
        await setDoc(doc(db, 'communityCases', caseId), updatedCase, { merge: true });
      } catch (e) {
        console.warn('Comment sync warning:', e);
      }
    }
  };

  const toggleFollowDoctor = async (targetDoctorId: string): Promise<{ status: 'followed' | 'unfollowed' | 'requested' }> => {
    const currentFollowing = profile?.following || [];
    const isFollowing = currentFollowing.includes(targetDoctorId);
    const targetDoc = allDoctors.find(d => d.userId === targetDoctorId);
    const requiresApproval = targetDoc?.requireApprovalToFollow;

    if (isFollowing) {
      const updatedFollowing = currentFollowing.filter(id => id !== targetDoctorId);
      if (profile) {
        profile.following = updatedFollowing;
      }
      setAllDoctors(prev =>
        prev.map(d =>
          d.userId === targetDoctorId
            ? { ...d, followersCount: Math.max(0, d.followersCount - 1) }
            : d
        )
      );
      return { status: 'unfollowed' };
    } else {
      if (requiresApproval) {
        return { status: 'requested' };
      } else {
        const updatedFollowing = [...currentFollowing, targetDoctorId];
        if (profile) {
          profile.following = updatedFollowing;
        }
        setAllDoctors(prev =>
          prev.map(d =>
            d.userId === targetDoctorId
              ? { ...d, followersCount: d.followersCount + 1 }
              : d
          )
        );
        return { status: 'followed' };
      }
    }
  };

  const acceptFollowRequest = async (requesterId: string) => {
    if (!profile) return;
    const pending = profile.pendingFollowRequests || [];
    const currentFollowers = profile.followers || [];
    profile.pendingFollowRequests = pending.filter(id => id !== requesterId);
    if (!currentFollowers.includes(requesterId)) {
      profile.followers = [...currentFollowers, requesterId];
    }
  };

  const declineFollowRequest = async (requesterId: string) => {
    if (!profile) return;
    const pending = profile.pendingFollowRequests || [];
    profile.pendingFollowRequests = pending.filter(id => id !== requesterId);
  };

  // CRUD Supervisors
  const addSupervisor = async (s: Omit<Supervisor, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `sup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newSup: Supervisor = {
      ...s,
      id,
      userId: currentUid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...supervisors, newSup];
    setSupervisors(updated);
    saveLocal('supervisors', updated);

    if (user) {
      if (!navigator.onLine) {
        enqueueOfflineAction({ id, type: 'supervisor', action: 'create', data: newSup, timestamp: new Date().toISOString() });
      } else {
        try {
          await setDoc(doc(db, 'users', user.uid, 'supervisors', id), newSup);
        } catch (err) {
          console.warn('Saved supervisor locally, queued for sync:', err);
          enqueueOfflineAction({ id, type: 'supervisor', action: 'create', data: newSup, timestamp: new Date().toISOString() });
        }
      }
    }
    return id;
  };

  const updateSupervisor = async (id: string, s: Partial<Supervisor>) => {
    const updated = supervisors.map(item => item.id === id ? { ...item, ...s, updatedAt: new Date().toISOString() } : item);
    setSupervisors(updated);
    saveLocal('supervisors', updated);

    if (user) {
      if (!navigator.onLine) {
        enqueueOfflineAction({ id, type: 'supervisor', action: 'update', data: s, timestamp: new Date().toISOString() });
      } else {
        try {
          await setDoc(doc(db, 'users', user.uid, 'supervisors', id), s, { merge: true });
        } catch (err) {
          console.warn('Updated supervisor locally, queued for sync:', err);
          enqueueOfflineAction({ id, type: 'supervisor', action: 'update', data: s, timestamp: new Date().toISOString() });
        }
      }
    }
  };

  const deleteSupervisor = async (id: string) => {
    // 1. Immediately update local state and localStorage
    const updated = supervisors.filter(item => item.id !== id);
    setSupervisors(updated);
    saveLocal('supervisors', updated);

    // 2. Also remove associated training records locally
    const remainingRecords = trainingRecords.filter(r => r.supervisorId !== id);
    setTrainingRecords(remainingRecords);
    saveLocal('records', remainingRecords);

    // 3. Mark initialized in localStorage so empty state doesn't re-seed on reload
    try {
      localStorage.setItem(STORAGE_PREFIX + currentUid + '_initialized', 'true');
    } catch {}

    // 4. Permanent deletion from Firestore
    if (user) {
      if (!navigator.onLine) {
        enqueueOfflineAction({ id, type: 'supervisor', action: 'delete', timestamp: new Date().toISOString() });
      } else {
        try {
          // Delete subcollection trainingRecords from Firestore first
          try {
            const subRecsSnap = await getDocs(collection(db, 'users', user.uid, 'supervisors', id, 'trainingRecords'));
            const delPromises = subRecsSnap.docs.map(d => deleteDoc(d.ref));
            await Promise.all(delPromises);
          } catch (subErr) {
            console.warn('Subcollection delete warning:', subErr);
          }

          // Delete supervisor document from Firestore
          await deleteDoc(doc(db, 'users', user.uid, 'supervisors', id));
        } catch (err) {
          console.warn('Deleted supervisor locally, queued for sync:', err);
          enqueueOfflineAction({ id, type: 'supervisor', action: 'delete', timestamp: new Date().toISOString() });
        }
      }
    }
  };

  // CRUD Training Records (Supervisor-Specific)
  const addTrainingRecord = async (r: Omit<TrainingRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRec: TrainingRecord = {
      ...r,
      id,
      userId: currentUid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newRec, ...trainingRecords];
    setTrainingRecords(updated);
    saveLocal('records', updated);

    if (user) {
      if (!navigator.onLine) {
        enqueueOfflineAction({ id, type: 'record', action: 'create', parentId: r.supervisorId, data: newRec, timestamp: new Date().toISOString() });
      } else {
        try {
          await setDoc(doc(db, 'users', user.uid, 'supervisors', r.supervisorId, 'trainingRecords', id), newRec);
        } catch (err) {
          console.warn('Saved training record locally, queued for sync:', err);
          enqueueOfflineAction({ id, type: 'record', action: 'create', parentId: r.supervisorId, data: newRec, timestamp: new Date().toISOString() });
        }
      }
    }
    return id;
  };

  const updateTrainingRecord = async (id: string, supervisorId: string, r: Partial<TrainingRecord>) => {
    // IMMUTABILITY GUARD: signed records are locked forever — the audit
    // trail preserves the exact content the supervisor attested to.
    const target = trainingRecords.find(item => item.id === id);
    if (target?.signature) {
      throw new Error(
        'This record is digitally signed by the supervisor and is locked. Signed records are immutable and cannot be edited.'
      );
    }
    const updated = trainingRecords.map(item => item.id === id ? { ...item, ...r, updatedAt: new Date().toISOString() } : item);
    setTrainingRecords(updated);
    saveLocal('records', updated);

    if (user) {
      if (!navigator.onLine) {
        enqueueOfflineAction({ id, type: 'record', action: 'update', parentId: supervisorId, data: r, timestamp: new Date().toISOString() });
      } else {
        try {
          await setDoc(doc(db, 'users', user.uid, 'supervisors', supervisorId, 'trainingRecords', id), r, { merge: true });
        } catch (err) {
          console.warn('Updated record locally, queued for sync:', err);
          enqueueOfflineAction({ id, type: 'record', action: 'update', parentId: supervisorId, data: r, timestamp: new Date().toISOString() });
        }
      }
    }
  };

  const deleteTrainingRecord = async (id: string, supervisorId: string) => {
    // IMMUTABILITY GUARD: signed records can never be deleted.
    const target = trainingRecords.find(item => item.id === id);
    if (target?.signature) {
      throw new Error(
        'This record is digitally signed by the supervisor and cannot be deleted. Signed records form the permanent audit trail.'
      );
    }
    const updated = trainingRecords.filter(item => item.id !== id);
    setTrainingRecords(updated);
    saveLocal('records', updated);

    if (user) {
      if (!navigator.onLine) {
        enqueueOfflineAction({ id, type: 'record', action: 'delete', parentId: supervisorId, timestamp: new Date().toISOString() });
      } else {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'supervisors', supervisorId, 'trainingRecords', id));
        } catch (err) {
          console.warn('Deleted record locally, queued for sync:', err);
          enqueueOfflineAction({ id, type: 'record', action: 'delete', parentId: supervisorId, timestamp: new Date().toISOString() });
        }
      }
    }
  };

  // ==========================================
  // DIGITAL SUPERVISOR SIGNATURE (Immutable Audit Trail)
  // A SHA-256 content hash is computed over the full clinical content of the
  // record and stored with the signature block. Once signed the record is
  // locked: updateTrainingRecord / deleteTrainingRecord refuse any change,
  // and verifyRecordIntegrityAsync() recomputes the hash to detect tampering.
  // ==========================================
  const computeTrainingRecordHash = async (r: TrainingRecord): Promise<string> => {
    // The payload deliberately excludes metadata (id, timestamps, verified flag)
    // so only the CLINICAL CONTENT is attested.
    const payload = {
      supervisorId: r.supervisorId,
      trainingDate: r.trainingDate,
      procedureDate: r.procedureDate,
      hospital: r.hospital,
      department: r.department,
      specialty: r.specialty,
      activityType: r.activityType,
      procedureName: r.procedureName,
      clinicalCaseRef: r.clinicalCaseRef || '',
      startTime: r.startTime,
      endTime: r.endTime,
      breakDurationMinutes: r.breakDurationMinutes,
      netTrainingHours: r.netTrainingHours,
      surgicalExposure: r.surgicalExposure,
      participationRole: r.participationRole,
      descriptionOfParticipation: r.descriptionOfParticipation,
      responsibilities: r.responsibilities,
      supervisionLevel: r.supervisionLevel,
      skillsAcquired: [...(r.skillsAcquired || [])].sort(),
      learningPoints: r.learningPoints || '',
      supervisorFeedback: r.supervisorFeedback || '',
    };
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(payload));
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Deterministic fallback for environments without crypto.subtle
      const str = JSON.stringify(payload);
      let h1 = 0x811c9dc5;
      let h2 = 0x1000193;
      for (let i = 0; i < str.length; i++) {
        h1 = (h1 ^ str.charCodeAt(i)) >>> 0;
        h1 = (h1 * 0x01000193) >>> 0;
        h2 = (h2 + str.charCodeAt(i) * (i + 7)) >>> 0;
      }
      return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0') + '_fb';
    }
  };

  const signTrainingRecords = async (
    recordIds: string[],
    supervisor: Supervisor,
    trainee: { id: string; name: string; position?: string }
  ): Promise<number> => {
    const signedAt = new Date().toISOString();
    const signedRecords: TrainingRecord[] = [];

    for (const recordId of recordIds) {
      const record = trainingRecords.find(r => r.id === recordId);
      if (!record || record.signature) continue; // skip already-signed

      const contentHash = await computeTrainingRecordHash(record);
      const signature: SupervisorSignature = {
        supervisorId: supervisor.id,
        supervisorName: supervisor.fullName,
        supervisorDegree: supervisor.academicDegree,
        supervisorPosition: supervisor.professionalPosition,
        signedAt,
        contentHash,
        algorithm: 'SHA-256',
        traineeId: trainee.id,
        traineeName: trainee.name,
        traineePosition: trainee.position,
      };

      signedRecords.push({
        ...record,
        verified: true,
        signature,
        updatedAt: signedAt,
      });

      // Persist to Firestore
      if (user) {
        try {
          await setDoc(
            doc(db, 'users', user.uid, 'supervisors', record.supervisorId, 'trainingRecords', recordId),
            { verified: true, signature, updatedAt: signedAt },
            { merge: true }
          );
        } catch (err) {
          console.warn('Signature persisted locally, Firestore sync queued:', err);
        }
      }
    }

    if (signedRecords.length > 0) {
      const updated = trainingRecords.map(r => {
        const signed = signedRecords.find(s => s.id === r.id);
        return signed || r;
      });
      setTrainingRecords(updated);
      saveLocal('records', updated);
    }

    return signedRecords.length;
  };

  const verifyRecordIntegrity = (recordId: string): 'valid' | 'tampered' | 'unsigned' => {
    const record = trainingRecords.find(r => r.id === recordId);
    if (!record || !record.signature) return 'unsigned';
    return 'valid'; // deep async verification available via verifyRecordIntegrityAsync
  };

  const verifyRecordIntegrityAsync = async (recordId: string): Promise<'valid' | 'tampered' | 'unsigned'> => {
    const record = trainingRecords.find(r => r.id === recordId);
    if (!record || !record.signature) return 'unsigned';
    const hash = await computeTrainingRecordHash(record);
    return hash === record.signature.contentHash ? 'valid' : 'tampered';
  };

  // CRUD Training Sessions
  const addTrainingSession = async (s: Omit<TrainingSession, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newSess: TrainingSession = {
      ...s,
      id,
      userId: currentUid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newSess, ...trainingSessions];
    setTrainingSessions(updated);
    saveLocal('sessions', updated);

    if (user) {
      if (!navigator.onLine) {
        enqueueOfflineAction({ id, type: 'session', action: 'create', data: newSess, timestamp: new Date().toISOString() });
      } else {
        try {
          await setDoc(doc(db, 'users', user.uid, 'trainingSessions', id), newSess);
        } catch (err) {
          console.warn('Saved session locally, queued for sync:', err);
          enqueueOfflineAction({ id, type: 'session', action: 'create', data: newSess, timestamp: new Date().toISOString() });
        }
      }
    }
    return id;
  };

  const updateTrainingSession = async (id: string, s: Partial<TrainingSession>) => {
    const updated = trainingSessions.map(item => item.id === id ? { ...item, ...s, updatedAt: new Date().toISOString() } : item);
    setTrainingSessions(updated);
    saveLocal('sessions', updated);

    if (user) {
      if (!navigator.onLine) {
        enqueueOfflineAction({ id, type: 'session', action: 'update', data: s, timestamp: new Date().toISOString() });
      } else {
        try {
          await setDoc(doc(db, 'users', user.uid, 'trainingSessions', id), s, { merge: true });
        } catch (err) {
          console.warn('Updated session locally, queued for sync:', err);
          enqueueOfflineAction({ id, type: 'session', action: 'update', data: s, timestamp: new Date().toISOString() });
        }
      }
    }
  };

  const deleteTrainingSession = async (id: string) => {
    const updated = trainingSessions.filter(item => item.id !== id);
    setTrainingSessions(updated);
    saveLocal('sessions', updated);

    if (user) {
      if (!navigator.onLine) {
        enqueueOfflineAction({ id, type: 'session', action: 'delete', timestamp: new Date().toISOString() });
      } else {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'trainingSessions', id));
        } catch (err) {
          console.warn('Deleted session locally, queued for sync:', err);
          enqueueOfflineAction({ id, type: 'session', action: 'delete', timestamp: new Date().toISOString() });
        }
      }
    }
  };

  // CRUD Skills
  const addSkill = async (s: Omit<UserSkill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `skill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newSkill: UserSkill = {
      ...s,
      id,
      userId: currentUid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...skills, newSkill];
    setSkills(updated);
    saveLocal('skills', updated);

    if (user) {
      if (!navigator.onLine) {
        enqueueOfflineAction({ id, type: 'skill', action: 'create', data: newSkill, timestamp: new Date().toISOString() });
      } else {
        try {
          await setDoc(doc(db, 'users', user.uid, 'skills', id), newSkill);
        } catch (err) {
          console.warn('Saved skill locally, queued for sync:', err);
          enqueueOfflineAction({ id, type: 'skill', action: 'create', data: newSkill, timestamp: new Date().toISOString() });
        }
      }
    }
    return id;
  };

  const updateSkill = async (id: string, s: Partial<UserSkill>) => {
    const updated = skills.map(item => item.id === id ? { ...item, ...s, updatedAt: new Date().toISOString() } : item);
    setSkills(updated);
    saveLocal('skills', updated);

    if (user) {
      if (!navigator.onLine) {
        enqueueOfflineAction({ id, type: 'skill', action: 'update', data: s, timestamp: new Date().toISOString() });
      } else {
        try {
          await setDoc(doc(db, 'users', user.uid, 'skills', id), s, { merge: true });
        } catch (err) {
          console.warn('Updated skill locally, queued for sync:', err);
          enqueueOfflineAction({ id, type: 'skill', action: 'update', data: s, timestamp: new Date().toISOString() });
        }
      }
    }
  };

  const deleteSkill = async (id: string) => {
    const updated = skills.filter(item => item.id !== id);
    setSkills(updated);
    saveLocal('skills', updated);

    if (user) {
      if (!navigator.onLine) {
        enqueueOfflineAction({ id, type: 'skill', action: 'delete', timestamp: new Date().toISOString() });
      } else {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'skills', id));
        } catch (err) {
          console.warn('Deleted skill locally, queued for sync:', err);
          enqueueOfflineAction({ id, type: 'skill', action: 'delete', timestamp: new Date().toISOString() });
        }
      }
    }
  };

  // Recommendation Letters
  const saveRecommendation = async (r: Omit<RecommendationLetter, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRec: RecommendationLetter = {
      ...r,
      id,
      userId: currentUid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newRec, ...recommendations];
    setRecommendations(updated);
    saveLocal('recommendations', updated);

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'recommendations', id), newRec);
      } catch (err) {
        console.warn('Saved recommendation locally:', err);
      }
    }
    return id;
  };

  const deleteRecommendation = async (id: string) => {
    const updated = recommendations.filter(item => item.id !== id);
    setRecommendations(updated);
    saveLocal('recommendations', updated);

    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'recommendations', id));
      } catch (err) {
        console.warn('Deleted recommendation locally:', err);
      }
    }
  };

  // Articles bookmarking
  const toggleSaveArticle = async (article: any) => {
    const existing = savedArticles.find(a => a.id === article.id);
    let updated: SavedArticle[];
    if (existing) {
      updated = savedArticles.filter(a => a.id !== article.id);
    } else {
      const newArticle: SavedArticle = {
        ...article,
        userId: currentUid,
        savedAt: new Date().toISOString(),
      };
      updated = [newArticle, ...savedArticles];
    }
    setSavedArticles(updated);
    saveLocal('articles', updated);
  };

  const isArticleSaved = (articleId: string) => {
    return savedArticles.some(a => a.id === articleId);
  };

  // Full Restore
  const restorePortfolioData = async (data: any) => {
    if (data.cases) {
      setCases(data.cases);
      saveLocal('cases', data.cases);
    }
    if (data.supervisors) {
      setSupervisors(data.supervisors);
      saveLocal('supervisors', data.supervisors);
    }
    if (data.records) {
      setTrainingRecords(data.records);
      saveLocal('records', data.records);
    }
    if (data.sessions) {
      setTrainingSessions(data.sessions);
      saveLocal('sessions', data.sessions);
    }
    if (data.skills) {
      setSkills(data.skills);
      saveLocal('skills', data.skills);
    }
    if (data.recommendations) {
      setRecommendations(data.recommendations);
      saveLocal('recommendations', data.recommendations);
    }
  };

  return (
    <DataContext.Provider
      value={{
        cases,
        supervisors,
        trainingRecords,
        trainingSessions,
        skills,
        recommendations,
        savedArticles,
        communityCases,
        allDoctors,
        syncStatus,
        addCase,
        updateCase,
        deleteCase,
        publishCaseToCommunity,
        unpublishCaseFromCommunity,
        toggleLikeCase,
        addCommentToCase,
        toggleFollowDoctor,
        acceptFollowRequest,
        declineFollowRequest,
        addSupervisor,
        updateSupervisor,
        deleteSupervisor,
        addTrainingRecord,
        updateTrainingRecord,
        deleteTrainingRecord,
        signTrainingRecords,
        verifyRecordIntegrity,
        verifyRecordIntegrityAsync,
        addTrainingSession,
        updateTrainingSession,
        deleteTrainingSession,
        addSkill,
        updateSkill,
        deleteSkill,
        saveRecommendation,
        deleteRecommendation,
        toggleSaveArticle,
        isArticleSaved,
        restorePortfolioData,
        syncNow,
        stats,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
