"use client";

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Box, Settings, Globe, BarChart, Mail, Package, Users, FileText } from 'lucide-react';
import { AppLogo } from '@/components/app-logo';
import { CategoryManagement } from '@/components/admin/category-management';
import { ProductTypeManagement } from '@/components/admin/product-type-management';
import { LanguageManagement } from '@/components/admin/language-management';
import { EmailManagement } from '@/components/admin/email-management/email-management';
import { AppSettingsManagement } from '@/components/admin/app-settings-management';
import { DashboardOverview } from '@/components/admin/dashboard-overview';
import ProductManagement from "@/components/admin/product-management";
import DistributorManagement from "@/components/admin/distributor-management";
import UserManagement from "@/components/admin/user-management";
import DocumentManagement from "@/components/admin/document-management";
import { UserProfileMenu } from '@/components/user-profile-menu';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Chargement...</h2>
          <p className="text-muted-foreground">Veuillez patienter pendant le chargement de l'interface d'administration.</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Accès refusé</h2>
          <p className="text-muted-foreground">Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>
          <Button className="mt-4" onClick={() => window.location.href = '/'}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center">
            <AppLogo height={40} />
          </div>
          <div className="flex items-center gap-4">
            <UserProfileMenu user={user} />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-muted/20 p-4">
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${activeTab === 'dashboard' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <BarChart className="mr-2 h-4 w-4" />
              Tableau de bord
            </button>
            <button 
              onClick={() => setActiveTab('documents')}
              className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${activeTab === 'documents' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </button>
            <button 
              onClick={() => setActiveTab('categories')}
              className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${activeTab === 'categories' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Box className="mr-2 h-4 w-4" />
              Catégories
            </button>
            <button 
              onClick={() => setActiveTab('productTypes')}
              className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${activeTab === 'productTypes' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Box className="mr-2 h-4 w-4" />
              Types de produits
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${activeTab === 'products' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Package className="mr-2 h-4 w-4" />
              Produits
            </button>
            <button 
              onClick={() => setActiveTab('languages')}
              className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${activeTab === 'languages' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Globe className="mr-2 h-4 w-4" />
              Langues
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${activeTab === 'users' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Users className="mr-2 h-4 w-4" />
              Utilisateurs
            </button>
            <button 
              onClick={() => setActiveTab('distributors')}
              className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${activeTab === 'distributors' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Users className="mr-2 h-4 w-4" />
              Distributeurs
            </button>
            <button 
              onClick={() => setActiveTab('emails')}
              className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${activeTab === 'emails' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Mail className="mr-2 h-4 w-4" />
              Emails
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${activeTab === 'settings' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              {activeTab === 'dashboard' && 'Tableau de bord administrateur'}
              {activeTab === 'documents' && 'Gestion des documents'}
              {activeTab === 'categories' && 'Gestion des catégories'}
              {activeTab === 'productTypes' && 'Gestion des types de produits'}
              {activeTab === 'products' && 'Gestion des produits'}
              {activeTab === 'languages' && 'Gestion des langues'}
              {activeTab === 'users' && 'Gestion des utilisateurs'}
              {activeTab === 'distributors' && 'Gestion des distributeurs'}
              {activeTab === 'emails' && 'Gestion des emails'}
              {activeTab === 'settings' && 'Paramètres de l\'application'}
            </h1>
            <p className="text-muted-foreground">
              {activeTab === 'dashboard' && 'Gérez les utilisateurs, les documents et les paramètres du système'}
              {activeTab === 'documents' && 'Gérez les documents disponibles sur la plateforme'}
              {activeTab === 'categories' && 'Gérez les catégories de documents'}
              {activeTab === 'productTypes' && 'Gérez les types de produits disponibles'}
              {activeTab === 'products' && 'Gérez les produits disponibles sur la plateforme'}
              {activeTab === 'languages' && 'Gérez les langues disponibles pour les documents'}
              {activeTab === 'users' && 'Ajoutez, modifiez ou supprimez des utilisateurs'}
              {activeTab === 'distributors' && 'Gérez les comptes distributeurs et leurs équipes'}
              {activeTab === 'emails' && 'Configurez et personnalisez les modèles d\'emails'}
              {activeTab === 'settings' && 'Configurez les paramètres généraux de l\'application'}
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="dashboard" className="mt-0 space-y-4">
              <DashboardOverview />
            </TabsContent>
            <TabsContent value="documents" className="mt-0 space-y-4">
              <DocumentManagement />
            </TabsContent>
            <TabsContent value="categories" className="mt-0 space-y-4">
              <CategoryManagement />
            </TabsContent>
            <TabsContent value="productTypes" className="mt-0 space-y-4">
              <ProductTypeManagement />
            </TabsContent>
            <TabsContent value="products" className="mt-0 space-y-4">
              <ProductManagement />
            </TabsContent>
            <TabsContent value="languages" className="mt-0 space-y-4">
              <LanguageManagement />
            </TabsContent>
            <TabsContent value="users" className="mt-0 space-y-4">
              <UserManagement />
            </TabsContent>
            <TabsContent value="distributors" className="mt-0 space-y-4">
              <DistributorManagement />
            </TabsContent>
            <TabsContent value="emails" className="mt-0 space-y-4">
              <EmailManagement />
            </TabsContent>
            <TabsContent value="settings" className="mt-0 space-y-4">
              <AppSettingsManagement />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
