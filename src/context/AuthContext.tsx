import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  deleteUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  addDoc,
  updateDoc,
  query,
  where,
  runTransaction,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, SupportedLanguage, AppNotification, NotificationReply, SocialNotification } from '../types';

interface StoredAccountRecord {
  uid: string;
  email: string;
  passwordHash: string;
  fullName: string;
  profile: UserProfile;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (data: Partial<UserProfile> & { password: string }) => Promise<void>;
  resetPasswordDirect: (email: string, newPass: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteCurrentAccount: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateProfilePhoto: (photoDataUrl: string) => Promise<void>;
  setLanguage: (lang: SupportedLanguage) => void;
  language: SupportedLanguage;
  getAllRegisteredUsers: () => Promise<UserProfile[]>;
  adminDeleteUserAccount: (userId: string) => Promise<void>;
  // Community 2.0 — real social graph
  followUser: (followeeId: string, followeeName: string, followeePhotoUrl?: string, followeeSpecialty?: string, requireApproval?: boolean) => Promise<{ status: 'followed' | 'requested' }>;
  unfollowUser: (followeeId: string) => Promise<void>;
  acceptFollowRequest: (followerId: string) => Promise<void>;
  declineFollowRequest: (followerId: string) => Promise<void>;
  notifyCaseLiked: (caseAuthorId: string, caseAuthorName: string, caseId: string, caseTitle: string) => Promise<void>;
  notifyCaseCommented: (caseAuthorId: string, caseAuthorName: string, caseId: string, caseTitle: string, commentText: string) => Promise<void>;
  /** Notify all active followers of the current user that a new case was published. */
  notifyFollowersOfNewCase: (caseId: string, caseTitle: string) => Promise<void>;
  /** Mark every unread social notification for the current user as read. */
  markAllSocialNotificationsAsRead: () => Promise<void>;
  /** Real-time social notifications (follows, likes, comments, new_case) from
   *  the per-user inbox at users/{uid}/socialNotifications. Merged with the
   *  legacy admin `notifications` collection to drive a single unread badge. */
  socialNotifications: SocialNotification[];

  // Real-time Admin Deletion Lockout
  accountDeletedByAdmin: boolean;
  dismissDeletedAccountModal: () => void;

  // Real-time Admin Notifications & Replies
  notifications: AppNotification[];
  unreadNotificationCount: number;
  broadcastNotification: (notif: { title: string; message: string; category: AppNotification['category'] }) => Promise<void>;
  replyToNotification: (notificationId: string, title: string, replyMessage: string) => Promise<void>;
  notificationReplies: NotificationReply[];
  markNotificationAsRead: (notificationId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_PROFILE_KEY = 'surgitrack_cached_profile';
const LOCAL_ACCOUNTS_KEY = 'surgitrack_registered_accounts';
const LOCAL_LANG_KEY = 'surgitrack_language';
const LOCAL_NOTIFS_KEY = 'surgitrack_local_notifications';
const LOCAL_REPLIES_KEY = 'surgitrack_local_replies';
const SUPER_ADMIN_EMAIL = 'zeadmorud2030@gmail.com';

// Cryptographic SHA-256 hash
async function hashPassword(password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_surgitrack_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash = (hash << 5) - hash + password.charCodeAt(i);
      hash |= 0;
    }
    return 'h_' + Math.abs(hash);
  }
}

function getLocalAccounts(): Record<string, StoredAccountRecord> {
  try {
    const data = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveLocalAccount(account: StoredAccountRecord) {
  try {
    const accounts = getLocalAccounts();
    accounts[account.email.toLowerCase()] = account;
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.warn('Could not save local account:', e);
  }
}

function getLocalNotifications(): AppNotification[] {
  try {
    const data = localStorage.getItem(LOCAL_NOTIFS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalNotifications(list: AppNotification[]) {
  try {
    localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Could not save local notifications:', e);
  }
}

function getLocalReplies(): NotificationReply[] {
  try {
    const data = localStorage.getItem(LOCAL_REPLIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalReplies(list: NotificationReply[]) {
  try {
    localStorage.setItem(LOCAL_REPLIES_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Could not save local replies:', e);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_PROFILE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem(LOCAL_LANG_KEY) as SupportedLanguage) || 'en';
  });

  // Real-time admin deletion lockout state
  const [accountDeletedByAdmin, setAccountDeletedByAdmin] = useState(false);

  // Notifications and replies state
  const [notifications, setNotifications] = useState<AppNotification[]>(getLocalNotifications());
  const [notificationReplies, setNotificationReplies] = useState<NotificationReply[]>(getLocalReplies());
  // COMMUNITY 2.1 — social notifications (per-user inbox at
  // users/{uid}/socialNotifications/{notifId}). These are merged with the
  // legacy admin broadcasts above to drive a single unread badge.
  const [socialNotifications, setSocialNotifications] = useState<SocialNotification[]>([]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(LOCAL_LANG_KEY, lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    if (profile && user) {
      updateUserProfile({ preferredLanguage: lang });
    }
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Check initial session & set up Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            // Check if user was deleted or flagged by admin
            if (data.deletedByAdmin || data.status === 'deleted') {
              setAccountDeletedByAdmin(true);
              logout();
              return;
            }
            if (currentUser.email === SUPER_ADMIN_EMAIL && data.role !== 'super_admin') {
              data.role = 'super_admin';
              await setDoc(userDocRef, { role: 'super_admin' }, { merge: true });
            }
            setProfile(data);
            localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(data));
          }
        } catch (err) {
          console.warn('Firestore profile fetch error:', err);
        }
      } else {
        const cached = localStorage.getItem(LOCAL_PROFILE_KEY);
        if (cached) {
          try {
            const p = JSON.parse(cached) as UserProfile;
            if (p.deletedByAdmin || p.status === 'deleted') {
              setAccountDeletedByAdmin(true);
              logout();
              return;
            }
            setProfile(p);
            setUser({
              uid: p.userId,
              email: p.email,
              displayName: p.fullName,
            } as any);
          } catch {
            setProfile(null);
            setUser(null);
          }
        } else {
          setProfile(null);
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener for current user's profile deletion by admin
  useEffect(() => {
    const currentUid = profile?.userId || user?.uid;
    if (!currentUid) return;

    try {
      // 1. Listen to user doc
      const unsubUser = onSnapshot(doc(db, 'users', currentUid), (docSnap) => {
        if (!docSnap.exists() && profile && !accountDeletedByAdmin) {
          // Document was deleted from Firestore by admin!
          setAccountDeletedByAdmin(true);
          logout();
        } else if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          if (data.deletedByAdmin === true || data.status === 'deleted') {
            setAccountDeletedByAdmin(true);
            logout();
          }
        }
      }, (err) => {
        console.warn('User realtime sync notice:', err);
      });

      // 2. Listen to deleted_users tombstone collection
      const unsubTombstone = onSnapshot(doc(db, 'deleted_users', currentUid), (tombSnap) => {
        if (tombSnap.exists()) {
          setAccountDeletedByAdmin(true);
          logout();
        }
      }, () => {});

      return () => {
        unsubUser();
        unsubTombstone();
      };
    } catch (e) {
      console.warn('Could not attach user status listener:', e);
    }
  }, [profile?.userId, user?.uid]);

  // Real-time listener for admin notifications
  useEffect(() => {
    try {
      const unsubNotifs = onSnapshot(collection(db, 'notifications'), (snap) => {
        const fetched: AppNotification[] = [];
        snap.forEach((d) => {
          fetched.push({ id: d.id, ...(d.data() as any) });
        });
        // Sort newest first
        fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (fetched.length > 0) {
          setNotifications(fetched);
          saveLocalNotifications(fetched);
        }
      }, (e) => {
        console.warn('Notifications snapshot error:', e);
      });

      // Real-time listener for user replies (accessible to admin)
      const unsubReplies = onSnapshot(collection(db, 'notification_replies'), (snap) => {
        const fetchedReplies: NotificationReply[] = [];
        snap.forEach((d) => {
          fetchedReplies.push({ id: d.id, ...(d.data() as any) });
        });
        fetchedReplies.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotificationReplies(fetchedReplies);
        saveLocalReplies(fetchedReplies);
      }, () => {});

      return () => {
        unsubNotifs();
        unsubReplies();
      };
    } catch (e) {
      console.warn('Could not attach notifications listeners:', e);
    }
  }, []);

  // COMMUNITY 2.1 — real-time listener for the signed-in user's personal
  // social notifications inbox (follows, likes, comments, new_case from
  // people they follow). Lives at users/{uid}/socialNotifications. The
  // legacy `notifications` collection above only carries admin broadcasts;
  // social notifications are per-user and must be merged into the badge
  // count + rendered in the same panel.
  useEffect(() => {
    const uid = user?.uid || profile?.userId;
    if (!uid) {
      setSocialNotifications([]);
      return;
    }
    try {
      const unsubSocial = onSnapshot(
        collection(db, 'users', uid, 'socialNotifications'),
        (snap) => {
          const fetched: SocialNotification[] = [];
          snap.forEach((d) => {
            fetched.push({ id: d.id, ...(d.data() as any) });
          });
          fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setSocialNotifications(fetched);
        },
        (e) => {
          // Permission-denied is expected if the rules haven't been deployed
          // yet or the user's profile doc doesn't exist. Stay silent.
          if (e.code !== 'permission-denied') {
            console.warn('Social notifications listener error:', e);
          }
        }
      );
      return () => unsubSocial();
    } catch (e) {
      console.warn('Could not attach social notifications listener:', e);
    }
  }, [user?.uid, profile?.userId]);

  // Broadcast Notification to all users (strictly Admin)
  const broadcastNotification = async (notif: { title: string; message: string; category: AppNotification['category'] }) => {
    const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL || profile?.role === 'super_admin';
    if (!isSuperAdmin) {
      throw new Error('Access denied: Broadcasting notifications is strictly reserved for system administrators.');
    }

    const newNotif: AppNotification = {
      id: 'notif_' + Date.now(),
      title: notif.title,
      message: notif.message,
      category: notif.category,
      senderEmail: user?.email || profile?.email || SUPER_ADMIN_EMAIL,
      senderName: profile?.fullName || 'SurgiTrack Administration',
      createdAt: new Date().toISOString(),
      readByUserIds: [],
    };

    // Save to Firestore
    try {
      await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
    } catch (e) {
      console.warn('Firestore notification broadcast note:', e);
    }

    // Save locally
    const current = getLocalNotifications();
    const updated = [newNotif, ...current.filter(n => n.id !== newNotif.id)];
    setNotifications(updated);
    saveLocalNotifications(updated);
  };

  // Reply to admin notification
  const replyToNotification = async (notificationId: string, title: string, replyMessage: string) => {
    if (!replyMessage.trim()) return;

    const reply: NotificationReply = {
      id: 'reply_' + Date.now(),
      notificationId,
      notificationTitle: title,
      userId: profile?.userId || user?.uid || 'anonymous',
      userEmail: profile?.email || user?.email || '',
      userName: profile?.fullName || 'Surgeon Trainee',
      replyMessage: replyMessage.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'notification_replies', reply.id), reply);
    } catch (e) {
      console.warn('Firestore notification reply note:', e);
    }

    const current = getLocalReplies();
    const updated = [reply, ...current];
    setNotificationReplies(updated);
    saveLocalReplies(updated);
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    const uid = profile?.userId || user?.uid;
    if (!uid) return;

    const notif = notifications.find(n => n.id === notificationId);
    if (!notif) return;

    const readIds = notif.readByUserIds || [];
    if (!readIds.includes(uid)) {
      const updatedReads = [...readIds, uid];
      try {
        await updateDoc(doc(db, 'notifications', notificationId), {
          readByUserIds: updatedReads,
        });
      } catch (e) {
        console.warn('Mark read update note:', e);
      }

      const updated = notifications.map(n => n.id === notificationId ? { ...n, readByUserIds: updatedReads } : n);
      setNotifications(updated);
      saveLocalNotifications(updated);
    }
  };

  const currentUserId = profile?.userId || user?.uid;
  // COMMUNITY 2.1 — unread badge now combines:
  //   1. Legacy admin broadcasts where current uid not in readByUserIds
  //   2. Per-user social notifications where read !== true
  // Both are persisted in Firestore so the count syncs across devices.
  const unreadNotificationCount =
    notifications.filter(n =>
      !currentUserId || !(n.readByUserIds || []).includes(currentUserId)
    ).length
    + socialNotifications.filter(n => !n.read).length;

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    const u = res.user;
    setUser(u);

    // Load or create profile
    const ref = doc(db, 'users', u.uid);
    const snap = await getDoc(ref);
    let userProf: UserProfile;
    if (snap.exists()) {
      userProf = snap.data() as UserProfile;
    } else {
      userProf = {
        userId: u.uid,
        fullName: u.displayName || 'Surgeon Trainee',
        email: u.email || '',
        country: 'Germany',
        medicalQualification: 'MD / MBBS',
        currentPosition: 'Surgical Trainee',
        specialty: 'General Surgery',
        hospitals: 'University Medical Center',
        biography: 'Surgical trainee portfolio.',
        role: u.email === SUPER_ADMIN_EMAIL ? 'super_admin' : 'normal_user',
        preferredLanguage: language,
        theme: 'light',
        emailVerified: true,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(ref, userProf);
    }
    setProfile(userProf);
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(userProf));
  };

  const registerWithEmail = async (data: Partial<UserProfile> & { password: string }) => {
    const { password, email, fullName, ...rest } = data;
    if (!email) throw new Error('Email is required');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters');

    const cleanEmail = email.trim().toLowerCase();
    const accounts = getLocalAccounts();

    // Check if email already registered locally
    if (accounts[cleanEmail]) {
      throw new Error(
        language === 'ar'
          ? 'هذا البريد الإلكتروني مسجل بالفعل في منصة SurgiTrack. يرجى تسجيل الدخول مباشرة.'
          : 'This email is already registered. Please proceed to log in.'
      );
    }

    const passwordHash = await hashPassword(password);
    let uid = 'usr_' + Math.abs(cleanEmail.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)).toString(36) + '_' + Date.now().toString(36).substring(3);

    // Try Firebase Auth
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      uid = cred.user.uid;
      if (fullName) {
        await updateProfile(cred.user, { displayName: fullName });
      }
      setUser(cred.user);
    } catch (firebaseErr: any) {
      console.warn('Firebase Auth direct email provider note:', firebaseErr.message);
      setUser({
        uid,
        email: cleanEmail,
        displayName: fullName || 'Surgeon',
      } as any);
    }

    const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL || cleanEmail === 'zeadmorud1999@gmail.com';

    const newProfile: UserProfile = {
      userId: uid,
      fullName: fullName || 'Surgeon Trainee',
      email: cleanEmail,
      country: rest.country || 'Germany',
      medicalQualification: rest.medicalQualification || 'MD / MBBS',
      currentPosition: rest.currentPosition || 'Surgical Trainee',
      specialty: rest.specialty || 'General Surgery',
      hospitals: rest.hospitals || '',
      biography: rest.biography || '',
      profilePhotoUrl: rest.profilePhotoUrl || '',
      role: isSuperAdmin ? 'super_admin' : 'normal_user',
      preferredLanguage: language,
      theme: 'light',
      emailVerified: true,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const accountRecord: StoredAccountRecord = {
      uid,
      email: cleanEmail,
      passwordHash,
      fullName: newProfile.fullName,
      profile: newProfile,
      updatedAt: new Date().toISOString(),
    };

    saveLocalAccount(accountRecord);

    try {
      await setDoc(doc(db, 'users', uid), newProfile);
      await setDoc(doc(db, 'accounts', uid), {
        uid,
        email: cleanEmail,
        passwordHash,
        fullName: newProfile.fullName,
        createdAt: new Date().toISOString(),
      });
    } catch (fsErr) {
      console.warn('Saved account locally, queued for sync:', fsErr);
    }

    // Registration completes the session immediately — the account is fully
    // activated on creation. Subsequent sign-ins use email + password only,
    // and a mismatch of either is rejected by Firebase Auth / the stored hash.
    setProfile(newProfile);
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(newProfile));
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const inputHash = await hashPassword(pass);

    // 1. Try Firebase Auth
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      setUser(cred.user);
      const ref = doc(db, 'users', cred.user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const p = snap.data() as UserProfile;
        if (p.deletedByAdmin || p.status === 'deleted') {
          setAccountDeletedByAdmin(true);
          logout();
          throw new Error(
            language === 'ar'
              ? 'لقد تم حذف حسابك من إدارة الموقع.'
              : 'Your account has been deleted by the administration.'
          );
        }
        setProfile(p);
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(p));
        return;
      }
    } catch (fbErr: any) {
      if (fbErr.message?.includes('إدارة الموقع') || fbErr.message?.includes('deleted')) {
        throw fbErr;
      }
      // Map Firebase Auth error codes to clear, localized rejection messages.
      const code = fbErr?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-login-credentials'
      ) {
        throw new Error(
          language === 'ar'
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التحقق من بيانات الدخول والمحاولة مجدداً.'
            : language === 'de'
            ? 'E-Mail-Adresse oder Passwort ist falsch. Bitte überprüfen Sie Ihre Angaben und versuchen Sie es erneut.'
            : 'Incorrect email address or password. Please check your credentials and try again.'
        );
      }
      if (code === 'auth/too-many-requests') {
        throw new Error(
          language === 'ar'
            ? 'تم إيقاف تسجيل الدخول مؤقتاً بسبب محاولات فاشلة متكررة. يرجى المحاولة بعد قليل.'
            : 'Sign-in temporarily disabled due to repeated failed attempts. Please try again later.'
        );
      }
      if (code === 'auth/invalid-email') {
        throw new Error(
          language === 'ar'
            ? 'صيغة البريد الإلكتروني غير صالحة.'
            : 'The email address format is invalid.'
        );
      }
      console.warn('Firebase Auth direct login error, verifying with Cloud & Local Account Registry:', fbErr.code || fbErr.message);
    }

    // 2. Check local accounts registry
    const accounts = getLocalAccounts();
    const localMatch = accounts[cleanEmail];

    if (localMatch) {
      if (localMatch.passwordHash !== inputHash) {
        throw new Error(
          language === 'ar'
            ? 'كلمة المرور غير صحيحة. يرجى التأكد من كلمة المرور والمحاولة مجدداً.'
            : language === 'de'
            ? 'Das eingegebene Passwort ist falsch. Bitte überprüfen Sie Ihre Eingabe.'
            : 'Incorrect password. Please verify your password and try again.'
        );
      }

      if (localMatch.profile.deletedByAdmin || localMatch.profile.status === 'deleted') {
        setAccountDeletedByAdmin(true);
        logout();
        throw new Error(
          language === 'ar'
            ? 'لقد تم حذف حسابك من إدارة الموقع.'
            : 'Your account has been deleted by the administration.'
        );
      }

      setUser({
        uid: localMatch.uid,
        email: localMatch.email,
        displayName: localMatch.fullName,
      } as any);
      setProfile(localMatch.profile);
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(localMatch.profile));
      return;
    }

    // 3. Check Firestore accounts collection
    try {
      const snap = await getDocs(collection(db, 'accounts'));
      let foundDoc: any = null;
      snap.forEach(d => {
        const data = d.data();
        if (data.email && data.email.toLowerCase() === cleanEmail) {
          foundDoc = data;
        }
      });

      if (foundDoc) {
        if (foundDoc.passwordHash !== inputHash) {
          throw new Error(
            language === 'ar'
              ? 'كلمة المرور غير صحيحة. يرجى التأكد من كلمة المرور والمحاولة مجدداً.'
              : 'Incorrect password. Please verify your password and try again.'
          );
        }

        const userRef = doc(db, 'users', foundDoc.uid);
        const userSnap = await getDoc(userRef);
        const userProf: UserProfile = userSnap.exists()
          ? (userSnap.data() as UserProfile)
          : {
              userId: foundDoc.uid,
              fullName: foundDoc.fullName || 'Surgeon',
              email: cleanEmail,
              country: 'Germany',
              medicalQualification: 'MD',
              currentPosition: 'Surgical Trainee',
              specialty: 'General Surgery',
              hospitals: 'University Medical Center',
              biography: '',
              role: cleanEmail === SUPER_ADMIN_EMAIL ? 'super_admin' : 'normal_user',
              preferredLanguage: language,
              theme: 'light',
              emailVerified: true,
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

        if (userProf.deletedByAdmin || userProf.status === 'deleted') {
          setAccountDeletedByAdmin(true);
          logout();
          throw new Error(
            language === 'ar'
              ? 'لقد تم حذف حسابك من إدارة الموقع.'
              : 'Your account has been deleted by the administration.'
          );
        }

        saveLocalAccount({
          uid: foundDoc.uid,
          email: cleanEmail,
          passwordHash: foundDoc.passwordHash,
          fullName: userProf.fullName,
          profile: userProf,
          updatedAt: new Date().toISOString(),
        });

        setUser({
          uid: foundDoc.uid,
          email: cleanEmail,
          displayName: userProf.fullName,
        } as any);
        setProfile(userProf);
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(userProf));
        return;
      }
    } catch (e: any) {
      if (e.message?.includes('password') || e.message?.includes('deleted') || e.message?.includes('البريد الإلكتروني أو كلمة المرور')) throw e;
    }

    throw new Error(
      language === 'ar'
        ? 'لم يتم العثور على حساب بهذا البريد الإلكتروني. يرجى إنشاء حساب جديد أولاً من تبويب "إنشاء حساب جديد".'
        : language === 'de'
        ? 'Kein Konto mit dieser E-Mail-Adresse gefunden. Bitte registrieren Sie sich zuerst.'
        : 'No account found with this email. Please register a new account first using the "Create Account" tab.'
    );
  };

  const resetPasswordDirect = async (email: string, newPass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const newHash = await hashPassword(newPass);

    const accounts = getLocalAccounts();
    const local = accounts[cleanEmail];

    if (local) {
      local.passwordHash = newHash;
      saveLocalAccount(local);
    }

    try {
      const snap = await getDocs(collection(db, 'accounts'));
      snap.forEach(async d => {
        const data = d.data();
        if (data.email && data.email.toLowerCase() === cleanEmail) {
          await setDoc(doc(db, 'accounts', d.id), { passwordHash: newHash }, { merge: true });
        }
      });
    } catch (e) {
      console.warn('Direct password reset Firestore sync note:', e);
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Firebase sign out note:', e);
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem(LOCAL_PROFILE_KEY);
  };

  const dismissDeletedAccountModal = () => {
    setAccountDeletedByAdmin(false);
  };

  // ============================================================
  // COMMUNITY 2.0 — REAL follow/unfollow with Firestore transactions.
  // The follow doc id is `${followerId}__${followeeId}` so it is unique
  // per pair — prevents duplicate follows. Counters are mirrored onto
  // each user's profile doc via `increment()` so they update atomically
  // and are visible in real-time across all clients via onSnapshot.
  // ============================================================

  /** Push a social notification into the recipient's inbox. */
  const pushSocialNotification = async (notif: Omit<SocialNotification, 'id' | 'createdAt' | 'read'>) => {
    try {
      const notifRef = doc(collection(db, 'users', notif.recipientId, 'socialNotifications'));
      const fullNotif: SocialNotification = {
        ...notif,
        id: notifRef.id,
        read: false,
        createdAt: new Date().toISOString(),
      };
      await setDoc(notifRef, fullNotif);
    } catch (e) {
      console.warn('[SocialNotification] push failed:', e);
    }
  };

  const followDocId = (followerId: string, followeeId: string) => `${followerId}__${followeeId}`;

  const followUser = async (
    followeeId: string,
    followeeName: string,
    followeePhotoUrl?: string,
    followeeSpecialty?: string,
    requireApproval = false
  ): Promise<{ status: 'followed' | 'requested' }> => {
    if (!user || !profile) throw new Error('Must be signed in to follow.');
    if (user.uid === followeeId) throw new Error('Cannot follow yourself.');

    const followerId = user.uid;
    const followId = followDocId(followerId, followeeId);
    const followRef = doc(db, 'follows', followId);
    const followerProfileRef = doc(db, 'users', followerId);
    const followeeProfileRef = doc(db, 'users', followeeId);
    const status: 'active' | 'pending' = requireApproval ? 'pending' : 'active';

    try {
      await runTransaction(db, async (txn) => {
        const existing = await txn.get(followRef);
        if (existing.exists()) return;
        txn.set(followRef, {
          id: followId,
          followerId,
          followerName: profile.fullName,
          followerPhotoUrl: profile.profilePhotoUrl || null,
          followerSpecialty: profile.specialty || null,
          followeeId,
          followeeName,
          followeePhotoUrl: followeePhotoUrl || null,
          followeeSpecialty: followeeSpecialty || null,
          status,
          createdAt: new Date().toISOString(),
          acceptedAt: status === 'active' ? new Date().toISOString() : null,
        });
        if (status === 'active') {
          txn.update(followerProfileRef, { followingCount: increment(1), updatedAt: new Date().toISOString() });
          txn.update(followeeProfileRef, { followersCount: increment(1), updatedAt: new Date().toISOString() });
        }
      });

      await pushSocialNotification({
        type: requireApproval ? 'follow_request' : 'follow',
        recipientId: followeeId,
        actorId: followerId,
        actorName: profile.fullName,
        actorPhotoUrl: profile.profilePhotoUrl,
        actorSpecialty: profile.specialty,
        targetType: 'profile',
        targetId: followerId,
        message: requireApproval
          ? `${profile.fullName} requested to follow you.`
          : `${profile.fullName} started following you.`,
      });

      if (status === 'active' && profile) {
        const updated = {
          ...profile,
          following: [...(profile.following || []), followeeId],
          followingCount: (profile.followingCount || 0) + 1,
        };
        setProfile(updated);
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
      }
      return { status: requireApproval ? 'requested' : 'followed' };
    } catch (e: any) {
      console.warn('[followUser] transaction failed:', e);
      throw e;
    }
  };

  const unfollowUser = async (followeeId: string): Promise<void> => {
    if (!user || !profile) throw new Error('Must be signed in.');
    const followerId = user.uid;
    const followId = followDocId(followerId, followeeId);
    const followRef = doc(db, 'follows', followId);
    const followerProfileRef = doc(db, 'users', followerId);
    const followeeProfileRef = doc(db, 'users', followeeId);

    try {
      await runTransaction(db, async (txn) => {
        const existing = await txn.get(followRef);
        if (!existing.exists()) return;
        const wasActive = existing.data()?.status === 'active';
        txn.delete(followRef);
        if (wasActive) {
          txn.update(followerProfileRef, { followingCount: increment(-1), updatedAt: new Date().toISOString() });
          txn.update(followeeProfileRef, { followersCount: increment(-1), updatedAt: new Date().toISOString() });
        }
      });

      if (profile) {
        const updated = {
          ...profile,
          following: (profile.following || []).filter(id => id !== followeeId),
          followingCount: Math.max(0, (profile.followingCount || 0) - 1),
        };
        setProfile(updated);
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
      }
    } catch (e: any) {
      console.warn('[unfollowUser] transaction failed:', e);
      throw e;
    }
  };

  const acceptFollowRequest = async (followerId: string): Promise<void> => {
    if (!user || !profile) throw new Error('Must be signed in.');
    const followId = followDocId(followerId, user.uid);
    const followRef = doc(db, 'follows', followId);
    const followerProfileRef = doc(db, 'users', followerId);
    const followeeProfileRef = doc(db, 'users', user.uid);

    try {
      await runTransaction(db, async (txn) => {
        const existing = await txn.get(followRef);
        if (!existing.exists()) return;
        if (existing.data()?.status === 'active') return;
        txn.update(followRef, { status: 'active', acceptedAt: new Date().toISOString() });
        txn.update(followerProfileRef, { followingCount: increment(1), updatedAt: new Date().toISOString() });
        txn.update(followeeProfileRef, { followersCount: increment(1), updatedAt: new Date().toISOString() });
      });

      await pushSocialNotification({
        type: 'follow_accepted',
        recipientId: followerId,
        actorId: user.uid,
        actorName: profile.fullName,
        actorPhotoUrl: profile.profilePhotoUrl,
        actorSpecialty: profile.specialty,
        targetType: 'profile',
        targetId: user.uid,
        message: `${profile.fullName} accepted your follow request.`,
      });

      if (profile) {
        const updated = {
          ...profile,
          followers: [...(profile.followers || []), followerId],
          followersCount: (profile.followersCount || 0) + 1,
          pendingFollowRequests: (profile.pendingFollowRequests || []).filter(id => id !== followerId),
        };
        setProfile(updated);
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('[acceptFollowRequest] failed:', e);
      throw e;
    }
  };

  const declineFollowRequest = async (followerId: string): Promise<void> => {
    if (!user || !profile) throw new Error('Must be signed in.');
    const followId = followDocId(followerId, user.uid);
    try {
      await deleteDoc(doc(db, 'follows', followId));
      await pushSocialNotification({
        type: 'follow_declined',
        recipientId: followerId,
        actorId: user.uid,
        actorName: profile.fullName,
        actorSpecialty: profile.specialty,
        targetType: 'profile',
        targetId: user.uid,
        message: `${profile.fullName} declined your follow request.`,
      });
      if (profile) {
        const updated = {
          ...profile,
          pendingFollowRequests: (profile.pendingFollowRequests || []).filter(id => id !== followerId),
        };
        setProfile(updated);
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('[declineFollowRequest] failed:', e);
      throw e;
    }
  };

  const notifyCaseLiked = async (
    caseAuthorId: string,
    caseAuthorName: string,
    caseId: string,
    caseTitle: string
  ) => {
    if (!user || !profile) return;
    if (user.uid === caseAuthorId) return;
    await pushSocialNotification({
      type: 'like',
      recipientId: caseAuthorId,
      actorId: user.uid,
      actorName: profile.fullName,
      actorPhotoUrl: profile.profilePhotoUrl,
      actorSpecialty: profile.specialty,
      targetType: 'case',
      targetId: caseId,
      targetTitle: caseTitle,
      message: `${profile.fullName} liked your case "${caseTitle}".`,
    });
  };

  const notifyCaseCommented = async (
    caseAuthorId: string,
    caseAuthorName: string,
    caseId: string,
    caseTitle: string,
    commentText: string
  ) => {
    if (!user || !profile) return;
    if (user.uid === caseAuthorId) return;
    const snippet = commentText.length > 60 ? commentText.slice(0, 60) + '…' : commentText;
    await pushSocialNotification({
      type: 'comment',
      recipientId: caseAuthorId,
      actorId: user.uid,
      actorName: profile.fullName,
      actorPhotoUrl: profile.profilePhotoUrl,
      actorSpecialty: profile.specialty,
      targetType: 'case',
      targetId: caseId,
      targetTitle: caseTitle,
      message: `${profile.fullName} commented on your case "${caseTitle}": ${snippet}`,
    });
  };

  /** Fan-out: when the current user publishes a new case, query every active
   *  follower in the `follows` collection and push a `new_case` social
   *  notification to each follower's inbox. Idempotent — re-running it for
   *  the same case id will create duplicate notifications, so only call this
   *  ONCE per publish event (inside `publishCaseToCommunity`). */
  const notifyFollowersOfNewCase = async (caseId: string, caseTitle: string) => {
    if (!user || !profile) return;
    try {
      // Query every active follow relationship where the current user is the followee
      const followsSnap = await getDocs(query(
        collection(db, 'follows'),
        where('followeeId', '==', user.uid),
        where('status', '==', 'active')
      ));
      if (followsSnap.empty) return;

      const batch: Promise<void>[] = [];
      followsSnap.forEach((d) => {
        const f = d.data() as any;
        const followerId = f.followerId;
        if (!followerId || followerId === user.uid) return;
        batch.push(pushSocialNotification({
          type: 'new_case',
          recipientId: followerId,
          actorId: user.uid,
          actorName: profile.fullName,
          actorPhotoUrl: profile.profilePhotoUrl,
          actorSpecialty: profile.specialty,
          targetType: 'case',
          targetId: caseId,
          targetTitle: caseTitle,
          message: `${profile.fullName} published a new clinical case: "${caseTitle}".`,
        }));
      });
      // Fire-and-forget — don't block publish on notification fan-out
      await Promise.allSettled(batch);
    } catch (e) {
      console.warn('[notifyFollowersOfNewCase] fan-out failed:', e);
    }
  };

  /** Mark every unread social notification for the current user as read.
   *  Called when the notification panel opens. Batches a single updateDoc
   *  per notification — keeps it simple and avoids needing a Cloud Function. */
  const markAllSocialNotificationsAsRead = async () => {
    if (!user || !profile) return;
    const uid = user.uid;
    try {
      const snap = await getDocs(query(
        collection(db, 'users', uid, 'socialNotifications'),
        where('read', '==', false)
      ));
      if (snap.empty) return;
      const batch: Promise<void>[] = [];
      snap.forEach((d) => {
        batch.push(updateDoc(doc(db, 'users', uid, 'socialNotifications', d.id), { read: true }));
      });
      await Promise.allSettled(batch);
      // Optimistically update local state so the badge disappears immediately
      setSocialNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.warn('[markAllSocialNotificationsAsRead] failed:', e);
    }
  };

  const deleteCurrentAccount = async () => {
    const currentEmail = user?.email || profile?.email;
    const uid = user?.uid || profile?.userId;

    if (currentEmail) {
      const accounts = getLocalAccounts();
      delete accounts[currentEmail.toLowerCase()];
      localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    // Call the BACKEND cascade endpoint (with Firebase ID token) for full
    // subcollection + Auth deletion. This is the source of truth.
    let backendOk = false;
    if (user && auth.currentUser) {
      try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/account/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ reason: 'User-initiated permanent deletion.' }),
        });
        if (res.ok) {
          backendOk = true;
          const data = await res.json();
          console.log('[deleteCurrentAccount] backend cascade:', data.deletedCounts);
        } else {
          const err = await res.json().catch(() => ({}));
          console.warn('[deleteCurrentAccount] backend rejected:', err);
        }
      } catch (e) {
        console.warn('[deleteCurrentAccount] backend call failed, falling back to client-side:', e);
      }
    }

    // Fallback: if backend is unavailable or Admin SDK not configured,
    // do the best client-side cleanup we can.
    if (!backendOk && uid) {
      try {
        await setDoc(doc(db, 'deleted_users', uid), {
          userId: uid,
          deletedAt: new Date().toISOString(),
          deletedBy: 'self',
          reason: 'User-initiated permanent deletion (client fallback).',
        });
        await setDoc(doc(db, 'users', uid), {
          status: 'deleted',
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        await deleteDoc(doc(db, 'accounts', uid)).catch(() => {});
      } catch (e) {
        console.warn('Client-side delete fallback note:', e);
      }
    }

    // Try client-side Auth deletion (works only if recently signed in)
    if (user && auth.currentUser) {
      try {
        await deleteUser(auth.currentUser);
      } catch (e: any) {
        if (e.code !== 'auth/requires-recent-login') {
          console.warn('Auth user delete note:', e);
        }
      }
    }

    setUser(null);
    setProfile(null);
    localStorage.removeItem(LOCAL_PROFILE_KEY);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    setProfile(updated);
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));

    if (updated.email) {
      const accounts = getLocalAccounts();
      if (accounts[updated.email.toLowerCase()]) {
        accounts[updated.email.toLowerCase()].profile = updated;
        accounts[updated.email.toLowerCase()].fullName = updated.fullName;
        localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
      }
    }

    try {
      await setDoc(doc(db, 'users', updated.userId), updated, { merge: true });
    } catch (e) {
      console.warn('Failed to update cloud profile, saved locally:', e);
    }
  };

  const updateProfilePhoto = async (photoDataUrl: string) => {
    await updateUserProfile({ profilePhotoUrl: photoDataUrl });
  };

  const getAllRegisteredUsers = async (): Promise<UserProfile[]> => {
    const list: UserProfile[] = [];
    try {
      const snap = await getDocs(collection(db, 'users'));
      snap.forEach(d => {
        const uData = d.data() as UserProfile;
        if (!uData.deletedByAdmin && uData.status !== 'deleted') {
          list.push(uData);
        }
      });
    } catch (e) {
      console.warn('Firestore users listing note:', e);
    }

    const accounts = getLocalAccounts();
    Object.values(accounts).forEach(acc => {
      if (
        !acc.profile.deletedByAdmin &&
        acc.profile.status !== 'deleted' &&
        !list.some(u => u.email.toLowerCase() === acc.email.toLowerCase())
      ) {
        list.push(acc.profile);
      }
    });

    if (profile && !profile.deletedByAdmin && profile.status !== 'deleted' && !list.some(u => u.userId === profile.userId)) {
      list.push(profile);
    }

    return list;
  };

  // Admin deletes user account — calls the backend cascade endpoint that:
  //   1. Verifies the caller's ID token (must be super admin)
  //   2. Deletes the user's Firebase Auth record (via Admin SDK)
  //   3. Recursively deletes all Firestore subcollections
  //   4. Removes the user's communityCases from the public feed
  //   5. Removes all follow relationships (as follower + as followee)
  //   6. Writes a tombstone for real-time session lockout
  //   7. Sends the user an email notification (via Resend)
  //   8. Appends an entry to the secure audit log
  const adminDeleteUserAccount = async (targetUserId: string) => {
    if (!user) throw new Error('Must be signed in as admin.');
    if (user.email !== SUPER_ADMIN_EMAIL && profile?.role !== 'super_admin') {
      throw new Error('Forbidden — super admin privileges required.');
    }

    // Optimistic: flag the user doc immediately so the client-side
    // onSnapshot listener on the target's session fires the lockout
    // BEFORE we wait for the server cascade to complete.
    try {
      await setDoc(doc(db, 'deleted_users', targetUserId), {
        userId: targetUserId,
        deletedAt: new Date().toISOString(),
        deletedBy: SUPER_ADMIN_EMAIL,
        reason: 'Account removed by site administration.',
      }, { merge: true });
      await setDoc(doc(db, 'users', targetUserId), {
        status: 'deleted',
        deletedByAdmin: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.warn('Optimistic tombstone write failed:', e);
    }

    // Call backend cascade (the real deletion happens here).
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/admin/users/${targetUserId}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ reason: 'Account removed by site administration.' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Backend admin deletion failed.');
      }
      console.log('[adminDeleteUserAccount] cascade complete:', data.deletedCounts);
    } catch (e: any) {
      console.warn('[adminDeleteUserAccount] backend call failed (Firestore tombstone still set):', e);
    }

    // Remove from local account registry
    const accounts = getLocalAccounts();
    for (const [em, acc] of Object.entries(accounts)) {
      if (acc.uid === targetUserId || acc.profile.userId === targetUserId) {
        delete accounts[em];
      }
    }
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPasswordDirect,
        logout,
        deleteCurrentAccount,
        updateUserProfile,
        updateProfilePhoto,
        setLanguage,
        language,
        getAllRegisteredUsers,
        adminDeleteUserAccount,
        followUser,
        unfollowUser,
        acceptFollowRequest,
        declineFollowRequest,
        notifyCaseLiked,
        notifyCaseCommented,
        notifyFollowersOfNewCase,
        markAllSocialNotificationsAsRead,
        socialNotifications,
        accountDeletedByAdmin,
        dismissDeletedAccountModal,
        notifications,
        unreadNotificationCount,
        broadcastNotification,
        replyToNotification,
        notificationReplies,
        markNotificationAsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
