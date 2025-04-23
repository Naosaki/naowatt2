"use client";

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppSettings } from '@/lib/types';
import Image from 'next/image';

interface AppLogoProps {
  className?: string;
  height?: number;
}

export function AppLogo({ className = '', height = 40 }: AppLogoProps) {
  const { theme } = useTheme();
  const [appName, setAppName] = useState('DataWatt');
  const [logoLight, setLogoLight] = useState('');
  const [logoDark, setLogoDark] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'app_settings'));
        
        if (settingsDoc.exists()) {
          const settingsData = settingsDoc.data() as AppSettings;
          setAppName(settingsData.appName || 'DataWatt');
          setLogoLight(settingsData.logoLightMode || '');
          setLogoDark(settingsData.logoDarkMode || '');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres du logo:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Déterminer quel logo afficher en fonction du thème
  const logoUrl = theme === 'dark' ? logoDark : logoLight;

  if (loading) {
    return <div className={`h-${height / 16}rem ${className} font-bold text-xl`}>{appName}</div>;
  }

  // Si aucun logo n'est configuré, afficher le nom de l'application
  if (!logoUrl) {
    return <div className={`font-bold text-xl ${className}`}>{appName}</div>;
  }

  // Sinon, afficher le logo
  return (
    <div className={`${className} flex items-center`}>
      <Image 
        src={logoUrl} 
        alt={appName} 
        width={height * 4} 
        height={height}
        className="h-auto max-h-[40px] w-auto object-contain"
        priority
      />
    </div>
  );
}
