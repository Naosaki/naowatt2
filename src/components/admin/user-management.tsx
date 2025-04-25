"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, FileEdit, Trash2, Search, Plus } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AddUserDialog } from '@/components/admin/add-user-dialog';
import { EditUserDialog } from '@/components/admin/edit-user-dialog';
import { ViewUserDialog } from '@/components/admin/view-user-dialog';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [userToView, setUserToView] = useState(null);
  const [showViewUserDialog, setShowViewUserDialog] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false);

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
      const usersQuery = query(collection(db, 'users'));
      const querySnapshot = await getDocs(usersQuery);
      
      const usersList = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        usersList.push({
          uid: doc.id,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          createdAt: userData.createdAt,
          lastLogin: userData.lastLogin,
          distributorId: userData.distributorId,
          isDistributorAdmin: userData.isDistributorAdmin,
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

  const handleViewUser = (user) => {
    setUserToView(user);
    setShowViewUserDialog(true);
  };

  const handleEditUser = (user) => {
    setUserToEdit(user);
    setShowEditUserDialog(true);
  };

  const handleUserEdited = () => {
    setShowEditUserDialog(false);
    fetchUsers();
  };

  const handleDeleteUser = (userId) => {
    setUserToDelete(userId);
    setShowDeleteUserConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
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
          body: JSON.stringify({ userId: userToDelete }),
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
                            {user.isDistributorAdmin ? 'Admin' : 'Membre'}
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
                            <FileEdit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteUser(user.uid)}
                          >
                            <Trash2 className="h-4 w-4" />
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
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onUserAdded={handleUserAdded}
      />

      {userToView && (
        <ViewUserDialog
          isOpen={showViewUserDialog}
          onClose={() => setShowViewUserDialog(false)}
          user={userToView}
        />
      )}

      {userToEdit && (
        <EditUserDialog
          isOpen={showEditUserDialog}
          onClose={() => setShowEditUserDialog(false)}
          user={userToEdit}
          onUserEdited={handleUserEdited}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteUserConfirm}
        onClose={() => setShowDeleteUserConfirm(false)}
        onConfirm={confirmDeleteUser}
        title="Supprimer l'utilisateur"
        description="Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible."
      />
    </div>
  );
}
