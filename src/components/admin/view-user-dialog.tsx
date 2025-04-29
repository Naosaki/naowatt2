"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UserWithDistributor {
  uid: string;
  email: string;
  displayName?: string;
  name?: string;
  role: 'admin' | 'user' | 'distributor' | 'installer';
  createdAt?: Date | { toLocaleDateString: () => string; toLocaleTimeString: () => string } | unknown;
  lastLogin?: Date | { toLocaleDateString: () => string; toLocaleTimeString: () => string } | unknown;
  distributorId?: string;
  isDistributorAdmin?: boolean;
  distributorName?: string | undefined;
  [key: string]: any; // Pour les autres propriétés dynamiques
}

interface ViewUserDialogProps {
  user: UserWithDistributor | null;
  open: boolean;
  onClose: () => void;
}

export function ViewUserDialog({ user, open, onClose }: ViewUserDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Détails de l&apos;utilisateur</DialogTitle>
          <DialogDescription>
            Informations détaillées sur l&apos;utilisateur
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <div className="font-medium">Nom:</div>
            <div className="col-span-2">{user?.displayName}</div>
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <div className="font-medium">Email:</div>
            <div className="col-span-2">{user?.email}</div>
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <div className="font-medium">Rôle:</div>
            <div className="col-span-2">
              {user?.role === 'admin' && 'Administrateur'}
              {user?.role === 'user' && 'Utilisateur'}
              {user?.role === 'distributor' && 'Distributeur'}
              {user?.role === 'installer' && 'Installateur'}
            </div>
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <div className="font-medium">Distributeur:</div>
            <div className="col-span-2">{user?.distributorName || 'N/A'}</div>
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <div className="font-medium">Date de création:</div>
            <div className="col-span-2">
              {user?.createdAt ? (
                <>
                  {typeof user.createdAt.toLocaleDateString === 'function' ? 
                    `${user.createdAt.toLocaleDateString()} ${user.createdAt.toLocaleTimeString()}` : 
                    'Date inconnue'}
                </>
              ) : 'Non disponible'}
            </div>
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <div className="font-medium">Dernière connexion:</div>
            <div className="col-span-2">
              {user?.lastLogin ? (
                <>
                  {typeof user.lastLogin.toLocaleDateString === 'function' ? 
                    `${user.lastLogin.toLocaleDateString()} ${user.lastLogin.toLocaleTimeString()}` : 
                    'Date inconnue'}
                </>
              ) : 'Non disponible'}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
