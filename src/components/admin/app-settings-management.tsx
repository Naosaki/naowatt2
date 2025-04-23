"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { AppSettings } from '@/lib/types';
import Image from 'next/image';

export function AppSettingsManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appName, setAppName] = useState('');
  const [footerText, setFooterText] = useState('');
  const [logoLightFile, setLogoLightFile] = useState<File | null>(null);
  const [logoDarkFile, setLogoDarkFile] = useState<File | null>(null);
  const [logoLightPreview, setLogoLightPreview] = useState('');
  const [logoDarkPreview, setLogoDarkPreview] = useState('');
  const logoLightInputRef = useRef<HTMLInputElement>(null);
  const logoDarkInputRef = useRef<HTMLInputElement>(null);

  // Charger les paramètres actuels
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'app_settings'));
        
        if (settingsDoc.exists()) {
          const settingsData = settingsDoc.data() as AppSettings;
          setAppName(settingsData.appName || 'DataWatt');
          setFooterText(settingsData.footerText || 'DataWatt - Solar Panel Documentation Portal');
          setLogoLightPreview(settingsData.logoLightMode || '');
          setLogoDarkPreview(settingsData.logoDarkMode || '');
        } else {
          // Créer des paramètres par défaut si aucun n'existe
          setAppName('DataWatt');
          setFooterText('DataWatt - Solar Panel Documentation Portal');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
        toast.error('Erreur lors du chargement des paramètres');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Gérer le changement de fichier pour le logo mode clair
  const handleLogoLightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoLightFile(file);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          setLogoLightPreview(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Gérer le changement de fichier pour le logo mode sombre
  const handleLogoDarkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoDarkFile(file);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          setLogoDarkPreview(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Fonction pour uploader un fichier et obtenir son URL
  const uploadLogo = async (file: File, mode: 'light' | 'dark'): Promise<string> => {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const storageRef = ref(storage, `logos/${mode}_${timestamp}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          // Progression de l'upload
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload ${mode} logo: ${progress}% done`);
        }, 
        (error) => {
          // Erreur pendant l'upload
          console.error(`Erreur lors de l'upload du logo ${mode}:`, error);
          reject(error);
        }, 
        async () => {
          // Upload terminé avec succès
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  };

  // Enregistrer les paramètres
  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      let logoLightURL = logoLightPreview;
      let logoDarkURL = logoDarkPreview;

      // Upload du logo mode clair si un nouveau fichier a été sélectionné
      if (logoLightFile) {
        logoLightURL = await uploadLogo(logoLightFile, 'light');
      }

      // Upload du logo mode sombre si un nouveau fichier a été sélectionné
      if (logoDarkFile) {
        logoDarkURL = await uploadLogo(logoDarkFile, 'dark');
      }

      // Mettre à jour les paramètres dans Firestore
      const updatedSettings: AppSettings = {
        id: 'app_settings',
        appName,
        footerText,
        logoLightMode: logoLightURL,
        logoDarkMode: logoDarkURL,
        updatedAt: new Date(),
        updatedBy: user.uid,
      };

      await setDoc(doc(db, 'settings', 'app_settings'), updatedSettings);
      
      toast.success('Paramètres enregistrés avec succès');
      
      // Réinitialiser les références de fichiers
      setLogoLightFile(null);
      setLogoDarkFile(null);
      if (logoLightInputRef.current) logoLightInputRef.current.value = '';
      if (logoDarkInputRef.current) logoDarkInputRef.current.value = '';
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des paramètres:', error);
      toast.error('Erreur lors de l\'enregistrement des paramètres');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Paramètres de l'application</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Paramètres généraux</CardTitle>
          <CardDescription>Personnalisez l'apparence et les informations de base de l'application</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">
              <p>Chargement des paramètres...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="appName">Nom de l&apos;application</Label>
                <Input
                  id="appName"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Nom de l&apos;application"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="footerText">Texte du footer</Label>
                <Input
                  id="footerText"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="Texte du footer"
                />
                <p className="text-xs text-muted-foreground">
                  Ce texte sera affiché dans le footer de l&apos;application. L&apos;année sera automatiquement ajoutée avant le texte.
                </p>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="logoLight">Logo - Mode clair</Label>
                  <div className="flex flex-col space-y-2">
                    {logoLightPreview && (
                      <div className="relative h-20 w-auto border rounded p-2 bg-white">
                        <Image 
                          src={logoLightPreview} 
                          alt="Logo mode clair" 
                          width={200}
                          height={80}
                          className="h-full w-auto object-contain"
                        />
                      </div>
                    )}
                    <Input
                      id="logoLight"
                      type="file"
                      ref={logoLightInputRef}
                      onChange={handleLogoLightChange}
                      accept="image/*"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommandé: format PNG ou SVG avec fond transparent, ratio 4:1
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logoDark">Logo - Mode sombre</Label>
                  <div className="flex flex-col space-y-2">
                    {logoDarkPreview && (
                      <div className="relative h-20 w-auto border rounded p-2 bg-gray-800">
                        <Image 
                          src={logoDarkPreview} 
                          alt="Logo mode sombre" 
                          width={200}
                          height={80}
                          className="h-full w-auto object-contain"
                        />
                      </div>
                    )}
                    <Input
                      id="logoDark"
                      type="file"
                      ref={logoDarkInputRef}
                      onChange={handleLogoDarkChange}
                      accept="image/*"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommandé: format PNG ou SVG avec fond transparent, ratio 4:1
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
