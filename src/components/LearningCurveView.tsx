import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  Target,
  Award,
  Activity,
  Settings2,
  BarChart3,
  LineChart as LineChartIcon,
  Gauge,
  Info,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { translations } from '../lib/i18n';
import { TrainingRecord } from '../types';

/**
 * LEARNING CURVE ANALYTICS
 * ------------------------
 * Charts procedure volume against procedural complexity (derived from the
 * documented participation role) over the trainee's chronology, detects the
 * "competency point" (when the rolling autonomy average crosses the
 * competency threshold) and benchmarks progress against editable
 * programme reference targets.
 */

const ROLE_COMPLEXITY: Record<string, number> = {
  'Observer': 1,
  'Assisted': 2,
  'Second Assistant': 2.5,
  'First Assistant': 3,
  'Scrubbed and Assisted': 3,
  'Performed Specific Steps Under Direct Supervision': 4,
  'Performed Under Supervision': 5,
};

const COMPETENCY_THRESHOLD = 4.0; // "Performed (steps) under supervision" sustained
const ROLLING_WINDOW = 5;

interface Targets {
  totalProcedures: number;
  performedProcedures: number;
  totalHours: number;
}

const DEFAULT_TARGETS: Targets = {
  totalProcedures: 500,
  performedProcedures: 250,
  totalHours: 4000,
};

const TARGETS_KEY = 'surgitrack_lc_targets';

export const LearningCurveView: React.FC = () => {
  const { trainingRecords, trainingSessions, skills, stats } = useData();
  const { language } = useAuth();
  const t = translations[language] || translations.en;
  const isRTL = language === 'ar';

  const L = (ar: string, en: string, de?: string) => (isRTL ? ar : language === 'de' ? (de || en) : en);

  const [showTargets, setShowTargets] = useState(false);
  const [targets, setTargets] = useState<Targets>(() => {
    try {
      const saved = localStorage.getItem(TARGETS_KEY);
      return saved ? { ...DEFAULT_TARGETS, ...JSON.parse(saved) } : DEFAULT_TARGETS;
    } catch {
      return DEFAULT_TARGETS;
    }
  });

  const saveTargets = (next: Targets) => {
    setTargets(next);
    try {
      localStorage.setItem(TARGETS_KEY, JSON.stringify(next));
    } catch {}
  };

  /* ---------- Data preparation ---------- */
  const chron = useMemo(() => {
    return trainingRecords
      .filter(r => r.procedureName || r.activityType)
      .sort((a, b) =>
        (a.procedureDate || a.trainingDate).localeCompare(b.procedureDate || b.trainingDate)
      )
      .map((r, i) => ({
        index: i + 1,
        date: r.procedureDate || r.trainingDate,
        procedure: r.procedureName || r.activityType,
        specialty: r.specialty || 'General',
        complexity: ROLE_COMPLEXITY[r.participationRole] || 2,
        role: r.participationRole,
        hours: Number(r.netTrainingHours) || 0,
      }));
  }, [trainingRecords]);

  const movingAvg = useMemo(() => {
    return chron.map((_, i) => {
      const from = Math.max(0, i - ROLLING_WINDOW + 1);
      const window = chron.slice(from, i + 1);
      return window.reduce((s, p) => s + p.complexity, 0) / window.length;
    });
  }, [chron]);

  // Competency point: first index where moving average crosses threshold AND stays above for 3 consecutive points
  const competencyIndex = useMemo(() => {
    let consecutive = 0;
    for (let i = 0; i < movingAvg.length; i++) {
      if (movingAvg[i] >= COMPETENCY_THRESHOLD) {
        consecutive++;
        if (consecutive >= 3) {
          return i - 2; // first index of the sustained crossing
        }
      } else {
        consecutive = 0;
      }
    }
    return -1;
  }, [movingAvg]);

  const performedOps = chron.filter(p => p.complexity >= 4).length;
  const totalHours = stats.totalHours;
  const currentAvg = movingAvg.length > 0 ? movingAvg[movingAvg.length - 1] : 0;

  // Progress toward editable reference targets
  const pct = (n: number, d: number) => Math.min(100, d > 0 ? Math.round((n / d) * 100) : 0);
  const progressTotal = pct(chron.length, targets.totalProcedures);
  const progressPerformed = pct(performedOps, targets.performedProcedures);
  const progressHours = pct(totalHours, targets.totalHours);

  // Complexity percentile among the trainee's OWN procedures (share of activity at competence level or above)
  const atCompetence = chron.filter(p => p.complexity >= COMPETENCY_THRESHOLD).length;
  const competenceShare = chron.length > 0 ? Math.round((atCompetence / chron.length) * 100) : 0;

  /* ---------- Specialty breakdown ---------- */
  const bySpecialty = useMemo(() => {
    const map = new Map<string, { count: number; complexitySum: number }>();
    chron.forEach(p => {
      const cur = map.get(p.specialty) || { count: 0, complexitySum: 0 };
      cur.count++;
      cur.complexitySum += p.complexity;
      map.set(p.specialty, cur);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, count: v.count, avg: v.complexitySum / v.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [chron]);

  /* ---------- Monthly volume ---------- */
  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    chron.forEach(p => {
      const key = (p.date || '').substring(0, 7); // YYYY-MM
      if (/^\d{4}-\d{2}$/.test(key)) map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
  }, [chron]);

  /* ================= SVG LEARNING CURVE CHART ================= */
  const W = 860, H = 300, PAD_L = 42, PAD_R = 16, PAD_T = 18, PAD_B = 34;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const maxY = 5;

  const x = (i: number) => PAD_L + (chron.length > 1 ? (i / (chron.length - 1)) * chartW : chartW / 2);
  const y = (v: number) => PAD_T + chartH - ((v - 1) / (maxY - 1)) * chartH;

  const trendPath = movingAvg
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(' ');

  const areaPath =
    chron.length > 0
      ? `${trendPath} L ${x(chron.length - 1).toFixed(1)} ${y(1)} L ${x(0).toFixed(1)} ${y(1)} Z`
      : '';

  return (
    <div className={`max-w-7xl mx-auto p-4 sm:p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#134e4a] to-[#0D9488] rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <TrendingUp size={28} className="text-teal-300" />
          </div>
          <div className="flex-1 min-w-[240px]">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {L('منحنى التعلم الجراحي', 'Surgical Learning Curve', 'Chirurgische Lernkurve')}
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 mt-1 leading-relaxed">
              {L(
                'تحليل تطور استقلاليتك الجراحية عبر الزمن — حجم العمليات مقابل درجة التعقيد، نقطة الكفاءة، والمقارنة بالأهداف المرجعية',
                'Analytics of your growing operative autonomy — volume vs complexity, competency point, and benchmarking against reference targets'
              )}
            </p>
          </div>
          <button
            onClick={() => setShowTargets(!showTargets)}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-[11px] px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            <Settings2 size={13} />
            {L('الأهداف المرجعية', 'Reference Targets', 'Referenzziele')}
          </button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-white/10 border border-white/15 rounded-2xl p-3">
            <div className="text-[9px] uppercase font-bold text-white/60 tracking-wide">{L('عمليات موثقة', 'Documented Ops')}</div>
            <div className="text-xl font-extrabold text-teal-300 mt-0.5">{chron.length}</div>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-2xl p-3">
            <div className="text-[9px] uppercase font-bold text-white/60 tracking-wide">{L('أداء تحت إشراف', 'Performed Level')}</div>
            <div className="text-xl font-extrabold text-indigo-300 mt-0.5">{performedOps}</div>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-2xl p-3">
            <div className="text-[9px] uppercase font-bold text-white/60 tracking-wide">{L('متوسط الاستقلالية', 'Autonomy Trend')}</div>
            <div className="text-xl font-extrabold text-amber-300 mt-0.5">{currentAvg.toFixed(1)}/5</div>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-2xl p-3">
            <div className="text-[9px] uppercase font-bold text-white/60 tracking-wide">{L('ساعات التدريب', 'Training Hours')}</div>
            <div className="text-xl font-extrabold text-white mt-0.5">{totalHours.toFixed(0)}h</div>
          </div>
        </div>
      </div>

      {/* Targets editor */}
      {showTargets && (
        <div className="bg-white rounded-3xl border border-amber-200 shadow-sm p-5 space-y-4">
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 leading-relaxed">
            <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <span>
              {L(
                'هذه أهداف مرجعية قابلة للتعديل (افتراضية) — عدّلها بما يطابق متطلبات برنامجك التدريبي المحلي (مثل ISCP أو ACGME أو WBO) لتتبع تقدمك مقابلها بدقة.',
                'These are editable default reference targets — adjust them to your local training programme requirements (e.g. ISCP, ACGME or WBO) to track your progress precisely.'
              )}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([
              ['totalProcedures', L('إجمالي العمليات المستهدف', 'Target total procedures', 'Ziel OP-Gesamt')],
              ['performedProcedures', L('عمليات "أداء تحت إشراف" المستهدفة', 'Target performed-level ops', 'Ziel eigenständige OPs')],
              ['totalHours', L('ساعات التدريب المستهدفة', 'Target training hours', 'Ziel Ausbildungsstunden')],
            ] as [keyof Targets, string][]).map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
                <input
                  type="number"
                  min={1}
                  value={targets[key]}
                  onChange={(e) => saveTargets({ ...targets, [key]: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Curve Chart */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <LineChartIcon size={17} className="text-teal-700" />
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                {L('منحنى التعلم — الاستقلالية عبر تراكم الخبرة', 'Learning Curve — Autonomy vs Cumulative Experience')}
              </h2>
              <p className="text-[10px] text-slate-500">
                {L(
                  'كل نقطة = عملية (ارتفاعها = مستوى مشاركتك). الخط المتصل = متوسط متحرك لآخر 5 عمليات.',
                  'Each point = one operation (height = participation level). Solid line = rolling 5-operation average.'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-600">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" /> {L('عملية', 'Operation')}</span>
            <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-indigo-600 inline-block" /> {L('متوسط متحرك', 'Moving avg')}</span>
            <span className="flex items-center gap-1"><span className="w-4 h-0 border-t-2 border-dashed border-red-500 inline-block" /> {L('عتبة الكفاءة', 'Competency')}</span>
          </div>
        </div>

        <div className="p-4" dir="ltr">
          {chron.length < 2 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Activity size={28} />
              <p className="text-xs font-medium text-center max-w-sm">
                {L(
                  'وثّق عمليتين جراحيتين على الأقل في "سجل العمليات" ليبدأ رسم منحنى التعلم بالظهور والتطور.',
                  'Document at least two operations in the Logbook to start plotting your learning curve.'
                )}
              </p>
            </div>
          ) : (
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
              {/* Grid + Y labels */}
              {[1, 2, 3, 4, 5].map(v => (
                <g key={v}>
                  <line x1={PAD_L} y1={y(v)} x2={W - PAD_R} y2={y(v)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray={v === COMPETENCY_THRESHOLD ? '6 4' : undefined} strokeDashoffset={v === COMPETENCY_THRESHOLD ? 0 : undefined} />
                  {v === COMPETENCY_THRESHOLD && (
                    <line x1={PAD_L} y1={y(v)} x2={W - PAD_R} y2={y(v)} stroke="#ef4444" strokeWidth="1.6" strokeDasharray="6 4" />
                  )}
                  <text x={PAD_L - 8} y={y(v) + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">{v}</text>
                </g>
              ))}

              {/* Role labels on Y axis */}
              <text x={PAD_L - 8} y={y(1) + 14} textAnchor="end" fontSize="7.5" fill="#cbd5e1">Observer</text>
              <text x={PAD_L - 8} y={y(3) - 6} textAnchor="end" fontSize="7.5" fill="#cbd5e1">Assistant</text>
              <text x={PAD_L - 8} y={y(5) + 3} textAnchor="end" fontSize="7.5" fill="#cbd5e1">Performed</text>

              {/* X labels */}
              {chron.length > 0 && (
                <>
                  <text x={x(0)} y={H - 10} textAnchor="middle" fontSize="9" fill="#94a3b8">1</text>
                  <text x={x(chron.length - 1)} y={H - 10} textAnchor="middle" fontSize="9" fill="#94a3b8">{chron.length}</text>
                  <text x={(PAD_L + W - PAD_R) / 2} y={H - 10} textAnchor="middle" fontSize="9" fill="#94a3b8" fontStyle="italic">
                    {L('تراكم الخبرة (رقم العملية)', 'Cumulative experience (case #)')}
                  </text>
                </>
              )}

              {/* Trend area */}
              <path d={areaPath} fill="url(#lcGrad)" opacity="0.35" />
              <defs>
                <linearGradient id="lcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Moving average line */}
              <path d={trendPath} fill="none" stroke="#4f46e5" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />

              {/* Data points */}
              {chron.map((p, i) => (
                <circle
                  key={i}
                  cx={x(i)}
                  cy={y(p.complexity)}
                  r={Math.max(2.4, Math.min(4.4, 2 + p.hours / 4))}
                  fill={p.complexity >= 4 ? '#0d9488' : p.complexity >= 3 ? '#0891b2' : '#94a3b8'}
                  stroke="#ffffff"
                  strokeWidth="1"
                  opacity="0.9"
                >
                  <title>{`${p.date} — ${p.procedure}\n${p.role}\n${p.hours}h`}</title>
                </circle>
              ))}

              {/* Competency point marker */}
              {competencyIndex >= 0 && (
                <g>
                  <line x1={x(competencyIndex)} y1={PAD_T} x2={x(competencyIndex)} y2={PAD_T + chartH} stroke="#059669" strokeWidth="1.8" strokeDasharray="4 3" />
                  <rect x={Math.min(x(competencyIndex) + 4, W - 190)} y={PAD_T + 2} width="186" height="16" rx="8" fill="#059669" />
                  <text x={Math.min(x(competencyIndex) + 12, W - 182)} y={PAD_T + 13.5} fontSize="9" fill="#ffffff" fontWeight="700">
                    {L(`نقطة الكفاءة — العملية رقم ${competencyIndex + 1}`, `Competency point — case #${competencyIndex + 1}`)}
                  </text>
                </g>
              )}
            </svg>
          )}
        </div>

        {competencyIndex >= 0 && chron.length > 1 && (
          <div className="mx-4 mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5">
            <Award size={15} className="text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-900 leading-relaxed">
              {L(
                `رائع! تجاوزت نقطة الكفاءة المتوقعة عند العملية رقم ${competencyIndex + 1}: منذ تلك النقطة حافظ متوسط استقلاليتك على مستوى "أداء تحت إشراف" أو أعلى بشكل مستدام. استمر في رفع نسبة العمليات التي تؤديها بنفسك.`,
                `Excellent! You crossed the expected competency point at case #${competencyIndex + 1}: since then your rolling autonomy has sustained "performed under supervision" level or higher. Keep increasing your share of independently performed procedures.`
              )}
            </p>
          </div>
        )}
      </div>

      {/* Progress vs targets + percentile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <Target size={17} className="text-teal-700" />
            <h2 className="text-sm font-extrabold text-slate-900">
              {L('التقدم مقابل الأهداف المرجعية', 'Progress vs Reference Targets')}
            </h2>
          </div>

          {([
            { label: L('إجمالي العمليات الموثقة', 'Total documented operations'), value: chron.length, target: targets.totalProcedures, pct: progressTotal, color: 'bg-teal-600' },
            { label: L('عمليات بمستوى "أداء تحت إشراف"', 'Performed-level operations'), value: performedOps, target: targets.performedProcedures, pct: progressPerformed, color: 'bg-indigo-600' },
            { label: L('إجمالي ساعات التدريب', 'Total training hours'), value: totalHours, target: targets.totalHours, pct: progressHours, color: 'bg-amber-500' },
          ]).map((row, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-700">{row.label}</span>
                <span className="font-mono font-bold text-slate-900">
                  {row.value} / {row.target} <span className="text-slate-400">({row.pct}%)</span>
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${row.color} rounded-full transition-all duration-700`} style={{ width: `${row.pct}%` }} />
              </div>
            </div>
          ))}

          <div className="p-3 bg-gradient-to-r from-teal-50 to-indigo-50 border border-teal-200 rounded-2xl text-[11px] text-slate-700 leading-relaxed">
            {L(
              `أنجزت ${progressTotal}% من الهدف المرجعي للعمليات و${progressPerformed}% من هدف عمليات الأداء تحت إشراف و${progressHours}% من هدف الساعات.`,
              `You have completed ${progressTotal}% of the reference procedure target, ${progressPerformed}% of the performed-level target and ${progressHours}% of the hours target.`
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <Gauge size={17} className="text-indigo-700" />
            <h2 className="text-sm font-extrabold text-slate-900">
              {L('مؤشر الكفاءة والمقارنة', 'Competency Index & Benchmark')}
            </h2>
          </div>

          {/* Gauge */}
          <div className="flex items-center justify-center py-2" dir="ltr">
            <svg viewBox="0 0 200 115" className="w-64 h-auto">
              <path d="M 20 105 A 80 80 0 0 1 180 105" fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round" />
              <path
                d="M 20 105 A 80 80 0 0 1 180 105"
                fill="none"
                stroke={competenceShare >= 60 ? '#059669' : competenceShare >= 30 ? '#d97706' : '#94a3b8'}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${(competenceShare / 100) * 251.3} 251.3`}
              />
              <text x="100" y="88" textAnchor="middle" fontSize="30" fontWeight="800" fill="#0f172a">{competenceShare}%</text>
              <text x="100" y="104" textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="600">
                {L('من عملياتك بمستوى الكفاءة+', 'of ops at competence+')}
              </text>
            </svg>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            {L(
              `${competenceShare}% من عملياتك الموثقة تمت بمستوى "أداء تحت إشراف" أو أعلى (النسبة المتبقية مساعدة ومراقبة — وهي أيضاً جزء طبيعي من التعلم). ${
                competenceShare >= 60
                  ? 'أداء ممتاز يفوق التوزيع النموذجي لمتدرب في منتصف البرنامج.'
                  : competenceShare >= 30
                  ? 'توزيع صحي — واصل التركيز على زيادة حصتك من الخطوات الجراحية التي تؤديها بنفسك.'
                  : 'مرحلة مبكرة طبيعية: ركّز على طلب أداء خطوات محددة تحت إشراف مباشر في العمليات القادمة.'
              }`,
              `${competenceShare}% of your documented operations were performed at "performed under supervision" level or above (the remainder are assisting and observing — a normal part of learning). ${
                competenceShare >= 60
                  ? 'Excellent performance exceeding the typical distribution for a mid-programme trainee.'
                  : competenceShare >= 30
                  ? 'Healthy distribution — keep focusing on increasing your share of self-performed steps.'
                  : 'Normal early-stage profile: focus on requesting defined supervised steps in upcoming cases.'
              }`
            )}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <div className="text-[9px] uppercase font-bold text-slate-500">{L('مهارات موثقة', 'Documented Skills')}</div>
              <div className="text-lg font-extrabold text-teal-700">{skills.length}</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <div className="text-[9px] uppercase font-bold text-slate-500">{L('كفاءات مؤكدة', 'Confirmed Competencies')}</div>
              <div className="text-lg font-extrabold text-emerald-700">{stats.assessedCompetencies}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Specialty breakdown + monthly volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <BarChart3 size={17} className="text-cyan-700" />
            <h2 className="text-sm font-extrabold text-slate-900">
              {L('التوزيع حسب التخصص', 'Specialty Breakdown')}
            </h2>
          </div>
          {bySpecialty.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">{L('لا توجد بيانات بعد.', 'No data yet.')}</p>
          ) : (
            <div className="space-y-2.5">
              {bySpecialty.map(s => (
                <div key={s.name} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 truncate max-w-[65%]">{s.name}</span>
                    <span className="font-mono text-slate-500">
                      {s.count} {L('عملية', 'ops')} · {L('متوسط', 'avg')} {s.avg.toFixed(1)}/5
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-600"
                      style={{ width: `${(s.count / bySpecialty[0].count) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <Activity size={17} className="text-rose-700" />
            <h2 className="text-sm font-extrabold text-slate-900">
              {L('الحجم الشهري (آخر 12 شهر)', 'Monthly Volume (last 12 months)')}
            </h2>
          </div>
          {monthly.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">{L('لا توجد بيانات بعد.', 'No data yet.')}</p>
          ) : (
            <div className="flex items-end justify-between gap-1.5 h-40" dir="ltr">
              {monthly.map(([month, count]) => {
                const max = Math.max(...monthly.map(m => m[1]));
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <span className="text-[9px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition">{count}</span>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-rose-500 to-rose-400 hover:from-rose-600 transition-all"
                      style={{ height: `${Math.max(6, (count / max) * 100)}%` }}
                      title={`${month}: ${count}`}
                    />
                    <span className="text-[8px] font-mono text-slate-400">{month.substring(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
