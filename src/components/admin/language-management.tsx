"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Language } from '@/lib/types';
import { Trash2, Plus, Check } from 'lucide-react';

interface LanguageManagementProps {
  languages?: Language[];
  onLanguagesUpdated?: () => void;
}

export function LanguageManagement({ languages: propLanguages, onLanguagesUpdated }: LanguageManagementProps) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLanguageName, setNewLanguageName] = useState('');
  const [newLanguageCode, setNewLanguageCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  
  // Fonction pour récupérer les langues depuis Firestore
  const fetchLanguages = useCallback(async () => {
    setLoading(true);
    try {
      const languagesQuery = query(collection(db, 'languages'));
      const querySnapshot = await getDocs(languagesQuery);
      
      const languagesList: Language[] = [];
      querySnapshot.forEach((doc) => {
        const languageData = doc.data();
        languagesList.push({
          id: doc.id,
          name: languageData.name,
          code: languageData.code,
          isDefault: languageData.isDefault || false,
          createdAt: languageData.createdAt?.toDate() || new Date(),
          accessRoles: languageData.accessRoles || ['admin'],
        });
      });
      
      setLanguages(languagesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des langues:', error);
      toast.error('Erreur lors du chargement des langues');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Utiliser les langues fournies en props si disponibles
  useEffect(() => {
    if (propLanguages && propLanguages.length > 0) {
      setLanguages(propLanguages);
    } else {
      fetchLanguages();
    }
  }, [propLanguages, fetchLanguages]);
  
  // Charger les langues au chargement du composant si aucune n'est fournie en props
  useEffect(() => {
    if (!propLanguages) {
      fetchLanguages();
    }
  }, [propLanguages, fetchLanguages]);

  // Fonction pour ajouter une nouvelle langue
  const handleAddLanguage = async () => {
    if (!newLanguageName.trim() || !newLanguageCode.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    try {
      // Vérifier si une langue avec le même code existe déjà
      const existingQuery = query(
        collection(db, 'languages'),
        where('code', '==', newLanguageCode.toLowerCase())
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        toast.error(`Une langue avec le code '${newLanguageCode}' existe déjà`);
        return;
      }
      
      // Si c'est la langue par défaut, mettre à jour les autres langues
      if (isDefault) {
        const languagesRef = collection(db, 'languages');
        const defaultLangQuery = query(languagesRef, where('isDefault', '==', true));
        const defaultLangSnapshot = await getDocs(defaultLangQuery);
        
        // Mettre à jour toutes les langues par défaut existantes
        const updatePromises: Promise<void>[] = [];
        defaultLangSnapshot.forEach((document) => {
          updatePromises.push(
            updateDoc(doc(db, 'languages', document.id), {
              isDefault: false
            })
          );
        });
        
        await Promise.all(updatePromises);
      }
      
      // Ajouter la nouvelle langue
      await addDoc(collection(db, 'languages'), {
        name: newLanguageName,
        code: newLanguageCode.toLowerCase(),
        isDefault: isDefault,
        createdAt: serverTimestamp(),
        accessRoles: ['admin', 'user', 'distributor', 'installer']
      });
      
      toast.success('Langue ajoutée avec succès');
      setNewLanguageName('');
      setNewLanguageCode('');
      setIsDefault(false);
      setShowAddDialog(false);
      
      // Mettre à jour la liste des langues
      fetchLanguages();
      
      // Appeler le callback si fourni
      if (onLanguagesUpdated) {
        onLanguagesUpdated();
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la langue:', error);
      toast.error('Erreur lors de l\'ajout de la langue');
    }
  };
  
  // Fonction pour supprimer une langue
  const handleDeleteLanguage = async (languageId: string, isDefaultLang: boolean) => {
    if (isDefaultLang) {
      toast.error('Impossible de supprimer la langue par défaut');
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'languages', languageId));
      toast.success('Langue supprimée avec succès');
      
      // Mettre à jour la liste des langues
      fetchLanguages();
      
      // Appeler le callback si fourni
      if (onLanguagesUpdated) {
        onLanguagesUpdated();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la langue:', error);
      toast.error('Erreur lors de la suppression de la langue');
    }
  };
  
  // Fonction pour définir une langue comme langue par défaut
  const handleSetDefaultLanguage = async (languageId: string) => {
    try {
      // Mettre à jour toutes les langues pour qu'elles ne soient plus par défaut
      const languagesRef = collection(db, 'languages');
      const defaultLangQuery = query(languagesRef, where('isDefault', '==', true));
      const defaultLangSnapshot = await getDocs(defaultLangQuery);
      
      const updatePromises: Promise<void>[] = [];
      defaultLangSnapshot.forEach((document) => {
        updatePromises.push(
          updateDoc(doc(db, 'languages', document.id), {
            isDefault: false
          })
        );
      });
      
      await Promise.all(updatePromises);
      
      // Définir la langue sélectionnée comme langue par défaut
      await updateDoc(doc(db, 'languages', languageId), {
        isDefault: true
      });
      
      toast.success('Langue par défaut mise à jour');
      
      // Mettre à jour la liste des langues
      fetchLanguages();
      
      // Appeler le callback si fourni
      if (onLanguagesUpdated) {
        onLanguagesUpdated();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la langue par défaut:', error);
      toast.error('Erreur lors de la mise à jour de la langue par défaut');
    }
  };
  
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gestion des langues</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter une langue
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Langues disponibles</CardTitle>
          <CardDescription>Gérer les langues pour les documents</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Chargement des langues...
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="grid grid-cols-4 border-b bg-muted/50 p-3 font-medium">
                <div>Nom</div>
                <div>Code</div>
                <div>Par défaut</div>
                <div>Actions</div>
              </div>
              {languages.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Aucune langue trouvée. Ajoutez votre première langue.
                </div>
              ) : (
                <div className="divide-y">
                  {languages.map((language) => (
                    <div key={language.id} className="grid grid-cols-4 p-3 items-center">
                      <div className="font-medium">{language.name}</div>
                      <div className="text-sm">{language.code}</div>
                      <div>
                        {language.isDefault ? (
                          <div className="flex items-center text-primary">
                            <Check className="mr-1 h-4 w-4" />
                            <span className="text-xs">Par défaut</span>
                          </div>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSetDefaultLanguage(language.id)}
                          >
                            Définir par défaut
                          </Button>
                        )}
                      </div>
                      <div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteLanguage(language.id, language.isDefault)}
                          disabled={language.isDefault}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Dialog pour ajouter une nouvelle langue */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une nouvelle langue</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour ajouter une nouvelle langue.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="languageName">Nom de la langue</Label>
              <Input 
                id="languageName" 
                placeholder="Français" 
                value={newLanguageName}
                onChange={(e) => setNewLanguageName(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="languageCode">Code de la langue</Label>
              <Input 
                id="languageCode" 
                placeholder="fr" 
                value={newLanguageCode}
                onChange={(e) => setNewLanguageCode(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Code ISO 639-1 de la langue (ex: fr, en, de)
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isDefault" 
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked === true)}
              />
              <Label htmlFor="isDefault">Définir comme langue par défaut</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddLanguage}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
