"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmailTemplate } from './email-management';

interface EmailTemplateEditorProps {
  template: EmailTemplate;
  onSave: (template: EmailTemplate) => void;
  onCancel: () => void;
}

export function EmailTemplateEditor({ template, onSave, onCancel }: EmailTemplateEditorProps) {
  const [formData, setFormData] = useState<EmailTemplate>({ ...template });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  // Obtenir les variables disponibles pour ce type de template
  const getAvailableVariables = () => {
    switch (formData.type) {
      case 'password-reset':
        return ['{{userName}}', '{{resetLink}}'];
      case 'installer-invitation':
      case 'distributor-invitation':
        return ['{{invitationLink}}'];
      case 'user-invitation':
        return ['{{senderName}}', '{{invitationLink}}'];
      case 'document-sharing':
        return ['{{senderName}}', '{{documentName}}', '{{documentLink}}'];
      default:
        return [];
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Modifier le template</CardTitle>
          <CardDescription>
            Personnalisez le contenu et l&apos;apparence du template d&apos;email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du template</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">Objet de l&apos;email</Label>
            <Input
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
            />
            <p className="text-sm text-muted-foreground">
              L&apos;objet qui apparaîtra dans la boîte de réception du destinataire
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
            <p className="text-sm text-muted-foreground">
              Description interne du template (non visible par les destinataires)
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="html">Contenu HTML</Label>
              <div className="text-sm text-muted-foreground">
                Variables disponibles: {getAvailableVariables().join(', ')}
              </div>
            </div>
            <Textarea
              id="html"
              name="html"
              value={formData.html}
              onChange={handleChange}
              className="min-h-[300px] font-mono text-sm"
              required
            />
            <p className="text-sm text-muted-foreground">
              Utilisez les variables entre doubles accolades pour personnaliser le contenu
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer le template'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
