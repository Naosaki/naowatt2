import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

// Initialiser Firebase Admin si ce n'est pas déjà fait
try {
  console.log('Initializing Firebase Admin in delete-user API route');
  initAdmin();
  console.log('Firebase Admin initialized successfully in delete-user API route');
} catch (error) {
  console.error('Failed to initialize Firebase Admin in delete-user API route:', error);
}

export async function POST(request: NextRequest) {
  console.log('DELETE USER API route called');
  
  try {
    // Vérifier que la requête est bien au format JSON
    let data;
    try {
      data = await request.json();
      console.log('Request data:', data);
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const { userId, adminUserId } = data;
    
    if (!userId) {
      console.error('Missing userId in request');
      return NextResponse.json({ error: 'ID utilisateur manquant' }, { status: 400 });
    }

    if (!adminUserId) {
      console.error('Missing adminUserId in request');
      return NextResponse.json({ error: 'ID administrateur manquant' }, { status: 400 });
    }

    console.log(`Attempting to delete user ${userId} by admin ${adminUserId}`);

    // Supprimer l'utilisateur de Firebase Authentication
    try {
      console.log('Deleting user from Firebase Authentication...');
      await getAuth().deleteUser(userId);
      console.log('User successfully deleted from Firebase Authentication');
    } catch (authError) {
      console.error('Error deleting user from Firebase Authentication:', authError);
      return NextResponse.json(
        { 
          error: 'Erreur lors de la suppression de l\'utilisateur dans Firebase Authentication', 
          details: authError instanceof Error ? authError.message : 'Erreur inconnue'
        }, 
        { status: 500 }
      );
    }
    
    // Supprimer l'utilisateur de Firestore
    try {
      console.log('Deleting user from Firestore...');
      await deleteDoc(doc(db, 'users', userId));
      console.log('User successfully deleted from Firestore');
    } catch (firestoreError) {
      console.error('Error deleting user from Firestore:', firestoreError);
      return NextResponse.json(
        { 
          error: 'Erreur lors de la suppression de l\'utilisateur dans Firestore', 
          details: firestoreError instanceof Error ? firestoreError.message : 'Erreur inconnue'
        }, 
        { status: 500 }
      );
    }

    console.log('User deletion completed successfully');
    return NextResponse.json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (error: unknown) {
    console.error('Unexpected error during user deletion:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { 
        error: 'Erreur lors de la suppression de l\'utilisateur', 
        details: errorMessage
      }, 
      { status: 500 }
    );
  }
}
