"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { User } from '@/lib/types';
import { Settings, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface UserProfileMenuProps {
  user: User | null;
}

export function UserProfileMenu({ user }: UserProfileMenuProps) {
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const initials = user.name 
    ? getInitials(user.name)
    : user.email 
      ? user.email[0].toUpperCase()
      : 'U';

  return (
    <div className="relative" ref={menuRef}>
      <ConfirmDialog
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={handleSignOut}
        title="Confirmer la déconnexion"
        description="Êtes-vous sûr de vouloir vous déconnecter ?"
        confirmText="Déconnexion"
        cancelText="Annuler"
      />
      
      <button
        className="flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          {initials}
        </div>
        <span className="font-medium">{user.name || user.email}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md border bg-card p-1 shadow-lg z-50">
          <div className="p-2 text-sm font-medium">
            <div>{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
            <div className="mt-1">
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
          <div className="h-px bg-border my-1" />
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm">Thème</span>
            <ThemeToggle />
          </div>
          <button
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
            onClick={() => {
              setIsOpen(false);
              router.push('/settings');
            }}
          >
            <Settings className="h-4 w-4" />
            <span>Paramètres</span>
          </button>
          <button
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-muted"
            onClick={() => {
              setIsOpen(false);
              setShowSignOutConfirm(true);
            }}
          >
            <LogOut className="h-4 w-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      )}
    </div>
  );
}
