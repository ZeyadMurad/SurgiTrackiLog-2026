import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ExternalLink,
  BookOpen,
  Bookmark,
  RefreshCw,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Filter,
  Calendar,
  Layers,
  ArrowUpDown,
  X,
  History,
  SlidersHorizontal
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { SurgicalArticle } from '../types';

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string;
  source: string;
  pubDate: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  pubTypes?: string[];
  url: string;
  fullTextUrl: string;
}

interface AbstractData {
  pmid: string;
  title: string;
  journal: string;
  abstractSections: { label?: string; text: string }[];
  fullAbstractText: string;
  meshTerms: string[];
}

const PRESET_TOPICS = [
  { label: 'Robotic Surgery', query: 'Robotic surgery randomized trial' },
  { label: 'Aortic Aneurysm & EVAR', query: 'Endovascular aortic aneurysm repair trial' },
  { label: 'Pancreaticoduodenectomy', query: 'Pancreaticoduodenectomy Whipple surgery outcome' },
  { label: 'Damage Control Laparotomy', query: 'Damage control laparotomy trauma surgery' },
  { label: 'Colorectal Anastomosis & ICG', query: 'Indocyanine green colorectal anastomosis fluorescence' },
  { label: 'Liver Resection & Hepatectomy', query: 'Laparoscopic liver resection hepatectomy trial' },
  { label: 'Femoro-Popliteal Bypass', query: 'Femoro-popliteal bypass chronic limb ischemia' },
  { label: 'Surgical Infection Prevention', query: 'Surgical site infection bundle randomized trial' },
  { label: 'Carotid Endarterectomy', query: 'Carotid endarterectomy trial carotid stenosis' },
  { label: 'Laparoscopic Cholecystectomy', query: 'Laparoscopic cholecystectomy technique' },
];

export const PubMedSearchEngineView: React.FC = () => {
  const { toggleSaveArticle, isArticleSaved } = useData();
  const { language } = useAuth();
  const isRTL = language === 'ar';

  const [query, setQuery] = useState('Surgical randomized controlled trial');
  const [searchInput, setSearchInput] = useState('Surgical randomized controlled trial');
  const [results, setResults] = useState<PubMedArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [activePreset, setActivePreset] = useState<string>('General');

  // Year range filtering (default: 'all' to search the entire archive of all years!)
  const [yearFilter, setYearFilter] = useState<'all' | '1yr' | '5yr' | '10yr' | 'classic' | 'historical' | 'custom'>('all');
  const [customYearStart, setCustomYearStart] = useState<string>('1980');
  const [customYearEnd, setCustomYearEnd] = useState<string>('2026');

  // Study type filtering
  const [pubType, setPubType] = useState<'all' | 'rct' | 'meta_analysis' | 'guideline' | 'review' | 'case_report'>('all');

  // Sort order (default: 'pub_date' newest date first, as explicitly requested by user)
  const [sortBy, setSortBy] = useState<'pub_date' | 'relevance'>('pub_date');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  // Advanced filters drawer toggle
  const [showFilters, setShowFilters] = useState(false);

  // Abstract modal state
  const [activeAbstractPmid, setActiveAbstractPmid] = useState<string | null>(null);
  const [abstractData, setAbstractData] = useState<AbstractData | null>(null);
  const [loadingAbstract, setLoadingAbstract] = useState(false);

  // Search execution
  const executeSearch = useCallback(async (
    searchTerm: string,
    targetPage = 1,
    currentYearFilter = yearFilter,
    currentPubType = pubType,
    currentSort = sortBy,
    startYear = customYearStart,
    endYear = customYearEnd
  ) => {
    if (!searchTerm.trim()) return;
    setLoading(true);

    try {
      let yStart = '';
      let yEnd = '';

      if (currentYearFilter === '1yr') {
        yStart = '2025';
        yEnd = '2026';
      } else if (currentYearFilter === '5yr') {
        yStart = '2021';
        yEnd = '2026';
      } else if (currentYearFilter === '10yr') {
        yStart = '2016';
        yEnd = '2026';
      } else if (currentYearFilter === 'classic') {
        yStart = '2000';
        yEnd = '2015';
      } else if (currentYearFilter === 'historical') {
        yStart = '1900';
        yEnd = '1999';
      } else if (currentYearFilter === 'custom') {
        yStart = startYear;
        yEnd = endYear;
      }
      // 'all' leaves yStart empty, so backend searches ALL years without limitation!

      const params = new URLSearchParams({
        term: searchTerm.trim(),
        page: String(targetPage),
        max: String(pageSize),
        sort: currentSort,
        pubType: currentPubType,
      });

      if (yStart) params.append('yearStart', yStart);
      if (yEnd) params.append('yearEnd', yEnd);

      const res = await fetch(`/api/pubmed/search?${params.toString()}`);
      const data = await res.json();

      if (Array.isArray(data.results)) {
        setResults(data.results);
        setTotalCount(data.totalCount ?? data.results.length);
        setTotalPages(data.totalPages ?? Math.ceil((data.totalCount || data.results.length) / pageSize));
        setPage(targetPage);
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('Error fetching PubMed results:', err);
    } finally {
      setLoading(false);
    }
  }, [yearFilter, pubType, sortBy, customYearStart, customYearEnd, pageSize]);

  // Initial fetch and 15-minute auto-refresh cycle
  useEffect(() => {
    executeSearch(query, 1);
    const interval = setInterval(() => {
      executeSearch(query, page);
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setQuery(searchInput.trim());
      setPage(1);
      executeSearch(searchInput.trim(), 1);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_TOPICS[0]) => {
    setActivePreset(preset.label);
    setSearchInput(preset.query);
    setQuery(preset.query);
    setPage(1);
    executeSearch(preset.query, 1);
  };

  const handleYearFilterChange = (filter: typeof yearFilter) => {
    setYearFilter(filter);
    setPage(1);
    executeSearch(query, 1, filter, pubType, sortBy);
  };

  const handlePubTypeChange = (type: typeof pubType) => {
    setPubType(type);
    setPage(1);
    executeSearch(query, 1, yearFilter, type, sortBy);
  };

  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort);
    setPage(1);
    executeSearch(query, 1, yearFilter, pubType, newSort);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    executeSearch(query, newPage);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Convert PubMed article to portfolio SurgicalArticle bookmark
  const handleBookmarkPubMed = (item: PubMedArticle) => {
    const article: SurgicalArticle = {
      id: `pubmed-${item.pmid}`,
      title: item.title,
      publisher: item.source,
      category: 'PubMed Indexed Trial',
      publishedDate: item.pubDate || new Date().toISOString().substring(0, 10),
      summary: `PMID: ${item.pmid} | Authors: ${item.authors}. Published in ${item.source}.`,
      url: item.url,
      sourceType: 'Peer-Reviewed Journal',
      journalImpact: 'PubMed Indexed',
      readTime: 'Full Paper',
    };
    toggleSaveArticle(article);
  };

  // Handle open abstract modal
  const handleOpenAbstract = async (pmid: string, defaultTitle: string, defaultSource: string) => {
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
          title: defaultTitle,
          journal: defaultSource,
          abstractSections: [{ text: 'Abstract not available directly. Please view on official PubMed.' }],
          fullAbstractText: '',
          meshTerms: [],
        });
      }
    } catch {
      setAbstractData({
        pmid,
        title: defaultTitle,
        journal: defaultSource,
        abstractSections: [{ text: 'Abstract could not be retrieved at this time.' }],
        fullAbstractText: '',
        meshTerms: [],
      });
    } finally {
      setLoadingAbstract(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-[#101C32] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-teal-500/30 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 bg-teal-950/80 px-2.5 py-1 rounded-md border border-teal-500/40 flex items-center gap-1.5">
              <Database size={12} className="text-teal-400" />
              <span>NCBI PubMed Official Full Archive</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{isRTL ? 'تغطية شاملة لكافة الأعوام والأنواع' : 'All Years & Study Types Covered'}</span>
            </span>
            {lastSyncTime && (
              <span className="text-[10px] text-slate-400 font-mono">
                {isRTL ? `آخر فحص: ${lastSyncTime}` : `Last query: ${lastSyncTime}`}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen size={24} className="text-teal-400" />
            <span>{isRTL ? 'محرك أبحاث ودراسات PubMed الجراحية الشامل' : 'Comprehensive PubMed Surgical Evidence Engine'}</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
            {isRTL
              ? 'بحث مباشر وشامل في ملايين الأبحاث المسجلة في المكتبة الوطنية الأمريكية للطب (NCBI PubMed) بكافة أنواعها (تجارب عشوائية، مراجعات منهجية، إرشادات سريرية) وعبر جميع سنوات النشر من أقدم الدراسات التأسيسية حتى أحدث إصدارات اليوم، مرتبة حسب الأحدث تاريخاً.'
              : 'Direct archival search across millions of peer-reviewed biomedical publications from NCBI PubMed across all publication years (historical, classic, and recent), ordered by newest date with full pagination.'}
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={() => executeSearch(query, page)}
            disabled={loading}
            className="flex items-center gap-2 bg-[#0D9488] hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-teal-900/30 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{isRTL ? 'تحديث النتائج' : 'Refresh Search'}</span>
          </button>
        </div>
      </div>

      {/* Main Search Bar & Quick Preset Tags */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={isRTL ? 'ابحث في ملايين أبحاث PubMed عن أي موضوع جراحي (مثال: Aortic aneurysm, Whipple procedure, Hernia mesh)...' : 'Search millions of PubMed records by surgical topic, procedure, or drug...'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                showFilters || yearFilter !== 'all' || pubType !== 'all'
                  ? 'bg-teal-50 text-teal-900 border-teal-300'
                  : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
              }`}
              title={isRTL ? 'خيارات وتصفية السنوات وأنواع الدراسات' : 'Filter by years and study types'}
            >
              <SlidersHorizontal size={14} />
              <span>{isRTL ? 'التصفية والسنوات' : 'Filter & Years'}</span>
              {(yearFilter !== 'all' || pubType !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-teal-600" />
              )}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-none bg-[#101C32] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
              <span>{isRTL ? 'بحث في PubMed' : 'Search PubMed'}</span>
            </button>
          </div>
        </form>

        {/* Suggestion Topics Bar */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase shrink-0 flex items-center gap-1">
            <Sparkles size={12} className="text-teal-600" />
            <span>{isRTL ? 'مواضيع مقترحة:' : 'Popular Topics:'}</span>
          </span>
          {PRESET_TOPICS.map((topic) => {
            const isSelected = activePreset === topic.label;
            return (
              <button
                key={topic.label}
                type="button"
                onClick={() => handleSelectPreset(topic)}
                className={`text-[11px] px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer font-semibold ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-800 border border-slate-200'
                }`}
              >
                {topic.label}
              </button>
            );
          })}
        </div>

        {/* Advanced Filters Panel (Year Range, Study Types, Sorting) */}
        {showFilters && (
          <div className="pt-4 border-t border-slate-200 mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200 animate-fadeIn">
            {/* 1. Publication Year Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar size={13} className="text-teal-600" />
                <span>{isRTL ? 'تاريخ النشر (سنة الصدور):' : 'Publication Year Range:'}</span>
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleYearFilterChange('all')}
                  className={`text-[11px] py-1.5 px-2 rounded-lg font-bold border transition text-center cursor-pointer ${
                    yearFilter === 'all'
                      ? 'bg-[#101C32] text-white border-transparent'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isRTL ? 'كافة الأعوام (كامل الأرشيف)' : 'All Years (Full Archive)'}
                </button>

                <button
                  type="button"
                  onClick={() => handleYearFilterChange('1yr')}
                  className={`text-[11px] py-1.5 px-2 rounded-lg font-bold border transition text-center cursor-pointer ${
                    yearFilter === '1yr'
                      ? 'bg-[#101C32] text-white border-transparent'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isRTL ? 'آخر سنة (2025-2026)' : 'Last 1 Year (2025-26)'}
                </button>

                <button
                  type="button"
                  onClick={() => handleYearFilterChange('5yr')}
                  className={`text-[11px] py-1.5 px-2 rounded-lg font-bold border transition text-center cursor-pointer ${
                    yearFilter === '5yr'
                      ? 'bg-[#101C32] text-white border-transparent'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isRTL ? 'آخر 5 سنوات (2021-2026)' : 'Last 5 Years (2021-26)'}
                </button>

                <button
                  type="button"
                  onClick={() => handleYearFilterChange('10yr')}
                  className={`text-[11px] py-1.5 px-2 rounded-lg font-bold border transition text-center cursor-pointer ${
                    yearFilter === '10yr'
                      ? 'bg-[#101C32] text-white border-transparent'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isRTL ? 'آخر 10 سنوات (2016-2026)' : 'Last 10 Years (2016-26)'}
                </button>

                <button
                  type="button"
                  onClick={() => handleYearFilterChange('classic')}
                  className={`text-[11px] py-1.5 px-2 rounded-lg font-bold border transition text-center cursor-pointer ${
                    yearFilter === 'classic'
                      ? 'bg-[#101C32] text-white border-transparent'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isRTL ? 'الفترة الكلاسيكية (2000-2015)' : 'Classic Era (2000-2015)'}
                </button>

                <button
                  type="button"
                  onClick={() => handleYearFilterChange('historical')}
                  className={`text-[11px] py-1.5 px-2 rounded-lg font-bold border transition text-center cursor-pointer ${
                    yearFilter === 'historical'
                      ? 'bg-[#101C32] text-white border-transparent'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isRTL ? 'تأسيسية وتاريخية (قبل 2000)' : 'Historical (Pre-2000)'}
                </button>
              </div>

              {/* Custom Range Input */}
              <div className="pt-2 flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 font-bold">{isRTL ? 'مجال مخصص:' : 'Custom:'}</span>
                <input
                  type="number"
                  min="1900"
                  max="2026"
                  placeholder="From"
                  value={customYearStart}
                  onChange={(e) => setCustomYearStart(e.target.value)}
                  className="w-16 bg-white border border-slate-300 rounded-md px-1.5 py-1 text-[11px] text-center"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="number"
                  min="1900"
                  max="2026"
                  placeholder="To"
                  value={customYearEnd}
                  onChange={(e) => setCustomYearEnd(e.target.value)}
                  className="w-16 bg-white border border-slate-300 rounded-md px-1.5 py-1 text-[11px] text-center"
                />
                <button
                  type="button"
                  onClick={() => handleYearFilterChange('custom')}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-bold px-2 py-1 rounded-md transition cursor-pointer"
                >
                  {isRTL ? 'تطبيق' : 'Apply'}
                </button>
              </div>
            </div>

            {/* 2. Study Type Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers size={13} className="text-teal-600" />
                <span>{isRTL ? 'نوع وشكل الدراسة:' : 'Study Design & Type:'}</span>
              </label>

              <div className="flex flex-col gap-1">
                {[
                  { id: 'all', label: isRTL ? 'كافة أنواع الدراسات' : 'All Study Types' },
                  { id: 'rct', label: isRTL ? 'تجارب سريرية عشوائية (RCT)' : 'Randomized Controlled Trial (RCT)' },
                  { id: 'meta_analysis', label: isRTL ? 'مراجعات منهجية وتحليلات تلوية' : 'Systematic Review & Meta-Analysis' },
                  { id: 'guideline', label: isRTL ? 'إرشادات وتوجيهات سريرية (Guidelines)' : 'Clinical Practice Guidelines' },
                  { id: 'review', label: isRTL ? 'مراجعات جراحية شاملة (Reviews)' : 'Comprehensive Reviews' },
                  { id: 'case_report', label: isRTL ? 'تقارير حالات سريرية نادرة' : 'Case Reports' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handlePubTypeChange(type.id as typeof pubType)}
                    className={`text-[11px] py-1 px-2.5 rounded-lg font-medium text-left transition cursor-pointer flex items-center justify-between ${
                      pubType === type.id
                        ? 'bg-teal-800 text-white font-bold'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{type.label}</span>
                    {pubType === type.id && <CheckCircle2 size={12} className="text-teal-300" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Sorting & Order */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ArrowUpDown size={13} className="text-teal-600" />
                <span>{isRTL ? 'ترتيب النتائج:' : 'Sort Order:'}</span>
              </label>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleSortChange('pub_date')}
                  className={`text-[11px] p-2.5 rounded-xl border transition text-left cursor-pointer flex items-center justify-between ${
                    sortBy === 'pub_date'
                      ? 'bg-teal-50 text-teal-900 border-teal-400 font-bold shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <span className="block font-bold">{isRTL ? 'الأحدث تاريخاً أولاً (حسب التاريخ)' : 'Date: Newest First (Default)'}</span>
                    <span className="text-[10px] text-slate-500 font-normal">{isRTL ? 'يعرض الأبحاث الحديثة نزولاً للأقدم' : 'Chronological from newest published to oldest'}</span>
                  </div>
                  {sortBy === 'pub_date' && <CheckCircle2 size={14} className="text-teal-700" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSortChange('relevance')}
                  className={`text-[11px] p-2.5 rounded-xl border transition text-left cursor-pointer flex items-center justify-between ${
                    sortBy === 'relevance'
                      ? 'bg-teal-50 text-teal-900 border-teal-400 font-bold shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <span className="block font-bold">{isRTL ? 'الأعلى صلة ومطابقة (Best Match)' : 'Best Match / Relevance'}</span>
                    <span className="text-[10px] text-slate-500 font-normal">{isRTL ? 'يعتمد على تطابق الكلمات المفتاحية' : 'Ranked by NCBI keyword relevance scoring'}</span>
                  </div>
                  {sortBy === 'relevance' && <CheckCircle2 size={14} className="text-teal-700" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Header with Statistics */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-slate-500">{isRTL ? 'نتائج البحث عن:' : 'Showing PubMed records for:'} </span>
          <strong className="text-slate-900 font-bold">"{query}"</strong>
          {yearFilter !== 'all' && (
            <span className="mx-2 px-2 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200 text-[11px] font-mono">
              {yearFilter === 'custom' ? `${customYearStart}-${customYearEnd}` : yearFilter}
            </span>
          )}
          {pubType !== 'all' && (
            <span className="mx-1 px-2 py-0.5 bg-blue-50 text-blue-800 rounded border border-blue-200 text-[11px]">
              {pubType}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg font-bold">
            {totalCount.toLocaleString()} {isRTL ? 'دراسة متوفرة على PubMed' : 'total peer-reviewed papers'}
          </span>
          {totalPages > 1 && (
            <span className="text-slate-400 font-mono text-[11px]">
              ({isRTL ? `الصفحة ${page} من ${totalPages.toLocaleString()}` : `Page ${page} of ${totalPages.toLocaleString()}`})
            </span>
          )}
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <RefreshCw size={28} className="animate-spin mx-auto text-teal-600 mb-2" />
          <p className="font-bold text-slate-700">{isRTL ? 'جارٍ الاتصال بمكتبة PubMed واسترجاع الدراسات الموثقة...' : 'Connecting to NCBI PubMed database and querying records across the archive...'}</p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((paper) => {
              const saved = isArticleSaved(`pubmed-${paper.pmid}`);

              return (
                <div
                  key={paper.pmid}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-400 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: PMID, PubTypes, and Bookmark */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] font-bold bg-teal-50 text-teal-900 border border-teal-200 px-2 py-0.5 rounded-md">
                          PMID: {paper.pmid}
                        </span>

                        {paper.pubTypes && paper.pubTypes.slice(0, 2).map((pt, i) => (
                          <span
                            key={i}
                            className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[150px]"
                          >
                            {pt}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => handleBookmarkPubMed(paper)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          saved
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                        title={saved ? (isRTL ? 'محفوظ في المحفظة' : 'Saved in Portfolio') : (isRTL ? 'حفظ في المحفظة' : 'Bookmark to Portfolio')}
                      >
                        <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    {/* Paper Title */}
                    <h3 className="font-bold text-slate-900 text-sm leading-snug hover:text-teal-800 transition">
                      <a href={paper.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {paper.title}
                      </a>
                    </h3>

                    {/* Authors */}
                    <div className="mt-2 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">{paper.authors}</span>
                    </div>

                    {/* Journal Source & Publication Date (Showing exact year) */}
                    <div className="mt-1.5 text-xs text-teal-800 font-medium flex items-center gap-2 flex-wrap">
                      <span className="font-bold">{paper.source}</span>
                      {paper.pubDate && (
                        <span className="bg-slate-100 text-slate-700 font-mono text-[11px] px-2 py-0.5 rounded border border-slate-200">
                          {paper.pubDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {paper.doi ? (
                      <span className="font-mono text-[11px] text-slate-500 truncate max-w-[160px]" title={paper.doi}>
                        doi: {paper.doi}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">NCBI Indexed</span>
                    )}

                    <div className="flex items-center gap-2">
                      {/* Fast Abstract Button */}
                      <button
                        onClick={() => handleOpenAbstract(paper.pmid, paper.title, paper.source)}
                        className="flex items-center gap-1 text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer"
                        title={isRTL ? 'قراءة ملخص البحث' : 'View study abstract'}
                      >
                        <FileText size={12} />
                        <span>{isRTL ? 'الملخص' : 'Abstract'}</span>
                      </button>

                      {/* Official PubMed Link */}
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#101C32] hover:text-teal-900 font-bold text-xs hover:underline cursor-pointer"
                      >
                        <span>PubMed</span>
                        <ExternalLink size={12} />
                      </a>

                      {/* Full Text / Publisher Link */}
                      {paper.fullTextUrl && paper.fullTextUrl !== paper.url && (
                        <a
                          href={paper.fullTextUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-700 hover:text-blue-900 font-bold text-xs hover:underline cursor-pointer"
                        >
                          <span>Full Text</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Navigation Bar */}
          {totalPages > 1 && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>{isRTL ? 'الصفحة السابقة' : 'Previous'}</span>
                </button>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                >
                  <span>{isRTL ? 'الصفحة التالية' : 'Next'}</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Page Number Quick Buttons */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-full">
                {[1, 2, 3, 4, 5].filter(p => p <= totalPages).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                      page === p
                        ? 'bg-[#101C32] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                {totalPages > 5 && (
                  <>
                    <span className="text-slate-400 px-1">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className={`px-2.5 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                        page === totalPages
                          ? 'bg-[#101C32] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {totalPages.toLocaleString()}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-xs text-slate-500 space-y-2">
          <BookOpen size={32} className="mx-auto text-slate-400 mb-2" />
          <p className="font-semibold text-slate-800">
            {isRTL ? 'لم يتم العثور على أبحاث تطابق معايير البحث الحالية.' : 'No papers found matching the current search query.'}
          </p>
          <p className="text-slate-500">
            {isRTL ? 'جرّب توسيع نطاق السنوات لاختيار "كافة الأعوام"، أو اختر أحد المواضيع الجراحية المقترحة بالأعلى.' : 'Try selecting "All Years" or one of the suggested surgical topics above.'}
          </p>
        </div>
      )}

      {/* Structured Abstract Modal */}
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
                  {abstractData?.journal || 'NCBI PubMed Publication'}
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
                  <p>{isRTL ? 'جارٍ استرجاع الملخص المنظم من خوادم PubMed...' : 'Fetching structured abstract XML from NCBI PubMed...'}</p>
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
                      {abstractData.fullAbstractText || 'No abstract text available for this record.'}
                    </p>
                  )}

                  {abstractData.meshTerms && abstractData.meshTerms.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                        {isRTL ? 'الكلمات المفتاحية والمصطلحات الطبية (MeSH Terms):' : 'Medical Subject Headings (MeSH):'}
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
                <span>{isRTL ? 'عرض الدراسة على موقع PubMed الأصلي' : 'View on Official PubMed'}</span>
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
