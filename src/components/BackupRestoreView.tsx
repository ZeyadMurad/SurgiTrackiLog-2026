import React, { useState } from 'react';
import { Download, Upload, Shield, CheckCircle2, AlertTriangle, FileArchive, RefreshCw, HardDrive } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { createFullBackupZip, parseBackupFile, FullBackupPayload } from '../lib/backup';

export const BackupRestoreView: React.FC = () => {
  const { cases, supervisors, trainingRecords, trainingSessions, skills, recommendations, savedArticles, restorePortfolioData } = useData();
  const { profile } = useAuth();

  const [creating, setCreating] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string>(() => localStorage.getItem('surgitrack_last_backup') || 'Never');
  const [lastBackupSize, setLastBackupSize] = useState<string>(() => localStorage.getItem('surgitrack_last_backup_size') || '0 KB');

  // Restore states
  const [restorePreview, setRestorePreview] = useState<FullBackupPayload | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreateBackup = async () => {
    setCreating(true);
    setErrorMessage('');
    try {
      const payload: FullBackupPayload = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        app: 'SurgiTrack - Professional Surgical Training & Clinical Portfolio',
        profile,
        cases,
        supervisors,
        records: trainingRecords,
        sessions: trainingSessions,
        skills,
        recommendations,
        savedArticles,
      };

      const zipBlob = await createFullBackupZip(payload);
      const sizeKb = (zipBlob.size / 1024).toFixed(1) + ' KB';

      // Trigger download
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().substring(0, 10);
      a.href = url;
      a.download = `SurgiTrack_FullBackup_${dateStr}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      const nowStr = new Date().toLocaleString();
      setLastBackupDate(nowStr);
      setLastBackupSize(sizeKb);
      localStorage.setItem('surgitrack_last_backup', nowStr);
      localStorage.setItem('surgitrack_last_backup_size', sizeKb);
    } catch (err: any) {
      setErrorMessage(`Backup creation failed: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setErrorMessage('');
      setRestoreSuccess(false);
      try {
        const parsed = await parseBackupFile(file);
        setRestorePreview(parsed);
      } catch (err: any) {
        setErrorMessage(err.message);
        setRestorePreview(null);
      }
    }
  };

  const handleConfirmRestore = async () => {
    if (!restorePreview) return;
    setRestoring(true);
    try {
      await restorePortfolioData(restorePreview);
      setRestoreSuccess(true);
      setRestorePreview(null);
      setTimeout(() => setRestoreSuccess(false), 5000);
    } catch (err: any) {
      setErrorMessage(`Restore failed: ${err.message}`);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#101C32] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2.5 py-1 rounded-md border border-teal-500/30">
            Section 14: Data Sovereignty & Protection
          </span>
          <h2 className="text-xl font-bold tracking-tight mt-2">
            Backup & Portfolio Restoration Engine
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Complete zero-data-loss insurance. Download encrypted, structured ZIP archives containing your clinical logbook, supervisor records, attendance hours, and competencies.
          </p>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={creating}
          className="flex items-center gap-2 bg-[#0D9488] hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-teal-900/10 cursor-pointer"
        >
          {creating ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
          <span>{creating ? 'Creating Encrypted Archive...' : 'Create & Download Full Backup (.zip)'}</span>
        </button>
      </div>

      {/* Backup Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Last Backup</span>
            <span className="text-xs font-bold text-slate-800">{lastBackupDate}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <HardDrive size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Archive Size</span>
            <span className="text-xs font-bold text-slate-800">{lastBackupSize}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <FileArchive size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Records Included</span>
            <span className="text-xs font-bold text-slate-800">
              {cases.length} Cases • {trainingRecords.length} Ops • {supervisors.length} Sups
            </span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-800 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {restoreSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>Portfolio successfully restored and verified from backup archive!</span>
        </div>
      )}

      {/* Restore Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Upload size={16} className="text-teal-600" />
          Restore Portfolio from Archive
        </h3>
        <p className="text-xs text-slate-500">
          Upload a previously downloaded SurgiTrack <code>.zip</code> or <code>.json</code> backup. The system verifies data integrity before applying any changes to protect your records.
        </p>

        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50">
          <label className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer transition shadow-xs">
            <Upload size={15} /> Select Backup File (.zip / .json)
            <input
              type="file"
              accept=".zip,.json"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </div>

        {/* Restore Preview Modal/Card */}
        {restorePreview && (
          <div className="bg-teal-50/70 border border-teal-300 rounded-2xl p-5 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-950 font-bold text-sm">
                <CheckCircle2 size={18} className="text-teal-700" />
                <span>Archive Integrity Verified: Ready to Restore</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Exported: {new Date(restorePreview.exportedAt).toLocaleDateString()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-teal-200 text-center">
                <span className="font-bold text-slate-900 text-base">{restorePreview.cases.length}</span>
                <span className="block text-[10px] text-slate-500">Clinical Cases</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-teal-200 text-center">
                <span className="font-bold text-slate-900 text-base">{restorePreview.supervisors.length}</span>
                <span className="block text-[10px] text-slate-500">Supervisors</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-teal-200 text-center">
                <span className="font-bold text-slate-900 text-base">{restorePreview.records.length}</span>
                <span className="block text-[10px] text-slate-500">Training Records</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-teal-200 text-center">
                <span className="font-bold text-slate-900 text-base">{restorePreview.sessions.length}</span>
                <span className="block text-[10px] text-slate-500">Sessions</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-teal-200 text-center">
                <span className="font-bold text-slate-900 text-base">{restorePreview.skills.length}</span>
                <span className="block text-[10px] text-slate-500">Skills</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRestorePreview(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={restoring}
                className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                {restoring ? 'Applying Changes...' : 'Confirm & Restore Portfolio Data'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Explanatory Educational Box (Mandated by Section 14) */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs text-slate-600">
        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
          <Shield size={14} className="text-teal-700" />
          Architecture Difference: User Backup vs. Cloud vs. Export
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <strong className="text-slate-900 block mb-1">1. User-Downloaded Backup (.zip)</strong>
            Self-contained, portable snapshot containing raw JSON databases, media references, and training matrices. Preserved locally on your machine for zero-dependency portability.
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <strong className="text-slate-900 block mb-1">2. Cloud Firestore Real-Time Sync</strong>
            Continuous cloud replication ensuring your clinical records survive browser clearing, device changes, or hardware loss.
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <strong className="text-slate-900 block mb-1">3. Formal Data Export (.xlsx, .docx, .pdf)</strong>
            Human-readable, review-ready presentations formatted strictly for presentation to hospital boards, supervisors, and German Ärztekammern.
          </div>
        </div>
      </div>
    </div>
  );
};
