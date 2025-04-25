"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { User } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Trash, UserPlus, Shield, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { InviteForm } from '@/components/invite-form';
import { PendingInvitations, Invitation } from '@/components/pending-invitations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function TeamManagement() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('members');
  
  // État pour le formulaire d'invitation
  const [showInviteForm, setShowInviteForm] = useState(false);
  
  // État pour la confirmation de suppression
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // État pour les invitations en attente
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);

  // Charger les membres de l'équipe distributeur
  const fetchTeamMembers = useCallback(async () => {
    if (!user || user.role !== 'distributor') return;
    
    setLoadingUsers(true);
    setError(null);
    
    try {
      // Requête pour trouver tous les utilisateurs distributeurs associés à la même entreprise
      const usersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'distributor'),
        where('distributorId', '==', user.distributorId || user.id)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      const users: User[] = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        // Ne pas inclure l'utilisateur actuel dans la liste
        if (doc.id !== user.id) {
          users.push({
            id: doc.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            active: userData.active || true,
            createdAt: userData.createdAt?.toDate() || new Date(),
            lastLogin: userData.lastLogin?.toDate() || new Date(),
            createdBy: userData.createdBy,
            distributorId: userData.distributorId,
            managedUsers: userData.managedUsers || [],
            isDistributorAdmin: userData.isDistributorAdmin || false,
          });
        }
      });
      
      setTeamMembers(users);
    } catch (error) {
      console.error('Erreur lors du chargement des membres de l\'équipe:', error);
      setError('Impossible de charger les membres de l\'équipe. Veuillez réessayer plus tard.');
    } finally {
      setLoadingUsers(false);
    }
  }, [user]);

  // Charger les invitations en attente envoyées par ce distributeur
  const fetchPendingInvitations = useCallback(async () => {
    if (!user || user.role !== 'distributor') return;
    
    setLoadingInvitations(true);
    
    try {
      // Requête pour trouver toutes les invitations envoyées par ce distributeur pour des rôles distributeur
      const invitationsQuery = query(
        collection(db, 'invitations'),
        where('inviterId', '==', user.id),
        where('role', '==', 'distributor')
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
          expiresAt: data.expiresAt?.toDate(),
          inviterId: data.inviterId,
          inviterName: data.inviterName,
          token: data.token,
        });
      });
      
      setPendingInvitations(invitations);
    } catch (error) {
      console.error('Erreur lors du chargement des invitations:', error);
    } finally {
      setLoadingInvitations(false);
    }
  }, [user]);

  // Charger les données au montage du composant
  useEffect(() => {
    fetchTeamMembers();
    fetchPendingInvitations();
  }, [fetchTeamMembers, fetchPendingInvitations]);

  // Fonction pour supprimer un membre de l'équipe
  const handleDeleteUser = (userToDelete: User) => {
    setUserToDelete(userToDelete);
    setShowDeleteConfirm(true);
  };

  // Confirmer la suppression d'un membre de l'équipe
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      // Supprimer l'utilisateur de Firestore
      await deleteDoc(doc(db, 'users', userToDelete.id));
      
      // Mettre à jour la liste des membres de l'équipe
      setTeamMembers(teamMembers.filter(u => u.id !== userToDelete.id));
      
      toast.success(`Le collaborateur ${userToDelete.name || userToDelete.email} a été supprimé avec succès.`);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Erreur lors de la suppression du collaborateur:', error);
      toast.error('Impossible de supprimer le collaborateur. Veuillez réessayer plus tard.');
    }
  };

  // Fonction pour modifier les droits d'administration d'un membre de l'équipe
  const toggleAdminRights = async (teamMember: User) => {
    try {
      const newAdminStatus = !teamMember.isDistributorAdmin;
      
      // Mettre à jour les droits d'administration dans Firestore
      await updateDoc(doc(db, 'users', teamMember.id), {
        isDistributorAdmin: newAdminStatus
      });
      
      // Mettre à jour la liste des membres de l'équipe
      setTeamMembers(teamMembers.map(u => {
        if (u.id === teamMember.id) {
          return { ...u, isDistributorAdmin: newAdminStatus };
        }
        return u;
      }));
      
      toast.success(`Les droits d'administration ont été ${newAdminStatus ? 'accordés' : 'retirés'} à ${teamMember.name || teamMember.email}.`);
    } catch (error) {
      console.error('Erreur lors de la modification des droits d\'administration:', error);
      toast.error('Impossible de modifier les droits d\'administration. Veuillez réessayer plus tard.');
    }
  };

  // Vérifier si l'utilisateur actuel est administrateur
  // Pour la phase initiale, tous les distributeurs sont considérés comme administrateurs
  // jusqu'à ce que la structure d'équipe soit pleinement implantée
  const isCurrentUserAdmin = true; // Tous les distributeurs peuvent ajouter des collaborateurs

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestion de l'équipe</h2>
        {isCurrentUserAdmin && (
          <Button onClick={() => setShowInviteForm(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Inviter un collaborateur
          </Button>
        )}
      </div>
      
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <p>{error}</p>
        </div>
      )}
      
      <Tabs defaultValue="members" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex space-x-4">
          <TabsTrigger value="members" className="rounded-t-lg px-4 py-2 text-sm font-medium">Membres de l'équipe</TabsTrigger>
          <TabsTrigger value="invitations" className="rounded-t-lg px-4 py-2 text-sm font-medium">Invitations en attente</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className="mt-4">
          <div className="rounded-lg border">
            <div className="border-b bg-muted/50 px-4 py-3">
              <h3 className="font-medium">Membres de l'équipe</h3>
            </div>
            
            {loadingUsers ? (
              <div className="flex h-40 items-center justify-center">
                <p>Chargement des membres de l'équipe...</p>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="flex h-40 items-center justify-center">
                <p className="text-muted-foreground">Aucun membre dans l'équipe</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {teamMembers.map((teamMember) => (
                  <div key={teamMember.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium">{teamMember.name || teamMember.email}</h3>
                        {teamMember.isDistributorAdmin && (
                          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{teamMember.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isCurrentUserAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAdminRights(teamMember)}
                          >
                            {teamMember.isDistributorAdmin ? (
                              <>
                                <ShieldOff className="mr-2 h-4 w-4" />
                                Retirer admin
                              </>
                            ) : (
                              <>
                                <Shield className="mr-2 h-4 w-4" />
                                Rendre admin
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(teamMember)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Supprimer
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="invitations" className="mt-4">
          <PendingInvitations
            invitations={pendingInvitations.filter(inv => inv.role === 'distributor')}
            loading={loadingInvitations}
            onRefresh={fetchPendingInvitations}
            onDelete={() => fetchPendingInvitations()}
          />
        </TabsContent>
      </Tabs>
      
      {/* Formulaire d'invitation */}
      {showInviteForm && (
        <InviteForm
          onClose={() => setShowInviteForm(false)}
          inviterId={user?.id || ''}
          isDistributor={true}
          inviteMode="team"
          onSuccess={() => {
            setShowInviteForm(false);
            fetchPendingInvitations();
          }}
        />
      )}
      
      {/* Dialogue de confirmation de suppression */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteUser}
        title="Supprimer le collaborateur"
        description={`Êtes-vous sûr de vouloir supprimer ${userToDelete?.name || userToDelete?.email} de votre équipe ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
    </div>
  );
}
