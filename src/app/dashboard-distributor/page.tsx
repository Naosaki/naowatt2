"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AppLogo } from '@/components/app-logo';
import { UserProfileMenu } from '@/components/user-profile-menu';
import { FileText, LayoutDashboard, Store, BarChart, Users, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';

export default function DistributorDashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  const [installerCount, setInstallerCount] = useState(0);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour vérifier si un tableau contient une valeur, peu importe son index
  const arrayContainsValue = useCallback((array: string[], value: string) => {
    return array && Array.isArray(array) && array.includes(value);
  }, []);

  // Fonction pour récupérer les données du tableau de bord
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    
    setLoadingData(true);
    setError(null);
    
    try {
      // Récupérer le nombre de produits
      const productsQuery = query(
        collection(db, 'productTypes')
      );
      const productsSnapshot = await getDocs(productsQuery);
      let productCounter = 0;
      
      productsSnapshot.forEach((doc) => {
        const productData = doc.data();
        if (arrayContainsValue(productData.accessRoles, 'distributor')) {
          productCounter++;
        }
      });
      
      setProductCount(productCounter);
      
      // Récupérer le nombre de documents
      const documentsQuery = query(
        collection(db, 'documents')
      );
      const documentsSnapshot = await getDocs(documentsQuery);
      let documentCounter = 0;
      
      documentsSnapshot.forEach((doc) => {
        const documentData = doc.data();
        if (arrayContainsValue(documentData.accessRoles, 'distributor')) {
          documentCounter++;
        }
      });
      
      setDocumentCount(documentCounter);
      
      // Récupérer le nombre d'installateurs (simulation)
      // Dans une vraie application, cela pourrait être une collection d'installateurs
      setInstallerCount(8); // Valeur fixe pour l'exemple
      
    } catch (error) {
      console.error('Erreur lors de la récupération des données du tableau de bord:', error);
      setError('Impossible de récupérer les données. Veuillez réessayer plus tard.');
    } finally {
      setLoadingData(false);
    }
  }, [user, arrayContainsValue]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Vérifier si l'utilisateur est un distributeur
      if (user.role !== 'distributor') {
        router.push('/dashboard'); // Rediriger vers le tableau de bord principal
      } else {
        // Charger les données du tableau de bord
        fetchDashboardData();
      }
    }
  }, [user, loading, router, fetchDashboardData]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={handleSignOut}
        title="Confirmer la déconnexion"
        description="Êtes-vous sûr de vouloir vous déconnecter ?"
        confirmText="Déconnexion"
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
        {/* Sidebar */}
        <aside className="w-64 border-r bg-muted/20 p-4">
          <nav className="space-y-2">
            <Link href="/dashboard-distributor" className="flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Tableau de bord
            </Link>
            <Link href="#" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <FileText className="mr-2 h-4 w-4" />
              Documents techniques
            </Link>
            <Link href="/dashboard-distributor/manage-accounts" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <Users className="mr-2 h-4 w-4" />
              Gestion des comptes
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Tableau de bord distributeur</h1>
            <p className="text-muted-foreground">Gérez vos produits, documents et installateurs</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
              <p>{error}</p>
            </div>
          )}

          {loadingData ? (
            <div className="flex h-40 items-center justify-center rounded-lg border">
              <p>Chargement des données...</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Produits</CardTitle>
                  <CardDescription>Catalogue de produits disponibles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{productCount}</p>
                      <p className="text-sm text-muted-foreground">Accédez à tous les produits disponibles</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Store className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline">
                    Voir les produits
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Documentation technique</CardTitle>
                  <CardDescription>Fiches techniques et manuels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{documentCount}</p>
                      <p className="text-sm text-muted-foreground">Accédez aux fiches techniques et certifications</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline">
                    Consulter les documents
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statistiques</CardTitle>
                  <CardDescription>Suivi des performances</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">Performances</p>
                      <p className="text-sm text-muted-foreground">Analysez les performances de vos produits</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <BarChart className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline">
                    Voir les statistiques
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Installateurs</CardTitle>
                  <CardDescription>Partenaires installateurs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{installerCount}</p>
                      <p className="text-sm text-muted-foreground">Gérez vos installateurs partenaires</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline" onClick={() => router.push('/dashboard-distributor/manage-accounts')}>
                    Gérer les installateurs
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Gestion des comptes</CardTitle>
                  <CardDescription>Utilisateurs et installateurs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">Administration</p>
                      <p className="text-sm text-muted-foreground">Gérez tous vos comptes associés</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <UserPlus className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline" onClick={() => router.push('/dashboard-distributor/manage-accounts')}>
                    Gérer les comptes
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </main>
      </div>

      <footer className="border-t p-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} DataWatt - Solar Panel Documentation Portal</p>
      </footer>
    </div>
  );
}
