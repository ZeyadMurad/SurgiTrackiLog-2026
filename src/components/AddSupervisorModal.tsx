import React, { useState } from 'react';
import { X, UserCheck, Building2, GraduationCap } from 'lucide-react';
import { Supervisor } from '../types';
import { SUPERVISOR_POSITIONS, SURGICAL_SPECIALTIES } from '../lib/medicalDefaults';

interface AddSupervisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Supervisor, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  existingSupervisor?: Supervisor | null;
}

export const AddSupervisorModal: React.FC<AddSupervisorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingSupervisor,
}) => {
  const [fullName, setFullName] = useState(existingSupervisor?.fullName || '');
  const [academicDegree, setAcademicDegree] = useState(existingSupervisor?.academicDegree || 'MD, PhD');
  const [academicTitle, setAcademicTitle] = useState(existingSupervisor?.academicTitle || 'Prof. Dr. med.');
  const [professionalPosition, setProfessionalPosition] = useState(
    existingSupervisor?.professionalPosition || SUPERVISOR_POSITIONS[0]
  );
  const [specialty, setSpecialty] = useState(existingSupervisor?.specialty || SURGICAL_SPECIALTIES[1]);
  const [subspecialty, setSubspecialty] = useState(existingSupervisor?.subspecialty || '');
  const [department, setDepartment] = useState(
    existingSupervisor?.department || 'Department of Vascular and Endovascular Surgery'
  );
  const [hospital, setHospital] = useState(existingSupervisor?.hospital || 'University Medical Center');
  const [university, setUniversity] = useState(existingSupervisor?.university || '');
  const [country, setCountry] = useState(existingSupervisor?.country || 'Germany');
  const [email, setEmail] = useState(existingSupervisor?.email || '');
  const [notes, setNotes] = useState(existingSupervisor?.additionalNotes || '');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!fullName.trim() || !hospital.trim()) {
      setErrorMessage('Full name and Hospital are required.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        fullName,
        academicDegree,
        academicTitle,
        professionalPosition,
        specialty,
        subspecialty,
        department,
        hospital,
        university,
        country,
        email,
        additionalNotes: notes,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(`Error saving supervisor: ${err.message || 'Please check your inputs'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto">
        <div className="bg-[#101C32] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <UserCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {existingSupervisor ? 'Edit Supervisor Profile' : 'Register New Supervisor / Weiterbildungsbefugter'}
              </h2>
              <p className="text-xs text-slate-300">
                Independent training portfolio & verification authority
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm text-slate-700 bg-[#FBFDFE]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Title
              </label>
              <input
                type="text"
                placeholder="Prof. Dr. med. / Dr."
                value={academicTitle}
                onChange={(e) => setAcademicTitle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Thomas Weber"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Degrees / Fellowships
              </label>
              <input
                type="text"
                placeholder="MD, PhD, FRCS, FEBVS"
                value={academicDegree}
                onChange={(e) => setAcademicDegree(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Professional Position *
              </label>
              <select
                value={professionalPosition}
                onChange={(e) => setProfessionalPosition(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {SUPERVISOR_POSITIONS.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specialty *
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {SURGICAL_SPECIALTIES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subspecialty (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Endovascular & Aortic Surgery"
                value={subspecialty}
                onChange={(e) => setSubspecialty(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hospital / Clinic *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. University Hospital Hamburg-Eppendorf"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Department of Vascular Surgery"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Affiliated University
              </label>
              <input
                type="text"
                placeholder="e.g. University of Hamburg"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Country *
              </label>
              <input
                type="text"
                required
                placeholder="Germany"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email (Optional)
              </label>
              <input
                type="email"
                placeholder="supervisor@clinic.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supervision Notes / Weiterbildungsbefugnis
            </label>
            <textarea
              rows={2}
              placeholder="Full Weiterbildungsbefugnis for Vascular Surgery, specialized in EVAR and peripheral bypass..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#0D9488] hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-teal-900/10 cursor-pointer"
            >
              {saving ? 'Saving...' : existingSupervisor ? 'Update Profile' : 'Register Supervisor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
