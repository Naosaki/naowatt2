// Utilisation conditionnelle de Resend en fonction de la disponibilité de la clé API
import { Resend } from 'resend';

// Configuration par défaut pour l'expéditeur
const defaultFrom = 'DataCop <notifications@votredomaine.com>';

// Clé API Resend (définie dans les variables d'environnement)
const resendApiKey = process.env.RESEND_API_KEY;

// Définition des types pour les paramètres et les réponses de Resend
type ResendEmailParams = {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  clickTracking?: boolean;
};

type ResendResponse = {
  data: { id: string } | null;
  error: { message: string } | null;
};

// Créer une instance de Resend si la clé API est disponible, sinon utiliser une implémentation simulée
export const resend = resendApiKey 
  ? new Resend(resendApiKey)
  : {
      emails: {
        send: async (params: ResendEmailParams): Promise<ResendResponse> => {
          console.log('Simulation d\'envoi d\'email via resend (pas de clé API configurée):', params);
          return { data: { id: `mock_email_${Date.now()}` }, error: null };
        }
      }
    };

/**
 * Fonction utilitaire pour envoyer des emails
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = defaultFrom,
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text: html.replace(/<[^>]*>/g, ''), // Version texte pour les clients qui ne supportent pas le HTML
      clickTracking: false, // Désactiver le tracking des clics pour éviter la modification des liens
    });

    if (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return { success: false, error: error.message };
    }

    console.log('Email envoyé avec succès:', data?.id);
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
    console.error('Exception lors de l\'envoi de l\'email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
