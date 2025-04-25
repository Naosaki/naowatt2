"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';

interface ConfigStatus {
  success: boolean;
  config: {
    RESEND_API_KEY: string;
    EMAIL_FROM_ADDRESS: string;
    EMAIL_FROM_NAME: string;
    NEXT_PUBLIC_APP_URL: string;
  };
  resendConnection: string;
  error: string | null;
}

export function ResendConfigChecker() {
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const checkConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/email/check-config');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Erreur lors de la vérification de la configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConfig();
  }, []);

  const getStatusIcon = (value: string) => {
    if (value.includes('é')) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const isConfigured = status?.config?.RESEND_API_KEY?.includes('é');

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Configuration Resend</CardTitle>
            <CardDescription>
              Vérifiez la configuration de Resend pour l&apos;envoi d&apos;emails personnalisés
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={checkConfig} disabled={loading}>
            {loading ? 'Vérification...' : 'Vérifier'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {status ? (
          <div className="space-y-4">
            {!isConfigured && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Clé API Resend manquante</AlertTitle>
                <AlertDescription>
                  La clé API Resend n&apos;est pas configurée. Les emails personnalisés ne peuvent pas être envoyés.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(status.config.RESEND_API_KEY)}
                <span>Clé API Resend</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.config.EMAIL_FROM_ADDRESS)}
                <span>Adresse d&apos;expéditeur</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.config.EMAIL_FROM_NAME)}
                <span>Nom d&apos;expéditeur</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.config.NEXT_PUBLIC_APP_URL)}
                <span>URL de l&apos;application</span>
              </div>
            </div>

            {status.resendConnection && (
              <div className="flex items-center gap-2 mt-2">
                {status.resendConnection.includes('é') ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span>Connexion à Resend: {status.resendConnection}</span>
              </div>
            )}

            {status.error && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{status.error}</AlertDescription>
              </Alert>
            )}

            <Button 
              variant="ghost" 
              className="p-0 h-auto text-sm text-muted-foreground" 
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Masquer les instructions' : 'Afficher les instructions de configuration'}
            </Button>

            {expanded && (
              <div className="mt-4 space-y-4 text-sm">
                <h3 className="font-medium">Comment configurer Resend :</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Créez un compte sur <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center">Resend.com <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                  <li>Générez une clé API dans votre tableau de bord Resend</li>
                  <li>Ajoutez la clé API dans votre fichier <code>.env.local</code> :</li>
                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                    RESEND_API_KEY=re_votre_clé_api
                  </pre>
                  <li>Configurez les autres variables d&apos;environnement :</li>
                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                    EMAIL_FROM_ADDRESS=notifications@votredomaine.com
                    EMAIL_FROM_NAME=DataCop
                    NEXT_PUBLIC_APP_URL=https://votre-app.com
                  </pre>
                  <li>Redémarrez votre application pour appliquer les changements</li>
                </ol>
                <p>Pour plus d&apos;informations, consultez la <a href="https://resend.com/docs" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center">documentation Resend <ExternalLink className="h-3 w-3 ml-1" /></a></p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Vérification de la configuration...</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          La clé API Resend est nécessaire pour envoyer des emails personnalisés avec vos templates.
        </p>
      </CardFooter>
    </Card>
  );
}
