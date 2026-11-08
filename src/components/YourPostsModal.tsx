import React, { useState } from 'react';
import {
  X,
  FileText,
  Heart,
  MessageSquare,
  Users,
  Trash2,
  Edit3,
  Plus,
  Share2,
  CheckCircle2,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { ClinicalCase } from '../types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { SurgicalCommunityPost } from './SurgicalCommunityPost';
import { AddCaseModal } from './AddCaseModal';

interface YourPostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewCase: () => void;
}

export const YourPostsModal: React.FC<YourPostsModalProps> = ({
  isOpen,
  onClose,
  onOpenNewCase,
}) => {
  const { communityCases, cases, deleteCase, updateCase } = useData();
  const { user, profile, language } = useAuth();
  const isRTL = language === 'ar';

  const currentUid = user?.uid || profile?.userId || 'local-surgeon-001';

  // Filter posts authored by current user (from community cases or published cases)
  const myPosts = communityCases.filter(c => c.userId === currentUid || c.authorName === profile?.fullName);

  // Overall engagement metrics
  const totalLikes = myPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
  const totalComments = myPosts.reduce((acc, p) => acc + (p.commentsCount || (p.comments?.length || 0)), 0);
  const followersCount = profile?.followers?.length || 0;
  const followingCount = profile?.following?.length || 0;

  const [editingPost, setEditingPost] = useState<ClinicalCase | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-[#101C32] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 font-bold">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {isRTL ? 'منشوراتك وتفاعل الزملاء الجراحين' : 'Your Published Surgical Posts & Engagement'}
              </h2>
              <p className="text-xs text-slate-300">
                {profile?.fullName || 'Dr. Surgeon'} • {isRTL ? 'إدارة منشوراتك ومتابعة المعلقين والمعجبين' : 'Manage your posts and track commenters & followers'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Engagement Overview Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">
              {isRTL ? 'منشوراتك المعلنة' : 'Published Posts'}
            </span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">{myPosts.length}</span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">
              {isRTL ? 'إجمالي الإعجابات' : 'Total Likes'}
            </span>
            <span className="text-lg font-bold text-rose-600 mt-0.5 block flex items-center gap-1.5">
              <Heart size={16} className="fill-rose-500" /> {totalLikes}
            </span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">
              {isRTL ? 'إجمالي التعليقات' : 'Total Comments'}
            </span>
            <span className="text-lg font-bold text-teal-700 mt-0.5 block flex items-center gap-1.5">
              <MessageSquare size={16} className="text-teal-600" /> {totalComments}
            </span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">
              {isRTL ? 'المتابعون' : 'Followers / Following'}
            </span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block flex items-center gap-1.5">
              <Users size={16} className="text-slate-500" /> {followersCount} / {followingCount}
            </span>
          </div>
        </div>

        {/* Posts Feed / Management */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FBFDFE]">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              {isRTL ? 'سجل منشوراتك العلمية' : 'Your Published Case Publications'} ({myPosts.length})
            </h3>
            <button
              onClick={() => {
                onClose();
                onOpenNewCase();
              }}
              className="bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>{isRTL ? 'نشر حالة جديدة' : 'Publish New Case'}</span>
            </button>
          </div>

          {myPosts.length > 0 ? (
            <div className="space-y-6">
              {myPosts.map((post, idx) => (
                <div key={post.id ? `${post.id}-${idx}` : `my-post-${idx}`} className="relative">
                  <SurgicalCommunityPost
                    post={post}
                    isOwnerManagementView={true}
                    onEdit={(c) => setEditingPost(c)}
                    onDelete={(id) => deleteCase(id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
                <FileText size={24} />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">
                {isRTL ? 'لم تقم بنشر أي حالة سريرية في المجتمع حتى الآن' : 'No Published Posts Yet'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {isRTL
                  ? 'يمكنك نشر الحالات السريرية المعقدة أو النموذجية مع الزملاء الجراحين ومتابعة تفاعلهم معها من هنا.'
                  : 'Publish your surgical cases to the community to exchange surgical insights with peer surgeons.'}
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenNewCase();
                }}
                className="mt-2 inline-flex items-center gap-1.5 bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer shadow-xs"
              >
                <Plus size={15} />
                <span>{isRTL ? 'نشر أول حالة الآن' : 'Publish Your First Case Now'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal if owner edits their post */}
      {editingPost && (
        <AddCaseModal
          isOpen={!!editingPost}
          onClose={() => setEditingPost(null)}
          existingCase={editingPost}
          onSave={async (caseData, publishToCommunity) => {
            await updateCase(editingPost.id, caseData);
            setEditingPost(null);
            return editingPost.id;
          }}
        />
      )}
    </div>
  );
};
