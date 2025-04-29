"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmailSettingsForm } from './email-settings-form';
import { EmailTemplatesList } from './email-templates-list';
import { EmailTemplateEditor } from './email-template-editor';
import { ResendConfigChecker } from './resend-config-checker';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export interface EmailSettings {
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  defaultDomain: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  html: string;
  lastUpdated: Date;
  type: 'password-reset' | 'installer-invitation' | 'user-invitation' | 'distributor-invitation' | 'document-sharing';
}

// Paramètres par défaut pour les emails
const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  fromEmail: 'notifications@votredomaine.com',
  fromName: 'DataCop',
  replyToEmail: '',
  defaultDomain: 'votredomaine.com'
};

export function EmailManagement() {
  const [activeTab, setActiveTab] = useState('settings');
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(DEFAULT_EMAIL_SETTINGS);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEmailSettings = useCallback(async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'email_settings'));
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data() as EmailSettings;
        setEmailSettings(data);
      } else {
        // Créer les paramètres par défaut s'ils n'existent pas
        await setDoc(doc(db, 'settings', 'email_settings'), DEFAULT_EMAIL_SETTINGS);
        setEmailSettings(DEFAULT_EMAIL_SETTINGS);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres email:', error);
      toast.error('Impossible de charger les paramètres email');
    } finally {
      setLoading(false);
    }
  }, []); // Retirer emailSettings des dépendances

  const createDefaultTemplates = useCallback(async () => {
    const defaultTemplates: Omit<EmailTemplate, 'id'>[] = [
      {
        name: 'Réinitialisation de mot de passe',
        subject: 'Réinitialisation de votre mot de passe DataCop',
        description: "Email envoyé lorsqu'un utilisateur demande à réinitialiser son mot de passe",
        html: `<div>
          <h1>Réinitialisation de votre mot de passe</h1>
          <p>Bonjour {{userName}},</p>
          <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte DataCop.</p>
          <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
          <p><a href="{{resetLink}}">Réinitialiser mon mot de passe</a></p>
          <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
          <p>Cordialement,<br>L'équipe DataCop</p>
        </div>`,
        lastUpdated: new Date(),
        type: 'password-reset'
      },
      {
        name: 'Invitation installateur',
        subject: "Invitation à rejoindre DataCop en tant qu'installateur",
        description: "Email envoyé pour inviter un nouvel installateur à rejoindre la plateforme",
        html: `<div>
          <h1>Invitation à rejoindre DataCop</h1>
          <p>Bonjour,</p>
          <p>Vous avez été invité(e) à rejoindre DataCop en tant qu'installateur.</p>
          <p>Cliquez sur le lien ci-dessous pour créer votre compte :</p>
          <p><a href="{{invitationLink}}">Créer mon compte installateur</a></p>
          <p>Cette invitation expire dans 7 jours.</p>
          <p>Cordialement,<br>L'équipe DataCop</p>
        </div>`,
        lastUpdated: new Date(),
        type: 'installer-invitation'
      },
      {
        name: 'Invitation utilisateur',
        subject: 'Invitation à rejoindre DataCop',
        description: "Email envoyé pour inviter un nouvel utilisateur à rejoindre la plateforme",
        html: `<div>
          <h1>Invitation à rejoindre DataCop</h1>
          <p>Bonjour,</p>
          <p>{{senderName}} vous a invité(e) à rejoindre DataCop.</p>
          <p>Cliquez sur le lien ci-dessous pour créer votre compte :</p>
          <p><a href="{{invitationLink}}">Créer mon compte</a></p>
          <p>Cette invitation expire dans 7 jours.</p>
          <p>Cordialement,<br>L'équipe DataCop</p>
        </div>`,
        lastUpdated: new Date(),
        type: 'user-invitation'
      },
      {
        name: 'Invitation distributeur',
        subject: 'Invitation à rejoindre DataCop en tant que distributeur',
        description: "Email envoyé pour inviter un nouveau distributeur à rejoindre la plateforme",
        html: `<div>
          <h1>Invitation à rejoindre DataCop</h1>
          <p>Bonjour,</p>
          <p>Vous avez été invité(e) à rejoindre DataCop en tant que distributeur.</p>
          <p>Cliquez sur le lien ci-dessous pour créer votre compte :</p>
          <p><a href="{{invitationLink}}">Créer mon compte distributeur</a></p>
          <p>Cette invitation expire dans 7 jours.</p>
          <p>Cordialement,<br>L'équipe DataCop</p>
        </div>`,
        lastUpdated: new Date(),
        type: 'distributor-invitation'
      },
      {
        name: 'Partage de document',
        subject: '{{senderName}} a partagé un document avec vous',
        description: "Email envoyé lorsqu'un utilisateur partage un document",
        html: `<div>
          <h1>Un document a été partagé avec vous</h1>
          <p>Bonjour,</p>
          <p>{{senderName}} a partagé le document "{{documentName}}" avec vous.</p>
          <p>Cliquez sur le lien ci-dessous pour y accéder :</p>
          <p><a href="{{documentLink}}">Accéder au document</a></p>
          <p>Cordialement,<br>L'équipe DataCop</p>
        </div>`,
        lastUpdated: new Date(),
        type: 'document-sharing'
      }
    ];

    try {
      for (const template of defaultTemplates) {
        await setDoc(doc(db, 'email_templates', template.type), template);
      }
      toast.success("Templates d'email par défaut créés");
      return true;
    } catch (error) {
      console.error('Erreur lors de la création des templates par défaut:', error);
      toast.error('Impossible de créer les templates par défaut');
      return false;
    }
  }, []);

  const fetchEmailTemplates = useCallback(async () => {
    try {
      const templatesQuery = collection(db, 'email_templates');
      const querySnapshot = await getDocs(templatesQuery);
      
      const templates: EmailTemplate[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        templates.push({
          id: doc.id,
          name: data.name,
          subject: data.subject,
          description: data.description,
          html: data.html,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
          type: data.type
        });
      });
      
      setEmailTemplates(templates);

      // Si aucun template n'existe, créer les templates par défaut
      if (templates.length === 0) {
        await createDefaultTemplates();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des templates email:', error);
      toast.error('Impossible de charger les templates email');
    }
  }, [createDefaultTemplates]);

  useEffect(() => {
    fetchEmailSettings();
    fetchEmailTemplates();
  }, [fetchEmailSettings, fetchEmailTemplates]);

  const handleSaveSettings = async (settings: EmailSettings) => {
    try {
      setLoading(true);
      console.log('Tentative de sauvegarde des paramètres email:', settings);
      
      // Sauvegarder dans Firestore
      await setDoc(doc(db, 'settings', 'email_settings'), {
        ...settings,
        updatedAt: new Date() // Ajouter un timestamp pour forcer la mise à jour
      });
      
      // Mettre à jour l'état local
      setEmailSettings(settings);
      console.log('Paramètres email enregistrés avec succès');
      toast.success('Paramètres email enregistrés avec succès');
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des paramètres email:", error);
      toast.error("Impossible d'enregistrer les paramètres email");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setActiveTab('editor');
  };

  const handleSaveTemplate = async (template: EmailTemplate) => {
    try {
      setLoading(true);
      const updatedTemplate = {
        ...template,
        lastUpdated: new Date()
      };
      
      // Sauvegarder dans Firestore
      await setDoc(doc(db, 'email_templates', template.id), updatedTemplate);
      
      toast.success('Template email enregistré avec succès');
      setSelectedTemplate(null);
      setActiveTab('templates');
      
      // Recharger les templates pour mettre à jour la liste
      await fetchEmailTemplates();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du template email:", error);
      toast.error("Impossible d'enregistrer le template email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gestion des emails</CardTitle>
        <CardDescription>
          Configurez les paramètres d'envoi d'emails et personnalisez les templates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResendConfigChecker />
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            {selectedTemplate && (
              <TabsTrigger value="editor">Éditeur</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="settings">
            <EmailSettingsForm 
              settings={emailSettings} 
              onSave={handleSaveSettings} 
              loading={loading} 
            />
          </TabsContent>
          
          <TabsContent value="templates">
            <EmailTemplatesList 
              templates={emailTemplates} 
              onSelectTemplate={handleSelectTemplate} 
              loading={loading} 
            />
          </TabsContent>
          
          <TabsContent value="editor">
            {selectedTemplate && (
              <EmailTemplateEditor 
                template={selectedTemplate} 
                onSave={handleSaveTemplate} 
                onCancel={() => {
                  setSelectedTemplate(null);
                  setActiveTab('templates');
                }} 
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
