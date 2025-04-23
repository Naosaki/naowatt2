import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    // Récupérer les données du corps de la requête
    const data = await request.json();
    
    // Valider les données requises
    if (!data.userId || !data.documentId || !data.documentName) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }
    
    // Créer un nouvel enregistrement dans la collection downloadHistory
    const downloadRef = collection(db, 'downloadHistory');
    await addDoc(downloadRef, {
      userId: data.userId,
      documentId: data.documentId,
      documentName: data.documentName,
      userEmail: data.userEmail || '',
      downloadedAt: serverTimestamp(),
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du téléchargement:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement du téléchargement' },
      { status: 500 }
    );
  }
}
