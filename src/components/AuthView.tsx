import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  Camera,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { translations } from '../lib/i18n';
import { SURGICAL_SPECIALTIES, TRAINEE_POSITIONS } from '../lib/medicalDefaults';

export const AuthView: React.FC = () => {
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    resetPasswordDirect,
    language,
    setLanguage,
  } = useAuth();

  const t = translations[language] || translations.en;
  const isRTL = language === 'ar';

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Registration Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('Germany');
  const [qualification, setQualification] = useState('MD / MBBS');
  const [position, setPosition] = useState(TRAINEE_POSITIONS[1]);
  const [specialty, setSpecialty] = useState('General Surgery');
  const [hospitals, setHospitals] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string>('');

  // Forgot password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Complete Registration — the account is created and activated instantly.
  // The user enters the platform immediately; all later sign-ins use
  // email + password only, and any mismatch is rejected.
  const handleInitiateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage(isRTL ? 'يرجى إدخال بريد إلكتروني صالح.' : 'Please enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        isRTL
          ? 'كلمتا المرور غير متطابقتين. يرجى إعادة إدخالهما للتطابق.'
          : 'Passwords do not match. Please ensure both password fields are identical.'
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        isRTL
          ? 'كلمة المرور يجب ألا تقل عن 6 خانات لضمان أمان الحساب.'
          : 'Password must be at least 6 characters long.'
      );
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail({
        email: email.trim(),
        password,
        fullName,
        country,
        medicalQualification: qualification,
        currentPosition: position,
        specialty,
        hospitals,
        profilePhotoUrl: profilePhoto,
      });

      setSuccessMessage(
        isRTL
          ? `تم إنشاء حسابك وتفعيله بنجاح! يتم الآن الدخول المباشر إلى محفظتك الجراحية. في المرات القادمة يمكنك تسجيل الدخول مباشرة بالبريد (${email}) وكلمة المرور.`
          : `Your account has been created and activated! Entering your surgical portfolio now. Next time, sign in directly with your email (${email}) and password.`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage(isRTL ? 'يرجى إدخال البريد الإلكتروني المسجل.' : 'Please enter your registered email.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(
        isRTL
          ? 'كلمة المرور الجديدة يجب ألا تقل عن 6 خانات.'
          : 'New password must be at least 6 characters long.'
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage(
        isRTL
          ? 'كلمتا المرور غير متطابقتين.'
          : 'New passwords do not match.'
      );
      return;
    }

    setLoading(true);
    try {
      await resetPasswordDirect(email, newPassword);
      setSuccessMessage(
        isRTL
          ? 'تم تحديث وتعيين كلمة المرور الجديدة بنجاح! يمكنك الآن تسجيل الدخول مباشرة بكلمة المرور الجديدة.'
          : 'Password updated successfully! You can now log in immediately using your new password.'
      );
      setPassword(newPassword);
      setTimeout(() => {
        setMode('login');
        setSuccessMessage('');
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#0c1424] via-[#101C32] to-[#0f1f33] text-slate-100 flex flex-col justify-between p-4 sm:p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Top Header with LTR Logo & Language Toggle */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-lg border border-teal-500/40 bg-[#101C32] shrink-0">
            <img
              src="/icon-192.png"
              alt="SurgiTrack iLog"
              className="w-full h-full object-cover"
            />
          </div>
          <div dir="ltr" className="text-left">
            <h1 className="text-xl font-extrabold tracking-tight whitespace-nowrap flex items-center gap-1.5" dir="ltr">
              <span className="text-white">SurgiTrack</span>
              <span className="text-teal-400">iLog</span>
              <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-400/30 uppercase">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block whitespace-nowrap" dir="ltr">
              Professional Surgical Training & Clinical Portfolio
            </p>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10 text-xs font-bold">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              language === 'en' ? 'bg-[#0D9488] text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('ar')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              language === 'ar' ? 'bg-[#0D9488] text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            عربي
          </button>
          <button
            onClick={() => setLanguage('de')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              language === 'de' ? 'bg-[#0D9488] text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            DE
          </button>
        </div>
      </div>

      {/* Center Auth Card */}
      <div className="max-w-xl w-full mx-auto my-auto py-6">
        <div className="bg-white text-slate-800 rounded-3xl shadow-2xl border border-teal-500/30 overflow-hidden">
          {/* Card Top Banner */}
          <div className="bg-[#101C32] px-6 py-5 text-white flex items-center justify-between border-b border-teal-500/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md border border-teal-400/40 bg-slate-900 shrink-0">
                <img
                  src="/icon-192.png"
                  alt="SurgiTrack iLog"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                  <span dir="ltr" className="whitespace-nowrap inline-flex items-center gap-1 font-extrabold">
                    <span className="text-white">SurgiTrack</span>
                    <span className="text-teal-400">iLog</span>
                  </span>
                  <span>
                    {mode === 'login'
                      ? (isRTL ? '— تسجيل الدخول' : '— Sign In')
                      : mode === 'register'
                      ? (isRTL ? '— تسجيل حساب جديد' : '— New Registration')
                      : (isRTL ? '— تعيين كلمة المرور' : '— Reset Password')}
                  </span>
                </h2>
                <p className="text-xs text-slate-300">
                  {isRTL
                    ? 'منصة توثيق الحالات والعمليات والملف التدريبي الجراحي'
                    : 'Verified Clinical Logbook & Surgical Hours Certification'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold bg-teal-950/70 text-teal-300 px-3 py-1 rounded-full border border-teal-500/40">
              <ShieldCheck size={14} />
              <span>{isRTL ? 'دخول آمن' : 'Secured'}</span>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`py-3.5 text-center transition cursor-pointer border-b-2 ${
                mode === 'login'
                  ? 'border-[#0D9488] text-[#0D9488] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {isRTL ? 'تسجيل الدخول' : language === 'de' ? 'Anmelden' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`py-3.5 text-center transition cursor-pointer border-b-2 ${
                mode === 'register'
                  ? 'border-[#0D9488] text-[#0D9488] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {isRTL ? 'إنشاء حساب جديد' : language === 'de' ? 'Konto erstellen' : 'Create Account'}
            </button>
          </div>

          {/* Feedback Messages */}
          <div className="p-6 pb-0 space-y-3">
            {errorMessage && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-start gap-2.5">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{successMessage}</span>
              </div>
            )}
          </div>

          {/* Form Content */}
          <div className="p-6">
            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRTL ? 'البريد الإلكتروني المسجل *' : 'Registered Email Address *'}
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="surgeon@hospital.org"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      {isRTL ? 'كلمة المرور *' : 'Password *'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="text-[11px] text-teal-700 hover:underline font-bold cursor-pointer"
                    >
                      {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-md shadow-teal-900/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Authenticating...' : isRTL ? 'تسجيل الدخول إلى المحفظة الجراحية' : 'Sign In to SurgiTrack'}</span>
                  <ArrowRight size={15} />
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400 bg-white px-2">
                    {isRTL ? 'أو الدخول بنقرة واحدة عبر Google' : 'Or Single Sign-On with Google'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className="w-full flex items-center justify-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isRTL ? 'الدخول بحساب Google' : 'Sign in with Google'}</span>
                </button>

                <p className="text-[10px] text-slate-400 text-center leading-relaxed pt-1">
                  {isRTL
                    ? 'يقوم النظام بالتحقق من تطابق البريد الإلكتروني وكلمة المرور تماماً، ويتم رفض الدخول فوراً عند أي اختلاف.'
                    : 'The system matches your email and password exactly — any mismatch results in immediate sign-in rejection.'}
                </p>
              </form>
            )}

            {/* REGISTER FORM */}
            {mode === 'register' && (
              <form onSubmit={handleInitiateRegistration} className="space-y-3.5">
                {/* Profile Photo */}
                <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="relative w-14 h-14 rounded-2xl bg-slate-200 overflow-hidden border border-slate-300 flex items-center justify-center shrink-0">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User size={26} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-800 block">
                      {isRTL ? 'صورة الطبيب الشخصية (اختيارية)' : 'Profile Photo (Optional)'}
                    </span>
                    <label className="inline-flex items-center gap-1.5 text-xs text-teal-700 font-bold hover:underline cursor-pointer mt-1">
                      <Camera size={13} />
                      <span>{isRTL ? 'اختر صورة من جهازك' : 'Upload photo'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isRTL ? 'الاسم الكامل *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Dr. Full Name"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isRTL ? 'البريد الإلكتروني الحقيقي *' : 'Real Email Address *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="real-doctor@hospital.org"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isRTL ? 'كلمة المرور *' : 'Password (min. 6 chars) *'}
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isRTL ? 'تأكيد كلمة المرور *' : 'Confirm Password *'}
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isRTL ? 'المؤهل الطبي *' : 'Medical Qualification *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="MD / MBBS / Facharzt"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isRTL ? 'المسمى الوظيفي *' : 'Current Position *'}
                    </label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                    >
                      {TRAINEE_POSITIONS.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isRTL ? 'التخصص الجراحي *' : 'Surgical Specialty *'}
                    </label>
                    <select
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                    >
                      {SURGICAL_SPECIALTIES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isRTL ? 'بلد الممارسة *' : 'Country *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Germany / UK / Egypt..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRTL ? 'المستشفى أو المركز السريري' : 'Hospital / Clinical Center'}
                  </label>
                  <input
                    type="text"
                    value={hospitals}
                    onChange={(e) => setHospitals(e.target.value)}
                    placeholder="University Hospital Hamburg-Eppendorf / Charité"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex items-start gap-2 p-3 bg-teal-50/70 border border-teal-200 rounded-2xl text-[11px] text-teal-900 leading-relaxed">
                  <Sparkles size={14} className="text-teal-600 shrink-0 mt-0.5" />
                  <span>
                    {isRTL
                      ? 'يتم تفعيل الحساب فور التسجيل مباشرة دون أي خطوات إضافية. تُحفظ بياناتك بأمان، وتدخل في المرات القادمة ببساطة عبر البريد وكلمة المرور.'
                      : 'Your account is activated instantly upon registration — no extra steps. Your credentials are stored securely, and future sign-ins use simply your email and password.'}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-md shadow-teal-900/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Processing...' : isRTL ? 'إنشاء الحساب والدخول مباشرة' : 'Create Account & Enter Now'}</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}

            {/* DIRECT PASSWORD RESET FORM */}
            {mode === 'forgot' && (
              <form onSubmit={handleDirectPasswordReset} className="space-y-4">
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 leading-relaxed">
                  <strong className="block font-bold mb-1">
                    {isRTL ? 'إعادة تعيين كلمة المرور المباشرة الفورية:' : 'Instant Direct Password Reset:'}
                  </strong>
                  <span>
                    {isRTL
                      ? 'أدخل بريدك الإلكتروني المسجل وضع كلمة مرور جديدة مباشرة. سيتم تحديث كلمة المرور في حسابك فوراً دون الحاجة للانتظار.'
                      : 'Enter your registered email address and define your new password directly below to update it instantly.'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRTL ? 'البريد الإلكتروني المسجل *' : 'Registered Email Address *'}
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="surgeon@hospital.org"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRTL ? 'كلمة المرور الجديدة *' : 'New Password *'}
                  </label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRTL ? 'تأكيد كلمة المرور الجديدة *' : 'Confirm New Password *'}
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {isRTL ? 'إلغاء والعودة' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    {loading ? 'Updating...' : isRTL ? 'تحديث كلمة المرور والدخول' : 'Update Password & Proceed'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer Credentials */}
      <div className="max-w-6xl w-full mx-auto text-center py-2 text-xs text-slate-400" dir="ltr">
        <p>
          SurgiTrack – Professional Surgical Training, Clinical Logbook & Medical Portfolio Platform © 2026.
        </p>
      </div>
    </div>
  );
};
