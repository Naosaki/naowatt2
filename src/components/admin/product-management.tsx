"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, deleteDoc, updateDoc, where, getDoc } from 'firebase/firestore';
import { Product, ProductType } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Trash2, Plus, Search, AlertCircle, Loader2, Box, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import AddProductDialog from '@/components/admin/add-product-dialog';

interface Document {
  id: string;
  title: string;
  fileUrl: string;
  fileName: string;
  categoryId: string;
  languageId: string;
  productId?: string;
}

function ProductManagement() {
  const [products, setProducts] = useState<(Product & { id: string; typeName: string; imageUrl?: string | null; documentCount: number })[]>([]);
  const [productTypes, setProductTypes] = useState<(ProductType & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<(Product & { id: string; typeName: string; documentCount: number }) | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    productTypeId: string;
    reference: string;
    active: boolean;
  }>({ name: '', description: '', productTypeId: '', reference: '', active: true });

  // Fonction pour charger les produits depuis Firestore
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Charger les types de produits
      const productTypesMap = new Map();
      const productTypesQuery = query(collection(db, 'productTypes'), orderBy('name'));
      const productTypesSnapshot = await getDocs(productTypesQuery);
      
      productTypesSnapshot.forEach((doc) => {
        const data = doc.data();
        productTypesMap.set(doc.id, data.name);
      });
      
      // 2. Charger les produits
      const productsQuery = query(collection(db, 'products'), orderBy('name'));
      const productsSnapshot = await getDocs(productsQuery);
      
      const productsList: (Product & { id: string; typeName: string; imageUrl?: string | null; documentCount: number })[] = [];
      
      // 3. Compter les documents pour chaque produit
      const documentsQuery = query(collection(db, 'documents'));
      const documentsSnapshot = await getDocs(documentsQuery);
      
      // Créer un Map pour compter les documents par produit
      const documentCountMap = new Map<string, number>();
      
      documentsSnapshot.forEach((doc) => {
        const data = doc.data();
        // Vérifier tous les champs possibles qui pourraient contenir l'ID du produit
        // Compatibilité avec les différents formats de documents
        const productId = data.productId || null;
        
        if (productId) {
          const count = documentCountMap.get(productId) || 0;
          documentCountMap.set(productId, count + 1);
          console.log(`Document ${doc.id} associé au produit ${productId}`);
        }
      });
      
      // 4. Afficher les informations de débogage pour comprendre le problème
      console.log('Nombre total de documents:', documentsSnapshot.size);
      console.log('Nombre de documents avec productId:', Array.from(documentCountMap.entries()).reduce((sum, [, count]) => sum + count, 0));
      
      // 5. Mise à jour manuelle des associations pour les panneaux solaires si nécessaire
      // Rechercher les produits de type panneau solaire
      const solarPanelTypeId = Array.from(productTypesMap.entries())
        .find(([, name]) => name.toLowerCase().includes('panneau') || name.toLowerCase().includes('solar'))?.[0];
      
      if (solarPanelTypeId) {
        console.log(`Type de produit panneau solaire trouvé: ${solarPanelTypeId}`);
        
        // Récupérer tous les produits de type panneau solaire
        const solarPanels: {id: string, name: string}[] = [];
        productsSnapshot.forEach((doc) => {
          const productData = doc.data() as Product;
          if (productData.productTypeId === solarPanelTypeId) {
            solarPanels.push({
              id: doc.id,
              name: productData.name
            });
          }
        });
        
        console.log(`Panneaux solaires trouvés: ${solarPanels.length}`);
        
        // Vérifier les documents qui pourraient être associés à ces panneaux
        documentsSnapshot.forEach((doc) => {
          const data = doc.data();
          // Si le document n'a pas de productId mais a un type de produit correspondant aux panneaux solaires
          if (!data.productId && (data.productType === solarPanelTypeId || data.productTypeId === solarPanelTypeId)) {
            // Trouver un panneau solaire correspondant par nom
            const matchingSolarPanel = solarPanels.find(panel => 
              data.name?.toLowerCase().includes(panel.name.toLowerCase()) || 
              data.title?.toLowerCase().includes(panel.name.toLowerCase())
            );
            
            if (matchingSolarPanel) {
              console.log(`Document ${doc.id} associé manuellement au panneau solaire ${matchingSolarPanel.id}`);
              const count = documentCountMap.get(matchingSolarPanel.id) || 0;
              documentCountMap.set(matchingSolarPanel.id, count + 1);
            }
          }
        });
      }
      
      productsSnapshot.forEach((doc) => {
        const productData = doc.data() as Product;
        const documentCount = documentCountMap.get(doc.id) || 0;
        
        productsList.push({
          ...productData,
          id: doc.id,
          typeName: productTypesMap.get(productData.productTypeId) || 'Type inconnu',
          imageUrl: productData.imageUrl || undefined,
          documentCount: documentCount
        });
      });
      
      setProducts(productsList);
    } catch (err) {
      console.error('Erreur lors du chargement des produits:', err);
      setError('Impossible de charger les produits. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour récupérer les types de produits
  const fetchProductTypes = async () => {
    try {
      const q = query(collection(db, 'productTypes'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      const productTypesList: (ProductType & { id: string })[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as ProductType;
        productTypesList.push({
          ...data,
          id: doc.id
        });
      });
      
      setProductTypes(productTypesList);
      return productTypesList;
    } catch (err) {
      console.error('Erreur lors de la récupération des types de produits:', err);
      return [];
    }
  };

  // Fonction pour charger les documents
  const fetchDocuments = async () => {
    setIsLoadingDocuments(true);
    try {
      const q = query(collection(db, 'documents'));
      const querySnapshot = await getDocs(q);
      
      const documentsList: Document[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Document;
        documentsList.push({
          ...data,
          id: doc.id
        });
      });
      
      setDocuments(documentsList);
    } catch (err) {
      console.error('Erreur lors du chargement des documents:', err);
      toast.error('Impossible de charger les documents');
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Fonction pour charger les documents associés à un produit
  const fetchProductDocuments = async (productId: string) => {
    try {
      const q = query(collection(db, 'documents'), where('productId', '==', productId));
      const querySnapshot = await getDocs(q);
      
      const documentIds: string[] = [];
      
      querySnapshot.forEach((doc) => {
        documentIds.push(doc.id);
      });
      
      setSelectedDocuments(documentIds);
    } catch (err) {
      console.error('Erreur lors du chargement des documents du produit:', err);
    }
  };

  // Charger les données au chargement du composant
  useEffect(() => {
    fetchProductTypes();
    fetchProducts();
  }, [fetchProducts]);

  // Fonction pour rafraîchir les données après ajout d'un produit
  const handleProductAdded = () => {
    fetchProducts();
  };

  // Fonction pour ouvrir le dialog d'édition
  const handleEditClick = (product: Product & { id: string; typeName: string; documentCount: number }) => {
    setCurrentProduct(product);
    setEditForm({
      name: product.name,
      description: product.description || '',
      productTypeId: product.productTypeId,
      reference: product.reference || '',
      active: product.active
    });
    // Charger les documents et les documents associés au produit
    fetchDocuments();
    fetchProductDocuments(product.id);
    setShowEditDialog(true);
  };

  // Fonction pour mettre à jour un produit
  const handleUpdateProduct = async () => {
    if (!currentProduct) return;
    
    if (!editForm.name.trim()) {
      toast.error('Le nom du produit est requis');
      return;
    }
    
    if (!editForm.productTypeId) {
      toast.error('Le type de produit est requis');
      return;
    }
    
    try {
      await updateDoc(doc(db, 'products', currentProduct.id), {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        productTypeId: editForm.productTypeId,
        reference: editForm.reference.trim(),
        active: editForm.active,
        updatedAt: Date.now()
      });
      
      // Mettre à jour les associations de documents
      const promises: Promise<void>[] = [];
      
      // 1. Récupérer tous les documents actuellement associés au produit
      const currentDocsQuery = query(collection(db, 'documents'), where('productId', '==', currentProduct.id));
      const currentDocsSnapshot = await getDocs(currentDocsQuery);
      
      // 2. Pour chaque document actuellement associé mais non sélectionné, supprimer l'association
      currentDocsSnapshot.forEach((docSnapshot) => {
        if (!selectedDocuments.includes(docSnapshot.id)) {
          promises.push(updateDoc(doc(db, 'documents', docSnapshot.id), {
            productId: null
          }));
        }
      });
      
      // 3. Pour chaque document sélectionné, ajouter l'association s'il n'est pas déjà associé
      for (const docId of selectedDocuments) {
        const docSnapshot = await getDoc(doc(db, 'documents', docId));
        if (docSnapshot.exists()) {
          const docData = docSnapshot.data();
          if (docData.productId !== currentProduct.id) {
            promises.push(updateDoc(doc(db, 'documents', docId), {
              productId: currentProduct.id
            }));
          }
        }
      }
      
      await Promise.all(promises);
      
      toast.success('Produit mis à jour avec succès');
      fetchProducts();
      setShowEditDialog(false);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du produit:', err);
      toast.error('Une erreur est survenue lors de la mise à jour du produit');
    }
  };

  // Fonction pour supprimer un produit
  const handleDeleteProduct = async () => {
    if (!currentProduct) return;
    
    try {
      // 1. Dissocier tous les documents liés à ce produit
      const docsQuery = query(collection(db, 'documents'), where('productId', '==', currentProduct.id));
      const docsSnapshot = await getDocs(docsQuery);
      
      const promises: Promise<void>[] = [];
      
      docsSnapshot.forEach((docSnapshot) => {
        promises.push(updateDoc(doc(db, 'documents', docSnapshot.id), {
          productId: null
        }));
      });
      
      await Promise.all(promises);
      
      // 2. Supprimer le produit
      await deleteDoc(doc(db, 'products', currentProduct.id));
      
      toast.success('Produit supprimé avec succès');
      fetchProducts();
      setShowDeleteDialog(false);
    } catch (err) {
      console.error('Erreur lors de la suppression du produit:', err);
      toast.error('Une erreur est survenue lors de la suppression du produit');
    }
  };

  // Fonction pour gérer la sélection/désélection d'un document
  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  // Filtrer les produits en fonction de la recherche
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.typeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Gestion des produits</h2>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un produit
        </Button>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un produit..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              {searchQuery ? (
                "Aucun produit ne correspond à votre recherche"
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <p>Aucun produit n&apos;est disponible actuellement</p>
                  <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter votre premier produit
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 w-16 px-4 text-left align-middle font-medium">Image</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Nom</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Référence</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Type de produit</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Documents</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Statut</th>
                    <th className="h-12 px-4 text-right align-middle font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-2 align-middle">
                        <div className="relative w-12 h-12 rounded-md overflow-hidden border bg-muted">
                          {product.imageUrl ? (
                            <Image 
                              src={product.imageUrl} 
                              alt={product.name} 
                              fill
                              sizes="48px"
                              className="object-contain"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                              <Box className="h-6 w-6 opacity-50" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-middle">{product.name}</td>
                      <td className="p-4 align-middle">{product.reference || '-'}</td>
                      <td className="p-4 align-middle">{product.typeName}</td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800">
                            {product.documentCount} document{product.documentCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {product.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCurrentProduct(product);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'ajout de produit */}
      <AddProductDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
        onProductAdded={handleProductAdded} 
        productTypes={productTypes}
      />

      {/* Dialog d'édition de produit */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Modifier le produit</DialogTitle>
            <DialogDescription>
              Modifiez les informations du produit et associez des documents.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom du produit *</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Nom du produit"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reference">Référence</Label>
                <Input
                  id="reference"
                  value={editForm.reference}
                  onChange={(e) => setEditForm({ ...editForm, reference: e.target.value })}
                  placeholder="Référence du produit"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="productType">Type de produit *</Label>
              <Select 
                value={editForm.productTypeId} 
                onValueChange={(value) => setEditForm({ ...editForm, productTypeId: value })}
              >
                <SelectTrigger id="productType">
                  <SelectValue placeholder="Sélectionner un type de produit" />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Description du produit"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={editForm.active}
                onCheckedChange={(checked: boolean) => setEditForm({ ...editForm, active: checked })}
              />
              <Label htmlFor="active">Produit actif</Label>
            </div>
            
            {/* Section des documents */}
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Documents associés</h3>
              {isLoadingDocuments ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">
                  Aucun document disponible
                </div>
              ) : (
                <div className="border rounded-md p-2 max-h-[300px] overflow-y-auto">
                  <div className="grid grid-cols-1 gap-2">
                    {documents.map((document) => (
                      <div key={document.id} className="flex items-center p-2 border rounded-md hover:bg-muted/50">
                        <Checkbox 
                          id={`doc-${document.id}`} 
                          checked={selectedDocuments.includes(document.id)}
                          onCheckedChange={() => handleDocumentToggle(document.id)}
                          className="mr-2"
                        />
                        <Label htmlFor={`doc-${document.id}`} className="flex-1 cursor-pointer flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="font-medium">{document.title}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{document.fileName}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="pt-4 mt-2 border-t">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Annuler</Button>
            <Button onClick={handleUpdateProduct}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le produit &quot;{currentProduct?.name}&quot; ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProductManagement;
