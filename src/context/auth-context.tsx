"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, createUserWithEmailAndPassword, updatePassword, EmailAuthProvider, reauthenticateWithCredential, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, name: string, role: 'admin' | 'user' | 'distributor' | 'installer', distributorId?: string, keepCurrentUser?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserName: (name: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
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
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || userData.name || '',
              role: userData.role || 'user',
              active: userData.active !== false, // Par défaut actif si non spécifié
              createdAt: userData.createdAt?.toDate() || new Date(),
              lastLogin: userData.lastLogin?.toDate() || new Date(),
              createdBy: userData.createdBy,
              distributorId: userData.distributorId,
              managedUsers: userData.managedUsers,
              isDistributorAdmin: userData.isDistributorAdmin || false
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
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || '',
            role: 'user', // Rôle par défaut
            active: true,
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
        
        // L'utilisateur existe dans Firestore, récupérer ses données
        const userData = userDoc.data();
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || userData.name || '',
          role: userData.role || 'user',
          active: userData.active !== false,
          createdAt: userData.createdAt?.toDate() || new Date(),
          lastLogin: new Date(),
          createdBy: userData.createdBy,
          distributorId: userData.distributorId,
          managedUsers: userData.managedUsers,
          isDistributorAdmin: userData.isDistributorAdmin || false
        };
        
        // Mettre à jour la date de dernière connexion
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          lastLogin: serverTimestamp()
        }, { merge: true });
        
        return user;
      } catch (firestoreError) {
        console.error('Error retrieving/creating user document in Firestore:', firestoreError);
        throw firestoreError;
      }
    } catch (authError) {
      console.error('Firebase authentication error:', authError);
      throw authError;
    }
  };

  const signUp = async (email: string, password: string, name: string, role: 'admin' | 'user' | 'distributor' | 'installer', distributorId?: string, keepCurrentUser = false) => {
    if (keepCurrentUser && user) {
      // Nous ne pouvons pas obtenir le mot de passe de l'utilisateur actuel depuis Firebase
      // Cette approche ne fonctionnera pas sans demander le mot de passe à l'utilisateur
      console.log('Tentative de création d\'utilisateur tout en conservant l\'utilisateur actuel');
    }
    
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Create user document in Firestore
      const newUser: User = {
        id: firebaseUser.uid,
        email: email,
        name: name,
        role: role,
        active: true,
        createdAt: new Date(),
        lastLogin: new Date(),
      };
      
      // Ajouter distributorId seulement s'il est défini
      if (distributorId) {
        newUser.distributorId = distributorId;
      }
      
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...newUser,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
      
      // Si nous voulons garder l'utilisateur actuel, nous devons le déconnecter et le reconnecter
      if (keepCurrentUser && user) {
        // Déconnecter l'utilisateur qui vient d'être créé
        await firebaseSignOut(auth);
        
        // Nous ne pouvons pas reconnecter l'utilisateur actuel sans son mot de passe
        // Nous devons informer l'utilisateur qu'il doit se reconnecter manuellement
        console.log('L\'utilisateur a été créé avec succès, mais l\'administrateur doit se reconnecter manuellement');
      }
    } catch (error) {
      console.error('Error creating new user:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateUserName = async (name: string) => {
    try {
      if (user) {
        await updateProfile(auth.currentUser!, { displayName: name });
        await setDoc(doc(db, 'users', user.id), { name }, { merge: true });
      } else {
        console.error('User is not signed in');
      }
    } catch (error) {
      console.error('Error updating user name:', error);
      throw error;
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (user) {
        const userCredential = await reauthenticateWithCredential(auth.currentUser!, EmailAuthProvider.credential(user.email, currentPassword));
        await updatePassword(userCredential.user, newPassword);
      } else {
        console.error('User is not signed in');
      }
    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateUserName,
    updateUserPassword,
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
