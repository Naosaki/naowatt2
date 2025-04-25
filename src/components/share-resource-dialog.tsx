"use client";

import { useState } from 'react';
import { useEmail } from '@/hooks/use-email';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ShareResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: string;
  resourceName: string;
  currentUserName: string;
}

export function ShareResourceDialog({
  open,
  onOpenChange,
  resourceId,
  resourceName,
  currentUserName,
}: ShareResourceDialogProps) {
  const [email, setEmail] = useState('');
  const { isLoading, sendShareNotification } = useEmail({
    onSuccess: () => {
      toast.success('Invitation envoyu00e9e avec succu00e8s');
      onOpenChange(false);
      setEmail('');
    },
    onError: (error) => {
      toast.error(`Erreur lors de l'envoi de l'invitation: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Veuillez entrer une adresse email valide');
      return;
    }

    try {
      await sendShareNotification({
        to: email,
        senderName: currentUserName,
        resourceName,
        resourceLink: `${window.location.origin}/resources/${resourceId}`,
      });
    } catch (error) {
      // L'erreur est du00e9ju00e0 gu00e9ru00e9e par le hook via onError
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Partager "{resourceName}"</DialogTitle>
          <DialogDescription>
            Entrez l'adresse email de la personne avec qui vous souhaitez partager cette ressource.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Envoi en cours...' : 'Envoyer l\'invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
