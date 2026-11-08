/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderPlus,
  UserCheck,
  Clock,
  Award,
  Sparkles,
  FileCheck2,
  Newspaper,
  HardDrive,
  User,
  ShieldAlert,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Menu,
  X,
  Wifi,
  WifiOff,
  RefreshCw,
  Plus,
  AlertTriangle,
  BookOpen,
  Bell,
  Send,
  MessageSquare,
  CheckCircle2,
  Users,
  Download,
  LogOut,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { SurgiTrackLogo } from './components/SurgiTrackLogo';
import { AuthView } from './components/AuthView';
import { AiAssistantModal } from './components/AiAssistantModal';
import { TrainingCharts } from './components/TrainingCharts';
import { ClinicalCasesView } from './components/ClinicalCasesView';
import { SupervisorView } from './components/SupervisorView';
import { TrainingSessionsView } from './components/TrainingSessionsView';
import { SkillsMatrixView } from './components/SkillsMatrixView';
import { RecommendationGenerator } from './components/RecommendationGenerator';
import { GermanPortfolioView } from './components/GermanPortfolioView';
import { SurgicalNewsView } from './components/SurgicalNewsView';
import { PubMedSearchEngineView } from './components/PubMedSearchEngineView';
import { BackupRestoreView } from './components/BackupRestoreView';
import { UserProfileView } from './components/UserProfileView';
import { AdminPanelView } from './components/AdminPanelView';
import { AddCaseModal } from './components/AddCaseModal';
import { SurgicalCommunityView } from './components/SurgicalCommunityView';
import { TraineePortfolioExportModal } from './components/TraineePortfolioExportModal';
import { YourPostsModal } from './components/YourPostsModal';
import { translations } from './lib/i18n';

type ActiveView =
  | 'news'
  | 'community'
  | 'pubmed'
  | 'dashboard'
  | 'cases'
  | 'supervisors'
  | 'sessions'
  | 'skills'
  | 'recommendations'
  | 'german'
  | 'backup'
  | 'profile'
  | 'admin';

const SUPER_ADMIN_EMAIL = 'zeadmorud2030@gmail.com';

function SurgiTrackApp() {
  const {
    user,
    profile,
    loading,
    language,
    setLanguage,
    logout,
    deleteCurrentAccount,
    accountDeletedByAdmin,
    dismissDeletedAccountModal,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    replyToNotification,
  } = useAuth();
  const { stats, syncStatus, cases, trainingRecords, supervisors, addCase, communityCases } = useData();

  // DEFAULT VIEW: Surgical Literature & News (as requested by user)
  const [activeView, setActiveView] = useState<ActiveView>('news');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [showQuickCaseModal, setShowQuickCaseModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showYourPostsModal, setShowYourPostsModal] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Notifications Modal State & Reply State
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [replyingToNotifId, setReplyingToNotifId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replySuccessMessage, setReplySuccessMessage] = useState('');
  const [replyErrorMessage, setReplyErrorMessage] = useState('');

  const t = translations[language] || translations.en;
  const isRTL = language === 'ar';
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL || profile?.role === 'super_admin';

  // 1. CRITICAL: Real-Time Admin Deletion Lockout Screen
  if (accountDeletedByAdmin) {
    return (
      <div className="min-h-screen bg-[#070D1A] flex items-center justify-center p-4 text-white z-50">
        <div className="bg-[#101C32] border-2 border-red-500/70 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert size={36} />
          </div>
          <h2 className="text-xl font-bold text-white">
            {isRTL ? 'لقد تم حذف حسابك من إدارة الموقع' : 'Account Deleted by Administration'}
          </h2>
          <p className="text-xs text-red-200 leading-relaxed bg-red-950/40 p-4 rounded-2xl border border-red-500/30">
            {isRTL
              ? 'تم حذف حسابك وإنهاء جلستك وإغلاق التطبيق فورياً بقرار من إدارة المنصة. لم يعد بإمكانك الوصول إلى هذه المحفظة.'
              : 'Your account has been deleted and your active session has been immediately terminated by the site administration.'}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            {isRTL ? 'إدارة المنصة: zeadmorud2030@gmail.com' : 'Administrator: zeadmorud2030@gmail.com'}
          </p>
          <button
            onClick={() => dismissDeletedAccountModal()}
            className="w-full bg-red-700 hover:bg-red-800 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer shadow-lg shadow-red-900/30"
          >
            {isRTL ? 'العودة إلى شاشة الدخول' : 'Return to Login Screen'}
          </button>
        </div>
      </div>
    );
  }

  // If still checking auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-[#101C32] flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 rounded-3xl overflow-hidden shadow-2xl border border-teal-500/40 mb-4 animate-pulse">
          <img
            src="/icon-192.png"
            alt="SurgiTrack iLog"
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-sm font-semibold text-teal-300">Loading SurgiTrack Platform...</p>
      </div>
    );
  }

  // If user is not authenticated: render dedicated AuthView
  if (!user && !profile) {
    return <AuthView />;
  }

  const myPostsCount = communityCases.filter(c => (c.userId || (c as any).authorId) === (profile?.userId || user?.uid)).length;

  // Primary Navigation Redesign:
  // 1. Surgical Literature & News, 2. Surgical Community, 3. PubMed Research, 4. Dashboard, 5. Clinical Cases, 6. Logbook Entries (Supervisor Portfolios), 7. Recommendations & Zeugnis, 8. German WBO, 9. Backup & Restore, 10. Profile, 11. Admin (Super Admin only)
  const navItems = [
    { id: 'news', label: t.news, icon: Newspaper },
    { id: 'community', label: isRTL ? 'المجتمع الجراحي' : 'Surgical Community', icon: Users, count: communityCases?.length },
    { id: 'pubmed', label: t.pubmed, icon: BookOpen },
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'cases', label: t.cases, icon: FolderPlus, count: cases.length },
    { id: 'supervisors', label: t.logbookEntries || (isRTL ? 'سجل العمليات والمهارات' : 'Logbook Entries'), icon: UserCheck, count: supervisors.length },
    { id: 'recommendations', label: t.recommendations, icon: Sparkles },
    { id: 'german', label: t.germanPortfolio, icon: FileCheck2 },
    { id: 'backup', label: t.backup, icon: HardDrive },
    { id: 'profile', label: t.profile, icon: User },
    ...(isSuperAdmin ? [{ id: 'admin', label: isRTL ? 'لوحة المدير العام' : 'Super Admin', icon: ShieldAlert }] : []),
  ];

  // Quick Navigation Items for Bottom Bar (Community, Dashboard, Clinical Cases, Logbook Entries, PubMed, News)
  const quickNavItems = [
    { id: 'community' as ActiveView, label: isRTL ? 'المجتمع' : 'Community', icon: Users, count: communityCases?.length },
    { id: 'dashboard' as ActiveView, label: t.quickNavDashboard, icon: LayoutDashboard },
    { id: 'cases' as ActiveView, label: t.quickNavCases, icon: FolderPlus, count: cases.length },
    { id: 'supervisors' as ActiveView, label: t.quickNavLogbook || (isRTL ? 'سجل العمليات' : 'Logbook'), icon: UserCheck, count: supervisors.length },
    { id: 'pubmed' as ActiveView, label: 'PubMed', icon: BookOpen },
    { id: 'news' as ActiveView, label: t.quickNavNews, icon: Newspaper },
  ];

  return (
    <div className={`min-h-screen bg-[#F4F7FA] text-slate-900 flex flex-col font-sans ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#101C32] text-white border-b border-teal-500/20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 shrink-0 cursor-pointer"
              title={isRTL ? 'القائمة الجانبية والأدوات' : 'Side Menu & Navigation'}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Official Logo (Clickable returns to news) */}
            <button onClick={() => setActiveView('news')} className="cursor-pointer text-left shrink-0">
              <SurgiTrackLogo size={36} textColor="text-white" />
            </button>
          </div>

          {/* Center/Right Actions: Sync status, Language, AI Assistant, User Avatar, Logout & Delete icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sync Indicator */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                !syncStatus.isOnline
                  ? 'bg-amber-950/40 text-amber-300 border-amber-600/40'
                  : syncStatus.isSyncing
                  ? 'bg-blue-950/40 text-blue-300 border-blue-600/40'
                  : 'bg-teal-950/40 text-teal-300 border-teal-500/40'
              }`}
            >
              {!syncStatus.isOnline ? (
                <>
                  <WifiOff size={13} className="text-amber-400" />
                  <span>{t.offline}</span>
                </>
              ) : syncStatus.isSyncing ? (
                <>
                  <RefreshCw size={13} className="animate-spin text-blue-400" />
                  <span>{t.syncing}</span>
                </>
              ) : (
                <>
                  <Wifi size={13} className="text-teal-400" />
                  <span>{t.online}</span>
                </>
              )}
            </div>

            {/* Trainee Portfolio Export Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-teal-400/40 transition cursor-pointer"
              title={isRTL ? 'تصدير بورتفوليو وسجل المتدرب الطبي' : 'Export Full Surgical Portfolio'}
            >
              <Download size={13} className="text-teal-400" />
              <span className="hidden md:inline">{isRTL ? 'تصدير البورتفوليو' : 'Export Portfolio'}</span>
            </button>

            {/* Direct Quick "Your Posts" (منشوراتك) Button */}
            <button
              onClick={() => setShowYourPostsModal(true)}
              className="flex items-center gap-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-teal-400/40 transition cursor-pointer"
              title={isRTL ? 'منشوراتك ومتابعة المعلقين عليها' : 'Your Posts & Follower Engagement'}
            >
              <MessageSquare size={13} className="text-teal-400" />
              <span className="hidden sm:inline">{isRTL ? 'منشوراتك' : 'Your Posts'}</span>
              {myPostsCount > 0 && (
                <span className="bg-teal-400 text-slate-900 text-[10px] font-bold px-1.5 rounded-full">
                  {myPostsCount}
                </span>
              )}
            </button>

            {/* Notifications Bell with Unread Badge */}
            <button
              onClick={() => setNotificationsModalOpen(true)}
              className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition cursor-pointer shrink-0"
              title={isRTL ? 'إشعارات الإدارة العامة والتنبيهات' : 'Administrative Notifications'}
            >
              <Bell size={16} />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-xs">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* User Profile Avatar with Dropdown Menu (Requirement 5) */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-9 h-9 rounded-xl overflow-hidden bg-teal-500/20 border-2 border-teal-400/50 text-teal-300 flex items-center justify-center font-bold text-xs hover:border-teal-300 transition cursor-pointer shrink-0 shadow-xs"
                title={isRTL ? 'حسابك وقائمة الإجراءات' : 'Account & Actions'}
              >
                {profile?.profilePhotoUrl ? (
                  <img
                    src={profile.profilePhotoUrl}
                    alt={profile.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{profile?.fullName ? profile.fullName.substring(0, 2).toUpperCase() : 'DR'}</span>
                )}
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div
                    className={`absolute top-12 ${
                      isRTL ? 'left-0' : 'right-0'
                    } z-50 w-72 bg-[#101C32] border border-teal-500/30 rounded-2xl shadow-2xl p-3 text-white space-y-2 animate-fadeIn`}
                  >
                    {/* User Card */}
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center font-bold text-sm shrink-0">
                        {profile?.profilePhotoUrl ? (
                          <img
                            src={profile.profilePhotoUrl}
                            alt={profile.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{profile?.fullName ? profile.fullName.substring(0, 2).toUpperCase() : 'DR'}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-white truncate">
                          {profile?.fullName || t.doctor}
                        </h4>
                        <p className="text-[10px] text-teal-300 truncate">
                          {profile?.currentPosition || 'Surgeon Trainee'}
                        </p>
                        <p className="text-[9px] text-slate-400 truncate">
                          {profile?.email || user?.email}
                        </p>
                      </div>
                    </div>

                    {/* Action 1: Your Posts (منشوراتك) - Explicit user requirement */}
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setShowYourPostsModal(true);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/35 border border-teal-400/40 text-teal-200 hover:text-white transition cursor-pointer text-xs font-bold"
                    >
                      <div className="flex items-center gap-2.5">
                        <MessageSquare size={16} className="text-teal-400" />
                        <span>{isRTL ? 'منشوراتك (متابعة منشوراتي)' : 'Your Posts & Interactions'}</span>
                      </div>
                      <span className="bg-teal-500/40 text-teal-200 px-2 py-0.5 rounded-full text-[10px] font-mono">
                        {myPostsCount}
                      </span>
                    </button>

                    {/* Action 2: Export Surgical Portfolio */}
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setShowExportModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/10 text-slate-200 hover:text-white transition cursor-pointer text-xs font-semibold"
                    >
                      <Download size={15} className="text-teal-400" />
                      <span>{isRTL ? 'تصدير البورتفوليو الرسمي' : 'Export Full Portfolio'}</span>
                    </button>

                    {/* Action 3: Profile & Photo Settings */}
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setActiveView('profile');
                      }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/10 text-slate-200 hover:text-white transition cursor-pointer text-xs font-semibold"
                    >
                      <User size={15} className="text-teal-400" />
                      <span>{isRTL ? 'الملف الشخصي والبيانات' : 'Profile & Credentials'}</span>
                    </button>

                    {/* Action 4: Backup & Restore */}
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setActiveView('backup');
                      }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/10 text-slate-200 hover:text-white transition cursor-pointer text-xs font-semibold"
                    >
                      <HardDrive size={15} className="text-teal-400" />
                      <span>{t.backup}</span>
                    </button>

                    {/* Action 5: Logout */}
                    <div className="pt-1 border-t border-white/10">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-red-300 hover:text-red-200 hover:bg-red-950/40 transition cursor-pointer text-xs font-semibold"
                      >
                        <LogOut size={14} className="text-red-400" />
                        <span>{isRTL ? 'تسجيل الخروج' : 'Log Out'}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar + Viewport */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-2.5 sm:px-4 lg:px-6 py-4 sm:py-6 gap-4 lg:gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 space-y-3 desktop-sticky-sidebar">
          {/* AI Surgical Assistant Button */}
          <button
            onClick={() => setAiAssistantOpen(true)}
            className="w-full flex items-center justify-between gap-2 p-3 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white font-bold text-xs shadow-md border border-teal-400/30 transition cursor-pointer group"
            title={t.aiAssistant}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles size={16} className="text-teal-200 group-hover:rotate-12 transition" />
              </div>
              <div className="text-left">
                <div className="font-bold text-xs">{t.aiAssistant}</div>
                <div className="text-[10px] text-teal-200 font-normal">Gemini Clinical Engine</div>
              </div>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono text-teal-100">AI</span>
          </button>

          {/* Language Switcher in Sidebar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2.5 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block px-1 mb-1.5">
              {isRTL ? 'لغة المنصة' : 'Language / Sprache'}
            </span>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setLanguage('en')}
                className={`py-1.5 text-center rounded-lg transition cursor-pointer ${
                  language === 'en' ? 'bg-[#0D9488] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('ar')}
                className={`py-1.5 text-center rounded-lg transition cursor-pointer ${
                  language === 'ar' ? 'bg-[#0D9488] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                عربي
              </button>
              <button
                onClick={() => setLanguage('de')}
                className={`py-1.5 text-center rounded-lg transition cursor-pointer ${
                  language === 'de' ? 'bg-[#0D9488] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                DE
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-3 shadow-xs space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              const isAdminItem = item.id === 'admin';
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as ActiveView)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? isAdminItem
                        ? 'bg-red-900 text-white shadow-xs'
                        : 'bg-[#101C32] text-white shadow-xs'
                      : isAdminItem
                      ? 'text-red-700 bg-red-50 hover:bg-red-100'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-teal-400' : isAdminItem ? 'text-red-600' : 'text-slate-500'} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              {isRTL ? 'إجراء سريع' : 'Quick Logbook Action'}
            </span>
            <button
              onClick={() => setShowQuickCaseModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-xs cursor-pointer"
            >
              <Plus size={15} /> + {t.addNewCase}
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-80 max-w-[85%] bg-[#101C32] text-white p-5 flex flex-col justify-between shadow-2xl h-full overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <SurgiTrackLogo size={30} textColor="text-white" />
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                    <X size={20} />
                  </button>
                </div>

                {/* AI Surgical Assistant Button in Mobile Side Drawer */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAiAssistantOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles size={16} className="text-teal-200" />
                    <span>{t.aiAssistant}</span>
                  </div>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">AI</span>
                </button>

                {/* Language Switcher inside Mobile Side Drawer */}
                <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-teal-300/80 tracking-wider block px-1 mb-1.5">
                    {isRTL ? 'تغيير لغة المنصة' : 'Language / Sprache'}
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => setLanguage('en')}
                      className={`py-1.5 text-center text-xs font-bold rounded-lg transition cursor-pointer ${
                        language === 'en' ? 'bg-[#0D9488] text-white' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setLanguage('ar')}
                      className={`py-1.5 text-center text-xs font-bold rounded-lg transition cursor-pointer ${
                        language === 'ar' ? 'bg-[#0D9488] text-white' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      عربي
                    </button>
                    <button
                      onClick={() => setLanguage('de')}
                      className={`py-1.5 text-center text-xs font-bold rounded-lg transition cursor-pointer ${
                        language === 'de' ? 'bg-[#0D9488] text-white' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Deutsch
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveView(item.id as ActiveView);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                          isActive ? 'bg-[#0D9488] text-white font-bold' : 'text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={16} />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Main Viewport */}
        <main className="flex-1 min-w-0 pb-28">
          {/* Back to Main Hub Banner (Visible on all views except news) */}
          {activeView !== 'news' && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-xs">
              <button
                onClick={() => setActiveView('news')}
                className="flex items-center gap-2 text-xs font-bold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3.5 py-2 rounded-xl transition cursor-pointer shadow-2xs"
                title={t.returnToMainHub}
              >
                {isRTL ? <ArrowRight size={16} className="text-[#0D9488]" /> : <ArrowLeft size={16} className="text-[#0D9488]" />}
                <span>{t.backToMain}</span>
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="hidden sm:inline">{t.currentSection}:</span>
                <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                  {navItems.find(n => n.id === activeView)?.label || activeView}
                </span>
              </div>
            </div>
          )}

          {/* Default Landing View: Surgical Literature & News */}
          {activeView === 'news' && <SurgicalNewsView />}

          {/* Peer Surgical Community & Colleague Network */}
          {activeView === 'community' && <SurgicalCommunityView />}

          {/* PubMed Evidence & Research Engine */}
          {activeView === 'pubmed' && <PubMedSearchEngineView />}

          {/* 2nd View: My Surgical Dashboard */}
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              {/* Dashboard Greeting Banner */}
              <div className="bg-[#101C32] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-teal-500/30">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 bg-teal-950/80 px-2.5 py-1 rounded-md border border-teal-500/40">
                      SurgiTrack Professional Dashboard
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    {profile?.fullName || t.doctor}, {t.welcomeToSurgicalPortfolio}
                  </h1>
                  <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
                    {t.tagline}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowQuickCaseModal(true)}
                    className="flex items-center gap-1.5 bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
                  >
                    <Plus size={15} /> + {t.addNewCase}
                  </button>
                  <button
                    onClick={() => setActiveView('supervisors')}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <UserCheck size={15} /> {t.supervisors}
                  </button>
                </div>
              </div>

              {/* 11 Calculated Real Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                <div
                  onClick={() => setActiveView('cases')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-400 transition cursor-pointer"
                >
                  <span className="text-[11px] text-slate-500 font-semibold block">{t.totalCases}</span>
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 block">{stats.totalCases}</span>
                  <span className="text-[10px] text-teal-700 font-medium mt-1 block">{t.documentedLogbook}</span>
                </div>

                <div
                  onClick={() => setActiveView('supervisors')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-400 transition cursor-pointer"
                >
                  <span className="text-[11px] text-slate-500 font-semibold block">{t.totalProcedures}</span>
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 block">{stats.totalProcedures}</span>
                  <span className="text-[10px] text-teal-700 font-medium mt-1 block">{t.operativeTheatres}</span>
                </div>

                <div
                  onClick={() => setActiveView('supervisors')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-400 transition cursor-pointer"
                >
                  <span className="text-[11px] text-slate-500 font-semibold block">{t.totalHours}</span>
                  <span className="text-xl sm:text-2xl font-bold text-teal-700 mt-1 block">{stats.totalHours}h</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">{stats.weeklyAverageHours} {t.hrsPerWeek}</span>
                </div>

                <div
                  onClick={() => setActiveView('supervisors')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-400 transition cursor-pointer"
                >
                  <span className="text-[11px] text-slate-500 font-semibold block">{t.verifiedHours}</span>
                  <span className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1 block">{stats.verifiedHours}h</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">{stats.unverifiedHours}h {t.pendingReview}</span>
                </div>

                <div
                  onClick={() => setActiveView('supervisors')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-400 transition cursor-pointer"
                >
                  <span className="text-[11px] text-slate-500 font-semibold block">{t.totalSupervisors}</span>
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 block">{stats.totalSupervisors}</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">{t.authorizedSupervisors}</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] text-slate-500 font-semibold block">{t.totalHospitals}</span>
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 block">{stats.totalHospitals}</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">{t.clinicalAffiliations}</span>
                </div>

                <div
                  onClick={() => setActiveView('supervisors')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-400 transition cursor-pointer"
                >
                  <span className="text-[11px] text-slate-500 font-semibold block">{t.skillsPracticed}</span>
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 block">{stats.skillsPracticed}</span>
                  <span className="text-[10px] text-teal-700 font-medium mt-1 block">{t.activeSkills}</span>
                </div>

                <div
                  onClick={() => setActiveView('supervisors')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-400 transition cursor-pointer"
                >
                  <span className="text-[11px] text-slate-500 font-semibold block">{t.assessedCompetencies}</span>
                  <span className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1 block">{stats.assessedCompetencies}</span>
                  <span className="text-[10px] text-emerald-600 font-medium mt-1 block">{t.supervisorConfirmed}</span>
                </div>
              </div>

              {/* Interactive Training Analytics & Charts */}
              <TrainingCharts records={trainingRecords} sessions={[]} />

              {/* Recent Cases & Operations Quick List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-slate-900">{t.recentClinicalCases}</h3>
                    <button
                      onClick={() => setActiveView('cases')}
                      className="text-xs text-teal-700 font-bold hover:underline cursor-pointer"
                    >
                      {t.viewAll} ({cases.length})
                    </button>
                  </div>

                  <div className="space-y-3">
                    {cases.slice(0, 3).map((c, idx) => (
                      <div
                        key={c.id ? `${c.id}-${idx}` : `recent-case-${idx}`}
                        onClick={() => setActiveView('cases')}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-200 transition cursor-pointer flex items-center justify-between"
                      >
                        <div className="truncate max-w-[240px]">
                          <span className="text-[10px] font-mono font-bold text-teal-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {c.caseReference}
                          </span>
                          <span className="font-bold text-xs text-slate-800 block mt-1 truncate">
                            {c.primaryDiagnosis}
                          </span>
                          <span className="text-[10px] text-slate-500">{c.hospital}</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-slate-900">{t.recentSupervisedOperations}</h3>
                    <button
                      onClick={() => setActiveView('supervisors')}
                      className="text-xs text-teal-700 font-bold hover:underline cursor-pointer"
                    >
                      {t.viewAll} ({trainingRecords.length})
                    </button>
                  </div>

                  <div className="space-y-3">
                    {trainingRecords.slice(0, 3).map((r, idx) => (
                      <div
                        key={r.id ? `${r.id}-${idx}` : `recent-rec-${idx}`}
                        onClick={() => setActiveView('supervisors')}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-200 transition cursor-pointer flex items-center justify-between"
                      >
                        <div className="truncate max-w-[240px]">
                          <span className="font-bold text-xs text-slate-800 block truncate">
                            {r.procedureName}
                          </span>
                          <span className="text-[10px] text-teal-700 font-medium block">
                            {r.participationRole} • {r.netTrainingHours}h
                          </span>
                          <span className="text-[10px] text-slate-400">{r.trainingDate}</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'cases' && <ClinicalCasesView />}
          {activeView === 'supervisors' && <SupervisorView />}
          {activeView === 'sessions' && <TrainingSessionsView />}
          {activeView === 'skills' && <SkillsMatrixView />}
          {activeView === 'recommendations' && <RecommendationGenerator />}
          {activeView === 'german' && <GermanPortfolioView />}
          {activeView === 'backup' && <BackupRestoreView />}
          {activeView === 'profile' && (
            <UserProfileView
              onNavigateToBackup={() => setActiveView('backup')}
              onOpenYourPosts={() => setShowYourPostsModal(true)}
            />
          )}
          {activeView === 'admin' && <AdminPanelView />}
        </main>
      </div>

      {/* Fixed Bottom Quick Access Navigation Bar (Dashboard, Clinical Cases, Training Sessions, Skills Matrix, News) */}
      <nav aria-label={t.quickAccess} className="fixed bottom-2 sm:bottom-3 inset-x-0 mx-auto z-40 w-[96%] sm:w-[94%] max-w-2xl pointer-events-none bottom-nav-safe">
        <div className="pointer-events-auto bg-[#101C32]/95 backdrop-blur-md text-white border border-teal-500/40 rounded-2xl sm:rounded-full p-1 sm:p-1.5 shadow-2xl flex items-center justify-between gap-0.5 sm:gap-1">
          {quickNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-1.5 sm:py-2 px-1 sm:px-1.5 rounded-xl sm:rounded-full transition cursor-pointer text-center ${
                  isActive
                    ? 'bg-[#0D9488] text-white font-bold shadow-md shadow-teal-900/50'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title={item.label}
              >
                <div className="relative shrink-0">
                  <Icon size={16} className={isActive ? 'text-white' : 'text-teal-400'} />
                  {item.count !== undefined && item.count > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-teal-400 text-slate-900 text-[8px] sm:text-[9px] font-bold px-1 rounded-full leading-tight">
                      {item.count}
                    </span>
                  )}
                </div>
                <span className="text-[9px] sm:text-xs font-semibold truncate max-w-[58px] sm:max-w-none">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Notifications Drawer / Modal */}
      {notificationsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {isRTL ? 'إشعارات وتوجيهات إدارة الموقع' : 'Platform Announcements & Notifications'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isRTL ? 'الرسائل والتنبيهات الموجهة لك من الإدارة مع إمكانية الرد' : 'Official messages from administration with interactive replies'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setNotificationsModalOpen(false);
                  setReplyingToNotifId(null);
                  setReplyText('');
                }}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content List */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {replySuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>{replySuccessMessage}</span>
                </div>
              )}

              {replyErrorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                  <AlertTriangle size={15} className="text-red-600 shrink-0" />
                  <span>{replyErrorMessage}</span>
                </div>
              )}

              {notifications.length > 0 ? (
                notifications.map((notif) => {
                  const currentUid = profile?.userId || user?.uid;
                  const isRead = currentUid ? (notif.readByUserIds || []).includes(currentUid) : false;
                  const isReplying = replyingToNotifId === notif.id;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`p-4 rounded-2xl border transition space-y-2.5 ${
                        !isRead
                          ? 'bg-teal-50/50 border-teal-300 shadow-2xs'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm leading-snug">
                            {notif.title}
                          </span>
                          {!isRead && (
                            <span className="text-[9px] font-bold uppercase bg-teal-600 text-white px-2 py-0.5 rounded-full">
                              {isRTL ? 'جديد' : 'New'}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-white/70 p-3 rounded-xl border border-slate-200/60">
                        {notif.message}
                      </p>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {isRTL ? 'المرسل: إدارة المنصة' : 'From: SurgiTrack Administration'}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplyingToNotifId(isReplying ? null : notif.id);
                            setReplyText('');
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-950 bg-white hover:bg-teal-100 border border-teal-300 px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
                        >
                          <MessageSquare size={13} />
                          <span>{isReplying ? (isRTL ? 'إلغاء الرد' : 'Cancel') : (isRTL ? 'الرد على الإدارة' : 'Reply to Admin')}</span>
                        </button>
                      </div>

                      {/* Reply Input Box */}
                      {isReplying && (
                        <div className="pt-3 border-t border-slate-200 space-y-2 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                          <label className="block text-[11px] font-bold text-slate-700">
                            {isRTL ? 'كتابة ردك المباشر للإدارة العامة:' : 'Write your response to administration:'}
                          </label>
                          <textarea
                            rows={3}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={isRTL ? 'اكتب ردك أو استفسارك هنا وسيصل للمدير العام فورياً...' : 'Type your reply here, it will be visible in the admin control center...'}
                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                          />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              disabled={replySending || !replyText.trim()}
                              onClick={async () => {
                                setReplySending(true);
                                setReplyErrorMessage('');
                                try {
                                  await replyToNotification(notif.id, notif.title, replyText);
                                  setReplySuccessMessage(isRTL ? 'تم إرسال ردك للإدارة بنجاح!' : 'Reply submitted successfully!');
                                  setReplyingToNotifId(null);
                                  setReplyText('');
                                  setTimeout(() => setReplySuccessMessage(''), 4000);
                                } catch (e: any) {
                                  setReplyErrorMessage('Failed to send reply: ' + (e.message || 'Please try again'));
                                  setTimeout(() => setReplyErrorMessage(''), 5000);
                                } finally {
                                  setReplySending(false);
                                }
                              }}
                              className="bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Send size={12} />
                              <span>{replySending ? 'Sending...' : isRTL ? 'إرسال الرد' : 'Send Reply'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                  <Bell size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700">
                    {isRTL ? 'لا توجد إشعارات جديدة حالياً.' : 'No announcements at the moment.'}
                  </p>
                  <p className="text-slate-400">
                    {isRTL ? 'سيظهر هنا أي إشعار أو تعميم مرسل من إدارة المنصة.' : 'Official updates from the site administrator will appear here.'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setNotificationsModalOpen(false)}
                className="bg-[#101C32] hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-xl transition cursor-pointer"
              >
                {isRTL ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Modal */}
      <AiAssistantModal
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
        language={language}
      />

      {/* Official Trainee Portfolio Export Modal */}
      <TraineePortfolioExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* Your Posts Management Modal (Requirement 5) */}
      <YourPostsModal
        isOpen={showYourPostsModal}
        onClose={() => setShowYourPostsModal(false)}
        onOpenNewCase={() => {
          setShowYourPostsModal(false);
          setShowQuickCaseModal(true);
        }}
      />

      {/* Quick Add Case Modal */}
      {showQuickCaseModal && (
        <AddCaseModal
          isOpen={showQuickCaseModal}
          onClose={() => setShowQuickCaseModal(false)}
          onSave={async (c, publishToCommunity) => {
            const id = await addCase(c, publishToCommunity ?? false);
            setShowQuickCaseModal(false);
            return id;
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <SurgiTrackApp />
      </DataProvider>
    </AuthProvider>
  );
}
