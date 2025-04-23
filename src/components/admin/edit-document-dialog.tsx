"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Document as DocumentType, Category, ProductType, Language } from '@/lib/types';

interface EditDocumentDialogProps {
  document: DocumentType | null;
  isOpen: boolean;
  onClose: () => void;
  onDocumentUpdated: () => void;
}

type UserRole = 'admin' | 'user' | 'distributor' | 'installer';

export function EditDocumentDialog({ document, isOpen, onClose, onDocumentUpdated }: EditDocumentDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [productType, setProductType] = useState('');
  const [language, setLanguage] = useState('');
  const [version, setVersion] = useState('');
  const [accessRoles, setAccessRoles] = useState<UserRole[]>(['admin']);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);

  // Charger les catégories depuis Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, 'categories'), orderBy('name'));
        const querySnapshot = await getDocs(q);
        
        const categoriesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as (Category & { id: string })[];
        
        setCategories(categoriesData);
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    };

    // Charger les types de produits depuis Firestore
    const fetchProductTypes = async () => {
      try {
        const q = query(collection(db, 'productTypes'), orderBy('name'));
        const querySnapshot = await getDocs(q);
        
        const productTypesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as (ProductType & { id: string })[];
        
        setProductTypes(productTypesData);
      } catch (error) {
        console.error('Erreur lors du chargement des types de produits:', error);
      }
    };

    // Charger les langues depuis Firestore
    const fetchLanguages = async () => {
      try {
        const q = query(collection(db, 'languages'), orderBy('name'));
        const querySnapshot = await getDocs(q);
        
        const languagesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as (Language & { id: string })[];
        
        setLanguages(languagesData);
      } catch (error) {
        console.error('Erreur lors du chargement des langues:', error);
      }
    };

    if (isOpen) {
      fetchCategories();
      fetchProductTypes();
      fetchLanguages();
    }
  }, [isOpen]);

  // Initialiser les champs avec les données du document
  useEffect(() => {
    if (document) {
      setName(document.name || '');
      setDescription(document.description || '');
      setCategory(document.category || '');
      setProductType(document.productType || '');
      setLanguage(document.language || '');
      setVersion(document.version || '');
      setAccessRoles(document.accessRoles || ['admin']);
    }
  }, [document]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;
    
    setIsLoading(true);

    try {
      // Validation des champs obligatoires
      if (!name.trim()) {
        toast.error('Le nom du document est requis');
        setIsLoading(false);
        return;
      }

      // Préparation des données à mettre à jour
      const updatedData = {
        name,
        description,
        category,
        productType,
        language,
        version,
        accessRoles,
      };

      // Mise à jour du document dans Firestore
      await updateDoc(doc(db, 'documents', document.id), updatedData);
      
      toast.success('Document mis à jour avec succès');
      onDocumentUpdated();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du document:', error);
      toast.error('Erreur lors de la mise à jour du document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleToggle = (role: UserRole) => {
    setAccessRoles(prev => {
      if (prev.includes(role)) {
        // Ne pas permettre de supprimer admin si c'est le seul rôle
        if (role === 'admin' && prev.length === 1) return prev;
        return prev.filter(r => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Modifier le document</DialogTitle>
          <DialogDescription>
            Modifiez les informations du document. Les champs marqués d&apos;un astérisque (*) sont obligatoires.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nom *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="Nom du document"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Description du document"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Catégorie
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="productType" className="text-right">
                Type de produit
              </Label>
              <Select value={productType} onValueChange={setProductType}>
                <SelectTrigger className="col-span-3">
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

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="language" className="text-right">
                Langue *
              </Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionner une langue" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.id} value={lang.id}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                placeholder="ex: 1.0"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Accès
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="role-admin" 
                    checked={accessRoles.includes('admin')} 
                    onCheckedChange={() => handleRoleToggle('admin')}
                    disabled
                  />
                  <Label htmlFor="role-admin">Admin (toujours activé)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="role-user" 
                    checked={accessRoles.includes('user')} 
                    onCheckedChange={() => handleRoleToggle('user')}
                  />
                  <Label htmlFor="role-user">Utilisateur</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="role-distributor" 
                    checked={accessRoles.includes('distributor')} 
                    onCheckedChange={() => handleRoleToggle('distributor')}
                  />
                  <Label htmlFor="role-distributor">Distributeur</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="role-installer" 
                    checked={accessRoles.includes('installer')} 
                    onCheckedChange={() => handleRoleToggle('installer')}
                  />
                  <Label htmlFor="role-installer">Installateur</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Mise à jour...' : 'Enregistrer les modifications'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
