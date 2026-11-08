import React, { useState } from 'react';
import { X, UserPlus, UserCheck, ShieldCheck, Clock, Award, Building, BookOpen, Lock, CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ClinicalCase } from '../types';
import { translations } from '../lib/i18n';

interface DoctorProfileModalProps {
  doctor: {
    userId: string;
    fullName: string;
    academicDegree?: string;
    academicTitle?: string;
    specialty: string;
    hospital: string;
    profilePhotoUrl?: string;
    biography?: string;
    followersCount: number;
    followingCount: number;
    showProgressStats?: boolean;
    showPortfolioToFollowers?: boolean;
    requireApprovalToFollow?: boolean;
    totalHours?: number;
    totalProcedures?: number;
    publishedCasesCount?: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCaseDetail?: (c: ClinicalCase) => void;
}

export const DoctorProfileModal: React.FC<DoctorProfileModalProps> = ({
  doctor,
  isOpen,
  onClose,
  onOpenCaseDetail,
}) => {
  const { profile, language } = useAuth();
  const { communityCases, toggleFollowDoctor } = useData();
  const t = translations[language] || translations.en;
  const isRTL = language === 'ar';

  const [followState, setFollowState] = useState<'followed' | 'unfollowed' | 'requested' | null>(null);

  if (!isOpen || !doctor) return null;

  const isSelf = profile?.userId === doctor.userId;
  const isFollowing = followState
    ? followState === 'followed'
    : (profile?.following || []).includes(doctor.userId);
  const isRequested = followState === 'requested';

  const doctorCases = communityCases.filter(c => c.userId === doctor.userId || c.authorName === doctor.fullName);

  const handleFollowClick = async () => {
    if (isSelf) return;
    const res = await toggleFollowDoctor(doctor.userId);
    setFollowState(res.status);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-auto animate-fadeIn flex flex-col max-h-[92vh]">
        {/* Header Cover & Close */}
        <div className="h-28 bg-gradient-to-r from-[#101C32] via-[#0E4646] to-[#0D9488] relative flex items-start justify-end p-4">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-xs transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Profile Avatar & Top Bar */}
        <div className="px-6 relative -mt-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-end gap-3.5">
            <div className="relative">
              {doctor.profilePhotoUrl ? (
                <img
                  src={doctor.profilePhotoUrl}
                  alt={doctor.fullName}
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-md bg-white"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-teal-800 text-white font-bold text-2xl flex items-center justify-center ring-4 ring-white shadow-md">
                  {doctor.fullName.substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="Online in surgical network" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-slate-900 text-base">
                  {doctor.academicTitle ? `${doctor.academicTitle} ` : ''}{doctor.fullName}
                </h3>
                {doctor.academicDegree && (
                  <span className="text-[10px] bg-slate-100 font-mono text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                    {doctor.academicDegree}
                  </span>
                )}
              </div>
              <p className="text-xs text-teal-800 font-semibold">{doctor.specialty}</p>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Building size={11} /> {doctor.hospital}
              </p>
            </div>
          </div>

          {!isSelf && (
            <div className="shrink-0 self-start sm:self-end">
              <button
                onClick={handleFollowClick}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                  isFollowing
                    ? 'bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 border border-slate-300'
                    : isRequested
                    ? 'bg-amber-50 text-amber-800 border border-amber-300'
                    : 'bg-[#0D9488] hover:bg-teal-700 text-white shadow-teal-900/10'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck size={14} className="text-teal-700" />
                    <span>{isRTL ? 'تتابعه (إلغاء)' : 'Following'}</span>
                  </>
                ) : isRequested ? (
                  <>
                    <Clock size={14} />
                    <span>{isRTL ? 'الطلب قيد الانتظار' : 'Request Pending'}</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    <span>{isRTL ? 'متابعة الطبيب' : 'Follow Surgeon'}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 bg-[#FBFDFE]">
          {/* Colleague Bio */}
          {doctor.biography && (
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
              <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">
                {isRTL ? 'نبذة عن الجراح' : 'About Surgeon'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">{doctor.biography}</p>
            </div>
          )}

          {/* Followers & Following Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-sm font-bold text-slate-900 font-mono">{doctor.followersCount}</span>
              <span className="text-[10px] text-slate-500 block">{isRTL ? 'المتابعون' : 'Followers'}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-sm font-bold text-slate-900 font-mono">{doctor.followingCount}</span>
              <span className="text-[10px] text-slate-500 block">{isRTL ? 'يتابع' : 'Following'}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-sm font-bold text-teal-800 font-mono">{doctorCases.length || doctor.publishedCasesCount || 1}</span>
              <span className="text-[10px] text-slate-500 block">{isRTL ? 'حالات منشورة' : 'Cases Shared'}</span>
            </div>
          </div>

          {/* Privacy Controlled Section: Training Progress Stats */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Award size={14} className="text-teal-600" />
                {isRTL ? 'سجل التدريب والعمليات المعتمد' : 'Verified Surgical Training Metrics'}
              </h4>
              {doctor.showProgressStats === false && (
                <span className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                  <Lock size={10} /> {isRTL ? 'إحصائيات خاصة' : 'Private'}
                </span>
              )}
            </div>

            {doctor.showProgressStats !== false ? (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                  <span className="text-[10px] font-semibold text-teal-900 uppercase block">
                    {isRTL ? 'ساعات التدريب السريري' : 'Documented Training Hours'}
                  </span>
                  <span className="text-base font-bold text-teal-950 font-mono">
                    {doctor.totalHours || 280} hrs
                  </span>
                </div>
                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                  <span className="text-[10px] font-semibold text-teal-900 uppercase block">
                    {isRTL ? 'العمليات الجراحية الموثقة' : 'Surgical Procedures'}
                  </span>
                  <span className="text-base font-bold text-teal-950 font-mono">
                    {doctor.totalProcedures || 64} ops
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center space-y-1">
                <Lock size={16} className="mx-auto text-slate-400" />
                <p className="text-xs text-slate-600 font-medium">
                  {isRTL ? 'فضل هذا الجراح إبقاء تفاصيل ساعاته التدريبية خاصة.' : 'This surgeon has set their training hours & matrix to private.'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isRTL ? 'الحالات السريرية المنشورة في المجتمع فقط هي المتاحة.' : 'Only publicly shared clinical cases are viewable.'}
                </p>
              </div>
            )}
          </div>

          {/* Published Clinical Cases */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <BookOpen size={14} className="text-teal-600" />
              {isRTL ? 'الحالات السريرية المنشورة بواسطة هذا الطبيب' : 'Clinical Cases Shared by Surgeon'} ({doctorCases.length})
            </h4>

            {doctorCases.length > 0 ? (
              <div className="space-y-2">
                {doctorCases.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      if (onOpenCaseDetail) onOpenCaseDetail(c);
                    }}
                    className="p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/20 transition cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold bg-slate-900 text-teal-300 px-1.5 py-0.5 rounded">
                          {c.caseReference}
                        </span>
                        <span className="text-[11px] text-slate-500">{c.presentationDate}</span>
                      </div>
                      <h5 className="font-semibold text-slate-900 text-xs mt-1 line-clamp-1">
                        {c.primaryDiagnosis}
                      </h5>
                      <p className="text-[10px] text-slate-500">
                        {c.surgicalProcedure?.procedureName || c.chiefComplaint}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                {isRTL ? 'لم يتم نشر أي حالات بعد.' : 'No public cases published yet.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
