"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

export function SettingsSection() {
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Déterminer si l'utilisateur est un administrateur distributeur
  const isDistributorAdmin = true; // Temporairement autoriser tous les utilisateurs distributeurs à modifier les paramètres
  
  // Charger les paramètres du distributeur
  useEffect(() => {
    const loadDistributorSettings = async () => {
      if (!user || user.role !== 'distributor') return;
      
      setIsLoading(true);
      
      try {
        // Récupérer le document du distributeur
        const distributorId = user.distributorId || user.id;
        const distributorDoc = await getDoc(doc(db, 'distributors', distributorId));
        
        if (distributorDoc.exists()) {
          const data = distributorDoc.data();
          setCompanyName(data.companyName || '');
          setLogoUrl(data.logoUrl || null);
        } else {
          // Créer un document par défaut si nécessaire
          await setDoc(doc(db, 'distributors', distributorId), {
            companyName: user.name || '',
            logoUrl: null,
            updatedAt: new Date()
          });
          setCompanyName(user.name || '');
        }
      } catch (err) {
        console.error('Erreur lors du chargement des paramètres:', err);
        toast.error('Impossible de charger les paramètres. Veuillez réessayer plus tard.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDistributorSettings();
  }, [user]);
  
  // Gérer le changement de logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image valide.');
        return;
      }
      
      // Vérifier la taille du fichier (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('L\'image est trop volumineuse. Taille maximale: 2MB.');
        return;
      }
      
      setLogoFile(file);
      
      // Prévisualisation du logo
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Supprimer le logo
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoUrl(null);
  };
  
  // Enregistrer les paramètres
  const handleSaveSettings = async () => {
    if (!user || user.role !== 'distributor') return;
    
    setIsSaving(true);
    
    try {
      const distributorId = user.distributorId || user.id;
      let updatedLogoUrl = logoUrl;
      
      // Si un nouveau logo a été sélectionné, le télécharger
      if (logoFile) {
        const logoRef = ref(storage, `distributors/${distributorId}/logo`);
        try {
          await uploadBytes(logoRef, logoFile);
          updatedLogoUrl = await getDownloadURL(logoRef);
        } catch (err) {
          console.error('Erreur lors du téléchargement du logo:', err);
          toast.error('Impossible de télécharger le logo. Veuillez réessayer plus tard.');
          setIsSaving(false);
          return;
        }
      } else if (logoUrl === null) {
        // Si le logo a été supprimé, supprimer également le fichier dans le stockage
        try {
          const logoRef = ref(storage, `distributors/${distributorId}/logo`);
          await deleteObject(logoRef);
        } catch (err) {
          // Ignorer l'erreur si le fichier n'existe pas
          console.log('Aucun logo à supprimer ou logo déjà supprimé');
        }
      }
      
      // Mettre à jour les paramètres dans Firestore
      await setDoc(doc(db, 'distributors', distributorId), {
        companyName,
        logoUrl: updatedLogoUrl,
        updatedAt: new Date()
      });
      
      toast.success('Paramètres enregistrés avec succès.');
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement des paramètres:', err);
      toast.error('Impossible d\'enregistrer les paramètres. Veuillez réessayer plus tard.');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!user || user.role !== 'distributor') {
    return <div>Accès non autorisé</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Paramètres</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Personnalisation</CardTitle>
          <CardDescription>
            Personnalisez votre espace distributeur en ajoutant votre nom d&apos;entreprise et votre logo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <p>Chargement des paramètres...</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nom de votre entreprise"
                  disabled={!isDistributorAdmin || isSaving}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logo">Logo de l&apos;entreprise</Label>
                <div className="flex items-center space-x-4">
                  {logoUrl ? (
                    <div className="relative h-16 w-32 overflow-hidden rounded-md border">
                      <Image
                        src={logoUrl}
                        alt="Logo de l'entreprise"
                        className="h-full w-full object-contain"
                        width={32}
                        height={16}
                      />
                      {isDistributorAdmin && (
                        <button
                          type="button"
                          className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-white"
                          onClick={handleRemoveLogo}
                          disabled={isSaving}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-16 w-32 items-center justify-center rounded-md border border-dashed">
                      <p className="text-xs text-muted-foreground">Aucun logo</p>
                    </div>
                  )}
                  
                  {isDistributorAdmin && (
                    <div>
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                        disabled={isSaving}
                      />
                      <Label
                        htmlFor="logo"
                        className="flex cursor-pointer items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {logoUrl ? 'Changer le logo' : 'Ajouter un logo'}
                      </Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Format recommandé: PNG ou JPG, max 2MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          {isDistributorAdmin && (
            <Button
              onClick={handleSaveSettings}
              disabled={isLoading || isSaving}
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
