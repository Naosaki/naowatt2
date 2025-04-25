// Implémentation simplifiée sans dépendance externe pour le déploiement

// Configuration par défaut pour l'expéditeur
const defaultFrom = 'DataCop <notifications@votredomaine.com>';

// Exporter une instance factice de resend pour compatibilité
export const resend = {
  emails: {
    send: async (params: any) => {
      console.log('Simulation d\'envoi d\'email via resend:', params);
      return { data: { id: `mock_email_${Date.now()}` }, error: null };
    }
  }
};

/**
 * Fonction utilitaire pour envoyer des emails (version simplifiée pour le déploiement)
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
    // Simulation d'envoi d'email pour le déploiement
    console.log('Simulation d\'envoi d\'email:', {
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    // Retourne une réponse de succès simulée
    return { 
      success: true, 
      data: { id: `mock_email_${Date.now()}` } 
    };
  } catch (error) {
    console.error('Erreur lors de la simulation d\'envoi d\'email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}
