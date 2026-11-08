import React, { useState } from 'react';
import { User, Mail, Globe, Shield, Lock, Trash2, LogOut, CheckCircle2, Camera, Upload, AlertTriangle, X, Eye, EyeOff, UserCheck, UserPlus, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { SupportedLanguage } from '../types';
import { SURGICAL_SPECIALTIES, TRAINEE_POSITIONS } from '../lib/medicalDefaults';

interface UserProfileViewProps {
  onNavigateToBackup: () => void;
  onOpenYourPosts?: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ onNavigateToBackup, onOpenYourPosts }) => {
  const { profile, user, updateUserProfile, updateProfilePhoto, setLanguage, language, logout, deleteCurrentAccount, resetPasswordDirect } = useAuth();
  const { allDoctors, acceptFollowRequest, declineFollowRequest } = useData();
  const isRTL = language === 'ar';

  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [country, setCountry] = useState(profile?.country || 'Germany');
  const [qualification, setQualification] = useState(profile?.medicalQualification || 'MD, Medical Specialist');
  const [position, setPosition] = useState(profile?.currentPosition || 'Surgical Trainee');
  const [specialty, setSpecialty] = useState(profile?.specialty || 'General Surgery');
  const [hospitals, setHospitals] = useState(profile?.hospitals || 'University Medical Center');
  const [biography, setBiography] = useState(profile?.biography || '');
  const [showProgressStats, setShowProgressStats] = useState(profile?.showProgressStats !== false);
  const [showPortfolioToFollowers, setShowPortfolioToFollowers] = useState(profile?.showPortfolioToFollowers ?? true);
  const [requireApprovalToFollow, setRequireApprovalToFollow] = useState(profile?.requireApprovalToFollow ?? false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  // Modals for Logout and Delete
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async () => {
        const photoUrl = reader.result as string;
        await updateProfilePhoto(photoUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      fullName,
      country,
      medicalQualification: qualification,
      currentPosition: position,
      specialty,
      hospitals,
      biography,
      showProgressStats,
      showPortfolioToFollowers,
      requireApprovalToFollow,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError(isRTL ? 'كلمة المرور يجب ألا تقل عن 6 خانات' : 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError(isRTL ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    const email = profile?.email || user?.email;
    if (!email) {
      setPasswordError(isRTL ? 'البريد الإلكتروني غير معروف' : 'User email not found');
      return;
    }

    setPasswordUpdating(true);
    try {
      await resetPasswordDirect(email, newPassword);
      setPasswordSuccess(true);
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
        setNewPassword('');
        setConfirmNewPassword('');
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCurrentAccount();
    } catch (err: any) {
      setDeleteError(`Account deletion error: ${err.message || 'Failed to delete'}`);
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner with Profile Photo & Quick Action Icons */}
      <div className="bg-[#101C32] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-teal-500/30">
        <div className="flex items-center gap-5">
          {/* Avatar with Camera Overlay */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 rounded-3xl overflow-hidden bg-slate-800 border-2 border-teal-400 shadow-md flex items-center justify-center">
              {profile?.profilePhotoUrl ? (
                <img
                  src={profile.profilePhotoUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-teal-300">
                  {fullName ? fullName.substring(0, 2).toUpperCase() : 'DR'}
                </span>
              )}
            </div>

            <label className="absolute inset-0 bg-slate-950/60 rounded-3xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition cursor-pointer text-white">
              <Camera size={18} />
              <span className="text-[9px] font-bold mt-0.5">{isRTL ? 'تغيير' : 'Change'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{fullName || 'Surgeon Trainee'}</h2>
            <p className="text-xs text-teal-300 font-semibold mt-0.5">
              {position} • {specialty}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">{profile?.email || user?.email}</p>
          </div>
        </div>

        {/* Quick Clickable Action Icons for Your Posts, Logout, Password Change, and Delete */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Your Posts Button */}
          {onOpenYourPosts && (
            <button
              onClick={onOpenYourPosts}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white border border-teal-400 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer"
              title={isRTL ? 'متابعة منشوراتي والمعلقين عليها' : 'Manage Your Published Posts'}
            >
              <MessageSquare size={16} />
              <span>{isRTL ? 'منشوراتك' : 'Your Posts'}</span>
            </button>
          )}

          {/* Change Password Button */}
          <button
            onClick={() => {
              setShowPasswordModal(true);
              setPasswordError('');
              setPasswordSuccess(false);
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer"
            title="Change Password"
          >
            <Lock size={16} className="text-teal-400" />
            <span>{isRTL ? 'تغيير كلمة المرور' : 'Change Password'}</span>
          </button>

          {/* Logout Icon Button */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer"
            title="Log Out of SurgiTrack"
          >
            <LogOut size={16} className="text-amber-400" />
            <span>{isRTL ? 'تسجيل الخروج' : 'Log Out'}</span>
          </button>

          {/* Delete Account Icon Button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 bg-red-950/50 hover:bg-red-900/80 text-red-200 border border-red-800/50 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer"
            title="Delete Account Permanently"
          >
            <Trash2 size={16} className="text-red-400" />
            <span>{isRTL ? 'حذف الحساب' : 'Delete Account'}</span>
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {isRTL ? 'المعلومات الشخصية والاعتماد الطبي' : 'Professional Profile & Medical Credentials'}
          </h3>
          <p className="text-xs text-slate-500">
            {isRTL
              ? 'تستخدم هذه المعلومات تلقائياً في ترويسات التقارير وخطابات التوصية ومحافظ التدريب.'
              : 'These credentials automatically populate your supervisor portfolios, recommendation letters, and official logbooks.'}
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isRTL ? 'الاسم المهني الكامل *' : 'Full Professional Name *'}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isRTL ? 'المؤهلات والشهادات الطبية *' : 'Medical Qualifications / Degrees *'}
              </label>
              <input
                type="text"
                required
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isRTL ? 'المسمى الوظيفي الحالي *' : 'Current Professional Position *'}
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-teal-500"
              >
                {TRAINEE_POSITIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isRTL ? 'التخصص الجراحي الأساسي *' : 'Primary Surgical Specialty *'}
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-teal-500"
              >
                {SURGICAL_SPECIALTIES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isRTL ? 'المستشفيات والمراكز التابعة *' : 'Hospital Affiliations *'}
              </label>
              <input
                type="text"
                required
                value={hospitals}
                onChange={(e) => setHospitals(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isRTL ? 'دولة الممارسة الطبية *' : 'Country of Practice *'}
              </label>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isRTL ? 'نبذة جراحية وسيرة مهنية مختصرة' : 'Professional Surgical Biography'}
            </label>
            <textarea
              rows={3}
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Medical Privacy & Social Visibility Controls */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Shield size={14} className="text-teal-600" />
              <span>{isRTL ? 'إعدادات الخصوصية والظهور للمتابعين' : 'Doctor Privacy & Community Visibility Controls'}</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              {isRTL
                ? 'تحكم بما يظهر للمتابعين وزملائك الأطباء عند زيارة ملفك الشخصي'
                : 'Choose what statistics and portfolio records are visible to colleagues and followers'}
            </p>

            <div className="space-y-2 pt-1">
              <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-teal-400 transition">
                <div className="pr-2">
                  <span className="font-semibold text-xs text-slate-800 block">
                    {isRTL ? 'عرض نسبة التقدم وساعات التدريب للمتابعين' : 'Show Progress Stats & Training Hours to Followers'}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {isRTL ? 'عند التعطيل، ستكون ساعاتك التدريبية والعمليات مخفية وخاصة بك فقط' : 'When disabled, your training hours and surgical numbers remain private'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showProgressStats}
                  onChange={(e) => setShowProgressStats(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer shrink-0"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-teal-400 transition">
                <div className="pr-2">
                  <span className="font-semibold text-xs text-slate-800 block">
                    {isRTL ? 'السماح للمتابعين بالاطلاع على المحفظة الجراحية' : 'Allow Followers to View Shared Portfolio'}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {isRTL ? 'مشاركة الحالات السريرية والمهارات المعتمدة مع المتابعين' : 'Share clinical cases and verified competency matrix with colleagues'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showPortfolioToFollowers}
                  onChange={(e) => setShowPortfolioToFollowers(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer shrink-0"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-teal-400 transition">
                <div className="pr-2">
                  <span className="font-semibold text-xs text-slate-800 block">
                    {isRTL ? 'الموافقة اليدوية على طلبات المتابعة (حساب خاص)' : 'Require Approval for Follow Requests (Private Profile)'}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {isRTL ? 'لا يتمكن أي طبيب من متابعتك وتصفح حالاتك إلا بعد قبولك لطلبه' : 'Colleagues must send a request that you approve before following you'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={requireApprovalToFollow}
                  onChange={(e) => setRequireApprovalToFollow(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer shrink-0"
                />
              </label>
            </div>
          </div>

          {/* Pending Follow Requests (if any) */}
          {(profile?.pendingFollowRequests && profile.pendingFollowRequests.length > 0) && (
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-2.5">
              <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <UserPlus size={14} className="text-amber-700" />
                <span>{isRTL ? 'طلبات متابعة بانتظار موافقتك' : 'Pending Colleague Follow Requests'}</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full font-mono">
                  {profile.pendingFollowRequests.length}
                </span>
              </h4>
              <div className="space-y-2">
                {profile.pendingFollowRequests.map((reqUid) => {
                  const reqDoctor = allDoctors.find(d => d.userId === reqUid);
                  return (
                    <div key={reqUid} className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-xs text-slate-900">{reqDoctor?.fullName || reqUid}</p>
                        <p className="text-[10px] text-slate-500">{reqDoctor?.specialty || reqDoctor?.hospital || 'Surgeon'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => acceptFollowRequest(reqUid)}
                          className="bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs cursor-pointer"
                        >
                          {isRTL ? 'قبول' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          onClick={() => declineFollowRequest(reqUid)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg cursor-pointer"
                        >
                          {isRTL ? 'رفض' : 'Decline'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5 text-xs">
                <CheckCircle2 size={16} /> {isRTL ? 'تم حفظ التعديلات بنجاح!' : 'Profile updated successfully!'}
              </span>
            ) : <span />}

            <button
              type="submit"
              className="bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
            >
              {isRTL ? 'حفظ البيانات' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {isRTL ? 'تغيير كلمة المرور' : 'Change Password'}
                  </h3>
                  <p className="text-[11px] text-slate-500">{profile?.email || user?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-1.5">
                <CheckCircle2 size={16} />
                <span>{isRTL ? 'تم تحديث كلمة المرور بنجاح!' : 'Password updated successfully!'}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isRTL ? 'كلمة المرور الجديدة *' : 'New Password *'}
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isRTL ? 'تأكيد كلمة المرور الجديدة *' : 'Confirm New Password *'}
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={passwordUpdating}
                  className="px-4 py-2 bg-[#0D9488] hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {passwordUpdating ? 'Updating...' : isRTL ? 'حفظ كلمة المرور' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <LogOut size={24} />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {isRTL ? 'تأكيد تسجيل الخروج' : 'Confirm Sign Out'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isRTL
                ? 'هل أنت متأكد من رغبتك في تسجيل الخروج؟ ستتم إعادتك لواجهة الدخول مباشرة.'
                : 'Are you sure you want to log out? You will be returned to the sign-in screen.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 border border-slate-300 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={logout}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {isRTL ? 'تسجيل الخروج' : 'Log Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Account */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl border border-red-200">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {isRTL ? 'تحذير: حذف الحساب بشكل دائم' : 'Permanent Account Deletion'}
            </h3>
            <p className="text-xs text-red-700 bg-red-50 p-3 rounded-xl border border-red-200 text-left leading-relaxed">
              {isRTL
                ? 'تنبيه نهائي: سيؤدي هذا الإجراء إلى حذف حسابك بالكامل من المنصة ومن قاعدة البيانات السحابية بصورة لا يمكن التراجع عنها. ستتم إعادتك لشاشة تسجيل الدخول.'
                : 'Warning: This action will permanently remove your user authentication record and private cloud profile from SurgiTrack. This cannot be undone.'}
            </p>
            {deleteError && (
              <p className="text-xs text-red-800 bg-red-100 p-2.5 rounded-xl border border-red-300 font-semibold text-left">
                {deleteError}
              </p>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-slate-300 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                {deleting ? 'Deleting...' : isRTL ? 'تأكيد حذف الحساب نهائياً' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
