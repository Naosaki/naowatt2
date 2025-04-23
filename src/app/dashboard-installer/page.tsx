"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AppLogo } from '@/components/app-logo';
import { UserProfileMenu } from '@/components/user-profile-menu';
import { FileText, LayoutDashboard, Wrench, BookOpen, Download } from 'lucide-react';
import Link from 'next/link';

export default function InstallerDashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Vérifier si l'utilisateur est un installateur
      if (user.role !== 'installer') {
        router.push('/dashboard'); // Rediriger vers le tableau de bord principal
      }
    }
  }, [user, loading, router]);

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
      
      <header className="border-b bg-card p-4">
        <div className="container mx-auto flex items-center justify-between">
          <AppLogo height={40} />
          <div className="flex items-center gap-4">
            <UserProfileMenu user={user} />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-muted/20 p-4">
          <nav className="space-y-2">
            <Link href="/dashboard-installer" className="flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Tableau de bord
            </Link>
            <Link href="#" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <Wrench className="mr-2 h-4 w-4" />
              Guides d'installation
            </Link>
            <Link href="#" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <FileText className="mr-2 h-4 w-4" />
              Fiches techniques
            </Link>
            <Link href="#" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <Download className="mr-2 h-4 w-4" />
              Téléchargements
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Tableau de bord installateur</h1>
            <p className="text-muted-foreground">Accédez aux guides d'installation et fiches techniques</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Guides d'installation</CardTitle>
                <CardDescription>Procédures d'installation détaillées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">Manuels</p>
                    <p className="text-sm text-muted-foreground">Guides étape par étape pour l'installation</p>
                  </div>
                  <Wrench className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline">
                  Consulter les guides
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fiches techniques</CardTitle>
                <CardDescription>Spécifications des produits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">Datasheets</p>
                    <p className="text-sm text-muted-foreground">Caractéristiques techniques des panneaux</p>
                  </div>
                  <FileText className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline">
                  Voir les fiches techniques
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Formations</CardTitle>
                <CardDescription>Ressources de formation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">Tutoriels</p>
                    <p className="text-sm text-muted-foreground">Vidéos et guides de formation</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline">
                  Accéder aux formations
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Téléchargements</CardTitle>
                <CardDescription>Logiciels et outils</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">Outils</p>
                    <p className="text-sm text-muted-foreground">Logiciels et applications utiles</p>
                  </div>
                  <Download className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline">
                  Télécharger
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>

      <footer className="border-t p-4 text-center text-sm text-muted-foreground">
        <p> {new Date().getFullYear()} DataWatt - Solar Panel Documentation Portal</p>
      </footer>
    </div>
  );
}
