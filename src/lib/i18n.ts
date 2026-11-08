import { SupportedLanguage } from '../types';

export interface Translations {
  appName: string;
  tagline: string;
  dashboard: string;
  cases: string;
  supervisors: string;
  sessions: string;
  skills: string;
  analytics: string;
  recommendations: string;
  germanPortfolio: string;
  news: string;
  pubmed: string;
  logbookEntries: string;
  yourPosts: string;
  quickNavLogbook: string;
  backup: string;
  profile: string;
  admin: string;
  totalCases: string;
  totalProcedures: string;
  totalSessions: string;
  totalHours: string;
  verifiedHours: string;
  unverifiedHours: string;
  totalSupervisors: string;
  totalHospitals: string;
  skillsPracticed: string;
  assessedCompetencies: string;
  trainingProgress: string;
  addNewCase: string;
  addNewSupervisor: string;
  addTrainingRecord: string;
  addTrainingSession: string;
  addSkill: string;
  searchPlaceholder: string;
  filterBy: string;
  sortBy: string;
  exportOptions: string;
  exportExcel: string;
  exportWord: string;
  exportPdf: string;
  exportGermanPortfolio: string;
  caseReference: string;
  patientAge: string;
  presentationDate: string;
  hospital: string;
  department: string;
  specialty: string;
  primaryDiagnosis: string;
  management: string;
  outcome: string;
  actions: string;
  privacyNotice: string;
  consentConfirmTitle: string;
  consentConfirmText: string;
  online: string;
  offline: string;
  pendingSync: string;
  syncing: string;
  synced: string;
  aiAssistant: string;
  draftWithAi: string;
  saveChanges: string;
  cancel: string;
  delete: string;
  edit: string;
  viewDetails: string;
  hoursByWeek: string;
  hoursByMonth: string;
  proceduresBySpecialty: string;
  proceduresByHospital: string;
  proceduresBySupervisor: string;
  participationLevels: string;
  skillsDevelopment: string;
  backToMain: string;
  back: string;
  quickAccess: string;
  quickNavDashboard: string;
  quickNavCases: string;
  quickNavSessions: string;
  quickNavSkills: string;
  quickNavPubmed: string;
  quickNavNews: string;
  welcomeToSurgicalPortfolio: string;
  doctor: string;
  quickLogbookAction: string;
  recentClinicalCases: string;
  recentSupervisedOperations: string;
  documentedLogbook: string;
  operativeTheatres: string;
  hrsPerWeek: string;
  pendingReview: string;
  authorizedSupervisors: string;
  clinicalAffiliations: string;
  activeSkills: string;
  supervisorConfirmed: string;
  viewAll: string;
  returnToMainHub: string;
  currentSection: string;
  community: string;
  follow: string;
  following: string;
  followers: string;
  saveOnly: string;
  saveAndPublish: string;
  like: string;
  comment: string;
  comments: string;
  addComment: string;
  exportTraineePortfolio: string;
  showProgressStats: string;
  showPortfolioToFollowers: string;
  requireApproval: string;
  deleteCaseConfirm: string;
  deleteSessionConfirm: string;
  deleteRecordConfirm: string;
}

export const translations: Record<SupportedLanguage, Translations> = {
  en: {
    appName: 'SurgiTrack iLog',
    tagline: 'Document Every Case. Track Every Skill. Build Your Surgical Career.',
    dashboard: 'Dashboard',
    cases: 'Clinical Cases',
    supervisors: 'Supervisors & Portfolio',
    logbookEntries: 'Logbook Entries',
    yourPosts: 'Your Posts',
    quickNavLogbook: 'Logbook',
    sessions: 'Training Sessions',
    skills: 'Skills Matrix',
    analytics: 'Analytics & Progress',
    recommendations: 'Recommendation Letters',
    germanPortfolio: 'German Portfolio (Logbuch)',
    news: 'Surgical Literature & News',
    pubmed: 'PubMed Research',
    backup: 'Backup & Restore',
    profile: 'Profile & Settings',
    admin: 'Administration',
    totalCases: 'Clinical Cases',
    totalProcedures: 'Surgical Procedures',
    totalSessions: 'Training Sessions',
    totalHours: 'Total Training Hours',
    verifiedHours: 'Verified Hours',
    unverifiedHours: 'Unverified Hours',
    totalSupervisors: 'Supervisors',
    totalHospitals: 'Hospitals',
    skillsPracticed: 'Skills Practiced',
    assessedCompetencies: 'Assessed Competencies',
    trainingProgress: 'Curriculum Progress',
    addNewCase: 'Add Clinical Case',
    addNewSupervisor: 'Add New Supervisor',
    addTrainingRecord: 'Add Training Record',
    addTrainingSession: 'Log Attendance Session',
    addSkill: 'Add Surgical Skill',
    searchPlaceholder: 'Search cases, procedures, diagnoses...',
    filterBy: 'Filter by',
    sortBy: 'Sort by',
    exportOptions: 'Export Portfolio',
    exportExcel: 'Export Excel (.xlsx)',
    exportWord: 'Export Word (.docx)',
    exportPdf: 'Export PDF (.pdf)',
    exportGermanPortfolio: 'Deutsches Operationslogbuch',
    caseReference: 'Case Reference',
    patientAge: 'Patient Age',
    presentationDate: 'Presentation Date',
    hospital: 'Hospital / Clinic',
    department: 'Department',
    specialty: 'Specialty',
    primaryDiagnosis: 'Primary Diagnosis',
    management: 'Management',
    outcome: 'Clinical Outcome',
    actions: 'Actions',
    privacyNotice: 'Strict Medical Privacy: Patient name, ID, and identifying facial data are strictly prohibited.',
    consentConfirmTitle: 'Educational Consent & De-identification Confirmation',
    consentConfirmText: 'I confirm that this media is authorized for educational documentation, appropriate consent has been obtained, and no patient-identifying information is included.',
    online: 'Online & Synced',
    offline: 'Offline Mode (Local Drafts)',
    pendingSync: 'Pending Cloud Sync',
    syncing: 'Synchronizing...',
    synced: 'All Changes Saved',
    aiAssistant: 'AI Surgical Assistant',
    draftWithAi: 'Generate Formal Draft with Gemini AI',
    saveChanges: 'Save Record',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    viewDetails: 'View Details',
    hoursByWeek: 'Training Hours by Week',
    hoursByMonth: 'Training Hours by Month',
    proceduresBySpecialty: 'Operations by Specialty',
    proceduresByHospital: 'Procedures by Hospital',
    proceduresBySupervisor: 'Procedures by Supervisor',
    participationLevels: 'Surgical Participation Levels',
    skillsDevelopment: 'Skills Development Over Time',
    backToMain: 'Back to Main Hub',
    back: 'Back',
    quickAccess: 'Quick Access',
    quickNavDashboard: 'Dashboard',
    quickNavCases: 'Clinical Cases',
    quickNavSessions: 'Training Sessions',
    quickNavSkills: 'Skills Matrix',
    quickNavPubmed: 'PubMed',
    quickNavNews: 'Literature & News',
    welcomeToSurgicalPortfolio: 'Welcome to Your Surgical Portfolio',
    doctor: 'Doctor',
    quickLogbookAction: 'Quick Logbook Action',
    recentClinicalCases: 'Recent Clinical Cases',
    recentSupervisedOperations: 'Recent Supervised Operations',
    documentedLogbook: 'Documented Logbook',
    operativeTheatres: 'Operative Theatres',
    hrsPerWeek: 'hrs / week',
    pendingReview: 'pending review',
    authorizedSupervisors: 'Authorized Befugte',
    clinicalAffiliations: 'Clinical Affiliations',
    activeSkills: 'Active Skills',
    supervisorConfirmed: 'Supervisor Confirmed',
    viewAll: 'View All',
    returnToMainHub: 'Return to Surgical Literature & News',
    currentSection: 'Current Section',
    community: 'Surgical Community',
    follow: 'Follow',
    following: 'Following',
    followers: 'Followers',
    saveOnly: 'Save to Portfolio Only',
    saveAndPublish: 'Save & Publish to Community',
    like: 'Like',
    comment: 'Comment',
    comments: 'Comments',
    addComment: 'Add a surgical comment or feedback...',
    exportTraineePortfolio: 'Export Trainee Portfolio',
    showProgressStats: 'Show Training Progress & Hours to Followers',
    showPortfolioToFollowers: 'Show Surgical Portfolio to Followers',
    requireApproval: 'Require Approval to Follow (Private Profile)',
    deleteCaseConfirm: 'Are you sure you want to permanently delete this clinical case?',
    deleteSessionConfirm: 'Are you sure you want to delete this training session and deduct its hours?',
    deleteRecordConfirm: 'Are you sure you want to delete this surgical operation record and deduct its hours?',
  },
  ar: {
    appName: 'SurgiTrack iLog',
    tagline: 'وثّق كل حالة. طوّر كل مهارة. ابنِ مسيرتك الجراحية الاحترافية.',
    dashboard: 'لوحة التحكم الجراحية',
    cases: 'سجل الحالات السريرية',
    supervisors: 'المشرفون والملف التدريبي',
    logbookEntries: 'سجل العمليات والتدريب',
    yourPosts: 'منشوراتك',
    quickNavLogbook: 'السجل الجراحي',
    sessions: 'جلسات وساعات التدريب',
    skills: 'مصفوفة المهارات والكفاءات',
    analytics: 'التحليلات ومعدلات التقدم',
    recommendations: 'خطابات التوصية الأكاديمية',
    germanPortfolio: 'الملف الطبي الألماني (Logbuch)',
    news: 'الأبحاث والأخبار الجراحية',
    pubmed: 'أبحاث ومحرك PubMed',
    backup: 'النسخ الاحتياطي والاستعادة',
    profile: 'الملف الشخصي والإعدادات',
    admin: 'لوحة الإدارة والمراجعة',
    totalCases: 'الحالات السريرية',
    totalProcedures: 'العمليات والإجراءات الجراحية',
    totalSessions: 'جلسات التدريب الموثقة',
    totalHours: 'إجمالي ساعات التدريب',
    verifiedHours: 'الساعات المعتمدة',
    unverifiedHours: 'الساعات غير المعتمدة بعد',
    totalSupervisors: 'المشرفون الجراحيون',
    totalHospitals: 'المستشفيات والمراكز',
    skillsPracticed: 'المهارات الممارسة',
    assessedCompetencies: 'الكفاءات المقيمة',
    trainingProgress: 'معدل إنجاز المنهاج',
    addNewCase: 'إضافة حالة سريرية جديدة',
    addNewSupervisor: 'تسجيل مشرف جراحي',
    addTrainingRecord: 'إضافة سجل تدريب وعملية',
    addTrainingSession: 'تسجيل حضور تدريبي',
    addSkill: 'إضافة مهارة جراحية',
    searchPlaceholder: 'بحث في الحالات، العمليات، التشخيصات...',
    filterBy: 'تصفية حسب',
    sortBy: 'ترتيب حسب',
    exportOptions: 'تصدير الملف المهني',
    exportExcel: 'تصدير إكسل رسمي (.xlsx)',
    exportWord: 'تصدير وورد (.docx)',
    exportPdf: 'تصدير بي دي إف (.pdf)',
    exportGermanPortfolio: 'الملف الألماني المعتمد',
    caseReference: 'الرمز المرجعي للحالة',
    patientAge: 'عمر المريض',
    presentationDate: 'تاريخ الدخول / العرض',
    hospital: 'المستشفى / العيادة',
    department: 'القسم السريري',
    specialty: 'التخصص الجراحي',
    primaryDiagnosis: 'التشخيص الرئيسي',
    management: 'الخطة العلاجية',
    outcome: 'النتيجة السريرية',
    actions: 'الإجراءات',
    privacyNotice: 'سرية طبية صارمة: يُحظر تخزين اسم المريض أو رقمه التعريفي أو صوره الشخصية منعاً باتاً.',
    consentConfirmTitle: 'تأكيد الموافقة المستنيرة وإخفاء الهوية',
    consentConfirmText: 'أقر بأن هذه الوسائط مرخصة للتوثيق التعليمي الجراحي، وأنه تم الحصول على الموافقة المستنيرة للمريض، ولا تتضمن أي بيانات تكشف هوية المريض.',
    online: 'متصل ومتزامن سحابياً',
    offline: 'وضع عدم الاتصال (مسودات محلية)',
    pendingSync: 'بانتظار المزامنة السحابية',
    syncing: 'جارٍ المزامنة...',
    synced: 'تم حفظ كافة البيانات',
    aiAssistant: 'المساعد الجراحي الذكي',
    draftWithAi: 'صياغة خطاب رسمي عبر ذكاء Gemini',
    saveChanges: 'حفظ السجل',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    viewDetails: 'عرض التفاصيل',
    hoursByWeek: 'ساعات التدريب أسبوعياً',
    hoursByMonth: 'ساعات التدريب شهرياً',
    proceduresBySpecialty: 'العمليات حسب التخصص الجراحي',
    proceduresByHospital: 'الإجراءات حسب المستشفى',
    proceduresBySupervisor: 'العمليات حسب المشرف',
    participationLevels: 'مستويات المشاركة الجراحية',
    skillsDevelopment: 'تطور المهارات عبر الزمن',
    backToMain: 'الرجوع للقائمة الرئيسية',
    back: 'رجوع',
    quickAccess: 'الوصول السريع',
    quickNavDashboard: 'لوحة التحكم',
    quickNavCases: 'الحالات السريرية',
    quickNavSessions: 'جلسات التدريب',
    quickNavSkills: 'مصفوفة المهارات',
    quickNavPubmed: 'PubMed',
    quickNavNews: 'المجلات والأخبار',
    welcomeToSurgicalPortfolio: 'أهلاً بك في محفظتك وسجلك الجراحي والتدريبي',
    doctor: 'دكتور',
    quickLogbookAction: 'إجراء توثيق سريع',
    recentClinicalCases: 'أحدث الحالات السريرية',
    recentSupervisedOperations: 'أحدث العمليات الجراحية المعتمدة',
    documentedLogbook: 'سجل الحالات الموثقة',
    operativeTheatres: 'العمليات الجراحية',
    hrsPerWeek: 'ساعة / أسبوع',
    pendingReview: 'قيد المراجعة',
    authorizedSupervisors: 'مشرفون معتمدون',
    clinicalAffiliations: 'المراكز والمستشفيات',
    activeSkills: 'مهارات مسجلة',
    supervisorConfirmed: 'معتمدة من المشرف',
    viewAll: 'عرض الكل',
    returnToMainHub: 'الرجوع للمجلات والأخبار الجراحية',
    currentSection: 'القسم الحالي',
    community: 'مجتمع الجراحين والتفاعل',
    follow: 'متابعة',
    following: 'تتابعه',
    followers: 'المتابعون',
    saveOnly: 'حفظ فقط في المحفظة',
    saveAndPublish: 'حفظ ونشر في المجتمع الجراحي',
    like: 'إعجاب',
    comment: 'تعليق',
    comments: 'التعليقات',
    addComment: 'أضف تعليقاً أو استفساراً جراحياً...',
    exportTraineePortfolio: 'تصدير بورتفوليو المتدرب',
    showProgressStats: 'إظهار نسبة التقدم وساعات التدريب للمتابعين',
    showPortfolioToFollowers: 'إظهار ملف العمليات والكفاءات للمتابعين',
    requireApproval: 'طلب الموافقة للمتابعة (حساب خاص)',
    deleteCaseConfirm: 'هل أنت متأكد من حذف هذه الحالة السريرية نهائياً؟',
    deleteSessionConfirm: 'هل أنت متأكد من حذف جلسة التدريب هذه وخصم ساعاتها؟',
    deleteRecordConfirm: 'هل أنت متأكد من حذف سجل هذه العملية الجراحية وخصم ساعاتها؟',
  },
  de: {
    appName: 'SurgiTrack iLog',
    tagline: 'Jeden Fall dokumentieren. Jede Fähigkeit erfassen. Ihre chirurgische Karriere aufbauen.',
    dashboard: 'Chirurgisches Dashboard',
    cases: 'Klinische Fälle (Logbuch)',
    supervisors: 'Weiterbildungsbefugte & Portfolio',
    logbookEntries: 'Logbuch-Einträge',
    yourPosts: 'Ihre Beiträge',
    quickNavLogbook: 'Logbuch',
    sessions: 'Weiterbildungsstunden',
    skills: 'Kompetenzmatrix',
    analytics: 'Analytik & Weiterbildungsfortschritt',
    recommendations: 'Empfehlungsschreiben & Zeugnisse',
    germanPortfolio: 'Deutsches Operationslogbuch',
    news: 'Chirurgische Fachliteratur & News',
    pubmed: 'PubMed Recherche',
    backup: 'Sicherung & Wiederherstellung',
    profile: 'Profil & Einstellungen',
    admin: 'Systemadministration',
    totalCases: 'Klinische Fälle',
    totalProcedures: 'Operative Eingriffe',
    totalSessions: 'Dokumentierte Sitzungen',
    totalHours: 'Weiterbildungsstunden gesamt',
    verifiedHours: 'Verifizierte Stunden',
    unverifiedHours: 'Ausstehende Stunden',
    totalSupervisors: 'Betreuende Fachärzte',
    totalHospitals: 'Kliniken / Krankenhäuser',
    skillsPracticed: 'Erfasste Fertigkeiten',
    assessedCompetencies: 'Bestätigte Kompetenzen',
    trainingProgress: 'Weiterbildungsfortschritt',
    addNewCase: 'Klinischen Fall erfassen',
    addNewSupervisor: 'Weiterbildungsbefugten anlegen',
    addTrainingRecord: 'Weiterbildungs- / OP-Eintrag',
    addTrainingSession: 'Anwesenheit / Zeit erfassen',
    addSkill: 'Chirurgische Fertigkeit hinzufügen',
    searchPlaceholder: 'Fälle, Prozeduren, Diagnosen durchsuchen...',
    filterBy: 'Filtern nach',
    sortBy: 'Sortieren nach',
    exportOptions: 'Portfolio exportieren',
    exportExcel: 'Excel-Export (.xlsx)',
    exportWord: 'Word-Export (.docx)',
    exportPdf: 'PDF-Export (.pdf)',
    exportGermanPortfolio: 'Deutsches Operationslogbuch (WBO)',
    caseReference: 'Fall-Referenznummer',
    patientAge: 'Patientenalter',
    presentationDate: 'Aufnahmedatum',
    hospital: 'Klinik / Krankenhaus',
    department: 'Abteilung / Station',
    specialty: 'Fachgebiet',
    primaryDiagnosis: 'Hauptdiagnose',
    management: 'Therapie / Management',
    outcome: 'Klinischer Verlauf',
    actions: 'Aktionen',
    privacyNotice: 'Strikter Datenschutz: Keine Patientennamen, IDs oder identifizierenden Bilddaten.',
    consentConfirmTitle: 'Einwilligung & Anonymisierungsbestätigung',
    consentConfirmText: 'Ich bestätige, dass dieses Medium für Ausbildungszwecke autorisiert ist, eine entsprechende Einwilligung vorliegt und keinerlei personenbezogene Patientendaten enthalten sind.',
    online: 'Online & Synchronisiert',
    offline: 'Offline-Modus (Lokale Entwürfe)',
    pendingSync: 'Ausstehende Synchronisation',
    syncing: 'Synchronisiere...',
    synced: 'Alle Daten gesichert',
    aiAssistant: 'Chirurgischer KI-Assistent',
    draftWithAi: 'Fachgutachten via Gemini KI entwerfen',
    saveChanges: 'Eintrag speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    viewDetails: 'Details anzeigen',
    hoursByWeek: 'Weiterbildungsstunden pro Woche',
    hoursByMonth: 'Weiterbildungsstunden pro Monat',
    proceduresBySpecialty: 'Operationen nach Fachgebiet',
    proceduresByHospital: 'Eingriffe nach Klinik',
    proceduresBySupervisor: 'Eingriffe nach Facharzt',
    participationLevels: 'Beteiligungsgrad (Operateur / Assistent)',
    skillsDevelopment: 'Kompetenzentwicklung im Zeitverlauf',
    backToMain: 'Zurück zur Hauptübersicht',
    back: 'Zurück',
    quickAccess: 'Schnellzugriff',
    quickNavDashboard: 'Dashboard',
    quickNavCases: 'Klinische Fälle',
    quickNavSessions: 'Weiterbildungsstunden',
    quickNavSkills: 'Kompetenzmatrix',
    quickNavPubmed: 'PubMed',
    quickNavNews: 'Fachliteratur & News',
    welcomeToSurgicalPortfolio: 'Willkommen in Ihrem chirurgischen Weiterbildungsportfolio',
    doctor: 'Arzt / Ärztin',
    quickLogbookAction: 'Schnellaktion Logbuch',
    recentClinicalCases: 'Aktuelle klinische Fälle',
    recentSupervisedOperations: 'Aktuelle betreute Operationen',
    documentedLogbook: 'Dokumentiertes Logbuch',
    operativeTheatres: 'Operative Eingriffe',
    hrsPerWeek: 'Std. / Woche',
    pendingReview: 'ausstehend',
    authorizedSupervisors: 'Weiterbildungsbefugte',
    clinicalAffiliations: 'Klinikverbünde',
    activeSkills: 'Erfasste Fertigkeiten',
    supervisorConfirmed: 'Befugten-Bestätigt',
    viewAll: 'Alle anzeigen',
    returnToMainHub: 'Zurück zur Fachliteratur & News',
    currentSection: 'Aktueller Bereich',
    community: 'Chirurgische Community',
    follow: 'Folgen',
    following: 'Folge ich',
    followers: 'Follower',
    saveOnly: 'Nur im Portfolio speichern',
    saveAndPublish: 'Im Portfolio speichern & veröffentlichen',
    like: 'Gefällt mir',
    comment: 'Kommentar',
    comments: 'Kommentare',
    addComment: 'Kommentar oder Fallberatung hinzufügen...',
    exportTraineePortfolio: 'Trainee-Portfolio exportieren',
    showProgressStats: 'Weiterbildungsstunden & Fortschritt für Follower anzeigen',
    showPortfolioToFollowers: 'Operationsportfolio für Follower freigeben',
    requireApproval: 'Follower-Anfragen manuell bestätigen (Privates Profil)',
    deleteCaseConfirm: 'Möchten Sie diesen klinischen Fall wirklich dauerhaft löschen?',
    deleteSessionConfirm: 'Möchten Sie diese Weiterbildungssitzung löschen und die Stunden abziehen?',
    deleteRecordConfirm: 'Möchten Sie diesen operativen Eingriff löschen und die Stunden abziehen?',
  },
};
