"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { AppLogo } from '@/components/app-logo';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Le rôle est fixé à 'user' pour les inscriptions publiques
      await signUp(email, password, displayName, 'user');
      
      // Connecter explicitement l'utilisateur après l'inscription
      console.log('Tentative de connexion après inscription avec:', email);
      const user = await signIn(email, password);
      console.log('Connexion après inscription réussie:', user);
      
      toast.success('Compte créé avec succès');
      
      // Attendre un court instant pour s'assurer que l'état d'authentification est mis à jour
      setTimeout(() => {
        // Rediriger vers le tableau de bord général qui redirigera ensuite vers le tableau de bord spécifique
        console.log('Redirection vers /dashboard');
        router.push('/dashboard');
      }, 500);
    } catch (error: unknown) {
      console.error('Erreur lors de l\'inscription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Veuillez réessayer';
      toast.error('Échec de l\'inscription : ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Toaster />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <AppLogo linkToHome={true} />
          <CardTitle className="text-2xl font-bold mt-4">Créer un compte</CardTitle>
          <CardDescription>
            Inscrivez-vous pour accéder au portail de documentation DataCop
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Nom complet</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Jean Dupont"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Création du compte...' : 'Créer un compte'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Vous avez déjà un compte ?{' '}
            <Link
              href="/login"
              className="text-primary underline-offset-4 hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
