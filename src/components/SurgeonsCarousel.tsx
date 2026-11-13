import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, UserPlus, UserCheck, Users, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { translations } from '../lib/i18n';

interface SurgeonsCarouselProps {
  onSelectDoctor: (doctor: any) => void;
}

export const SurgeonsCarousel: React.FC<SurgeonsCarouselProps> = ({ onSelectDoctor }) => {
  const { allDoctors, toggleFollowDoctor } = useData();
  const { profile, language } = useAuth();
  const t = translations[language] || translations.en;
  const isRTL = language === 'ar';
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // COMMUNITY 2.1 — per-card follow state tracking + error display.
  // Tracks the "Requested" state for pending follow requests and surfaces
  // follow errors visibly instead of failing silently.
  const [followRequested, setFollowRequested] = useState<Set<string>>(new Set());
  const [followError, setFollowError] = useState<string | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const currentFollowing = profile?.following || [];

  const handleFollow = async (uid: string) => {
    if (busyUid) return;
    setBusyUid(uid);
    setFollowError(null);
    try {
      const res = await toggleFollowDoctor(uid);
      if (res.status === 'requested') {
        setFollowRequested(prev => new Set(prev).add(uid));
      } else if (res.status === 'unfollowed') {
        setFollowRequested(prev => {
          const next = new Set(prev);
          next.delete(uid);
          return next;
        });
      }
    } catch (err: any) {
      const msg = err?.message || 'Follow failed. Please sign in and try again.';
      setFollowError(msg);
      // Auto-clear the error after 5 seconds
      setTimeout(() => setFollowError(null), 5000);
    } finally {
      setBusyUid(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3 relative overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
            <Users size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>{isRTL ? 'أطباء المجتمع الجراحي' : 'Surgical Community Colleagues'}</span>
              <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-mono font-semibold">
                {allDoctors.length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {isRTL ? 'تابع زملاءك الجراحين واطلع على حالاتهم السريرية' : 'Connect with surgeons, follow cases, and share clinical insights'}
            </p>
          </div>
        </div>

        {/* Scroll navigation arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll(isRTL ? 'right' : 'left')}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer"
            title="Scroll Left"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => scroll(isRTL ? 'left' : 'right')}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer"
            title="Scroll Right"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* COMMUNITY 2.1 — Follow error banner (auto-dismisses after 5s) */}
      {followError && (
        <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800">
          <AlertCircle size={13} className="text-red-600 shrink-0 mt-0.5" />
          <span>{followError}</span>
        </div>
      )}

      {/* COMMUNITY 2.1 — Empty state when no real users exist yet */}
      {allDoctors.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <Users size={22} />
          </div>
          <p className="text-xs font-bold text-slate-700">
            {isRTL ? 'لا يوجد جراحون آخرون بعد' : 'No other surgeons yet'}
          </p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
            {isRTL
              ? 'عندما يسجل زملاؤك الجراحون حساباتهم، ستظهر أيقوناتهم هنا تلقائياً ويمكنك متابعتهم.'
              : 'When your surgical colleagues register their accounts, their icons will appear here automatically and you can follow them.'}
          </p>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-3 overflow-x-auto pb-1 scrollbar-none scroll-smooth"
        >
          {allDoctors.map((doc) => {
            const isFollowing = currentFollowing.includes(doc.userId);
            const isSelf = profile?.userId === doc.userId;
            const isRequested = followRequested.has(doc.userId);
            const isBusy = busyUid === doc.userId;

            return (
              <div
                key={doc.userId}
                className="group shrink-0 w-36 sm:w-40 bg-slate-50/60 hover:bg-white hover:shadow-md border border-slate-200/90 rounded-2xl p-3 flex flex-col items-center text-center transition-all duration-200 relative"
              >
                {/* Circular Avatar with Ring & Status Indicator — clickable to open profile */}
                <div
                  onClick={() => onSelectDoctor(doc)}
                  className="relative cursor-pointer mb-2 transform group-hover:scale-105 transition"
                >
                  <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-teal-500 via-teal-300 to-emerald-400 shadow-sm">
                    {doc.profilePhotoUrl ? (
                      <img
                        src={doc.profilePhotoUrl}
                        alt={doc.fullName}
                        className="w-full h-full rounded-full object-cover border-2 border-white"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#101C32] text-teal-300 font-bold text-base flex items-center justify-center border-2 border-white">
                        {doc.fullName?.substring(0, 2).toUpperCase() || '??'}
                      </div>
                    )}
                  </div>
                  {/* Active status pip */}
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>

                {/* Surgeon Name & Title — clickable to open profile */}
                <h4
                  onClick={() => onSelectDoctor(doc)}
                  className="text-xs font-bold text-slate-900 line-clamp-1 hover:text-teal-700 cursor-pointer w-full"
                  title={doc.fullName}
                >
                  {doc.academicTitle ? `${doc.academicTitle} ` : ''}{doc.fullName}
                </h4>

                {/* Specialty & Hospital */}
                <p className="text-[10px] text-teal-800 font-semibold line-clamp-1 w-full mt-0.5">
                  {doc.specialty}
                </p>
                <p className="text-[9px] text-slate-400 line-clamp-1 w-full">
                  {doc.hospital}
                </p>

                {/* COMMUNITY 2.1 — Published cases count (clickable to open profile) */}
                <button
                  onClick={() => onSelectDoctor(doc)}
                  className="mt-1 text-[9px] text-slate-500 hover:text-teal-700 cursor-pointer"
                  title={isRTL ? 'انقر لعرض الملف الكامل' : 'Click to view full profile'}
                >
                  {isRTL ? `${doc.publishedCasesCount || 0} حالة` : `${doc.publishedCasesCount || 0} cases`} · {isRTL ? `${doc.followersCount || 0} متابع` : `${doc.followersCount || 0} followers`}
                </button>

                {/* Action: Follow / Following / Requested */}
                <div className="mt-2.5 w-full pt-2 border-t border-slate-200/70">
                  {isSelf ? (
                    <span className="text-[10px] text-slate-400 font-semibold block py-1">
                      {isRTL ? 'حسابك' : 'You'}
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollow(doc.userId);
                      }}
                      disabled={isBusy}
                      className={`w-full py-1 px-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer disabled:opacity-50 ${
                        isFollowing
                          ? 'bg-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-700'
                          : isRequested
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-default'
                          : 'bg-[#0D9488] hover:bg-teal-700 text-white shadow-2xs'
                      }`}
                    >
                      {isBusy ? (
                        <>
                          <Clock size={11} className="animate-spin" />
                          <span>{isRTL ? '...' : '...'}</span>
                      </>
                      ) : isFollowing ? (
                        <>
                          <UserCheck size={11} className="text-teal-700" />
                          <span>{isRTL ? 'تتابعه' : 'Following'}</span>
                        </>
                      ) : isRequested ? (
                        <>
                          <Clock size={11} className="text-amber-600" />
                          <span>{isRTL ? 'طلب مرسل' : 'Requested'}</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={11} />
                          <span>{isRTL ? 'متابعة' : 'Follow'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
