// User types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'user' | 'distributor' | 'installer';
  createdAt: Date;
  lastLogin: Date;
  createdBy?: string; // ID de l'utilisateur qui a créé ce compte
  distributorId?: string; // ID du distributeur associé (pour les installateurs et utilisateurs)
  managedUsers?: string[]; // IDs des utilisateurs gérés par ce distributeur/installateur
}

// Document types
export interface Document {
  id: string;
  name: string;
  description: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
  category: string;
  productType: string;
  language: string;
  accessRoles: ('admin' | 'user' | 'distributor' | 'installer')[];
  version: string;
  productId?: string;
}

// Download history
export interface DownloadHistory {
  id: string;
  userId: string;
  documentId: string;
  downloadedAt: Date;
  userEmail: string;
  documentName: string;
  category?: string;
  productType?: string;
  language?: string;
  fileUrl?: string;
}

// Category type
export interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  accessRoles: ('admin' | 'user' | 'distributor' | 'installer')[];
}

// Product Type
export interface ProductType {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  accessRoles: ('admin' | 'user' | 'distributor' | 'installer')[];
}

// Language type
export interface Language {
  id: string;
  name: string;         // Nom de la langue (ex: Français, English, Deutsch)
  code: string;         // Code de la langue (ex: fr, en, de)
  isDefault: boolean;   // Indique si c'est la langue par défaut
  createdAt: Date;
  accessRoles: ('admin' | 'user' | 'distributor' | 'installer')[];
}

// App Settings
export interface AppSettings {
  id: string;
  logoLightMode: string; // URL du logo pour le mode clair
  logoDarkMode: string;  // URL du logo pour le mode sombre
  appName: string;       // Nom de l'application
  footerText: string;    // Texte personnalisé pour le footer
  updatedAt: Date;       // Date de dernière mise à jour
  updatedBy: string;     // ID de l'utilisateur qui a fait la mise à jour
}
