import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

const normalizeProfile = (data, fallback = {}) => ({
  name: data?.name || fallback.name || '',
  email: data?.email || fallback.email || '',
  createdAt: data?.createdAt || new Date().toISOString(),
  isAdmin: data?.isAdmin === true,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }
      // try to load profile from Firestore
      try {
        const ref = doc(db, 'users', u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          const profile = normalizeProfile(data, { name: u.displayName || '', email: u.email });
          if (data.isAdmin !== true && data.isAdmin !== false) {
            await setDoc(ref, { isAdmin: false }, { merge: true });
          }
          setUser({ id: u.uid, ...profile });
        } else {
          const profile = normalizeProfile(null, { name: u.displayName || '', email: u.email });
          await setDoc(ref, profile);
          setUser({ id: u.uid, ...profile });
        }
      } catch (err) {
        setUser({ id: u.uid, name: u.displayName || '', email: u.email, isAdmin: false });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (name, email, password) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // update display name on the auth user
      await updateProfile(cred.user, { displayName: name });
      const profile = { name, email, createdAt: new Date().toISOString(), isAdmin: false };
      await setDoc(doc(db, 'users', cred.user.uid), profile, { merge: true });
      setUser({ id: cred.user.uid, ...profile });
      return { success: true };
    } catch (err) {
      // Map common Firebase Auth errors to friendly messages
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') return { error: 'Email already registered.' };
      if (code === 'auth/weak-password') return { error: 'Password should be at least 6 characters.' };
      if (code === 'auth/invalid-email') return { error: 'Invalid email address.' };
      return { error: err.message || 'Registration failed.' };
    }
  };

  const login = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // load profile
      try {
        const ref = doc(db, 'users', cred.user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          const profile = normalizeProfile(data, { name: cred.user.displayName || '', email: cred.user.email });
          if (data.isAdmin !== true && data.isAdmin !== false) {
            await setDoc(ref, { isAdmin: false }, { merge: true });
          }
          setUser({ id: cred.user.uid, ...profile });
        } else {
          const profile = normalizeProfile(null, { name: cred.user.displayName || '', email: cred.user.email });
          await setDoc(ref, profile, { merge: true });
          setUser({ id: cred.user.uid, ...profile });
        }
      } catch (err) {
        setUser({ id: cred.user.uid, name: cred.user.displayName || '', email: cred.user.email });
      }
      return { success: true };
    } catch (err) {
      // Normalize code: prefer err.code, fallback to code inside message like "(auth/invalid-credential)"
      const msg = err?.message || '';
      const match = msg.match(/\((auth\/[^)]+)\)/);
      const code = err?.code || (match ? match[1] : '');
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') return { error: 'Invalid email or password.' };
      if (code === 'auth/user-not-found') return { error: 'Account not found.' };
      if (code === 'auth/invalid-email') return { error: 'Invalid email address.' };
      if (code === 'auth/user-disabled') return { error: 'This account has been disabled.' };
      if (code === 'auth/too-many-requests') return { error: 'Too many login attempts. Try again later.' };
      return { error: 'Invalid email or password.' };
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err) {
      // noop
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);