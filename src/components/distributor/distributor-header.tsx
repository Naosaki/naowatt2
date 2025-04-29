"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { AppLogo } from '@/components/app-logo';
import { UserProfileMenu } from '@/components/user-profile-menu';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Image from 'next/image';

interface DistributorSettings {
  companyName: string;
  logoUrl: string | null;
}

export function DistributorHeader() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<DistributorSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadDistributorSettings = async () => {
      if (!user || user.role !== 'distributor') return;
      
      try {
        // Récupérer le document du distributeur
        const distributorId = user.distributorId || user.id;
        const distributorDoc = await getDoc(doc(db, 'distributors', distributorId));
        
        if (distributorDoc.exists()) {
          const data = distributorDoc.data();
          setSettings({
            companyName: data.companyName || '',
            logoUrl: data.logoUrl || null
          });
        } else {
          // Créer un document par défaut si nécessaire
          await setDoc(doc(db, 'distributors', distributorId), {
            companyName: user.name || '',
            logoUrl: null,
            updatedAt: new Date()
          });
          setSettings({
            companyName: user.name || '',
            logoUrl: null
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDistributorSettings();
  }, [user]);
  
  return (
    <header className="border-b bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <AppLogo height={40} />
          
          {!loading && settings?.logoUrl && (
            <div className="h-10 w-auto border-l pl-4">
              <div className="relative h-10 w-auto">
                <Image 
                  src={settings.logoUrl} 
                  alt={settings.companyName || 'Logo distributeur'}
                  width={120}
                  height={40}
                  className="h-full w-auto object-contain"
                />
              </div>
            </div>
          )}
        </div>
        <UserProfileMenu user={user} />
      </div>
    </header>
  );
}
