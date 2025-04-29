"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { collection, getDocs, query } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { DistributorAccount } from '@/lib/types';

type UserRole = 'admin' | 'user' | 'distributor' | 'installer';

interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
  onUserAdded?: () => void;
}

export function AddUserDialog({ open, onClose, onUserAdded }: AddUserDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [isLoading, setIsLoading] = useState(false);
  const [open_, setOpen] = useState(open);
  const [distributors, setDistributors] = useState<DistributorAccount[]>([]);
  const [createNewDistributor, setCreateNewDistributor] = useState(false);
  const [newDistributorName, setNewDistributorName] = useState('');
  const [selectedDistributorId, setSelectedDistributorId] = useState('');
  const [isLoadingDistributors, setIsLoadingDistributors] = useState(false);

  // Mettre à jour l'état open lorsque open change
  useEffect(() => {
    setOpen(open);
  }, [open]);

  // Récupérer la liste des distributeurs existants
  useEffect(() => {
    if (role === 'distributor') {
      fetchDistributors();
    }
  }, [role]);

  // Fonction pour récupérer les distributeurs
  const fetchDistributors = async () => {
    setIsLoadingDistributors(true);
    try {
      const distributorsQuery = query(collection(db, 'distributors'));
      const querySnapshot = await getDocs(distributorsQuery);

      const distributorsList: DistributorAccount[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        distributorsList.push({
          id: doc.id,
          name: data.name || data.companyName || 'Sans nom',
          companyName: data.companyName,
          address: data.address || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          logo: data.logo || '',
          logoUrl: data.logoUrl || '',
          active: data.active || true,
          createdAt: data.createdAt,
          teamMembers: data.teamMembers || [],
          adminMembers: data.adminMembers || [],
          teamMemberCount: data.teamMemberCount || 0
        });
      });

      setDistributors(distributorsList);
    } catch (error) {
      console.error('Erreur lors de la récupération des distributeurs:', error);
      toast.error('Impossible de charger la liste des distributeurs');
    } finally {
      setIsLoadingDistributors(false);
    }
  };

  const handleAddUser = async () => {
    if (!email || !password || !displayName) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Vérifier les champs spécifiques au rôle distributeur
    if (role === 'distributor') {
      if (createNewDistributor && !newDistributorName) {
        toast.error('Veuillez saisir le nom de l\'entreprise distributrice');
        return;
      }
      if (!createNewDistributor && !selectedDistributorId) {
        toast.error('Veuillez sélectionner une entreprise distributrice existante');
        return;
      }
    }

    setIsLoading(true);

    try {
      // Obtenir le token d'authentification de l'utilisateur actuel
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('Vous devez être connecté pour effectuer cette action');
      }
      
      const idToken = await currentUser.getIdToken();

      // Utiliser l'API pour créer l'utilisateur au lieu de Firebase directement
      // Cela évitera la déconnexion de l'administrateur actuel
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          email,
          password,
          displayName,
          role,
          distributorId: role === 'distributor' ? 
            (createNewDistributor ? null : selectedDistributorId) : 
            undefined,
          newDistributorName: createNewDistributor ? newDistributorName : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création de l\'utilisateur');
      }

      // Récupérer les données de réponse mais pas besoin de les utiliser
      await response.json();
      
      toast.success(`Utilisateur ${displayName} créé avec succès`);
      
      // Réinitialiser le formulaire
      setEmail('');
      setPassword('');
      setDisplayName('');
      setRole('user');
      setNewDistributorName('');
      setSelectedDistributorId('');
      setCreateNewDistributor(false);
      setOpen(false);
      
      // Appeler le callback si fourni
      if (onUserAdded) {
        onUserAdded();
      }
      
      // Fermer la boite de dialogue
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      
      // Gérer les erreurs spécifiques
      let errorMessage = 'Une erreur est survenue lors de la création de l\'utilisateur';
      
      if (error instanceof Error) {
        if (error.message.includes('auth/email-already-in-use')) {
          errorMessage = `L'adresse email ${email} est déjà utilisée par un autre compte.`;
        } else if (error.message.includes('auth/invalid-email')) {
          errorMessage = `L'adresse email ${email} n'est pas valide.`;
        } else if (error.message.includes('auth/weak-password')) {
          errorMessage = 'Le mot de passe est trop faible. Il doit contenir au moins 6 caractères.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open_} onOpenChange={(open) => {
      setOpen(open);
      if (!open && onClose) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Créez un compte pour un nouvel utilisateur qui pourra accéder aux documents.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nom
            </Label>
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="col-span-3"
              placeholder="John Doe"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              placeholder="john.doe@example.com"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right whitespace-nowrap">
              Mot de passe
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="col-span-3"
              placeholder="••••••••"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Rôle
            </Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Utilisateur</SelectItem>
                <SelectItem value="distributor">Distributeur</SelectItem>
                <SelectItem value="installer">Installateur</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Afficher les options de distributeur uniquement si le rôle est "distributeur" */}
          {role === 'distributor' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Options du distributeur
                </Label>
                <div className="col-span-3 space-y-2">
                  <Button 
                    type="button" 
                    variant={createNewDistributor ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setCreateNewDistributor(true)}
                  >
                    Créer une nouvelle entreprise distributrice
                  </Button>
                  <Button 
                    type="button" 
                    variant={!createNewDistributor ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setCreateNewDistributor(false)}
                  >
                    Sélectionner une entreprise existante
                  </Button>
                </div>
              </div>
              
              {createNewDistributor ? (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="companyName" className="text-right whitespace-nowrap">
                    Nom de l&apos;entreprise
                  </Label>
                  <Input
                    id="companyName"
                    value={newDistributorName}
                    onChange={(e) => setNewDistributorName(e.target.value)}
                    className="col-span-3"
                    placeholder="Nom de l'entreprise"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="distributorId" className="text-right whitespace-nowrap">
                    Entreprise
                  </Label>
                  <div className="col-span-3">
                    <Select 
                      value={selectedDistributorId} 
                      onValueChange={setSelectedDistributorId}
                      disabled={isLoadingDistributors}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une entreprise" />
                      </SelectTrigger>
                      <SelectContent>
                        {distributors.map((distributor) => (
                          <SelectItem key={distributor.id} value={distributor.id}>
                            {distributor.companyName || distributor.name}
                          </SelectItem>
                        ))}
                        {distributors.length === 0 && (
                          <div className="px-2 py-1 text-sm text-gray-500">
                            {isLoadingDistributors ? 'Chargement...' : 'Aucune entreprise disponible'}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleAddUser} disabled={isLoading}>
            {isLoading ? 'Création en cours...' : 'Créer l\'utilisateur'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
