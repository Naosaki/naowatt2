"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLogo } from '@/components/app-logo';
import { UserProfileMenu } from '@/components/user-profile-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { User } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { AlertCircle, Edit, Trash, Users, FileText, LayoutDashboard, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { InviteForm } from '@/components/invite-form';
import { PendingInvitations, Invitation } from '@/components/pending-invitations';
import { Toaster } from 'sonner';

export default function ManageAccountsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
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
          name: data.name,
          role: data.role,
          companyName: data.companyName,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate() || new Date(),
        });
      });
      
      setPendingInvitations(invitations);
    } catch (error) {
      console.error('Erreur lors du chargement des invitations:', error);
      // Ne pas afficher d'erreur pour ne pas surcharger l'interface
    } finally {
      setLoadingInvitations(false);
    }
  }, [user]);

  // Supprimer un compte
  const handleDeleteAccount = async () => {
    if (!userToDelete || !user) return;
    
    try {
      // Appeler l'API pour supprimer l'utilisateur à la fois de Firebase Authentication et de Firestore
      const response = await fetch('/api/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userToDelete.uid,
          adminUserId: user.uid,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression du compte');
      }
      
      // Mettre à jour la liste des utilisateurs gérés par le distributeur
      if (user && user.managedUsers && user.managedUsers.includes(userToDelete.uid)) {
        await updateDoc(doc(db, 'users', user.uid), {
          managedUsers: user.managedUsers.filter(id => id !== userToDelete.uid)
        });
      }
      
      toast.success(`Le compte de ${userToDelete.displayName || userToDelete.email} a été supprimé.`);
      
      // Recharger la liste des utilisateurs
      fetchManagedUsers();
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      toast.error(error instanceof Error ? error.message : "Impossible de supprimer le compte. Veuillez réessayer plus tard.");
    } finally {
      setUserToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  // Fonction pour renvoyer une invitation
  const handleResendInvitation = async (invitation: Invitation) => {
    if (!user) return;
    
    try {
      // Appeler l'API pour renvoyer l'invitation
      const response = await fetch('/api/auth/invite-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: invitation.email,
          name: invitation.name,
          role: invitation.role,
          companyName: invitation.companyName,
          inviterId: user.uid,
          resend: true,
          invitationId: invitation.id
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du renvoi de l\'invitation');
      }
      
      toast.success(`L'invitation a été renvoyée à ${invitation.email}.`);
      
      // Recharger les invitations
      fetchPendingInvitations();
    } catch (error) {
      console.error('Erreur lors du renvoi de l\'invitation:', error);
      toast.error(error instanceof Error ? error.message : 'Impossible de renvoyer l\'invitation. Veuillez réessayer plus tard.');
    }
  };

  // Fonction pour annuler une invitation
  const handleCancelInvitation = async (invitation: Invitation) => {
    if (!user) return;
    
    try {
      // Supprimer l'invitation de Firestore
      await deleteDoc(doc(db, 'invitations', invitation.id));
      
      toast.success(`L'invitation à ${invitation.email} a été annulée.`);
      
      // Recharger les invitations
      fetchPendingInvitations();
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'invitation:', error);
      toast.error(error instanceof Error ? error.message : 'Impossible d\'annuler l\'invitation. Veuillez réessayer plus tard.');
    }
  };

  // Vérifier l'authentification et charger les données
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      if (user.role !== 'distributor') {
        router.push('/dashboard'); // Rediriger vers le tableau de bord principal
      } else {
        fetchManagedUsers();
        fetchPendingInvitations();
      }
    }
  }, [user, loading, router, fetchManagedUsers, fetchPendingInvitations]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Confirmer la suppression"
        description={`Êtes-vous sûr de vouloir supprimer le compte de ${userToDelete?.displayName || userToDelete?.email}? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
      />
      
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center">
            <AppLogo height={40} />
          </div>
          <div className="flex items-center gap-4">
            <UserProfileMenu user={user} />
          </div>
        </div>
      </header>

      {/* Toaster pour les notifications */}
      <Toaster position="top-right" richColors />

      <div className="flex flex-1">
        {/* Sidebar - Menu identique à celui du tableau de bord distributeur */}
        <aside className="w-64 border-r bg-muted/20 p-4">
          <nav className="space-y-2">
            <Link href="/dashboard-distributor" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Tableau de bord
            </Link>
            <Link href="/dashboard-distributor/documents-techniques" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <FileText className="mr-2 h-4 w-4" />
              Documents techniques
            </Link>
            <Link href="/dashboard-distributor/manage-accounts" className="flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
              <Users className="mr-2 h-4 w-4" />
              Gestion des comptes
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Gestion des comptes</h1>
            <p className="text-muted-foreground">Gérez les comptes installateurs et utilisateurs associés à votre entreprise</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
              <div className="flex items-center">
                <AlertCircle className="mr-2 h-4 w-4" />
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <Button onClick={() => setShowInviteForm(!showInviteForm)} className="flex items-center">
              <Mail className="mr-2 h-4 w-4" />
              {showInviteForm ? 'Annuler' : 'Envoyer une invitation'}
            </Button>
          </div>

          {showInviteForm && (
            <div className="mb-6">
              <InviteForm 
                onClose={() => setShowInviteForm(false)} 
                inviterId={user.uid}
                onSuccess={fetchManagedUsers}
              />
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="installers">Installateurs</TabsTrigger>
              <TabsTrigger value="users">Utilisateurs</TabsTrigger>
              <TabsTrigger value="invitations">Invitations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="installers">
              <Card>
                <CardHeader>
                  <CardTitle>Installateurs</CardTitle>
                  <CardDescription>Liste des installateurs associés à votre entreprise</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingUsers ? (
                    <div className="flex h-40 items-center justify-center">
                      <p>Chargement des installateurs...</p>
                    </div>
                  ) : managedUsers.filter(u => u.role === 'installer').length === 0 ? (
                    <div className="flex h-40 items-center justify-center rounded-lg border">
                      <div className="text-center">
                        <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">Aucun installateur trouvé</p>
                        <p className="text-sm text-muted-foreground">Créez votre premier installateur en cliquant sur "Envoyer une invitation"</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-4 py-2 text-left font-medium">Nom</th>
                            <th className="px-4 py-2 text-left font-medium">Email</th>
                            <th className="px-4 py-2 text-left font-medium">Date de création</th>
                            <th className="px-4 py-2 text-left font-medium">Dernière connexion</th>
                            <th className="px-4 py-2 text-center font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {managedUsers
                            .filter(u => u.role === 'installer')
                            .map((installer) => (
                              <tr key={installer.uid} className="border-b">
                                <td className="px-4 py-2">{installer.displayName}</td>
                                <td className="px-4 py-2">{installer.email}</td>
                                <td className="px-4 py-2">{installer.createdAt.toLocaleDateString()}</td>
                                <td className="px-4 py-2">{installer.lastLogin.toLocaleDateString()}</td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center justify-center space-x-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => {
                                        // Implémenter l'édition plus tard
                                        toast.info("L'édition des comptes sera disponible prochainement.");
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
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
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Utilisateurs</CardTitle>
                  <CardDescription>Liste des utilisateurs associés à votre entreprise</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingUsers ? (
                    <div className="flex h-40 items-center justify-center">
                      <p>Chargement des utilisateurs...</p>
                    </div>
                  ) : managedUsers.filter(u => u.role === 'user').length === 0 ? (
                    <div className="flex h-40 items-center justify-center rounded-lg border">
                      <div className="text-center">
                        <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">Aucun utilisateur trouvé</p>
                        <p className="text-sm text-muted-foreground">Créez votre premier utilisateur en cliquant sur "Envoyer une invitation"</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-4 py-2 text-left font-medium">Nom</th>
                            <th className="px-4 py-2 text-left font-medium">Email</th>
                            <th className="px-4 py-2 text-left font-medium">Date de création</th>
                            <th className="px-4 py-2 text-left font-medium">Dernière connexion</th>
                            <th className="px-4 py-2 text-center font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {managedUsers
                            .filter(u => u.role === 'user')
                            .map((user) => (
                              <tr key={user.uid} className="border-b">
                                <td className="px-4 py-2">{user.displayName}</td>
                                <td className="px-4 py-2">{user.email}</td>
                                <td className="px-4 py-2">{user.createdAt.toLocaleDateString()}</td>
                                <td className="px-4 py-2">{user.lastLogin.toLocaleDateString()}</td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center justify-center space-x-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => {
                                        // Implémenter l'édition plus tard
                                        toast.info("L'édition des comptes sera disponible prochainement.");
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
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
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="invitations">
              <div className="mb-4 flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchPendingInvitations}
                  className="flex items-center"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Actualiser
                </Button>
              </div>
              <PendingInvitations 
                invitations={pendingInvitations}
                loading={loadingInvitations}
                onResendInvitation={handleResendInvitation}
                onCancelInvitation={handleCancelInvitation}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
