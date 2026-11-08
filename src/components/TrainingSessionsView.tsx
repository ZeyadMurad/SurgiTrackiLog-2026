import React, { useState, useEffect } from 'react';
import { Plus, Clock, Calendar, Building, CheckCircle2, AlertCircle, X, Trash2, Edit3, Award } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { translations } from '../lib/i18n';
import { TrainingSession } from '../types';
import { DEFAULT_SURGICAL_SKILLS } from '../lib/medicalDefaults';

export const TrainingSessionsView: React.FC = () => {
  const { trainingSessions, supervisors, addTrainingSession, updateTrainingSession, deleteTrainingSession } = useData();
  const { language } = useAuth();
  const t = translations[language] || translations.en;
  const isRTL = language === 'ar';

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<TrainingSession | null>(null);

  // Form states
  const [selectedSupId, setSelectedSupId] = useState<string>(supervisors[0]?.id || '');
  const [hospital, setHospital] = useState(supervisors[0]?.hospital || 'University Medical Center');
  const [department, setDepartment] = useState(supervisors[0]?.department || 'Vascular Surgery');
  const [trainingDate, setTrainingDate] = useState(new Date().toISOString().substring(0, 10));
  const [startTime, setStartTime] = useState('07:30');
  const [endTime, setEndTime] = useState('16:00');
  const [breakDurationMinutes, setBreakDurationMinutes] = useState(45);
  const [netTrainingHours, setNetTrainingHours] = useState(7.75);
  const [sessionType, setSessionType] = useState<TrainingSession['sessionType']>('Theatre');
  const [activities, setActivities] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [verified, setVerified] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Calculation effect
  useEffect(() => {
    if (!startTime || !endTime) return;
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    let diffMins = (eH * 60 + eM) - (sH * 60 + sM);
    if (diffMins < 0) diffMins += 24 * 60;
    const netMins = Math.max(0, diffMins - (Number(breakDurationMinutes) || 0));
    setNetTrainingHours(Number((netMins / 60).toFixed(2)));
  }, [startTime, endTime, breakDurationMinutes]);

  const handleOpenAdd = (session?: TrainingSession) => {
    if (session) {
      setEditingSession(session);
      setSelectedSupId(session.supervisorId || '');
      setHospital(session.hospital);
      setDepartment(session.department);
      setTrainingDate(session.trainingDate);
      setStartTime(session.startTime);
      setEndTime(session.endTime);
      setBreakDurationMinutes(session.breakDurationMinutes);
      setNetTrainingHours(session.netTrainingHours);
      setSessionType(session.sessionType);
      setActivities(session.trainingActivities);
      setSelectedSkills(session.skillsPracticed || []);
      setNotes(session.notes || '');
      setVerified(session.verified);
    } else {
      setEditingSession(null);
      setSelectedSupId(supervisors[0]?.id || '');
      setHospital(supervisors[0]?.hospital || 'University Medical Center');
      setDepartment(supervisors[0]?.department || 'Vascular Surgery');
      setTrainingDate(new Date().toISOString().substring(0, 10));
      setStartTime('08:00');
      setEndTime('16:30');
      setBreakDurationMinutes(45);
      setSessionType('Theatre');
      setActivities('Operating room case attendance, patient preparation and post-op ward rounds.');
      setSelectedSkills(['Surgical Hand Scrubbing', 'Sterile Gowning and Gloving', 'Vessel Exposure']);
      setNotes('');
      setVerified(true);
    }
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (netTrainingHours <= 0) {
      setFormError('Net hours must be greater than zero. Please check start/end time and break duration.');
      return;
    }

    const sup = supervisors.find(s => s.id === selectedSupId);

    const payload: Omit<TrainingSession, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      supervisorId: selectedSupId,
      supervisorName: sup ? `${sup.academicDegree || ''} ${sup.fullName}`.trim() : undefined,
      hospital,
      department,
      trainingDate,
      startTime,
      endTime,
      breakDurationMinutes: Number(breakDurationMinutes),
      netTrainingHours,
      sessionType,
      trainingActivities: activities,
      skillsPracticed: selectedSkills,
      notes,
      verified,
    };

    if (editingSession) {
      await updateTrainingSession(editingSession.id, payload);
    } else {
      await addTrainingSession(payload);
    }
    setShowAddModal(false);
  };

  // Metrics
  const totalSessionHours = trainingSessions.reduce((acc, s) => acc + (Number(s.netTrainingHours) || 0), 0);
  const distinctDays = new Set(trainingSessions.map(s => s.trainingDate)).size;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-[#101C32] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2.5 py-1 rounded-md border border-teal-500/30">
            Section 8: Precise Documented Hours Tracking
          </span>
          <h2 className="text-xl font-bold tracking-tight mt-2">
            {t.sessions}
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            {isRTL
              ? 'سجل ساعات الحضور التدريبي مع الخصم الدقيق لفترات الاستراحة لتوثيق الساعات المعتمدة رسمياً.'
              : language === 'de'
              ? 'Präzise Weiterbildungsstunden-Erfassung mit automatischem Pausenabzug gemäß Weiterbildungsordnung.'
              : 'Training hours are strictly calculated from documented attendance timestamps with break deduction.'}
          </p>
        </div>

        <button
          onClick={() => handleOpenAdd()}
          className="flex items-center gap-2 bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
        >
          <Plus size={16} /> {t.addTrainingSession}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Documented Attendance</span>
          <span className="text-lg font-bold text-slate-900 mt-1 block">{trainingSessions.length} Sessions</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Documented Hours</span>
          <span className="text-lg font-bold text-teal-700 mt-1 block">{totalSessionHours.toFixed(1)} Hours</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Active Training Days</span>
          <span className="text-lg font-bold text-slate-900 mt-1 block">{distinctDays} Days</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Calculation Standard</span>
          <span className="text-xs font-semibold text-emerald-700 mt-1 flex items-center gap-1">
            <CheckCircle2 size={13} /> Break-Deducted Net
          </span>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Attendance Logbook ({trainingSessions.length} recorded sessions)
          </h3>
        </div>

        {trainingSessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Hospital & Department</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Time Period</th>
                  <th className="p-3">Break</th>
                  <th className="p-3">Net Hours</th>
                  <th className="p-3">Supervisor</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trainingSessions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-mono font-medium text-slate-700">{s.trainingDate}</td>
                    <td className="p-3 text-slate-800">
                      <div className="font-semibold">{s.hospital}</div>
                      <div className="text-[10px] text-slate-500">{s.department}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        {s.sessionType}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {s.startTime} — {s.endTime}
                    </td>
                    <td className="p-3 font-mono text-slate-500">{s.breakDurationMinutes}m</td>
                    <td className="p-3 font-mono font-bold text-teal-800">{s.netTrainingHours}h</td>
                    <td className="p-3 text-slate-700">{s.supervisorName || '—'}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenAdd(s)}
                          className="p-1 text-slate-500 hover:text-teal-700"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => setSessionToDelete(s)}
                          className="p-1 text-red-400 hover:text-red-700 transition cursor-pointer"
                          title={isRTL ? 'حذف جلسة التدريب' : 'Delete Session'}
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
          <div className="p-10 text-center text-xs text-slate-400">
            No training sessions documented yet. Click <strong>+ Log Attendance Session</strong> to start recording your surgical hours.
          </div>
        )}
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-auto modal-dialog-responsive">
            <div className="bg-[#101C32] text-white px-4 sm:px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold tracking-tight">
                {editingSession ? 'Edit Training Session' : 'Log Clinical Attendance Session'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 bg-[#FBFDFE]">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center justify-between font-medium">
                  <span>{formError}</span>
                  <button type="button" onClick={() => setFormError(null)} className="text-red-500 hover:text-red-700">
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Training Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={trainingDate}
                    onChange={(e) => setTrainingDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Session Type *
                  </label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="Theatre">Operating Theatre</option>
                    <option value="Clinical Ward">Clinical Ward Rounds</option>
                    <option value="Outpatient">Outpatient Surgical Clinic</option>
                    <option value="Emergency Call">Emergency On-Call</option>
                    <option value="Simulation Lab">Simulation Lab</option>
                    <option value="Academic Teaching">Academic Teaching</option>
                  </select>
                </div>
              </div>

              {/* Precise Time Row */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">Break (min)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={breakDurationMinutes}
                    onChange={(e) => setBreakDurationMinutes(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-teal-900 mb-1">Net Hours</label>
                  <div className="bg-teal-600 text-white font-bold rounded px-2 py-1 text-xs text-center font-mono">
                    {netTrainingHours}h
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supervisor
                  </label>
                  <select
                    value={selectedSupId}
                    onChange={(e) => setSelectedSupId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="">None / Unassigned</option>
                    {supervisors.map(s => (
                      <option key={s.id} value={s.id}>{s.academicDegree || ''} {s.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hospital *
                  </label>
                  <input
                    type="text"
                    required
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Training Activities Handled
                </label>
                <textarea
                  rows={2}
                  value={activities}
                  onChange={(e) => setActivities(e.target.value)}
                  placeholder="Summary of cases, ward discussions, or procedures covered..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0D9488] hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-800 space-y-4 shadow-2xl border border-red-200 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              {isRTL ? 'تأكيد حذف جلسة التدريب' : 'Confirm Session Deletion'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isRTL
                ? `هل أنت متأكد من رغبتك في حذف جلسة التدريب بتاريخ (${sessionToDelete.trainingDate}) نهائياً؟`
                : `Are you sure you want to permanently delete the training session on (${sessionToDelete.trainingDate})?`}
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteTrainingSession(sessionToDelete.id);
                  setSessionToDelete(null);
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
