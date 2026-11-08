import React, { useState, useEffect } from 'react';
import { X, Award, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';
import { UserSkill, Supervisor, SkillExposureLevel, CompetencyStatus } from '../types';
import {
  SURGICAL_SPECIALTIES,
  DEFAULT_SURGICAL_SKILLS,
  getSkillsForSpecialty,
  SKILL_CATEGORIES,
  COMMON_SUPERVISOR_FEEDBACK,
} from '../lib/medicalDefaults';
import { StandardSelectWithOther } from './StandardSelectWithOther';

interface AddSurgicalSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  supervisor: Supervisor;
  existingSkill?: UserSkill | null;
  onSave: (skill: Omit<UserSkill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
}

export const AddSurgicalSkillModal: React.FC<AddSurgicalSkillModalProps> = ({
  isOpen,
  onClose,
  supervisor,
  existingSkill,
  onSave,
}) => {
  const [specialty, setSpecialty] = useState(existingSkill?.specialty || supervisor.specialty || 'General Surgery');
  const [skillName, setSkillName] = useState(existingSkill?.name || '');
  const [category, setCategory] = useState(existingSkill?.category || 'Operative Procedures');
  const [exposureLevel, setExposureLevel] = useState<SkillExposureLevel>(
    existingSkill?.exposureLevel || 'Assisted'
  );
  const [competencyStatus, setCompetencyStatus] = useState<CompetencyStatus>(
    existingSkill?.competencyStatus || 'Learning'
  );
  const [recordedSessions, setRecordedSessions] = useState<number>(existingSkill?.totalRecordedSessions || 1);
  const [documentedHours, setDocumentedHours] = useState<number>(existingSkill?.totalDocumentedHours || 2);
  const [feedback, setFeedback] = useState(existingSkill?.feedbackNotes || '');
  const [saving, setSaving] = useState(false);

  // Available skills filtered automatically by the selected specialty
  const specialtySkills = getSkillsForSpecialty(specialty);
  const skillNameOptions = specialtySkills.map(s => s.name);

  // When specialty changes, if current skillName is not in that specialty, offer the first suggestion
  useEffect(() => {
    if (!existingSkill) {
      const skillsInSpec = getSkillsForSpecialty(specialty);
      if (skillsInSpec.length > 0 && (!skillName || !skillsInSpec.some(s => s.name === skillName))) {
        setSkillName(skillsInSpec[0].name);
        setCategory(skillsInSpec[0].category);
      }
    }
  }, [specialty]);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectSkill = (val: string) => {
    setSkillName(val);
    const match = specialtySkills.find(s => s.name.toLowerCase() === val.toLowerCase());
    if (match) {
      setCategory(match.category);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!skillName.trim()) {
      setErrorMessage('Please select or specify a skill name.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        supervisorId: supervisor.id,
        supervisorName: supervisor.fullName,
        name: skillName.trim(),
        specialty,
        category,
        exposureLevel,
        competencyStatus,
        totalRecordedSessions: Number(recordedSessions) || 1,
        totalDocumentedHours: Number(documentedHours) || 1,
        lastPracticedDate: new Date().toISOString().substring(0, 10),
        supervisors: [supervisor.fullName],
        hospitals: [supervisor.hospital],
        feedbackNotes: feedback,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(`Error saving surgical skill: ${err.message || 'Please check your inputs'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-auto animate-fadeIn flex flex-col">
        {/* Header */}
        <div className="bg-[#101C32] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 font-bold">
              <Award size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {existingSkill ? 'Edit Surgical Skill' : 'Add Surgical Skill to Portfolio'}
              </h2>
              <p className="text-xs text-teal-300 font-medium">
                Supervisor: {supervisor.academicDegree || ''} {supervisor.fullName} • {supervisor.hospital}
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
          <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 flex items-center justify-between text-xs text-red-700 font-medium">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 p-1">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs bg-[#FBFDFE]">
          {/* 1. Specialty Selection (Auto-populates Skills) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Surgical Specialty *
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {SURGICAL_SPECIALTIES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Skill Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Vascular Reconstruction, Minimally Invasive"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 2. Skill Name Dropdown with Specialty Suggestions & Custom Entry */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Skill Name (Standard or Custom) *
            </label>
            <StandardSelectWithOther
              label=""
              value={skillName}
              options={skillNameOptions}
              onChange={handleSelectSkill}
              placeholder="-- Select Standard Skill or Enter Custom --"
              required
            />
          </div>

          {/* 3. Exposure Level & Competency Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Exposure Level *
              </label>
              <select
                value={exposureLevel}
                onChange={(e) => setExposureLevel(e.target.value as SkillExposureLevel)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="Observed">Observed</option>
                <option value="Assisted">Assisted</option>
                <option value="Performed Specific Steps Under Direct Supervision">Performed Specific Steps Under Direct Supervision</option>
                <option value="Performed Under Direct Supervision">Performed Under Direct Supervision</option>
                <option value="Performed Under Supervision">Performed Under Supervision</option>
                <option value="Performed Independently">Performed Independently</option>
                <option value="Assessed by Supervisor">Assessed by Supervisor</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Competency Status *
              </label>
              <select
                value={competencyStatus}
                onChange={(e) => setCompetencyStatus(e.target.value as CompetencyStatus)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="Learning">Learning</option>
                <option value="Practicing">Practicing</option>
                <option value="Supervisor Assessed">Supervisor Assessed</option>
                <option value="Competent">Competent</option>
                <option value="Competency Confirmed">Competency Confirmed</option>
                <option value="Mastered">Mastered</option>
                <option value="Not Yet Assessed">Not Yet Assessed</option>
              </select>
            </div>
          </div>

          {/* 4. Recorded Sessions & Documented Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Recorded Sessions *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={recordedSessions}
                onChange={(e) => setRecordedSessions(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Documented Hours *
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={documentedHours}
                onChange={(e) => setDocumentedHours(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* 5. Evaluative Notes & Supervisor Feedback */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Evaluative Notes & Supervisor Feedback
            </label>
            <StandardSelectWithOther
              label=""
              value={feedback}
              options={COMMON_SUPERVISOR_FEEDBACK}
              onChange={(val) => setFeedback(val)}
              placeholder="-- Select Typical Evaluation Feedback or Enter Custom --"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !skillName.trim()}
              className="px-5 py-2 rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              <span>{saving ? 'Saving...' : existingSkill ? 'Update Skill' : 'Save Skill'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
