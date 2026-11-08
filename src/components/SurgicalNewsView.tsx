import React, { useState, useEffect, useCallback } from 'react';
import {
  ExternalLink,
  Bookmark,
  Search,
  RefreshCw,
  Clock,
  BookOpen,
  Database,
  Layers,
  Sparkles,
  FileText,
  X,
  ChevronDown,
  CheckCircle2,
  Newspaper,
  Calendar,
  Globe2
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { SurgicalArticle } from '../types';

interface ExtendedArticle extends SurgicalArticle {
  pmid?: string;
  doi?: string;
  fullTextUrl?: string;
}

interface AbstractData {
  pmid: string;
  title: string;
  journal: string;
  abstractSections: { label?: string; text: string }[];
  fullAbstractText: string;
  meshTerms: string[];
}

export const SurgicalNewsView: React.FC = () => {
  const { toggleSaveArticle, isArticleSaved } = useData();
  const { language } = useAuth();
  const isRTL = language === 'ar';

  const [articles, setArticles] = useState<ExtendedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastSync, setLastSync] = useState('');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'journals' | 'pubmed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [page, setPage] = useState(1);
  const [totalAvailable, setTotalAvailable] = useState<number>(0);
  const [sourceTypeLabel, setSourceTypeLabel] = useState<string>('');

  // Abstract modal state
  const [activeAbstractPmid, setActiveAbstractPmid] = useState<string | null>(null);
  const [abstractData, setAbstractData] = useState<AbstractData | null>(null);
  const [loadingAbstract, setLoadingAbstract] = useState(false);

  // Fetch news articles from dynamic backend
  const fetchNews = useCallback(async (isFresh = false, nextPage = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else if (isFresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const url = `/api/news?source=${sourceFilter}&category=${encodeURIComponent(selectedCategory)}&page=${nextPage}&limit=12${isFresh ? '&refresh=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data.articles)) {
        if (append) {
          setArticles(prev => [...prev, ...data.articles]);
        } else {
          setArticles(data.articles);
        }
        setTotalAvailable(data.totalAvailable || data.articles.length);
        setSourceTypeLabel(data.sourceType || 'Live Surgical Literature');
        setPage(nextPage);
        setLastSync(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.warn('Failed to load server news feed:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [sourceFilter, selectedCategory]);

  // Initial fetch and auto-refresh every 5 minutes (user requested continuous dynamic updates)
  useEffect(() => {
    fetchNews(false, 1, false);
    const interval = setInterval(() => {
      fetchNews(true, 1, false);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  // Handle open abstract modal
  const handleOpenAbstract = async (article: ExtendedArticle) => {
    const pmid = article.pmid || (article.id.startsWith('pubmed-') ? article.id.replace('pubmed-', '') : null);
    if (!pmid) {
      // If no PMID, open external link directly
      window.open(article.url, '_blank');
      return;
    }

    setActiveAbstractPmid(pmid);
    setAbstractData(null);
    setLoadingAbstract(true);

    try {
      const res = await fetch(`/api/pubmed/abstract/${pmid}`);
      if (res.ok) {
        const data = await res.json();
        setAbstractData(data);
      } else {
        setAbstractData({
          pmid,
          title: article.title,
          journal: article.publisher,
          abstractSections: [{ text: article.summary }],
          fullAbstractText: article.summary,
          meshTerms: [],
        });
      }
    } catch {
      setAbstractData({
        pmid,
        title: article.title,
        journal: article.publisher,
        abstractSections: [{ text: article.summary }],
        fullAbstractText: article.summary,
        meshTerms: [],
      });
    } finally {
      setLoadingAbstract(false);
    }
  };

  const categories = [
    'All',
    'General Surgery',
    'Vascular Surgery',
    'Surgical Oncology',
    'Cardiothoracic Surgery',
    'Surgical Education',
    'Trauma & Emergency',
  ];

  const filtered = articles.filter(a => {
    const query = search.toLowerCase();
    const matchesSearch =
      a.title.toLowerCase().includes(query) ||
      a.publisher.toLowerCase().includes(query) ||
      a.summary.toLowerCase().includes(query) ||
      (a.pmid && a.pmid.includes(query));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Dynamic Surgical Hub Banner */}
      <div className="bg-[#101C32] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-teal-500/30 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 bg-teal-950/80 px-2.5 py-1 rounded-md border border-teal-500/40 flex items-center gap-1.5">
              <Database size={12} className="text-teal-400" />
              <span>{isRTL ? 'ربط مباشر مع PubMed والمجلات العالمية' : 'Live PubMed & Surgical Journals Sync'}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{isRTL ? 'تحديث تلقائي مستمر ومتجدد' : 'Continuous Auto-Updating Feed'}</span>
            </span>

            {lastSync && (
              <span className="text-[10px] text-slate-400 font-mono">
                {isRTL ? `آخر جلب للأبحاث: ${lastSync}` : `Synced: ${lastSync}`}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Newspaper size={24} className="text-teal-400" />
            <span>{isRTL ? 'الأبحاث والدراسات الجراحية العالمية المتجددة' : 'Live Surgical Literature & Research Stream'}</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
            {isRTL
              ? 'تتحدث هذه الواجهة تلقائياً وبشكل دوري لجلب دراسات وأبحاث جراحية متجددة من قاعدة بيانات PubMed وكبرى المجلات الجراحية العالمية (BJS, Annals of Surgery, EJVES, JAMA Surgery, JACS, Lancet). لا تبقى الدراسات ثابتة بل تتجدد باستمرار.'
              : 'This interface automatically refreshes and imports dynamic surgical trials from NCBI PubMed and authoritative surgical journals (BJS, Annals of Surgery, EJVES, JAMA Surgery, JACS). Studies continuously rotate and update.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={() => fetchNews(true, 1, false)}
            disabled={loading || refreshing}
            className="flex items-center gap-2 bg-[#0D9488] hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-teal-900/30 cursor-pointer disabled:opacity-50"
            title={isRTL ? 'جلب أبحاث ودراسات جديدة وتحديث الصفحة' : 'Fetch fresh new studies from PubMed and journals'}
          >
            <RefreshCw size={14} className={loading || refreshing ? 'animate-spin' : ''} />
            <span>{isRTL ? 'جلب دراسات جديدة الآن' : 'Fetch Fresh Studies'}</span>
          </button>
        </div>
      </div>

      {/* Source Selector Bar (All vs Top Journals vs PubMed Live) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full table-responsive-wrapper">
          <button
            onClick={() => setSourceFilter('all')}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              sourceFilter === 'all'
                ? 'bg-[#101C32] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={13} />
            <span>{isRTL ? 'كافة المصادر' : 'All Sources'}</span>
          </button>

          <button
            onClick={() => setSourceFilter('journals')}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              sourceFilter === 'journals'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen size={13} />
            <span>{isRTL ? 'المجلات الجراحية (Annals, BJS, EJVES)' : 'Top Surgical Journals'}</span>
          </button>

          <button
            onClick={() => setSourceFilter('pubmed')}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              sourceFilter === 'pubmed'
                ? 'bg-blue-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database size={13} />
            <span>{isRTL ? 'بث PubMed المباشر' : 'Live PubMed Stream'}</span>
          </button>
        </div>

        {sourceTypeLabel && (
          <span className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
            {sourceTypeLabel}
          </span>
        )}
      </div>

      {/* Search and Category Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={isRTL ? 'بحث سريع في العناوين، المجلات، المؤلفين أو الـ PMID...' : 'Filter titles, journals, authors, or PMID...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3.5 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer font-bold ${
                selectedCategory === cat
                  ? 'bg-[#101C32] text-white shadow-xs'
                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          <RefreshCw size={28} className="animate-spin mx-auto text-teal-600 mb-2" />
          <p className="font-bold text-slate-700">{isRTL ? 'جارٍ الاتصال بـ PubMed والمجلات الجراحية وجلب أحدث الدراسات...' : 'Connecting to PubMed & surgical journals to fetch latest peer-reviewed studies...'}</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(article => {
              const saved = isArticleSaved(article.id);
              const isPubMedLinked = Boolean(article.pmid || article.id.startsWith('pubmed-'));

              return (
                <div
                  key={article.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-teal-400 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Article Hero Image with Dynamic Overlay */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                      <img
                        src={article.imageUrl || 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80'}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                      {/* Top Chips */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-teal-500/40">
                            {article.category}
                          </span>

                          {article.pmid && (
                            <span className="text-[10px] font-mono font-bold text-teal-300 bg-slate-950/90 px-2 py-0.5 rounded-md border border-teal-500/30">
                              PMID: {article.pmid}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => toggleSaveArticle(article)}
                          className={`p-2 rounded-xl backdrop-blur-md transition cursor-pointer ${
                            saved
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-900/70 text-slate-200 hover:bg-slate-900 hover:text-white'
                          }`}
                          title={saved ? (isRTL ? 'إزالة من المحفظة' : 'Remove bookmark') : (isRTL ? 'حفظ في المحفظة الجراحية' : 'Bookmark article')}
                        >
                          <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      {/* Publisher & Impact on Image bottom */}
                      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-white text-xs">
                        <span className="font-semibold text-teal-300 truncate max-w-[220px]">
                          {article.publisher}
                        </span>
                        {article.journalImpact && (
                          <span className="text-[10px] font-mono bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-slate-200">
                            {article.journalImpact}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Article Body */}
                    <div className="p-5">
                      <h3 className="font-bold text-slate-900 text-base leading-snug mb-2 group-hover:text-teal-700 transition">
                        <a href={article.url} target="_blank" rel="noopener noreferrer">
                          {article.title}
                        </a>
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {article.summary}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer with Clickable Read Link & Quick Abstract */}
                  <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <Calendar size={13} className="text-slate-400" />
                      <span>{article.publishedDate}</span>
                      {article.readTime && <span>• {article.readTime}</span>}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Fast Abstract View Button */}
                      {isPubMedLinked && (
                        <button
                          onClick={() => handleOpenAbstract(article)}
                          className="inline-flex items-center gap-1 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 font-bold text-xs px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
                        >
                          <FileText size={12} />
                          <span>{isRTL ? 'الملخص' : 'Abstract'}</span>
                        </button>
                      )}

                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-[#101C32] hover:bg-[#0D9488] text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition cursor-pointer"
                      >
                        <span>{isRTL ? 'النص الكامل / المجلة' : 'Read Full Article'}</span>
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button to browse through more PubMed & Journal studies */}
          <div className="flex justify-center pt-2">
            <button
              onClick={() => fetchNews(false, page + 1, true)}
              disabled={loadingMore}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs px-6 py-3 rounded-2xl shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {loadingMore ? (
                <RefreshCw size={15} className="animate-spin text-teal-600" />
              ) : (
                <ChevronDown size={15} className="text-teal-600" />
              )}
              <span>{isRTL ? 'استعراض دراسات وأبحاث جراحية إضافية' : 'Load More Surgical Studies from PubMed & Journals'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500 text-xs space-y-2">
          <BookOpen size={32} className="mx-auto text-slate-400 mb-2" />
          <p className="font-semibold text-slate-800">
            {isRTL ? 'لا توجد دراسات تطابق معايير البحث الحالية.' : 'No surgical articles match your search or filter.'}
          </p>
          <button
            onClick={() => { setSearch(''); setSelectedCategory('All'); setSourceFilter('all'); fetchNews(true, 1, false); }}
            className="text-teal-700 font-bold underline cursor-pointer"
          >
            {isRTL ? 'إعادة ضبط المعايير وجلب الأبحاث' : 'Reset filters and fetch latest literature'}
          </button>
        </div>
      )}

      {/* Abstract Modal */}
      {activeAbstractPmid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md border border-teal-300">
                  PMID: {activeAbstractPmid}
                </span>
                <span className="text-xs text-slate-500 font-semibold truncate max-w-[300px]">
                  {abstractData?.journal || 'NCBI PubMed Article'}
                </span>
              </div>
              <button
                onClick={() => setActiveAbstractPmid(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {loadingAbstract ? (
                <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                  <RefreshCw size={24} className="animate-spin mx-auto text-teal-600 mb-2" />
                  <p>{isRTL ? 'جارٍ استرجاع ملخص البحث من PubMed...' : 'Fetching structured abstract from NCBI PubMed...'}</p>
                </div>
              ) : abstractData ? (
                <>
                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {abstractData.title}
                  </h3>

                  {abstractData.abstractSections.length > 0 ? (
                    <div className="space-y-3">
                      {abstractData.abstractSections.map((sec, idx) => (
                        <div key={idx} className="text-xs leading-relaxed">
                          {sec.label && (
                            <span className="font-bold text-teal-800 uppercase tracking-wide block mb-0.5">
                              {sec.label}:
                            </span>
                          )}
                          <p className="text-slate-700 whitespace-pre-line">{sec.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {abstractData.fullAbstractText || 'No structured abstract available.'}
                    </p>
                  )}

                  {abstractData.meshTerms && abstractData.meshTerms.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                        {isRTL ? 'الكلمات المفتاحية الطبية (MeSH Terms):' : 'Medical Subject Headings (MeSH):'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {abstractData.meshTerms.map((mesh, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200"
                          >
                            {mesh}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <a
                href={`https://pubmed.ncbi.nlm.nih.gov/${activeAbstractPmid}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-900 font-bold hover:underline"
              >
                <span>{isRTL ? 'فتح صفحة PubMed الرسمية' : 'View on Official PubMed'}</span>
                <ExternalLink size={13} />
              </a>

              <button
                onClick={() => setActiveAbstractPmid(null)}
                className="bg-[#101C32] hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
              >
                {isRTL ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
