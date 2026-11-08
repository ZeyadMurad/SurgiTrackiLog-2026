import React, { useState } from 'react';
import { Plus, Award, CheckCircle2, FileSpreadsheet, Download, Filter, Search, ChevronRight, Edit3, Trash2, X, Sparkles, BookOpen } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { translations } from '../lib/i18n';
import { UserSkill, SkillExposureLevel, CompetencyStatus } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  SURGICAL_SPECIALTIES,
  DEFAULT_SURGICAL_SKILLS,
  SKILL_CATEGORIES,
  COMMON_SUPERVISOR_FEEDBACK,
  SAMPLE_SKILL_PRESET_ITEMS,
} from '../lib/medicalDefaults';
import { StandardSelectWithOther } from './StandardSelectWithOther';

export const SkillsMatrixView: React.FC = () => {
  const { skills, addSkill, updateSkill, deleteSkill, supervisors } = useData();
  const { language } = useAuth();
  const t = translations[language] || translations.en;
  const isRTL = language === 'ar';

  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<UserSkill | null>(null);
  const [skillToDelete, setSkillToDelete] = useState<UserSkill | null>(null);
  const [showPresetConfirm, setShowPresetConfirm] = useState(false);

  // Form states
  const [skillName, setSkillName] = useState('');
  const [skillNameGerman, setSkillNameGerman] = useState('');
  const [specialty, setSpecialty] = useState('Vascular Surgery');
  const [category, setCategory] = useState('Vascular Reconstruction');
  const [exposureLevel, setExposureLevel] = useState<string>('Assisted');
  const [competencyStatus, setCompetencyStatus] = useState<CompetencyStatus>('Learning');
  const [totalSessions, setTotalSessions] = useState(1);
  const [totalHours, setTotalHours] = useState(2);
  const [feedback, setFeedback] = useState('');

  // Bulk Load Preset Skills
  const executeLoadPresetSkills = async () => {
    setShowPresetConfirm(false);
    for (const item of SAMPLE_SKILL_PRESET_ITEMS) {
      await addSkill({
        ...item,
        lastPracticedDate: new Date().toISOString().substring(0, 10),
        supervisors: supervisors.slice(0, 2).map(s => s.fullName),
        hospitals: ['University Medical Center'],
      });
    }
  };

  const handleLoadSampleSkillsPreset = () => {
    setShowPresetConfirm(true);
  };

  const handleOpenAdd = (skill?: UserSkill) => {
    if (skill) {
      setEditingSkill(skill);
      setSkillName(skill.name);
      setSkillNameGerman(skill.nameGerman || '');
      setSpecialty(skill.specialty);
      setCategory(skill.category);
      setExposureLevel(skill.exposureLevel);
      setCompetencyStatus(skill.competencyStatus);
      setTotalSessions(skill.totalRecordedSessions);
      setTotalHours(skill.totalDocumentedHours);
      setFeedback(skill.feedbackNotes || '');
    } else {
      setEditingSkill(null);
      setSkillName('');
      setSkillNameGerman('');
      setSpecialty('Vascular Surgery');
      setCategory('Vascular Reconstruction');
      setExposureLevel('Assisted');
      setCompetencyStatus('Learning');
      setTotalSessions(1);
      setTotalHours(2);
      setFeedback('');
    }
    setShowAddModal(true);
  };

  // Populate Single Model Skill
  const handleLoadSampleSingleSkill = () => {
    const sample = SAMPLE_SKILL_PRESET_ITEMS[0];
    setSkillName(sample.name);
    setSkillNameGerman(sample.nameGerman);
    setSpecialty(sample.specialty);
    setCategory(sample.category);
    setExposureLevel(sample.exposureLevel);
    setCompetencyStatus(sample.competencyStatus);
    setTotalSessions(sample.totalRecordedSessions);
    setTotalHours(sample.totalDocumentedHours);
    setFeedback(sample.feedbackNotes);
  };

  // Auto-fill German name & category when selecting predefined skill
  const handleSkillNameChange = (val: string) => {
    setSkillName(val);
    const matched = DEFAULT_SURGICAL_SKILLS.find(s => s.name.toLowerCase() === val.toLowerCase());
    if (matched) {
      setSkillNameGerman(matched.nameGerman);
      setSpecialty(matched.specialty);
      setCategory(matched.category);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) return;

    const payload: Omit<UserSkill, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      name: skillName,
      nameGerman: skillNameGerman,
      specialty,
      category,
      exposureLevel: exposureLevel as SkillExposureLevel,
      competencyStatus,
      totalRecordedSessions: Number(totalSessions),
      totalDocumentedHours: Number(totalHours),
      lastPracticedDate: new Date().toISOString().substring(0, 10),
      supervisors: supervisors.slice(0, 2).map(s => s.fullName),
      hospitals: ['University Medical Center'],
      feedbackNotes: feedback,
    };

    if (editingSkill) {
      await updateSkill(editingSkill.id, payload);
    } else {
      await addSkill(payload);
    }
    setShowAddModal(false);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = skills.map(s => ({
      'Skill Name': s.name,
      'German Designation': s.nameGerman || '',
      'Specialty': s.specialty,
      'Category': s.category,
      'Exposure Level': s.exposureLevel,
      'Competency Status': s.competencyStatus,
      'Recorded Sessions': s.totalRecordedSessions,
      'Documented Hours': s.totalDocumentedHours,
      'Last Practiced': s.lastPracticedDate || '',
      'Supervisors': Array.isArray(s.supervisors) ? s.supervisors.join(', ') : '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Skills Matrix');
    XLSX.writeFile(wb, 'SurgiTrack_Skills_Competency_Matrix.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SURGITRACK - CUMULATIVE SURGICAL SKILLS & COMPETENCY MATRIX', 14, 15);

    const tableData = skills.map(s => [
      s.name,
      s.nameGerman || '',
      s.specialty,
      s.category,
      s.exposureLevel,
      s.competencyStatus,
      `${s.totalRecordedSessions} (${s.totalDocumentedHours}h)`,
    ]);

    autoTable(doc, {
      startY: 22,
      head: [['Skill (EN)', 'Skill (German)', 'Specialty', 'Category', 'Exposure Level', 'Competency Status', 'Sessions/Hrs']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] },
      styles: { fontSize: 8 },
    });

    doc.save('SurgiTrack_Skills_Matrix.pdf');
  };

  const filtered = skills.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        (s.nameGerman && s.nameGerman.toLowerCase().includes(search.toLowerCase()));
    const matchSpec = selectedSpecialty === 'All' || s.specialty === selectedSpecialty;
    return matchSearch && matchSpec;
  });

  const confirmedCount = skills.filter(s => s.competencyStatus === 'Competency Confirmed').length;
  const assessedCount = skills.filter(s => s.competencyStatus === 'Supervisor Assessed').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-[#101C32] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2.5 py-1 rounded-md border border-teal-500/30">
            Section 9: Objective Competency Verification
          </span>
          <h2 className="text-xl font-bold tracking-tight mt-2">
            {t.skills}
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            {isRTL
              ? 'مصفوفة التطور التراكمي للمهارات والكفاءات الجراحية المقيمة والمعتمدة من قبل المشرفين.'
              : language === 'de'
              ? 'Kumulativer Kompetenzerwerb technischer chirurgischer Fertigkeiten mit standardisierter Facharzt-Evaluation.'
              : 'Cumulative progression of technical surgical skills and objective supervisor-evaluated competencies.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadSampleSkillsPreset}
            className="flex items-center gap-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition border border-emerald-500/40 shadow-xs cursor-pointer"
            title="Load 5 exemplary surgical skills"
          >
            <Sparkles size={14} className="text-yellow-300" /> تحميل كفاءات نموذجية جاهزة
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 bg-teal-800/80 hover:bg-teal-700 text-teal-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition border border-teal-600/40 cursor-pointer"
          >
            <FileSpreadsheet size={14} /> {t.exportExcel}
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition border border-slate-600 cursor-pointer"
          >
            <Download size={14} /> {t.exportPdf}
          </button>
          <button
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-1.5 bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
          >
            <Plus size={15} /> {t.addSkill}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Documented Skills</span>
          <span className="text-lg font-bold text-slate-900 mt-1 block">{skills.length} Registered</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Competencies Confirmed</span>
          <span className="text-lg font-bold text-emerald-700 mt-1 block">{confirmedCount} Confirmed</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Supervisor Assessed</span>
          <span className="text-lg font-bold text-teal-700 mt-1 block">{assessedCount} Assessed</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Active Training</span>
          <span className="text-lg font-bold text-slate-700 mt-1 block">
            {skills.filter(s => s.competencyStatus === 'Learning' || s.competencyStatus === 'Practicing').length} Skills
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search skills in English or German..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={15} className="text-slate-400" />
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            <option value="All">All Specialties</option>
            {SURGICAL_SPECIALTIES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => {
          const isConfirmed = s.competencyStatus === 'Competency Confirmed';
          const isAssessed = s.competencyStatus === 'Supervisor Assessed';
          return (
            <div
              key={s.id}
              className={`bg-white rounded-2xl border p-5 transition hover:shadow-md flex flex-col justify-between ${
                isConfirmed
                  ? 'border-emerald-300 ring-1 ring-emerald-200'
                  : isAssessed
                  ? 'border-teal-300 ring-1 ring-teal-200'
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                    {s.category || 'General'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenAdd(s)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => setSkillToDelete(s)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                      title={isRTL ? 'حذف المهارة' : 'Delete Skill'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-2">{s.name}</h3>
                {s.nameGerman && (
                  <p className="text-[11px] text-teal-800 italic mt-0.5 font-medium">
                    {s.nameGerman}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                    {s.specialty}
                  </span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium border border-blue-200">
                    {s.exposureLevel}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md font-semibold ${
                    isConfirmed
                      ? 'bg-emerald-100 text-emerald-800'
                      : isAssessed
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {s.competencyStatus}
                  </span>
                </div>

                {s.feedbackNotes && (
                  <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-2.5 mt-3 border border-slate-100">
                    "{s.feedbackNotes}"
                  </p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono text-slate-700 font-semibold">
                  {s.totalRecordedSessions} Sessions • {s.totalDocumentedHours} Hours
                </span>
                <span className="text-[11px] text-slate-400">
                  Last: {s.lastPracticedDate || 'Recent'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Skill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="bg-[#101C32] text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight">
                {editingSkill ? 'Edit Surgical Skill' : 'Add Surgical Skill to Matrix'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Quick Model Skill Preset Banner */}
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100 px-6 py-2 flex items-center justify-between gap-2 text-xs">
              <span className="text-teal-900 font-semibold flex items-center gap-1.5">
                <Sparkles size={14} className="text-teal-600" /> مثال كفاءة نموذجية:
              </span>
              <button
                type="button"
                onClick={handleLoadSampleSingleSkill}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white hover:bg-teal-600 hover:text-white text-teal-800 text-[11px] font-bold rounded-lg border border-teal-300 transition cursor-pointer"
              >
                <BookOpen size={11} /> تحميل مهارة نموذجية جاهزة (Anastomosis)
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 bg-[#FBFDFE]">
              <StandardSelectWithOther
                label="Skill Name (English)"
                value={skillName}
                onChange={handleSkillNameChange}
                options={DEFAULT_SURGICAL_SKILLS.map(s => s.name)}
                placeholder="-- Select Standard Skill or Enter Custom --"
                required
              />

              <StandardSelectWithOther
                label="German Designation (WBO Weiterbildungsordnung)"
                value={skillNameGerman}
                onChange={setSkillNameGerman}
                options={DEFAULT_SURGICAL_SKILLS.map(s => s.nameGerman)}
                placeholder="-- Select German Designation or Enter Custom --"
              />

              <div className="grid grid-cols-2 gap-3">
                <StandardSelectWithOther
                  label="Specialty"
                  value={specialty}
                  onChange={setSpecialty}
                  options={SURGICAL_SPECIALTIES}
                  placeholder="-- Select Specialty --"
                  required
                />

                <StandardSelectWithOther
                  label="Category"
                  value={category}
                  onChange={setCategory}
                  options={SKILL_CATEGORIES}
                  placeholder="-- Select Category or Custom --"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StandardSelectWithOther
                  label="Exposure Level"
                  value={exposureLevel}
                  onChange={setExposureLevel}
                  options={[
                    'Observed',
                    'Assisted',
                    'Performed Specific Steps Under Direct Supervision',
                    'Performed Under Direct Supervision',
                    'Performed Under Supervision',
                    'Assessed by Supervisor',
                    'Performed Independently',
                  ]}
                  placeholder="-- Select Exposure Level --"
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Competency Status (Section 9 Rule)
                  </label>
                  <select
                    value={competencyStatus}
                    onChange={(e) => setCompetencyStatus(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Not Yet Assessed">Not Yet Assessed</option>
                    <option value="Learning">Learning</option>
                    <option value="Practicing">Practicing</option>
                    <option value="Supervisor Assessed">Supervisor Assessed</option>
                    <option value="Competency Confirmed">Competency Confirmed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Recorded Sessions
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={totalSessions}
                    onChange={(e) => setTotalSessions(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Documented Hours
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={totalHours}
                    onChange={(e) => setTotalHours(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <StandardSelectWithOther
                label="Evaluative Notes & Supervisor Feedback"
                value={feedback}
                onChange={setFeedback}
                options={COMMON_SUPERVISOR_FEEDBACK}
                isTextArea
                rows={2}
                placeholder="-- Select Typical Evaluation Feedback or Enter Custom --"
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0D9488] hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {skillToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-800 space-y-4 shadow-2xl border border-red-200 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              {isRTL ? 'تأكيد حذف المهارة الجراحية' : 'Confirm Skill Deletion'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isRTL
                ? `هل أنت متأكد من رغبتك في حذف المهارة "${skillToDelete.name}" نهائياً من سجل المهارات وقاعدة البيانات؟`
                : `Are you sure you want to permanently delete the skill "${skillToDelete.name}" from your portfolio?`}
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setSkillToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteSkill(skillToDelete.id);
                  setSkillToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition cursor-pointer shadow-xs"
              >
                {isRTL ? 'نعم، حذف نهائي' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
