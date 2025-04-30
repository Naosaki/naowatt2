"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserNav } from '@/components/user-nav';
import { UserProfileMenu } from '@/components/user-profile-menu';
import { FileText, LayoutDashboard, Wrench, BookOpen, Download } from 'lucide-react';
import Link from 'next/link';
import { Footer } from '@/components/footer';

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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{/* documentCount */}</div>
                <p className="text-xs text-muted-foreground">Documents disponibles</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produits</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{/* productCount */}</div>
                <p className="text-xs text-muted-foreground">Produits disponibles</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dernière mise à jour</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{/* lastUpdate */}</div>
                <p className="text-xs text-muted-foreground">Documentation mise à jour</p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Documents récents</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* recentDocuments.map((doc) => (
                <Card key={doc.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{doc.name}</CardTitle>
                    <CardDescription>{doc.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-xs text-muted-foreground">Ajouté le {doc.dateAdded}</p>
                  </CardContent>
                  <CardFooter>
                    <Button size="sm" variant="outline" asChild className="w-full">
                      <Link href={doc.url} target="_blank">
                        <Download className="mr-2 h-4 w-4" /> Télécharger
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              )) */}
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
