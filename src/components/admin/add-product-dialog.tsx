"use client";

import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ProductType } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded: () => void;
  productTypes: (ProductType & { id: string })[];
}

type UserRole = 'admin' | 'user' | 'distributor' | 'installer';
type Language = { id: string; name: string; code: string; };

export default function AddProductDialog({ open, onOpenChange, onProductAdded, productTypes }: AddProductDialogProps) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    productTypeId: '',
    reference: '',
    websiteUrl: '',
    languageId: '',
    accessRoles: ['admin'] as UserRole[],
    active: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);

  // Charger les langues disponibles
  useEffect(() => {
    if (open) {
      fetchLanguages();
    }
  }, [open]);

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

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      productTypeId: '',
      reference: '',
      websiteUrl: '',
      languageId: '',
      accessRoles: ['admin'],
      active: true
    });
    setImageFile(null);
    setImagePreview(null);
  };

  // Gérer la sélection des rôles d'accès
  const handleRoleToggle = (role: UserRole) => {
    setForm(prev => ({
      ...prev,
      accessRoles: prev.accessRoles.includes(role)
        ? prev.accessRoles.filter(r => r !== role)
        : [...prev.accessRoles, role]
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Vérifier le type de fichier (uniquement des images)
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner un fichier image valide');
        return;
      }
      
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5MB');
        return;
      }
      
      setImageFile(file);
      
      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    // Validation des champs requis
    if (!form.name.trim()) {
      toast.error('Le nom du produit est requis');
      return;
    }
    
    if (!form.productTypeId) {
      toast.error('Le type de produit est requis');
      return;
    }

    if (!form.languageId) {
      toast.error('La langue du produit est requise');
      return;
    }
    
    if (form.accessRoles.length === 0) {
      toast.error('Veuillez sélectionner au moins un rôle d\'accès');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let imageUrl = '';
      
      // Si une image a été sélectionnée, la téléverser
      if (imageFile) {
        const timestamp = Date.now();
        const storageRef = ref(storage, `products/${timestamp}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      // Ajouter le produit à Firestore
      const newProduct = {
        name: form.name.trim(),
        description: form.description.trim(),
        productTypeId: form.productTypeId,
        reference: form.reference.trim(),
        websiteUrl: form.websiteUrl.trim(),
        languageId: form.languageId,
        accessRoles: form.accessRoles,
        imageUrl: imageUrl || null,
        active: form.active,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      await addDoc(collection(db, 'products'), newProduct);
      
      toast.success('Produit ajouté avec succès');
      resetForm();
      onProductAdded();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du produit:', error);
      toast.error('Une erreur est survenue lors de l\'ajout du produit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle>Ajouter un nouveau produit</DialogTitle>
          <DialogDescription>
            Remplissez les informations du produit ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nom du produit"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reference">Référence</Label>
              <Input
                id="reference"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="Référence du produit"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="productType">Type de produit *</Label>
              <Select 
                value={form.productTypeId} 
                onValueChange={(value) => setForm({ ...form, productTypeId: value })}
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
              <Label htmlFor="language">Langue du produit *</Label>
              <Select 
                value={form.languageId} 
                onValueChange={(value) => setForm({ ...form, languageId: value })}
              >
                <SelectTrigger id="language">
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
          
          <div className="grid gap-2">
            <Label htmlFor="websiteUrl">URL du site internet</Label>
            <Input
              id="websiteUrl"
              type="url"
              value={form.websiteUrl}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
              placeholder="https://www.exemple.com/produit"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description du produit"
              rows={2}
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Rôles d&apos;accès *</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="role-admin" 
                  checked={form.accessRoles.includes('admin')}
                  onCheckedChange={() => handleRoleToggle('admin')}
                />
                <Label htmlFor="role-admin" className="cursor-pointer">Admin</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="role-user" 
                  checked={form.accessRoles.includes('user')}
                  onCheckedChange={() => handleRoleToggle('user')}
                />
                <Label htmlFor="role-user" className="cursor-pointer">Utilisateur</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="role-distributor" 
                  checked={form.accessRoles.includes('distributor')}
                  onCheckedChange={() => handleRoleToggle('distributor')}
                />
                <Label htmlFor="role-distributor" className="cursor-pointer">Distributeur</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="role-installer" 
                  checked={form.accessRoles.includes('installer')}
                  onCheckedChange={() => handleRoleToggle('installer')}
                />
                <Label htmlFor="role-installer" className="cursor-pointer">Installateur</Label>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 items-start">
            <div className="grid gap-2">
              <Label htmlFor="image">Image du produit (optionnel)</Label>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Sélectionner une image
                </Button>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>
            
            <div>
              {imagePreview ? (
                <div className="relative w-full h-[100px] rounded-md overflow-hidden border">
                  <img
                    src={imagePreview}
                    alt="Aperçu du produit"
                    className="w-full h-full object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 rounded-full"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[100px] border rounded-md border-dashed">
                  <span className="text-sm text-muted-foreground">Aucune image sélectionnée</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={form.active}
              onCheckedChange={(checked: boolean) => setForm({ ...form, active: checked })}
            />
            <Label htmlFor="active">Produit actif</Label>
          </div>
        </div>
        <DialogFooter className="pt-4 mt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>Ajouter le produit</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
