import { NextResponse } from 'next/server';
import { sendShareNotificationEmail } from '@/lib/email-utils';

// Cette route est uniquement pour tester l'envoi d'emails
// Ne pas utiliser en production
export async function GET() {
  try {
    // Remplacez par une adresse email valide pour tester
    const testEmail = 'votre-email@exemple.com';
    
    const result = await sendShareNotificationEmail({
      to: testEmail,
      senderName: 'John Doe',
      resourceName: 'Rapport mensuel',
      resourceLink: 'https://datacop.app/reports/123',
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Email de test envoyé à ${testEmail}`,
      data: result.data
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi de l\'email de test:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
