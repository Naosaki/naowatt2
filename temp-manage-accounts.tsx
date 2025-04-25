// Ajoutez ces u00e9tats dans la fonction ManageAccountsPage
const [distributorPassword, setDistributorPassword] = useState('');
const [stayLoggedIn, setStayLoggedIn] = useState(true);

// Modifiez la fonction handleCreateAccount
const handleCreateAccount = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user || user.role !== 'distributor') return;
  
  setIsSubmitting(true);
  setError(null);
  
  try {
    // Si l'option de rester connectu00e9 est activu00e9e, stocker temporairement le mot de passe du distributeur
    if (stayLoggedIn && distributorPassword) {
      // Stocker temporairement le mot de passe dans sessionStorage
      sessionStorage.setItem('tempPassword', distributorPassword);
    }
    
    // Cru00e9er le nouvel utilisateur avec l'option de rester connectu00e9
    await signUp(newUserEmail, newUserPassword, newUserName, newUserRole, user.uid, stayLoggedIn);
    
    toast({
      title: "Compte cru00e9u00e9 avec succu00e8s",
      description: `Le compte ${newUserRole === 'installer' ? 'installateur' : 'utilisateur'} a u00e9tu00e9 cru00e9u00e9.`,
      variant: "default",
    });
    
    // Ru00e9initialiser le formulaire
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserName('');
    setDistributorPassword('');
    setShowCreateForm(false);
    
    // Recharger la liste des utilisateurs
    fetchManagedUsers();
    
    // Effacer le mot de passe temporaire apru00e8s utilisation
    if (stayLoggedIn) {
      setTimeout(() => {
        sessionStorage.removeItem('tempPassword');
      }, 5000); // Supprimer apru00e8s 5 secondes
    }
  } catch (error: unknown) {
    console.error('Erreur lors de la cru00e9ation du compte:', error);
    const errorMessage = error instanceof Error ? error.message : 'Impossible de cru00e9er le compte. Veuillez ru00e9essayer plus tard.';
    setError(errorMessage);
  } finally {
    setIsSubmitting(false);
  }
};

// Ajoutez ces champs dans le formulaire de cru00e9ation de compte, juste avant le bouton de soumission
<div className="space-y-2">
  <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      id="stayLoggedIn"
      checked={stayLoggedIn}
      onChange={(e) => {
        setStayLoggedIn(e.target.checked);
        if (!e.target.checked) {
          setDistributorPassword('');
        }
      }}
      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
    />
    <Label htmlFor="stayLoggedIn" className="text-sm font-normal">
      Rester connectu00e9 en tant que distributeur apru00e8s la cru00e9ation
    </Label>
  </div>
  
  {stayLoggedIn && (
    <div className="space-y-2">
      <Label htmlFor="distributorPassword">Votre mot de passe (pour rester connectu00e9)</Label>
      <Input 
        id="distributorPassword" 
        type="password" 
        value={distributorPassword} 
        onChange={(e) => setDistributorPassword(e.target.value)} 
        required={stayLoggedIn}
      />
      <p className="text-xs text-muted-foreground">
        Entrez votre mot de passe de distributeur pour rester connectu00e9 apru00e8s la cru00e9ation du compte
      </p>
    </div>
  )}
</div>
