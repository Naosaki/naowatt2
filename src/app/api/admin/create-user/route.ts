import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Récupérer le token d'authentification de l'en-tête
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Vérifier le token
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      const adminUser = await adminAuth.getUser(decodedToken.uid);
      
      // Vérifier que l'utilisateur est un administrateur
      const userDoc = await adminDb.collection('users').doc(adminUser.uid).get();
      if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
        return NextResponse.json({ message: 'Accès refusé' }, { status: 403 });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      return NextResponse.json({ message: 'Token invalide ou expiré' }, { status: 401 });
    }

    // Récupérer les données de la requête
    const { email, password, displayName, role, distributorId, newDistributorName } = await request.json();

    // Valider les données
    if (!email || !password || !displayName || !role) {
      return NextResponse.json({ message: 'Données incomplètes' }, { status: 400 });
    }

    // Créer l'utilisateur dans Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // Préparer les données utilisateur pour Firestore
    const userData: Record<string, any> = {
      id: userRecord.uid,
      email: email,
      name: displayName,
      role: role,
      active: true,
      createdAt: new Date(),
      lastLogin: new Date(),
    };

    // Si c'est un distributeur, ajouter les informations spécifiques
    if (role === 'distributor') {
      if (newDistributorName) {
        // Créer une nouvelle entreprise distributrice
        const newDistributorRef = adminDb.collection('distributors').doc();
        const distributorData = {
          name: newDistributorName,
          companyName: newDistributorName,
          address: '',
          contactEmail: email,
          contactPhone: '',
          active: true,
          createdAt: new Date(),
          teamMembers: [userRecord.uid],
          adminMembers: [userRecord.uid]
        };

        await newDistributorRef.set(distributorData);

        // Mettre à jour les données de l'utilisateur avec l'ID du distributeur
        userData.distributorId = newDistributorRef.id;
        userData.isDistributorAdmin = true; // Premier utilisateur est admin par défaut
      } else if (distributorId) {
        // Associer l'utilisateur à un distributeur existant
        userData.distributorId = distributorId;
        userData.isDistributorAdmin = false; // Par défaut, les nouveaux utilisateurs ne sont pas admin

        // Mettre à jour le document distributeur pour ajouter cet utilisateur
        const distributorRef = adminDb.collection('distributors').doc(distributorId);
        const distributorDoc = await distributorRef.get();

        if (distributorDoc.exists) {
          const distributorData = distributorDoc.data();
          const teamMembers = [...(distributorData?.teamMembers || []), userRecord.uid];
          await distributorRef.update({ teamMembers });
        }
      }
    }

    // Créer le document utilisateur dans Firestore
    await adminDb.collection('users').doc(userRecord.uid).set(userData);

    return NextResponse.json({ 
      success: true, 
      userId: userRecord.uid,
      message: `Utilisateur ${displayName} créé avec succès` 
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    
    // Gérer les erreurs spécifiques
    let errorMessage = 'Une erreur est survenue lors de la création de l\'utilisateur';
    
    if (error instanceof Error) {
      if (error.message.includes('auth/email-already-in-use')) {
        errorMessage = 'Cette adresse email est déjà utilisée par un autre compte.';
      } else if (error.message.includes('auth/invalid-email')) {
        errorMessage = 'Adresse email invalide.';
      } else if (error.message.includes('auth/weak-password')) {
        errorMessage = 'Le mot de passe est trop faible. Il doit contenir au moins 6 caractères.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
