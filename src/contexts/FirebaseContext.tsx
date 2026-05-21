import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db, googleProvider, signInWithPopup, signOut } from '../lib/firebase';
import { Expense, ItineraryData } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  syncExpenses: (expenses: Expense[], tripId: string) => Promise<void>;
  updateExpense: (expense: Expense, tripId: string) => Promise<void>;
  deleteExpense: (expenseId: string, tripId: string) => Promise<void>;
  createTrip: (title: string) => Promise<string>;
  joinTrip: (tripId: string) => Promise<void>;
  listenToTripData: (tripId: string, onUpdate: (expenses: Expense[]) => void, onError?: (error: any) => void) => () => void;
  updateTrip: (tripId: string, title: string, dateRange: string, collaborators: string[], userId: string, data: any) => Promise<void>;
  listenToTrip: (tripId: string, onUpdate: (tripData: any) => void, onError?: (error: any) => void) => () => void;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  const syncExpenses = async (expenses: Expense[], tripId: string) => {
    if (!user) return;
    const path = `trips/${tripId}/expenses`;
    try {
      for (const expense of expenses) {
        await setDoc(doc(db, path, expense.id), {
          ...expense,
          userId: user.uid,
          tripId
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const updateExpense = async (expense: Expense, tripId: string) => {
    if (!user) return;
    const path = `trips/${tripId}/expenses/${expense.id}`;
    try {
      await setDoc(doc(db, path), {
        ...expense,
        userId: user.uid,
        tripId
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteExpense = async (expenseId: string, tripId: string) => {
    if (!user) return;
    const path = `trips/${tripId}/expenses/${expenseId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const createTrip = async (title: string): Promise<string> => {
    if (!user) throw new Error('Must be logged in');
    const tripId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const path = `trips/${tripId}`;
    try {
      await setDoc(doc(db, path), {
        id: tripId,
        userId: user.uid,
        title,
        collaborators: [user.uid],
        updatedAt: new Date().toISOString()
      });
      return tripId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  };

  const joinTrip = async (tripId: string) => {
    if (!user) throw new Error('Must be logged in');
    const path = `trips/${tripId}`;
    try {
      const tripRef = doc(db, path);
      const tripDoc = await getDocFromServer(tripRef);
      if (!tripDoc.exists()) throw new Error('行程 ID 不存在');
      
      const data = tripDoc.data();
      const collaborators = data.collaborators || [];
      if (!collaborators.includes(user.uid)) {
        await setDoc(tripRef, {
          ...data,
          collaborators: [...collaborators, user.uid]
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const listenToTripData = (tripId: string, onUpdate: (expenses: Expense[]) => void, onError?: (error: any) => void) => {
    const q = collection(db, `trips/${tripId}/expenses`);
    return onSnapshot(q, (snapshot) => {
      const expenses = snapshot.docs.map(d => d.data() as Expense);
      onUpdate(expenses);
    }, (error) => {
      console.error('Snapshot Listener Error:', error);
      if (onError) onError(error);
    });
  };

  const updateTrip = async (tripId: string, title: string, dateRange: string, collaborators: string[], userId: string, data: any) => {
    if (!user) return;
    const path = `trips/${tripId}`;
    try {
      await setDoc(doc(db, path), {
        id: tripId,
        userId,
        collaborators,
        title,
        dateRange,
        data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const listenToTrip = (tripId: string, onUpdate: (tripData: any) => void, onError?: (error: any) => void) => {
    const path = `trips/${tripId}`;
    return onSnapshot(doc(db, path), (snapshot) => {
      onUpdate(snapshot.data());
    }, (error) => {
      console.error('ListenToTrip Error:', error);
      if (onError) onError(error);
    });
  };

  return (
    <FirebaseContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      logout, 
      syncExpenses, 
      updateExpense, 
      deleteExpense,
      createTrip,
      joinTrip,
      listenToTripData,
      updateTrip,
      listenToTrip
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
