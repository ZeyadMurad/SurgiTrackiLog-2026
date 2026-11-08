import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Trash2,
  Search,
  CheckCircle2,
  Lock,
  Shield,
  AlertTriangle,
  RefreshCw,
  Bell,
  Send,
  MessageSquare,
  Sparkles,
  Calendar,
  Layers,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserProfile, AppNotification } from '../types';

export const AdminPanelView: React.FC = () => {
  const {
    profile,
    user,
    getAllRegisteredUsers,
    adminDeleteUserAccount,
    broadcastNotification,
    notificationReplies,
    notifications,
    language
  } = useAuth();

  const isRTL = language === 'ar';
  const isSuperAdmin = user?.email === 'zeadmorud2030@gmail.com' || profile?.role === 'super_admin';

  const [activeTab, setActiveTab] = useState<'users' | 'broadcast' | 'replies'>('users');
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Broadcast modal/form state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifCategory, setNotifCategory] = useState<AppNotification['category']>('general');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllRegisteredUsers();
      setUsersList(data);
    } catch (e) {
      console.warn('Failed to load registered users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadUsers();
    }
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs">
        <Lock className="mx-auto text-slate-400 mb-3" size={36} />
        <h3 className="text-base font-bold text-slate-800">
          {isRTL ? 'منطقة محظورة - خاصة بالمدير العام فقط' : 'Restricted Super Administrator Area'}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {isRTL
            ? 'هذه اللوحة خاصة حصرياً بالمدير العام (zeadmorud2030@gmail.com) لإدارة الحسابات ولا تظهر لبقية المستخدمين.'
            : 'Access restricted exclusively to the platform administrator (zeadmorud2030@gmail.com).'}
        </p>
      </div>
    );
  }

  // Deletion logic that sets real-time lockout trigger
  const handleDeleteUser = async () => {
    if (!selectedUserToDelete) return;
    setDeleting(true);
    setActionError('');
    try {
      await adminDeleteUserAccount(selectedUserToDelete.userId);
      setUsersList(prev => prev.filter(u => u.userId !== selectedUserToDelete.userId));
      setActionSuccess(
        isRTL
          ? `تم حذف حساب المستخدم (${selectedUserToDelete.fullName}) نهائياً، وتم إغلاق تطبيقه فورياً عبر الاتصال الحي.`
          : `User account (${selectedUserToDelete.fullName}) was deleted permanently and terminated in real-time.`
      );
      setSelectedUserToDelete(null);
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err: any) {
      setActionError(`Failed to delete user: ${err.message || 'Unknown error'}`);
      setTimeout(() => setActionError(''), 6000);
    } finally {
      setDeleting(false);
    }
  };

  // Broadcast notification logic
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    setSendingBroadcast(true);
    setActionError('');
    try {
      await broadcastNotification({
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        category: notifCategory,
      });

      setActionSuccess(
        isRTL
          ? 'تم إرسال الإشعار بنجاح إلى جميع الأطباء والمستخدمين في التطبيق!'
          : 'Broadcast notification successfully sent to all users!'
      );
      setNotifTitle('');
      setNotifMessage('');
      setShowBroadcastModal(false);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      setActionError(`Error broadcasting notification: ${err.message || 'Unknown error'}`);
      setTimeout(() => setActionError(''), 6000);
    } finally {
      setSendingBroadcast(false);
    }
  };

  const filteredUsers = usersList.filter(u =>
    (u.fullName && u.fullName.toLowerCase().includes(search.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
    (u.specialty && u.specialty.toLowerCase().includes(search.toLowerCase())) ||
    (u.hospitals && u.hospitals.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-[#101C32] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-teal-500/30">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 bg-teal-950/80 px-2.5 py-1 rounded-md border border-teal-500/40">
              {isRTL ? 'إدارة المنصة والرقابة العامة' : 'Master Control & User Management'}
            </span>
            <span className="text-[10px] bg-red-950/80 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
              SUPER_ADMIN
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert size={24} className="text-teal-400" />
            <span>{isRTL ? 'لوحة تحكم المدير العام' : 'Super Administrator Control Center'}</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
            {isRTL
              ? 'مخصصة حصرياً للمدير العام (zeadmorud2030@gmail.com). تتيح لك إرسال إشعارات عامة لكافة الأطباء، ومتابعة ردودهم، وحذف أي حساب مخالف حيث ينغلق التطبيق فورياً على جهاز المستخدم ويصله تنبيه رسمي.'
              : 'Authorized exclusively for zeadmorud2030@gmail.com to broadcast notifications, read user replies, and delete violating accounts with instant session termination.'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-teal-900/30 cursor-pointer"
          >
            <Bell size={15} />
            <span>{isRTL ? 'إرسال إشعار لجميع المستخدمين' : 'Broadcast Notification'}</span>
          </button>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{isRTL ? 'تحديث السجل' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2 animate-fadeIn">
          <ShieldAlert size={16} className="text-red-600 shrink-0" />
          <span className="font-semibold">{actionError}</span>
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit text-xs font-bold">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'users' ? 'bg-[#101C32] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users size={14} />
          <span>{isRTL ? `المستخدمون المسجلون (${usersList.length})` : `Users Directory (${usersList.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('replies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer relative ${
            activeTab === 'replies' ? 'bg-[#101C32] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare size={14} />
          <span>{isRTL ? `ردود المستخدمين على الإشعارات (${notificationReplies.length})` : `User Replies (${notificationReplies.length})`}</span>
          {notificationReplies.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'broadcast' ? 'bg-[#101C32] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell size={14} />
          <span>{isRTL ? `الإشعارات المرسلة (${notifications.length})` : `Sent Broadcasts (${notifications.length})`}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              {isRTL ? 'إجمالي الحسابات المسجلة' : 'Registered Accounts'}
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-0.5 block">{usersList.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Bell size={24} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              {isRTL ? 'الإشعارات العامة الصادرة' : 'Admin Broadcasts'}
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-0.5 block">{notifications.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <MessageSquare size={24} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              {isRTL ? 'ردود الأطباء والمستخدمين' : 'Practitioner Replies'}
            </span>
            <span className="text-2xl font-bold text-emerald-800 mt-0.5 block">{notificationReplies.length}</span>
          </div>
        </div>
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-teal-600" />
                <span>{isRTL ? 'سجل الأطباء والمستخدمين المسجلين' : 'Practitioners & Registered Users Directory'}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {isRTL ? 'معاينة تفاصيل الحسابات وإمكانية حذف أي حساب مخالف فورياً' : 'View registered surgeon details and remove violating accounts'}
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isRTL ? 'بحث بالاسم، الإيميل، التخصص...' : 'Search users...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <RefreshCw size={22} className="animate-spin mx-auto text-teal-600 mb-2" />
              <span>Loading registered practitioners...</span>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">{isRTL ? 'الطبيب / المستخدم' : 'Practitioner'}</th>
                    <th className="p-3.5">{isRTL ? 'البريد الإلكتروني' : 'Email Address'}</th>
                    <th className="p-3.5">{isRTL ? 'التخصص والمسمى' : 'Specialty & Position'}</th>
                    <th className="p-3.5">{isRTL ? 'المستشفى والدولة' : 'Hospital & Country'}</th>
                    <th className="p-3.5">{isRTL ? 'الرتبة' : 'Role'}</th>
                    <th className="p-3.5 text-right">{isRTL ? 'الإجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(u => {
                    const isOwnerAdmin = u.email === 'zeadmorud2030@gmail.com';
                    return (
                      <tr key={u.userId} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-xs">
                              {u.profilePhotoUrl ? (
                                <img src={u.profilePhotoUrl} alt={u.fullName} className="w-full h-full object-cover rounded-xl" />
                              ) : (
                                u.fullName ? u.fullName.substring(0, 2).toUpperCase() : 'DR'
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{u.fullName}</span>
                              <span className="text-[10px] text-slate-400">{u.medicalQualification}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 font-mono text-slate-600">{u.email}</td>

                        <td className="p-3.5">
                          <span className="font-semibold text-slate-800 block">{u.specialty}</span>
                          <span className="text-[10px] text-slate-500">{u.currentPosition}</span>
                        </td>

                        <td className="p-3.5">
                          <span className="font-semibold text-slate-800 block">{u.hospitals || 'General Clinic'}</span>
                          <span className="text-[10px] text-slate-500">{u.country}</span>
                        </td>

                        <td className="p-3.5">
                          {isOwnerAdmin ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                              Super Admin
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              Normal User
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-right">
                          {!isOwnerAdmin ? (
                            <button
                              onClick={() => setSelectedUserToDelete(u)}
                              className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer"
                              title="Delete violating user account"
                            >
                              <Trash2 size={13} />
                              <span>{isRTL ? 'حذف الحساب' : 'Delete'}</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">Protected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-xs text-slate-400">
              No users match your search query.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USER REPLIES TO NOTIFICATIONS */}
      {activeTab === 'replies' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <MessageSquare size={16} className="text-teal-600" />
                <span>{isRTL ? 'رسائل وردود المستخدمين على الإشعارات' : 'User Responses to Admin Broadcasts'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRTL ? 'جميع الردود والتعليقات التي أرسلها الأطباء استجابةً لإشعارات الإدارة العامة.' : 'All feedback and responses submitted by doctors regarding announcements.'}
              </p>
            </div>
          </div>

          {notificationReplies.length > 0 ? (
            <div className="space-y-3">
              {notificationReplies.map((reply) => (
                <div key={reply.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{reply.userName}</span>
                      <span className="font-mono text-slate-500 text-[11px]">({reply.userEmail})</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(reply.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-[11px] text-teal-800 font-semibold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 w-fit">
                    {isRTL ? 'رداً على إشعار:' : 'In response to:'} {reply.notificationTitle}
                  </div>

                  <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-line">
                    {reply.replyMessage}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400">
              <MessageSquare size={32} className="mx-auto text-slate-300 mb-2" />
              <span>{isRTL ? 'لم يصل أي رد من المستخدمين حتى الآن.' : 'No replies received from users yet.'}</span>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BROADCAST HISTORY */}
      {activeTab === 'broadcast' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Bell size={16} className="text-teal-600" />
                <span>{isRTL ? 'سجل الإشعارات العامة المرسلة' : 'Sent Announcements History'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRTL ? 'الإشعارات التي تم تعميمها على كافة الأطباء والمستخدمين في المنصة.' : 'Broadcasts visible in every user’s notifications center.'}
              </p>
            </div>

            <button
              onClick={() => setShowBroadcastModal(true)}
              className="bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              + {isRTL ? 'إشعار جديد' : 'New Broadcast'}
            </button>
          </div>

          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{notif.title}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                        {notif.category}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-line">
                    {notif.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400">
              <Bell size={32} className="mx-auto text-slate-300 mb-2" />
              <span>{isRTL ? 'لم يتم إرسال أي إشعار بعد.' : 'No broadcasts recorded yet.'}</span>
            </div>
          )}
        </div>
      )}

      {/* Delete User Modal Confirmation */}
      {selectedUserToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-red-200 text-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={26} />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-base">
                {isRTL ? 'تأكيد حذف حساب المستخدم المخالف' : 'Confirm User Account Deletion'}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                {isRTL
                  ? 'سيتم حذف الحساب نهائياً، وسيتم إغلاق التطبيق فورياً على جهاز المستخدم مع إشعاره بأن حسابه قد تم حذفه من قِبل إدارة الموقع.'
                  : 'The account will be deleted permanently, and the user’s active session will be terminated immediately with a lockout alert.'}
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div><strong>Name:</strong> {selectedUserToDelete.fullName}</div>
              <div><strong>Email:</strong> {selectedUserToDelete.email}</div>
              <div><strong>Specialty:</strong> {selectedUserToDelete.specialty}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedUserToDelete(null)}
                className="px-4 py-2 border border-slate-300 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : isRTL ? 'نعم، حذف الحساب وإغلاق تطبيقه' : 'Delete & Terminate Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Notification Modal (Strictly for Super Admin) */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-teal-200 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {isRTL ? 'إرسال إشعار عام لجميع المستخدمين' : 'Broadcast Announcement to All Users'}
                </h3>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRTL ? 'عنوان الإشعار *' : 'Notification Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder={isRTL ? 'مثال: تحديث هام في البروتوكولات الجراحية / صيانة دورية' : 'e.g. Major Platform Update / Surgical Curriculum Announcement'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRTL ? 'نوع وتصنيف الإشعار *' : 'Notification Category *'}
                </label>
                <select
                  value={notifCategory}
                  onChange={(e) => setNotifCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="general">{isRTL ? 'إعلان عام (General)' : 'General Announcement'}</option>
                  <option value="urgent">{isRTL ? 'تنبيه عاجل وهام (Urgent Alert)' : 'Urgent Alert'}</option>
                  <option value="clinical">{isRTL ? 'تحديث سريري وجراحي (Clinical Update)' : 'Clinical & Surgical Update'}</option>
                  <option value="administrative">{isRTL ? 'إداري وتنظيمي (Administrative)' : 'Administrative Notice'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRTL ? 'نص الرسالة والإشعار *' : 'Message Body *'}
                </label>
                <textarea
                  required
                  rows={4}
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder={isRTL ? 'اكتب رسالتك وتوجيهاتك لجميع الأطباء والمستخدمين هنا...' : 'Write the message to be displayed to all practitioners...'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2.5 border border-slate-300 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={sendingBroadcast}
                  className="px-5 py-2.5 bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{sendingBroadcast ? 'Sending...' : isRTL ? 'إرسال الإشعار للجميع الآن' : 'Send Broadcast Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
