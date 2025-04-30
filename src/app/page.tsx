"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Download, FileText, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { useTheme } from 'next-themes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Footer } from '@/components/footer';

// Interface pour les produits
interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  typeName: string;
  documentCount: number;
  reference?: string;
}

// Interface pour les documents
interface Document {
  id: string;
  name: string;
  fileType: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [websiteUrl, setWebsiteUrl] = useState('https://example.com');
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('/logo.png'); // Logo par défaut
  const { theme } = useTheme();
  const router = useRouter();
  
  // États pour la gestion des documents et de la modal
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [productDocuments, setProductDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  const productsRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Fonction pour récupérer les documents associés à un produit
  const fetchProductDocuments = useCallback(async (productId: string) => {
    setIsLoadingDocuments(true);
    
    try {
      // Récupérer les documents associés au produit
      const documentsQuery = query(
        collection(db, 'documents'),
        where('productId', '==', productId)
      );
      const documentsSnapshot = await getDocs(documentsQuery);
      
      const documentsList: Document[] = [];
      
      // Pour la démonstration, si aucun document n'est trouvé, ajouter des documents factices
      if (documentsSnapshot.empty) {
        // Ajouter des documents de démonstration
        documentsList.push(
          {
            id: 'demo-doc-1',
            name: 'Manuel d\'installation',
            fileType: 'pdf'
          },
          {
            id: 'demo-doc-2',
            name: 'Fiche technique',
            fileType: 'pdf'
          },
          {
            id: 'demo-doc-3',
            name: 'Guide de maintenance',
            fileType: 'pdf'
          }
        );
      } else {
        // Ajouter les documents réels
        documentsSnapshot.forEach((doc) => {
          const data = doc.data();
          documentsList.push({
            id: doc.id,
            name: data.name,
            fileType: data.fileType
          });
        });
      }
      
      setProductDocuments(documentsList);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);
  
  // Charger les documents lorsqu'un produit est sélectionné
  useEffect(() => {
    if (selectedProduct) {
      fetchProductDocuments(selectedProduct);
    } else {
      setProductDocuments([]);
    }
  }, [selectedProduct, fetchProductDocuments]);

  // Récupérer les paramètres du site depuis Firestore
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Récupérer les paramètres de l'application (logo et websiteUrl)
        const appSettingsDoc = await getDoc(doc(db, 'settings', 'app_settings'));
        if (appSettingsDoc.exists()) {
          const appSettingsData = appSettingsDoc.data();
          // Récupérer l'URL du site web
          if (appSettingsData.websiteUrl) {
            setWebsiteUrl(appSettingsData.websiteUrl);
          }
          
          // Utiliser le logo adapté au thème actuel
          if (theme === 'dark' && appSettingsData.logoDarkMode) {
            setLogoUrl(appSettingsData.logoDarkMode);
          } else if (appSettingsData.logoLightMode) {
            setLogoUrl(appSettingsData.logoLightMode);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des paramètres:', error);
      }
    };
    
    fetchSettings();
  }, [theme]); // Recharger quand le thème change

  // Charger les produits depuis Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Début du chargement des produits...');
        
        // Récupérer les types de produits
        const productTypesMap = new Map();
        const productTypesQuery = query(collection(db, 'productTypes'));
        const productTypesSnapshot = await getDocs(productTypesQuery);
        
        console.log('Types de produits récupérés:', productTypesSnapshot.size);
        
        productTypesSnapshot.forEach((doc) => {
          const data = doc.data();
          productTypesMap.set(doc.id, data.name);
        });
        
        // Récupérer les produits actifs
        const productsQuery = query(
          collection(db, 'products')
          // Nous supprimons temporairement ce filtre pour voir tous les produits
          // where('active', '==', true)
        );
        const productsSnapshot = await getDocs(productsQuery);
        
        console.log('Produits récupérés:', productsSnapshot.size);
        
        // Compter les documents pour chaque produit
        const documentsQuery = query(collection(db, 'documents'));
        const documentsSnapshot = await getDocs(documentsQuery);
        
        console.log('Documents récupérés:', documentsSnapshot.size);
        
        const documentCountMap = new Map<string, number>();
        
        documentsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.productId) {
            const count = documentCountMap.get(data.productId) || 0;
            documentCountMap.set(data.productId, count + 1);
          }
        });
        
        const productsList: Product[] = [];
        
        productsSnapshot.forEach((doc) => {
          const productData = doc.data();
          console.log('Traitement du produit:', doc.id, productData);
          
          if (productData.name) {
            productsList.push({
              id: doc.id,
              name: productData.name,
              description: productData.description || '',
              imageUrl: productData.imageUrl,
              typeName: productData.productTypeId ? (productTypesMap.get(productData.productTypeId) || 'Type inconnu') : 'Type inconnu',
              documentCount: documentCountMap.get(doc.id) || 0,
              reference: productData.reference
            });
          }
        });
        
        console.log('Nombre de produits traités:', productsList.length);
        
        // Si aucun produit n'est trouvé, ajouter des produits de démonstration
        if (productsList.length === 0) {
          console.log('Aucun produit trouvé, ajout de produits de démonstration');
          
          productsList.push(
            {
              id: 'demo-1',
              name: 'Micro-onduleur XYZ-1000',
              description: 'Micro-onduleur haute performance pour installations résidentielles',
              typeName: 'Micro-onduleurs',
              imageUrl: 'https://via.placeholder.com/400x300?text=Micro-onduleur',
              documentCount: 3,
              reference: 'XYZ-1000'
            },
            {
              id: 'demo-2',
              name: 'Panneau solaire EcoSun 400W',
              description: 'Panneau solaire monocristallin haute efficacité pour toitures résidentielles',
              typeName: 'Panneaux solaires',
              imageUrl: 'https://via.placeholder.com/400x300?text=Panneau+Solaire',
              documentCount: 2,
              reference: 'ES-400W'
            },
            {
              id: 'demo-3',
              name: 'Batterie PowerStore 10kWh',
              description: 'Système de stockage d\'énergie pour installations résidentielles et commerciales',
              typeName: 'Batteries',
              imageUrl: 'https://via.placeholder.com/400x300?text=Batterie',
              documentCount: 1,
              reference: 'PS-10K'
            }
          );
        }
        
        setProducts(productsList);
        setFilteredProducts(productsList);
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
        setError('Impossible de charger les produits. Veuillez réessayer plus tard.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  // Filtrer les produits en fonction de la recherche
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.typeName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  // Animations GSAP - améliorées pour éviter les bugs lors des navigations
  useEffect(() => {
    if (typeof window === 'undefined' || !gsap) return;
    
    // Réinitialiser les éléments avant d'appliquer de nouvelles animations
    gsap.set(['.hero-title', '.hero-description', '.hero-search', '.product-card'], {
      clearProps: 'all'
    });
    
    // Utiliser un petit délai pour s'assurer que le DOM est prêt
    const animationTimeout = setTimeout(() => {
      // Animation du héros avec timeline pour une meilleure synchronisation
      const heroTimeline = gsap.timeline();
      
      heroTimeline.from('.hero-title', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      });
      
      heroTimeline.from('.hero-description', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      }, '-=0.6');
      
      heroTimeline.from('.hero-search', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      }, '-=0.6');
      
      // Animation des cartes de produits - séparée de la timeline du héros
      gsap.from('.product-card', {
        y: 50,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.6
      });
    }, 100); // Petit délai pour s'assurer que tout est rendu
    
    // Nettoyage des animations lors du démontage du composant
    return () => {
      clearTimeout(animationTimeout);
      gsap.killTweensOf(['.hero-title', '.hero-description', '.hero-search', '.product-card']);
    };
  }, []);

  // Fonction pour ouvrir la modal de connexion
  const openLoginModal = (document: Document) => {
    setSelectedDocument(document);
    setIsLoginModalOpen(true);
  };

  // Fonction pour fermer la modal de connexion
  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setSelectedDocument(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-8 lg:px-12">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image 
                src={logoUrl} 
                alt="DataCop Logo" 
                width={40} 
                height={40} 
                className="h-8 w-auto"
              />
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {websiteUrl && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={websiteUrl} target="_blank" className="flex items-center gap-1">
                  <span>Retour au site</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <ThemeToggle />
            <Button size="sm" onClick={() => router.push('/login')}>
              Connexion
            </Button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-4 md:py-8">
        {/* Hero Section */}
        <section ref={heroRef} className="py-8 md:py-12 lg:py-16">
          <div className="px-0">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="hero-title text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Documentation technique de nos produits
                </h1>
                <p className="hero-description mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Accédez à tous les documents techniques, manuels d&apos;installation et fiches produits
                </p>
              </div>
              
              <div ref={searchRef} className="hero-search w-full max-w-md mx-auto mt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Rechercher un produit..."
                    className="pl-10 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section ref={productsRef} className="py-4 md:py-8">
          <div className="px-0">
            <h2 className="text-2xl font-bold tracking-tight mb-6">Nos produits</h2>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 border rounded-lg">
                <p className="text-muted-foreground">{error}</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <p className="text-muted-foreground">Aucun produit ne correspond à votre recherche</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="product-card overflow-hidden flex flex-col h-full transition-all hover:shadow-md">
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
                          <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{product.typeName}</p>
                        </div>
                        <Badge variant="secondary">{product.documentCount} document{product.documentCount !== 1 ? 's' : ''}</Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-grow">
                      <p className="text-sm line-clamp-3">{product.description}</p>
                      {product.reference && (
                        <p className="text-xs text-muted-foreground mt-2">Référence: {product.reference}</p>
                      )}
                    </CardContent>
                    
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        onClick={() => setSelectedProduct(selectedProduct === product.id ? null : product.id)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {selectedProduct === product.id ? 'Masquer les documents' : 'Voir les documents'}
                      </Button>
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
                                onClick={() => openLoginModal(document)}
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
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer showLinks={true} />

      {/* Modal de connexion */}
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connexion requise</DialogTitle>
            <DialogDescription>
              Pour consulter ce document, vous devez vous connecter à votre compte ou créer un compte.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {selectedDocument && (
                <>Vous avez sélectionné le document <strong>{selectedDocument.name}</strong>.</>  
              )}
              <br />
              Connectez-vous pour accéder à tous les documents techniques.
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <Button variant="outline" onClick={closeLoginModal} className="sm:w-auto w-full order-2 sm:order-1">
              Annuler
            </Button>
            <Button onClick={() => router.push('/login')} className="sm:w-auto w-full order-1 sm:order-2">
              Se connecter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
