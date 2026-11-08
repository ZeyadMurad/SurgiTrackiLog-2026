import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, CheckCircle2, Shield, Info, Building } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { exportGermanPortfolio } from '../lib/exports';

export const GermanPortfolioView: React.FC = () => {
  const { supervisors, trainingRecords, skills, trainingSessions } = useData();
  const { profile } = useAuth();

  const [selectedSupId, setSelectedSupId] = useState<string>(supervisors[0]?.id || '');
  const selectedSupervisor = supervisors.find(s => s.id === selectedSupId) || supervisors[0];

  const supRecords = trainingRecords.filter(r => r.supervisorId === (selectedSupervisor?.id || ''));
  const supSessions = trainingSessions.filter(s => s.supervisorId === (selectedSupervisor?.id || ''));
  const totalHours = supRecords.reduce((acc, r) => acc + (Number(r.netTrainingHours) || 0), 0) +
                     supSessions.reduce((acc, s) => acc + (Number(s.netTrainingHours) || 0), 0);

  const handleExport = (format: 'xlsx' | 'pdf' | 'docx') => {
    if (!profile || !selectedSupervisor) return;
    exportGermanPortfolio(
      {
        trainee: profile,
        supervisor: selectedSupervisor,
        records: supRecords,
        sessions: supSessions,
        skills,
      },
      format
    );
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-[#101C32] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2.5 py-1 rounded-md border border-teal-500/30">
            Abschnitt 13: Weiterbildungsordnung (WBO) der Bundesärztekammer
          </span>
          <h2 className="text-xl font-bold tracking-tight mt-2">
            Deutsches Tätigkeits- und Operationsportfolio
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Konforme Dokumentation für die Facharztanerkennung, Äquivalenzprüfung und Anstellung an deutschen Kliniken und Universitätskliniken.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport('xlsx')}
            className="flex items-center gap-1.5 bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
          >
            <FileSpreadsheet size={16} /> WBO Excel-Logbuch (.xlsx)
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
          >
            <FileText size={16} /> PDF Druckversion
          </button>
        </div>
      </div>

      {/* Supervisor Selector & German Legal Notice */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Betreuenden Facharzt / Weiterbildungsbefugten auswählen:
          </label>
          <select
            value={selectedSupId}
            onChange={(e) => setSelectedSupId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500"
          >
            {supervisors.map(s => (
              <option key={s.id} value={s.id}>
                {s.academicDegree || ''} {s.fullName} — {s.professionalPosition} ({s.hospital})
              </option>
            ))}
          </select>

          {selectedSupervisor && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Klinik:</span>
                <span className="font-semibold text-slate-800 truncate block">{selectedSupervisor.hospital}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Fachgebiet:</span>
                <span className="font-semibold text-slate-800 block">{selectedSupervisor.specialty}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Eingriffe:</span>
                <span className="font-bold text-teal-700 block">{supRecords.length} Operationen</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Stunden gesamt:</span>
                <span className="font-bold text-teal-700 block">{totalHours.toFixed(1)} Std.</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-teal-50/50 rounded-2xl p-5 border border-teal-200/80 shadow-xs flex flex-col justify-between text-xs">
          <div>
            <div className="flex items-center gap-2 text-teal-900 font-bold mb-2">
              <Info size={16} className="text-teal-700" />
              <span>WBO-Terminologiegarantie</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              SurgiTrack unterscheidet strikt zwischen:
              <br />• <strong>Beobachtet</strong>
              <br />• <strong>Assistiert (1. / 2. Assistent)</strong>
              <br />• <strong>Unter direkter Supervision durchgeführte operative Teilschritte</strong>
            </p>
          </div>
          <div className="text-[10px] text-slate-400 mt-2">
            Entspricht den Anforderungen der Weiterbildungsordnungen deutscher Landesärztekammern.
          </div>
        </div>
      </div>

      {/* Operative Logbook Table (Deutsches Operationslogbuch) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Deutsches Operationslogbuch ({supRecords.length} erfasste Eingriffe)
            </h3>
            <p className="text-xs text-slate-500">
              Chronologische Auflistung der chirurgischen Beteiligung unter {selectedSupervisor?.academicDegree || ''} {selectedSupervisor?.fullName}
            </p>
          </div>
        </div>

        {supRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Datum</th>
                  <th className="p-3">Klinik & Abteilung</th>
                  <th className="p-3">Bezeichnung des Eingriffs</th>
                  <th className="p-3">Art der Beteiligung (WBO)</th>
                  <th className="p-3">Dauer (Std.)</th>
                  <th className="p-3">Operative Teilschritte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-mono font-medium text-slate-600">{r.trainingDate}</td>
                    <td className="p-3 text-slate-800">
                      <div className="font-semibold">{r.hospital || selectedSupervisor?.hospital}</div>
                      <div className="text-[10px] text-slate-500">{r.department}</div>
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{r.procedureName}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                        {r.participationGerman || r.participationRole}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">{r.netTrainingHours} Std.</td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">
                      {r.responsibilities || r.descriptionOfParticipation || 'Reguläre OP-Assistenz'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            Keine Operationen für diesen Facharzt erfasst. Fügen Sie Einträge über das Modul „Supervisors & Portfolio“ hinzu.
          </div>
        )}
      </div>
    </div>
  );
};
