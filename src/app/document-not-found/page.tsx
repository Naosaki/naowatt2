"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLogo } from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Footer } from '@/components/footer';

export default function DocumentNotFoundPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p>Chargement...</p></div>}>
      <DocumentNotFoundContent />
    </Suspense>
  );
}

function DocumentNotFoundContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [documentName, setDocumentName] = useState<string>('');
  const [documentId, setDocumentId] = useState<string>('');
  
  useEffect(() => {
    // Récupérer les paramètres de l'URL
    const name = searchParams.get('name');
    const id = searchParams.get('id');
    
    if (name) {
      setDocumentName(name);
    }
    
    if (id) {
      setDocumentId(id);
    }
  }, [searchParams]);
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center">
            <AppLogo height={40} />
          </div>
        </div>
      </header>
      
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="mx-auto max-w-md rounded-lg border bg-card p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          
          <h1 className="mb-2 text-center text-2xl font-bold">Document non disponible</h1>
          
          <p className="mb-6 text-center text-muted-foreground">
            {documentName ? (
              <>Le document <span className="font-medium">{documentName}</span> n&apos;est plus disponible.</>
            ) : (
              <>Ce document n&apos;est plus disponible.</>
            )}
          </p>
          
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Il est possible que ce document ait été supprimé ou déplacé. 
            {documentId && (
              <> Référence du document: <code className="bg-muted px-1 py-0.5 rounded text-xs">{documentId}</code>.</>  
            )}
            <br />
            Veuillez contacter votre administrateur si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
          </p>
          
          <div className="flex flex-col gap-3">
            <Button 
              variant="default" 
              className="w-full" 
              onClick={() => router.push('/dashboard-user?tab=documents')}
            >
              Retourner à la bibliothèque de documents
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full" 
              asChild
            >
              <Link href="/dashboard-user?tab=downloads">
                Voir mes téléchargements
              </Link>
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
