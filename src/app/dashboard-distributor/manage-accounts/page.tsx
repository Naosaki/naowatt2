"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLogo } from '@/components/app-logo';
import { UserProfileMenu } from '@/components/user-profile-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { User } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { AlertCircle, Check, Edit, Trash, UserPlus, Users, FileText, LayoutDashboard, Store } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import Link from 'next/link';

export default function ManageAccountsPage() {
  const { user, loading, signUp } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('installers');
  const [managedUsers, setManagedUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // État pour le formulaire de création de compte
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'installer' | 'user'>('installer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // État pour la confirmation de suppression
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // Créer un nouveau compte
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'distributor') return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await signUp(newUserEmail, newUserPassword, newUserName, newUserRole, user.uid);
      
      toast({
        title: "Compte créé avec succès",
        description: `Le compte ${newUserRole === 'installer' ? 'installateur' : 'utilisateur'} a été créé.`,
        variant: "default",
      });
      
      // Réinitialiser le formulaire
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserName('');
      setShowCreateForm(false);
      
      // Recharger la liste des utilisateurs
      fetchManagedUsers();
    } catch (error: unknown) {
      console.error('Erreur lors de la création du compte:', error);
      const errorMessage = error instanceof Error ? error.message : 'Impossible de créer le compte. Veuillez réessayer plus tard.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      
      toast({
        title: "Compte supprimé",
        description: `Le compte de ${userToDelete.displayName || userToDelete.email} a été supprimé.`,
        variant: "default",
      });
      
      // Recharger la liste des utilisateurs
      fetchManagedUsers();
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le compte. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
    } finally {
      setUserToDelete(null);
      setShowDeleteConfirm(false);
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
      }
    }
  }, [user, loading, router, fetchManagedUsers]);

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

      <div className="flex flex-1">
        {/* Sidebar - Menu identique à celui du tableau de bord distributeur */}
        <aside className="w-64 border-r bg-muted/20 p-4">
          <nav className="space-y-2">
            <Link href="/dashboard-distributor" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Tableau de bord
            </Link>
            <Link href="#" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <Store className="mr-2 h-4 w-4" />
              Mes produits
            </Link>
            <Link href="#" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
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
            <Button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center">
              <UserPlus className="mr-2 h-4 w-4" />
              {showCreateForm ? 'Annuler' : 'Créer un nouveau compte'}
            </Button>
          </div>

          {showCreateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Créer un nouveau compte</CardTitle>
                <CardDescription>Ajoutez un nouveau compte installateur ou utilisateur</CardDescription>
              </CardHeader>
              <form onSubmit={handleCreateAccount}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Type de compte</Label>
                    <Select 
                      value={newUserRole} 
                      onValueChange={(value: 'installer' | 'user') => setNewUserRole(value)}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Sélectionner un type de compte" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="installer">Installateur</SelectItem>
                        <SelectItem value="user">Utilisateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input 
                      id="name" 
                      value={newUserName} 
                      onChange={(e) => setNewUserName(e.target.value)} 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={newUserEmail} 
                      onChange={(e) => setNewUserEmail(e.target.value)} 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={newUserPassword} 
                      onChange={(e) => setNewUserPassword(e.target.value)} 
                      required 
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">Le mot de passe doit contenir au moins 6 caractères</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSubmitting} className="flex items-center">
                    {isSubmitting ? (
                      <>
                        <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Créer le compte
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="installers">Installateurs</TabsTrigger>
              <TabsTrigger value="users">Utilisateurs</TabsTrigger>
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
                        <p className="text-sm text-muted-foreground">Créez votre premier installateur en cliquant sur "Créer un nouveau compte"</p>
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
                                        toast({
                                          title: "Fonctionnalité à venir",
                                          description: "L'édition des comptes sera disponible prochainement.",
                                          variant: "default",
                                        });
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
                                      <Trash className="h-4 w-4 text-destructive" />
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
                        <p className="text-sm text-muted-foreground">Créez votre premier utilisateur en cliquant sur "Créer un nouveau compte"</p>
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
                                        toast({
                                          title: "Fonctionnalité à venir",
                                          description: "L'édition des comptes sera disponible prochainement.",
                                          variant: "default",
                                        });
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
                                      <Trash className="h-4 w-4 text-destructive" />
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
          </Tabs>
        </main>
      </div>

      <footer className="border-t p-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} DataWatt - Solar Panel Documentation Portal</p>
      </footer>
    </div>
  );
}
