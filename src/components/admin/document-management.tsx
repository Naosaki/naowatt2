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
import { Trash2, Search, FileText, Download, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { AddDocumentDialog } from './add-document-dialog';

// Définition des interfaces
interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: Timestamp;
}

interface ProductType {
  id: string;
  name: string;
  description?: string;
  createdAt: Timestamp;
}

interface Language {
  id: string;
  name: string;
  code: string;
  createdAt: Timestamp;
}

interface Document {
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
}

export default function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [showAddDocumentDialog, setShowAddDocumentDialog] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProductTypes();
    fetchLanguages();
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
    
    setFilteredDocuments(filtered);
  }, [documents, searchTerm, categoryFilter, productTypeFilter, languageFilter]);

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
          description: categoryData.description,
          createdAt: categoryData.createdAt,
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
          description: productTypeData.description,
          createdAt: productTypeData.createdAt,
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
          createdAt: languageData.createdAt,
        });
      });
      
      setLanguages(languagesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des langues:', error);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const documentsQuery = query(collection(db, 'documents'));
      const querySnapshot = await getDocs(documentsQuery);
      
      const documentsList: Document[] = [];
      querySnapshot.forEach((doc) => {
        const documentData = doc.data();
        documentsList.push({
          id: doc.id,
          name: documentData.name,
          description: documentData.description,
          category: documentData.category,
          productType: documentData.productType,
          language: documentData.language,
          fileUrl: documentData.fileUrl,
          fileName: documentData.fileName,
          fileSize: documentData.fileSize,
          fileType: documentData.fileType,
          createdAt: documentData.createdAt,
          updatedAt: documentData.updatedAt,
        });
      });
      
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
                  <TableHead>Langue</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Date d&apos;ajout</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Aucun document trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>{document.name}</TableCell>
                      <TableCell>{getCategoryName(document.category)}</TableCell>
                      <TableCell>{getProductTypeName(document.productType)}</TableCell>
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
                            onClick={() => window.open(document.fileUrl, '_blank')}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
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
    </div>
  );
}
