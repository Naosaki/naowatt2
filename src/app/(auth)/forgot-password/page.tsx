"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { AppLogo } from '@/components/app-logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Appeler l'API route pour envoyer l'email de réinitialisation avec Resend
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsSubmitted(true);
        toast.success('Email de réinitialisation envoyé');
      } else {
        toast.error(data.error || 'Une erreur est survenue lors de l\'envoi de l\'email');
      }
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      toast.error('Une erreur est survenue lors de la demande de réinitialisation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Toaster />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <AppLogo height={60} />
          </div>
          <CardTitle className="text-2xl text-center font-semibold tracking-tight">
            Mot de passe oublié
          </CardTitle>
          {!isSubmitted ? (
            <CardDescription className="text-center">
              Saisissez votre adresse email pour recevoir un lien de réinitialisation
            </CardDescription>
          ) : (
            <CardDescription className="text-center text-green-600">
              Un email de réinitialisation a été envoyé à {email}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {!isSubmitted ? (
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
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Vérifiez votre boîte de réception et suivez les instructions dans l'email pour réinitialiser votre mot de passe.
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Si vous ne recevez pas l'email dans les prochaines minutes, vérifiez votre dossier de spam ou essayez à nouveau.
              </p>
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
              >
                Essayer avec une autre adresse email
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
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
