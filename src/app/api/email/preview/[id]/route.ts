import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Données de test pour prévisualiser les templates
const getTestData = (templateType: string) => {
  switch (templateType) {
    case 'password-reset':
      return {
        userName: 'Jean Dupont',
        resetLink: 'https://datacop.app/reset-password?token=example'
      };
    case 'installer-invitation':
    case 'distributor-invitation':
      return {
        invitationLink: 'https://datacop.app/invitation?token=example'
      };
    case 'user-invitation':
      return {
        senderName: 'Marie Martin',
        invitationLink: 'https://datacop.app/invitation?token=example'
      };
    case 'document-sharing':
      return {
        senderName: 'Pierre Durand',
        documentName: 'Rapport mensuel',
        documentLink: 'https://datacop.app/documents/example'
      };
    default:
      return {};
  }
};

// Fonction pour remplacer les variables dans le template
const replaceTemplateVariables = (html: string, data: Record<string, string>) => {
  let result = html;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\{\{${key}\}\}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
};

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const templateId = params.id;
    
    // Récupérer le template depuis Firestore
    const templateDoc = await getDoc(doc(db, 'email_templates', templateId));
    
    if (!templateDoc.exists()) {
      return NextResponse.json(
        { error: 'Template non trouvé' },
        { status: 404 }
      );
    }
    
    const templateData = templateDoc.data();
    const templateType = templateData.type;
    const html = templateData.html;
    
    // Obtenir les données de test pour ce type de template
    const testData = getTestData(templateType);
    
    // Remplacer les variables dans le template
    const renderedHtml = replaceTemplateVariables(html, testData);
    
    // Ajouter un peu de style pour la prévisualisation
    const previewHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Prévisualisation: ${templateData.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .preview-info {
              background-color: #f0f0f0;
              border: 1px solid #ddd;
              border-radius: 4px;
              padding: 15px;
              margin-bottom: 20px;
            }
            .preview-info h2 {
              margin-top: 0;
              color: #0070f3;
            }
            .preview-info p {
              margin: 5px 0;
            }
            .email-content {
              border: 1px solid #ddd;
              border-radius: 4px;
              padding: 20px;
              background-color: white;
            }
          </style>
        </head>
        <body>
          <div class="preview-info">
            <h2>Prévisualisation du template</h2>
            <p><strong>Nom:</strong> ${templateData.name}</p>
            <p><strong>Objet:</strong> ${templateData.subject}</p>
            <p><strong>Type:</strong> ${templateType}</p>
          </div>
          <div class="email-content">
            ${renderedHtml}
          </div>
        </body>
      </html>
    `;
    
    return new NextResponse(previewHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Erreur lors de la prévisualisation du template:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la prévisualisation du template' },
      { status: 500 }
    );
  }
}
