"use client";

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
  const { user, updateUserName, updateUserPassword } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  if (!user) return null;

  const handleNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Le nom ne peut pas être vide');
      return;
    }

    setIsUpdatingName(true);
    try {
      await updateUserName(name);
      toast.success('Nom mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du nom:', error);
      toast.error('Erreur lors de la mise à jour du nom');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Veuillez entrer votre mot de passe actuel');
      return;
    }
    if (!newPassword) {
      toast.error('Veuillez entrer un nouveau mot de passe');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updateUserPassword(currentPassword, newPassword);
      toast.success('Mot de passe mis à jour avec succès');
      // Réinitialiser les champs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      if (error instanceof Error && error.message.includes('auth/wrong-password')) {
        toast.error('Le mot de passe actuel est incorrect');
      } else {
        toast.error('Erreur lors de la mise à jour du mot de passe');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Paramètres du compte</DialogTitle>
          <DialogDescription>
            Modifiez vos informations personnelles et votre mot de passe
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="profile" className="flex-1">Profil</TabsTrigger>
            <TabsTrigger value="security" className="flex-1">Sécurité</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <form onSubmit={handleNameUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} disabled />
                <p className="text-xs text-muted-foreground">
                  L&apos;adresse email ne peut pas être modifiée
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Input id="role" value={user.role} disabled />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isUpdatingName}>
                  {isUpdatingName ? 'Mise à jour...' : 'Mettre à jour le profil'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="security">
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
