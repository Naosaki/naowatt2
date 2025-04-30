"use client";

import { useState, useEffect, useCallback } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, query, Timestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Search, Download, Plus, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { AddDocumentDialog } from './add-document-dialog';
import { EditDocumentDialog } from './edit-document-dialog';
import { Document, Category, ProductType, Language } from '@/lib/types';

// Définition des interfaces locales pour la compatibilité
interface LocalDocument {
  id: string;
  name: string;
  description?: string;
  category: string;
  productType: string;
  language: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Propriétés supplémentaires pour la compatibilité avec le type Document de @/lib/types
  uploadedBy?: string;
  uploadedAt?: Date;
  accessRoles?: ('admin' | 'user' | 'distributor' | 'installer')[];
  version?: string;
  productId?: string;
}

// Fonctions de conversion entre les types
const localToLibDocument = (doc: LocalDocument): Document => {
  return {
    id: doc.id,
    name: doc.name,
    description: doc.description || '',
    fileUrl: doc.fileUrl,
    fileType: doc.fileType,
    fileSize: doc.fileSize,
    uploadedBy: doc.uploadedBy || 'admin',
    uploadedAt: doc.createdAt?.toDate() || new Date(),
    category: doc.category,
    productType: doc.productType,
    language: doc.language,
    accessRoles: doc.accessRoles || ['admin'],
    version: doc.version || '1.0',
    productId: doc.productId
  };
};

export default function DocumentManagement() {
  const [documents, setDocuments] = useState<LocalDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<LocalDocument[]>([]);
  const [paginatedDocuments, setPaginatedDocuments] = useState<LocalDocument[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [products, setProducts] = useState<{id: string, name: string}[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<LocalDocument | null>(null);
  const [showAddDocumentDialog, setShowAddDocumentDialog] = useState(false);
  const [showEditDocumentDialog, setShowEditDocumentDialog] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<Document | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchProductTypes();
    fetchLanguages();
    fetchProducts();
    fetchDocuments();
  }, []);

  const filterDocuments = useCallback(() => {
    let filtered = [...documents];
    
    // Filtre par terme de recherche
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtre par catégorie
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(doc => doc.category === categoryFilter);
    }
    
    // Filtre par type de produit
    if (productTypeFilter && productTypeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.productType === productTypeFilter);
    }
    
    // Filtre par langue
    if (languageFilter && languageFilter !== 'all') {
      filtered = filtered.filter(doc => doc.language === languageFilter);
    }

    // Filtre par produit
    if (productFilter && productFilter !== 'all') {
      filtered = filtered.filter(doc => doc.productId === productFilter);
    }
    
    setFilteredDocuments(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [documents, searchTerm, categoryFilter, productTypeFilter, languageFilter, productFilter, itemsPerPage]);

  // Pagination logic
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedDocuments(filteredDocuments.slice(startIndex, endIndex));
  }, [filteredDocuments, currentPage, itemsPerPage]);

  useEffect(() => {
    filterDocuments();
  }, [filterDocuments]);

  const fetchCategories = async () => {
    try {
      const categoriesQuery = query(collection(db, 'categories'));
      const querySnapshot = await getDocs(categoriesQuery);
      
      const categoriesList: Category[] = [];
      querySnapshot.forEach((doc) => {
        const categoryData = doc.data();
        categoriesList.push({
          id: doc.id,
          name: categoryData.name,
          description: categoryData.description || '',
          createdAt: categoryData.createdAt?.toDate() || new Date(),
          accessRoles: categoryData.accessRoles || ['admin']
        });
      });
      
      setCategories(categoriesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
    }
  };

  const fetchProductTypes = async () => {
    try {
      const productTypesQuery = query(collection(db, 'productTypes'));
      const querySnapshot = await getDocs(productTypesQuery);
      
      const productTypesList: ProductType[] = [];
      querySnapshot.forEach((doc) => {
        const productTypeData = doc.data();
        productTypesList.push({
          id: doc.id,
          name: productTypeData.name,
          description: productTypeData.description || '',
          createdAt: productTypeData.createdAt?.toDate() || new Date(),
          accessRoles: productTypeData.accessRoles || ['admin']
        });
      });
      
      setProductTypes(productTypesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des types de produits:', error);
    }
  };

  const fetchLanguages = async () => {
    try {
      const languagesQuery = query(collection(db, 'languages'));
      const querySnapshot = await getDocs(languagesQuery);
      
      const languagesList: Language[] = [];
      querySnapshot.forEach((doc) => {
        const languageData = doc.data();
        languagesList.push({
          id: doc.id,
          name: languageData.name,
          code: languageData.code,
          createdAt: languageData.createdAt?.toDate() || new Date(),
          isDefault: languageData.isDefault || false,
          accessRoles: languageData.accessRoles || ['admin']
        });
      });
      
      setLanguages(languagesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des langues:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const productsQuery = query(collection(db, 'products'));
      const querySnapshot = await getDocs(productsQuery);
      
      const productsList: {id: string, name: string}[] = [];
      querySnapshot.forEach((doc) => {
        const productData = doc.data();
        productsList.push({
          id: doc.id,
          name: productData.name || 'Produit sans nom',
        });
      });
      
      setProducts(productsList);
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const documentsQuery = query(collection(db, 'documents'));
      const querySnapshot = await getDocs(documentsQuery);
      
      const documentsList: LocalDocument[] = [];
      querySnapshot.forEach((doc) => {
        const documentData = doc.data();
        documentsList.push({
          id: doc.id,
          name: documentData.name || documentData.title || 'Sans nom', // Compatibilité avec les anciens documents
          description: documentData.description,
          category: documentData.category || documentData.categoryId || '',
          productType: documentData.productType || documentData.productTypeId || '',
          language: documentData.language || documentData.languageId || '',
          fileUrl: documentData.fileUrl,
          fileName: documentData.fileName,
          fileSize: documentData.fileSize,
          fileType: documentData.fileType,
          createdAt: documentData.createdAt || documentData.uploadedAt,
          updatedAt: documentData.updatedAt || documentData.uploadedAt,
          // Champs supplémentaires pour la compatibilité
          uploadedBy: documentData.uploadedBy,
          uploadedAt: documentData.uploadedAt?.toDate ? documentData.uploadedAt.toDate() : new Date(documentData.uploadedAt),
          accessRoles: documentData.accessRoles,
          version: documentData.version,
          productId: documentData.productId
        });
      });
      
      // Vérifier et afficher des informations de débogage sur les associations de documents
      console.log('Nombre total de documents:', documentsList.length);
      const documentsWithProductId = documentsList.filter(doc => doc.productId);
      console.log('Documents avec productId:', documentsWithProductId.length);
      
      setDocuments(documentsList);
      setFilteredDocuments(documentsList);
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'N/A';
  };

  const getProductTypeName = (productTypeId: string) => {
    const productType = productTypes.find(type => type.id === productTypeId);
    return productType ? productType.name : 'N/A';
  };

  const getLanguageName = (languageId: string) => {
    const language = languages.find(lang => lang.id === languageId);
    return language ? language.name : 'N/A';
  };

  const getProductName = (productId: string | undefined) => {
    if (!productId) return 'N/A';
    const product = products.find(prod => prod.id === productId);
    return product ? product.name : 'N/A';
  };

  const handleDeleteDocument = (documentId: string) => {
    const docToDelete = documents.find(doc => doc.id === documentId);
    if (docToDelete) {
      setDocumentToDelete(docToDelete);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'documents', documentToDelete.id));
      
      // Tenter de supprimer le fichier du Storage
      try {
        if (documentToDelete.fileUrl) {
          const fileUrl = new URL(documentToDelete.fileUrl);
          const filePath = decodeURIComponent(fileUrl.pathname.split('/o/')[1].split('?')[0]);
          await deleteObject(ref(storage, filePath));
        }
      } catch (storageError) {
        console.error('Erreur lors de la suppression du fichier:', storageError);
      }
      
      console.log('Document supprimé avec succès');
      fetchDocuments();
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
    } finally {
      setShowDeleteConfirm(false);
      setDocumentToDelete(null);
    }
  };

  const handleEditDocument = (documentId: string) => {
    const docToEdit = documents.find(doc => doc.id === documentId);
    if (docToEdit) {
      // Convertir le document local en type Document de @/lib/types
      setDocumentToEdit(localToLibDocument(docToEdit));
      setShowEditDocumentDialog(true);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      return format(timestamp.toDate(), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return 'N/A';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Gestion des documents</CardTitle>
          <Button size="sm" onClick={() => setShowAddDocumentDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un document
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un document…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par catégorie" />
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
              <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par type de produit" />
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
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par produit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les produits</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par langue" />
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Type de produit</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Langue</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Date d&apos;ajout</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Aucun document trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDocuments.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>{document.name}</TableCell>
                      <TableCell>{getCategoryName(document.category)}</TableCell>
                      <TableCell>{getProductTypeName(document.productType)}</TableCell>
                      <TableCell>{getProductName(document.productId)}</TableCell>
                      <TableCell>{getLanguageName(document.language)}</TableCell>
                      <TableCell>{document.fileSize ? formatFileSize(document.fileSize) : 'N/A'}</TableCell>
                      <TableCell>
                        {formatDate(document.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteDocument(document.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditDocument(document.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(document.fileUrl, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {filteredDocuments.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Afficher
                </span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={itemsPerPage.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  documents par page
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} sur {totalPages}
                </span>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      >
        <DialogContent>
          <DialogTitle>Supprimer le document</DialogTitle>
          <p>Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.</p>
          <DialogFooter>
            <Button onClick={() => setShowDeleteConfirm(false)} variant="outline">Annuler</Button>
            <Button onClick={confirmDeleteDocument} variant="destructive">Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddDocumentDialog
        open={showAddDocumentDialog}
        onOpenChange={setShowAddDocumentDialog}
        onDocumentAdded={() => fetchDocuments()}
      />

      <EditDocumentDialog
        document={documentToEdit}
        isOpen={showEditDocumentDialog}
        onClose={() => setShowEditDocumentDialog(false)}
        onDocumentUpdated={() => fetchDocuments()}
      />
    </div>
  );
}
