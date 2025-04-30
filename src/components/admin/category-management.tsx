"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { AddCategoryDialog } from './add-category-dialog';
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Category } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Save, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function CategoryManagement() {
  const [categories, setCategories] = useState<(Category & { id: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAccessRoles, setEditAccessRoles] = useState<string[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Charger les catégories depuis Firestore
  const fetchCategories = async () => {
    setLoading(true);
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
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategoryAdded = () => {
    fetchCategories();
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setConfirmDialogOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'categories', categoryToDelete));
      toast.success('Catégorie supprimée avec succès');
      fetchCategories();
    } catch (error) {
      console.error('Erreur lors de la suppression de la catégorie:', error);
      toast.error('Erreur lors de la suppression de la catégorie');
    }
  };

  const startEditing = (category: Category & { id: string }) => {
    setEditingCategory(category.id);
    setEditName(category.name);
    setEditDescription(category.description);
    setEditAccessRoles(category.accessRoles || ['admin']);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setEditName('');
    setEditDescription('');
    setEditAccessRoles([]);
  };

  const saveEditing = async (categoryId: string) => {
    if (!editName.trim()) {
      toast.error('Le nom de la catégorie est requis');
      return;
    }

    try {
      await updateDoc(doc(db, 'categories', categoryId), {
        name: editName,
        description: editDescription,
        accessRoles: editAccessRoles,
      });

      toast.success('Catégorie mise à jour avec succès');
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la catégorie:', error);
      toast.error('Erreur lors de la mise à jour de la catégorie');
    }
  };

  const handleRoleToggle = (role: string) => {
    setEditAccessRoles(prev => {
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
    <div>
      {showAddDialog && (
        <AddCategoryDialog 
          open={showAddDialog} 
          onOpenChange={setShowAddDialog} 
          onCategoryAdded={handleCategoryAdded} 
        />
      )}
      
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmDeleteCategory}
        title="Confirmer la suppression"
        description="Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
      
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gestion des catégories</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une catégorie
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Toutes les catégories</CardTitle>
          <CardDescription>Gérez les catégories de documents et leurs droits d'accès</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">
              <p>Chargement des catégories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucune catégorie trouvée. Ajoutez votre première catégorie.
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="grid grid-cols-5 border-b bg-muted/50 p-3 font-medium">
                <div>Nom</div>
                <div>Description</div>
                <div>Droits d'accès</div>
                <div>Date de création</div>
                <div>Actions</div>
              </div>
              <div className="divide-y">
                {categories.map((category) => (
                  <div key={category.id} className="grid grid-cols-5 p-3 items-center">
                    {editingCategory === category.id ? (
                      // Mode édition
                      <>
                        <div>
                          <Input 
                            value={editName} 
                            onChange={(e) => setEditName(e.target.value)} 
                            className="w-full"
                            placeholder="Nom de la catégorie"
                          />
                        </div>
                        <div>
                          <Input 
                            value={editDescription} 
                            onChange={(e) => setEditDescription(e.target.value)} 
                            className="w-full"
                            placeholder="Description"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`edit-role-admin-${category.id}`} 
                              checked={editAccessRoles.includes('admin')} 
                              onCheckedChange={() => handleRoleToggle('admin')}
                              disabled
                            />
                            <Label htmlFor={`edit-role-admin-${category.id}`}>Admin</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`edit-role-user-${category.id}`} 
                              checked={editAccessRoles.includes('user')} 
                              onCheckedChange={() => handleRoleToggle('user')}
                            />
                            <Label htmlFor={`edit-role-user-${category.id}`}>Utilisateur</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`edit-role-distributor-${category.id}`} 
                              checked={editAccessRoles.includes('distributor')} 
                              onCheckedChange={() => handleRoleToggle('distributor')}
                            />
                            <Label htmlFor={`edit-role-distributor-${category.id}`}>Distributeur</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`edit-role-installer-${category.id}`} 
                              checked={editAccessRoles.includes('installer')} 
                              onCheckedChange={() => handleRoleToggle('installer')}
                            />
                            <Label htmlFor={`edit-role-installer-${category.id}`}>Installateur</Label>
                          </div>
                        </div>
                        <div>
                          {category.createdAt.toLocaleDateString()}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="icon" onClick={() => saveEditing(category.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={cancelEditing}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      // Mode affichage
                      <>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-sm">{category.description || '-'}</div>
                        <div className="flex flex-wrap gap-1">
                          {category.accessRoles?.map(role => (
                            <Badge key={role} variant="outline" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {category.createdAt.toLocaleDateString()}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="icon" onClick={() => startEditing(category)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDeleteCategory(category.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
