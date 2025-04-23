const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
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

// Fonction pour créer un administrateur
async function createAdmin() {
  try {
    // Paramètres de l'administrateur (à modifier selon vos besoins)
    const email = process.argv[2] || 'admin@datawatt.com';
    const password = process.argv[3] || 'Admin123!';
    const displayName = process.argv[4] || 'Admin User';
    
    // Création de l'utilisateur dans Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log(`Utilisateur créé avec l'ID: ${user.uid}`);
    
    // Ajout des informations supplémentaires dans Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      displayName: displayName,
      photoURL: null,
      role: 'admin',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
    
    console.log('Compte administrateur créé avec succès!');
    console.log(`Email: ${email}`);
    console.log(`Mot de passe: ${password}`);
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la création du compte administrateur:', error.message);
    process.exit(1);
  }
}

// Exécution de la fonction
createAdmin();
