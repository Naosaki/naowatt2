"use client";

import { useState, useEffect } from 'react';
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

export default function RegisterPage() {
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
  
  // Vérifier la validité du token d'invitation
  useEffect(() => {
    const verifyToken = async () => {
      if (!token || !role) {
        setIsVerifying(false);
        return;
      }
      
      try {
        // Rechercher l'invitation dans Firestore
        const invitationsRef = collection(db, 'invitations');
        const q = query(
          invitationsRef,
          where('token', '==', token),
          where('role', '==', role),
          where('status', '==', 'pending')
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setIsTokenValid(false);
          setIsVerifying(false);
          return;
        }
        
        // Vérifier si l'invitation n'a pas expiré
        const invitationDoc = querySnapshot.docs[0];
        const invitationData = invitationDoc.data();
        const expiresAt = invitationData.expiresAt.toDate();
        
        if (expiresAt < new Date()) {
          setIsTokenValid(false);
          setIsVerifying(false);
          return;
        }
        
        // L'invitation est valide
        setInvitation({
          id: invitationDoc.id,
          email: invitationData.email,
          name: invitationData.name,
          role: invitationData.role as 'installer' | 'user',
          companyName: invitationData.companyName,
          inviterId: invitationData.inviterId,
          inviterName: invitationData.inviterName,
          inviterCompany: invitationData.inviterCompany,
          token: invitationData.token,
          status: invitationData.status as 'pending' | 'accepted' | 'rejected',
          createdAt: invitationData.createdAt.toDate(),
          expiresAt: expiresAt
        });
        setIsTokenValid(true);
        setIsVerifying(false);
      } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
        setIsTokenValid(false);
        setIsVerifying(false);
      }
    };
    
    verifyToken();
  }, [token, role]);
  
  // Fonction pour vérifier la force du mot de passe
  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    
    // Longueur > 8
    if (password.length >= 8) strength += 1;
    
    // Contient des chiffres
    if (/\d/.test(password)) strength += 1;
    
    // Contient des minuscules et majuscules
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    
    // Contient des caractères spéciaux
    if (/[^a-zA-Z\d]/.test(password)) strength += 1;
    
    setPasswordStrength(strength);
  };
  
  // Gestionnaire de changement de mot de passe
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
  };
  
  // Gestionnaire de soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitation) return;
    
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Créer le compte utilisateur
      await signUp(
        invitation.email,
        password,
        invitation.name,
        invitation.role,
        invitation.inviterId,
        invitation.companyName
      );
      
      // Mettre à jour le statut de l'invitation
      await updateDoc(doc(db, 'invitations', invitation.id), {
        status: 'accepted',
        acceptedAt: new Date()
      });
      
      toast.success('Votre compte a été créé avec succès');
      
      // Rediriger vers la page appropriée selon le rôle
      setTimeout(() => {
        if (invitation.role === 'installer') {
          router.push('/dashboard-installer');
        } else {
          router.push('/dashboard');
        }
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de la création du compte:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue lors de la création du compte');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Rendu de l'indicateur de force du mot de passe
  const renderPasswordStrength = () => {
    if (!password) return null;
    
    const strengthLabels = [
      { label: 'Faible', color: 'bg-red-500' },
      { label: 'Moyen', color: 'bg-orange-500' },
      { label: 'Bon', color: 'bg-yellow-500' },
      { label: 'Fort', color: 'bg-green-500' }
    ];
    
    const currentStrength = strengthLabels[passwordStrength];
    
    return (
      <div className="mt-1">
        <div className="flex justify-between mb-1">
          <span className="text-xs">{currentStrength.label}</span>
          <span className="text-xs">{passwordStrength}/4</span>
        </div>
        <div className="h-1 w-full bg-gray-200 rounded-full">
          <div 
            className={`h-1 rounded-full ${currentStrength.color}`} 
            style={{ width: `${(passwordStrength / 4) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };
  
  // Rendu du contenu principal
  const renderContent = () => {
    if (isVerifying) {
      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="text-center">Vérification de l'invitation...</span>
        </div>
      );
    }
    
    if (!isTokenValid || !invitation) {
      return (
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invitation invalide</AlertTitle>
            <AlertDescription>
              Cette invitation est invalide, a expiré ou a déjà été utilisée.
            </AlertDescription>
          </Alert>
          <Button 
            className="w-full" 
            onClick={() => router.push('/login')}
          >
            Retour à la page de connexion
          </Button>
        </div>
      );
    }
    
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <div className="rounded-lg border p-4 bg-muted/50">
            <p className="font-medium">Informations de l'invitation</p>
            <div className="mt-2 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Nom:</span> {invitation.name}</p>
              <p><span className="text-muted-foreground">Email:</span> {invitation.email}</p>
              <p><span className="text-muted-foreground">Rôle:</span> {invitation.role === 'installer' ? 'Installateur' : 'Utilisateur'}</p>
              {invitation.role === 'installer' && invitation.companyName && (
                <p><span className="text-muted-foreground">Entreprise:</span> {invitation.companyName}</p>
              )}
              <p><span className="text-muted-foreground">Invité par:</span> {invitation.inviterName}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              required
              disabled={isSubmitting}
              minLength={8}
              className="border-input focus:border-primary"
              placeholder="Minimum 8 caractères"
            />
            {renderPasswordStrength()}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting}
              minLength={8}
              className="border-input focus:border-primary"
              placeholder="Confirmer votre mot de passe"
            />
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full transition-all" 
          disabled={isSubmitting || password.length < 8 || password !== confirmPassword}
        >
          {isSubmitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              Création du compte...
            </>
          ) : (
            <>
              <UserCheck className="mr-2 h-4 w-4" />
              Finaliser l'inscription
            </>
          )}
        </Button>
      </form>
    );
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Toaster />
      <Card className="w-full max-w-md shadow-lg border-opacity-50">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex justify-center mb-4">
            <AppLogo height={60} />
          </div>
          <CardTitle className="text-2xl text-center font-semibold tracking-tight">
            Finaliser votre inscription
          </CardTitle>
          <CardDescription className="text-center">
            Créez votre mot de passe pour activer votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
        <CardFooter className="flex justify-center pt-4 pb-6 border-t">
          <p className="text-sm text-muted-foreground">
            <Link
              href="/login"
              className="text-primary underline-offset-4 hover:underline"
            >
              Déjà un compte? Se connecter
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
