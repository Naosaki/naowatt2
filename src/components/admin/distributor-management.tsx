"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  runTransaction,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { DistributorAccount, User } from "@/lib/types";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import Image from "next/image";

export default function DistributorManagement() {
  const [distributors, setDistributors] = useState<DistributorAccount[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<DistributorAccount | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    logo: "",
    active: true,
  });

  useEffect(() => {
    fetchDistributors();
  }, []);

  const fetchDistributors = async () => {
    setIsLoading(true);
    try {
      const distributorsRef = collection(db, "distributors");
      const querySnapshot = await getDocs(distributorsRef);
      const distributorsList: DistributorAccount[] = [];

      // Obtenir tous les distributeurs
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data() as Omit<DistributorAccount, "id">;
        const createdAt = data.createdAt ? 
          (data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt)) : 
          new Date();
        
        // Ajouter le distributeur à la liste
        distributorsList.push({
          id: docSnapshot.id,
          ...data,
          // Utiliser companyName comme name si disponible
          name: data.companyName || data.name,
          // Utiliser logoUrl comme logo si disponible
          logo: data.logoUrl || data.logo,
          createdAt,
          // Initialiser teamMembers comme tableau vide s'il n'existe pas
          teamMembers: data.teamMembers || [],
        });
      }

      // Compter les membres d'équipe pour chaque distributeur
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      
      // Créer un compteur pour chaque distributeur
      const teamMemberCounts: Record<string, number> = {};
      
      // Compter les utilisateurs par distributorId
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        if (userData.distributorId && userData.role === 'distributor') {
          if (!teamMemberCounts[userData.distributorId]) {
            teamMemberCounts[userData.distributorId] = 0;
          }
          teamMemberCounts[userData.distributorId]++;
        }
      });
      
      // Mettre à jour le nombre de membres pour chaque distributeur
      const updatedDistributorsList = distributorsList.map(distributor => ({
        ...distributor,
        // Ajouter la propriété teamMemberCount pour l'affichage
        teamMemberCount: teamMemberCounts[distributor.id] || 0
      }));

      setDistributors(updatedDistributorsList);
    } catch (error) {
      console.error("Error fetching distributors:", error);
      toast.error("Erreur lors du chargement des distributeurs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      contactEmail: "",
      contactPhone: "",
      logo: "",
      active: true,
    });
  };

  const handleAddDistributor = async () => {
    try {
      const distributorRef = doc(collection(db, "distributors"));
      
      // Filtrer les champs undefined pour éviter l'erreur Firestore
      const filteredData = Object.entries(formData).reduce<Record<string, string | boolean>>((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      await setDoc(distributorRef, {
        ...filteredData,
        createdAt: serverTimestamp(),
        teamMembers: [],
        adminMembers: [],
      });

      toast.success("Distributeur ajouté avec succès");
      setIsAddDialogOpen(false);
      resetForm();
      fetchDistributors();
    } catch (error) {
      console.error("Error adding distributor:", error);
      toast.error("Erreur lors de l&apos;ajout du distributeur");
    }
  };

  const handleEditDistributor = async () => {
    if (!selectedDistributor) return;

    try {
      const distributorRef = doc(db, "distributors", selectedDistributor.id);
      
      // Filtrer les champs undefined pour éviter l'erreur Firestore
      const updatedData = Object.entries(formData).reduce<Record<string, string | boolean>>((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      await updateDoc(distributorRef, updatedData);

      toast.success("Distributeur mis à jour avec succès");
      setIsEditDialogOpen(false);
      fetchDistributors();
    } catch (error) {
      console.error("Error updating distributor:", error);
      toast.error("Erreur lors de la mise à jour du distributeur");
    }
  };

  const handleDeleteDistributor = async (distributorId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce distributeur ?")) return;

    try {
      // 1. Récupérer tous les utilisateurs associés à ce distributeur
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("distributorId", "==", distributorId));
      const querySnapshot = await getDocs(q);

      // 2. Mettre à jour chaque utilisateur pour supprimer l'association
      const userUpdates = querySnapshot.docs.map((userDoc) => {
        const userRef = doc(db, "users", userDoc.id);
        return updateDoc(userRef, {
          distributorId: null,
          isDistributorAdmin: false,
        });
      });

      await Promise.all(userUpdates);

      // 3. Supprimer le distributeur
      const distributorRef = doc(db, "distributors", distributorId);
      await deleteDoc(distributorRef);

      toast.success("Distributeur supprimé avec succès");
      fetchDistributors();
    } catch (error) {
      console.error("Error deleting distributor:", error);
      toast.error("Erreur lors de la suppression du distributeur");
    }
  };

  const openEditDialog = (distributor: DistributorAccount) => {
    setSelectedDistributor(distributor);
    setFormData({
      name: distributor.name,
      address: distributor.address,
      contactEmail: distributor.contactEmail,
      contactPhone: distributor.contactPhone,
      logo: distributor.logo || "",
      active: distributor.active,
    });
    setIsEditDialogOpen(true);
  };

  const openTeamDialog = async (distributor: DistributorAccount) => {
    setSelectedDistributor(distributor);
    setIsTeamDialogOpen(true);
    await fetchTeamMembers(distributor.id);
    await fetchAvailableUsers(distributor.id);
  };

  const fetchTeamMembers = async (distributorId: string) => {
    try {
      const teamMembers: User[] = [];

      // Récupérer les utilisateurs qui appartiennent à ce distributeur
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("distributorId", "==", distributorId));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        const userData = doc.data() as Omit<User, "id">;
        const createdAt = userData.createdAt ? 
          (userData.createdAt instanceof Timestamp ? userData.createdAt.toDate() : new Date(userData.createdAt)) : 
          new Date();
        const lastLogin = userData.lastLogin ? 
          (userData.lastLogin instanceof Timestamp ? userData.lastLogin.toDate() : new Date(userData.lastLogin)) : 
          undefined;
        
        teamMembers.push({
          id: doc.id,
          ...userData,
          createdAt,
          lastLogin,
        });
      });

      setTeamMembers(teamMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Erreur lors du chargement des membres de l'équipe");
    }
  };

  const fetchAvailableUsers = async (distributorId: string) => {
    try {
      const availableUsersList: User[] = [];

      // Récupérer les utilisateurs qui n'appartiennent pas déjà à un distributeur
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "user"));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        const userData = doc.data() as Omit<User, "id">;
        // N'inclure que les utilisateurs qui n'ont pas de distributorId ou qui ont un distributorId différent
        if (!userData.distributorId || userData.distributorId !== distributorId) {
          const createdAt = userData.createdAt ? 
            (userData.createdAt instanceof Timestamp ? userData.createdAt.toDate() : new Date(userData.createdAt)) : 
            new Date();
          const lastLogin = userData.lastLogin ? 
            (userData.lastLogin instanceof Timestamp ? userData.lastLogin.toDate() : new Date(userData.lastLogin)) : 
            undefined;
          
          availableUsersList.push({
            id: doc.id,
            ...userData,
            createdAt,
            lastLogin,
          });
        }
      });

      setAvailableUsers(availableUsersList);
    } catch (error) {
      console.error("Error fetching available users:", error);
      toast.error("Erreur lors du chargement des utilisateurs disponibles");
    }
  };

  const addTeamMember = async (userId: string, isAdmin: boolean = false) => {
    if (!selectedDistributor) return;

    try {
      const distributorRef = doc(db, "distributors", selectedDistributor.id);
      const userRef = doc(db, "users", userId);

      // Transaction pour garantir la cohérence
      await runTransaction(db, async (transaction) => {
        // Mettre à jour le distributeur
        transaction.update(distributorRef, {
          teamMembers: arrayUnion(userId),
          ...(isAdmin ? { adminMembers: arrayUnion(userId) } : {}),
        });

        // Mettre à jour l'utilisateur
        transaction.update(userRef, {
          distributorId: selectedDistributor.id,
          isDistributorAdmin: isAdmin,
        });
      });

      toast.success("Membre ajouté à l'équipe avec succès");
      await fetchTeamMembers(selectedDistributor.id);
      await fetchAvailableUsers(selectedDistributor.id);
    } catch (error) {
      console.error("Error adding team member:", error);
      toast.error("Erreur lors de l'ajout du membre à l'équipe");
    }
  };

  const removeTeamMember = async (userId: string) => {
    if (!selectedDistributor) return;

    try {
      const distributorRef = doc(db, "distributors", selectedDistributor.id);
      const userRef = doc(db, "users", userId);

      // Transaction pour garantir la cohérence
      await runTransaction(db, async (transaction) => {
        // Mettre à jour le distributeur
        transaction.update(distributorRef, {
          teamMembers: arrayRemove(userId),
          adminMembers: arrayRemove(userId),
        });

        // Mettre à jour l'utilisateur
        transaction.update(userRef, {
          distributorId: null,
          isDistributorAdmin: false,
        });
      });

      toast.success("Membre retiré de l'équipe avec succès");
      await fetchTeamMembers(selectedDistributor.id);
      await fetchAvailableUsers(selectedDistributor.id);
    } catch (error) {
      console.error("Error removing team member:", error);
      toast.error("Erreur lors du retrait du membre de l'équipe");
    }
  };

  const toggleAdminStatus = async (userId: string, isAdmin: boolean) => {
    if (!selectedDistributor) return;

    try {
      const distributorRef = doc(db, "distributors", selectedDistributor.id);
      const userRef = doc(db, "users", userId);

      // Transaction pour garantir la cohérence
      await runTransaction(db, async (transaction) => {
        if (isAdmin) {
          // Ajouter aux admins
          transaction.update(distributorRef, {
            adminMembers: arrayUnion(userId),
          });
        } else {
          // Retirer des admins
          transaction.update(distributorRef, {
            adminMembers: arrayRemove(userId),
          });
        }

        // Mettre à jour l'utilisateur
        transaction.update(userRef, {
          isDistributorAdmin: isAdmin,
        });
      });

      toast.success(`Statut d'administrateur ${isAdmin ? 'accordé' : 'retiré'} avec succès`);
      await fetchTeamMembers(selectedDistributor.id);
    } catch (error) {
      console.error("Error toggling admin status:", error);
      toast.error("Erreur lors de la modification du statut d'administrateur");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Gestion des Distributeurs</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Ajouter un distributeur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajouter un distributeur</DialogTitle>
              <DialogDescription>
                Créez un nouveau compte distributeur pour une entreprise.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nom
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Adresse
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contactEmail" className="text-right">
                  Email
                </Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contactPhone" className="text-right">
                  Téléphone
                </Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="logo" className="text-right">
                  Logo URL
                </Label>
                <Input
                  id="logo"
                  name="logo"
                  value={formData.logo}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="active" className="text-right">
                  Actif
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="active"
                    name="active"
                    checked={formData.active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, active: checked })
                    }
                  />
                  <Label htmlFor="active">{formData.active ? "Oui" : "Non"}</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddDistributor}>
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : distributors.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">Aucun distributeur trouvé</p>
        </div>
      ) : (
        <Table>
          <TableCaption>Liste des distributeurs</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Logo</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Équipe</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {distributors.map((distributor) => (
              <TableRow key={distributor.id}>
                <TableCell>
                  {distributor.logo ? (
                    <div className="h-10 w-10 relative">
                      <Image
                        src={distributor.logo}
                        alt={distributor.name}
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 bg-muted flex items-center justify-center rounded-md">
                      <span className="text-xs text-muted-foreground">
                        {distributor.name && distributor.name.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{distributor.name}</TableCell>
                <TableCell>{distributor.contactEmail}</TableCell>
                <TableCell>{distributor.contactPhone}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      distributor.active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {distributor.active ? "Actif" : "Inactif"}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openTeamDialog(distributor)}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    {distributor.teamMemberCount} membres
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(distributor)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteDistributor(distributor.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier le distributeur</DialogTitle>
            <DialogDescription>
              Modifiez les informations du distributeur.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Nom
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-address" className="text-right">
                Adresse
              </Label>
              <Input
                id="edit-address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-contactEmail" className="text-right">
                Email
              </Label>
              <Input
                id="edit-contactEmail"
                name="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-contactPhone" className="text-right">
                Téléphone
              </Label>
              <Input
                id="edit-contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-logo" className="text-right">
                Logo URL
              </Label>
              <Input
                id="edit-logo"
                name="logo"
                value={formData.logo}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-active" className="text-right">
                Actif
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="edit-active"
                  name="active"
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked })
                  }
                />
                <Label htmlFor="edit-active">{formData.active ? "Oui" : "Non"}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEditDistributor}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de gestion d'équipe */}
      <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              Gestion de l&apos;équipe - {selectedDistributor?.name}
            </DialogTitle>
            <DialogDescription>
              Gérez les membres de l&apos;équipe pour ce distributeur.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="members" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members">Membres actuels</TabsTrigger>
              <TabsTrigger value="add">Ajouter des membres</TabsTrigger>
            </TabsList>
            <TabsContent value="members" className="space-y-4">
              {teamMembers.length === 0 ? (
                <div className="rounded-lg border p-8 text-center">
                  <p className="text-muted-foreground">Aucun membre dans l&#39;équipe</p>
                </div>
              ) : (
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/6">Nom</TableHead>
                      <TableHead className="w-2/6">Email</TableHead>
                      <TableHead className="w-1/6">Administrateur</TableHead>
                      <TableHead className="w-2/6 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`admin-${member.id}`}
                              checked={member.isDistributorAdmin || false}
                              onCheckedChange={(checked) =>
                                toggleAdminStatus(member.id, checked)
                              }
                            />
                            <Label htmlFor={`admin-${member.id}`}>
                              {member.isDistributorAdmin ? "Oui" : "Non"}
                            </Label>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeTeamMember(member.id)}
                          >
                            Retirer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            <TabsContent value="add" className="space-y-4">
              {availableUsers.length === 0 ? (
                <div className="rounded-lg border p-8 text-center">
                  <p className="text-muted-foreground">Aucun utilisateur disponible</p>
                </div>
              ) : (
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/6">Nom</TableHead>
                      <TableHead className="w-2/6">Email</TableHead>
                      <TableHead className="w-1/6">Administrateur</TableHead>
                      <TableHead className="w-2/6 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`new-admin-${user.id}`}
                              checked={false}
                              onCheckedChange={() => {}}
                            />
                            <Label htmlFor={`new-admin-${user.id}`}>Non</Label>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col md:flex-row justify-end gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => addTeamMember(user.id, false)}
                              className="w-full md:w-auto whitespace-nowrap text-xs"
                            >
                              Ajouter
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addTeamMember(user.id, true)}
                              className="w-full md:w-auto whitespace-nowrap text-xs"
                            >
                              Ajouter admin
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
