import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

interface InviteFormProps {
  onClose: () => void;
  inviterId: string;
  onSuccess?: () => void;
  isDistributor?: boolean; // Indique si l'inviteur est un distributeur
  inviteMode?: 'team' | 'accounts'; // Mode d'invitation : équipe ou comptes
}

export function InviteForm({ onClose, inviterId, onSuccess, inviteMode = 'accounts' }: InviteFormProps) {
  // Déterminer les rôles disponibles en fonction du mode
  const isTeamMode = inviteMode === 'team';
  
  // Pour le mode équipe, seul le rôle distributeur est disponible
  // Pour le mode comptes, seuls les rôles installateur et utilisateur sont disponibles
  const defaultRole = isTeamMode ? 'distributor' : 'installer';
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'distributor' | 'installer' | 'user'>(defaultRole);
  const [inviteCompanyName, setInviteCompanyName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Appeler l'API pour envoyer l'invitation
      const response = await fetch('/api/auth/invite-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          role: inviteRole,
          companyName: inviteRole === 'installer' ? inviteCompanyName : undefined,
          inviterId,
          isDistributorAdmin: inviteRole === 'distributor' ? isAdmin : undefined
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi de l'invitation");
      }
      
      toast.success("L'invitation a été envoyée à " + inviteEmail + ".");
      
      // Réinitialiser le formulaire
      setInviteEmail('');
      setInviteName('');
      setInviteCompanyName('');
      setIsAdmin(false);
      
      // Fermer le formulaire et notifier le succès
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'invitation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Impossible d\'envoyer l\'invitation. Veuillez réessayer plus tard.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Déterminer le titre et la description en fonction du mode
  const getTitle = () => {
    if (isTeamMode) {
      return "Inviter un collaborateur distributeur";
    }
    return "Envoyer une invitation";
  };

  const getDescription = () => {
    if (isTeamMode) {
      return "Invitez un collaborateur à rejoindre votre équipe distributeur";
    }
    return "Invitez un installateur ou un utilisateur à rejoindre votre espace";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getTitle()}</CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
              <p>{error}</p>
            </div>
          )}
          
          {!isTeamMode && (
            <div className="space-y-2">
              <Label htmlFor="role">Type de compte</Label>
              <Select 
                value={inviteRole} 
                onValueChange={(value: 'installer' | 'user') => setInviteRole(value)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Sélectionner un type de compte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="installer">Installateur</SelectItem>
                  <SelectItem value="user">Utilisateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {inviteRole === 'installer' && (
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
              <Input 
                id="companyName" 
                value={inviteCompanyName} 
                onChange={(e) => setInviteCompanyName(e.target.value)} 
                required 
                placeholder="Nom de l&apos;entreprise de l&apos;installateur"
              />
            </div>
          )}

          {inviteRole === 'distributor' && (
            <div className="flex items-center space-x-2">
              <Switch 
                id="isAdmin" 
                checked={isAdmin} 
                onCheckedChange={setIsAdmin} 
              />
              <Label htmlFor="isAdmin" className="cursor-pointer">Droits d&apos;administration</Label>
              <p className="text-xs text-muted-foreground ml-2">
                Permet de gérer les membres de l&apos;équipe et d&apos;inviter de nouveaux collaborateurs
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input 
              id="name" 
              value={inviteName} 
              onChange={(e) => setInviteName(e.target.value)} 
              required 
              placeholder="Nom de la personne invitée"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={inviteEmail} 
              onChange={(e) => setInviteEmail(e.target.value)} 
              required 
              placeholder="email@exemple.com"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-6">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={isSubmitting} className="flex items-center">
            {isSubmitting ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Envoi en cours...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Envoyer l&apos;invitation
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
