"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { Product } from '@/types/product';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileText, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Document {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  productId?: string;
}

interface ProductCatalogProps {
  userRole: string;
}

export function ProductCatalog({ userRole }: ProductCatalogProps) {
  const [products, setProducts] = useState<(Product & { id: string; typeName: string; imageUrl?: string; documentCount: number })[]>([]);
  const [productTypes, setProductTypes] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [productDocuments, setProductDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  // Fonction pour charger les produits depuis Firestore
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Charger les types de produits
      const productTypesMap = new Map();
      const productTypesQuery = query(collection(db, 'productTypes'), orderBy('name'));
      const productTypesSnapshot = await getDocs(productTypesQuery);
      
      const productTypesList: { id: string; name: string }[] = [];
      
      productTypesSnapshot.forEach((doc) => {
        const data = doc.data();
        productTypesMap.set(doc.id, data.name);
        productTypesList.push({
          id: doc.id,
          name: data.name
        });
      });
      
      setProductTypes(productTypesList);
      
      // 2. Charger les produits - ne pas filtrer par active pour voir tous les produits
      const productsQuery = query(
        collection(db, 'products')
      );
      const productsSnapshot = await getDocs(productsQuery);
      
      console.log('Nombre total de produits dans Firestore:', productsSnapshot.size);
      
      // 3. Compter les documents pour chaque produit
      const documentsQuery = query(collection(db, 'documents'));
      const documentsSnapshot = await getDocs(documentsQuery);
      
      // Créer un Map pour compter les documents par produit
      const documentCountMap = new Map<string, number>();
      
      documentsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.productId) {
          const count = documentCountMap.get(data.productId) || 0;
          documentCountMap.set(data.productId, count + 1);
        }
      });
      
      const productsList: (Product & { id: string; typeName: string; imageUrl?: string; documentCount: number })[] = [];
      
      productsSnapshot.forEach((doc) => {
        try {
          const productData = doc.data() as Product;
          console.log('Produit trouvé:', doc.id, productData.name, 'accessRoles:', productData.accessRoles);
          
          // Vérifier si tous les champs obligatoires sont présents
          if (!productData.name || !productData.productTypeId) {
            console.log('Produit incomplet, champs manquants:', doc.id);
            return;
          }
          
          // Ajouter tous les produits sans filtrage par rôle pour le moment
          productsList.push({
            ...productData,
            id: doc.id,
            typeName: productTypesMap.get(productData.productTypeId) || 'Type inconnu',
            imageUrl: productData.imageUrl,
            documentCount: documentCountMap.get(doc.id) || 0
          });
        } catch (err) {
          console.error('Erreur lors du traitement du produit:', doc.id, err);
        }
      });
      
      console.log('Produits chargés:', productsList.length);
      
      // Si aucun produit n'est trouvé, ajouter des produits de démonstration
      if (productsList.length === 0) {
        console.log('Aucun produit trouvé, ajout de produits de démonstration');
        
        // Ajouter quelques produits de démonstration
        productsList.push({
          id: 'demo-1',
          name: 'Micro-onduleur XYZ-1000',
          description: 'Micro-onduleur haute performance pour installations résidentielles',
          productTypeId: 'demo-type-1',
          typeName: 'Micro-onduleurs',
          reference: 'XYZ-1000',
          imageUrl: 'https://via.placeholder.com/400x300?text=Micro-onduleur',
          active: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          documentCount: 3
        });
        
        productsList.push({
          id: 'demo-2',
          name: 'Panneau solaire EcoSun 400W',
          description: 'Panneau solaire monocristallin haute efficacité pour toitures résidentielles',
          productTypeId: 'demo-type-2',
          typeName: 'Panneaux solaires',
          reference: 'ES-400W',
          imageUrl: 'https://via.placeholder.com/400x300?text=Panneau+Solaire',
          active: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          documentCount: 2
        });
        
        productsList.push({
          id: 'demo-3',
          name: 'Batterie PowerStore 10kWh',
          description: 'Système de stockage d\'énergie pour installations résidentielles et commerciales',
          productTypeId: 'demo-type-3',
          typeName: 'Batteries',
          reference: 'PS-10K',
          imageUrl: 'https://via.placeholder.com/400x300?text=Batterie',
          active: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          documentCount: 1
        });
        
        // Ajouter les types de produits correspondants
        if (productTypesList.length === 0) {
          productTypesList.push({ id: 'demo-type-1', name: 'Micro-onduleurs' });
          productTypesList.push({ id: 'demo-type-2', name: 'Panneaux solaires' });
          productTypesList.push({ id: 'demo-type-3', name: 'Batteries' });
          setProductTypes(productTypesList);
        }
      }
      
      setProducts(productsList);
    } catch (err) {
      console.error('Erreur lors du chargement des produits:', err);
      setError('Impossible de charger les produits. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger les documents d'un produit spécifique
  const fetchProductDocuments = useCallback(async (productId: string) => {
    if (!productId) return;
    
    setIsLoadingDocuments(true);
    
    try {
      const documentsQuery = query(
        collection(db, 'documents'),
        where('productId', '==', productId)
      );
      
      const querySnapshot = await getDocs(documentsQuery);
      const documentsList: Document[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Vérifier si le document est accessible pour le rôle de l'utilisateur
        const accessRoles = data.accessRoles || [];
        if (accessRoles.length === 0 || accessRoles.includes(userRole)) {
          documentsList.push({
            id: doc.id,
            name: data.name,
            fileUrl: data.fileUrl,
            fileType: data.fileType,
            productId: data.productId
          });
        }
      });
      
      setProductDocuments(documentsList);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [userRole]);

  // Charger les données au chargement du composant
  useEffect(() => {
    console.log('Chargement des produits pour le rôle:', userRole);
    fetchProducts();
  }, [fetchProducts, userRole]);

  // Charger les documents lorsqu'un produit est sélectionné
  useEffect(() => {
    if (selectedProduct) {
      fetchProductDocuments(selectedProduct);
    } else {
      setProductDocuments([]);
    }
  }, [selectedProduct, fetchProductDocuments]);

  // Filtrer les produits en fonction de la recherche et du type
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.typeName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || product.productTypeId === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Fonction pour ouvrir un document
  const openDocument = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  // Fonction pour visiter le site web du produit
  const visitWebsite = (websiteUrl: string) => {
    if (websiteUrl) {
      window.open(websiteUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Catalogue de produits</h1>
        <p className="text-muted-foreground">Découvrez notre gamme de produits et leurs documentations associées</p>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="mb-8 rounded-lg border bg-card shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-lg font-medium">Recherche de produits</h2>
          <p className="text-sm text-muted-foreground mt-1">Filtrez les produits par mot-clé ou type de produit</p>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Rechercher un produit..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="productType" className="block text-sm font-medium mb-1">
              Type de produit
            </label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
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
        </div>
      </div>

      {/* Affichage des produits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="col-span-full rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
            {error}
          </div>
        ) : (
          <>
            {filteredProducts.length === 0 ? (
              <div className="col-span-full rounded-lg border p-8 text-center">
                <p className="text-muted-foreground">Aucun produit ne correspond à votre recherche</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <Card key={product.id} className={`overflow-hidden transition-all ${selectedProduct === product.id ? 'ring-2 ring-primary' : ''}`}>
                  <div className="relative h-48 w-full bg-muted">
                    {product.imageUrl ? (
                      <div className="h-full w-full flex items-center justify-center p-2">
                        <Image 
                          src={product.imageUrl} 
                          alt={product.name} 
                          width={200}
                          height={150}
                          style={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%' }}
                          priority
                        />
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <span className="text-muted-foreground">Aucune image</span>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{product.name}</CardTitle>
                        <CardDescription className="mt-1">{product.typeName}</CardDescription>
                      </div>
                      <Badge variant="secondary">{product.documentCount} document{product.documentCount !== 1 ? 's' : ''}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm line-clamp-3">{product.description}</p>
                    {product.reference && (
                      <p className="text-xs text-muted-foreground mt-2">Référence: {product.reference}</p>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setSelectedProduct(selectedProduct === product.id ? null : product.id)}
                    >
                      {selectedProduct === product.id ? 'Masquer' : 'Voir les documents'}
                    </Button>
                    {product.websiteUrl && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => visitWebsite(product.websiteUrl || '')}
                        title="Visiter le site web"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </CardFooter>
                  
                  {/* Documents associés au produit */}
                  {selectedProduct === product.id && (
                    <div className="border-t p-4 bg-muted/30">
                      <h3 className="text-sm font-medium mb-2">Documents associés</h3>
                      {isLoadingDocuments ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      ) : productDocuments.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">Aucun document disponible pour ce produit</p>
                      ) : (
                        <div className="space-y-2">
                          {productDocuments.map((document) => (
                            <div 
                              key={document.id} 
                              className="flex items-center justify-between rounded-md border bg-background p-2 text-sm hover:bg-muted/50 cursor-pointer"
                              onClick={() => openDocument(document.fileUrl)}
                            >
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{document.name}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {document.fileType.toUpperCase()}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
