import React from 'react';
import { TrainingRecord, TrainingSession } from '../types';

interface TrainingChartsProps {
  records: TrainingRecord[];
  sessions: TrainingSession[];
  language?: string;
}

export const TrainingCharts: React.FC<TrainingChartsProps> = ({ records, sessions }) => {
  // 1. Training Hours by Month
  const monthMap: Record<string, number> = {};
  [...records, ...sessions].forEach(item => {
    if (item.trainingDate) {
      const monthKey = item.trainingDate.substring(0, 7); // YYYY-MM
      monthMap[monthKey] = (monthMap[monthKey] || 0) + (Number(item.netTrainingHours) || 0);
    }
  });

  const months = Object.keys(monthMap).sort().slice(-6); // Last 6 months
  const maxMonthHours = Math.max(...months.map(m => monthMap[m]), 10);

  // 2. Operations by Surgical Specialty
  const specialtyMap: Record<string, number> = {};
  records.forEach(r => {
    const spec = r.specialty || 'General Surgery';
    specialtyMap[spec] = (specialtyMap[spec] || 0) + 1;
  });
  const specialties = Object.entries(specialtyMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // 3. Surgical Participation Levels
  const roleMap: Record<string, number> = {
    Observer: 0,
    Assisted: 0,
    'First Assistant': 0,
    'Second Assistant': 0,
    'Performed Specific Steps Under Direct Supervision': 0,
    'Performed Under Supervision': 0,
  };
  records.forEach(r => {
    if (r.participationRole && roleMap[r.participationRole] !== undefined) {
      roleMap[r.participationRole] += 1;
    } else if (r.participationRole) {
      roleMap[r.participationRole] = (roleMap[r.participationRole] || 0) + 1;
    }
  });
  const totalRoles = Object.values(roleMap).reduce((a, b) => a + b, 0) || 1;

  // 4. Procedures by Hospital
  const hospitalMap: Record<string, number> = {};
  records.forEach(r => {
    const hosp = r.hospital || 'Main Center';
    hospitalMap[hosp] = (hospitalMap[hosp] || 0) + 1;
  });
  const hospitals = Object.entries(hospitalMap).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Chart 1: Training Hours by Month */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Monthly Documented Training Hours</h4>
            <p className="text-xs text-slate-500">Based on verified attendance and operative records</p>
          </div>
          <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
            Total {months.reduce((acc, m) => acc + monthMap[m], 0).toFixed(1)}h
          </span>
        </div>

        <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
          {months.length > 0 ? (
            months.map(m => {
              const hrs = monthMap[m];
              const pct = Math.max(8, Math.min(100, (hrs / maxMonthHours) * 100));
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono font-semibold text-slate-500 opacity-0 group-hover:opacity-100 transition">
                    {hrs.toFixed(1)}h
                  </span>
                  <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-full">
                    <div
                      style={{ height: `${pct}%` }}
                      className="w-full bg-gradient-to-t from-[#0D9488] to-[#5EEAD4] rounded-t-lg transition-all duration-500 shadow-xs group-hover:brightness-110"
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-600 truncate w-full text-center">
                    {m.replace(/^20\d\d-/, '')}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
              No monthly training hours recorded yet
            </div>
          )}
        </div>
      </div>

      {/* Chart 2: Surgical Participation Levels */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Surgical Participation Distribution</h4>
            <p className="text-xs text-slate-500">Progression from Observer to Supervised Operator</p>
          </div>
          <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
            {records.length} Procedures
          </span>
        </div>

        <div className="space-y-2.5">
          {Object.entries(roleMap).map(([role, count]) => {
            const pct = Math.round((count / totalRoles) * 100);
            return (
              <div key={role} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 truncate max-w-[240px]">{role}</span>
                  <span className="font-mono text-slate-500 font-semibold">{count} ({pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      role.includes('Supervision')
                        ? 'bg-teal-600'
                        : role.includes('First Assistant')
                        ? 'bg-emerald-500'
                        : role.includes('Assisted')
                        ? 'bg-cyan-500'
                        : 'bg-slate-400'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart 3: Operations by Specialty */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-slate-900 text-sm">Procedures by Surgical Specialty</h4>
          <span className="text-xs text-slate-500">Top Domains</span>
        </div>

        <div className="space-y-3 pt-2">
          {specialties.length > 0 ? (
            specialties.map(([spec, count]) => {
              const maxSpec = specialties[0][1] || 1;
              const pct = Math.round((count / maxSpec) * 100);
              return (
                <div key={spec} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{spec}</span>
                    <span className="font-mono text-slate-600 font-bold">{count} ops</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-[#101C32] to-[#0D9488] rounded-full"
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 italic">No surgical specialty distribution recorded.</p>
          )}
        </div>
      </div>

      {/* Chart 4: Procedures by Hospital */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-slate-900 text-sm">Procedures by Hospital / Center</h4>
          <span className="text-xs text-slate-500">Clinical Sites</span>
        </div>

        <div className="space-y-3 pt-2">
          {hospitals.length > 0 ? (
            hospitals.map(([hosp, count]) => {
              const maxHosp = hospitals[0][1] || 1;
              const pct = Math.round((count / maxHosp) * 100);
              return (
                <div key={hosp} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-[260px]">{hosp}</span>
                    <span className="font-mono text-slate-600 font-bold">{count} ops</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-teal-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 italic">No hospital records logged yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
