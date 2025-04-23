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
import { User } from '@/lib/types';

interface ViewUserDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewUserDialog({ user, isOpen, onClose }: ViewUserDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            <div className="col-span-2">{user.displayName || 'Non défini'}</div>
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <div className="font-medium">Email:</div>
            <div className="col-span-2">{user.email}</div>
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <div className="font-medium">Rôle:</div>
            <div className="col-span-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                user.role === 'distributor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                user.role === 'installer' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
              }`}>
                {user.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <div className="font-medium">Date de création:</div>
            <div className="col-span-2">{user.createdAt.toLocaleDateString()} {user.createdAt.toLocaleTimeString()}</div>
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <div className="font-medium">Dernière connexion:</div>
            <div className="col-span-2">{user.lastLogin.toLocaleDateString()} {user.lastLogin.toLocaleTimeString()}</div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
