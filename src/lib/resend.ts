import { Resend } from 'resend';

// Récupération de la clé API Resend
const resendApiKey = process.env.RESEND_API_KEY;

// Vérification de la présence de la clé API
if (!resendApiKey) {
  console.error('ERREUR: La clé API Resend n\'est pas définie dans les variables d\'environnement.');
  console.error('Assurez-vous que RESEND_API_KEY est définie dans le fichier .env.local');
}

// Initialisation de l'instance Resend avec la clé API
export const resend = new Resend(resendApiKey || 'dummy_key_for_development');

// Configuration par défaut pour l'expéditeur
const defaultFrom = 'DataCop <notifications@votredomaine.com>';

/**
 * Fonction utilitaire pour envoyer des emails
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = defaultFrom,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}) {
  try {
    if (!resendApiKey) {
      console.error('Impossible d\'envoyer l\'email: la clé API Resend n\'est pas définie');
      return { success: false, error: 'Clé API Resend non configurée' };
    }

    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || '',
    });

    if (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exception lors de l\'envoi de l\'email:', error);
    return { success: false, error };
  }
}
