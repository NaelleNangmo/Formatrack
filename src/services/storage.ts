import { User, Client, Cours, Presence, Paiement, AbsenceRetard } from '../types';

const STORAGE_KEYS = {
  USERS: 'formatrack_users',
  CLIENTS: 'formatrack_clients',
  COURS: 'formatrack_cours',
  PRESENCES: 'formatrack_presences',
  PAIEMENTS: 'formatrack_paiements',
  ABSENCES_RETARDS: 'formatrack_absences_retards',
  CURRENT_USER: 'formatrack_current_user',
};

// Fonction utilitaire pour obtenir les données du localStorage
function getStorageData<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

// Fonction utilitaire pour sauvegarder les données dans localStorage
function setStorageData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Initialiser les données par défaut
export function initializeDefaultData(): void {
  // Créer un utilisateur admin par défaut si aucun utilisateur n'existe
  const users = getStorageData<User>(STORAGE_KEYS.USERS);
  if (users.length === 0) {
    const defaultUser: User = {
      id: 1,
      username: 'admin',
      password_hash: 'admin123', // En production, utiliser bcrypt
      created_at: new Date().toISOString(),
    };
    setStorageData(STORAGE_KEYS.USERS, [defaultUser]);
  }

  // Créer des données de démonstration
  const clients = getStorageData<Client>(STORAGE_KEYS.CLIENTS);
  if (clients.length === 0) {
    const demoClients: Client[] = [
      {
        id: 1,
        nom: 'Kouame',
        prenom: 'Kofi',
        localite: 'Abidjan',
        telephone_parent: '+225 07 12 34 56 78',
        niveau_scolaire: 'Terminale',
        domaine_etude: 'Informatique',
        date_inscription: new Date().toISOString().split('T')[0],
        duree_formation: 6,
        type_formation: 'stagiaire',
        statut_formation: 'en_cours',
        date_statut_modifie: new Date().toISOString(),
        prix_formation: 150000,
        montant_verse: 100000,
        montant_restant: 50000,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        nom: 'Traore',
        prenom: 'Aminata',
        localite: 'Bouaké',
        telephone_parent: '+225 05 98 76 54 32',
        niveau_scolaire: 'Licence',
        domaine_etude: 'Marketing Digital',
        date_inscription: new Date().toISOString().split('T')[0],
        duree_formation: 3,
        type_formation: 'apprenant',
        statut_formation: 'en_cours',
        date_statut_modifie: new Date().toISOString(),
        prix_formation: 80000,
        montant_verse: 80000,
        montant_restant: 0,
        created_at: new Date().toISOString(),
      },
    ];
    setStorageData(STORAGE_KEYS.CLIENTS, demoClients);
  }

  const cours = getStorageData<Cours>(STORAGE_KEYS.COURS);
  if (cours.length === 0) {
    const demoCours: Cours[] = [
      {
        id: 1,
        intitule: 'Développement Web',
        enseignant: 'Prof. Kone',
        created_at: new Date().toISOString(),
        clients: [1, 2],
      },
      {
        id: 2,
        intitule: 'Marketing Digital',
        enseignant: 'Prof. Diallo',
        created_at: new Date().toISOString(),
        clients: [2],
      },
    ];
    setStorageData(STORAGE_KEYS.COURS, demoCours);
  }
}

// Services pour l'authentification
export const authService = {
  login: (username: string, password: string): User | null => {
    const users = getStorageData<User>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.username === username && u.password_hash === password);
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  },

  logout: (): void => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser: (): User | null => {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: (): boolean => {
    return authService.getCurrentUser() !== null;
  },
};

// Services pour les utilisateurs
export const userService = {
  getAll: (): User[] => getStorageData<User>(STORAGE_KEYS.USERS),
  
  create: (userData: Omit<User, 'id' | 'created_at'>): User => {
    const users = getStorageData<User>(STORAGE_KEYS.USERS);
    const newUser: User = {
      ...userData,
      id: Math.max(...users.map(u => u.id), 0) + 1,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    setStorageData(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  delete: (id: number): void => {
    const users = getStorageData<User>(STORAGE_KEYS.USERS);
    const filteredUsers = users.filter(u => u.id !== id);
    setStorageData(STORAGE_KEYS.USERS, filteredUsers);
  },

  update: (id: number, userData: Partial<User>): User | null => {
    const users = getStorageData<User>(STORAGE_KEYS.USERS);
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...userData };
      setStorageData(STORAGE_KEYS.USERS, users);
      return users[index];
    }
    return null;
  },
};

// Services pour les clients
export const clientService = {
  getAll: (): Client[] => getStorageData<Client>(STORAGE_KEYS.CLIENTS),
  
  getById: (id: number): Client | null => {
    const clients = getStorageData<Client>(STORAGE_KEYS.CLIENTS);
    return clients.find(c => c.id === id) || null;
  },

  create: (clientData: Omit<Client, 'id' | 'created_at' | 'montant_restant'>): Client => {
    const clients = getStorageData<Client>(STORAGE_KEYS.CLIENTS);
    const newClient: Client = {
      ...clientData,
      id: Math.max(...clients.map(c => c.id), 0) + 1,
      montant_restant: clientData.prix_formation - clientData.montant_verse,
      created_at: new Date().toISOString(),
    };
    clients.push(newClient);
    setStorageData(STORAGE_KEYS.CLIENTS, clients);
    return newClient;
  },

  update: (id: number, clientData: Partial<Client>): Client | null => {
    const clients = getStorageData<Client>(STORAGE_KEYS.CLIENTS);
    const index = clients.findIndex(c => c.id === id);
    if (index !== -1) {
      const updatedClient = { 
        ...clients[index], 
        ...clientData,
        montant_restant: (clientData.prix_formation || clients[index].prix_formation) - 
                         (clientData.montant_verse || clients[index].montant_verse),
        date_statut_modifie: new Date().toISOString(),
      };
      clients[index] = updatedClient;
      setStorageData(STORAGE_KEYS.CLIENTS, clients);
      return updatedClient;
    }
    return null;
  },

  delete: (id: number): void => {
    const clients = getStorageData<Client>(STORAGE_KEYS.CLIENTS);
    const filteredClients = clients.filter(c => c.id !== id);
    setStorageData(STORAGE_KEYS.CLIENTS, filteredClients);
  },
};

// Services pour les cours
export const coursService = {
  getAll: (): Cours[] => getStorageData<Cours>(STORAGE_KEYS.COURS),
  
  getById: (id: number): Cours | null => {
    const cours = getStorageData<Cours>(STORAGE_KEYS.COURS);
    return cours.find(c => c.id === id) || null;
  },

  create: (coursData: Omit<Cours, 'id' | 'created_at'>): Cours => {
    const cours = getStorageData<Cours>(STORAGE_KEYS.COURS);
    const newCours: Cours = {
      ...coursData,
      id: Math.max(...cours.map(c => c.id), 0) + 1,
      created_at: new Date().toISOString(),
    };
    cours.push(newCours);
    setStorageData(STORAGE_KEYS.COURS, cours);
    return newCours;
  },

  update: (id: number, coursData: Partial<Cours>): Cours | null => {
    const cours = getStorageData<Cours>(STORAGE_KEYS.COURS);
    const index = cours.findIndex(c => c.id === id);
    if (index !== -1) {
      cours[index] = { ...cours[index], ...coursData };
      setStorageData(STORAGE_KEYS.COURS, cours);
      return cours[index];
    }
    return null;
  },

  delete: (id: number): void => {
    const cours = getStorageData<Cours>(STORAGE_KEYS.COURS);
    const filteredCours = cours.filter(c => c.id !== id);
    setStorageData(STORAGE_KEYS.COURS, filteredCours);
  },
};

// Services pour les présences
export const presenceService = {
  getAll: (): Presence[] => getStorageData<Presence>(STORAGE_KEYS.PRESENCES),
  
  create: (presenceData: Omit<Presence, 'id'>): Presence => {
    const presences = getStorageData<Presence>(STORAGE_KEYS.PRESENCES);
    const newPresence: Presence = {
      ...presenceData,
      id: Math.max(...presences.map(p => p.id), 0) + 1,
    };
    presences.push(newPresence);
    setStorageData(STORAGE_KEYS.PRESENCES, presences);

    // Vérifier si c'est un retard ou une absence
    if (presenceData.etat === 'absent') {
      absenceRetardService.create({
        client_id: presenceData.client_id,
        cours_id: presenceData.cours_id,
        date: presenceData.date_presence,
        type: 'absence',
      });
    } else if (presenceData.etat === 'present') {
      const [hours, minutes] = presenceData.heure_presence.split(':').map(Number);
      if (hours > 9 || (hours === 9 && minutes > 0)) {
        absenceRetardService.create({
          client_id: presenceData.client_id,
          cours_id: presenceData.cours_id,
          date: presenceData.date_presence,
          heure_presence: presenceData.heure_presence,
          type: 'retard',
        });
      }
    }

    return newPresence;
  },

  getByClientAndDate: (clientId: number, date: string): Presence[] => {
    const presences = getStorageData<Presence>(STORAGE_KEYS.PRESENCES);
    return presences.filter(p => p.client_id === clientId && p.date_presence === date);
  },
};

// Services pour les paiements
export const paiementService = {
  getAll: (): Paiement[] => getStorageData<Paiement>(STORAGE_KEYS.PAIEMENTS),
  
  getByClient: (clientId: number): Paiement[] => {
    const paiements = getStorageData<Paiement>(STORAGE_KEYS.PAIEMENTS);
    return paiements.filter(p => p.client_id === clientId);
  },

  create: (paiementData: Omit<Paiement, 'id' | 'date_paiement'>): Paiement => {
    const paiements = getStorageData<Paiement>(STORAGE_KEYS.PAIEMENTS);
    const newPaiement: Paiement = {
      ...paiementData,
      id: Math.max(...paiements.map(p => p.id), 0) + 1,
      date_paiement: new Date().toISOString(),
    };
    paiements.push(newPaiement);
    setStorageData(STORAGE_KEYS.PAIEMENTS, paiements);

    // Mettre à jour le montant versé du client
    const client = clientService.getById(paiementData.client_id);
    if (client) {
      clientService.update(client.id, {
        montant_verse: client.montant_verse + paiementData.montant,
      });
    }

    return newPaiement;
  },
};

// Services pour les absences et retards
export const absenceRetardService = {
  getAll: (): AbsenceRetard[] => getStorageData<AbsenceRetard>(STORAGE_KEYS.ABSENCES_RETARDS),
  
  getByClient: (clientId: number): AbsenceRetard[] => {
    const absencesRetards = getStorageData<AbsenceRetard>(STORAGE_KEYS.ABSENCES_RETARDS);
    return absencesRetards.filter(ar => ar.client_id === clientId);
  },

  create: (absenceRetardData: Omit<AbsenceRetard, 'id'>): AbsenceRetard => {
    const absencesRetards = getStorageData<AbsenceRetard>(STORAGE_KEYS.ABSENCES_RETARDS);
    const newAbsenceRetard: AbsenceRetard = {
      ...absenceRetardData,
      id: Math.max(...absencesRetards.map(ar => ar.id), 0) + 1,
    };
    absencesRetards.push(newAbsenceRetard);
    setStorageData(STORAGE_KEYS.ABSENCES_RETARDS, absencesRetards);
    return newAbsenceRetard;
  },

  delete: (id: number): void => {
    const absencesRetards = getStorageData<AbsenceRetard>(STORAGE_KEYS.ABSENCES_RETARDS);
    const filteredAbsencesRetards = absencesRetards.filter(ar => ar.id !== id);
    setStorageData(STORAGE_KEYS.ABSENCES_RETARDS, filteredAbsencesRetards);
  },
};