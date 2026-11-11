import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  Stethoscope,
  Scissors,
  ListOrdered,
  AlertCircle,
  FlaskConical,
  ShieldAlert,
  Tag,
  HeartPulse,
  BookOpen,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Quote,
} from 'lucide-react';
import { SupportedLanguage } from '../types';

export interface AiCaseSuggestionsResult {
  diagnosis: string;
  recommendedProcedures: string[];
  operativeSteps: string[];
  commonComplications: string[];
  keyInvestigations: string[];
  redFlags: string[];
  icd10Hints: string[];
  pubmedSearchTerms: string[];
  perioperativeConsiderations: string[];
}

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string;
  source: string;
  pubDate: string;
  doi: string | null;
  url: string;
}

interface Props {
  diagnosis: string;
  patientAge?: number;
  patientSex?: string;
  specialty?: string;
  language: SupportedLanguage;
  onApplyIcd?: (code: string) => void;
}

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  items: string[];
  accent: string;
  expandable?: boolean;
}> = ({ icon, title, items, accent, expandable }) => {
  const [open, setOpen] = useState(!expandable);
  if (!items || items.length === 0) return null;

  return (
    <div className={`rounded-xl border ${accent} overflow-hidden`}>
      <button
        type="button"
        onClick={() => expandable && setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left ${expandable ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span className="flex items-center gap-2 text-xs font-bold">
          {icon}
          {title}
        </span>
        {expandable && (
          open ? <ChevronUp size={14} className="opacity-60" /> : <ChevronDown size={14} className="opacity-60" />
        )}
      </button>
      {open && (
        <div className="px-3.5 pb-3 pt-0.5">
          <ul className="space-y-1.5">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const AiCaseSuggestions: React.FC<Props> = ({
  diagnosis,
  patientAge,
  patientSex,
  specialty,
  language,
  onApplyIcd,
}) => {
  const isRTL = language === 'ar';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AiCaseSuggestionsResult | null>(null);
  const [pubmedLoading, setPubmedLoading] = useState(false);
  const [pubmedTerm, setPubmedTerm] = useState('');
  const [pubmedArticles, setPubmedArticles] = useState<PubMedArticle[]>([]);

  const L = (ar: string, en: string, de?: string) =>
    isRTL ? ar : language === 'de' ? (de || en) : en;

  const fetchSuggestions = async () => {
    if (!diagnosis || diagnosis.trim().length < 2) {
      setError(L('يرجى إدخال تشخيص أولاً قبل طلب الاقتراحات.', 'Please enter a diagnosis first.'));
      return;
    }
    setLoading(true);
    setError('');
    setPubmedArticles([]);
    setPubmedTerm('');
    try {
      const res = await fetch('/api/gemini/case-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosis, patientAge, patientSex, specialty, language }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI suggestions failed.');
      }
      setResult(data as AiCaseSuggestionsResult);
    } catch (err: any) {
      setError(err.message || 'AI suggestions unavailable right now.');
    } finally {
      setLoading(false);
    }
  };

  const searchPubMed = async (term: string) => {
    setPubmedTerm(term);
    setPubmedLoading(true);
    setPubmedArticles([]);
    try {
      const res = await fetch(`/api/pubmed/search?term=${encodeURIComponent(term)}&max=6&sort=relevance`);
      const data = await res.json();
      if (res.ok) {
        setPubmedArticles((data.results || []).slice(0, 6));
      }
    } catch {
      setPubmedArticles([]);
    } finally {
      setPubmedLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-teal-50/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-teal-600 px-4 py-3 text-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <p className="text-xs font-extrabold leading-tight">
              {L('الذكاء الاصطناعي السريري — Gemini', 'Clinical AI — Gemini', 'Klinische KI — Gemini')}
            </p>
            <p className="text-[10px] text-white/80 leading-tight">
              {L('اقتراحات مبنية على الأدلة + أحدث أدبيات PubMed', 'Evidence-based suggestions + latest PubMed literature')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchSuggestions}
          disabled={loading}
          className="shrink-0 flex items-center gap-1.5 bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-[11px] px-3.5 py-2 rounded-xl shadow transition cursor-pointer disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : result ? (
            <RefreshCw size={13} />
          ) : (
            <Sparkles size={13} />
          )}
          {loading
            ? L('جاري التحليل...', 'Analyzing...')
            : result
            ? L('تحديث', 'Refresh')
            : L('اقتراحات AI', 'AI Suggestions')}
        </button>
      </div>

      <div className="p-3.5 space-y-3">
        {error && (
          <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
            <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!result && !loading && (
          <p className="text-[11px] text-slate-500 leading-relaxed text-center py-1.5">
            {L(
              'أدخل التشخيص الرئيسي ثم اضغط "اقتراحات AI" ليقترح Gemini: العمليات الموصى بها، الخطوات الجراحية، المضاعفات الشائعة، الفحوصات، علامات الخطر، وأكواد ICD-10 — مع روابط لأحدث الأدبيات من PubMed.',
              'Enter the primary diagnosis, then press "AI Suggestions" and Gemini will suggest: recommended operations, operative steps, common complications, work-up, red flags and ICD-10 codes — linked to the latest PubMed literature.'
            )}
          </p>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-indigo-600">
            <Loader2 size={26} className="animate-spin" />
            <p className="text-[11px] font-semibold text-center">
              {L('يحلل Gemini التشخيص ويجمع الأدلة...', 'Gemini is analyzing the diagnosis and compiling evidence...')}
            </p>
          </div>
        )}

        {result && !loading && (
          <>
            <div className="flex items-center gap-2 p-2.5 bg-white/80 border border-indigo-100 rounded-xl">
              <Stethoscope size={14} className="text-indigo-600 shrink-0" />
              <span className="text-[11px] text-slate-700">
                <strong className="font-bold">{L('التشخيص المحلل:', 'Analyzed diagnosis:')}</strong>{' '}
                <span className="font-mono">{result.diagnosis}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              <SectionCard
                icon={<Scissors size={14} className="text-teal-700" />}
                title={L('العمليات الموصى بها', 'Recommended Procedures', 'Empfohlene Eingriffe')}
                items={result.recommendedProcedures}
                accent="border-teal-200 bg-teal-50/60 text-teal-950"
              />
              <SectionCard
                icon={<AlertTriangle size={14} className="text-amber-700" />}
                title={L('المضاعفات الشائعة', 'Common Complications', 'Häufige Komplikationen')}
                items={result.commonComplications}
                accent="border-amber-200 bg-amber-50/60 text-amber-950"
              />
              <SectionCard
                icon={<ListOrdered size={14} className="text-indigo-700" />}
                title={L('خطوات العملية الأساسية', 'Key Operative Steps', 'Wichtige OP-Schritte')}
                items={result.operativeSteps}
                accent="border-indigo-200 bg-indigo-50/60 text-indigo-950"
                expandable
              />
              <SectionCard
                icon={<FlaskConical size={14} className="text-sky-700" />}
                title={L('الفحوصات الأساسية', 'Key Investigations', 'Wichtige Diagnostik')}
                items={result.keyInvestigations}
                accent="border-sky-200 bg-sky-50/60 text-sky-950"
                expandable
              />
              <SectionCard
                icon={<ShieldAlert size={14} className="text-red-700" />}
                title={L('علامات الخطر', 'Red Flags', 'Warnzeichen')}
                items={result.redFlags}
                accent="border-red-200 bg-red-50/60 text-red-950"
              />
              <SectionCard
                icon={<HeartPulse size={14} className="text-rose-700" />}
                title={L('اعتبارات ما حول الجراحة', 'Perioperative Considerations', 'Perioperative Aspekte')}
                items={result.perioperativeConsiderations}
                accent="border-rose-200 bg-rose-50/60 text-rose-950"
                expandable
              />
            </div>

            {result.icd10Hints && result.icd10Hints.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-white/80 border border-slate-200 rounded-xl">
                <Tag size={13} className="text-slate-500 shrink-0" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                  {L('أكواد ICD-10 مقترحة:', 'Suggested ICD-10:')}
                </span>
                {result.icd10Hints.map((code, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onApplyIcd?.(code)}
                    title={L('اضغط لتطبيق الكود على الحالة', 'Click to apply this code to the case')}
                    className="font-mono font-bold text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-100 hover:text-teal-800 border border-slate-200 transition cursor-pointer"
                  >
                    {code}
                  </button>
                ))}
              </div>
            )}

            {result.pubmedSearchTerms && result.pubmedSearchTerms.length > 0 && (
              <div className="p-3 bg-white/80 border border-emerald-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <BookOpen size={13} className="text-emerald-700 shrink-0" />
                  <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide">
                    {L('استعرض أحدث الأدبيات من PubMed:', 'Browse the latest PubMed evidence:')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.pubmedSearchTerms.map((term, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => searchPubMed(term)}
                      className={`text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                        pubmedTerm === term
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <Quote size={9} className="inline mr-1 -mt-0.5" />
                      {term}
                    </button>
                  ))}
                </div>

                {pubmedLoading && (
                  <div className="flex items-center justify-center gap-2 py-3 text-emerald-700">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-[10px] font-semibold">
                      {L('جاري البحث في PubMed...', 'Searching PubMed...')}
                    </span>
                  </div>
                )}

                {!pubmedLoading && pubmedArticles.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {pubmedArticles.map((a) => (
                      <a
                        key={a.pmid}
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-2.5 rounded-lg bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-100 transition group"
                      >
                        <p className="text-[11px] font-semibold text-slate-800 leading-snug group-hover:text-emerald-900">
                          {a.title}
                          <ExternalLink size={10} className="inline mx-1 -mt-0.5 text-emerald-600" />
                        </p>
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          {a.authors} — <span className="italic">{a.source}</span> · {a.pubDate} · PMID: {a.pmid}
                        </p>
                      </a>
                    ))}
                  </div>
                )}

                {!pubmedLoading && pubmedTerm && pubmedArticles.length === 0 && (
                  <p className="text-[10px] text-slate-400 italic">
                    {L('لا توجد نتائج PubMed لهذا الاستعلام.', 'No PubMed results for this query.')}
                  </p>
                )}
              </div>
            )}

            <p className="text-[9px] text-slate-400 leading-relaxed text-center">
              {L(
                'إرشاد تعليمي عام يعتمد على الأدلة ولا يغني عن الحكم السريري للمشرف. لا تتم معالجة أي معرفات للمرضى.',
                'Generic evidence-based educational guidance — it does not replace the clinical judgement of the supervising consultant. No patient identifiers are processed.'
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
