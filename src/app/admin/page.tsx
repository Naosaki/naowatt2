"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { AddUserDialog } from '@/components/admin/add-user-dialog';
import { AddDocumentDialog } from '@/components/admin/add-document-dialog';
import { EditDocumentDialog } from '@/components/admin/edit-document-dialog';
import { ViewUserDialog } from '@/components/admin/view-user-dialog';
import { EditUserDialog } from '@/components/admin/edit-user-dialog';
import { collection, getDocs, query, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, deleteObject } from 'firebase/storage';
import { User, Document as DocumentType, Category, ProductType, Language, AppSettings } from '@/lib/types';
import { UserProfileMenu } from '@/components/user-profile-menu';
import { CategoryManagement } from '@/components/admin/category-management';
import { ProductTypeManagement } from '@/components/admin/product-type-management';
import { LanguageManagement } from '@/components/admin/language-management';
import { AppSettingsManagement } from '@/components/admin/app-settings-management';
import { DashboardOverview } from '@/components/admin/dashboard-overview';
import { Eye, FileEdit, Trash2, Box, Settings, Globe, BarChart } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AppLogo } from '@/components/app-logo';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<DocumentType | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [userToView, setUserToView] = useState<User | null>(null);
  const [showViewUserDialog, setShowViewUserDialog] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    console.log('AdminPage - État de chargement:', loading);
    console.log('AdminPage - Utilisateur:', user);
    
    if (!loading && !user) {
      console.log('AdminPage - Aucun utilisateur, redirection vers /login');
      window.location.href = '/login';
      return;
    }

    // Vérification du rôle simplifiée pour débogage
    if (!loading && user) {
      console.log(`AdminPage - Utilisateur connecté avec le rôle: ${user.role}`);
      // Nous permettons temporairement à tous les utilisateurs d'accéder à l'interface admin
    }
  }, [user, loading]);

  // Charger les données en fonction de l'onglet actif
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'documents') {
      fetchDocuments();
      fetchCategories();
      fetchProductTypes();
      fetchLanguages();
    } else if (activeTab === 'languages') {
      fetchLanguages();
    }
  }, [activeTab]);

  // Charger les paramètres de l'application
  useEffect(() => {
    const fetchAppSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'app_settings'));
        
        if (settingsDoc.exists()) {
          const settingsData = settingsDoc.data() as AppSettings;
          setAppSettings(settingsData);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres de l\'application:', error);
      }
    };

    fetchAppSettings();
  }, []);

  // Fonction pour récupérer la liste des utilisateurs depuis Firestore
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersQuery = query(collection(db, 'users'));
      const querySnapshot = await getDocs(usersQuery);
      
      const usersList: User[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        usersList.push({
          uid: doc.id,
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          role: userData.role,
          createdAt: userData.createdAt?.toDate() || new Date(),
          lastLogin: userData.lastLogin?.toDate() || new Date(),
        });
      });
      
      console.log('Utilisateurs chargés:', usersList);
      setUsers(usersList);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      toast.error('Impossible de charger la liste des utilisateurs');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fonction pour récupérer les catégories depuis Firestore
  const fetchCategories = async () => {
    try {
      const categoriesQuery = query(collection(db, 'categories'));
      const querySnapshot = await getDocs(categoriesQuery);
      
      const categoriesList: Category[] = [];
      querySnapshot.forEach((doc) => {
        const categoryData = doc.data();
        categoriesList.push({
          id: doc.id,
          name: categoryData.name,
          description: categoryData.description || '',
          createdAt: categoryData.createdAt?.toDate() || new Date(),
          accessRoles: categoryData.accessRoles || ['admin'],
        });
      });
      
      console.log('Catégories chargées:', categoriesList);
      setCategories(categoriesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
    }
  };

  // Fonction pour récupérer les types de produits depuis Firestore
  const fetchProductTypes = async () => {
    try {
      const productTypesQuery = query(collection(db, 'productTypes'));
      const querySnapshot = await getDocs(productTypesQuery);
      
      const productTypesList: ProductType[] = [];
      querySnapshot.forEach((doc) => {
        const productTypeData = doc.data();
        productTypesList.push({
          id: doc.id,
          name: productTypeData.name,
          description: productTypeData.description || '',
          createdAt: productTypeData.createdAt?.toDate() || new Date(),
          accessRoles: productTypeData.accessRoles || ['admin'],
        });
      });
      
      console.log('Types de produits chargés:', productTypesList);
      setProductTypes(productTypesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des types de produits:', error);
    }
  };

  // Fonction pour récupérer les langues depuis Firestore
  const fetchLanguages = async () => {
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
      
      console.log('Langues chargées:', languagesList);
      setLanguages(languagesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des langues:', error);
    }
  };

  // Fonction pour récupérer la liste des documents depuis Firestore
  const fetchDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const documentsQuery = query(collection(db, 'documents'));
      const querySnapshot = await getDocs(documentsQuery);
      
      const documentsList: DocumentType[] = [];
      querySnapshot.forEach((doc) => {
        const documentData = doc.data();
        documentsList.push({
          id: doc.id,
          name: documentData.name,
          description: documentData.description,
          fileUrl: documentData.fileUrl,
          fileType: documentData.fileType,
          fileSize: documentData.fileSize,
          uploadedBy: documentData.uploadedBy,
          uploadedAt: documentData.uploadedAt?.toDate() || new Date(),
          category: documentData.category,
          productType: documentData.productType || '',
          language: documentData.language || '',
          accessRoles: documentData.accessRoles || ['admin'],
          version: documentData.version || '1.0',
        });
      });
      
      console.log('Documents chargés:', documentsList);
      setDocuments(documentsList);
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      toast.error('Impossible de charger la liste des documents');
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Fonction pour obtenir le nom d'une catégorie à partir de son ID
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'N/A';
  };

  // Fonction pour obtenir le nom du type de produit à partir de son ID
  const getProductTypeName = (productTypeId: string): string => {
    const productType = productTypes.find(type => type.id === productTypeId);
    return productType ? productType.name : 'N/A';
  };

  // Fonction pour obtenir le nom de la langue à partir de son ID
  const getLanguageName = (languageId: string): string => {
    if (!languageId) return 'N/A';
    
    const language = languages.find(lang => lang.id === languageId);
    if (language) {
      return language.code;
    }
    
    // Si l'ID n'est pas trouvé dans la liste des langues, afficher l'ID
    return languageId;
  };

  const handleUserAdded = () => {
    // Recharger la liste des utilisateurs après l'ajout d'un nouvel utilisateur
    fetchUsers();
  };

  const handleDocumentAdded = () => {
    // Recharger la liste des documents après l'ajout d'un nouveau document
    fetchDocuments();
  };

  const handleDeleteDocument = (documentId: string) => {
    setDocumentToDelete(documentId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;

    try {
      // Trouver le document pour obtenir l'URL du fichier
      const documentToDeleteObj = documents.find(doc => doc.id === documentToDelete);
      
      if (!documentToDeleteObj) {
        toast.error('Document introuvable');
        return;
      }
      
      // Supprimer le document de Firestore
      await deleteDoc(doc(db, 'documents', documentToDelete));
      
      // Extraire le chemin du fichier depuis l'URL
      try {
        // L'URL de Firebase Storage est de la forme:
        // https://firebasestorage.googleapis.com/v0/b/[bucket]/o/[path]?token=[token]
        const url = new URL(documentToDeleteObj.fileUrl);
        const fullPath = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);
        
        // Supprimer le fichier de Firebase Storage
        const fileRef = ref(storage, fullPath);
        await deleteObject(fileRef);
        console.log('Fichier supprimé de Firebase Storage:', fullPath);
      } catch (storageError) {
        console.error('Erreur lors de la suppression du fichier dans Storage:', storageError);
        // On continue même si la suppression du fichier échoue
        // pour ne pas bloquer la suppression du document dans Firestore
      }
      
      toast.success('Document supprimé avec succès');
      fetchDocuments();
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      toast.error('Erreur lors de la suppression du document');
    }
  };

  const handleEditDocument = (document: DocumentType) => {
    setDocumentToEdit(document);
    setShowEditDialog(true);
  };

  const handleDocumentUpdated = () => {
    fetchDocuments();
  };

  const handleViewUser = (user: User) => {
    setUserToView(user);
    setShowViewUserDialog(true);
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setShowEditUserDialog(true);
  };

  const handleUserUpdated = () => {
    fetchUsers();
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteUserConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || !user) return;

    try {
      // Trouver l'utilisateur pour afficher un message de confirmation
      const userToDeleteObj = users.find(u => u.uid === userToDelete);
      
      if (!userToDeleteObj) {
        toast.error('Utilisateur introuvable');
        return;
      }
      
      // Appeler l'API pour supprimer l'utilisateur de Firebase Authentication et Firestore
      toast.info('Suppression de l\'utilisateur en cours...');
      
      try {
        const response = await fetch('/api/delete-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userToDelete,
            adminUserId: user.uid, // ID de l'administrateur actuel pour vérification
          }),
        });

        // Vérifier si la réponse est au format JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Réponse non-JSON reçue:', text);
          throw new Error('Réponse invalide du serveur. Veuillez contacter l\'administrateur.');
        }

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors de la suppression de l\'utilisateur');
        }
        
        toast.success(`L'utilisateur ${userToDeleteObj.displayName || userToDeleteObj.email} a été supprimé avec succès`);
        fetchUsers(); // Recharger la liste des utilisateurs
      } catch (apiError) {
        console.error('Erreur API lors de la suppression de l\'utilisateur:', apiError);
        if (apiError instanceof Error) {
          toast.error(apiError.message);
        } else {
          toast.error('Erreur lors de la suppression de l\'utilisateur');
        }
      }
    } catch (error: unknown) {
      console.error('Erreur inattendue lors de la suppression de l\'utilisateur:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'utilisateur';
      toast.error(errorMessage);
    } finally {
      setShowDeleteUserConfirm(false);
      setUserToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Sera redirigé dans useEffect
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Toaster />
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteDocument}
        title="Confirmer la suppression"
        description="Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
      
      <ConfirmDialog
        isOpen={showDeleteUserConfirm}
        onClose={() => setShowDeleteUserConfirm(false)}
        onConfirm={confirmDeleteUser}
        title="Confirmer la suppression de l'utilisateur"
        description="Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible et supprimera toutes les données associées à cet utilisateur."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
      
      {documentToEdit && (
        <EditDocumentDialog
          document={documentToEdit}
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setDocumentToEdit(null);
          }}
          onDocumentUpdated={handleDocumentUpdated}
        />
      )}

      {userToView && (
        <ViewUserDialog
          user={userToView}
          isOpen={showViewUserDialog}
          onClose={() => {
            setShowViewUserDialog(false);
            setUserToView(null);
          }}
        />
      )}

      {userToEdit && (
        <EditUserDialog
          user={userToEdit}
          isOpen={showEditUserDialog}
          onClose={() => {
            setShowEditUserDialog(false);
            setUserToEdit(null);
          }}
          onUserUpdated={handleUserUpdated}
        />
      )}

      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <AppLogo height={40} />
          <UserProfileMenu user={user} />
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card p-4">
          <nav className="space-y-2">
            <Button 
              variant={activeTab === 'dashboard' ? 'default' : 'ghost'} 
              className="w-full justify-start" 
              onClick={() => setActiveTab('dashboard')}
            >
              <BarChart className="h-4 w-4 mr-2" />
              Tableau de bord
            </Button>
            <Button 
              variant={activeTab === 'documents' ? 'default' : 'ghost'} 
              className="w-full justify-start" 
              onClick={() => setActiveTab('documents')}
            >
              <FileEdit className="h-4 w-4 mr-2" />
              Documents
            </Button>
            <Button 
              variant={activeTab === 'categories' ? 'default' : 'ghost'} 
              className="w-full justify-start" 
              onClick={() => setActiveTab('categories')}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Catégories
            </Button>
            <Button 
              variant={activeTab === 'productTypes' ? 'default' : 'ghost'} 
              className="w-full justify-start" 
              onClick={() => setActiveTab('productTypes')}
            >
              <Box className="h-4 w-4 mr-2" />
              Types de produits
            </Button>
            <Button 
              variant={activeTab === 'languages' ? 'default' : 'ghost'} 
              className="w-full justify-start" 
              onClick={() => setActiveTab('languages')}
            >
              <Globe className="h-4 w-4 mr-2" />
              Langues
            </Button>
            <Button 
              variant={activeTab === 'users' ? 'default' : 'ghost'} 
              className="w-full justify-start" 
              onClick={() => setActiveTab('users')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Utilisateurs
            </Button>
            <Button 
              variant={activeTab === 'settings' ? 'default' : 'ghost'} 
              className="w-full justify-start" 
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {activeTab === 'dashboard' && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Tableau de bord</h2>
              </div>
              
              <DashboardOverview />
            </div>
          )}
          
          {activeTab === 'documents' && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Gestion des documents</h2>
                <AddDocumentDialog onDocumentAdded={handleDocumentAdded} />
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Tous les documents</CardTitle>
                  <CardDescription>Gérer tous les documents du système</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingDocuments ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Chargement des documents...
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <div className="grid grid-cols-7 border-b bg-muted/50 p-3 font-medium">
                        <div>Nom</div>
                        <div>Catégorie</div>
                        <div>Type</div>
                        <div>Langue</div>
                        <div>Taille</div>
                        <div>Ajouté le</div>
                        <div>Actions</div>
                      </div>
                      {documents.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Aucun document trouvé. Ajoutez votre premier document.
                        </div>
                      ) : (
                        <div className="divide-y">
                          {documents.map((doc) => (
                            <div key={doc.id} className="grid grid-cols-7 p-3 items-center">
                              <div className="font-medium truncate" title={doc.name}>{doc.name}</div>
                              <div className="text-sm">{getCategoryName(doc.category)}</div>
                              <div className="text-sm">{getProductTypeName(doc.productType)}</div>
                              <div className="text-sm">{getLanguageName(doc.language)}</div>
                              <div className="text-sm">{Math.round(doc.fileSize / 1024)} Ko</div>
                              <div className="text-sm text-muted-foreground">
                                {doc.uploadedAt.toLocaleDateString()}
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => window.open(doc.fileUrl, '_blank')}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEditDocument(doc)}>
                                  <FileEdit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteDocument(doc.id)}>
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
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Gestion des utilisateurs</h2>
                <AddUserDialog onUserAdded={handleUserAdded} />
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Tous les utilisateurs</CardTitle>
                  <CardDescription>Gérer les comptes utilisateurs et les autorisations</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingUsers ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Chargement des utilisateurs...
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <div className="grid grid-cols-5 border-b bg-muted/50 p-3 font-medium">
                        <div>Nom</div>
                        <div>Email</div>
                        <div>Rôle</div>
                        <div>Dernière connexion</div>
                        <div>Actions</div>
                      </div>
                      {users.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Aucun utilisateur trouvé. Ajoutez votre premier utilisateur.
                        </div>
                      ) : (
                        <div className="divide-y">
                          {users.map((user) => (
                            <div key={user.uid} className="grid grid-cols-5 p-3 items-center">
                              <div className="font-medium">{user.displayName || 'N/A'}</div>
                              <div className="text-sm">{user.email}</div>
                              <div>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                  user.role === 'distributor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  user.role === 'installer' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                }`}>
                                  {user.role}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {user.lastLogin.toLocaleDateString()}
                              </div>
                              <div className="flex space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleViewUser(user)}
                                  title="Voir"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEditUser(user)}
                                  title="Éditer"
                                >
                                  <FileEdit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteUser(user.uid)}
                                  className="text-destructive hover:bg-destructive/10"
                                  title="Supprimer"
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
            </div>
          )}

          {activeTab === 'categories' && (
            <CategoryManagement />
          )}

          {activeTab === 'productTypes' && (
            <ProductTypeManagement />
          )}
          
          {activeTab === 'languages' && (
            <LanguageManagement languages={languages} onLanguagesUpdated={fetchLanguages} />
          )}

          {activeTab === 'settings' && (
            <AppSettingsManagement />
          )}
        </main>
      </div>

      <footer className="border-t p-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} {appSettings?.footerText || 'DataWatt - Solar Panel Documentation Portal'}</p>
      </footer>
    </div>
  );
}
