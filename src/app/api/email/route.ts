import { NextRequest, NextResponse } from 'next/server';
import { sendShareNotificationEmail, sendWelcomeEmail } from '@/lib/email-utils';

export async function POST(request: NextRequest) {
  try {
    const { type, ...data } = await request.json();

    // Vu00e9rification de su00e9curitu00e9 (vous pouvez ajouter une vu00e9rification d'authentification ici)
    // Par exemple, vu00e9rifier si l'utilisateur est connectu00e9 et a les droits nu00e9cessaires

    let result;

    // Router vers la bonne fonction d'envoi d'email selon le type
    switch (type) {
      case 'share-notification':
        result = await sendShareNotificationEmail(data as any);
        break;
      case 'welcome':
        result = await sendWelcomeEmail(data as any);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Type d\'email non pris en charge' },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
