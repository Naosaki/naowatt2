"use client";

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppSettings } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface FooterProps {
  showLinks?: boolean;
}

export function Footer({ showLinks = false }: FooterProps) {
  const [footerText, setFooterText] = useState('DataCop');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'app_settings'));
        
        if (settingsDoc.exists()) {
          const settingsData = settingsDoc.data() as AppSettings;
          setFooterText(settingsData.footerText || 'DataCop');
          setWebsiteUrl(settingsData.websiteUrl || '');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres du footer:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <footer className="border-t p-4 text-center text-sm text-muted-foreground">
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-between gap-4 px-4 md:px-8 lg:px-12 md:h-16 md:flex-row md:justify-center">
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {loading ? 'Chargement...' : footerText}
        </p>
        {showLinks && (
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Connexion</Link>
            </Button>
            {websiteUrl && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={websiteUrl} target="_blank">Site web</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </footer>
  );
}
