import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { sendPasswordResetEmail } from '@/lib/email-sender';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email requis' },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe dans la base de données
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const usersSnapshot = await getDocs(q);
    
    if (usersSnapshot.empty) {
      // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
      return NextResponse.json({ success: true });
    }

    // Récupérer le nom d'utilisateur pour personnaliser l'email
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const userName = userData.displayName || email.split('@')[0];
    
    // Construire l'URL de base
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    try {
      // Générer un token de réinitialisation avec Firebase Admin
      const actionCodeSettings = {
        url: `${baseUrl}/reset-password`,
        handleCodeInApp: true
      };
      
      // Générer le lien de réinitialisation
      const resetLink = await adminAuth.generatePasswordResetLink(
        email, 
        actionCodeSettings
      );
      
      // Extraire le code OOB du lien
      const oobCode = new URL(resetLink).searchParams.get('oobCode');
      
      if (!oobCode) {
        throw new Error('Impossible de générer un code de réinitialisation valide');
      }
      
      // Créer un lien personnalisé qui pointe directement vers notre application
      const customResetLink = `${baseUrl}/reset-password?oobCode=${oobCode}&mode=resetPassword`;
      
      // Envoyer notre propre email personnalisé avec Resend
      const emailResult = await sendPasswordResetEmail({
        to: email,
        userName,
        resetLink: customResetLink // Utiliser notre lien personnalisé
      });
      
      // Vérifier si l'envoi de l'email a réussi
      if (!emailResult.success) {
        console.error('Erreur lors de l\'envoi de l\'email avec Resend:', emailResult.error);
        return NextResponse.json(
          { success: false, error: 'Une erreur est survenue lors de l\'envoi de l\'email' },
          { status: 500 }
        );
      }
      
      console.log('Email de réinitialisation personnalisé envoyé avec Resend');
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return NextResponse.json(
        { success: false, error: 'Une erreur est survenue lors de l\'envoi de l\'email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue lors de l\'envoi de l\'email' },
      { status: 500 }
    );
  }
}
