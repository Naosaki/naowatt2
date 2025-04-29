import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { sendInstallerInvitationEmail, sendUserInvitationEmail } from '@/lib/email-sender';

export async function POST(request: NextRequest) {
  try {
    const { email, name, role, companyName, inviterId } = await request.json();
    
    console.log('Demande d\'invitation reçue:', { email, name, role, companyName, inviterId });
    
    if (!email || !name || !role || !inviterId) {
      return NextResponse.json(
        { success: false, error: 'Informations manquantes' },
        { status: 400 }
      );
    }

    // Vérifier que l'inviteur existe et est un distributeur
    const inviterRef = doc(db, 'users', inviterId);
    const inviterDoc = await getDoc(inviterRef);
    
    if (!inviterDoc.exists() || inviterDoc.data().role !== 'distributor') {
      return NextResponse.json(
        { success: false, error: 'Vous n\'êtes pas autorisé à envoyer des invitations' },
        { status: 403 }
      );
    }

    // Récupérer les informations de l'inviteur
    const inviterData = inviterDoc.data();
    const inviterName = inviterData.displayName || inviterData.email;
    const inviterCompany = inviterData.companyName || 'Votre distributeur';

    // Générer un token d'invitation unique
    const invitationToken = generateToken();
    
    // Stocker l'invitation dans Firestore
    const invitationData = {
      email,
      name,
      role,
      companyName: role === 'installer' ? companyName : null, // Utiliser null au lieu de undefined
      inviterId,
      inviterName,
      inviterCompany,
      token: invitationToken,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expire après 7 jours
    };
    
    const invitationRef = await addDoc(collection(db, 'invitations'), invitationData);
    
    // Construire l'URL d'invitation
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL 
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || 'https://datacop.naosk.com';
    
    // S'assurer que le lien est absolu et ne sera pas modifié par le service de tracking
    const invitationLink = `${baseUrl}/accept-invitation?token=${invitationToken}&role=${role}`;
    
    // Envoyer l'email d'invitation selon le rôle
    let emailResult;
    
    console.log(`Envoi d'invitation ${role} à ${email}`);
    
    if (role === 'installer') {
      emailResult = await sendInstallerInvitationEmail({
        to: email,
        installerName: name,
        companyName: companyName || 'votre entreprise',
        inviterName,
        invitationLink,
      });
    } else {
      console.log('Préparation de l\'envoi d\'email pour utilisateur avec les données:', {
        to: email,
        userName: name,
        inviterName,
        invitationLink
      });
      
      emailResult = await sendUserInvitationEmail({
        to: email,
        userName: name,
        inviterName,
        invitationLink,
      });
    }
    
    // Vérifier si l'envoi de l'email a réussi
    if (!emailResult.success) {
      console.error('Erreur lors de l\'envoi de l\'email d\'invitation:', emailResult.error);
      return NextResponse.json(
        { success: false, error: 'Une erreur est survenue lors de l\'envoi de l\'email d\'invitation' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      invitationId: invitationRef.id,
      message: `Invitation envoyée à ${email}` 
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue lors de l\'envoi de l\'invitation' },
      { status: 500 }
    );
  }
}

// Fonction pour générer un token unique
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
}
