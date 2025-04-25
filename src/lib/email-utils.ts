import { sendEmail } from './resend';

/**
 * Envoie un email de notification de partage
 */
export async function sendShareNotificationEmail({
  to,
  recipientName,
  senderName,
  resourceName,
  resourceLink,
}: {
  to: string | string[];
  recipientName?: string;
  senderName: string;
  resourceName: string;
  resourceLink: string;
}) {
  // Contenu HTML simple sans JSX
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333; font-size: 24px;">Notification de partage</h1>
      <p style="color: #555; font-size: 16px;">Bonjour ${recipientName || 'Utilisateur'},</p>
      <p style="color: #555; font-size: 16px;">${senderName} a partagé "${resourceName}" avec vous.</p>
      <p style="color: #555; font-size: 16px;">Vous pouvez y accéder via ce lien: <a href="${resourceLink}" style="color: #0066cc;">${resourceName}</a></p>
      <div style="margin-top: 30px; font-size: 14px; color: #777;">
        <p>Cordialement,</p>
        <p>L'équipe DataCop</p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `${senderName} a partagé "${resourceName}" avec vous`,
    html,
  });
}

/**
 * Envoie un email de bienvenue
 */
export async function sendWelcomeEmail({
  to,
  userName,
  dashboardLink,
}: {
  to: string | string[];
  userName: string;
  dashboardLink: string;
}) {
  // Contenu HTML simple sans JSX
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333; font-size: 24px;">Bienvenue sur notre plateforme</h1>
      <p style="color: #555; font-size: 16px;">Bonjour ${userName},</p>
      <p style="color: #555; font-size: 16px;">Nous sommes ravis de vous accueillir sur notre plateforme.</p>
      <p style="color: #555; font-size: 16px;">Vous pouvez accéder à votre tableau de bord via ce lien: <a href="${dashboardLink}" style="color: #0066cc;">Tableau de bord</a></p>
      <div style="margin-top: 30px; font-size: 14px; color: #777;">
        <p>Cordialement,</p>
        <p>L'équipe DataCop</p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Bienvenue sur notre plateforme`,
    html,
  });
}
