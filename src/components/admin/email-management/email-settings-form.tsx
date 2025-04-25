"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmailSettings } from './email-management';
import { Skeleton } from '@/components/ui/skeleton';

interface EmailSettingsFormProps {
  settings: EmailSettings;
  onSave: (settings: EmailSettings) => void;
  loading: boolean;
}

export function EmailSettingsForm({ settings, onSave, loading }: EmailSettingsFormProps) {
  const [formData, setFormData] = useState<EmailSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-24" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Paramètres d&apos;envoi d&apos;emails</CardTitle>
          <CardDescription>
            Configurez l&apos;adresse d&apos;expéditeur et les paramètres utilisés pour l&apos;envoi d&apos;emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fromName">Nom d&apos;expéditeur</Label>
            <Input
              id="fromName"
              name="fromName"
              value={formData.fromName}
              onChange={handleChange}
              placeholder="DataCop"
              required
            />
            <p className="text-sm text-muted-foreground">
              Le nom qui apparaîtra comme expéditeur des emails
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fromEmail">Email d&apos;expéditeur</Label>
            <Input
              id="fromEmail"
              name="fromEmail"
              type="email"
              value={formData.fromEmail}
              onChange={handleChange}
              placeholder="notifications@votredomaine.com"
              required
            />
            <p className="text-sm text-muted-foreground">
              L&apos;adresse email utilisée pour envoyer les emails (doit utiliser un domaine vérifié dans Resend)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="replyToEmail">Email de réponse (optionnel)</Label>
            <Input
              id="replyToEmail"
              name="replyToEmail"
              type="email"
              value={formData.replyToEmail || ''}
              onChange={handleChange}
              placeholder="support@votredomaine.com"
            />
            <p className="text-sm text-muted-foreground">
              L&apos;adresse email à laquelle les utilisateurs répondront (si différente de l&apos;email d&apos;expéditeur)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="defaultDomain">Domaine par défaut</Label>
            <Input
              id="defaultDomain"
              name="defaultDomain"
              value={formData.defaultDomain}
              onChange={handleChange}
              placeholder="votredomaine.com"
              required
            />
            <p className="text-sm text-muted-foreground">
              Le domaine principal utilisé pour les emails (doit être vérifié dans Resend)
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
