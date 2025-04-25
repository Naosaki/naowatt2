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
import { resetPassword, verifyResetToken } from '@/app/api/auth/password-reset/actions';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0); // 0-3 pour la force du mot de passe
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode'); // Firebase utilise oobCode comme paramètre
  const mode = searchParams.get('mode'); // Firebase utilise mode=resetPassword

  useEffect(() => {
    const verifyToken = async () => {
      if (!oobCode || mode !== 'resetPassword') {
        setIsVerifying(false);
        return;
      }

      try {
        const result = await verifyResetToken(oobCode, '');
        setIsTokenValid(result.valid);
      } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
        setIsTokenValid(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [oobCode, mode]);

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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (!oobCode) {
      toast.error('Informations de réinitialisation manquantes');
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(oobCode, '', password);
      
      if (result.success) {
        setIsCompleted(true);
        toast.success('Votre mot de passe a été réinitialisé avec succès');
      } else {
        toast.error(result.error || 'Une erreur est survenue lors de la réinitialisation du mot de passe');
      }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      toast.error('Une erreur est survenue lors de la réinitialisation du mot de passe');
    } finally {
      setIsLoading(false);
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

  const renderContent = () => {
    if (isVerifying) {
      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="text-center">Vérification du lien de réinitialisation...</span>
        </div>
      );
    }

    if (!oobCode || mode !== 'resetPassword') {
      return (
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lien invalide</AlertTitle>
            <AlertDescription>
              Le lien de réinitialisation est invalide ou incomplet.
            </AlertDescription>
          </Alert>
          <Button 
            className="w-full" 
            onClick={() => router.push('/forgot-password')}
          >
            Demander un nouveau lien
          </Button>
        </div>
      );
    }

    if (!isTokenValid) {
      return (
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lien expiré</AlertTitle>
            <AlertDescription>
              Le lien de réinitialisation a expiré ou est invalide.
            </AlertDescription>
          </Alert>
          <Button 
            className="w-full" 
            onClick={() => router.push('/forgot-password')}
          >
            Demander un nouveau lien
          </Button>
        </div>
      );
    }

    if (isCompleted) {
      return (
        <div className="space-y-6">
          <Alert variant="success" className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Réinitialisation réussie</AlertTitle>
            <AlertDescription>
              Votre mot de passe a été réinitialisé avec succès.
            </AlertDescription>
          </Alert>
          <Button 
            className="w-full" 
            onClick={() => router.push('/login')}
          >
            Se connecter
          </Button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-1">
              <Lock className="h-4 w-4" />
              <span>Nouveau mot de passe</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              required
              disabled={isLoading}
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
              disabled={isLoading}
              minLength={8}
              className="border-input focus:border-primary"
              placeholder="Confirmer votre mot de passe"
            />
          </div>
        </div>
        
        <div className="pt-2">
          <Button 
            type="submit" 
            className="w-full transition-all" 
            disabled={isLoading || password.length < 8 || password !== confirmPassword}
          >
            {isLoading ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
          </Button>
        </div>
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
            Réinitialisation du mot de passe
          </CardTitle>
          <CardDescription className="text-center">
            {isCompleted 
              ? 'Votre mot de passe a été réinitialisé avec succès' 
              : 'Créez un nouveau mot de passe sécurisé pour votre compte'}
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
              Retour à la page de connexion
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
