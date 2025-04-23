"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function DashboardRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        // Rediriger vers le tableau de bord spécifique au rôle
        switch(user.role) {
          case 'admin':
            router.push('/dashboard-admin');
            break;
          case 'distributor':
            router.push('/dashboard-distributor');
            break;
          case 'installer':
            router.push('/dashboard-installer');
            break;
          case 'user':
          default:
            router.push('/dashboard-user');
            break;
        }
      }
    }
  }, [user, loading, router]);

  // Afficher un écran de chargement pendant la redirection
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Chargement de votre tableau de bord...</p>
    </div>
  );
}
