import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Templates par défaut pour les emails
const defaultTemplates = [
  {
    name: 'Réinitialisation de mot de passe',
    subject: 'Réinitialisation de votre mot de passe DataCop',
    description: "Email envoyé lorsqu'un utilisateur demande à réinitialiser son mot de passe",
    html: `<div>
      <h1>Réinitialisation de votre mot de passe</h1>
      <p>Bonjour {{userName}},</p>
      <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte DataCop.</p>
      <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
      <p><a href="{{resetLink}}">Réinitialiser mon mot de passe</a></p>
      <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
      <p>Cordialement,<br>L'équipe DataCop</p>
    </div>`,
    lastUpdated: new Date(),
    type: 'password-reset'
  },
  {
    name: 'Invitation installateur',
    subject: "Invitation à rejoindre DataCop en tant qu'installateur",
    description: "Email envoyé pour inviter un nouvel installateur à rejoindre la plateforme",
    html: `<div>
      <h1>Invitation à rejoindre DataCop</h1>
      <p>Bonjour {{installerName}},</p>
      <p>{{inviterName}} vous a invité(e) à rejoindre DataCop en tant qu'installateur pour {{companyName}}.</p>
      <p>Cliquez sur le lien ci-dessous pour créer votre compte :</p>
      <p><a href="{{invitationLink}}">Créer mon compte installateur</a></p>
      <p>Cette invitation expire dans 7 jours.</p>
      <p>Cordialement,<br>L'équipe DataCop</p>
    </div>`,
    lastUpdated: new Date(),
    type: 'installer-invitation'
  },
  {
    name: 'Invitation utilisateur',
    subject: 'Invitation à rejoindre DataCop',
    description: "Email envoyé pour inviter un nouvel utilisateur à rejoindre la plateforme",
    html: `<div>
      <h1>Invitation à rejoindre DataCop</h1>
      <p>Bonjour {{userName}},</p>
      <p>{{inviterName}} vous a invité(e) à rejoindre DataCop.</p>
      <p>Cliquez sur le lien ci-dessous pour créer votre compte :</p>
      <p><a href="{{invitationLink}}">Créer mon compte</a></p>
      <p>Cette invitation expire dans 7 jours.</p>
      <p>Cordialement,<br>L'équipe DataCop</p>
    </div>`,
    lastUpdated: new Date(),
    type: 'user-invitation'
  },
  {
    name: 'Invitation distributeur',
    subject: 'Invitation à rejoindre DataCop en tant que distributeur',
    description: "Email envoyé pour inviter un nouveau distributeur à rejoindre la plateforme",
    html: `<div>
      <h1>Invitation à rejoindre DataCop</h1>
      <p>Bonjour,</p>
      <p>Vous avez été invité(e) à rejoindre DataCop en tant que distributeur.</p>
      <p>Cliquez sur le lien ci-dessous pour créer votre compte :</p>
      <p><a href="{{invitationLink}}">Créer mon compte distributeur</a></p>
      <p>Cette invitation expire dans 7 jours.</p>
      <p>Cordialement,<br>L'équipe DataCop</p>
    </div>`,
    lastUpdated: new Date(),
    type: 'distributor-invitation'
  },
  {
    name: 'Partage de document',
    subject: '{{senderName}} a partagé un document avec vous',
    description: "Email envoyé lorsqu'un utilisateur partage un document",
    html: `<div>
      <h1>Un document a été partagé avec vous</h1>
      <p>Bonjour,</p>
      <p>{{senderName}} a partagé le document "{{documentName}}" avec vous.</p>
      <p>Cliquez sur le lien ci-dessous pour y accéder :</p>
      <p><a href="{{documentLink}}">Accéder au document</a></p>
      <p>Cordialement,<br>L'équipe DataCop</p>
    </div>`,
    lastUpdated: new Date(),
    type: 'document-sharing'
  }
];

// Paramètres par défaut pour les emails
const DEFAULT_EMAIL_SETTINGS = {
  fromEmail: 'notifications@votredomaine.com',
  fromName: 'DataCop',
  replyToEmail: '',
  defaultDomain: 'votredomaine.com'
};

export async function GET() {
  try {
    // Vérifier et créer les paramètres d'email par défaut
    const settingsDoc = await getDoc(doc(db, 'settings', 'email_settings'));
    if (!settingsDoc.exists()) {
      await setDoc(doc(db, 'settings', 'email_settings'), DEFAULT_EMAIL_SETTINGS);
    }
    
    // Créer ou mettre à jour les templates d'email
    for (const template of defaultTemplates) {
      const templateDoc = await getDoc(doc(db, 'email_templates', template.type));
      if (!templateDoc.exists()) {
        await setDoc(doc(db, 'email_templates', template.type), template);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Templates d\'email initialisés avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des templates d\'email:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'initialisation des templates d\'email' },
      { status: 500 }
    );
  }
}
