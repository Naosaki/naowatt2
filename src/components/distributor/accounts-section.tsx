"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { User } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Trash } from 'lucide-react';
import { toast } from 'sonner';
import { InviteForm } from '@/components/invite-form';
import { PendingInvitations, Invitation } from '@/components/pending-invitations';

export function AccountsSection() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('installers');
  const [managedUsers, setManagedUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // État pour le formulaire d'invitation
  const [showInviteForm, setShowInviteForm] = useState(false);
  
  // État pour la confirmation de suppression
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // État pour les invitations en attente
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);

  // Charger les utilisateurs gérés par ce distributeur
  const fetchManagedUsers = useCallback(async () => {
    if (!user || user.role !== 'distributor') return;
    
    setLoadingUsers(true);
    setError(null);
    
    try {
      // Requête pour trouver tous les utilisateurs créés par ce distributeur
      const usersQuery = query(
        collection(db, 'users'),
        where('distributorId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      const users: User[] = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          uid: doc.id,
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          role: userData.role,
          createdAt: userData.createdAt?.toDate() || new Date(),
          lastLogin: userData.lastLogin?.toDate() || new Date(),
          createdBy: userData.createdBy,
          distributorId: userData.distributorId,
          managedUsers: userData.managedUsers || [],
        });
      });
      
      setManagedUsers(users);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setError('Impossible de charger les utilisateurs. Veuillez réessayer plus tard.');
    } finally {
      setLoadingUsers(false);
    }
  }, [user]);

  // Charger les invitations en attente envoyées par ce distributeur
  const fetchPendingInvitations = useCallback(async () => {
    if (!user || user.role !== 'distributor') return;
    
    setLoadingInvitations(true);
    
    try {
      // Requête pour trouver toutes les invitations envoyées par ce distributeur
      const invitationsQuery = query(
        collection(db, 'invitations'),
        where('inviterId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(invitationsQuery);
      const invitations: Invitation[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        invitations.push({
          id: doc.id,
          email: data.email,
          name: data.name || '',
          role: data.role,
          companyName: data.companyName,
          status: data.status || 'pending',
          createdAt: data.createdAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      });
      
      setPendingInvitations(invitations);
    } catch (error) {
      console.error('Erreur lors du chargement des invitations:', error);
      setError('Impossible de charger les invitations. Veuillez réessayer plus tard.');
    } finally {
      setLoadingInvitations(false);
    }
  }, [user]);

  // Supprimer un utilisateur
  const deleteUser = async (userToDelete: User) => {
    if (!user || user.role !== 'distributor') return;
    
    try {
      // Supprimer l'utilisateur de Firestore
      await deleteDoc(doc(db, 'users', userToDelete.uid));
      
      // Mettre à jour la liste des utilisateurs
      setManagedUsers(prevUsers => prevUsers.filter(u => u.uid !== userToDelete.uid));
      
      toast.success('Utilisateur supprimé avec succès');
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      toast.error('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  // Annuler une invitation
  const cancelInvitation = async (invitation: Invitation) => {
    if (!user || user.role !== 'distributor') return;
    
    try {
      // Supprimer l'invitation de Firestore
      await deleteDoc(doc(db, 'invitations', invitation.id));
      
      // Mettre à jour la liste des invitations
      setPendingInvitations(prevInvitations => 
        prevInvitations.filter(inv => inv.id !== invitation.id)
      );
      
      toast.success('Invitation annulée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'invitation:', error);
      toast.error('Erreur lors de l\'annulation de l\'invitation');
    }
  };

  // Renvoyer une invitation
  const resendInvitation = async (invitation: Invitation) => {
    if (!user || user.role !== 'distributor') return;
    
    try {
      // Mettre à jour la date de l'invitation
      await updateDoc(doc(db, 'invitations', invitation.id), {
        createdAt: new Date()
      });
      
      // Appeler l'API pour renvoyer l'email
      const response = await fetch('/api/auth/resend-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invitationId: invitation.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du renvoi de l\'invitation');
      }
      
      toast.success('Invitation renvoyée avec succès');
      
      // Rafraîchir la liste des invitations
      fetchPendingInvitations();
    } catch (error) {
      console.error('Erreur lors du renvoi de l\'invitation:', error);
      toast.error('Erreur lors du renvoi de l\'invitation');
    }
  };

  // Charger les données au chargement du composant
  useEffect(() => {
    if (user && user.role === 'distributor') {
      fetchManagedUsers();
      fetchPendingInvitations();
    }
  }, [user, fetchManagedUsers, fetchPendingInvitations]);

  if (!user || user.role !== 'distributor') {
    return <div>Accès non autorisé</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Gestion des comptes</h2>
        <Button onClick={() => setShowInviteForm(true)}>Inviter un utilisateur</Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          <p>{error}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="installers">Installateurs</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>

        <TabsContent value="installers">
          {loadingUsers ? (
            <div className="flex justify-center p-4">
              <p>Chargement des installateurs...</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left font-medium">Nom</th>
                    <th className="p-2 text-left font-medium">Email</th>
                    <th className="p-2 text-left font-medium">Date de création</th>
                    <th className="p-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {managedUsers
                    .filter(user => user.role === 'installer')
                    .map(installer => (
                      <tr key={installer.uid} className="border-b">
                        <td className="p-2">{installer.displayName || 'N/A'}</td>
                        <td className="p-2">{installer.email}</td>
                        <td className="p-2">
                          {installer.createdAt instanceof Date
                            ? installer.createdAt.toLocaleDateString()
                            : new Date(installer.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-2">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUserToDelete(installer);
                                setShowDeleteConfirm(true);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {managedUsers.filter(user => user.role === 'installer').length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center">
                        Aucun installateur trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="users">
          {loadingUsers ? (
            <div className="flex justify-center p-4">
              <p>Chargement des utilisateurs...</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left font-medium">Nom</th>
                    <th className="p-2 text-left font-medium">Email</th>
                    <th className="p-2 text-left font-medium">Date de création</th>
                    <th className="p-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {managedUsers
                    .filter(user => user.role === 'user')
                    .map(user => (
                      <tr key={user.uid} className="border-b">
                        <td className="p-2">{user.displayName || 'N/A'}</td>
                        <td className="p-2">{user.email}</td>
                        <td className="p-2">
                          {user.createdAt instanceof Date
                            ? user.createdAt.toLocaleDateString()
                            : new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-2">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUserToDelete(user);
                                setShowDeleteConfirm(true);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {managedUsers.filter(user => user.role === 'user').length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center">
                        Aucun utilisateur trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations">
          {loadingInvitations ? (
            <div className="flex justify-center p-4">
              <p>Chargement des invitations...</p>
            </div>
          ) : (
            <PendingInvitations
              invitations={pendingInvitations}
              loading={loadingInvitations}
              onResendInvitation={resendInvitation}
              onCancelInvitation={cancelInvitation}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation de suppression d'utilisateur */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => userToDelete && deleteUser(userToDelete)}
        title="Supprimer l'utilisateur"
        description={`Êtes-vous sûr de vouloir supprimer ${userToDelete?.displayName || userToDelete?.email || 'cet utilisateur'} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />

      {/* Formulaire d'invitation */}
      {showInviteForm && (
        <InviteForm
          onClose={() => setShowInviteForm(false)}
          inviterId={user?.uid || ''}
          onSuccess={() => {
            setShowInviteForm(false);
            fetchPendingInvitations();
          }}
        />
      )}
    </div>
  );
}
