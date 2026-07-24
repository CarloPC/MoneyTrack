import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [deletedEntries, setDeletedEntries] = useState([]);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setDeletedEntries([]);
      return;
    }

    const transactionsRef = collection(db, 'users', user.id, 'transactions');
    const unsubscribe = onSnapshot(transactionsRef, (snapshot) => {
      const docs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      setEntries(docs.filter((doc) => doc.isDeleted === false));
      setDeletedEntries(docs.filter((doc) => doc.isDeleted === true));
    });

    return () => unsubscribe();
  }, [user]);

  const addEntry = async (entry) => {
    if (!user) throw new Error('User must be signed in to add transactions.');

    const transactionsRef = collection(db, 'users', user.id, 'transactions');
    const newEntry = {
      ...entry,
      amount: Number(entry.amount),
      date: entry.date || new Date().toLocaleDateString('en-CA'),
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };

    const docRef = await addDoc(transactionsRef, newEntry);
    return { id: docRef.id, ...newEntry };
  };

  const updateEntry = async (id, updated) => {
    if (!user) throw new Error('User must be signed in to update transactions.');

    const entryRef = doc(db, 'users', user.id, 'transactions', id);
    await updateDoc(entryRef, {
      ...updated,
      amount: Number(updated.amount),
    });
  };

  const deleteEntry = async (id) => {
    if (!user) throw new Error('User must be signed in to delete transactions.');

    const entryRef = doc(db, 'users', user.id, 'transactions', id);
    await updateDoc(entryRef, { isDeleted: true });
  };

  const restoreTransaction = async (id) => {
    if (!user) throw new Error('User must be signed in to restore transactions.');

    const entryRef = doc(db, 'users', user.id, 'transactions', id);
    await updateDoc(entryRef, { isDeleted: false });
  };

  const total = entries.reduce((sum, e) => sum + Number(e.amount), 0);
  const income = entries.filter(e => Number(e.amount) > 0).reduce((s, e) => s + Number(e.amount), 0);
  const expenses = entries.filter(e => Number(e.amount) < 0).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <FinanceContext.Provider value={{ entries, deletedEntries, addEntry, updateEntry, deleteEntry, restoreTransaction, total, income, expenses }}>
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => useContext(FinanceContext);