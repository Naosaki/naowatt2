import * as React from 'react';
import { EmailLayout, Button } from './email-layout';

interface WelcomeEmailProps {
  userName: string;
  dashboardLink: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  userName,
  dashboardLink,
}) => {
  return (
    <EmailLayout previewText="Bienvenue sur DataCop">
      <div>
        <h2 style={{ color: '#0070f3', fontSize: '20px', fontWeight: 'bold', margin: '0 0 20px' }}>
          Bienvenue sur DataCop !
        </h2>
        <p style={{ fontSize: '16px', lineHeight: '1.5', margin: '0 0 15px' }}>
          Bonjour {userName},
        </p>
        <p style={{ fontSize: '16px', lineHeight: '1.5', margin: '0 0 15px' }}>
          Nous sommes ravis de vous accueillir sur DataCop. Notre plateforme vous permet de gu00e9rer et d'analyser vos donnu00e9es en toute simplicitu00e9.
        </p>
        <p style={{ fontSize: '16px', lineHeight: '1.5', margin: '0 0 25px' }}>
          Pour commencer, accu00e9dez u00e0 votre tableau de bord en cliquant sur le bouton ci-dessous :
        </p>
        
        <Button href={dashboardLink}>Accu00e9der u00e0 mon tableau de bord</Button>
        
        <p style={{ fontSize: '16px', lineHeight: '1.5', margin: '25px 0 15px' }}>
          Voici ce que vous pouvez faire avec DataCop :
        </p>
        <ul style={{ fontSize: '16px', lineHeight: '1.5', margin: '0 0 20px', paddingLeft: '20px' }}>
          <li style={{ margin: '0 0 10px' }}>Analyser vos donnu00e9es en temps ru00e9el</li>
          <li style={{ margin: '0 0 10px' }}>Partager des rapports avec votre u00e9quipe</li>
          <li style={{ margin: '0 0 10px' }}>Configurer des alertes personnalisu00e9es</li>
          <li style={{ margin: '0 0 10px' }}>Gu00e9nu00e9rer des visualisations avancu00e9es</li>
        </ul>
        <p style={{ fontSize: '16px', lineHeight: '1.5', margin: '0 0 15px' }}>
          Si vous avez des questions, n'hu00e9sitez pas u00e0 contacter notre u00e9quipe de support.
        </p>
        <p style={{ fontSize: '16px', lineHeight: '1.5', margin: '0 0 10px' }}>
          Cordialement,
        </p>
        <p style={{ fontSize: '16px', lineHeight: '1.5', margin: '0' }}>
          L'u00e9quipe DataCop
        </p>
      </div>
    </EmailLayout>
  );
};
