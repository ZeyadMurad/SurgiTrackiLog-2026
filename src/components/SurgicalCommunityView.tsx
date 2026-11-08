import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Share2,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Heart,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { translations } from '../lib/i18n';
import { ClinicalCase } from '../types';
import { SurgeonsCarousel } from './SurgeonsCarousel';
import { SurgicalCommunityPost } from './SurgicalCommunityPost';
import { DoctorProfileModal } from './DoctorProfileModal';
import { AddCaseModal } from './AddCaseModal';
import { SURGICAL_SPECIALTIES } from '../lib/medicalDefaults';

export const SurgicalCommunityView: React.FC = () => {
  const { communityCases, allDoctors, addCase, updateCase, deleteCase } = useData();
  const { profile, language } = useAuth();
  const t = translations[language] || translations.en;
  const isRTL = language === 'ar';

  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCase, setEditingCase] = useState<ClinicalCase | null>(null);

  const specialties = ['All', ...SURGICAL_SPECIALTIES];

  const filteredPosts = communityCases.filter(post => {
    const q = search.toLowerCase();
    const matchSearch =
      post.caseReference.toLowerCase().includes(q) ||
      post.primaryDiagnosis.toLowerCase().includes(q) ||
      post.hospital.toLowerCase().includes(q) ||
      (post.authorName && post.authorName.toLowerCase().includes(q)) ||
      (post.surgicalProcedure?.procedureName && post.surgicalProcedure.procedureName.toLowerCase().includes(q));

    const matchSpec =
      selectedSpecialty === 'All' ||
      post.specialty === selectedSpecialty ||
      post.authorSpecialty === selectedSpecialty;

    return matchSearch && matchSpec;
  });

  const handleSelectDoctorById = (doctorId: string) => {
    const doc = allDoctors.find(d => d.userId === doctorId);
    if (doc) setSelectedDoctor(doc);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Community Header Banner */}
      <div className="bg-gradient-to-r from-[#101C32] via-[#0E4646] to-[#0D9488] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-teal-950/10">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-teal-200 text-xs font-semibold border border-white/10">
            <Users size={14} />
            <span>{isRTL ? 'المجتمع الجراحي الطبي التفاعلي' : 'Peer Surgical Community & Colleague Network'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {isRTL ? 'شبكة الأطباء والجراحين وتبادل الحالات' : 'Connect, Follow Colleagues & Share Clinical Cases'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {isRTL
              ? 'تفاعل مع أقرانك من الجراحين، تابع زملاءك، وانشر الحالات السريرية المعقدة بنموذج علمي محكم.'
              : 'Follow peer surgeons, review certified case records, discuss operative strategies, and exchange clinical expertise.'}
          </p>

          <div className="pt-3 flex items-center gap-3">
            <button
              onClick={() => {
                setEditingCase(null);
                setShowAddModal(true);
              }}
              className="bg-white hover:bg-teal-50 text-teal-900 font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} />
              <span>{isRTL ? 'نشر حالة سريرية في المجتمع' : 'Publish Surgical Case to Community'}</span>
            </button>
          </div>
        </div>

        {/* Ambient subtle decorative circles */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 1. Circular Surgeons Avatars Carousel */}
      <SurgeonsCarousel
        onSelectDoctor={(doc) => setSelectedDoctor(doc)}
      />

      {/* 2. Filter & Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRTL ? 'ابحث عن حالة، تشخيص، عملية، أو جراح...' : 'Search clinical cases, diagnoses, procedures, or surgeons...'}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
          >
            {specialties.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Feed of Published Surgical Cases */}
      <div className="space-y-6">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, idx) => (
            <SurgicalCommunityPost
              key={post.id ? `${post.id}-${idx}` : `post-${idx}`}
              post={post}
              onEdit={(c) => {
                setEditingCase(c);
                setShowAddModal(true);
              }}
              onDelete={deleteCase}
              onSelectDoctor={handleSelectDoctorById}
            />
          ))
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
              <BookOpen size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {isRTL ? 'لم يتم العثور على حالات منشورة مطابقة' : 'No Published Cases Matching Filter'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isRTL ? 'جرب تغيير كلمات البحث أو التخصص، أو قم بنشر أول حالة جراحية لك الآن.' : 'Try adjusting your search criteria or publish your surgical case to the community.'}
            </p>
            <button
              onClick={() => {
                setEditingCase(null);
                setShowAddModal(true);
              }}
              className="mt-2 inline-flex items-center gap-1.5 bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              <span>{isRTL ? 'نشر حالة جديدة' : 'Publish New Case'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Doctor Profile Modal */}
      {selectedDoctor && (
        <DoctorProfileModal
          doctor={selectedDoctor}
          isOpen={!!selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onOpenCaseDetail={(c) => {
            // Can open or scroll to that case
            setSelectedDoctor(null);
            setSearch(c.caseReference);
          }}
        />
      )}

      {/* Add / Edit Case Modal */}
      {showAddModal && (
        <AddCaseModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingCase(null);
          }}
          existingCase={editingCase}
          onSave={async (caseData, publishToCommunity) => {
            if (editingCase) {
              await updateCase(editingCase.id, caseData);
              return editingCase.id;
            } else {
              return await addCase(caseData, publishToCommunity ?? true);
            }
          }}
        />
      )}
    </div>
  );
};
