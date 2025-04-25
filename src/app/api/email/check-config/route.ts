import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';

interface ResendError {
  message: string;
  statusCode?: number;
}

// Route pour vérifier la configuration de Resend
export async function GET() {
  try {
    // Vérifier si la clé API est définie
    const apiKeyDefined = !!process.env.RESEND_API_KEY;
    
    // Tester la connexion à Resend si la clé est définie
    let resendConnection = false;
    let errorMessage = '';
    
    if (apiKeyDefined) {
      try {
        // Tenter d'obtenir les domaines pour vérifier la connexion
        const { error } = await resend.domains.list();
        
        if (error) {
          errorMessage = `Erreur lors de la connexion à Resend: ${error.message}`;
          resendConnection = false;
        } else {
          resendConnection = true;
        }
      } catch (error) {
        const err = error as Error | ResendError;
        errorMessage = `Exception lors de la connexion à Resend: ${err.message || 'Erreur inconnue'}`;
        resendConnection = false;
      }
    } else {
      errorMessage = 'La clé API Resend n\'est pas définie dans les variables d\'environnement';
    }
    
    // Récupérer les variables d'environnement liées aux emails
    const emailConfig = {
      RESEND_API_KEY: apiKeyDefined ? '✓ Définie' : '✗ Non définie',
      EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS || '✗ Non définie',
      EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || '✗ Non définie',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '✗ Non définie',
    };
    
    return NextResponse.json({
      success: true,
      config: emailConfig,
      resendConnection: resendConnection ? '✓ Connecté' : '✗ Non connecté',
      error: errorMessage || null,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({
      success: false,
      error: `Erreur lors de la vérification de la configuration: ${err.message || 'Erreur inconnue'}`,
    }, { status: 500 });
  }
}
