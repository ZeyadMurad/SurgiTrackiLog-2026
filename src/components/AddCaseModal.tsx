import React, { useState } from 'react';
import { X, ShieldAlert, Plus, Trash2, Upload, FileText, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';
import { ClinicalCase, InvestigationItem } from '../types';
import {
  SURGICAL_SPECIALTIES,
  INVESTIGATION_CATALOG,
  COMMON_HOSPITALS,
  COMMON_DEPARTMENTS,
  COMMON_CHIEF_COMPLAINTS,
  COMMON_DURATIONS,
  COMMON_ALLERGIES,
  COMMON_MEDICAL_HISTORIES,
  COMMON_SURGICAL_HISTORIES,
  COMMON_GENERAL_EXAMS,
  COMMON_VITALS,
  COMMON_ABDOMINAL_EXAMS,
  COMMON_LOCAL_EXAMS,
  COMMON_PRIMARY_DIAGNOSES,
  COMMON_SECONDARY_DIAGNOSES,
  COMMON_DIFFERENTIAL_DIAGNOSES,
  COMMON_PROCEDURE_NAMES,
  COMMON_SURGICAL_APPROACHES,
  COMMON_ANAESTHESIA_TYPES,
  COMMON_OPERATIVE_FINDINGS,
  COMMON_OPERATIVE_OUTCOMES,
  COMMON_WOUND_STATUSES,
  SAMPLE_VASCULAR_CLINICAL_CASE,
  SAMPLE_GENERAL_SURGERY_CLINICAL_CASE,
} from '../lib/medicalDefaults';
import { StandardSelectWithOther } from './StandardSelectWithOther';

interface AddCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    caseData: Omit<ClinicalCase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    publishToCommunity?: boolean
  ) => Promise<string>;
  existingCase?: ClinicalCase | null;
  supervisorId?: string;
  supervisorName?: string;
}

export const AddCaseModal: React.FC<AddCaseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingCase,
  supervisorId,
  supervisorName,
}) => {
  // Generate random anonymous case reference if creating
  const autoRef = existingCase?.caseReference || `CAS-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const [caseReference] = useState(autoRef);
  const [patientAge, setPatientAge] = useState<number>(existingCase?.patientAge || 55);
  const [patientSex, setPatientSex] = useState<'Male' | 'Female' | 'Other' | 'Undisclosed'>(
    existingCase?.patientSex || 'Male'
  );
  const [presentationDate, setPresentationDate] = useState(
    existingCase?.presentationDate || new Date().toISOString().substring(0, 10)
  );
  const [hospital, setHospital] = useState(existingCase?.hospital || COMMON_HOSPITALS[0]);
  const [department, setDepartment] = useState(existingCase?.department || COMMON_DEPARTMENTS[0]);
  const [specialty, setSpecialty] = useState(existingCase?.specialty || 'General Surgery');

  // History
  const [chiefComplaint, setChiefComplaint] = useState(existingCase?.chiefComplaint || '');
  const [hpi, setHpi] = useState(existingCase?.historyOfPresentIllness || '');
  const [duration, setDuration] = useState(existingCase?.durationOfSymptoms || '');
  const [medHistory, setMedHistory] = useState(existingCase?.relevantMedicalHistory || '');
  const [surgHistory, setSurgHistory] = useState(existingCase?.surgicalHistory || '');
  const [drugHistory, setDrugHistory] = useState(existingCase?.drugHistory || '');
  const [allergies, setAllergies] = useState(existingCase?.allergies || 'Nil known drug allergies (NKDA)');
  const [familyHistory, setFamilyHistory] = useState(existingCase?.familyHistory || '');
  const [socialHistory, setSocialHistory] = useState(existingCase?.socialHistory || '');

  // Examination
  const [generalExam, setGeneralExam] = useState(existingCase?.examination?.general || '');
  const [vitals, setVitals] = useState(existingCase?.examination?.vitals || '');
  const [cardioExam, setCardioExam] = useState(existingCase?.examination?.cardiovascular || '');
  const [respExam, setRespExam] = useState(existingCase?.examination?.respiratory || '');
  const [abdoExam, setAbdoExam] = useState(existingCase?.examination?.abdominal || '');
  const [neuroExam, setNeuroExam] = useState(existingCase?.examination?.neurological || '');
  const [localExam, setLocalExam] = useState(existingCase?.examination?.local || '');
  const [otherExam, setOtherExam] = useState(existingCase?.examination?.other || '');

  // Investigations
  const [investigations, setInvestigations] = useState<InvestigationItem[]>(
    existingCase?.investigations || []
  );
  const [selectedInvestName, setSelectedInvestName] = useState(INVESTIGATION_CATALOG.Laboratory[0]);
  const [investResult, setInvestResult] = useState('');
  const [investSummary, setInvestSummary] = useState('');

  // Diagnosis
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState(existingCase?.primaryDiagnosis || '');
  const [secondaryDiagnoses, setSecondaryDiagnoses] = useState(existingCase?.secondaryDiagnoses || '');
  const [differentialDiagnosis, setDifferentialDiagnosis] = useState(existingCase?.differentialDiagnosis || '');
  const [icd10Code, setIcd10Code] = useState(existingCase?.icd10Code || '');
  const [clinicalAssessment, setClinicalAssessment] = useState(existingCase?.clinicalAssessment || '');

  // Management
  const [initialMgmt, setInitialMgmt] = useState(existingCase?.management?.initial || '');
  const [medicalMgmt, setMedicalMgmt] = useState(existingCase?.management?.medical || '');
  const [surgicalMgmt, setSurgicalMgmt] = useState(existingCase?.management?.surgical || '');
  const [treatmentPlan, setTreatmentPlan] = useState(existingCase?.management?.treatmentPlan || '');
  const [outcome, setOutcome] = useState(existingCase?.management?.outcome || '');
  const [complications, setComplications] = useState(existingCase?.management?.complications || '');

  // Surgical Procedure
  const [hasProcedure, setHasProcedure] = useState(!!existingCase?.surgicalProcedure);
  const [procName, setProcName] = useState(existingCase?.surgicalProcedure?.procedureName || '');
  const [procDate, setProcDate] = useState(
    existingCase?.surgicalProcedure?.procedureDate || new Date().toISOString().substring(0, 10)
  );
  const [procIndication, setProcIndication] = useState(existingCase?.surgicalProcedure?.indication || '');
  const [procApproach, setProcApproach] = useState(existingCase?.surgicalProcedure?.surgicalApproach || '');
  const [procFindings, setProcFindings] = useState(existingCase?.surgicalProcedure?.operativeFindings || '');
  const [procSummary, setProcSummary] = useState(existingCase?.surgicalProcedure?.procedureSummary || '');
  const [anaesthesia, setAnaesthesia] = useState(existingCase?.surgicalProcedure?.anaesthesiaType || 'General Endotracheal Anaesthesia (GETA)');
  const [procOutcome, setProcOutcome] = useState(existingCase?.surgicalProcedure?.outcome || 'Uneventful procedure');
  const [participationRole, setParticipationRole] = useState(
    existingCase?.surgicalProcedure?.participationRole || 'Assisted'
  );

  // Follow-up
  const [followUpDate, setFollowUpDate] = useState(existingCase?.followUp?.followUpDate || '');
  const [clinicalProgress, setClinicalProgress] = useState(existingCase?.followUp?.clinicalProgress || '');
  const [woundStatus, setWoundStatus] = useState(existingCase?.followUp?.woundStatus || COMMON_WOUND_STATUSES[0]);

  // Attachments & Consent
  const [attachments, setAttachments] = useState(existingCase?.attachments || []);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);

  // Active Tab in the modal
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'exam' | 'investigations' | 'diagnosis' | 'procedure' | 'followup' | 'media'>('info');

  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Load Model Exemplary Case
  const handleLoadSample = (sampleType: 'vascular' | 'general') => {
    const sample = sampleType === 'vascular' ? SAMPLE_VASCULAR_CLINICAL_CASE : SAMPLE_GENERAL_SURGERY_CLINICAL_CASE;
    setPatientAge(sample.patientAge);
    setPatientSex(sample.patientSex);
    setPresentationDate(sample.presentationDate);
    setHospital(sample.hospital);
    setDepartment(sample.department);
    setSpecialty(sample.specialty);

    setChiefComplaint(sample.chiefComplaint);
    setHpi(sample.historyOfPresentIllness);
    setDuration(sample.durationOfSymptoms);
    setMedHistory(sample.relevantMedicalHistory);
    setSurgHistory(sample.surgicalHistory);
    setDrugHistory(sample.drugHistory);
    setAllergies(sample.allergies);
    setFamilyHistory(sample.familyHistory);
    setSocialHistory(sample.socialHistory);

    setGeneralExam(sample.examination.general);
    setVitals(sample.examination.vitals);
    setCardioExam(sample.examination.cardiovascular);
    setRespExam(sample.examination.respiratory);
    setAbdoExam(sample.examination.abdominal);
    setNeuroExam(sample.examination.neurological);
    setLocalExam(sample.examination.local);
    setOtherExam(sample.examination.other);

    setInvestigations(sample.investigations as InvestigationItem[]);
    setPrimaryDiagnosis(sample.primaryDiagnosis);
    setSecondaryDiagnoses(sample.secondaryDiagnoses);
    setDifferentialDiagnosis(sample.differentialDiagnosis);
    setIcd10Code(sample.icd10Code);
    setClinicalAssessment(sample.clinicalAssessment);

    setInitialMgmt(sample.management.initial);
    setMedicalMgmt(sample.management.medical);
    setSurgicalMgmt(sample.management.surgical);
    setTreatmentPlan(sample.management.treatmentPlan);
    setOutcome(sample.management.outcome);
    setComplications(sample.management.complications);

    if (sample.surgicalProcedure) {
      setHasProcedure(true);
      setProcName(sample.surgicalProcedure.procedureName);
      setProcDate(sample.surgicalProcedure.procedureDate);
      setProcIndication(sample.surgicalProcedure.indication);
      setProcApproach(sample.surgicalProcedure.surgicalApproach);
      setProcFindings(sample.surgicalProcedure.operativeFindings);
      setProcSummary(sample.surgicalProcedure.procedureSummary);
      setAnaesthesia(sample.surgicalProcedure.anaesthesiaType);
      setProcOutcome(sample.surgicalProcedure.outcome);
      setParticipationRole(sample.surgicalProcedure.participationRole as any);
    }

    if (sample.followUp) {
      setFollowUpDate(sample.followUp.followUpDate);
      setClinicalProgress(sample.followUp.clinicalProgress);
      setWoundStatus(sample.followUp.woundStatus);
    }
  };

  const handleAddInvestigation = () => {
    if (!selectedInvestName) return;
    const item: InvestigationItem = {
      name: selectedInvestName,
      category: 'Laboratory',
      date: new Date().toISOString().substring(0, 10),
      result: investResult || 'Normal limits',
      summary: investSummary || 'Evaluated',
    };
    setInvestigations([...investigations, item]);
    setInvestResult('');
    setInvestSummary('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPendingUploadFile(e.target.files[0]);
      setShowConsentModal(true);
    }
  };

  const confirmUploadWithConsent = () => {
    if (!pendingUploadFile) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newAtt = {
        id: `att_${Date.now()}`,
        title: pendingUploadFile.name,
        type: 'operative_photo' as const,
        url: reader.result as string,
        consentConfirmed: true,
        uploadedAt: new Date().toISOString(),
      };
      setAttachments([...attachments, newAtt]);
      setShowConsentModal(false);
      setPendingUploadFile(null);
    };
    reader.readAsDataURL(pendingUploadFile);
  };

  const handleSaveAction = async (publishToCommunity: boolean) => {
    setValidationError(null);
    if (!primaryDiagnosis.trim()) {
      setValidationError('Primary diagnosis is required to save this case.');
      setActiveTab('diagnosis');
      return;
    }

    setSaving(true);
    try {
      const payload: Omit<ClinicalCase, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        supervisorId: supervisorId || existingCase?.supervisorId,
        supervisorName: supervisorName || existingCase?.supervisorName,
        caseReference,
        patientAge: Number(patientAge),
        patientSex,
        presentationDate,
        hospital,
        department,
        specialty,
        chiefComplaint,
        historyOfPresentIllness: hpi,
        durationOfSymptoms: duration,
        relevantMedicalHistory: medHistory,
        surgicalHistory: surgHistory,
        drugHistory,
        allergies,
        familyHistory,
        socialHistory,
        examination: {
          general: generalExam,
          vitals,
          cardiovascular: cardioExam,
          respiratory: respExam,
          abdominal: abdoExam,
          neurological: neuroExam,
          local: localExam,
          other: otherExam,
        },
        investigations,
        primaryDiagnosis,
        secondaryDiagnoses,
        differentialDiagnosis,
        icd10Code,
        clinicalAssessment,
        management: {
          initial: initialMgmt,
          medical: medicalMgmt,
          surgical: surgicalMgmt,
          treatmentPlan,
          outcome,
          complications,
        },
        surgicalProcedure: hasProcedure
          ? {
              procedureName: procName,
              procedureDate: procDate,
              specialty,
              indication: procIndication,
              surgicalApproach: procApproach,
              operativeFindings: procFindings,
              procedureSummary: procSummary,
              anaesthesiaType: anaesthesia,
              outcome: procOutcome,
              participationRole: participationRole as any,
            }
          : undefined,
        followUp: {
          followUpDate,
          clinicalProgress,
          woundStatus,
        },
        attachments,
      };

      await onSave(payload, publishToCommunity);
      onClose();
    } catch (err: any) {
      setValidationError(`Error saving case: ${err.message || 'Please check your inputs'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col my-auto max-h-[95dvh] sm:max-h-[92vh] overflow-hidden modal-dialog-responsive">
        {/* Header */}
        <div className="bg-[#101C32] text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 font-bold">
              {caseReference.substring(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">
                  {existingCase ? 'Edit Clinical Case' : 'New Clinical Case Logbook Entry'}
                </h2>
                <span className="font-mono text-xs bg-teal-900/80 text-teal-300 px-2.5 py-0.5 rounded-full border border-teal-500/40">
                  {caseReference}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Adheres strictly to zero-identifying patient data and professional logbook standards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Validation error message banner */}
        {validationError && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 flex items-center justify-between text-xs text-red-700 font-medium animate-fadeIn">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-red-600 shrink-0" />
              <span>{validationError}</span>
            </div>
            <button
              onClick={() => setValidationError(null)}
              className="text-red-500 hover:text-red-700 p-1"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Exemplary Sample Buttons Banner (User Request) */}
        <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-blue-50 border-b border-teal-100 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-teal-900 font-semibold">
            <Sparkles size={16} className="text-teal-600 animate-pulse" />
            <span>نماذج حالات سريرية جاهزة / Exemplary Model Cases:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleLoadSample('vascular')}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-teal-600 hover:text-white text-teal-800 text-[11px] font-bold rounded-lg border border-teal-300 shadow-2xs transition cursor-pointer"
            >
              <BookOpen size={12} /> تحميل حالة جراحة أوعية نموذجية (Vascular)
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample('general')}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-blue-600 hover:text-white text-blue-800 text-[11px] font-bold rounded-lg border border-blue-300 shadow-2xs transition cursor-pointer"
            >
              <BookOpen size={12} /> تحميل حالة جراحة عامة نموذجية (Appendicitis)
            </button>
          </div>
        </div>

        {/* Strict Medical Privacy Banner */}
        <div className="bg-red-50 border-b border-red-200 px-6 py-1.5 flex items-center gap-2 text-xs text-red-900 font-medium">
          <ShieldAlert size={15} className="text-red-600 shrink-0" />
          <span>
            <strong>Strict Anonymity Rule:</strong> Do NOT enter patient names, national IDs, file numbers, addresses, phone numbers, or facial photos.
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 overflow-x-auto text-xs font-semibold scrollbar-none">
          {[
            { id: 'info', label: '1. Patient Info' },
            { id: 'history', label: '2. History' },
            { id: 'exam', label: '3. Examination' },
            { id: 'investigations', label: '4. Investigations' },
            { id: 'diagnosis', label: '5. Diagnosis' },
            { id: 'procedure', label: '6. Procedure' },
            { id: 'followup', label: '7. Follow-up' },
            { id: 'media', label: `8. Media (${attachments.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3.5 whitespace-nowrap border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-[#0D9488] text-[#0D9488] font-bold bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={(e) => { e.preventDefault(); handleSaveAction(false); }} className="flex-1 p-6 overflow-y-auto space-y-5 text-sm text-slate-700 bg-[#FBFDFE]">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Anonymous Case Reference
                </label>
                <input
                  type="text"
                  disabled
                  value={caseReference}
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-slate-600 font-mono text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Presentation Date *
                </label>
                <input
                  type="date"
                  required
                  value={presentationDate}
                  onChange={(e) => setPresentationDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient Age (Years) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  required
                  value={patientAge}
                  onChange={(e) => setPatientAge(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sex (Optional)
                </label>
                <select
                  value={patientSex}
                  onChange={(e) => setPatientSex(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Undisclosed">Undisclosed</option>
                </select>
              </div>

              {/* Standardized Dropdowns with Other */}
              <StandardSelectWithOther
                label="Hospital / Medical Center"
                value={hospital}
                onChange={setHospital}
                options={COMMON_HOSPITALS}
                placeholder="-- Select Hospital or Enter Custom --"
                required
              />

              <StandardSelectWithOther
                label="Department"
                value={department}
                onChange={setDepartment}
                options={COMMON_DEPARTMENTS}
                placeholder="-- Select Department or Enter Custom --"
                required
              />

              <div className="md:col-span-2">
                <StandardSelectWithOther
                  label="Surgical Specialty"
                  value={specialty}
                  onChange={setSpecialty}
                  options={SURGICAL_SPECIALTIES}
                  placeholder="-- Select Surgical Specialty --"
                  required
                />
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <StandardSelectWithOther
                label="Chief Complaint"
                value={chiefComplaint}
                onChange={setChiefComplaint}
                options={COMMON_CHIEF_COMPLAINTS}
                placeholder="-- Select Standard Chief Complaint or Type Custom --"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StandardSelectWithOther
                  label="Duration of Symptoms"
                  value={duration}
                  onChange={setDuration}
                  options={COMMON_DURATIONS}
                  placeholder="-- Select Typical Duration --"
                />

                <StandardSelectWithOther
                  label="Known Drug Allergies"
                  value={allergies}
                  onChange={setAllergies}
                  options={COMMON_ALLERGIES}
                  placeholder="-- Select Allergies Profile --"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  History of Present Illness (HPI)
                </label>
                <textarea
                  rows={4}
                  placeholder="Detailed chronological progression of symptoms..."
                  value={hpi}
                  onChange={(e) => setHpi(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StandardSelectWithOther
                  label="Relevant Medical History"
                  value={medHistory}
                  onChange={setMedHistory}
                  options={COMMON_MEDICAL_HISTORIES}
                  isTextArea
                  rows={2}
                  placeholder="-- Select Pre-existing Medical Condition Profile or Custom --"
                />

                <StandardSelectWithOther
                  label="Past Surgical History"
                  value={surgHistory}
                  onChange={setSurgHistory}
                  options={COMMON_SURGICAL_HISTORIES}
                  isTextArea
                  rows={2}
                  placeholder="-- Select Surgical History Profile or Custom --"
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Medications / Drug History
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Anticoagulants, Antiplatelets, Antihypertensives..."
                    value={drugHistory}
                    onChange={(e) => setDrugHistory(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Family & Social History (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Family aneurysm history, smoking pack-years, occupation..."
                    value={familyHistory}
                    onChange={(e) => setFamilyHistory(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'exam' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StandardSelectWithOther
                  label="General Appearance"
                  value={generalExam}
                  onChange={setGeneralExam}
                  options={COMMON_GENERAL_EXAMS}
                  placeholder="-- Select General Physical State --"
                />

                <StandardSelectWithOther
                  label="Vital Signs Preset"
                  value={vitals}
                  onChange={setVitals}
                  options={COMMON_VITALS}
                  placeholder="-- Select Typical Vital Signs or Enter Custom --"
                />

                <StandardSelectWithOther
                  label="Abdominal Examination"
                  value={abdoExam}
                  onChange={setAbdoExam}
                  options={COMMON_ABDOMINAL_EXAMS}
                  isTextArea
                  rows={2}
                  placeholder="-- Select Abdominal Findings or Enter Custom --"
                />

                <StandardSelectWithOther
                  label="Local / Regional Surgical Examination"
                  value={localExam}
                  onChange={setLocalExam}
                  options={COMMON_LOCAL_EXAMS}
                  isTextArea
                  rows={2}
                  placeholder="-- Select Regional/Vascular Findings or Custom --"
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cardiovascular Examination
                  </label>
                  <input
                    type="text"
                    placeholder="S1 + S2, no murmurs..."
                    value={cardioExam}
                    onChange={(e) => setCardioExam(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Respiratory Examination
                  </label>
                  <input
                    type="text"
                    placeholder="Bilateral vesicular breathing, clear lung bases..."
                    value={respExam}
                    onChange={(e) => setRespExam(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'investigations' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Add Clinical Investigation
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Investigation Test
                    </label>
                    <select
                      value={selectedInvestName}
                      onChange={(e) => setSelectedInvestName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                    >
                      <optgroup label="Laboratory">
                        {INVESTIGATION_CATALOG.Laboratory.map(item => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Imaging">
                        {INVESTIGATION_CATALOG.Imaging.map(item => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Cardiac">
                        {INVESTIGATION_CATALOG.Cardiac.map(item => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Result
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hb 13.8, WBC 14.2, Plt 280"
                      value={investResult}
                      onChange={(e) => setInvestResult(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Summary / Impression
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Leukocytosis consistent with acute infection"
                      value={investSummary}
                      onChange={(e) => setInvestSummary(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddInvestigation}
                    className="flex items-center gap-1.5 bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition"
                  >
                    <Plus size={14} /> Add Test Result
                  </button>
                </div>
              </div>

              {/* Added investigations table */}
              {investigations.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Investigation</th>
                        <th className="p-2.5">Result</th>
                        <th className="p-2.5">Summary</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {investigations.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium text-slate-900">{item.name}</td>
                          <td className="p-2.5 text-slate-700">{item.result}</td>
                          <td className="p-2.5 text-slate-500">{item.summary}</td>
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => setInvestigations(investigations.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-4">
                  No investigations recorded yet. Select from the checklist above.
                </p>
              )}
            </div>
          )}

          {activeTab === 'diagnosis' && (
            <div className="space-y-4">
              <StandardSelectWithOther
                label="Primary Diagnosis"
                value={primaryDiagnosis}
                onChange={setPrimaryDiagnosis}
                options={COMMON_PRIMARY_DIAGNOSES}
                placeholder="-- Select Standard Diagnosis or Enter Custom --"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StandardSelectWithOther
                  label="Secondary Diagnoses"
                  value={secondaryDiagnoses}
                  onChange={setSecondaryDiagnoses}
                  options={COMMON_SECONDARY_DIAGNOSES}
                  placeholder="-- Select Secondary Diagnoses Profile --"
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ICD-10 Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. I70.24 / K35.80"
                    value={icd10Code}
                    onChange={(e) => setIcd10Code(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <StandardSelectWithOther
                label="Differential Diagnoses Considered"
                value={differentialDiagnosis}
                onChange={setDifferentialDiagnosis}
                options={COMMON_DIFFERENTIAL_DIAGNOSES}
                placeholder="-- Select Differential Diagnoses Considered --"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Assessment & Reasoning
                </label>
                <textarea
                  rows={3}
                  placeholder="Synthesis of clinical findings, risk stratification, operative candidacy..."
                  value={clinicalAssessment}
                  onChange={(e) => setClinicalAssessment(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs"
                />
              </div>
            </div>
          )}

          {activeTab === 'procedure' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-xl">
                <input
                  type="checkbox"
                  id="hasProcedureCheck"
                  checked={hasProcedure}
                  onChange={(e) => setHasProcedure(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <label htmlFor="hasProcedureCheck" className="text-xs font-bold text-teal-950 cursor-pointer">
                  A surgical procedure was performed for this clinical case
                </label>
              </div>

              {hasProcedure && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StandardSelectWithOther
                      label="Procedure Name"
                      value={procName}
                      onChange={setProcName}
                      options={COMMON_PROCEDURE_NAMES}
                      placeholder="-- Select Procedure or Enter Custom --"
                      required
                    />

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Procedure Date
                      </label>
                      <input
                        type="date"
                        value={procDate}
                        onChange={(e) => setProcDate(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Participation Role * (Prompt Rule: Observation is not Assistance!)
                      </label>
                      <select
                        value={participationRole}
                        onChange={(e) => setParticipationRole(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      >
                        <option value="Observer">Observer</option>
                        <option value="Assisted">Assisted</option>
                        <option value="First Assistant">First Assistant</option>
                        <option value="Second Assistant">Second Assistant</option>
                        <option value="Performed Specific Steps Under Direct Supervision">
                          Performed Specific Steps Under Direct Supervision
                        </option>
                        <option value="Performed Under Supervision">Performed Under Supervision</option>
                      </select>
                    </div>

                    <StandardSelectWithOther
                      label="Anaesthesia Type"
                      value={anaesthesia}
                      onChange={setAnaesthesia}
                      options={COMMON_ANAESTHESIA_TYPES}
                      placeholder="-- Select Anaesthesia Technique --"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StandardSelectWithOther
                      label="Surgical Approach"
                      value={procApproach}
                      onChange={setProcApproach}
                      options={COMMON_SURGICAL_APPROACHES}
                      placeholder="-- Select Standard Approach or Custom --"
                    />

                    <StandardSelectWithOther
                      label="Operative Outcome"
                      value={procOutcome}
                      onChange={setProcOutcome}
                      options={COMMON_OPERATIVE_OUTCOMES}
                      placeholder="-- Select Immediate Operative Outcome --"
                    />
                  </div>

                  <StandardSelectWithOther
                    label="Operative Findings"
                    value={procFindings}
                    onChange={setProcFindings}
                    options={COMMON_OPERATIVE_FINDINGS}
                    isTextArea
                    rows={2}
                    placeholder="-- Select Operative Findings or Enter Custom --"
                  />

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Procedure Summary / Operative Steps
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Step-by-step summary: Pneumoperitoneum, vessel exposure, anastomosis, closure..."
                      value={procSummary}
                      onChange={(e) => setProcSummary(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'followup' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <StandardSelectWithOther
                  label="Wound Status"
                  value={woundStatus}
                  onChange={setWoundStatus}
                  options={COMMON_WOUND_STATUSES}
                  placeholder="-- Select Wound Status --"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Progress & Post-operative Course
                </label>
                <textarea
                  rows={3}
                  placeholder="Tolerating oral diet, mobilized on day 1, analgesia weaned, discharged home..."
                  value={clinicalProgress}
                  onChange={(e) => setClinicalProgress(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs"
                />
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-teal-300 rounded-2xl p-6 text-center bg-teal-50/40">
                <Upload className="mx-auto text-teal-600 mb-2" size={28} />
                <h4 className="text-xs font-bold text-slate-800">
                  Upload Authorized Educational Clinical Media
                </h4>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  Upload operative photographs, wound inspection, or imaging slices. Strictly de-identified only.
                </p>
                <label className="inline-flex items-center gap-2 bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer transition shadow-xs">
                  <Upload size={14} /> Select Educational File
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              {attachments.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="relative rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs">
                      {att.url.startsWith('data:image') || att.url.startsWith('http') ? (
                        <img src={att.url} alt={att.title} className="w-full h-28 object-cover" />
                      ) : (
                        <div className="w-full h-28 flex items-center justify-center bg-slate-100 text-slate-400">
                          <FileText size={28} />
                        </div>
                      )}
                      <div className="p-2 text-[11px]">
                        <p className="font-semibold text-slate-800 truncate">{att.title}</p>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-teal-700 font-medium">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 size={10} /> Consent Verified
                          </span>
                          <button
                            type="button"
                            onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Save Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-400">
              * Required clinical logbook fields
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveAction(false)}
                className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                title="Saves to your private personal logbook portfolio"
              >
                <span>💾 حفظ فقط (في المحفظة) / Save to Portfolio Only</span>
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveAction(true)}
                className="bg-[#0D9488] hover:bg-teal-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-teal-900/10 cursor-pointer flex items-center gap-1.5"
                title="Saves to portfolio and shares in the peer community feed"
              >
                <span>🌐 حفظ ونشر في المجتمع / Save & Publish to Community</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Mandatory Patient Consent Confirmation Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <ShieldAlert size={26} />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Medical Privacy & De-identification Confirmation
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed text-left bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              "I confirm that this media is authorized for educational documentation, appropriate consent has been obtained, and no patient-identifying information is included."
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConsentModal(false);
                  setPendingUploadFile(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmUploadWithConsent}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
              >
                Confirm & Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
