import { resend } from './resend';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Types d'emails disponibles
export type EmailType = 'password-reset' | 'installer-invitation' | 'user-invitation' | 'distributor-invitation' | 'document-sharing';

// Interface pour les paramètres d'email
interface EmailSettings {
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  defaultDomain: string;
}

// Fonction pour remplacer les variables dans un template
const replaceTemplateVariables = (template: string, variables: Record<string, string>) => {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\{\{${key}\}\}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
};

/**
 * Fonction pour envoyer un email en utilisant un template
 */
export async function sendTemplateEmail({
  to,
  type,
  variables,
  overrideSubject,
}: {
  to: string | string[];
  type: EmailType;
  variables: Record<string, string>;
  overrideSubject?: string;
}) {
  try {
    console.log(`Tentative d'envoi d'email de type ${type} à ${to}`);
    
    // Récupérer les paramètres d'email
    const settingsDoc = await getDoc(doc(db, 'settings', 'email_settings'));
    const emailSettings: EmailSettings = settingsDoc.exists()
      ? settingsDoc.data() as EmailSettings
      : {
          fromEmail: 'notifications@votredomaine.com',
          fromName: 'DataCop',
          defaultDomain: 'votredomaine.com',
        };
    
    console.log('Paramètres d\'email récupérés:', emailSettings);

    // Récupérer le template
    console.log(`Recherche du template d'email: ${type}`);
    const templateDoc = await getDoc(doc(db, 'email_templates', type));
    if (!templateDoc.exists()) {
      console.error(`Template d'email non trouvé: ${type}`);
      throw new Error(`Template d'email non trouvé: ${type}`);
    }

    console.log(`Template d'email trouvé: ${type}`);
    const templateData = templateDoc.data();
    const subject = overrideSubject || replaceTemplateVariables(templateData.subject, variables);
    const htmlTemplate = templateData.html;

    // Remplacer les variables dans le template
    const html = replaceTemplateVariables(htmlTemplate, variables);

    // Construire l'adresse d'expéditeur
    const from = `${emailSettings.fromName} <${emailSettings.fromEmail}>`;
    console.log(`Adresse d'expéditeur: ${from}`);
    
    // Options pour l'email
    const emailOptions: any = {
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    };

    // Ajouter l'adresse de réponse si elle existe
    if (emailSettings.replyToEmail) {
      emailOptions.replyTo = emailSettings.replyToEmail;
    }

    console.log('Envoi de l\'email avec les options:', { ...emailOptions, html: '(contenu HTML)' });
    
    // Envoyer l'email
    const { data, error } = await resend.emails.send(emailOptions);

    if (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return { success: false, error };
    }

    console.log('Email envoyé avec succès:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return { success: false, error };
  }
}

/**
 * Fonction pour envoyer un email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail({
  to,
  userName,
  resetLink,
}: {
  to: string;
  userName: string;
  resetLink: string;
}) {
  return sendTemplateEmail({
    to,
    type: 'password-reset',
    variables: {
      userName,
      resetLink,
    },
  });
}

/**
 * Fonction pour envoyer un email d'invitation à un installateur
 */
export async function sendInstallerInvitationEmail({
  to,
  installerName,
  companyName,
  inviterName,
  invitationLink,
}: {
  to: string;
  installerName: string;
  companyName: string;
  inviterName: string;
  invitationLink: string;
}) {
  return sendTemplateEmail({
    to,
    type: 'installer-invitation',
    variables: {
      installerName,
      companyName,
      inviterName,
      invitationLink,
    },
  });
}

/**
 * Fonction pour envoyer un email d'invitation à un utilisateur
 */
export async function sendUserInvitationEmail({
  to,
  userName,
  inviterName,
  invitationLink,
}: {
  to: string;
  userName: string;
  inviterName: string;
  invitationLink: string;
}) {
  console.log('Envoi d\'invitation utilisateur avec les variables:', {
    to,
    userName,
    inviterName,
    invitationLink
  });
  
  return sendTemplateEmail({
    to,
    type: 'user-invitation',
    variables: {
      userName,
      inviterName,
      invitationLink,
    },
  });
}

/**
 * Fonction pour envoyer un email d'invitation à un distributeur
 */
export async function sendDistributorInvitationEmail({
  to,
  invitationLink,
}: {
  to: string;
  invitationLink: string;
}) {
  return sendTemplateEmail({
    to,
    type: 'distributor-invitation',
    variables: {
      invitationLink,
    },
  });
}

/**
 * Fonction pour envoyer un email de partage de document
 */
export async function sendDocumentSharingEmail({
  to,
  senderName,
  documentName,
  documentLink,
}: {
  to: string;
  senderName: string;
  documentName: string;
  documentLink: string;
}) {
  return sendTemplateEmail({
    to,
    type: 'document-sharing',
    variables: {
      senderName,
      documentName,
      documentLink,
    },
  });
}
