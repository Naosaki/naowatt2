"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { AppLogo } from '@/components/app-logo';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { AlertCircle, UserCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Interface pour les données d'invitation
interface Invitation {
  id: string;
  email: string;
  name: string;
  role: 'installer' | 'user';
  companyName?: string;
  inviterId: string;
  inviterName: string;
  inviterCompany: string;
  token: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  expiresAt: Date;
}

// Composant qui utilise useSearchParams enveloppé dans Suspense
function RegisterContent() {
  const { signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const role = searchParams.get('role');
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Champs du formulaire
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Vérifier la validité du token
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifying(false);
        setError('Aucun token d\'invitation fourni');
        return;
      }

      try {
        // Rechercher l'invitation correspondant au token
        const invitationsQuery = query(
          collection(db, 'invitations'),
          where('token', '==', token)
        );

        const invitationsSnapshot = await getDocs(invitationsQuery);

        if (invitationsSnapshot.empty) {
          setIsVerifying(false);
          setError('Invitation invalide ou expirée');
          return;
        }

        // Récupérer les données de l'invitation
        const invitationData = invitationsSnapshot.docs[0].data() as Omit<Invitation, 'id'> & { createdAt: any, expiresAt: any };
        const invitationId = invitationsSnapshot.docs[0].id;

        const invitation: Invitation = {
          ...invitationData,
          id: invitationId,
          createdAt: invitationData.createdAt?.toDate() || new Date(),
          expiresAt: invitationData.expiresAt?.toDate() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };

        // Vérifier si l'invitation est toujours valide
        if (invitation.status !== 'pending') {
          setIsVerifying(false);
          setError('Cette invitation a déjà été utilisée ou annulée');
          return;
        }

        // Vérifier si l'invitation n'est pas expirée
        if (invitation.expiresAt < new Date()) {
          setIsVerifying(false);
          setError('Cette invitation a expiré');
          return;
        }

        // L'invitation est valide
        setInvitation(invitation);
        setIsTokenValid(true);
        setIsVerifying(false);
      } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
        setIsVerifying(false);
        setError('Une erreur est survenue lors de la vérification de l\'invitation');
      }
    };

    verifyToken();
  }, [token]);

  // Vérifier la force du mot de passe
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;

    // Longueur minimale
    if (password.length >= 8) strength += 1;

    // Présence de chiffres
    if (/\d/.test(password)) strength += 1;

    // Présence de lettres minuscules
    if (/[a-z]/.test(password)) strength += 1;

    // Présence de lettres majuscules
    if (/[A-Z]/.test(password)) strength += 1;

    // Présence de caractères spéciaux
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

    setPasswordStrength(strength);
  }, [password]);

  // Fonction pour créer le compte
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invitation) {
      setError('Invitation invalide');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (passwordStrength < 3) {
      setError('Le mot de passe est trop faible. Ajoutez des chiffres, des lettres majuscules et des caractères spéciaux.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Créer le compte utilisateur
      const userCredential = await signUp(invitation.email, password);

      if (!userCredential || !userCredential.user) {
        throw new Error('Impossible de créer le compte');
      }

      // Mettre à jour le statut de l'invitation
      await updateDoc(doc(db, 'invitations', invitation.id), {
        status: 'accepted',
        acceptedAt: new Date(),
      });

      // Rediriger vers la page de tableau de bord appropriée
      if (invitation.role === 'installer') {
        router.push('/dashboard-installer');
      } else if (invitation.role === 'user') {
        router.push('/dashboard-user');
      } else {
        router.push('/dashboard');
      }

      toast.success('Votre compte a été créé avec succès!');
    } catch (error) {
      console.error('Erreur lors de la création du compte:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors de la création du compte';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  // Afficher un indicateur de chargement pendant la vérification du token
  if (isVerifying) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <AppLogo className="mb-8" />
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Vérification de l'invitation</CardTitle>
            <CardDescription>Veuillez patienter pendant que nous vérifions votre invitation...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Afficher un message d'erreur si le token est invalide
  if (!isTokenValid || error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <AppLogo className="mb-8" />
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation invalide</CardTitle>
            <CardDescription>Nous n'avons pas pu vérifier votre invitation.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error || 'Invitation invalide ou expirée'}</AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Si vous pensez qu'il s'agit d'une erreur, veuillez contacter la personne qui vous a invité ou l'administrateur du système.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">Retour à la page de connexion</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Afficher le formulaire d'inscription
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <AppLogo className="mb-8" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Créer votre compte</CardTitle>
          <CardDescription>
            Vous avez été invité par {invitation?.inviterName || 'un administrateur'} à rejoindre {invitation?.inviterCompany || 'la plateforme'} en tant que {invitation?.role === 'installer' ? 'installateur' : 'utilisateur'}.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={invitation?.email || ''} disabled />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" value={invitation?.name || ''} disabled />
            </div>
            
            {invitation?.role === 'installer' && invitation?.companyName && (
              <div className="space-y-2">
                <Label htmlFor="companyName">Entreprise</Label>
                <Input id="companyName" value={invitation.companyName} disabled />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <div className="mt-1">
                <div className="flex justify-between mb-1">
                  <span className="text-xs">Force du mot de passe:</span>
                  <span className="text-xs">
                    {passwordStrength === 0 && 'Très faible'}
                    {passwordStrength === 1 && 'Faible'}
                    {passwordStrength === 2 && 'Moyen'}
                    {passwordStrength === 3 && 'Bon'}
                    {passwordStrength === 4 && 'Fort'}
                    {passwordStrength === 5 && 'Excellent'}
                  </span>
                </div>
                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${passwordStrength <= 1 ? 'bg-red-500' : passwordStrength <= 2 ? 'bg-orange-500' : passwordStrength <= 3 ? 'bg-yellow-500' : passwordStrength <= 4 ? 'bg-green-500' : 'bg-emerald-500'}`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Utilisez au moins 8 caractères avec des lettres majuscules, des chiffres et des caractères spéciaux.
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href="/login">
              <Button type="button" variant="outline">Annuler</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  Création en cours...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Créer mon compte
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <Toaster />
    </div>
  );
}

// Composant principal enveloppé dans Suspense
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <AppLogo className="mb-8" />
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Chargement...</CardTitle>
            <CardDescription>Veuillez patienter pendant le chargement de la page d'invitation...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
