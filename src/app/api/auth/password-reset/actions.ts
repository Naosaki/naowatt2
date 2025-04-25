"use server";

import { auth, db } from '@/lib/firebase';
import { sendPasswordResetEmail as sendResetEmail } from '@/lib/email-sender';
import { sendPasswordResetEmail as firebaseSendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Envoyer un email de réinitialisation de mot de passe
export async function sendPasswordResetEmail(email: string) {
  try {
    // Vérifier si l'email existe dans la base de données
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const usersSnapshot = await getDocs(q);
    
    if (usersSnapshot.empty) {
      // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
      return { success: true };
    }

    // Utiliser l'API Firebase pour envoyer un email de réinitialisation
    // Cela crée un token de réinitialisation valide que nous utiliserons dans notre email personnalisé
    await firebaseSendPasswordResetEmail(auth, email);
    
    // Récupérer le nom d'utilisateur pour personnaliser l'email
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const userName = userData.displayName || email.split('@')[0];
    
    // Construire l'URL de réinitialisation
    // Note: Nous ne pouvons pas récupérer le token Firebase directement, donc nous utilisons
    // le lien standard de Firebase qui sera envoyé par email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Essayer d'envoyer un email personnalisé avec Resend
    try {
      await sendResetEmail({
        to: email,
        userName,
        resetLink: `${baseUrl}/reset-password`, // L'utilisateur devra utiliser le lien dans l'email Firebase
      });
    } catch (resendError) {
      console.error('Erreur lors de l\'envoi de l\'email personnalisé:', resendError);
      // On continue même si l'envoi de l'email personnalisé échoue, car Firebase a déjà envoyé un email standard
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
    return { success: false, error: 'Une erreur est survenue lors de l\'envoi de l\'email' };
  }
}

// Vérifier la validité d'un token de réinitialisation
export async function verifyResetToken(token: string, _email: string) {
  try {
    // Vérifier le code de réinitialisation avec Firebase
    await verifyPasswordResetCode(auth, token);
    return { valid: true };
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return { valid: false };
  }
}

// Réinitialiser le mot de passe
export async function resetPassword(token: string, _email: string, newPassword: string) {
  try {
    // Confirmer la réinitialisation du mot de passe avec Firebase
    await confirmPasswordReset(auth, token, newPassword);
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    return { success: false, error: 'Une erreur est survenue lors de la réinitialisation du mot de passe' };
  }
}
