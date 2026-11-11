import React, { useState } from 'react';
import {
  Search,
  Loader2,
  ExternalLink,
  BookmarkPlus,
  BookmarkCheck,
  FileText,
  Sparkles,
  Database,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  X,
  Quote,
  Unlock,
  FlaskConical,
  LibraryBig,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { translations } from '../lib/i18n';

/**
 * MULTI-SOURCE MEDICAL RESEARCH ENGINE
 * Europe PMC (42M+ biomedical records incl. full text & preprints)
 * Crossref (160M+ records from every scholarly publisher)
 * Cochrane Library (gold-standard systematic reviews)
 * Complements the dedicated PubMed view.
 */

type Source = 'europmc' | 'crossref' | 'cochrane';
type SortMode = 'relevance' | 'newest' | 'citations';

interface UnifiedArticle {
  id: string;
  title: string;
  authors: string;
  journal: string;
  pubDate: string;
  doi: string | null;
  url: string;
  fullTextUrl: string;
  citations: number;
  openAccess: boolean;
  pubTypes: string[];
  pmid?: string;
  pmcid?: string;
}

const SOURCES: { id: Source; name: string; sub: string; icon: React.ReactNode; color: string }[] = [
  {
    id: 'europmc',
    name: 'Europe PMC',
    sub: '42M+ biomedical records · full text · preprints',
    icon: <Database size={15} />,
    color: 'from-emerald-600 to-teal-600',
  },
  {
    id: 'crossref',
    name: 'Crossref',
    sub: '160M+ records · every scholarly publisher',
    icon: <LibraryBig size={15} />,
    color: 'from-indigo-600 to-blue-600',
  },
  {
    id: 'cochrane',
    name: 'Cochrane Library',
    sub: 'Gold-standard systematic reviews',
    icon: <FlaskConical size={15} />,
    color: 'from-rose-600 to-red-600',
  },
];

export const MedicalJournalsView: React.FC = () => {
  const { savedArticles, toggleSaveArticle } = useData();
  const { language } = useAuth();
  const t = translations[language] || translations.en;
  const isRTL = language === 'ar';

  const L = (ar: string, en: string, de?: string) => (isRTL ? ar : language === 'de' ? (de || en) : en);

  const [source, setSource] = useState<Source>('europmc');
  const [term, setTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortMode>('relevance');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<UnifiedArticle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [lastQuery, setLastQuery] = useState('');
  const [abstractFor, setAbstractFor] = useState<string | null>(null);
  const [abstractData, setAbstractData] = useState<any>(null);
  const [abstractLoading, setAbstractLoading] = useState(false);

  const search = async (pageNum = 1) => {
    if (!term.trim()) {
      setError(L('يرجى إدخال مصطلح البحث أولاً.', 'Please enter a search term first.'));
      return;
    }
    setLoading(true);
    setError('');
    setAbstractFor(null);
    try {
      const res = await fetch(
        `/api/journals/search?source=${source}&term=${encodeURIComponent(term.trim())}&page=${pageNum}&sort=${sortBy}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed.');
      setResults(data.results || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 0);
      setPage(data.page || 1);
      setLastQuery(term.trim());
    } catch (err: any) {
      setError(err.message || 'Search unavailable right now.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAbstract = async (id: string) => {
    if (abstractFor === id) {
      setAbstractFor(null);
      return;
    }
    setAbstractFor(id);
    setAbstractData(null);
    setAbstractLoading(true);
    try {
      const res = await fetch(`/api/journals/abstract?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      setAbstractData(res.ok ? data : { abstract: null });
    } catch {
      setAbstractData({ abstract: null });
    } finally {
      setAbstractLoading(false);
    }
  };

  const isSaved = (id: string) => savedArticles.some(a => a.id === id);

  const saveArticle = (a: UnifiedArticle) => {
    toggleSaveArticle({
      id: a.id,
      title: a.title,
      publisher: a.journal,
      category: 'Research Article',
      publishedDate: a.pubDate,
      summary: a.authors,
      url: a.url,
      sourceType: source === 'europmc' ? 'Europe PMC' : source === 'crossref' ? 'Crossref' : 'Cochrane Library',
    });
  };

  return (
    <div className={`max-w-7xl mx-auto p-4 sm:p-6 space-y-5 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#101C32] via-[#1e3a5f] to-[#0D9488] rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <BookMarked size={26} className="text-teal-300" />
          </div>
          <div className="flex-1 min-w-[240px]">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {L('محرك الأبحاث الطبية المتعدد المصادر', 'Multi-Source Medical Research Engine')}
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 mt-1 leading-relaxed">
              {L(
                'استيراد الأبحاث والمقالات الجراحية من Europe PMC و Crossref و Cochrane — مع PubMed في واجهة مستقلة',
                'Import surgical research and articles from Europe PMC, Crossref and Cochrane — alongside the dedicated PubMed view'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Source tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SOURCES.map(s => (
          <button
            key={s.id}
            onClick={() => { setSource(s.id); setResults([]); setError(''); }}
            className={`text-left rounded-2xl border p-3.5 transition cursor-pointer ${
              source === s.id
                ? 'border-transparent text-white shadow-md bg-gradient-to-r ' + s.color
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${source === s.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold truncate">{s.name}</div>
                <div className={`text-[10px] truncate ${source === s.id ? 'text-white/80' : 'text-slate-500'}`}>{s.sub}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); search(1); }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={L(
                'ابحث: laparoscopic cholecystectomy, aortic aneurysm, ERAS protocol…',
                'Search: laparoscopic cholecystectomy, aortic aneurysm, ERAS protocol…'
              )}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortMode)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold cursor-pointer"
          >
            <option value="relevance">{L('الأكثر صلة', 'Relevance')}</option>
            <option value="newest">{L('الأحدث أولاً', 'Newest first')}</option>
            <option value="citations">{L('الأكثر استشهاداً', 'Most cited')}</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#0D9488] hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {loading ? L('جاري البحث...', 'Searching...') : L('بحث', 'Search')}
          </button>
        </form>

        {error && (
          <p className="mt-3 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-center gap-2">
            <X size={13} /> {error}
          </p>
        )}

        {!loading && !error && lastQuery && (
          <p className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Sparkles size={12} className="text-teal-600" />
            {L(
              `${totalCount.toLocaleString()} نتيجة لـ "${lastQuery}" — ${SOURCES.find(s => s.id === source)?.name}`,
              `${totalCount.toLocaleString()} results for "${lastQuery}" — ${SOURCES.find(s => s.id === source)?.name}`
            )}
          </p>
        )}
      </div>

      {/* Results */}
      <div className="space-y-3">
        {results.map(a => (
          <div key={a.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:border-teal-300 hover:shadow transition">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-[13px] font-bold text-slate-900 hover:text-teal-700 leading-snug"
                >
                  {a.title}
                  <ExternalLink size={10} className="inline mx-1 -mt-0.5 text-teal-500" />
                </a>
                <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                  {a.authors}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-semibold italic text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 truncate max-w-[240px]">
                    {a.journal}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{a.pubDate}</span>
                  {a.citations > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <Quote size={9} /> {a.citations} {L('استشهاد', 'citations')}
                    </span>
                  )}
                  {a.openAccess && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <Unlock size={9} /> Open Access
                    </span>
                  )}
                  {a.pmid && (
                    <span className="text-[10px] font-mono text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                      PMID: {a.pmid}
                    </span>
                  )}
                  {a.pubTypes.slice(0, 2).map((pt, i) => (
                    <span key={i} className="text-[9px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                      {pt}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => saveArticle(a)}
                  title={isSaved(a.id) ? L('إزالة من المحفوظات', 'Remove from saved') : L('حفظ المقال', 'Save article')}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    isSaved(a.id)
                      ? 'bg-teal-50 border-teal-300 text-teal-700'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-teal-600 hover:border-teal-300'
                  }`}
                >
                  {isSaved(a.id) ? <BookmarkCheck size={14} /> : <BookmarkPlus size={14} />}
                </button>
                {a.doi && (
                  <a
                    href={a.fullTextUrl || `https://doi.org/${a.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="DOI Full Text"
                    className="p-2 rounded-xl border bg-slate-50 border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition"
                  >
                    <FileText size={14} />
                  </a>
                )}
              </div>
            </div>

            {/* Abstract (Europe PMC) */}
            {source === 'europmc' && (
              <div className="mt-3 border-t border-slate-100 pt-2.5">
                <button
                  onClick={() => loadAbstract(a.id)}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
                >
                  <Quote size={11} />
                  {abstractFor === a.id
                    ? L('إخفاء الملخص', 'Hide abstract')
                    : L('عرض الملخص والمصطلحات (MeSH)', 'View abstract & MeSH terms')}
                </button>

                {abstractFor === a.id && (
                  <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    {abstractLoading ? (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Loader2 size={12} className="animate-spin" /> {L('جاري تحميل الملخص...', 'Loading abstract...')}
                      </div>
                    ) : abstractData?.abstract ? (
                      <div className="space-y-2">
                        <p className="text-[11px] text-slate-700 leading-relaxed" dir="ltr">
                          {String(abstractData.abstract).replace(/<[^>]+>/g, '')}
                        </p>
                        {abstractData.meshTerms?.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {abstractData.meshTerms.slice(0, 10).map((m: string, i: number) => (
                              <span key={i} className="text-[9px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full">
                                {m}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">
                        {L('لا يتوفر ملخص مجاني لهذا المقال — افتح الرابط الكامل عبر الناشر.', 'No free abstract available for this article — open the full text via the publisher link.')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && results.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Loader2 size={26} className="animate-spin text-teal-600 mx-auto" />
            <p className="text-xs text-slate-500 mt-3 font-medium">
              {L('جاري الاستعلام من قواعد البيانات الطبية...', 'Querying the medical databases...')}
            </p>
          </div>
        )}

        {!loading && !error && lastQuery && results.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Search size={26} className="text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 mt-3 font-medium">
              {L('لا توجد نتائج مطابقة — جرّب مصطلحات أبسط أو مصدراً آخر.', 'No matching results — try simpler terms or another source.')}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2" dir="ltr">
          <button
            onClick={() => search(page - 1)}
            disabled={page <= 1}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => search(page + 1)}
            disabled={page >= totalPages}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
};
