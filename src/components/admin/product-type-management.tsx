"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { AddProductTypeDialog } from './add-product-type-dialog';
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ProductType } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function ProductTypeManagement() {
  const [productTypes, setProductTypes] = useState<(ProductType & { id: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProductType, setEditingProductType] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAccessRoles, setEditAccessRoles] = useState<string[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [productTypeToDelete, setProductTypeToDelete] = useState<string | null>(null);

  // Charger les types de produits depuis Firestore
  const fetchProductTypes = async () => {
    setLoading(true);
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
      toast.error('Erreur lors du chargement des types de produits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductTypes();
  }, []);

  const handleProductTypeAdded = () => {
    fetchProductTypes();
  };

  const handleDeleteProductType = async (productTypeId: string) => {
    setProductTypeToDelete(productTypeId);
    setConfirmDialogOpen(true);
  };

  const confirmDeleteProductType = async () => {
    if (!productTypeToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'productTypes', productTypeToDelete));
      toast.success('Type de produit supprimé avec succès');
      fetchProductTypes();
    } catch (error) {
      console.error('Erreur lors de la suppression du type de produit:', error);
      toast.error('Erreur lors de la suppression du type de produit');
    }
  };

  const startEditing = (productType: ProductType & { id: string }) => {
    setEditingProductType(productType.id);
    setEditName(productType.name);
    setEditDescription(productType.description);
    setEditAccessRoles(productType.accessRoles || ['admin']);
  };

  const cancelEditing = () => {
    setEditingProductType(null);
    setEditName('');
    setEditDescription('');
    setEditAccessRoles([]);
  };

  const saveEditing = async (productTypeId: string) => {
    if (!editName.trim()) {
      toast.error('Le nom du type de produit est requis');
      return;
    }

    try {
      await updateDoc(doc(db, 'productTypes', productTypeId), {
        name: editName,
        description: editDescription,
        accessRoles: editAccessRoles,
      });

      toast.success('Type de produit mis à jour avec succès');
      setEditingProductType(null);
      fetchProductTypes();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du type de produit:', error);
      toast.error('Erreur lors de la mise à jour du type de produit');
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
        <AddProductTypeDialog 
          open={showAddDialog} 
          onOpenChange={setShowAddDialog} 
          onProductTypeAdded={handleProductTypeAdded} 
        />
      )}
      
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmDeleteProductType}
        title="Confirmer la suppression"
        description="Êtes-vous sûr de vouloir supprimer ce type de produit ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
      
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gestion des types de produits</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          Ajouter un type de produit
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Tous les types de produits</CardTitle>
          <CardDescription>Gérez les types de produits et leurs droits d'accès</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">
              <p>Chargement des types de produits...</p>
            </div>
          ) : productTypes.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucun type de produit trouvé. Ajoutez votre premier type de produit.
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
                {productTypes.map((productType) => (
                  <div key={productType.id} className="grid grid-cols-5 p-3 items-center">
                    {editingProductType === productType.id ? (
                      // Mode édition
                      <>
                        <div>
                          <Input 
                            value={editName} 
                            onChange={(e) => setEditName(e.target.value)} 
                            className="w-full"
                            placeholder="Nom du type de produit"
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
                              id={`edit-role-admin-${productType.id}`} 
                              checked={editAccessRoles.includes('admin')} 
                              onCheckedChange={() => handleRoleToggle('admin')}
                              disabled
                            />
                            <Label htmlFor={`edit-role-admin-${productType.id}`}>Admin</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`edit-role-user-${productType.id}`} 
                              checked={editAccessRoles.includes('user')} 
                              onCheckedChange={() => handleRoleToggle('user')}
                            />
                            <Label htmlFor={`edit-role-user-${productType.id}`}>Utilisateur</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`edit-role-distributor-${productType.id}`} 
                              checked={editAccessRoles.includes('distributor')} 
                              onCheckedChange={() => handleRoleToggle('distributor')}
                            />
                            <Label htmlFor={`edit-role-distributor-${productType.id}`}>Distributeur</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`edit-role-installer-${productType.id}`} 
                              checked={editAccessRoles.includes('installer')} 
                              onCheckedChange={() => handleRoleToggle('installer')}
                            />
                            <Label htmlFor={`edit-role-installer-${productType.id}`}>Installateur</Label>
                          </div>
                        </div>
                        <div>
                          {productType.createdAt.toLocaleDateString()}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => saveEditing(productType.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={cancelEditing}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      // Mode affichage
                      <>
                        <div className="font-medium">{productType.name}</div>
                        <div className="text-sm">{productType.description || '-'}</div>
                        <div className="flex flex-wrap gap-1">
                          {productType.accessRoles?.map(role => (
                            <Badge key={role} variant="outline" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {productType.createdAt.toLocaleDateString()}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => startEditing(productType)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteProductType(productType.id)}>
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
