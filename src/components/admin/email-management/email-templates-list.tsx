"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmailTemplate } from './email-management';
import { Skeleton } from '@/components/ui/skeleton';
import { FileEdit, Eye } from 'lucide-react';

interface EmailTemplatesListProps {
  templates: EmailTemplate[];
  onSelectTemplate: (template: EmailTemplate) => void;
  loading: boolean;
}

export function EmailTemplatesList({ templates, onSelectTemplate, loading }: EmailTemplatesListProps) {
  // Fonction pour obtenir le nom lisible du type de template
  const getTemplateTypeName = (type: EmailTemplate['type']) => {
    const typeMap: Record<EmailTemplate['type'], string> = {
      'password-reset': 'Réinitialisation de mot de passe',
      'installer-invitation': 'Invitation installateur',
      'user-invitation': 'Invitation utilisateur',
      'distributor-invitation': 'Invitation distributeur',
      'document-sharing': 'Partage de document'
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="border rounded-md p-4">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex justify-end">
                  <Skeleton className="h-9 w-20 mr-2" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Templates d&apos;emails</CardTitle>
        <CardDescription>
          Personnalisez les templates utilisés pour les différents types d&apos;emails
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {templates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun template trouvé. Créez des templates pour commencer.
            </p>
          ) : (
            templates.map(template => (
              <div key={template.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {getTemplateTypeName(template.type)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="text-xs text-muted-foreground">
                    Dernière modification: {template.lastUpdated.toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`/api/email/preview/${template.id}`, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Aperçu
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => onSelectTemplate(template)}
                    >
                      <FileEdit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
