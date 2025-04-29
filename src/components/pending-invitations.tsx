import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Clock, AlertCircle, CheckCircle, RefreshCw, Trash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export interface Invitation {
  id: string;
  email: string;
  name: string;
  role: 'distributor' | 'installer' | 'user';
  companyName?: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  inviterId: string;
  inviterName: string;
  token: string;
}

interface PendingInvitationsProps {
  invitations: Invitation[];
  loading: boolean;
  onResendInvitation?: (invitation: Invitation) => void;
  onRefresh?: () => void;
  onDelete?: () => void;
}

export function PendingInvitations({
  invitations,
  loading,
  onResendInvitation,
  onRefresh,
  onDelete
}: PendingInvitationsProps) {
  const getStatusBadge = (invitation: Invitation) => {
    if (invitation.status === 'pending') {
      const now = new Date();
      if (now > invitation.expiresAt) {
        return (
          <div className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            <AlertCircle className="mr-1 h-3 w-3" />
            Expirée
          </div>
        );
      }
      return (
        <div className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          <Clock className="mr-1 h-3 w-3" />
          En attente
        </div>
      );
    } else if (invitation.status === 'accepted') {
      return (
        <div className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          <CheckCircle className="mr-1 h-3 w-3" />
          Acceptée
        </div>
      );
    }
    return null;
  };

  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    if (now > expiresAt) {
      return 'Expirée';
    }
    return `Expire ${formatDistanceToNow(expiresAt, { addSuffix: true, locale: fr })}`;
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'distributor':
        return 'Collaborateur distributeur';
      case 'installer':
        return 'Installateur';
      case 'user':
        return 'Utilisateur';
      default:
        return role;
    }
  };

  const handleDeleteInvitation = async (invitation: Invitation) => {
    try {
      await deleteDoc(doc(db, 'invitations', invitation.id));
      toast.success("L'invitation envoyée à " + invitation.email + " a été supprimée.");
      if (onDelete) onDelete();
    } catch (error) {
      console.error("Erreur lors de la suppression de l'invitation:", error);
      toast.error("Impossible de supprimer l'invitation. Veuillez réessayer plus tard.");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Invitations en attente</CardTitle>
          <CardDescription>Liste des invitations envoyées qui n'ont pas encore été acceptées</CardDescription>
        </div>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <p>Chargement des invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border">
            <div className="text-center">
              <Mail className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Aucune invitation en attente</p>
              <p className="text-sm text-muted-foreground">Envoyez des invitations en cliquant sur &quot;Envoyer une invitation&quot;</p>
            </div>
          </div>
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Nom</th>
                  <th className="px-4 py-2 text-left font-medium">Email</th>
                  <th className="px-4 py-2 text-left font-medium">Rôle</th>
                  <th className="px-4 py-2 text-left font-medium">Statut</th>
                  <th className="px-4 py-2 text-left font-medium">Expiration</th>
                  <th className="px-4 py-2 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => (
                  <tr key={invitation.id} className="border-b">
                    <td className="px-4 py-2">{invitation.name}</td>
                    <td className="px-4 py-2">{invitation.email}</td>
                    <td className="px-4 py-2">
                      {getRoleLabel(invitation.role)}
                      {invitation.companyName && ` (${invitation.companyName})`}
                    </td>
                    <td className="px-4 py-2">{getStatusBadge(invitation)}</td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">
                      {getTimeRemaining(invitation.expiresAt)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center space-x-2">
                        {onResendInvitation && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onResendInvitation(invitation)}
                          >
                            Renvoyer
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteInvitation(invitation)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
