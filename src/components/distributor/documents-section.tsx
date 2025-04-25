"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Download, Search } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { Document as DocumentType } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export function DocumentsSection() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const [productTypes, setProductTypes] = useState<{ id: string, name: string }[]>([]);
  const [languages, setLanguages] = useState<{ id: string, name: string }[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentType[]>([]);

  // Fonction pour vérifier si un tableau contient une valeur, peu importe son index
  const arrayContainsValue = useCallback((array: string[], value: string) => {
    return array && Array.isArray(array) && array.includes(value);
  }, []);

  // Fonction pour récupérer les documents
  const fetchDocuments = useCallback(async () => {
    if (!user) return;
    
    setLoadingDocuments(true);
    setError(null);
    
    try {
      const documentsQuery = query(
        collection(db, 'documents'),
        orderBy('uploadedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(documentsQuery);
      const documentsList: DocumentType[] = [];
      
      querySnapshot.forEach((doc) => {
        const documentData = doc.data();
        // Vérifier si le document est accessible pour les distributeurs
        if (arrayContainsValue(documentData.accessRoles, 'distributor')) {
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
      
      setDocuments(documentsList);
      setFilteredDocuments(documentsList);
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      setError('Impossible de récupérer les documents. Veuillez réessayer plus tard.');
    } finally {
      setLoadingDocuments(false);
    }
  }, [user, arrayContainsValue]);

  // Fonction pour récupérer les catégories depuis Firebase
  const fetchCategories = useCallback(async () => {
    try {
      const categoriesQuery = query(
        collection(db, 'categories')
      );
      const querySnapshot = await getDocs(categoriesQuery);
      
      const categoriesList: { id: string, name: string }[] = [];
      querySnapshot.forEach((doc) => {
        const categoryData = doc.data();
        // Vérifier si la catégorie est accessible pour les distributeurs
        if (arrayContainsValue(categoryData.accessRoles, 'distributor')) {
          categoriesList.push({
            id: doc.id,
            name: categoryData.name
          });
        }
      });
      
      setCategories(categoriesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      setCategories([]);
    }
  }, [arrayContainsValue]);

  // Fonction pour récupérer les types de produits depuis Firebase
  const fetchProductTypes = useCallback(async () => {
    try {
      const productTypesQuery = query(
        collection(db, 'productTypes')
      );
      const querySnapshot = await getDocs(productTypesQuery);
      
      const productTypesList: { id: string, name: string }[] = [];
      querySnapshot.forEach((doc) => {
        const productTypeData = doc.data();
        // Vérifier si le type de produit est accessible pour les distributeurs
        if (arrayContainsValue(productTypeData.accessRoles, 'distributor')) {
          productTypesList.push({
            id: doc.id,
            name: productTypeData.name
          });
        }
      });
      
      setProductTypes(productTypesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des types de produits:', error);
      setProductTypes([]);
    }
  }, [arrayContainsValue]);

  // Fonction pour récupérer les langues depuis Firebase
  const fetchLanguages = useCallback(async () => {
    try {
      const languagesQuery = query(
        collection(db, 'languages')
      );
      const querySnapshot = await getDocs(languagesQuery);
      
      const languagesList: { id: string, name: string }[] = [];
      querySnapshot.forEach((doc) => {
        const languageData = doc.data();
        // Vérifier si la langue est accessible pour les distributeurs
        if (arrayContainsValue(languageData.accessRoles, 'distributor')) {
          languagesList.push({
            id: doc.id,
            name: languageData.name
          });
        }
      });
      
      setLanguages(languagesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des langues:', error);
      setLanguages([]);
    }
  }, [arrayContainsValue]);

  // Fonction pour filtrer les documents
  const filterDocuments = useCallback(() => {
    let filtered = [...documents];
    
    // Filtrer par terme de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(term) ||
          doc.description.toLowerCase().includes(term)
      );
    }
    
    // Filtrer par catégorie
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter((doc) => doc.category === categoryFilter);
    }
    
    // Filtrer par type de produit
    if (productTypeFilter && productTypeFilter !== 'all') {
      filtered = filtered.filter((doc) => doc.productType === productTypeFilter);
    }
    
    // Filtrer par langue
    if (languageFilter && languageFilter !== 'all') {
      filtered = filtered.filter((doc) => doc.language === languageFilter);
    }
    
    setFilteredDocuments(filtered);
  }, [documents, searchTerm, categoryFilter, productTypeFilter, languageFilter]);

  // Gérer les changements de filtre
  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case 'category':
        setCategoryFilter(value);
        break;
      case 'productType':
        setProductTypeFilter(value);
        break;
      case 'language':
        setLanguageFilter(value);
        break;
      default:
        break;
    }
  };

  // Fonction pour télécharger un document
  const downloadDocument = async (document: DocumentType) => {
    try {
      // Vérifier si le document existe toujours
      const docRef = doc(db, 'documents', document.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const documentData = docSnap.data();
        const currentFileUrl = documentData.fileUrl;
        
        if (currentFileUrl) {
          // Utiliser l'URL la plus récente du document
          window.open(currentFileUrl, '_blank');
          toast.success('Téléchargement du document en cours...');
          
          // Enregistrer le téléchargement dans l'historique
          try {
            // Ajouter à Firestore via API
            const downloadData = {
              userId: user?.uid,
              documentId: document.id,
              downloadedAt: new Date(),
              userEmail: user?.email,
              documentName: document.name,
            };
            
            await fetch('/api/record-download', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(downloadData),
            });
          } catch (error) {
            console.error('Erreur lors de l\'enregistrement du téléchargement:', error);
          }
          
          return;
        }
      }
      
      // Si nous n'avons pas pu obtenir une URL à jour, essayer avec l'URL stockée
      try {
        // Vérifier si le document existe toujours avec l'URL stockée
        const response = await fetch(document.fileUrl, { method: 'HEAD' });
        
        if (response.ok) {
          // Le document existe, l'ouvrir dans un nouvel onglet
          window.open(document.fileUrl, '_blank');
          toast.success('Téléchargement du document en cours...');
        } else {
          // Le document n'existe pas
          toast.error('Le document n\'est plus disponible.');
        }
      } catch (error) {
        // Erreur lors de la vérification
        console.error('Erreur lors de la vérification du document:', error);
        toast.error('Impossible d\'accéder au document.');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du document:', error);
      toast.error('Impossible d\'accéder au document.');
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    fetchDocuments();
    fetchCategories();
    fetchProductTypes();
    fetchLanguages();
  }, [fetchDocuments, fetchCategories, fetchProductTypes, fetchLanguages]);

  // Filtrer les documents lorsque les filtres changent
  useEffect(() => {
    filterDocuments();
  }, [filterDocuments, documents, searchTerm, categoryFilter, productTypeFilter, languageFilter]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Documents techniques</h1>
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
              onClick={fetchDocuments}
              className="flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 21h5v-5"></path></svg>
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">Documents disponibles</h2>
        
        {error && (
          <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            <p>{error}</p>
          </div>
        )}
        
        {loadingDocuments ? (
          <div className="flex h-40 items-center justify-center rounded-lg border">
            <p>Chargement des documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border">
            <p className="text-muted-foreground">Aucun document trouvé</p>
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
                      {document.description}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {document.category && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {categories.find(cat => cat.id === document.category)?.name || 'Catégorie'}
                        </span>
                      )}
                      {document.productType && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                          {productTypes.find(type => type.id === document.productType)?.name || 'Type'}
                        </span>
                      )}
                      {document.language && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          {languages.find(lang => lang.id === document.language)?.name || 'Langue'}
                        </span>
                      )}
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                        Mis à jour le {format(document.uploadedAt, 'dd MMMM yyyy', { locale: fr })}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => downloadDocument(document)}>
                    <Download className="mr-2 h-4 w-4" /> Télécharger
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
