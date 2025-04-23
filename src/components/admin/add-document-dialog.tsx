"use client";

import { useState, useRef } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Category, ProductType, Language } from '@/lib/types';

interface AddDocumentDialogProps {
  onDocumentAdded?: () => void;
}

type UserRole = 'admin' | 'user' | 'distributor' | 'installer';

export function AddDocumentDialog({ onDocumentAdded }: AddDocumentDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [productType, setProductType] = useState('');
  const [language, setLanguage] = useState('');
  const [version, setVersion] = useState('');
  const [accessRoles, setAccessRoles] = useState<UserRole[]>(['admin']);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
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
      const productTypesList: ProductType[] = [];
      
      querySnapshot.forEach((doc) => {
        const productTypeData = doc.data() as ProductType;
        productTypesList.push({
          ...productTypeData,
          id: doc.id,
        });
      });
      
      setProductTypes(productTypesList);
    } catch (error) {
      console.error('Erreur lors du chargement des types de produits:', error);
    }
  };

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

  // Gérer l'ouverture du dialogue
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchCategories();
      fetchProductTypes();
      fetchLanguages();
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

    if (!name || !category || !language) {
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
          toast.error('Erreur lors de l&apos;upload du fichier');
          setIsLoading(false);
        }, 
        async () => {
          // Upload terminé avec succès
          try {
            // 2. Obtenir l'URL de téléchargement
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // 3. Créer le document dans Firestore
            const documentId = `doc_${timestamp}`;
            
            await setDoc(doc(db, 'documents', documentId), {
              id: documentId,
              name,
              description,
              fileUrl: downloadURL,
              fileType,
              fileSize: file.size,
              uploadedBy: user?.uid,
              uploadedAt: serverTimestamp(),
              category,
              productType,
              language,
              accessRoles,
              version: version || '1.0',
            });
            
            toast.success('Document ajouté avec succès');
            
            // Réinitialiser le formulaire
            setName('');
            setDescription('');
            setCategory('');
            setProductType('');
            setLanguage('');
            setVersion('');
            setAccessRoles(['admin']);
            setFile(null);
            setUploadProgress(0);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            
            setOpen(false);
            
            // Appeler le callback si fourni
            if (onDocumentAdded) {
              onDocumentAdded();
            }
          } catch (error) {
            console.error('Erreur lors de la création du document:', error);
            toast.error('Erreur lors de la création du document');
          } finally {
            setIsLoading(false);
          }
        }
      );
    } catch (error) {
      console.error('Erreur lors de l&apos;upload:', error);
      toast.error('Erreur lors de l&apos;upload du fichier');
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Ajouter un document</Button>
      </DialogTrigger>
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
                      <SelectItem value="manual">Manuel d&apos;utilisation</SelectItem>
                      <SelectItem value="warranty">Garantie</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="productType" className="text-right">
              Type de produit <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3 flex gap-2">
              <Select value={productType} onValueChange={setProductType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un type de produit" />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.length > 0 ? (
                    productTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="solar_panel">Panneau solaire</SelectItem>
                      <SelectItem value="inverter">Onduleur</SelectItem>
                      <SelectItem value="battery">Batterie</SelectItem>
                      <SelectItem value="dtu">DTU</SelectItem>
                    </>
                  )}
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
            <Label className="text-right pt-2">
              Accès <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3 flex flex-wrap gap-2">
              <Button 
                type="button" 
                variant={accessRoles.includes('admin') ? "default" : "outline"}
                size="sm"
                onClick={() => handleRoleToggle('admin')}
                className="rounded-full"
              >
                Admin
              </Button>
              <Button 
                type="button" 
                variant={accessRoles.includes('distributor') ? "default" : "outline"}
                size="sm"
                onClick={() => handleRoleToggle('distributor')}
                className="rounded-full"
              >
                Distributeur
              </Button>
              <Button 
                type="button" 
                variant={accessRoles.includes('installer') ? "default" : "outline"}
                size="sm"
                onClick={() => handleRoleToggle('installer')}
                className="rounded-full"
              >
                Installateur
              </Button>
              <Button 
                type="button" 
                variant={accessRoles.includes('user') ? "default" : "outline"}
                size="sm"
                onClick={() => handleRoleToggle('user')}
                className="rounded-full"
              >
                Utilisateur
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">
              Fichier <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3">
              <FileInput
                id="file"
                value={file}
                onChange={handleFileChange}
                required
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
              />
            </div>
          </div>
          
          {isLoading && uploadProgress > 0 && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right text-sm">Progression:</div>
              <div className="col-span-3">
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {Math.round(uploadProgress)}% terminé
                </p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={handleUpload} disabled={isLoading}>
            {isLoading ? 'Téléchargement...' : 'Télécharger'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
