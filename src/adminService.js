import { collection, query, where, orderBy, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const usersCollection = collection(db, 'users');
const transactionsRootCollection = collection(db, 'transactions');

export async function loadUserProfile(userId) {
  const userRef = doc(db, 'users', userId);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

export async function fetchNonAdminUsers() {
  const q = query(usersCollection, orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .filter((user) => user.isAdmin !== true);
}

export async function updateUserAdminStatus(userId, isAdmin) {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, { isAdmin }, { merge: true });
}

export async function fetchUserTransactions(userId, includeDeleted = false, options = { useSubcollection: false }) {
  const { useSubcollection } = options;
  const txCollection = useSubcollection
    ? collection(db, 'users', userId, 'transactions')
    : transactionsRootCollection;

  const q = useSubcollection
    ? query(txCollection, where('isDeleted', '==', includeDeleted))
    : query(txCollection, where('userId', '==', userId));

  const snapshot = await getDocs(q);
  const transactions = snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .filter((tx) => tx.isDeleted === includeDeleted);

  return transactions.sort((a, b) => {
    const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
    const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}

export async function restoreUserTransaction(transactionId, selectedUserId, options = { useSubcollection: false }) {
  const { useSubcollection } = options;
  const txRef = useSubcollection
    ? doc(db, 'users', selectedUserId, 'transactions', transactionId)
    : doc(db, 'transactions', transactionId);

  await updateDoc(txRef, { isDeleted: false });
}
