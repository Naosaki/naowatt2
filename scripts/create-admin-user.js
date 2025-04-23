const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDDJoTgWwKPKlXbhGktvy-NhEvjSBv_Vgg",
  authDomain: "datawatt.firebaseapp.com",
  projectId: "datawatt",
  storageBucket: "datawatt.firebasestorage.app",
  messagingSenderId: "845505924996",
  appId: "1:845505924996:web:7b9894136bf67cd1dd97d1"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Informations de l'administrateur
const adminEmail = 'admin@datawatt.com';
const adminPassword = 'Admin123!';
const adminName = 'Admin User';

// Fonction pour créer un administrateur
async function createAdmin() {
  try {
    console.log(`Tentative de création de l'administrateur avec l'email: ${adminEmail}`);
    
    // Vérifier d'abord si l'utilisateur existe déjà
    try {
      console.log('Vérification si l\'utilisateur existe déjà...');
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log('L\'utilisateur existe déjà, mise à jour du rôle administrateur dans Firestore');
      
      // Mettre à jour le rôle dans Firestore
      const user = auth.currentUser;
      await setDoc(doc(db, 'users', user.uid), {
        role: 'admin',
        lastLogin: serverTimestamp()
      }, { merge: true });
      
      console.log(`Utilisateur ${adminEmail} mis à jour avec le rôle admin`);
    } catch (signInError) {
      console.log('L\'utilisateur n\'existe pas encore, création d\'un nouvel utilisateur');
      
      // Créer un nouvel utilisateur
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const user = userCredential.user;
      
      console.log(`Nouvel utilisateur créé avec l'ID: ${user.uid}`);
      
      // Ajouter les informations dans Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: adminEmail,
        displayName: adminName,
        photoURL: null,
        role: 'admin',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
      
      console.log('Document utilisateur créé dans Firestore');
    }
    
    console.log('\nCompte administrateur prêt à être utilisé:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Mot de passe: ${adminPassword}`);
    console.log('\nVous pouvez maintenant vous connecter à l\'application avec ces identifiants.');
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la création/mise à jour du compte administrateur:', error);
    process.exit(1);
  }
}

// Exécution de la fonction
createAdmin();
