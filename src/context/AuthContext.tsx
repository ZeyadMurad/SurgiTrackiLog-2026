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
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, SupportedLanguage, AppNotification, NotificationReply } from '../types';

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

  // Real Email Verification Link Workflow (30s Server Expiration, No OTP)
  sendVerificationLink: (email: string, fullName?: string) => Promise<{ success: boolean; expiresInSeconds: number }>;
  checkVerificationStatus: (email: string) => Promise<boolean>;
  resendVerificationLink: (email: string, fullName?: string) => Promise<{ success: boolean; expiresInSeconds: number }>;
  unverifiedEmail: string | null;
  setUnverifiedEmail: (email: string | null) => void;

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

  // Unverified email pending state for strict verification screen
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Notifications and replies state
  const [notifications, setNotifications] = useState<AppNotification[]>(getLocalNotifications());
  const [notificationReplies, setNotificationReplies] = useState<NotificationReply[]>(getLocalReplies());

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

  // Listen for verification link redirect: /?verified=true&email=...
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const isVerifiedParam = params.get('verified') === 'true';
      const emailParam = params.get('email');
      if (isVerifiedParam && emailParam) {
        const clean = emailParam.trim().toLowerCase();
        fetch(`/api/auth/verification-status?email=${encodeURIComponent(clean)}`)
          .then(res => res.json())
          .then(async (data) => {
            if (data.verified) {
              // 1. Persist verification to Firestore so it survives server restarts
              try {
                await setDoc(doc(db, 'verified_emails', clean), {
                  email: clean,
                  verified: true,
                  verifiedAt: new Date().toISOString(),
                });
              } catch (fsErr) {
                console.warn('Could not persist verification to Firestore:', fsErr);
              }

              // 2. Update local account registry
              const accounts = getLocalAccounts();
              if (accounts[clean]) {
                accounts[clean].profile.emailVerified = true;
                saveLocalAccount(accounts[clean]);
                setUser({
                  uid: accounts[clean].uid,
                  email: accounts[clean].email,
                  displayName: accounts[clean].fullName,
                } as any);
                setProfile(accounts[clean].profile);
                localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(accounts[clean].profile));

                // 3. Also update the Firestore user profile
                try {
                  await setDoc(doc(db, 'users', accounts[clean].uid), { emailVerified: true }, { merge: true });
                } catch (e) {
                  console.warn('Could not update Firestore user profile emailVerified flag:', e);
                }
              }
              setUnverifiedEmail(null);
              // Clean up the URL query params without reloading the page
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          })
          .catch(err => console.warn('Verification redirect handler note:', err));
      }
    } catch (e) {
      console.warn('URL param parse error:', e);
    }
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

  // Send real verification link to user's email (30s server-enforced expiration)
  const sendVerificationLink = async (email: string, fullName?: string) => {
    const res = await fetch('/api/auth/send-verification-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to dispatch verification email.');
    }

    return {
      success: true,
      expiresInSeconds: data.expiresInSeconds || 30,
    };
  };

  // Check verification status from backend server, with Firestore fallback.
  // The server's in-memory registry is lost on every Render free-tier restart,
  // so we also check the Firestore `verified_emails` collection which persists
  // permanently. This ensures that users who verified their email before a
  // server restart can still log in.
  const checkVerificationStatus = async (email: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check server in-memory registry first (fastest, most recent)
    try {
      const res = await fetch(`/api/auth/verification-status?email=${encodeURIComponent(cleanEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.verified) return true;
      }
    } catch {
      // Server might be waking up (Render free-tier cold start) — fall through
    }

    // 2. Check Firestore `verified_emails` collection (persists across restarts)
    try {
      const snap = await getDoc(doc(db, 'verified_emails', cleanEmail));
      if (snap.exists()) {
        const data = snap.data();
        if (data.verified === true) {
          return true;
        }
      }
    } catch {
      // Firestore might be temporarily unreachable — fall through
    }

    return false;
  };

  // Resend verification link
  const resendVerificationLink = async (email: string, fullName?: string) => {
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to resend verification link.');
    }

    return {
      success: true,
      expiresInSeconds: data.expiresInSeconds || 30,
    };
  };

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
  const unreadNotificationCount = notifications.filter(n =>
    !currentUserId || !(n.readByUserIds || []).includes(currentUserId)
  ).length;

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
    const isVerified = isSuperAdmin;

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
      emailVerified: isVerified,
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

    if (!isVerified) {
      // Send real verification link to exact registered email with 30s expiration
      await sendVerificationLink(cleanEmail, newProfile.fullName);
      setUnverifiedEmail(cleanEmail);
      // Strictly prevent access to protected app features until verified
      setUser(null);
      setProfile(null);
      localStorage.removeItem(LOCAL_PROFILE_KEY);
      return;
    }

    // Super admin pre-verified bypass
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

      // Strict email verification check (No access for unverified users)
      const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL || cleanEmail === 'zeadmorud1999@gmail.com';
      if (!isSuperAdmin && !localMatch.profile.emailVerified) {
        const serverVerified = await checkVerificationStatus(cleanEmail);
        if (serverVerified) {
          localMatch.profile.emailVerified = true;
          saveLocalAccount(localMatch);
          try {
            await setDoc(doc(db, 'users', localMatch.uid), { emailVerified: true }, { merge: true });
          } catch {}
        } else {
          setUnverifiedEmail(cleanEmail);
          throw new Error('EMAIL_VERIFICATION_REQUIRED');
        }
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

        // Strict email verification check (No access for unverified users)
        const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL || cleanEmail === 'zeadmorud1999@gmail.com';
        if (!isSuperAdmin && !userProf.emailVerified) {
          const serverVerified = await checkVerificationStatus(cleanEmail);
          if (serverVerified) {
            userProf.emailVerified = true;
            try {
              await setDoc(doc(db, 'users', foundDoc.uid), { emailVerified: true }, { merge: true });
            } catch {}
          } else {
            setUnverifiedEmail(cleanEmail);
            throw new Error('EMAIL_VERIFICATION_REQUIRED');
          }
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
      if (e.message.includes('password') || e.message.includes('deleted')) throw e;
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

  const deleteCurrentAccount = async () => {
    const currentEmail = user?.email || profile?.email;
    const uid = user?.uid || profile?.userId;

    if (currentEmail) {
      const accounts = getLocalAccounts();
      delete accounts[currentEmail.toLowerCase()];
      localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    if (uid) {
      try {
        await deleteDoc(doc(db, 'users', uid));
        await deleteDoc(doc(db, 'accounts', uid));
      } catch (e) {
        console.warn('Firestore delete note:', e);
      }
    }

    if (user && auth.currentUser) {
      try {
        await deleteUser(auth.currentUser);
      } catch (e) {
        console.warn('Auth user delete note:', e);
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

  // Admin deletes user account: immediately flags user and marks tombstone so their active session closes instantly!
  const adminDeleteUserAccount = async (targetUserId: string) => {
    // 1. Mark in local accounts
    const accounts = getLocalAccounts();
    let targetEmail = '';
    for (const [em, acc] of Object.entries(accounts)) {
      if (acc.uid === targetUserId || acc.profile.userId === targetUserId) {
        targetEmail = em;
        delete accounts[em];
      }
    }
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));

    // 2. Set tombstone in Firestore 'deleted_users' AND update 'users/{id}' with status: 'deleted'
    // so any connected device running onSnapshot triggers immediate logout & app closure!
    try {
      await setDoc(doc(db, 'deleted_users', targetUserId), {
        userId: targetUserId,
        deletedAt: new Date().toISOString(),
        deletedBy: SUPER_ADMIN_EMAIL,
        reason: 'Account removed by site administration.',
      });

      await setDoc(doc(db, 'users', targetUserId), {
        status: 'deleted',
        deletedByAdmin: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      await deleteDoc(doc(db, 'accounts', targetUserId));
    } catch (e) {
      console.warn('Admin delete firestore error:', e);
    }
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
        sendVerificationLink,
        checkVerificationStatus,
        resendVerificationLink,
        unverifiedEmail,
        setUnverifiedEmail,
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
