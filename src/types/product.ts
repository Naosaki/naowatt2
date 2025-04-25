// Types pour les produits

export interface Product {
  id?: string;
  name: string;          // Nom du produit (ex: "Micro-onduleur XYZ-1000")
  description: string;   // Description du produit
  productTypeId: string; // ID du type de produit auquel ce produit appartient
  reference: string;     // Référence ou code du produit
  imageUrl?: string;     // URL de l'image du produit (optionnel)
  websiteUrl?: string;
  languageId?: string;
  accessRoles?: string[];
  active: boolean;       // Si le produit est actif/disponible
  createdAt: number;     // Date de création (timestamp)
  updatedAt: number;     // Date de dernière mise à jour (timestamp)
}

// Type pour les types de produits (catégories)
export interface ProductType {
  id?: string;
  name: string;          // Nom du type de produit (ex: "Micro-onduleurs")
  description?: string;  // Description du type de produit
}

// Type étendu pour les documents, avec lien vers le produit
export interface DocumentWithProduct {
  id?: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  productId: string;     // ID du produit auquel ce document est associé
  categoryId: string;    // Catégorie du document (ex: "Fiche technique", "Certification")
  languageId: string;    // Langue du document
  uploadedAt: number;
  updatedAt?: number;
  active: boolean;
}
