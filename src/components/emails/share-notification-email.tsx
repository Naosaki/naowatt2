import * as React from 'react';
import { EmailLayout, Button } from './email-layout';

interface ShareNotificationEmailProps {
  recipientName?: string;
  senderName: string;
  resourceName: string;
  resourceLink: string;
}

export const ShareNotificationEmail: React.FC<ShareNotificationEmailProps> = ({
  recipientName,
  senderName,
  resourceName,
  resourceLink,
}) => {
  const greeting = recipientName ? `Bonjour ${recipientName},` : 'Bonjour,';

  return (
    <EmailLayout previewText={`${senderName} a partagé "${resourceName}" avec vous`}>
      <div>
        <p style={{ fontSize: '16px', lineHeight: '1.5', margin: '0 0 15px' }}>
          {greeting}
        </p>
        <p style={{ fontSize: '16px', lineHeight: '1.5', margin: '0 0 15px' }}>
          <strong>{senderName}</strong> a partagé la ressource <strong>"{resourceName}"</strong> avec vous.
        </p>
        <p style={{ fontSize: '16px', lineHeight: '1.5', margin: '0 0 25px' }}>
          Vous pouvez y accéder en cliquant sur le bouton ci-dessous :
        </p>
        
        <Button href={resourceLink}>Accéder à la ressource</Button>
        
        <p style={{ fontSize: '16px', lineHeight: '1.5', margin: '25px 0 15px' }}>
          Si vous avez des questions, n'hésitez pas à contacter notre équipe de support.
        </p>
        <p style={{ fontSize: '16px', lineHeight: '1.5', margin: '0 0 10px' }}>
          Cordialement,
        </p>
        <p style={{ fontSize: '16px', lineHeight: '1.5', margin: '0' }}>
          L'équipe DataCop
        </p>
      </div>
    </EmailLayout>
  );
};
