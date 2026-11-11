import React, { useEffect, useState } from 'react';
import {
  Globe2,
  Download,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Lock,
  Award,
  Building2,
  Landmark,
  Flag,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { translations } from '../lib/i18n';
import {
  exportAccreditationCsv,
  exportAccreditationPDF,
  AccreditationStandard,
  AccreditationPayload,
} from '../lib/accreditationExports';

interface StandardCard {
  id: AccreditationStandard;
  name: string;
  localName: string;
  country: string;
  icon: React.ReactNode;
  color: string;
  descAr: string;
  descEn: string;
  formatNote: string;
}

const STANDARDS: StandardCard[] = [
  {
    id: 'iscp',
    name: 'ISCP',
    localName: 'Intercollegiate Surgical Curriculum Programme',
    country: 'United Kingdom & Ireland',
    icon: <Landmark size={22} />,
    color: 'from-blue-700 to-indigo-700',
    descAr: 'منهج الكليات الجراحية intercollegiate البريطاني — سجل العمليات بدور الجراح/المساعد ومستوى الإشراف لكل عملية، وهو التنسيق المطلوب لاعتماد التدريب الجراحي في بريطانيا وأيرلندا.',
    descEn: 'The UK & Ireland intercollegiate surgical curriculum logbook — procedure-level role and supervision coding required for CCT/credentialing.',
    formatNote: 'Date · Procedure · Role · Supervision · Consultant',
  },
  {
    id: 'acgme',
    name: 'ACGME',
    localName: 'Accreditation Council for Graduate Medical Education',
    country: 'United States',
    icon: <Flag size={22} />,
    color: 'from-red-700 to-rose-700',
    descAr: 'سجل حالات المقيمين الأمريكي (Case Log) — تنسيق ACGME المعتمد لتوثيق العمليات مع دور المقيم (Surgeon Junior / First Assistant) والطبيب المسؤول وبيانات المريض المجّهلة.',
    descEn: 'The US residency Case Log format — resident role, attending of record and de-identified patient demographics.',
    formatNote: 'Date · Procedure · Resident Role · Attending · Patient',
  },
  {
    id: 'racs',
    name: 'RACS / Royal Colleges',
    localName: 'Royal Australasian College of Surgeons · Royal College (Canada)',
    country: 'Australia · New Zealand · Canada',
    icon: <Award size={22} />,
    color: 'from-teal-700 to-emerald-700',
    descAr: 'سجل الكليات الملكية للجراحين (أستراليا/نيوزيلندا/كندا) — ترميز المشاركة المعتمد (P2 أداء تحت إشراف، A1/A2 مساعدة، O مراقبة) لكل عملية جراحية.',
    descEn: 'The Royal College operative logbook coding (P2 performed / A1-A2 assist / O observe) used across Australasia and Canada.',
    formatNote: 'Date · Operation · RACS Coding · Supervisor',
  },
  {
    id: 'aeappro',
    name: 'ÄApprO / WBO',
    localName: 'Approbationsordnung für Ärzte · Weiterbildungsordnung',
    country: 'Germany',
    icon: <Building2 size={22} />,
    color: 'from-amber-600 to-yellow-700',
    descAr: 'دفتر العمليات الألماني الرسمي (§5 ÄApprO / WBO) — مع المصطلحات القانونية الألمانية للدور: Unter Aufsicht (تحت إشراف)، Assistiert (مساعد)، Beobachtung (مراقبة)، واسم الطبيب المخوّل بالتدريب.',
    descEn: 'The German operative logbook (§5 ÄApprO / WBO) with legal German role terms and the Weiterbildungsbefugter of record.',
    formatNote: 'Datum · Eingriff · Eigene Leistung · WB-Befugter Arzt',
  },
];

export const AccreditationView: React.FC = () => {
  const { trainingRecords, cases, supervisors, verifyRecordIntegrityAsync } = useData();
  const { profile, language } = useAuth();
  const t = translations[language] || translations.en;
  const isRTL = language === 'ar';

  const [integrity, setIntegrity] = useState<Record<string, 'valid' | 'tampered' | 'unsigned'>>({});
  const [checking, setChecking] = useState(false);

  const signedRecords = trainingRecords.filter(r => r.signature);
  const tamperedCount = Object.values(integrity).filter(v => v === 'tampered').length;

  // Verify the integrity of every signed record whenever they change
  useEffect(() => {
    let cancelled = false;
    const verifyAll = async () => {
      if (signedRecords.length === 0) {
        setIntegrity({});
        return;
      }
      setChecking(true);
      const results: Record<string, 'valid' | 'tampered' | 'unsigned'> = {};
      for (const r of signedRecords) {
        results[r.id] = await verifyRecordIntegrityAsync(r.id);
      }
      if (!cancelled) {
        setIntegrity(results);
        setChecking(false);
      }
    };
    verifyAll();
    return () => { cancelled = true; };
  }, [trainingRecords.length, signedRecords.length]);

  const buildPayload = (): AccreditationPayload => ({
    trainee: profile!,
    records: trainingRecords,
    cases,
    supervisors,
  });

  const handleExport = (standard: AccreditationStandard, format: 'csv' | 'pdf') => {
    if (!profile) return;
    const payload = buildPayload();
    if (format === 'csv') exportAccreditationCsv(standard, payload);
    else exportAccreditationPDF(standard, payload);
  };

  return (
    <div className={`max-w-7xl mx-auto p-4 sm:p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#101C32] via-[#123049] to-[#0D9488] rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <Globe2 size={28} className="text-teal-300" />
          </div>
          <div className="flex-1 min-w-[240px]">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {isRTL ? 'الاعتماد الدولي والتوافق المهني' : 'International Accreditation & Compliance'}
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 mt-1 leading-relaxed">
              {isRTL
                ? 'صدّر محفظتك الجراحية بصيغ المناهج الرسمية الأربع الكبرى — مع سجل تدقيق تشفيري للتوقيعات الرقمية'
                : 'Export your surgical portfolio in the four major official curriculum formats — with a cryptographic signature audit trail'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center bg-white/10 border border-white/20 rounded-2xl px-4 py-2.5">
              <div className="text-2xl font-extrabold text-teal-300">{trainingRecords.length}</div>
              <div className="text-[9px] uppercase font-bold text-white/70 tracking-wide">
                {isRTL ? 'سجل موثّق' : 'Records'}
              </div>
            </div>
            <div className="text-center bg-white/10 border border-white/20 rounded-2xl px-4 py-2.5">
              <div className="text-2xl font-extrabold text-indigo-300">{signedRecords.length}</div>
              <div className="text-[9px] uppercase font-bold text-white/70 tracking-wide">
                {isRTL ? 'موقّع رقمياً' : 'Signed'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Standards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {STANDARDS.map(std => (
          <div key={std.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition">
            <div className={`bg-gradient-to-r ${std.color} px-5 py-4 text-white flex items-center gap-3`}>
              <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                {std.icon}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold tracking-tight">{std.name}</h2>
                <p className="text-[10px] text-white/85 leading-tight">{std.localName}</p>
                <p className="text-[10px] text-white/70 font-semibold mt-0.5 flex items-center gap-1">
                  <Globe2 size={9} /> {std.country}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {isRTL ? std.descAr : std.descEn}
              </p>

              <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <FileSpreadsheet size={13} className="text-slate-500 shrink-0" />
                <span className="text-[10px] font-mono font-semibold text-slate-600 truncate" dir="ltr">
                  {std.formatNote}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleExport(std.id, 'pdf')}
                  disabled={trainingRecords.length === 0 || !profile}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#0D9488] hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[11px] py-2.5 rounded-xl shadow-sm transition cursor-pointer"
                >
                  <FileText size={13} />
                  {isRTL ? 'تصدير PDF رسمي' : 'Official PDF'}
                </button>
                <button
                  onClick={() => handleExport(std.id, 'csv')}
                  disabled={trainingRecords.length === 0 || !profile}
                  className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-300 text-slate-700 font-bold text-[11px] py-2.5 px-3.5 rounded-xl transition cursor-pointer"
                  title="CSV (Excel-compatible)"
                >
                  <Download size={13} />
                  CSV
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Digital Signature Audit Trail */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-800 to-violet-800 px-5 py-4 text-white flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
              <Fingerprint size={20} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold">
                {isRTL ? 'سجل التدقيق — التوقيعات الرقمية' : 'Audit Trail — Digital Signatures'}
              </h2>
              <p className="text-[10px] text-white/80">
                {isRTL
                  ? 'تحقق تشفيري فوري من سلامة كل سجل موقّع (SHA-256)'
                  : 'Live cryptographic integrity verification of every signed record (SHA-256)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {checking && <Loader2 size={14} className="animate-spin text-white/70" />}
            {tamperedCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 bg-red-500/20 border border-red-300/40 text-red-100 text-[10px] font-bold px-3 py-1.5 rounded-full">
                <AlertTriangle size={12} />
                {tamperedCount} {isRTL ? 'سجل مُخترق!' : 'tampered!'}
              </span>
            ) : signedRecords.length > 0 && !checking ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-300/40 text-emerald-100 text-[10px] font-bold px-3 py-1.5 rounded-full">
                <CheckCircle2 size={12} />
                {isRTL ? 'كل السجلات سليمة' : 'All records intact'}
              </span>
            ) : null}
          </div>
        </div>

        {signedRecords.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Lock size={26} className="text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              {isRTL
                ? 'لا توجد سجلات موقّعة رقمياً بعد. افتح "سجل العمليات" واختر مشرفاً ثم اضغط "توقيع رقمي" لإنشاء بصمات SHA-256 دائمة.'
                : 'No digitally signed records yet. Open the "Logbook Entries" view, select a supervisor and press "Digitally Sign" to create permanent SHA-256 attestations.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">{isRTL ? 'العملية' : 'Procedure'}</th>
                  <th className="p-3">{isRTL ? 'التاريخ' : 'Date'}</th>
                  <th className="p-3">{isRTL ? 'الموقّع' : 'Signatory'}</th>
                  <th className="p-3">{isRTL ? 'وقت التوقيع' : 'Signed At'}</th>
                  <th className="p-3">SHA-256</th>
                  <th className="p-3">{isRTL ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {signedRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-semibold text-slate-900">{r.procedureName || r.activityType}</td>
                    <td className="p-3 font-mono text-slate-600">{r.procedureDate || r.trainingDate}</td>
                    <td className="p-3 text-slate-700">
                      {r.signature!.supervisorDegree ? `${r.signature!.supervisorDegree} ` : ''}
                      {r.signature!.supervisorName}
                    </td>
                    <td className="p-3 font-mono text-[10px] text-slate-500">
                      {new Date(r.signature!.signedAt).toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-[9px] text-slate-400 max-w-[160px] truncate" dir="ltr" title={r.signature!.contentHash}>
                      {r.signature!.contentHash.substring(0, 32)}…
                    </td>
                    <td className="p-3">
                      {integrity[r.id] === 'tampered' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          <AlertTriangle size={10} /> {isRTL ? 'مُخترق' : 'Tampered'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <ShieldCheck size={10} /> {isRTL ? 'سليم' : 'Valid'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 leading-relaxed text-center">
            {isRTL
              ? 'كل بصمة SHA-256 ملخّصة للمحتوى السريري الكامل للسجل لحظة التوقيع. السجلات الموقّعة مقفلة نهائياً في SurgiTrack iLog — أي تعديل لاحق يغيّر البصمة ويُكتشف فوراً هنا.'
              : 'Each SHA-256 fingerprint digests the full clinical content of the record at signing time. Signed records are permanently locked in SurgiTrack iLog — any later modification changes the fingerprint and is detected here immediately.'}
          </p>
        </div>
      </div>
    </div>
  );
};
