"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLogo } from '@/components/app-logo';
import { UserProfileMenu } from '@/components/user-profile-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Document as DocumentType } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { FileText, LayoutDashboard, Search, Clock, Download, Filter, Eye, Calendar } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function SearchDocumentsPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentType[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour vérifier si un tableau contient une valeur, peu importe son index
  const arrayContainsValue = useCallback((array: string[], value: string) => {
    return array && Array.isArray(array) && array.includes(value);
  }, []);

  // Fonction pour récupérer les documents depuis Firebase
  const fetchDocuments = useCallback(async () => {
    setLoadingDocuments(true);
    setError(null);
    try {
      // Récupérer tous les documents et filtrer côté client pour gérer les différences de structure
      const documentsQuery = query(
        collection(db, 'documents'),
        orderBy('uploadedAt', 'desc'),
        limit(50) // Limiter le nombre de documents pour éviter les problèmes de performance
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
      setDocuments([]);
      setFilteredDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  }, [arrayContainsValue]);

  // Fonction pour récupérer les catégories depuis Firebase
  const fetchCategories = useCallback(async () => {
    try {
      // Récupérer toutes les catégories et filtrer côté client
      const categoriesQuery = query(
        collection(db, 'categories')
      );
      const querySnapshot = await getDocs(categoriesQuery);
      
      const categoriesList: string[] = [];
      querySnapshot.forEach((doc) => {
        const categoryData = doc.data();
        // Vérifier si la catégorie est accessible pour les utilisateurs
        if (arrayContainsValue(categoryData.accessRoles, 'user')) {
          categoriesList.push(categoryData.name);
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
      // Récupérer tous les types de produits et filtrer côté client
      const productTypesQuery = query(
        collection(db, 'productTypes')
      );
      const querySnapshot = await getDocs(productTypesQuery);
      
      const productTypesList: string[] = [];
      querySnapshot.forEach((doc) => {
        const productTypeData = doc.data();
        // Vérifier si le type de produit est accessible pour les utilisateurs
        if (arrayContainsValue(productTypeData.accessRoles, 'user')) {
          productTypesList.push(productTypeData.name);
        }
      });
      
      setProductTypes(productTypesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des types de produits:', error);
      setProductTypes([]);
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
    if (categoryFilter) {
      filtered = filtered.filter((doc) => doc.category === categoryFilter);
    }
    
    // Filtrer par type de produit
    if (productTypeFilter) {
      filtered = filtered.filter((doc) => doc.productType === productTypeFilter);
    }
    
    setFilteredDocuments(filtered);
  }, [searchTerm, categoryFilter, productTypeFilter, documents]);

  // Fonction pour gérer la déconnexion
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [signOut, router]);

  // Fonction pour formater la taille des fichiers
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Vérifier si l'utilisateur est un utilisateur standard
      if (user.role !== 'user') {
        router.push('/dashboard'); // Rediriger vers le tableau de bord principal
      } else {
        // Charger les données depuis Firebase
        fetchDocuments();
        fetchCategories();
        fetchProductTypes();
      }
    }
  }, [user, loading, router, fetchDocuments, fetchCategories, fetchProductTypes]);

  useEffect(() => {
    if (documents.length > 0) {
      filterDocuments();
    }
  }, [searchTerm, categoryFilter, productTypeFilter, documents, filterDocuments]);

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
      
      <header className="border-b bg-card p-4">
        <div className="container mx-auto flex items-center justify-between">
          <AppLogo height={40} />
          <div className="flex items-center gap-4">
            <UserProfileMenu user={user} />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-muted/20 p-4">
          <nav className="space-y-2">
            <Link href="/dashboard-user" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Tableau de bord
            </Link>
            <Link href="/dashboard-user/search" className="flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
              <Search className="mr-2 h-4 w-4" />
              Rechercher des documents
            </Link>
            <Link href="#" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <Clock className="mr-2 h-4 w-4" />
              Historique
            </Link>
            <Link href="#" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <Download className="mr-2 h-4 w-4" />
              Mes téléchargements
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Recherche de documents</h1>
            <p className="text-muted-foreground">Trouvez les documents dont vous avez besoin</p>
          </div>

          {/* Filtres de recherche */}
          <div className="mb-6 rounded-lg border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <Filter className="mr-2 h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-medium">Filtres de recherche</h2>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchDocuments}
              >
                Actualiser
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="search" className="mb-2 block text-sm font-medium">
                  Recherche par mot-clé
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Rechercher..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="category" className="mb-2 block text-sm font-medium">
                  Catégorie
                </label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les catégories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="productType" className="mb-2 block text-sm font-medium">
                  Type de produit
                </label>
                <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                  <SelectTrigger id="productType">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les types</SelectItem>
                    {productTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Résultats de recherche */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Résultats ({filteredDocuments.length} documents)</h2>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
                <p>{error}</p>
              </div>
            )}

            {loadingDocuments ? (
              <div className="flex h-40 items-center justify-center rounded-lg border bg-card">
                <p>Chargement des documents...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-lg border bg-card">
                <p className="text-muted-foreground">Aucun document trouvé</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDocuments.map((document) => (
                  <Card key={document.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="line-clamp-1 text-base">{document.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {document.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center">
                          <FileText className="mr-1 h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{document.fileType.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center">
                          <Download className="mr-1 h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{formatFileSize(document.fileSize)}</span>
                        </div>
                        <div className="flex items-center">
                          <Filter className="mr-1 h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{document.category}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {format(document.uploadedAt, 'dd/MM/yyyy', { locale: fr })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button className="w-full" variant="outline">
                        <Eye className="mr-2 h-4 w-4" />
                        Consulter
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className="border-t p-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} DataWatt - Solar Panel Documentation Portal</p>
      </footer>
    </div>
  );
}
