"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, displayName: string, role: 'admin' | 'user' | 'distributor' | 'installer', distributorId?: string, keepCurrentUser?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            // Convert Firestore timestamp to Date
            const userData = userDoc.data();
            const user: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: userData.role,
              createdAt: userData.createdAt?.toDate() || new Date(),
              lastLogin: userData.lastLogin?.toDate() || new Date(),
            };
            setUser(user);
            
            // Update last login
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              lastLogin: serverTimestamp()
            }, { merge: true });
          } else {
            // This should not happen in normal flow as users are created in signUp
            console.warn('User authenticated but no document found in Firestore');
            setUser(null);
          }
        } else {
          // User is signed out
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      console.log('Attempting to sign in with email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('Firebase authentication successful for user ID:', firebaseUser.uid);
      
      // Récupérer les données utilisateur depuis Firestore
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        console.log('Firestore user document exists:', userDoc.exists());
        
        if (!userDoc.exists()) {
          console.log('Creating user document in Firestore for new user');
          // Si l'utilisateur n'existe pas dans Firestore, créons-le avec un rôle par défaut
          const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: 'user', // Rôle par défaut
            createdAt: new Date(),
            lastLogin: new Date(),
          };
          
          // Créer le document utilisateur dans Firestore
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            ...newUser,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          });
          
          return newUser;
        }
        
        const userData = userDoc.data();
        console.log('User data retrieved:', userData);
        
        // Vérifier si les champs de date existent et sont des timestamps Firestore
        const createdAt = userData.createdAt ? 
          (typeof userData.createdAt.toDate === 'function' ? userData.createdAt.toDate() : new Date()) : 
          new Date();
          
        const lastLogin = userData.lastLogin ? 
          (typeof userData.lastLogin.toDate === 'function' ? userData.lastLogin.toDate() : new Date()) : 
          new Date();
        
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || userData.displayName || null,
          photoURL: firebaseUser.photoURL || userData.photoURL || null,
          role: userData.role || 'user',
          createdAt: createdAt,
          lastLogin: lastLogin,
        };
        
        // Mettre à jour la dernière connexion
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          lastLogin: serverTimestamp()
        }, { merge: true });
        
        console.log('User object created successfully:', user);
        return user;
      } catch (firestoreError) {
        console.error('Error retrieving user data from Firestore:', firestoreError);
        // En cas d'erreur Firestore, retourner quand même un utilisateur avec des valeurs par défaut
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: 'user', // Rôle par défaut
          createdAt: new Date(),
          lastLogin: new Date(),
        };
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string, role: 'admin' | 'user' | 'distributor' | 'installer', distributorId?: string, keepCurrentUser: boolean = false) => {
    try {
      // Sauvegarder l'utilisateur actuel si keepCurrentUser est true
      const currentUser = auth.currentUser;
      const currentUserEmail = currentUser?.email;
      const currentUserPassword = keepCurrentUser ? sessionStorage.getItem('tempPassword') || '' : '';
      
      // Créer le nouvel utilisateur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName,
        photoURL: null,
        role: role,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        createdBy: user?.uid || null, // L'utilisateur actuel qui créé ce compte
        distributorId: role === 'distributor' ? null : distributorId, // Associer au distributeur si applicable
        managedUsers: [],
      });

      // Si l'utilisateur actuel est un distributeur et qu'il créé un installateur ou un utilisateur
      if (user?.role === 'distributor' && (role === 'installer' || role === 'user')) {
        // Ajouter l'ID du nouvel utilisateur à la liste des utilisateurs gérés par ce distributeur
        await setDoc(doc(db, 'users', user.uid), {
          managedUsers: [...(user.managedUsers || []), firebaseUser.uid]
        }, { merge: true });
      }
      
      // Si on doit conserver l'utilisateur actuel, se reconnecter avec ses identifiants
      if (keepCurrentUser && currentUserEmail && currentUserPassword) {
        await signInWithEmailAndPassword(auth, currentUserEmail, currentUserPassword);
      }
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
