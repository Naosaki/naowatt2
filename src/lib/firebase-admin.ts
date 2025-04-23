import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Configuration pour Firebase Admin SDK
export function initAdmin() {
  try {
    if (getApps().length === 0) {
      // Vérifier que les variables d'environnement sont définies
      if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not defined');
      }
      
      if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
        throw new Error('FIREBASE_ADMIN_CLIENT_EMAIL is not defined');
      }
      
      if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
        throw new Error('FIREBASE_ADMIN_PRIVATE_KEY is not defined');
      }

      // Gestion plus robuste de la clé privée pour Vercel
      let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
      
      // Si la clé est entourée de guillemets, les supprimer
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      
      // Remplacer les \n par de vrais sauts de ligne
      privateKey = privateKey.replace(/\\n/g, '\n');

      const firebaseAdminConfig = {
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
      };
      
      console.log('Initializing Firebase Admin with project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
      initializeApp(firebaseAdminConfig);
      console.log('Firebase Admin initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}
