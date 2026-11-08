import React, { useState } from 'react';
import {
  Plus,
  Download,
  FileSpreadsheet,
  FileText,
  UserCheck,
  Calendar,
  Clock,
  Award,
  Building,
  Trash2,
  Edit3,
  ArrowRight,
  FolderPlus,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Eye,
  Check,
  X,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Supervisor, TrainingRecord, ClinicalCase, UserSkill } from '../types';
import { translations } from '../lib/i18n';
import { exportSupervisorExcel, exportSupervisorWord, exportSupervisorPDF } from '../lib/exports';
import { AddTrainingRecordModal } from './AddTrainingRecordModal';
import { AddSupervisorModal } from './AddSupervisorModal';
import { AddCaseModal } from './AddCaseModal';
import { AddSurgicalSkillModal } from './AddSurgicalSkillModal';

type SupervisorPortfolioTab = 'records' | 'cases' | 'skills';

export const SupervisorView: React.FC = () => {
  const {
    supervisors,
    trainingRecords,
    trainingSessions,
    skills,
    cases,
    deleteSupervisor,
    deleteTrainingRecord,
    addTrainingRecord,
    updateTrainingRecord,
    addSupervisor,
    updateSupervisor,
    addCase,
    updateCase,
    deleteCase,
    addSkill,
    updateSkill,
    deleteSkill,
  } = useData();

  const { profile, language, user } = useAuth();
  const t = translations[language] || translations.en;
  const isRTL = language === 'ar';

  const [selectedSupId, setSelectedSupId] = useState<string>(supervisors[0]?.id || '');
  const [activeTab, setActiveTab] = useState<SupervisorPortfolioTab>('records');

  // Modals state
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | null>(null);

  const [showAddCaseModal, setShowAddCaseModal] = useState(false);
  const [editingCase, setEditingCase] = useState<ClinicalCase | null>(null);

  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<UserSkill | null>(null);

  const [showAddSupModal, setShowAddSupModal] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null);

  const [viewingCaseDetail, setViewingCaseDetail] = useState<ClinicalCase | null>(null);

  interface DeleteTarget {
    type: 'supervisor' | 'record' | 'case' | 'skill';
    id: string;
    name: string;
    parentId?: string;
  }

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'supervisor') {
        const nextSup = supervisors.find(s => s.id !== deleteTarget.id);
        setSelectedSupId(nextSup ? nextSup.id : '');
        await deleteSupervisor(deleteTarget.id);
        setFeedbackMsg(
          isRTL
            ? `تم حذف المشرف "${deleteTarget.name}" وجميع سجلاته بنجاح`
            : `Supervisor "${deleteTarget.name}" deleted successfully`
        );
      } else if (deleteTarget.type === 'record') {
        await deleteTrainingRecord(deleteTarget.id, deleteTarget.parentId || activeSupervisor?.id || '');
        setFeedbackMsg(isRTL ? 'تم حذف سجل التدريب بنجاح' : 'Training record deleted successfully');
      } else if (deleteTarget.type === 'case') {
        await deleteCase(deleteTarget.id);
        setFeedbackMsg(isRTL ? 'تم حذف الحالة الإكلينيكية بنجاح' : 'Clinical case deleted successfully');
      } else if (deleteTarget.type === 'skill') {
        await deleteSkill(deleteTarget.id);
        setFeedbackMsg(isRTL ? 'تم حذف المهارة بنجاح' : 'Skill deleted successfully');
      }
    } catch (err: any) {
      console.error('Error during deletion:', err);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const activeSupervisor = supervisors.find(s => s.id === selectedSupId) || supervisors[0];

  // Records strictly belonging to this supervisor (Section 2 & 3 rule)
  // Backward compatibility: If records don't have supervisorId or matches first supervisor
  const supRecords = trainingRecords.filter(r => r.supervisorId === (activeSupervisor?.id || ''));
  const supSessions = trainingSessions.filter(s => s.supervisorId === (activeSupervisor?.id || ''));

  // Cases strictly belonging to this supervisor (or unassigned assigned to first supervisor for backward compatibility)
  const supCases = cases.filter(c => {
    if (c.supervisorId) return c.supervisorId === activeSupervisor?.id;
    return activeSupervisor && supervisors[0]?.id === activeSupervisor?.id;
  });

  // Skills strictly belonging to this supervisor
  const supSkills = skills.filter(s => {
    if (s.supervisorId) return s.supervisorId === activeSupervisor?.id;
    if (activeSupervisor && s.supervisors && s.supervisors.includes(activeSupervisor.fullName)) return true;
    return activeSupervisor && supervisors[0]?.id === activeSupervisor?.id;
  });

  // 3. UNIFIED METRICS & AUTOMATIC HOUR CALCULATION FOR THIS SUPERVISOR
  const sortedDates = supRecords.map(r => r.trainingDate).filter(Boolean).sort();
  const startDate = sortedDates[0] || 'N/A';
  const endDate = sortedDates[sortedDates.length - 1] || 'N/A';

  const totalProcedures = supRecords.filter(r => r.procedureName).length;
  const totalSupervisorCases = supCases.length;
  const totalSupervisorSkills = supSkills.length;

  const recordsHours = supRecords.reduce((sum, r) => sum + (Number(r.netTrainingHours) || 0), 0) +
                       supSessions.reduce((sum, s) => sum + (Number(s.netTrainingHours) || 0), 0);
  const skillsHours = supSkills.reduce((sum, s) => sum + (Number(s.totalDocumentedHours) || 0), 0);

  // Total Documented Training Hours = Supervised Operations/Records Hours + Surgical Skills Hours
  const totalDocumentedHours = recordsHours + skillsHours;

  // Verified Hours: Verified operations + Verified/Assessed skills
  const verifiedRecordsHours = supRecords.filter(r => r.verified).reduce((sum, r) => sum + (Number(r.netTrainingHours) || 0), 0) +
                               supSessions.filter(s => s.verified).reduce((sum, s) => sum + (Number(s.netTrainingHours) || 0), 0);
  const verifiedSkillsHours = supSkills
    .filter(s => s.competencyStatus === 'Competency Confirmed' || s.competencyStatus === 'Supervisor Assessed')
    .reduce((sum, s) => sum + (Number(s.totalDocumentedHours) || 0), 0);
  const verifiedHours = verifiedRecordsHours + verifiedSkillsHours;

  const confirmedSkillsCount = supSkills.filter(
    s => s.competencyStatus === 'Competency Confirmed' || s.competencyStatus === 'Supervisor Assessed' || s.competencyStatus === 'Mastered'
  ).length;
  const progressionPercent = totalSupervisorSkills > 0 ? Math.round((confirmedSkillsCount / totalSupervisorSkills) * 100) : 0;

  const handleExport = (format: 'xlsx' | 'docx' | 'pdf') => {
    if (!profile || !activeSupervisor) return;
    const payload = {
      trainee: profile,
      supervisor: activeSupervisor,
      records: supRecords,
      sessions: supSessions,
      skills: supSkills,
    };

    if (format === 'xlsx') exportSupervisorExcel(payload);
    else if (format === 'docx') exportSupervisorWord(payload);
    else exportSupervisorPDF(payload);
  };

  const caseRefs = Array.from(new Set(cases.map(c => c.caseReference).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#101C32] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2.5 py-1 rounded-md border border-teal-500/30">
            SurgiTrack iLog: Independent Supervisor Portfolios
          </span>
          <h2 className="text-xl font-bold tracking-tight mt-2">
            Supervisor Management & Supervised Logbook
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Every supervisor maintains a strictly separate portfolio. Clinical cases, surgical skills, and operative records are isolated per supervisor.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingSupervisor(null);
            setShowAddSupModal(true);
          }}
          className="flex items-center gap-2 bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer shrink-0"
        >
          <Plus size={16} /> Register New Supervisor
        </button>
      </div>

      {/* Supervisors Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {supervisors.map((sup, idx) => {
          const isSelected = activeSupervisor?.id === sup.id;
          const supCount = trainingRecords.filter(r => r.supervisorId === sup.id).length;
          return (
            <div
              key={sup.id ? `${sup.id}-${idx}` : `sup-${idx}`}
              className={`group flex items-center gap-1.5 pl-3.5 pr-2 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition ${
                isSelected
                  ? 'bg-white border-[#0D9488] text-teal-900 shadow-xs ring-1 ring-teal-500 font-bold'
                  : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <button
                onClick={() => setSelectedSupId(sup.id)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <UserCheck size={14} className={isSelected ? 'text-teal-600' : 'text-slate-400'} />
                <span>{sup.academicDegree || ''} {sup.fullName}</span>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 font-mono">
                  {supCount} ops
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget({
                    type: 'supervisor',
                    id: sup.id,
                    name: `${sup.academicDegree || ''} ${sup.fullName}`,
                  });
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                title={isRTL ? `حذف المشرف ${sup.fullName} نهائياً` : `Delete supervisor ${sup.fullName}`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Active Supervisor Profile Card & Dashboard */}
      {activeSupervisor ? (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-lg shrink-0">
                  {activeSupervisor.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-slate-900">
                      {activeSupervisor.academicTitle || ''} {activeSupervisor.fullName}
                    </h3>
                    {activeSupervisor.academicDegree && (
                      <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded">
                        {activeSupervisor.academicDegree}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-teal-800 font-semibold mt-0.5">
                    {activeSupervisor.professionalPosition} • {activeSupervisor.specialty}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <Building size={13} className="text-slate-400 shrink-0" />
                    <span>{activeSupervisor.department}, {activeSupervisor.hospital}, {activeSupervisor.country}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons: Exactly 3 Main Interactive Actions + Edit/Export/Delete */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* 1. Add Clinical Case */}
                <button
                  onClick={() => {
                    setEditingCase(null);
                    setShowAddCaseModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  title="Add Clinical Case under this supervisor"
                >
                  <Plus size={14} /> Add Clinical Case
                </button>

                {/* 2. Add Surgical Skills */}
                <button
                  onClick={() => {
                    setEditingSkill(null);
                    setShowAddSkillModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  title="Add Surgical Skill under this supervisor"
                >
                  <Plus size={14} /> Add Surgical Skills
                </button>

                {/* 3. Add Training Record */}
                <button
                  onClick={() => {
                    setEditingRecord(null);
                    setShowAddRecordModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-[#0D9488] hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  title="Add Training Record under this supervisor"
                >
                  <Plus size={14} /> Add Training Record
                </button>

                {/* Export Dropdown */}
                <div className="dropdown relative group">
                  <button className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer">
                    <Download size={14} /> Export
                  </button>
                  <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-20 w-48 text-xs font-medium">
                    <button
                      onClick={() => handleExport('pdf')}
                      className="flex items-center gap-2 p-2 hover:bg-red-50 text-slate-700 rounded-lg text-left"
                    >
                      <FileText size={14} className="text-red-600" />
                      PDF Portfolio (.pdf)
                    </button>
                    <button
                      onClick={() => handleExport('xlsx')}
                      className="flex items-center gap-2 p-2 hover:bg-teal-50 text-slate-700 rounded-lg text-left"
                    >
                      <FileSpreadsheet size={14} className="text-teal-600" />
                      Excel Workbook (.xlsx)
                    </button>
                    <button
                      onClick={() => handleExport('docx')}
                      className="flex items-center gap-2 p-2 hover:bg-blue-50 text-slate-700 rounded-lg text-left"
                    >
                      <FileText size={14} className="text-blue-600" />
                      Word Document (.docx)
                    </button>
                  </div>
                </div>

                {/* Edit Supervisor */}
                <button
                  onClick={() => {
                    setEditingSupervisor(activeSupervisor);
                    setShowAddSupModal(true);
                  }}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                  title="Edit Supervisor"
                >
                  <Edit3 size={15} />
                </button>

                {/* Delete Supervisor */}
                <button
                  onClick={() => {
                    setDeleteTarget({
                      type: 'supervisor',
                      id: activeSupervisor.id,
                      name: `${activeSupervisor.academicDegree || ''} ${activeSupervisor.fullName}`,
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-xs font-bold transition shadow-2xs cursor-pointer"
                  title={isRTL ? `حذف المشرف ${activeSupervisor.fullName} نهائياً` : 'Delete Supervisor Permanently'}
                >
                  <Trash2 size={15} />
                  <span>{isRTL ? 'حذف المشرف' : 'Delete'}</span>
                </button>
              </div>
            </div>

            {/* Comprehensive Metrics Row for Selected Supervisor (Requirement 3) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Clinical Cases</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {totalSupervisorCases} Cases
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Procedures</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {totalProcedures} Ops
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Surgical Skills</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {totalSupervisorSkills} Skills
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Skills Hours</span>
                <span className="font-bold text-emerald-700 text-sm mt-0.5 block">
                  {skillsHours.toFixed(1)}h
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Supervised Ops Hours</span>
                <span className="font-bold text-teal-700 text-sm mt-0.5 block">
                  {recordsHours.toFixed(1)}h
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Total Hours</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {totalDocumentedHours.toFixed(1)}h
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Verified Hours</span>
                <span className="font-bold text-emerald-700 text-sm mt-0.5 block">
                  {verifiedHours.toFixed(1)}h
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Competency Confirmed</span>
                <span className="font-bold text-teal-800 text-sm mt-0.5 block">
                  {confirmedSkillsCount}/{totalSupervisorSkills} ({progressionPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Three Dedicated Portfolio Sections with Navigation Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Sub-Tabs Bar */}
            <div className="flex items-center border-b border-slate-200 bg-slate-50/70 px-4 pt-2 gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('records')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer border-b-2 ${
                  activeTab === 'records'
                    ? 'border-[#0D9488] text-teal-900 bg-white shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock size={15} className={activeTab === 'records' ? 'text-teal-600' : 'text-slate-400'} />
                <span>Supervised Operations & Training Records</span>
                <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full font-mono">
                  {supRecords.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('cases')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer border-b-2 ${
                  activeTab === 'cases'
                    ? 'border-[#0D9488] text-teal-900 bg-white shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderPlus size={15} className={activeTab === 'cases' ? 'text-teal-600' : 'text-slate-400'} />
                <span>Clinical Cases</span>
                <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full font-mono">
                  {supCases.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('skills')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer border-b-2 ${
                  activeTab === 'skills'
                    ? 'border-[#0D9488] text-teal-900 bg-white shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award size={15} className={activeTab === 'skills' ? 'text-teal-600' : 'text-slate-400'} />
                <span>Surgical Skills & Competencies</span>
                <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full font-mono">
                  {supSkills.length}
                </span>
              </button>
            </div>

            {/* TAB 1: Supervised Training & Procedure Records */}
            {activeTab === 'records' && (
              <div>
                <div className="p-4 bg-slate-50/40 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Documented operative procedures and supervised training hours under <strong>{activeSupervisor.fullName}</strong>
                  </p>
                  <button
                    onClick={() => {
                      setEditingRecord(null);
                      setShowAddRecordModal(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
                  >
                    <Plus size={14} /> Add Record
                  </button>
                </div>

                {supRecords.length > 0 ? (
                  <div className="overflow-x-auto table-responsive-wrapper">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Procedure Name</th>
                          <th className="p-3">Case Ref</th>
                          <th className="p-3">Participation Role</th>
                          <th className="p-3">Net Hours</th>
                          <th className="p-3">Supervision</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {supRecords.map((r, idx) => (
                          <tr key={r.id ? `${r.id}-${idx}` : `rec-${idx}`} className="hover:bg-slate-50/70 transition">
                            <td className="p-3 font-mono font-medium text-slate-600">{r.trainingDate}</td>
                            <td className="p-3 font-semibold text-slate-900">{r.procedureName}</td>
                            <td className="p-3 font-mono text-[11px] text-teal-800">{r.clinicalCaseRef || '—'}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                                {r.participationRole}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-800">{r.netTrainingHours}h</td>
                            <td className="p-3 text-slate-600">{r.supervisionLevel}</td>
                            <td className="p-3">
                              {r.verified ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 size={11} /> Verified
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  Documented
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setEditingRecord(r);
                                    setShowAddRecordModal(true);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-teal-700 transition rounded-lg hover:bg-slate-100 cursor-pointer"
                                  title="Edit Record"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteTarget({
                                      type: 'record',
                                      id: r.id,
                                      parentId: activeSupervisor.id,
                                      name: r.procedureName || r.activityType || r.trainingDate,
                                    });
                                  }}
                                  className="p-1.5 text-red-400 hover:text-red-700 transition rounded-lg hover:bg-red-50 cursor-pointer"
                                  title="Delete Record"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-xs text-slate-400 space-y-3">
                    <p>No surgical training records logged under this supervisor yet.</p>
                    <button
                      onClick={() => {
                        setEditingRecord(null);
                        setShowAddRecordModal(true);
                      }}
                      className="bg-[#0D9488] hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus size={14} /> Add Training Record
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Clinical Cases */}
            {activeTab === 'cases' && (
              <div>
                <div className="p-4 bg-slate-50/40 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Clinical cases managed and treated under <strong>{activeSupervisor.fullName}</strong>
                  </p>
                  <button
                    onClick={() => {
                      setEditingCase(null);
                      setShowAddCaseModal(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
                  >
                    <Plus size={14} /> Add Clinical Case
                  </button>
                </div>

                {supCases.length > 0 ? (
                  <div className="overflow-x-auto table-responsive-wrapper">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Ref ID</th>
                          <th className="p-3">Presentation Date</th>
                          <th className="p-3">Primary Diagnosis</th>
                          <th className="p-3">Procedure</th>
                          <th className="p-3">Patient</th>
                          <th className="p-3">Hospital</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {supCases.map((c, idx) => (
                          <tr key={c.id ? `${c.id}-${idx}` : `case-${c.caseReference || idx}-${idx}`} className="hover:bg-slate-50/70 transition">
                            <td className="p-3 font-mono font-bold text-teal-800">{c.caseReference}</td>
                            <td className="p-3 font-mono text-slate-600">{c.presentationDate}</td>
                            <td className="p-3 font-semibold text-slate-900 max-w-[220px] truncate" title={c.primaryDiagnosis}>
                              {c.primaryDiagnosis}
                            </td>
                            <td className="p-3 text-slate-700 max-w-[200px] truncate">
                              {c.surgicalProcedure?.procedureName || 'Non-operative'}
                            </td>
                            <td className="p-3 text-slate-600">
                              {c.patientAge}y • {c.patientSex || 'Undisclosed'}
                            </td>
                            <td className="p-3 text-slate-500">{c.hospital}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setViewingCaseDetail(c)}
                                  className="p-1.5 text-slate-500 hover:text-teal-700 transition rounded-lg hover:bg-slate-100 cursor-pointer"
                                  title="View Case Summary"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingCase(c);
                                    setShowAddCaseModal(true);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-teal-700 transition rounded-lg hover:bg-slate-100 cursor-pointer"
                                  title="Edit Case"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteTarget({
                                      type: 'case',
                                      id: c.id,
                                      name: c.caseReference || c.primaryDiagnosis,
                                    });
                                  }}
                                  className="p-1.5 text-red-400 hover:text-red-700 transition rounded-lg hover:bg-red-50 cursor-pointer"
                                  title="Delete Case"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-xs text-slate-400 space-y-3">
                    <p>No clinical cases logged under this supervisor yet.</p>
                    <button
                      onClick={() => {
                        setEditingCase(null);
                        setShowAddCaseModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus size={14} /> Add Clinical Case
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Surgical Skills & Competencies */}
            {activeTab === 'skills' && (
              <div>
                <div className="p-4 bg-slate-50/40 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Technical surgical skills and objective competencies verified by <strong>{activeSupervisor.fullName}</strong>
                  </p>
                  <button
                    onClick={() => {
                      setEditingSkill(null);
                      setShowAddSkillModal(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
                  >
                    <Plus size={14} /> Add Surgical Skill
                  </button>
                </div>

                {supSkills.length > 0 ? (
                  <div className="overflow-x-auto table-responsive-wrapper">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Skill Name</th>
                          <th className="p-3">Specialty / Category</th>
                          <th className="p-3">Exposure Level</th>
                          <th className="p-3">Competency Status</th>
                          <th className="p-3">Sessions</th>
                          <th className="p-3">Documented Hours</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {supSkills.map((s, idx) => (
                          <tr key={s.id ? `${s.id}-${idx}` : `skill-${s.name || idx}-${idx}`} className="hover:bg-slate-50/70 transition">
                            <td className="p-3 font-bold text-slate-900">{s.name}</td>
                            <td className="p-3 text-slate-600">
                              <span className="font-semibold block">{s.specialty}</span>
                              <span className="text-[10px] text-slate-400">{s.category}</span>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {s.exposureLevel}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                s.competencyStatus === 'Competency Confirmed' || s.competencyStatus === 'Mastered'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : s.competencyStatus === 'Supervisor Assessed' || s.competencyStatus === 'Competent'
                                  ? 'bg-teal-50 text-teal-800 border-teal-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}>
                                {s.competencyStatus}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-800">{s.totalRecordedSessions}</td>
                            <td className="p-3 font-mono font-bold text-teal-700">{s.totalDocumentedHours}h</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setEditingSkill(s);
                                    setShowAddSkillModal(true);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-teal-700 transition rounded-lg hover:bg-slate-100 cursor-pointer"
                                  title="Edit Skill"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteTarget({
                                      type: 'skill',
                                      id: s.id,
                                      name: s.name,
                                    });
                                  }}
                                  className="p-1.5 text-red-400 hover:text-red-700 transition rounded-lg hover:bg-red-50 cursor-pointer"
                                  title="Delete Skill"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-xs text-slate-400 space-y-3">
                    <p>No surgical skills registered under this supervisor yet.</p>
                    <button
                      onClick={() => {
                        setEditingSkill(null);
                        setShowAddSkillModal(true);
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus size={14} /> Add Surgical Skill
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <p className="text-xs text-slate-500 mb-4">No supervisors registered yet.</p>
          <button
            onClick={() => setShowAddSupModal(true)}
            className="bg-[#0D9488] text-white text-xs font-bold px-4 py-2 rounded-xl"
          >
            Register First Supervisor
          </button>
        </div>
      )}

      {/* 1. Modal: Add / Edit Training Record under Active Supervisor */}
      {showAddRecordModal && activeSupervisor && profile && (
        <AddTrainingRecordModal
          isOpen={showAddRecordModal}
          onClose={() => {
            setShowAddRecordModal(false);
            setEditingRecord(null);
          }}
          supervisor={activeSupervisor}
          trainee={profile}
          existingRecord={editingRecord}
          availableCaseRefs={caseRefs}
          onSave={async (record) => {
            if (editingRecord) {
              await updateTrainingRecord(editingRecord.id, activeSupervisor.id, record);
              return editingRecord.id;
            } else {
              return await addTrainingRecord(record);
            }
          }}
        />
      )}

      {/* 2. Modal: Add / Edit Clinical Case under Active Supervisor */}
      {showAddCaseModal && activeSupervisor && (
        <AddCaseModal
          isOpen={showAddCaseModal}
          onClose={() => {
            setShowAddCaseModal(false);
            setEditingCase(null);
          }}
          existingCase={editingCase}
          supervisorId={activeSupervisor.id}
          supervisorName={activeSupervisor.fullName}
          onSave={async (caseData, publishToCommunity) => {
            if (editingCase) {
              await updateCase(editingCase.id, caseData);
              return editingCase.id;
            } else {
              return await addCase(caseData, publishToCommunity ?? false);
            }
          }}
        />
      )}

      {/* 3. Modal: Add / Edit Surgical Skill under Active Supervisor */}
      {showAddSkillModal && activeSupervisor && (
        <AddSurgicalSkillModal
          isOpen={showAddSkillModal}
          onClose={() => {
            setShowAddSkillModal(false);
            setEditingSkill(null);
          }}
          supervisor={activeSupervisor}
          existingSkill={editingSkill}
          onSave={async (skillData) => {
            if (editingSkill) {
              await updateSkill(editingSkill.id, skillData);
              return editingSkill.id;
            } else {
              return await addSkill(skillData);
            }
          }}
        />
      )}

      {/* 4. Modal: Register / Edit Supervisor */}
      {showAddSupModal && (
        <AddSupervisorModal
          isOpen={showAddSupModal}
          onClose={() => {
            setShowAddSupModal(false);
            setEditingSupervisor(null);
          }}
          existingSupervisor={editingSupervisor}
          onSave={async (sup) => {
            if (editingSupervisor) {
              await updateSupervisor(editingSupervisor.id, sup);
              return editingSupervisor.id;
            } else {
              return await addSupervisor(sup);
            }
          }}
        />
      )}

      {/* Case Details Quick View Modal */}
      {viewingCaseDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                {viewingCaseDetail.caseReference}
              </span>
              <button
                onClick={() => setViewingCaseDetail(null)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">{viewingCaseDetail.primaryDiagnosis}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{viewingCaseDetail.hospital} • {viewingCaseDetail.presentationDate}</p>
            </div>
            <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <p><strong>Chief Complaint:</strong> {viewingCaseDetail.chiefComplaint}</p>
              <p><strong>History:</strong> {viewingCaseDetail.historyOfPresentIllness}</p>
              {viewingCaseDetail.surgicalProcedure && (
                <p><strong>Procedure:</strong> {viewingCaseDetail.surgicalProcedure.procedureName} ({viewingCaseDetail.surgicalProcedure.participationRole})</p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setViewingCaseDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Universal In-App Confirmation Modal (Zero window.confirm) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">
                {deleteTarget.type === 'supervisor'
                  ? (isRTL ? 'تأكيد حذف المشرف الجراحي' : 'Delete Supervisor')
                  : deleteTarget.type === 'record'
                  ? (isRTL ? 'تأكيد حذف سجل التدريب' : 'Delete Training Record')
                  : deleteTarget.type === 'case'
                  ? (isRTL ? 'تأكيد حذف الحالة الإكلينيكية' : 'Delete Clinical Case')
                  : (isRTL ? 'تأكيد حذف المهارة الجراحية' : 'Delete Surgical Skill')}
              </h3>
              <p className="text-xs text-slate-600">
                {deleteTarget.type === 'supervisor'
                  ? (isRTL
                      ? `هل أنت متأكد من حذف المشرف "${deleteTarget.name}" نهائياً من الواجهة وقاعدة التخزين الدائمة؟`
                      : `Are you sure you want to permanently delete supervisor "${deleteTarget.name}" and their associated logbook entries?`)
                  : (isRTL
                      ? `هل أنت متأكد من حذف "${deleteTarget.name}"؟`
                      : `Are you sure you want to delete "${deleteTarget.name}"?`)}
              </p>
              {deleteTarget.type === 'supervisor' && (
                <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-2 text-start">
                  {isRTL
                    ? '⚠️ تنبيه: سيتم حذف المشرف وجميع السجلات والعمليات المرتبطة به نهائياً من قاعدة التخزين الدائمة.'
                    : '⚠️ Warning: The supervisor and all associated logbook entries will be permanently deleted from permanent storage.'}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <span>{isRTL ? 'جارٍ الحذف...' : 'Deleting...'}</span>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>{isRTL ? 'تأكيد الحذف النهائي' : 'Confirm Delete'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating feedback notification toast */}
      {feedbackMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#101C32] text-teal-300 border border-teal-500/40 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={16} className="text-teal-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}
    </div>
  );
};
