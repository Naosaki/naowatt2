"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Category } from '@/lib/types';

interface AddCategoryDialogProps {
  onCategoryAdded?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddCategoryDialog({ onCategoryAdded, open, onOpenChange }: AddCategoryDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [accessRoles, setAccessRoles] = useState<string[]>(['admin']);

  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setDialogOpen(open);
    }

    // Réinitialiser le formulaire lors de la fermeture
    if (!open) {
      setName('');
      setDescription('');
      setAccessRoles(['admin']);
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!name.trim()) {
      toast.error('Le nom de la catégorie est requis');
      setIsSubmitting(false);
      return;
    }

    try {
      // Créer un nouvel objet catégorie
      const newCategory = {
        name,
        description,
        createdAt: serverTimestamp(),
        accessRoles: accessRoles as ('admin' | 'user' | 'distributor' | 'installer')[],
      };

      // Ajouter la catégorie à Firestore
      const docRef = await addDoc(collection(db, 'categories'), newCategory);
      
      toast.success('Catégorie ajoutée avec succès');
      
      // Fermer le dialogue
      handleOpenChange(false);
      
      // Appeler le callback si fourni
      if (onCategoryAdded) {
        onCategoryAdded();
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la catégorie:', error);
      toast.error('Erreur lors de l\'ajout de la catégorie');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleToggle = (role: string) => {
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

  const isOpen = open !== undefined ? open : dialogOpen;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!open && (
        <DialogTrigger asChild>
          <Button>Ajouter une catégorie</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter une nouvelle catégorie</DialogTitle>
          <DialogDescription>
            Créez une nouvelle catégorie pour organiser vos documents.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nom
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="ex: Datasheet"
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
                placeholder="Description de la catégorie"
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Ajout en cours...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
