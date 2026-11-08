import React, { useState, useEffect } from 'react';
import { X, Clock, Award, CheckSquare, Sparkles, BookOpen } from 'lucide-react';
import { Supervisor, TrainingRecord, UserProfile, SurgicalParticipationLevel } from '../types';
import {
  DEFAULT_SURGICAL_SKILLS,
  TRAINEE_POSITIONS,
  SURGICAL_SPECIALTIES,
  COMMON_ACTIVITY_TYPES,
  COMMON_PROCEDURE_NAMES,
  COMMON_PARTICIPATION_ROLES,
  COMMON_SUPERVISION_LEVELS,
  COMMON_PARTICIPATION_DESCRIPTIONS,
  COMMON_RESPONSIBILITIES,
  COMMON_TECHNIQUES_OBSERVED,
  COMMON_TECHNIQUES_PRACTICED,
  COMMON_LEARNING_POINTS,
  COMMON_SUPERVISOR_FEEDBACK,
  SAMPLE_TRAINING_RECORD_DATA,
} from '../lib/medicalDefaults';
import { StandardSelectWithOther } from './StandardSelectWithOther';

interface AddTrainingRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  supervisor: Supervisor;
  trainee: UserProfile;
  onSave: (record: Omit<TrainingRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  existingRecord?: TrainingRecord | null;
  availableCaseRefs?: string[];
}

export const AddTrainingRecordModal: React.FC<AddTrainingRecordModalProps> = ({
  isOpen,
  onClose,
  supervisor,
  trainee,
  onSave,
  existingRecord,
  availableCaseRefs = [],
}) => {
  const [trainingDate, setTrainingDate] = useState(
    existingRecord?.trainingDate || new Date().toISOString().substring(0, 10)
  );
  const [procedureDate, setProcedureDate] = useState(
    existingRecord?.procedureDate || new Date().toISOString().substring(0, 10)
  );
  const [hospital, setHospital] = useState(existingRecord?.hospital || supervisor.hospital);
  const [department, setDepartment] = useState(existingRecord?.department || supervisor.department);
  const [specialty, setSpecialty] = useState(existingRecord?.specialty || supervisor.specialty);
  const [activityType, setActivityType] = useState(existingRecord?.activityType || COMMON_ACTIVITY_TYPES[0]);
  const [procedureName, setProcedureName] = useState(existingRecord?.procedureName || '');
  const [clinicalCaseRef, setClinicalCaseRef] = useState(existingRecord?.clinicalCaseRef || '');

  // Trainee current position
  const [traineePosition, setTraineePosition] = useState(trainee.currentPosition || 'Surgical Trainee');

  // Precise Time Tracking
  const [startTime, setStartTime] = useState(existingRecord?.startTime || '08:00');
  const [endTime, setEndTime] = useState(existingRecord?.endTime || '12:30');
  const [breakDurationMinutes, setBreakDurationMinutes] = useState<number>(
    existingRecord?.breakDurationMinutes ?? 30
  );
  const [netTrainingHours, setNetTrainingHours] = useState<number>(existingRecord?.netTrainingHours || 4.0);

  // Auto calculate net hours whenever start, end, or break changes
  useEffect(() => {
    if (!startTime || !endTime) return;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const startTotalMins = startH * 60 + startM;
    const endTotalMins = endH * 60 + endM;

    let diffMins = endTotalMins - startTotalMins;
    if (diffMins < 0) {
      diffMins += 24 * 60;
    }

    const netMins = Math.max(0, diffMins - (Number(breakDurationMinutes) || 0));
    const netHrs = Number((netMins / 60).toFixed(2));
    setNetTrainingHours(netHrs);
  }, [startTime, endTime, breakDurationMinutes]);

  // Surgical Exposure
  const [participationRole, setParticipationRole] = useState<SurgicalParticipationLevel>(
    existingRecord?.participationRole || 'Assisted'
  );

  // Participation Details
  const [description, setDescription] = useState(existingRecord?.descriptionOfParticipation || '');
  const [responsibilities, setResponsibilities] = useState(existingRecord?.responsibilities || '');
  const [techniquesObserved, setTechniquesObserved] = useState(existingRecord?.surgicalTechniquesObserved || '');
  const [techniquesPracticed, setTechniquesPracticed] = useState(existingRecord?.surgicalTechniquesPracticed || '');
  const [supervisionLevel, setSupervisionLevel] = useState<string>(
    existingRecord?.supervisionLevel || COMMON_SUPERVISION_LEVELS[0]
  );
  const [learningPoints, setLearningPoints] = useState(existingRecord?.learningPoints || '');
  const [supervisorFeedback, setSupervisorFeedback] = useState(existingRecord?.supervisorFeedback || '');
  const [additionalNotes, setAdditionalNotes] = useState(existingRecord?.additionalNotes || '');
  const [verified, setVerified] = useState(existingRecord?.verified ?? true);

  // Skills checklist
  const [selectedSkills, setSelectedSkills] = useState<string[]>(existingRecord?.skillsAcquired || []);
  const [skillSearch, setSkillSearch] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Load Exemplary Training Session
  const handleLoadSampleRecord = () => {
    setTrainingDate(SAMPLE_TRAINING_RECORD_DATA.trainingDate);
    setProcedureDate(SAMPLE_TRAINING_RECORD_DATA.procedureDate);
    setHospital(SAMPLE_TRAINING_RECORD_DATA.hospital);
    setDepartment(SAMPLE_TRAINING_RECORD_DATA.department);
    setSpecialty(SAMPLE_TRAINING_RECORD_DATA.specialty);
    setActivityType(SAMPLE_TRAINING_RECORD_DATA.activityType);
    setProcedureName(SAMPLE_TRAINING_RECORD_DATA.procedureName);
    setStartTime(SAMPLE_TRAINING_RECORD_DATA.startTime);
    setEndTime(SAMPLE_TRAINING_RECORD_DATA.endTime);
    setBreakDurationMinutes(SAMPLE_TRAINING_RECORD_DATA.breakDurationMinutes);
    setNetTrainingHours(SAMPLE_TRAINING_RECORD_DATA.netTrainingHours);
    setParticipationRole(SAMPLE_TRAINING_RECORD_DATA.participationRole);
    setSupervisionLevel(SAMPLE_TRAINING_RECORD_DATA.supervisionLevel);
    setDescription(SAMPLE_TRAINING_RECORD_DATA.descriptionOfParticipation);
    setResponsibilities(SAMPLE_TRAINING_RECORD_DATA.responsibilities);
    setTechniquesObserved(SAMPLE_TRAINING_RECORD_DATA.surgicalTechniquesObserved);
    setTechniquesPracticed(SAMPLE_TRAINING_RECORD_DATA.surgicalTechniquesPracticed);
    setSelectedSkills(SAMPLE_TRAINING_RECORD_DATA.skillsAcquired);
    setLearningPoints(SAMPLE_TRAINING_RECORD_DATA.learningPoints);
    setSupervisorFeedback(SAMPLE_TRAINING_RECORD_DATA.supervisorFeedback);
    setAdditionalNotes(SAMPLE_TRAINING_RECORD_DATA.additionalNotes);
    setVerified(SAMPLE_TRAINING_RECORD_DATA.verified);
  };

  const toggleSkill = (skillName: string) => {
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skillName));
    } else {
      setSelectedSkills([...selectedSkills, skillName]);
    }
  };

  const getGermanRoleMapping = (role: string) => {
    switch (role) {
      case 'Observer': return 'Beobachtet';
      case 'Assisted': return 'Assistiert';
      case 'First Assistant': return 'Als Erstassistent tätig';
      case 'Second Assistant': return 'Als Zweitassistent tätig';
      case 'Scrubbed and Assisted': return 'Steril eingewaschen und assistiert';
      case 'Performed Specific Steps Under Direct Supervision': return 'Einzelne operative Schritte unter direkter Supervision durchgeführt';
      case 'Performed Procedure Under Direct Supervision': return 'Unter direkter Supervision durchgeführte operative Teilschritte';
      case 'Performed Under Supervision': return 'Unter Aufsicht durchgeführt';
      default: return 'Teilnahme an chirurgischen Eingriffen';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!procedureName.trim()) {
      setErrorMessage('Procedure Name is required.');
      return;
    }
    if (netTrainingHours <= 0) {
      setErrorMessage('Net training hours must be greater than zero. Please check start/end time and break duration.');
      return;
    }

    setSaving(true);
    try {
      const payload: Omit<TrainingRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        supervisorId: supervisor.id,
        trainingDate,
        procedureDate,
        hospital,
        department,
        specialty,
        activityType,
        procedureName,
        clinicalCaseRef,
        startTime,
        endTime,
        breakDurationMinutes: Number(breakDurationMinutes),
        netTrainingHours,
        surgicalExposure: participationRole,
        participationRole,
        participationGerman: getGermanRoleMapping(participationRole),
        descriptionOfParticipation: description,
        responsibilities,
        surgicalTechniquesObserved: techniquesObserved,
        surgicalTechniquesPracticed: techniquesPracticed,
        supervisionLevel: supervisionLevel as any,
        skillsAcquired: selectedSkills,
        learningPoints,
        supervisorFeedback,
        additionalNotes,
        verified,
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setErrorMessage(`Error saving training record: ${err.message || 'Please check your inputs'}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredSkills = DEFAULT_SURGICAL_SKILLS.filter(s =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
    s.specialty.toLowerCase().includes(skillSearch.toLowerCase()) ||
    s.nameGerman.toLowerCase().includes(skillSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#101C32] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 font-bold">
              OP
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {existingRecord ? 'Edit Supervised Training Record' : 'Add Supervised Training & Surgical Operation Record'}
              </h2>
              <p className="text-xs text-slate-300">
                Portfolio of {supervisor.academicDegree || ''} {supervisor.fullName}
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

        {errorMessage && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 flex items-center justify-between text-xs text-red-700 font-medium animate-fadeIn">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 p-1">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Exemplary Sample Record Button Banner */}
        <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-blue-50 border-b border-teal-100 px-6 py-2 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-teal-900 font-semibold">
            <Sparkles size={16} className="text-teal-600 animate-pulse" />
            <span>سجل تدريب وعملية نموذجية جاهزة / Exemplary Model Record:</span>
          </div>
          <button
            type="button"
            onClick={handleLoadSampleRecord}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-teal-600 hover:text-white text-teal-800 text-[11px] font-bold rounded-lg border border-teal-300 shadow-2xs transition cursor-pointer"
          >
            <BookOpen size={12} /> تحميل سجل عملية وتدريب نموذجي (Bypass 4.5h)
          </button>
        </div>

        {/* Readonly Summary Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider block">
              Supervisor (Weiterbildungsbefugter)
            </span>
            <span className="font-bold text-slate-900 text-sm">
              {supervisor.academicDegree || ''} {supervisor.fullName}
            </span>
            <p className="text-slate-500 mt-0.5">
              {supervisor.professionalPosition} • {supervisor.department}, {supervisor.hospital}
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider block">
              Trainee Details
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-900 text-sm">{trainee.fullName}</span>
              <select
                value={traineePosition}
                onChange={(e) => setTraineePosition(e.target.value)}
                className="text-[11px] bg-slate-50 border border-slate-300 rounded px-2 py-0.5"
              >
                {TRAINEE_POSITIONS.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
            <p className="text-slate-500 mt-0.5">
              {trainee.medicalQualification} • {trainee.specialty}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-700 bg-[#FBFDFE]">
          {/* Activity & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Training Date *
              </label>
              <input
                type="date"
                required
                value={trainingDate}
                onChange={(e) => setTrainingDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <StandardSelectWithOther
              label="Activity Type"
              value={activityType}
              onChange={setActivityType}
              options={COMMON_ACTIVITY_TYPES}
              placeholder="-- Select Activity Type --"
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Linked Clinical Case Ref (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. CAS-2026-0042"
                value={clinicalCaseRef}
                onChange={(e) => setClinicalCaseRef(e.target.value)}
                list="caseRefsList"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
              />
              <datalist id="caseRefsList">
                {Array.from(new Set(availableCaseRefs.filter(Boolean))).map((ref, idx) => (
                  <option key={`caseref-${ref}-${idx}`} value={ref} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StandardSelectWithOther
              label="Surgical Procedure Name"
              value={procedureName}
              onChange={setProcedureName}
              options={COMMON_PROCEDURE_NAMES}
              placeholder="-- Select Procedure or Enter Custom --"
              required
            />

            <StandardSelectWithOther
              label="Specialty"
              value={specialty}
              onChange={setSpecialty}
              options={SURGICAL_SPECIALTIES}
              placeholder="-- Select Specialty --"
              required
            />
          </div>

          {/* Time & Hours Precise Tracking */}
          <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-teal-700" />
              <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider">
                Precise Hours Calculation: Net Hours = (End - Start) - Break
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Break Duration (mins)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={breakDurationMinutes}
                  onChange={(e) => setBreakDurationMinutes(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-teal-900 mb-1">
                  Net Training Hours
                </label>
                <div className="w-full bg-teal-600 text-white font-bold rounded-lg px-3 py-1.5 text-xs font-mono flex items-center justify-between">
                  <span>{netTrainingHours}</span>
                  <span className="text-[10px] font-normal uppercase">Hours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Participation Level & Supervision */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Surgical Participation Role * (Prompt: Observation is never Assistance)
              </label>
              <select
                value={participationRole}
                onChange={(e) => setParticipationRole(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {COMMON_PARTICIPATION_ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <span className="text-[10px] text-teal-800 font-medium block mt-1">
                German Equivalent: {getGermanRoleMapping(participationRole)}
              </span>
            </div>

            <StandardSelectWithOther
              label="Supervision Level"
              value={supervisionLevel}
              onChange={setSupervisionLevel}
              options={COMMON_SUPERVISION_LEVELS}
              placeholder="-- Select Supervision Level --"
              required
            />
          </div>

          {/* Participation Details with standard dropdowns + other */}
          <div className="space-y-3">
            <StandardSelectWithOther
              label="Description of Participation"
              value={description}
              onChange={setDescription}
              options={COMMON_PARTICIPATION_DESCRIPTIONS}
              isTextArea
              rows={2}
              placeholder="-- Select Standard Description or Type Custom Involvement --"
            />

            <StandardSelectWithOther
              label="Key Responsibilities Handled"
              value={responsibilities}
              onChange={setResponsibilities}
              options={COMMON_RESPONSIBILITIES}
              isTextArea
              rows={2}
              placeholder="-- Select Typical Responsibilities or Type Custom --"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StandardSelectWithOther
                label="Surgical Techniques Observed"
                value={techniquesObserved}
                onChange={setTechniquesObserved}
                options={COMMON_TECHNIQUES_OBSERVED}
                placeholder="-- Select Techniques Observed or Type Custom --"
              />

              <StandardSelectWithOther
                label="Surgical Techniques Practiced"
                value={techniquesPracticed}
                onChange={setTechniquesPracticed}
                options={COMMON_TECHNIQUES_PRACTICED}
                placeholder="-- Select Techniques Practiced or Type Custom --"
              />
            </div>
          </div>

          {/* Searchable Skills Checklist */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={15} className="text-teal-600" />
                Select Practiced Surgical Skills ({selectedSkills.length} selected)
              </label>
              <input
                type="text"
                placeholder="Search skills (e.g. suturing, clamp, bypass)..."
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 w-full sm:w-64"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1 border border-slate-100 rounded-xl">
              {filteredSkills.map(sk => {
                const isChecked = selectedSkills.includes(sk.name);
                return (
                  <button
                    key={sk.name}
                    type="button"
                    onClick={() => toggleSkill(sk.name)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition border cursor-pointer ${
                      isChecked
                        ? 'bg-teal-50 border-teal-300 text-teal-900 font-medium'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                      isChecked ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isChecked && <CheckSquare size={12} />}
                    </div>
                    <span className="truncate">{sk.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback & Learning Points with Dropdowns + Other */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StandardSelectWithOther
              label="Supervisor Feedback"
              value={supervisorFeedback}
              onChange={setSupervisorFeedback}
              options={COMMON_SUPERVISOR_FEEDBACK}
              isTextArea
              rows={2}
              placeholder="-- Select Evaluative Feedback or Type Custom --"
            />

            <StandardSelectWithOther
              label="Personal Learning Points & Self-Assessment"
              value={learningPoints}
              onChange={setLearningPoints}
              options={COMMON_LEARNING_POINTS}
              isTextArea
              rows={2}
              placeholder="-- Select Key Learning Takeaway or Type Custom --"
            />
          </div>

          {/* Verified toggle */}
          <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-xl">
            <input
              type="checkbox"
              id="verifiedCheck"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            />
            <label htmlFor="verifiedCheck" className="text-xs font-semibold text-slate-800 cursor-pointer">
              Mark as Verified by Supervisor / Hospital Logbook Record
            </label>
          </div>

          {/* Save buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#0D9488] hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-teal-900/10 cursor-pointer"
            >
              {saving ? 'Saving...' : existingRecord ? 'Update Record' : 'Save Training Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
