"use client";

import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Eye, Edit, Trash } from 'lucide-react';
import { AddUserDialog } from '@/components/admin/add-user-dialog';
import { EditUserDialog } from '@/components/admin/edit-user-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ViewUserDialog } from '@/components/admin/view-user-dialog';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Type pour les utilisateurs avec les propriétés nécessaires
interface UserWithDistributor {
  uid: string;
  email: string;
  displayName?: string;
  name?: string;
  role: 'admin' | 'user' | 'distributor' | 'installer';
  createdAt?: Date | unknown;
  lastLogin?: Date | unknown;
  distributorId?: string;
  isDistributorAdmin?: boolean;
  distributorName?: string | undefined;
  [key: string]: any; // Pour les autres propriétés dynamiques
}

// Type pour les distributeurs
interface DistributorInfo {
  id: string;
  name: string;
  companyName?: string;
  logo?: string;
  logoUrl?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithDistributor[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithDistributor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [userToView, setUserToView] = useState<UserWithDistributor | null>(null);
  const [showViewUserDialog, setShowViewUserDialog] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserWithDistributor | null>(null);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Récupérer tous les utilisateurs
      const usersQuery = query(collection(db, 'users'));
      const querySnapshot = await getDocs(usersQuery);
      
      // Récupérer tous les distributeurs pour avoir accès à leurs noms
      const distributorsQuery = query(collection(db, 'distributors'));
      const distributorsSnapshot = await getDocs(distributorsQuery);
      
      // Créer un map des distributeurs pour un accès rapide par ID
      const distributorsMap: { [key: string]: DistributorInfo } = {};
      distributorsSnapshot.forEach((doc) => {
        const data = doc.data();
        distributorsMap[doc.id] = {
          id: doc.id,
          name: data.companyName || data.name || 'Sans nom',
          companyName: data.companyName,
          logo: data.logo,
          logoUrl: data.logoUrl
        };
      });
      
      const usersList: UserWithDistributor[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        // Ajouter les informations du distributeur si l'utilisateur est associé à un distributeur
        const distributorInfo = userData.distributorId ? distributorsMap[userData.distributorId] : undefined;
        
        usersList.push({
          uid: doc.id,
          email: userData.email,
          displayName: userData.name || userData.displayName || 'N/A',
          role: userData.role,
          createdAt: userData.createdAt,
          lastLogin: userData.lastLogin,
          distributorId: userData.distributorId,
          isDistributorAdmin: userData.isDistributorAdmin,
          distributorName: distributorInfo ? distributorInfo.name : undefined,
          ...userData
        });
      });
      
      setUsers(usersList);
      setFilteredUsers(usersList);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAdded = () => {
    setShowAddDialog(false);
    fetchUsers();
  };

  const handleViewUser = (user: UserWithDistributor) => {
    setUserToView(user);
    setShowViewUserDialog(true);
  };

  const handleEditUser = (user: UserWithDistributor) => {
    setUserToEdit(user);
    setShowEditUserDialog(true);
  };

  const handleUserEdited = () => {
    setShowEditUserDialog(false);
    fetchUsers();
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteUserConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || !currentUser?.id) return;
    
    try {
      const userToDeleteObj = users.find(u => u.uid === userToDelete);
      
      if (!userToDeleteObj) {
        console.error('Utilisateur introuvable');
        return;
      }
      
      console.log('Suppression de l\'utilisateur en cours...');
      
      try {
        const response = await fetch('/api/delete-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userId: userToDelete,
            adminUserId: currentUser.id 
          }),
        });
        
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Erreur HTTP: ${response.status} - ${text}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error || 'Erreur lors de la suppression de l\'utilisateur');
        }
        
        console.log(`L'utilisateur ${userToDeleteObj.displayName || userToDeleteObj.email} a été supprimé avec succès`);
        fetchUsers(); // Recharger la liste des utilisateurs
      } catch (apiError) {
        console.error('Erreur API lors de la suppression de l\'utilisateur:', apiError);
        if (apiError.message) {
          console.error(apiError.message);
        } else {
          console.error('Erreur lors de la suppression de l\'utilisateur');
        }
      }
    } catch (error) {
      console.error('Erreur inattendue lors de la suppression de l\'utilisateur:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'utilisateur';
      console.error(errorMessage);
    } finally {
      setShowDeleteUserConfirm(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Gestion des utilisateurs</CardTitle>
          <Button onClick={() => setShowAddDialog(true)} size="sm" className="ml-auto">
            <Plus className="mr-2 h-4 w-4" /> Ajouter un utilisateur
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Distributeur</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell>{user.displayName || 'N/A'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role || 'user'}</TableCell>
                      <TableCell>
                        {user.distributorId ? (
                          <span className="flex items-center">
                            {user.distributorName || 'Sans nom'}
                            {user.isDistributorAdmin && (
                              <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-sm text-xs">
                                Admin
                              </span>
                            )}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleViewUser(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteUser(user.uid)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddUserDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onUserAdded={handleUserAdded}
      />

      {userToView && (
        <ViewUserDialog
          open={showViewUserDialog}
          onClose={() => setShowViewUserDialog(false)}
          user={userToView}
        />
      )}

      {userToEdit && (
        <EditUserDialog
          open={showEditUserDialog}
          onClose={() => setShowEditUserDialog(false)}
          user={userToEdit}
          onUserUpdated={handleUserEdited}
        />
      )}

      <AlertDialog
        open={showDeleteUserConfirm}
        onOpenChange={(open) => setShowDeleteUserConfirm(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;utilisateur</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" size="sm" onClick={confirmDeleteUser}>
                Supprimer
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
