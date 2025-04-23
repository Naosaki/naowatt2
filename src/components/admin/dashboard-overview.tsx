"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, FileText, Download, UserPlus, ArrowUpRight, ArrowDownRight, CalendarIcon } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';

// Types pour les statistiques
type UserStats = {
  total: number;
  admins: number;
  installers: number;
  distributors: number;
  users: number;
  newToday: number;
  growthRate: number;
};

type DocumentStats = {
  total: number;
  byCategory: { name: string; value: number }[];
  byProductType: { name: string; value: number }[];
  byLanguage: { name: string; value: number }[];
};

type DownloadStats = {
  total: number;
  today: number;
  lastWeek: { date: string; count: number }[];
  topDocuments: { name: string; count: number }[];
  growthRate: number;
};

type RegistrationStats = {
  lastWeek: { date: string; count: number }[];
};

export function DashboardOverview() {
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0,
    admins: 0,
    installers: 0,
    distributors: 0,
    users: 0,
    newToday: 0,
    growthRate: 0
  });
  
  const [documentStats, setDocumentStats] = useState<DocumentStats>({
    total: 0,
    byCategory: [],
    byProductType: [],
    byLanguage: []
  });
  
  const [downloadStats, setDownloadStats] = useState<DownloadStats>({
    total: 0,
    today: 0,
    lastWeek: [],
    topDocuments: [],
    growthRate: 0
  });
  
  const [registrationStats, setRegistrationStats] = useState<RegistrationStats>({
    lastWeek: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [date, setDate] = useState<Date>();

  // Couleurs pour les graphiques - palette plus sobre inspirée de Shadcn UI
  const COLORS = ['#a8a29e', '#78716c', '#57534e', '#44403c', '#292524', '#1c1917', '#d6d3d1', '#e7e5e4'];

  const fetchUserStats = useCallback(async () => {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const today = new Date();
    let startDate;
    
    // Déterminer la date de début en fonction de la période sélectionnée
    if (date) {
      startDate = startOfDay(date);
    } else if (dateRange === '7d') {
      startDate = subDays(today, 7);
    } else if (dateRange === '30d') {
      startDate = subDays(today, 30);
    } else {
      startDate = subDays(today, 90);
    }
    
    let admins = 0;
    let installers = 0;
    let distributors = 0;
    let regularUsers = 0;
    let newToday = 0;
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      
      // Compter par rôle
      if (userData.role === 'admin') admins++;
      else if (userData.role === 'installer') installers++;
      else if (userData.role === 'distributor') distributors++;
      else regularUsers++;
      
      // Compter les nouveaux utilisateurs dans la période sélectionnée
      if (userData.createdAt && userData.createdAt.toDate() >= startDate) {
        newToday++;
      }
    });
    
    const total = admins + installers + distributors + regularUsers;
    const growthRate = ((newToday / total) * 100).toFixed(1);
    
    setUserStats({
      total,
      admins,
      installers,
      distributors,
      users: regularUsers,
      newToday,
      growthRate: parseFloat(growthRate)
    });
  }, [date, dateRange]);

  const fetchDocumentStats = useCallback(async () => {
    const docsRef = collection(db, 'documents');
    const docsSnapshot = await getDocs(docsRef);
    
    const categoryMap = new Map<string, number>();
    const productTypeMap = new Map<string, number>();
    const languageMap = new Map<string, number>();
    
    // Récupérer les noms des catégories, types de produits et langues
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    const productTypesSnapshot = await getDocs(collection(db, 'productTypes'));
    const languagesSnapshot = await getDocs(collection(db, 'languages'));
    
    const categories = new Map();
    const productTypes = new Map();
    const languages = new Map();
    
    categoriesSnapshot.forEach(doc => {
      categories.set(doc.id, doc.data().name);
    });
    
    productTypesSnapshot.forEach(doc => {
      productTypes.set(doc.id, doc.data().name);
    });
    
    languagesSnapshot.forEach(doc => {
      languages.set(doc.id, doc.data().name);
    });
    
    docsSnapshot.forEach(doc => {
      const docData = doc.data();
      
      // Compter par catégorie
      if (docData.category) {
        const count = categoryMap.get(docData.category) || 0;
        categoryMap.set(docData.category, count + 1);
      }
      
      // Compter par type de produit
      if (docData.productType) {
        const count = productTypeMap.get(docData.productType) || 0;
        productTypeMap.set(docData.productType, count + 1);
      }
      
      // Compter par langue
      if (docData.language) {
        const count = languageMap.get(docData.language) || 0;
        languageMap.set(docData.language, count + 1);
      }
    });
    
    // Convertir les Maps en tableaux pour les graphiques
    const byCategory = Array.from(categoryMap.entries()).map(([id, value]) => ({
      name: categories.get(id) || 'Inconnu',
      value
    }));
    
    const byProductType = Array.from(productTypeMap.entries()).map(([id, value]) => ({
      name: productTypes.get(id) || 'Inconnu',
      value
    }));
    
    const byLanguage = Array.from(languageMap.entries()).map(([id, value]) => ({
      name: languages.get(id) || 'Inconnu',
      value
    }));
    
    setDocumentStats({
      total: docsSnapshot.size,
      byCategory,
      byProductType,
      byLanguage
    });
  }, [date, dateRange]);

  const fetchDownloadStats = useCallback(async () => {
    const downloadsRef = collection(db, 'downloadHistory');
    const downloadsSnapshot = await getDocs(downloadsRef);
    
    const today = new Date();
    let startDate;
    
    // Déterminer la date de début en fonction de la période sélectionnée
    if (date) {
      startDate = startOfDay(date);
    } else if (dateRange === '7d') {
      startDate = subDays(today, 7);
    } else if (dateRange === '30d') {
      startDate = subDays(today, 30);
    } else {
      startDate = subDays(today, 90);
    }
    
    let todayCount = 0;
    const documentCounts = new Map<string, number>();
    const dailyCounts = new Map<string, number>();
    
    // Initialiser les jours de la période sélectionnée
    let daysToShow = 7;
    if (dateRange === '30d') daysToShow = 30;
    if (dateRange === '90d') daysToShow = 90;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'dd/MM', { locale: fr });
      dailyCounts.set(dateStr, 0);
    }
    
    // Récupérer les noms des documents
    const documentsSnapshot = await getDocs(collection(db, 'documents'));
    const documents = new Map();
    
    documentsSnapshot.forEach(doc => {
      documents.set(doc.id, doc.data().name || 'Document sans nom');
    });
    
    downloadsSnapshot.forEach(doc => {
      const downloadData = doc.data();
      
      if (downloadData.downloadedAt) {
        const downloadDate = downloadData.downloadedAt.toDate();
        
        // Compter les téléchargements d'aujourd'hui
        if (downloadDate >= startDate) {
          todayCount++;
        }
        
        // Compter les téléchargements de la période sélectionnée
        if (downloadDate >= startDate) {
          const dateStr = format(downloadDate, 'dd/MM', { locale: fr });
          if (dailyCounts.has(dateStr)) {
            const count = dailyCounts.get(dateStr) || 0;
            dailyCounts.set(dateStr, count + 1);
          }
        }
        
        // Compter par document
        if (downloadData.documentId) {
          const count = documentCounts.get(downloadData.documentId) || 0;
          documentCounts.set(downloadData.documentId, count + 1);
        }
      }
    });
    
    // Convertir les Maps en tableaux pour les graphiques
    const lastWeek = Array.from(dailyCounts.entries()).map(([date, count]) => ({
      date,
      count
    }));
    
    // Trier les documents par nombre de téléchargements et prendre les 5 premiers
    const topDocuments = Array.from(documentCounts.entries())
      .map(([id, count]) => ({
        name: documents.get(id) || 'Document inconnu',
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    const total = downloadsSnapshot.size;
    const yesterdayDownloads = total - todayCount;
    const growthRate = yesterdayDownloads > 0 ? (todayCount / yesterdayDownloads) * 100 : 0;
    
    setDownloadStats({
      total,
      today: todayCount,
      lastWeek,
      topDocuments,
      growthRate
    });
  }, [date, dateRange]);

  const fetchRegistrationStats = useCallback(async () => {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const today = new Date();
    let startDate;
    
    // Déterminer la date de début en fonction de la période sélectionnée
    if (date) {
      startDate = startOfDay(date);
    } else if (dateRange === '7d') {
      startDate = subDays(today, 7);
    } else if (dateRange === '30d') {
      startDate = subDays(today, 30);
    } else {
      startDate = subDays(today, 90);
    }
    
    const dailyCounts = new Map<string, number>();
    
    // Initialiser les jours de la période sélectionnée
    let daysToShow = 7;
    if (dateRange === '30d') daysToShow = 30;
    if (dateRange === '90d') daysToShow = 90;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'dd/MM', { locale: fr });
      dailyCounts.set(dateStr, 0);
    }
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      
      if (userData.createdAt) {
        const creationDate = userData.createdAt.toDate();
        
        // Compter les inscriptions de la période sélectionnée
        if (creationDate >= startDate) {
          const dateStr = format(creationDate, 'dd/MM', { locale: fr });
          if (dailyCounts.has(dateStr)) {
            const count = dailyCounts.get(dateStr) || 0;
            dailyCounts.set(dateStr, count + 1);
          }
        }
      }
    });
    
    // Convertir la Map en tableau pour le graphique
    const lastWeek = Array.from(dailyCounts.entries()).map(([date, count]) => ({
      date,
      count
    }));
    
    setRegistrationStats({
      lastWeek
    });
  }, [date, dateRange]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer les statistiques des utilisateurs
        await fetchUserStats();
        
        // Récupérer les statistiques des documents
        await fetchDocumentStats();
        
        // Récupérer les statistiques des téléchargements
        await fetchDownloadStats();
        
        // Récupérer les statistiques d'inscription
        await fetchRegistrationStats();
        
      } catch (err) {
        console.error('Erreur lors de la récupération des statistiques:', err);
        setError('Impossible de récupérer les statistiques. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dateRange, date, fetchUserStats, fetchDownloadStats, fetchDocumentStats, fetchRegistrationStats]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border">
        <p>Chargement des statistiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border bg-destructive/10 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur de période */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
        <div className="flex items-center space-x-2">
          <Select
            value={dateRange}
            onValueChange={(value) => setDateRange(value as '7d' | '30d' | '90d')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sélectionner une période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: fr }) : "Date spécifique"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {date && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setDate(undefined)}
              className="h-9 w-9"
            >
              <span className="sr-only">Réinitialiser la date</span>
              ×
            </Button>
          )}
        </div>
      </div>
      
      {/* KPIs principaux - toujours visibles */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs totaux</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.total}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {userStats.growthRate > 0 ? (
                <>
                  <ArrowUpRight className="mr-1 h-4 w-4 text-muted-foreground" />
                  <span>{userStats.growthRate.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="mr-1 h-4 w-4 text-muted-foreground" />
                  <span>{Math.abs(userStats.growthRate).toFixed(1)}%</span>
                </>
              )}
              <span className="ml-1">depuis hier</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents disponibles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.total}</div>
            <p className="text-xs text-muted-foreground">Répartis en {documentStats.byCategory.length} catégories</p>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Téléchargements totaux</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{downloadStats.total}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {downloadStats.growthRate > 0 ? (
                <>
                  <ArrowUpRight className="mr-1 h-4 w-4 text-muted-foreground" />
                  <span>{downloadStats.growthRate.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="mr-1 h-4 w-4 text-muted-foreground" />
                  <span>{Math.abs(downloadStats.growthRate).toFixed(1)}%</span>
                </>
              )}
              <span className="ml-1">depuis hier</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux utilisateurs</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.newToday}</div>
            <p className="text-xs text-muted-foreground">Inscrits aujourd&apos;hui</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Onglets pour les graphiques détaillés */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue générale</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="downloads">Téléchargements</TabsTrigger>
        </TabsList>
        
        {/* Onglet Vue générale */}
        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Répartition des utilisateurs par rôle */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Répartition des utilisateurs</CardTitle>
                <CardDescription>Par rôle sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={[
                        { name: 'Administrateurs', value: userStats.admins },
                        { name: 'Installateurs', value: userStats.installers },
                        { name: 'Distributeurs', value: userStats.distributors },
                        { name: 'Utilisateurs', value: userStats.users }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" />
                      <YAxis type="category" dataKey="name" width={120} stroke="#6b7280" />
                      <Tooltip formatter={(value) => [`${value} utilisateurs`, '']} />
                      <Legend />
                      <Bar dataKey="value" name="Nombre d'utilisateurs" fill="#78716c">
                        {[
                          { name: 'Administrateurs', value: userStats.admins },
                          { name: 'Installateurs', value: userStats.installers },
                          { name: 'Distributeurs', value: userStats.distributors },
                          { name: 'Utilisateurs', value: userStats.users }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Documents par catégorie */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Documents par catégorie</CardTitle>
                <CardDescription>Répartition des documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={documentStats.byCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {documentStats.byCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} documents`, '']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Onglet Utilisateurs */}
        <TabsContent value="users" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Répartition des utilisateurs par rôle */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Répartition des utilisateurs</CardTitle>
                <CardDescription>Par rôle sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={[
                        { name: 'Administrateurs', value: userStats.admins },
                        { name: 'Installateurs', value: userStats.installers },
                        { name: 'Distributeurs', value: userStats.distributors },
                        { name: 'Utilisateurs', value: userStats.users }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" />
                      <YAxis type="category" dataKey="name" width={120} stroke="#6b7280" />
                      <Tooltip formatter={(value) => [`${value} utilisateurs`, '']} />
                      <Legend />
                      <Bar dataKey="value" name="Nombre d'utilisateurs" fill="#78716c">
                        {[
                          { name: 'Administrateurs', value: userStats.admins },
                          { name: 'Installateurs', value: userStats.installers },
                          { name: 'Distributeurs', value: userStats.distributors },
                          { name: 'Utilisateurs', value: userStats.users }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Inscriptions par jour */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Inscriptions quotidiennes</CardTitle>
                <CardDescription>7 derniers jours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={registrationStats.lastWeek}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" name="Inscriptions" stroke="#78716c" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Onglet Documents */}
        <TabsContent value="documents" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Documents par catégorie */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Documents par catégorie</CardTitle>
                <CardDescription>Répartition des documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={documentStats.byCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {documentStats.byCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} documents`, '']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Documents les plus téléchargés */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Documents les plus téléchargés</CardTitle>
                <CardDescription>Top 5 des documents populaires</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={downloadStats.topDocuments}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" />
                      <YAxis type="category" dataKey="name" width={150} stroke="#6b7280" />
                      <Tooltip />
                      <Bar dataKey="count" name="Téléchargements" fill="#78716c" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Onglet Téléchargements */}
        <TabsContent value="downloads" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Téléchargements par jour */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Téléchargements quotidiens</CardTitle>
                <CardDescription>7 derniers jours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={downloadStats.lastWeek}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" name="Téléchargements" stroke="#78716c" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Documents les plus téléchargés */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Documents les plus téléchargés</CardTitle>
                <CardDescription>Top 5 des documents populaires</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={downloadStats.topDocuments}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" />
                      <YAxis type="category" dataKey="name" width={150} stroke="#6b7280" />
                      <Tooltip />
                      <Bar dataKey="count" name="Téléchargements" fill="#78716c" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
