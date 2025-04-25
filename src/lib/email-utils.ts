import { renderToString } from 'react-dom/server';
import { resend, sendEmail } from './resend';
import { ShareNotificationEmail } from '@/components/emails/share-notification-email';
import { WelcomeEmail } from '@/components/emails/welcome-email';

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
  const html = renderToString(
    <ShareNotificationEmail
      recipientName={recipientName}
      senderName={senderName}
      resourceName={resourceName}
      resourceLink={resourceLink}
    />
  );

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
  const html = renderToString(
    <WelcomeEmail
      userName={userName}
      dashboardLink={dashboardLink}
    />
  );

  return sendEmail({
    to,
    subject: `Bienvenue sur DataCop, ${userName} !`,
    html,
  });
}
