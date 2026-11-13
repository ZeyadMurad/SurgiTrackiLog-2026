import React, { useState } from 'react';
import {
  Heart,
  MessageSquare,
  Share2,
  Send,
  UserPlus,
  UserCheck,
  CheckCircle2,
  Clock,
  Building,
  ShieldCheck,
  X,
  Users,
  Activity,
  FileCheck2,
  Trash2,
  Edit3,
} from 'lucide-react';
import { ClinicalCase, CaseComment } from '../types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { translations } from '../lib/i18n';

interface SurgicalCommunityPostProps {
  post: ClinicalCase;
  onEdit?: (c: ClinicalCase) => void;
  onDelete?: (id: string) => void;
  onSelectDoctor?: (doctorId: string) => void;
  isOwnerManagementView?: boolean; // Only true when inside "Your Posts"
}

export const SurgicalCommunityPost: React.FC<SurgicalCommunityPostProps> = ({
  post,
  onEdit,
  onDelete,
  onSelectDoctor,
  isOwnerManagementView = false,
}) => {
  const { toggleLikeCase, addCommentToCase, toggleFollowDoctor, deleteCase } = useData();
  const { profile, user, language } = useAuth();
  const t = translations[language] || translations.en;
  const isRTL = language === 'ar';

  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [showLikersModal, setShowLikersModal] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentUid = user?.uid || profile?.userId || 'local-surgeon-001';
  const isAuthor = post.userId === currentUid || (profile?.fullName && post.authorName === profile.fullName);
  const isSuperAdmin = profile?.role === 'super_admin';

  const isLiked = (post.likedByUserIds || []).includes(currentUid);
  const likesCount = post.likesCount || 0;
  const comments = post.comments || [];
  const commentsCount = comments.length || post.commentsCount || 0;

  const isFollowingAuthor = (profile?.following || []).includes(post.userId);
  // COMMUNITY 2.1 — Track pending follow requests so the button can render
  // the "Requested" state. Uses local state because the requester's profile
  // doesn't store pendingFollowRequests (only the followee's does, on accept/
  // decline). When the button is clicked and `toggleFollowDoctor` returns
  // `{ status: 'requested' }`, we flip this state to true.
  const [followRequested, setFollowRequested] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await toggleLikeCase(post.id);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    await addCommentToCase(post.id, commentInput);
    setCommentInput('');
  };

  const handleDeletePost = async () => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(post.id);
      } else {
        await deleteCase(post.id);
      }
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-all duration-200">
      {/* 1. Author Bar */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 bg-slate-50/60">
        <div
          onClick={() => onSelectDoctor && onSelectDoctor(post.userId)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative">
            {post.authorPhotoUrl ? (
              <img
                src={post.authorPhotoUrl}
                alt={post.authorName}
                className="w-10 h-10 rounded-2xl object-cover ring-2 ring-teal-500/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-[#101C32] text-teal-300 font-bold text-xs flex items-center justify-center ring-2 ring-teal-500/30">
                {(post.authorName || 'Dr').substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 ring-2 ring-white rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition">
                {post.authorName || 'Specialist Surgeon'}
              </h4>
              <ShieldCheck size={13} className="text-teal-600" />
            </div>
            <p className="text-[11px] text-teal-800 font-medium">
              {post.authorSpecialty || post.specialty} • <span className="text-slate-400 font-normal">{post.authorHospital || post.hospital}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* COMMUNITY 2.1 — Follow button with three states:
              Follow → Following → Requested (when approval required).
              Per PDF Part 2: "The interface must distinguish between
              Follow / Following / Requested / Accept / Reject". */}
          {!isAuthor && (
            <button
              onClick={async () => {
                const res = await toggleFollowDoctor(post.userId);
                if (res.status === 'requested') setFollowRequested(true);
                else if (res.status === 'unfollowed') setFollowRequested(false);
              }}
              disabled={followRequested && !isFollowingAuthor}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isFollowingAuthor
                  ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700 border border-slate-200'
                  : followRequested
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-default'
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
              }`}
            >
              {isFollowingAuthor ? (
                <>
                  <UserCheck size={12} className="text-teal-700" />
                  <span>{isRTL ? 'تتابعه' : 'Following'}</span>
                </>
              ) : followRequested ? (
                <>
                  <Clock size={12} className="text-amber-600" />
                  <span>{isRTL ? 'طلب مرسل' : 'Requested'}</span>
                </>
              ) : (
                <>
                  <UserPlus size={12} />
                  <span>{isRTL ? 'متابعة' : 'Follow'}</span>
                </>
              )}
            </button>
          )}

          {/* Author / Owner / Admin Actions */}
          {(isAuthor || isOwnerManagementView || isSuperAdmin) && (
            <div className="flex items-center gap-1.5">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(post)}
                  className="px-2.5 py-1 text-xs font-bold text-teal-700 hover:bg-teal-50 rounded-lg border border-teal-200 transition cursor-pointer flex items-center gap-1"
                  title={isRTL ? 'تعديل المنشور' : 'Edit Post'}
                >
                  <Edit3 size={12} />
                  <span>{isRTL ? 'تعديل' : 'Edit'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition cursor-pointer flex items-center gap-1"
                title={isRTL ? 'حذف المنشور' : 'Delete Post'}
              >
                <Trash2 size={12} />
                <span>{isRTL ? 'حذف' : 'Delete'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Public Case Header Banner - Clean, Professional Dark Navy Banner (NO Edit, Delete, or PDF buttons as requested) */}
      <div className="bg-[#101C32] text-white p-4 sm:p-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          {/* Reference Badge */}
          <div className="shrink-0 bg-teal-900/60 border border-teal-400/30 text-teal-300 font-mono text-xs font-bold px-3 py-2 rounded-xl flex flex-col items-center justify-center text-center shadow-xs">
            <span className="text-[9px] text-teal-400 tracking-wider">REF</span>
            <span className="text-xs font-bold tracking-tight">{post.caseReference}</span>
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug">
              {post.primaryDiagnosis}
            </h3>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
              <span>{post.hospital}</span>
              <span>•</span>
              <span className="font-mono text-teal-300">{post.presentationDate}</span>
              {post.specialty && (
                <>
                  <span>•</span>
                  <span className="text-[10px] bg-teal-900/50 text-teal-300 px-2 py-0.5 rounded-md border border-teal-500/30">
                    {post.specialty}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Compact Single-Page Professional Layout (Concise, high-density, no sprawling 3 pages) */}
      <div className="p-4 sm:p-5 space-y-3.5 text-xs text-slate-700 bg-[#FBFDFE]">
        {/* Top Split Grid: Presentation & Investigations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Left: Presentation, Complaint & Clinical History */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="font-bold text-teal-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={13} className="text-teal-600" />
                1. Presentation & Clinical History
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {post.patientAge}y • {post.patientSex || 'Undisclosed'}
              </span>
            </div>

            <div className="space-y-1.5 leading-relaxed">
              <p>
                <strong className="text-slate-900">Chief Complaint:</strong> {post.chiefComplaint}
                {post.durationOfSymptoms && <span className="text-slate-400 font-mono"> ({post.durationOfSymptoms})</span>}
              </p>
              {post.historyOfPresentIllness && (
                <p className="text-slate-600 line-clamp-3" title={post.historyOfPresentIllness}>
                  <strong className="text-slate-900">HPI:</strong> {post.historyOfPresentIllness}
                </p>
              )}
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 grid grid-cols-2 gap-2">
                <div>
                  <strong className="text-slate-800">Medical:</strong> {post.relevantMedicalHistory || 'Nil'}
                </div>
                <div>
                  <strong className="text-slate-800">Surgical:</strong> {post.surgicalHistory || 'Nil'}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Investigations & Exam Findings */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="font-bold text-teal-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 size={13} className="text-teal-600" />
                2. Key Investigations & Exam
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {post.investigations?.length || 0} tests
              </span>
            </div>

            {post.investigations && post.investigations.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {post.investigations.slice(0, 3).map((inv, idx) => (
                  <div key={idx} className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-[11px]">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">{inv.name}</strong>
                      <span className="text-[10px] text-teal-700 font-mono">{inv.category}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5 line-clamp-1">{inv.result}</p>
                  </div>
                ))}
              </div>
            ) : post.examination?.local ? (
              <p className="text-slate-600 leading-relaxed text-[11px]">
                <strong className="text-slate-900">Local Exam:</strong> {post.examination.local}
              </p>
            ) : (
              <p className="text-slate-400 italic text-[11px]">No formal investigations recorded.</p>
            )}
          </div>
        </div>

        {/* Bottom Card: Operative Record & Clinical Outcome */}
        {post.surgicalProcedure ? (
          <div className="bg-teal-50/50 p-3.5 rounded-2xl border border-teal-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-teal-200/60">
              <span className="font-bold text-teal-950 text-[11px] uppercase tracking-wider">
                3. Operative Record & Surgical Procedure
              </span>
              <span className="text-[10px] bg-teal-100 text-teal-900 font-bold px-2 py-0.5 rounded-full border border-teal-300">
                {post.surgicalProcedure.participationRole}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div>
                <strong className="text-teal-950">Procedure:</strong>
                <p className="text-slate-800 font-semibold">{post.surgicalProcedure.procedureName}</p>
              </div>
              <div>
                <strong className="text-teal-950">Date & Anesthesia:</strong>
                <p className="text-slate-700">{post.surgicalProcedure.procedureDate} ({post.surgicalProcedure.anaesthesiaType || 'GETA'})</p>
              </div>
              <div>
                <strong className="text-teal-950">Outcome / Follow-up:</strong>
                <p className="text-slate-700 truncate">{post.followUp?.clinicalProgress || post.surgicalProcedure.outcome || 'Uneventful'}</p>
              </div>
            </div>

            {post.surgicalProcedure.procedureSummary && (
              <div className="pt-1.5 border-t border-teal-200/40 text-[11px] text-slate-700">
                <strong className="text-teal-950">Operative Summary: </strong>
                <span className="text-slate-600">{post.surgicalProcedure.procedureSummary}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-[11px] text-slate-600">
            <strong className="text-slate-900">Clinical Management:</strong> {post.management?.initial || 'Conservative medical therapy'}
          </div>
        )}
      </div>

      {/* 4. Social Interactions Bar */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Like Heart Button */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              isLiked
                ? 'bg-rose-50 text-rose-600 border border-rose-200 scale-105'
                : 'bg-white text-slate-600 hover:text-rose-600 border border-slate-200'
            }`}
          >
            <Heart size={15} className={isLiked ? 'fill-rose-500 text-rose-500' : ''} />
            <span>{likesCount}</span>
          </button>

          {/* Likers Trigger */}
          {likesCount > 0 && (
            <button
              onClick={() => setShowLikersModal(true)}
              className="text-[11px] text-slate-500 hover:text-teal-700 transition cursor-pointer hidden sm:inline"
            >
              {post.likedByUsers && post.likedByUsers.length > 0
                ? `${isRTL ? 'أعجب به' : 'Liked by'} ${post.likedByUsers[0].fullName}${likesCount > 1 ? ` +${likesCount - 1}` : ''}`
                : `${likesCount} ${isRTL ? 'إعجاب' : 'likes'}`}
            </button>
          )}

          {/* Comment Toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
          >
            <MessageSquare size={14} className="text-teal-600" />
            <span>{commentsCount} {isRTL ? 'تعليق' : 'Comments'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Comments Drawer */}
      {showComments && (
        <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3">
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder={isRTL ? 'أضف تعليقاً أو استفساراً جراحياً...' : 'Add a surgical comment or clinical feedback...'}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!commentInput.trim()}
              className="bg-[#0D9488] hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Send size={13} />
              <span>{isRTL ? 'إرسال' : 'Post'}</span>
            </button>
          </form>

          {comments.length > 0 && (
            <div className="space-y-2 pt-2">
              {comments.map((cmt) => (
                <div key={cmt.id} className="bg-white p-3 rounded-2xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{cmt.userName}</span>
                      {cmt.userSpecialty && (
                        <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                          {cmt.userSpecialty}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(cmt.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{cmt.commentText}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Likers Modal */}
      {showLikersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Heart size={16} className="text-rose-500 fill-rose-500" />
                <h3 className="font-bold text-xs text-slate-900">
                  {isRTL ? 'الأطباء المعجبون بهذه الحالة' : 'Colleagues who liked this case'}
                </h3>
              </div>
              <button
                onClick={() => setShowLikersModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {(post.likedByUsers || []).map((u, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                    {u.fullName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">{u.fullName}</h5>
                    <p className="text-[10px] text-slate-500">{u.specialty || 'Surgeon'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto ring-8 ring-red-50/50">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {isRTL ? 'تأكيد حذف المنشور الجراحي' : 'Delete Community Post?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {isRTL
                  ? 'هل أنت متأكد من رغبتك في حذف هذه الحالة السريرية من المجتمع الجراحي؟ لا يمكن التراجع عن هذا الإجراء.'
                  : 'Are you sure you want to permanently delete this surgical post from the community feed? This action cannot be undone.'}
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeletePost}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-red-500/20 disabled:opacity-50"
              >
                {isDeleting ? (
                  <span>{isRTL ? 'جارٍ الحذف...' : 'Deleting...'}</span>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>{isRTL ? 'حذف نهائي' : 'Delete'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
