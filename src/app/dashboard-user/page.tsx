"use client";

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AppLogo } from '@/components/app-logo';
import { UserProfileMenu } from '@/components/user-profile-menu';
import { LayoutDashboard, Download, Search, Book } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where, doc, getDoc, DocumentReference } from 'firebase/firestore';
import { Document as DocumentType, DownloadHistory } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ProductCatalog } from '@/components/catalog/product-catalog';
import { Footer } from '@/components/footer';

export default function UserDashboardPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p>Chargement...</p></div>}>
      <UserDashboardContent />
    </Suspense>
  );
}

function UserDashboardContent() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [recentDocuments, setRecentDocuments] = useState<DocumentType[]>([]);
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistory[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const [productTypes, setProductTypes] = useState<{ id: string, name: string }[]>([]);
  const [languages, setLanguages] = useState<{ id: string, name: string }[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentType[]>([]);
  const [activeTab, setActiveTab] = useState('documents');

  // Fonction pour vérifier si un tableau contient une valeur, peu importe son index
  const arrayContainsValue = useCallback((array: string[], value: string) => {
    return array && Array.isArray(array) && array.includes(value);
  }, []);

  // Fonction pour récupérer les documents récents
  const fetchRecentDocuments = useCallback(async () => {
    if (!user) return;
    
    setLoadingDocuments(true);
    setError(null);
    
    try {
      const documentsQuery = query(
        collection(db, 'documents'),
        orderBy('uploadedAt', 'desc')
        // Suppression de la limite pour récupérer tous les documents
      );
      
      const querySnapshot = await getDocs(documentsQuery);
      const documentsList: DocumentType[] = [];
      
      querySnapshot.forEach((doc) => {
        const documentData = doc.data();
        // Vérifier si le document est accessible pour les utilisateurs
        if (arrayContainsValue(documentData.accessRoles, 'user')) {
          documentsList.push({
            id: doc.id,
            name: documentData.name,
            description: documentData.description,
            fileUrl: documentData.fileUrl,
            fileType: documentData.fileType,
            fileSize: documentData.fileSize,
            uploadedBy: documentData.uploadedBy,
            uploadedAt: documentData.uploadedAt?.toDate() || new Date(),
            category: documentData.category,
            productType: documentData.productType || '',
            language: documentData.language || '',
            accessRoles: documentData.accessRoles || ['admin'],
            version: documentData.version || '1.0',
          });
        }
      });
      
      setRecentDocuments(documentsList);
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      setError('Impossible de récupérer les documents. Veuillez réessayer plus tard.');
    } finally {
      setLoadingDocuments(false);
    }
  }, [user, arrayContainsValue]);

  // Fonction pour récupérer l'historique des téléchargements
  const fetchDownloadHistory = useCallback(async () => {
    if (!user) return;
    
    setLoadingHistory(true);
    setHistoryError(null);
    
    try {
      // Utiliser une requête plus simple qui ne nécessite pas d'index composite
      const historyQuery = query(
        collection(db, 'downloadHistory'),
        where('userId', '==', user.id)
        // Suppression du orderBy pour éviter le besoin d'un index composite
      );
      
      const querySnapshot = await getDocs(historyQuery);
      const historyList: DownloadHistory[] = [];
      const documentPromises: Promise<void>[] = [];
      
      // Assurons-nous d'abord que les catégories, types de produit et langues sont chargés
      let currentCategories = categories;
      let currentProductTypes = productTypes;
      let currentLanguages = languages;
      
      // Si les listes sont vides, chargeons-les maintenant
      if (currentCategories.length === 0) {
        try {
          const categoriesSnapshot = await getDocs(collection(db, 'categories'));
          currentCategories = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
          }));
        } catch (error) {
          console.error('Erreur lors du chargement des catégories:', error);
        }
      }
      
      if (currentProductTypes.length === 0) {
        try {
          const productTypesSnapshot = await getDocs(collection(db, 'productTypes'));
          currentProductTypes = productTypesSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
          }));
        } catch (error) {
          console.error('Erreur lors du chargement des types de produit:', error);
        }
      }
      
      if (currentLanguages.length === 0) {
        try {
          const languagesSnapshot = await getDocs(collection(db, 'languages'));
          currentLanguages = languagesSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
          }));
        } catch (error) {
          console.error('Erreur lors du chargement des langues:', error);
        }
      }
      
      querySnapshot.forEach((doc) => {
        const historyData = doc.data();
        const historyItem: DownloadHistory = {
          id: doc.id,
          userId: historyData.userId,
          documentId: historyData.documentId,
          downloadedAt: historyData.downloadedAt?.toDate() || new Date(),
          userEmail: historyData.userEmail || user.email || '',
          documentName: historyData.documentName || 'Document sans nom',
          category: 'Non catégorisé',
          productType: 'Non spécifié',
          language: 'Non spécifié'
        };
        
        // Récupérer les informations du document associé
        const documentPromise = getDocs(query(
          collection(db, 'documents'),
          where('__name__', '==', historyData.documentId)
        )).then(async docSnapshot => {
          if (!docSnapshot.empty) {
            const documentData = docSnapshot.docs[0].data();
            historyItem.fileUrl = documentData.fileUrl || '';
            
            // Récupérer les noms des catégories, types de produit et langues
            if (documentData.category) {
              // Essayer de trouver la catégorie dans les catégories chargées
              const matchingCategory = currentCategories.find(cat => cat.id === documentData.category);
              if (matchingCategory) {
                historyItem.category = matchingCategory.name;
              } else {
                // Si pas trouvé dans les catégories chargées, essayer de récupérer directement
                try {
                  if (typeof documentData.category === 'string') {
                    const categoryDocRef = doc(db, 'categories', documentData.category) as DocumentReference;
                    const categoryDoc = await getDoc(categoryDocRef);
                    if (categoryDoc.exists()) {
                      const categoryData = categoryDoc.data() as { name?: string };
                      historyItem.category = categoryData.name || 'Non catégorisé';
                    }
                  }
                } catch (error) {
                  console.error('Erreur lors de la récupération de la catégorie:', error);
                }
              }
            }
            
            if (documentData.productType) {
              // Essayer de trouver le type de produit dans les types chargés
              const matchingProductType = currentProductTypes.find(type => type.id === documentData.productType);
              if (matchingProductType) {
                historyItem.productType = matchingProductType.name;
              } else {
                // Si pas trouvé dans les types chargés, essayer de récupérer directement
                try {
                  if (typeof documentData.productType === 'string') {
                    const productTypeDocRef = doc(db, 'productTypes', documentData.productType) as DocumentReference;
                    const productTypeDoc = await getDoc(productTypeDocRef);
                    if (productTypeDoc.exists()) {
                      const productTypeData = productTypeDoc.data() as { name?: string };
                      historyItem.productType = productTypeData.name || 'Non spécifié';
                    }
                  }
                } catch (error) {
                  console.error('Erreur lors de la récupération du type de produit:', error);
                }
              }
            }
            
            if (documentData.language) {
              // Essayer de trouver la langue dans les langues chargées
              const matchingLanguage = currentLanguages.find(lang => lang.id === documentData.language);
              if (matchingLanguage) {
                historyItem.language = matchingLanguage.name;
              } else {
                // Si pas trouvé dans les langues chargées, essayer de récupérer directement
                try {
                  if (typeof documentData.language === 'string') {
                    const languageDocRef = doc(db, 'languages', documentData.language) as DocumentReference;
                    const languageDoc = await getDoc(languageDocRef);
                    if (languageDoc.exists()) {
                      const languageData = languageDoc.data() as { name?: string };
                      historyItem.language = languageData.name || 'Non spécifié';
                    }
                  }
                } catch (error) {
                  console.error('Erreur lors de la récupération de la langue:', error);
                }
              }
            }
          }
        }).catch(error => {
          console.error('Erreur lors de la récupération des informations du document:', error);
        });
        
        documentPromises.push(documentPromise);
        historyList.push(historyItem);
      });
      
      // Attendre que toutes les requêtes de documents soient terminées
      await Promise.all(documentPromises);
      
      // Trier les résultats côté client plutôt que dans la requête Firestore
      historyList.sort((a, b) => b.downloadedAt.getTime() - a.downloadedAt.getTime());
      
      setDownloadHistory(historyList);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique des téléchargements:', error);
      setHistoryError('Impossible de récupérer l\'historique des téléchargements. Veuillez réessayer plus tard.');
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  // Fonction pour récupérer les catégories depuis Firebase
  const fetchCategories = useCallback(async () => {
    try {
      // Récupérer toutes les catégories et filtrer côté client
      const categoriesQuery = query(
        collection(db, 'categories')
      );
      const querySnapshot = await getDocs(categoriesQuery);
      
      // Stocker les paires id-name pour les catégories
      const categoriesList: { id: string, name: string }[] = [];
      querySnapshot.forEach((doc) => {
        const categoryData = doc.data();
        // Vérifier si la catégorie est accessible pour les utilisateurs
        if (arrayContainsValue(categoryData.accessRoles, 'user')) {
          categoriesList.push({
            id: doc.id,
            name: categoryData.name
          });
        }
      });
      
      console.log('Catégories chargées:', categoriesList);
      setCategories(categoriesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      setCategories([]);
    }
  }, [arrayContainsValue]);

  // Fonction pour récupérer les types de produits depuis Firebase
  const fetchProductTypes = useCallback(async () => {
    try {
      // Récupérer tous les types de produits et filtrer côté client
      const productTypesQuery = query(
        collection(db, 'productTypes')
      );
      const querySnapshot = await getDocs(productTypesQuery);
      
      // Stocker les paires id-name pour les types de produits
      const productTypesList: { id: string, name: string }[] = [];
      querySnapshot.forEach((doc) => {
        const productTypeData = doc.data();
        // Vérifier si le type de produit est accessible pour les utilisateurs
        if (arrayContainsValue(productTypeData.accessRoles, 'user')) {
          productTypesList.push({
            id: doc.id,
            name: productTypeData.name
          });
        }
      });
      
      console.log('Types de produits chargés:', productTypesList);
      setProductTypes(productTypesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des types de produits:', error);
      setProductTypes([]);
    }
  }, [arrayContainsValue]);

  // Fonction pour récupérer les langues depuis Firebase
  const fetchLanguages = useCallback(async () => {
    try {
      // Récupérer toutes les langues et filtrer côté client
      const languagesQuery = query(
        collection(db, 'languages')
      );
      const querySnapshot = await getDocs(languagesQuery);
      
      // Stocker les paires id-name pour les langues
      const languagesList: { id: string, name: string }[] = [];
      querySnapshot.forEach((doc) => {
        const languageData = doc.data();
        // Vérifier si la langue est accessible pour les utilisateurs
        if (arrayContainsValue(languageData.accessRoles, 'user')) {
          languagesList.push({
            id: doc.id,
            name: languageData.name
          });
        }
      });
      
      console.log('Langues chargées:', languagesList);
      setLanguages(languagesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des langues:', error);
      setLanguages([]);
    }
  }, [arrayContainsValue]);

  // Fonction pour filtrer les documents
  const filterDocuments = useCallback(() => {
    let filtered = [...recentDocuments];
    
    console.log('Début du filtrage - Documents disponibles:', filtered.length);
    console.log('Filtres actuels:', { 
      searchTerm, 
      categoryFilter, 
      productTypeFilter, 
      languageFilter 
    });
    
    // Vérifier les valeurs des propriétés des documents
    if (filtered.length > 0) {
      console.log('Exemple de document:', {
        category: filtered[0].category,
        productType: filtered[0].productType,
        language: filtered[0].language
      });
    }
    
    // Filtrer par terme de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(term) ||
          doc.description.toLowerCase().includes(term)
      );
      console.log('Après filtrage par terme de recherche:', filtered.length);
    }
    
    // Filtrer par catégorie
    if (categoryFilter && categoryFilter !== 'all') {
      console.log('Documents avant filtrage par catégorie:', filtered.length);
      console.log('Catégories disponibles dans les documents:', [...new Set(filtered.map(doc => doc.category))]);
      filtered = filtered.filter((doc) => doc.category === categoryFilter);
      console.log('Après filtrage par catégorie:', filtered.length);
    }
    
    // Filtrer par type de produit
    if (productTypeFilter && productTypeFilter !== 'all') {
      console.log('Documents avant filtrage par type de produit:', filtered.length);
      console.log('Types de produit disponibles dans les documents:', [...new Set(filtered.map(doc => doc.productType))]);
      filtered = filtered.filter((doc) => doc.productType === productTypeFilter);
      console.log('Après filtrage par type de produit:', filtered.length);
    }
    
    // Filtrer par langue
    if (languageFilter && languageFilter !== 'all') {
      console.log('Documents avant filtrage par langue:', filtered.length);
      console.log('Langues disponibles dans les documents:', [...new Set(filtered.map(doc => doc.language))]);
      filtered = filtered.filter((doc) => doc.language === languageFilter);
      console.log('Après filtrage par langue:', filtered.length);
    }
    
    console.log('Résultat final du filtrage:', filtered.length);
    setFilteredDocuments(filtered);
  }, [searchTerm, categoryFilter, productTypeFilter, languageFilter, recentDocuments]);

  const handleFilterChange = useCallback((type: string, value: string) => {
    if (type === 'category') {
      setCategoryFilter(value);
    } else if (type === 'productType') {
      setProductTypeFilter(value);
    } else if (type === 'language') {
      setLanguageFilter(value);
    }
    
    // Filtrer les documents
    filterDocuments();
  }, [filterDocuments]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Charger les données pour tous les utilisateurs qui accèdent à cette page
      fetchRecentDocuments();
      fetchDownloadHistory();
      fetchCategories();
      fetchProductTypes();
      fetchLanguages();
    }
  }, [user, loading, router, fetchRecentDocuments, fetchDownloadHistory, fetchCategories, fetchProductTypes, fetchLanguages]);

  useEffect(() => {
    filterDocuments();
  }, [filterDocuments]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'downloads') {
      setActiveTab('downloads');
    } else if (tabParam === 'documents') {
      setActiveTab('documents');
    }
  }, [searchParams]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Fonction pour télécharger un document
  const downloadDocument = (document: DocumentType) => {
    // Ouvrir le document dans un nouvel onglet
    window.open(document.fileUrl, '_blank');
    
    // Enregistrer le téléchargement dans l'historique
    recordDownload(document);
  };
  
  // Fonction pour ouvrir un document depuis l'historique des téléchargements
  const openDocumentFromHistory = async (download: DownloadHistory) => {
    try {
      // Vérifier d'abord si l'URL est disponible
      if (!download.fileUrl) {
        console.error('URL du fichier manquante pour le document:', download.documentName);
        window.open(`/document-not-found?name=${encodeURIComponent(download.documentName)}&id=${download.documentId}`, '_blank');
        return;
      }
      
      // Essayer de récupérer le document directement depuis Firestore pour avoir l'URL la plus récente
      const docRef = doc(db, 'documents', download.documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const documentData = docSnap.data();
        const currentFileUrl = documentData.fileUrl;
        
        if (currentFileUrl) {
          // Utiliser l'URL la plus récente du document
          window.open(currentFileUrl, '_blank');
          return;
        }
      }
      
      // Si nous n'avons pas pu obtenir une URL à jour, essayer avec l'URL stockée
      try {
        // Vérifier si le document existe toujours avec l'URL stockée
        const response = await fetch(download.fileUrl, { method: 'HEAD' });
        
        if (response.ok) {
          // Le document existe, l'ouvrir dans un nouvel onglet
          window.open(download.fileUrl, '_blank');
        } else {
          // Le document n'existe pas, rediriger vers la page d'erreur
          window.open(`/document-not-found?name=${encodeURIComponent(download.documentName)}&id=${download.documentId}`, '_blank');
        }
      } catch (error) {
        // Erreur lors de la vérification, rediriger vers la page d'erreur
        console.error('Erreur lors de la vérification du document:', error);
        window.open(`/document-not-found?name=${encodeURIComponent(download.documentName)}&id=${download.documentId}`, '_blank');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du document:', error);
      window.open(`/document-not-found?name=${encodeURIComponent(download.documentName)}&id=${download.documentId}`, '_blank');
    }
  };

  // Fonction pour enregistrer un téléchargement dans l'historique
  const recordDownload = async (document: DocumentType) => {
    if (!user) return;
    
    try {
      // Ajouter à Firestore via API
      const downloadData = {
        userId: user.id,
        documentId: document.id,
        downloadedAt: new Date(),
        userEmail: user.email,
        documentName: document.name,
      };
      
      // Ajouter à Firestore
      await fetch('/api/record-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(downloadData),
      });
      
      // Rafraîchir l'historique des téléchargements
      fetchDownloadHistory();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du téléchargement:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ConfirmDialog
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={handleSignOut}
        title="Confirmer la déconnexion"
        description="Êtes-vous sûr de vouloir vous déconnecter ?"
        confirmText="Déconnexion"
        cancelText="Annuler"
      />
      
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center">
            <AppLogo height={40} />
          </div>
          <div className="flex items-center gap-4">
            <UserProfileMenu user={user} />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-muted/20 p-4">
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('documents')}
              className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${activeTab === 'documents' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Documents
            </button>
            <button 
              onClick={() => setActiveTab('catalog')}
              className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${activeTab === 'catalog' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Book className="mr-2 h-4 w-4" />
              Catalogue
            </button>
            <button 
              onClick={() => setActiveTab('downloads')}
              className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${activeTab === 'downloads' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Download className="mr-2 h-4 w-4" /> Mes téléchargements
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="documents" className="mt-0">
              <div className="mb-6">
                <h1 className="text-2xl font-bold">Bibliothèque de documents</h1>
                <p className="text-muted-foreground">Accédez aux fiches techniques, certifications et manuels</p>
              </div>

              {/* Barre de recherche et filtres */}
              <div className="mb-8 rounded-lg border bg-card shadow-sm">
                <div className="border-b p-4">
                  <h2 className="text-lg font-medium">Recherche de documents</h2>
                  <p className="text-sm text-muted-foreground mt-1">Filtrez les documents par mot-clé, catégorie, type de produit ou langue</p>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Rechercher un document..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium mb-1">
                        Catégorie
                      </label>
                      <Select value={categoryFilter} onValueChange={(value) => {
                        handleFilterChange('category', value);
                      }}>
                        <SelectTrigger id="category" className="w-full">
                          <SelectValue placeholder="Toutes les catégories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les catégories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label htmlFor="productType" className="block text-sm font-medium mb-1">
                        Type de produit
                      </label>
                      <Select value={productTypeFilter} onValueChange={(value) => {
                        handleFilterChange('productType', value);
                      }}>
                        <SelectTrigger id="productType" className="w-full">
                          <SelectValue placeholder="Tous les types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les types</SelectItem>
                          {productTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label htmlFor="language" className="block text-sm font-medium mb-1">
                        Langue
                      </label>
                      <Select value={languageFilter} onValueChange={(value) => {
                        handleFilterChange('language', value);
                      }}>
                        <SelectTrigger id="language" className="w-full">
                          <SelectValue placeholder="Toutes les langues" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les langues</SelectItem>
                          {languages.map((language) => (
                            <SelectItem key={language.id} value={language.id}>
                              {language.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchRecentDocuments}
                      className="flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 21h5v-5"></path></svg>
                      Actualiser
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="mb-4 text-xl font-semibold">Documents récents</h2>
                
                {error && (
                  <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
                    <p>{error}</p>
                  </div>
                )}
                
                {loadingDocuments ? (
                  <div className="flex h-40 items-center justify-center rounded-lg border">
                    <p>Chargement des documents récents...</p>
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="flex h-40 items-center justify-center rounded-lg border">
                    <p className="text-muted-foreground">Aucun document récent trouvé</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="p-4">
                      {filteredDocuments.map((document, index) => (
                        <div 
                          key={document.id}
                          className={`grid grid-cols-[1fr_auto] items-center gap-4 ${index < filteredDocuments.length - 1 ? 'border-b pb-4 mb-4' : ''}`}
                        >
                          <div>
                            <h3 className="font-medium">{document.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Mis à jour le {format(document.uploadedAt, 'dd MMMM yyyy', { locale: fr })}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <a href={document.fileUrl} target="_blank">
                              Télécharger
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="catalog" className="mt-0">
              <ProductCatalog 
                userRole={user?.role || 'user'} 
                onDocumentDownload={downloadDocument}
              />
            </TabsContent>
            
            <TabsContent value="downloads" className="mt-0">
              <div className="mb-6">
                <h1 className="text-2xl font-bold">Mes téléchargements</h1>
                <p className="text-muted-foreground">Historique de vos téléchargements de documents</p>
              </div>
              
              <div className="mt-4">
                {historyError && (
                  <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
                    <p>{historyError}</p>
                  </div>
                )}
                
                {loadingHistory ? (
                  <div className="flex h-40 items-center justify-center rounded-lg border">
                    <p>Chargement de l'historique des téléchargements...</p>
                  </div>
                ) : downloadHistory.length === 0 ? (
                  <div className="flex h-40 items-center justify-center rounded-lg border">
                    <p className="text-muted-foreground">Aucun téléchargement trouvé</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-4 py-3 text-left text-sm font-medium">Document</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Catégorie</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Type de produit</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Langue</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Date et heure</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {downloadHistory.map((download) => (
                            <tr key={download.id} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="px-4 py-3">
                                <div className="font-medium">{download.documentName}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-muted-foreground">
                                  {download.category || 'Non catégorisé'}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-muted-foreground">
                                  {download.productType || 'Non spécifié'}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-muted-foreground">
                                  {download.language || 'Non spécifié'}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-muted-foreground">
                                  {format(download.downloadedAt, 'dd MMMM yyyy à HH:mm', { locale: fr })}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {download.fileUrl && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => openDocumentFromHistory(download)}
                                    className="ml-auto"
                                  >
                                    <Download className="mr-2 h-4 w-4" /> Télécharger
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-end p-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchDownloadHistory}
                        className="flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 21h5v-5"></path></svg>
                        Actualiser
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <Footer />
    </div>
  );
}
