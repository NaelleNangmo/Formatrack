export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface Client {
  id: number;
  nom: string;
  prenom: string;
  localite: string;
  telephone_parent: string;
  niveau_scolaire: string;
  domaine_etude: string;
  date_inscription: string;
  duree_formation: number;
  type_formation: 'stagiaire' | 'apprenant';
  statut_formation: 'en_cours' | 'suspendu' | 'termine';
  date_statut_modifie: string;
  prix_formation: number;
  montant_verse: number;
  montant_restant: number;
  created_at: string;
}

export interface Cours {
  id: number;
  intitule: string;
  enseignant: string;
  created_at: string;
  clients: number[]; // IDs des clients affectés
}

export interface Presence {
  id: number;
  client_id: number;
  cours_id: number;
  date_presence: string;
  heure_presence: string;
  etat: 'present' | 'absent';
}

export interface Paiement {
  id: number;
  client_id: number;
  montant: number;
  date_paiement: string;
  utilisateur_id: number;
}

export interface AbsenceRetard {
  id: number;
  client_id: number;
  cours_id: number;
  date: string;
  heure_presence?: string;
  type: 'absence' | 'retard';
  remarque?: string;
}

export interface DashboardStats {
  totalClients: number;
  clientsActifs: number;
  totalCours: number;
  paiementsAujourdhui: number;
  absentsAujourdhui: number;
  totalRecettes: number;
}