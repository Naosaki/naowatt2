"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLogo } from '@/components/app-logo';
import { UserProfileMenu } from '@/components/user-profile-menu';
import { FileText, LayoutDashboard, Store, Users, UserPlus } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { DocumentsSection } from '@/components/distributor/documents-section';
import { AccountsSection } from '@/components/distributor/accounts-section';
import { TeamManagement } from '@/components/distributor/team-management';
import { Toaster } from 'sonner';

export default function DistributorDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [productCount, setProductCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  const [installerCount, setInstallerCount] = useState(0);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Récupérer les données du tableau de bord
  const fetchDashboardData = useCallback(async () => {
    if (!user || user.role !== 'distributor') return;

    setLoadingData(true);
    setError(null);

    try {
      // Récupérer le nombre de produits
      const productsQuery = query(collection(db, 'productTypes'));
      const productsSnapshot = await getDocs(productsQuery);
      setProductCount(productsSnapshot.size);

      // Récupérer le nombre de documents
      const documentsQuery = query(collection(db, 'documents'));
      const documentsSnapshot = await getDocs(documentsQuery);
      setDocumentCount(documentsSnapshot.size);

      // Récupérer le nombre d'installateurs
      const installersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'installer'),
        where('distributorId', '==', user.id)
      );
      const installersSnapshot = await getDocs(installersQuery);
      setInstallerCount(installersSnapshot.size);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError('Impossible de charger les données. Veuillez réessayer plus tard.');
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  // Charger les données nécessaires en fonction de l'onglet actif
  useEffect(() => {
    if (!user || user.role !== 'distributor') return;

    // Charger les données du tableau de bord
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [user, activeTab, fetchDashboardData]);

  // Vérifier l'authentification et rediriger si nécessaire
  useEffect(() => {
    if (!loading && (!user || user.role !== 'distributor')) {
      router.push('/login');
    } else if (!loading && user) {
      fetchDashboardData();
    }
  }, [user, loading, router, fetchDashboardData]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen flex-col">
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <AppLogo height={40} />
            <UserProfileMenu user={user} />
          </div>
        </header>
        <div className="flex flex-1">
          {/* Sidebar */}
          <aside className="w-64 border-r bg-card p-4">
            <nav className="space-y-2">
              <Button 
                variant={activeTab === 'dashboard' ? 'default' : 'ghost'} 
                className="w-full justify-start" 
                onClick={() => setActiveTab('dashboard')}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Tableau de bord
              </Button>
              <Button 
                variant={activeTab === 'documents' ? 'default' : 'ghost'} 
                className="w-full justify-start" 
                onClick={() => setActiveTab('documents')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Documents techniques
              </Button>
              <Button 
                variant={activeTab === 'team' ? 'default' : 'ghost'} 
                className="w-full justify-start" 
                onClick={() => setActiveTab('team')}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Équipe
              </Button>
              <Button 
                variant={activeTab === 'accounts' ? 'default' : 'ghost'} 
                className="w-full justify-start" 
                onClick={() => setActiveTab('accounts')}
              >
                <Users className="h-4 w-4 mr-2" />
                Gestion des comptes
              </Button>
            </nav>
          </aside>
          <main className="flex-1 p-6">
            {/* Affichage des erreurs */}
            {error && (
              <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
                <p>{error}</p>
              </div>
            )}

            {/* Affichage du chargement */}
            {loadingData && activeTab === 'dashboard' && (
              <div className="flex justify-center p-4">
                <p>Chargement des données...</p>
              </div>
            )}

            {/* Contenu principal */}
            {activeTab === 'dashboard' && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Produits</CardTitle>
                    <CardDescription>Types de produits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">{productCount}</p>
                        <p className="text-sm text-muted-foreground">Types de produits disponibles</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Store className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>Documents techniques</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">{documentCount}</p>
                        <p className="text-sm text-muted-foreground">Documents techniques disponibles</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Installateurs</CardTitle>
                    <CardDescription>R&apos;seau d&apos;installateurs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">{installerCount}</p>
                        <p className="text-sm text-muted-foreground">G&apos;rez votre r&apos;seau d&apos;installateurs</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'documents' && (
              <DocumentsSection />
            )}

            {activeTab === 'team' && (
              <TeamManagement />
            )}

            {activeTab === 'accounts' && (
              <AccountsSection />
            )}
          </main>
        </div>
      </div>

      <Toaster />
    </div>
  );
}
