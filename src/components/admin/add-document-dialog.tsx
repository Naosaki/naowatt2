"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileInput } from '@/components/ui/file-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { collection, getDocs, doc, setDoc, query, where, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Category, Language } from '@/lib/types';
import { Product } from '@/types/product';

interface AddDocumentDialogProps {
  onDocumentAdded?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type UserRole = 'admin' | 'user' | 'distributor' | 'installer';

export function AddDocumentDialog({ onDocumentAdded, open, onOpenChange }: AddDocumentDialogProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(open ?? false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [productId, setProductId] = useState('');
  const [language, setLanguage] = useState('');
  const [version, setVersion] = useState('');
  const [accessRoles, setAccessRoles] = useState<UserRole[]>(['admin']);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<(Product & { id: string })[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedProductType, setSelectedProductType] = useState('');
  const [productTypes, setProductTypes] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les catégories existantes
  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categoriesList: Category[] = [];
      
      querySnapshot.forEach((doc) => {
        const categoryData = doc.data() as Category;
        categoriesList.push({
          ...categoryData,
          id: doc.id,
        });
      });
      
      setCategories(categoriesList);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  // Charger les types de produits existants
  const fetchProductTypes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'productTypes'));
      const productTypesList: { id: string; name: string }[] = [];
      
      querySnapshot.forEach((doc) => {
        const productTypeData = doc.data();
        productTypesList.push({
          id: doc.id,
          name: productTypeData.name,
        });
      });
      
      setProductTypes(productTypesList);
    } catch (error) {
      console.error('Erreur lors du chargement des types de produits:', error);
    }
  };

  // Charger les produits en fonction du type de produit sélectionné
  const fetchProducts = async (productTypeId: string) => {
    if (!productTypeId) {
      setProducts([]);
      return;
    }
    
    try {
      const q = query(
        collection(db, 'products'),
        where('productTypeId', '==', productTypeId),
        where('active', '==', true),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      const productsList: (Product & { id: string })[] = [];
      
      querySnapshot.forEach((doc) => {
        const productData = doc.data() as Product;
        productsList.push({
          ...productData,
          id: doc.id,
        });
      });
      
      setProducts(productsList);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    }
  };

  // Effet pour charger les produits lorsque le type de produit change
  useEffect(() => {
    if (selectedProductType) {
      fetchProducts(selectedProductType);
    }
  }, [selectedProductType]);

  // Charger les langues existantes
  const fetchLanguages = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'languages'));
      const languagesList: Language[] = [];
      
      querySnapshot.forEach((doc) => {
        const languageData = doc.data() as Language;
        languagesList.push({
          ...languageData,
          id: doc.id,
        });
      });
      
      setLanguages(languagesList);
    } catch (error) {
      console.error('Erreur lors du chargement des langues:', error);
    }
  };

  // Mettre à jour l'état local quand la prop open change
  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  // Gérer l'ouverture du dialogue
  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
    if (newOpen) {
      fetchCategories();
      fetchProductTypes();
      fetchLanguages();
    } else {
      // Réinitialiser les champs lors de la fermeture
      setName('');
      setDescription('');
      setCategory('');
      setSelectedProductType('');
      setProductId('');
      setLanguage('');
      setVersion('');
      setAccessRoles(['admin']);
      setFile(null);
      setUploadProgress(0);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Gérer la sélection du fichier
  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
  };

  // Gérer la sélection des rôles d'accès
  const handleRoleToggle = (role: UserRole) => {
    setAccessRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role) 
        : [...prev, role]
    );
  };

  // Fonction pour obtenir le type MIME du fichier
  const getFileType = (file: File): string => {
    return file.type || 'application/octet-stream';
  };

  // Fonction pour uploader le document
  const handleUpload = async () => {
    if (!file) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    if (!name || !category || !language || !productId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (accessRoles.length === 0) {
      toast.error('Veuillez sélectionner au moins un rôle d&apos;accès');
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      // 1. Upload du fichier dans Firebase Storage
      const fileType = getFileType(file);
      const timestamp = Date.now();
      const storageRef = ref(storage, `documents/${timestamp}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Observer l'état de l'upload
      uploadTask.on('state_changed', 
        (snapshot) => {
          // Progression de l'upload
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          // Erreur pendant l'upload
          console.error('Erreur lors de l&apos;upload:', error);
          setError(`Erreur lors de l'upload: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
          setIsLoading(false);
        }, 
        async () => {
          // Upload terminé avec succès
          try {
            // 2. Obtenir l'URL de téléchargement
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // 3. Créer le document dans Firestore
            const documentId = `doc_${timestamp}`;
            const docRef = doc(db, 'documents', documentId);
            
            await setDoc(docRef, {
              id: documentId,
              title: name,
              description,
              fileUrl: downloadURL,
              fileName: file.name,
              fileType,
              fileSize: file.size,
              uploadedBy: user?.id,
              uploadedAt: timestamp,
              categoryId: category,
              productId: productId,
              languageId: language,
              accessRoles,
              version: version || '1.0',
              active: true
            });
            
            toast.success('Document ajouté avec succès');
            
            // Réinitialiser le formulaire
            setName('');
            setDescription('');
            setCategory('');
            setSelectedProductType('');
            setProductId('');
            setLanguage('');
            setVersion('');
            setAccessRoles(['admin']);
            setFile(null);
            setUploadProgress(0);
            setError(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            
            setIsOpen(false);
            
            // Appeler le callback si fourni
            if (onDocumentAdded) {
              onDocumentAdded();
            }
          } catch (error) {
            console.error('Erreur lors de la création du document:', error);
            setError(`Erreur lors de l'ajout du document: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
          } finally {
            setIsLoading(false);
          }
        }
      );
    } catch (error) {
      console.error('Erreur lors de l&apos;upload:', error);
      setError(`Erreur lors de l'upload: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau document</DialogTitle>
          <DialogDescription>
            Téléchargez un nouveau document et définissez ses propriétés et permissions d&apos;accès.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nom <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Datasheet Panneau XYZ-100W"
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Description détaillée du document"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Catégorie <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3 flex gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="datasheet">Datasheet</SelectItem>
                      <SelectItem value="certification">Certification</SelectItem>
                      <SelectItem value="manual">Manuel d'utilisation</SelectItem>
                      <SelectItem value="warranty">Garantie</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="productType" className="text-right">
              Type de produit
            </Label>
            <div className="col-span-3">
              <Select value={selectedProductType} onValueChange={setSelectedProductType}>
                <SelectTrigger>
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
              <p className="text-sm text-gray-500 mt-1">
                S&apos;il n&apos;existe pas, vous pouvez le créer dans la section Types de produits
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product" className="text-right">
              Produit <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3 flex gap-2">
              <Select 
                value={productId} 
                onValueChange={setProductId}
                disabled={!selectedProductType || products.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={!selectedProductType ? "Sélectionnez d'abord un type de produit" : products.length === 0 ? "Aucun produit disponible" : "Sélectionner un produit"} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} {product.reference ? `(${product.reference})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="language" className="text-right">
              Langue <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3 flex gap-2">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une langue" />
                </SelectTrigger>
                <SelectContent>
                  {languages.length > 0 ? (
                    languages.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id}>
                        {lang.name}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">Anglais</SelectItem>
                      <SelectItem value="de">Allemand</SelectItem>
                      <SelectItem value="es">Espagnol</SelectItem>
                      <SelectItem value="it">Italien</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="version" className="text-right">
              Version
            </Label>
            <Input
              id="version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="col-span-3"
              placeholder="1.0"
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="roles" className="text-right">
              Rôles d&apos;accès
            </Label>
            <div className="col-span-3 flex flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="role-admin"
                  checked={accessRoles.includes('admin')}
                  onChange={() => handleRoleToggle('admin')}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="role-admin">Admin</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="role-distributor"
                  checked={accessRoles.includes('distributor')}
                  onChange={() => handleRoleToggle('distributor')}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="role-distributor">Distributeur</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="role-installer"
                  checked={accessRoles.includes('installer')}
                  onChange={() => handleRoleToggle('installer')}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="role-installer">Installateur</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="role-user"
                  checked={accessRoles.includes('user')}
                  onChange={() => handleRoleToggle('user')}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="role-user">Utilisateur</label>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="file" className="text-right pt-2">
              Fichier <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3">
              <FileInput
                onChange={handleFileChange}
                value={file}
              />
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} />
            </div>
          </div>
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-start-2 col-span-3">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1">{Math.round(uploadProgress)}% téléchargé</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-start-2 col-span-3 text-red-500">
                {error}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleUpload} disabled={isLoading}>
            {isLoading ? 'Téléchargement en cours...' : 'Télécharger'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
