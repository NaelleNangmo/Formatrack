import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, Plus, Edit, Trash2, Eye, FileText, Filter } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../components/UI/Card';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import Modal from '../components/UI/Modal';
import { clientService } from '../services/api';
import { formatCurrency, formatDateShort } from '../utils/format';

interface Client {
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
  prix_formation: number;
  montant_verse: number;
  montant_restant: number;
  created_at: string;
}

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientService.getAll();
      setClients(data);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage et recherche
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = 
        client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.domaine_etude.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.telephone_parent.includes(searchTerm);

      const matchesType = filterType === 'all' || client.type_formation === filterType;
      const matchesStatus = filterStatus === 'all' || client.statut_formation === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [clients, searchTerm, filterType, filterStatus]);

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setShowViewModal(true);
  };

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedClient) {
      try {
        await clientService.delete(selectedClient.id);
        await loadClients();
        setShowDeleteModal(false);
        setSelectedClient(null);
      } catch (error) {
        console.error('Erreur suppression client:', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_cours':
        return <Badge variant="success">En cours</Badge>;
      case 'suspendu':
        return <Badge variant="warning">Suspendu</Badge>;
      case 'termine':
        return <Badge variant="info">Terminé</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'stagiaire' ? 
      <Badge variant="info">Stagiaire</Badge> : 
      <Badge variant="default">Apprenant</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Liste des clients</h1>
            <p className="text-gray-600">Gérer les stagiaires et apprenants</p>
          </div>
        </div>
        <Button
          icon={Plus}
          onClick={() => window.location.href = '/enregistrement'}
        >
          Ajouter un client
        </Button>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, prénom, domaine ou téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les types</option>
                <option value="stagiaire">Stagiaires</option>
                <option value="apprenant">Apprenants</option>
              </select>
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="en_cours">En cours</option>
                <option value="suspendu">Suspendu</option>
                <option value="termine">Terminé</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredClients.length} client(s) trouvé(s)
            </p>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Filtres appliqués</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domaine
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Financier
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {client.nom} {client.prenom}
                        </div>
                        <div className="text-sm text-gray-500">
                          {client.telephone_parent}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getTypeBadge(client.type_formation)}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(client.statut_formation)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900">{client.domaine_etude}</div>
                      <div className="text-sm text-gray-500">{client.niveau_scolaire}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900">
                        Total: {formatCurrency(client.prix_formation)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Versé: {formatCurrency(client.montant_verse)}
                      </div>
                      <div className={`text-sm font-medium ${
                        client.montant_restant > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        Reste: {formatCurrency(client.montant_restant)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900">
                        {formatDateShort(client.date_inscription)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewClient(client)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditClient(client)}
                          className="text-indigo-600 hover:text-indigo-800 transition-colors"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {/* TODO: Implement print */}}
                          className="text-gray-600 hover:text-gray-800 transition-colors"
                          title="Imprimer"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredClients.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-lg font-medium text-gray-900">Aucun client trouvé</p>
                <p className="text-gray-500">Essayez de modifier vos critères de recherche.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <EditClientModal 
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        client={selectedClient}
        onSave={async (updatedClient) => {
          try {
            await clientService.update(updatedClient.id, updatedClient);
            await loadClients();
            setShowEditModal(false);
          } catch (error) {
            console.error('Erreur mise à jour client:', error);
          }
        }}
      />

      <ViewClientModal 
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        client={selectedClient}
      />

      <DeleteConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        clientName={selectedClient ? `${selectedClient.nom} ${selectedClient.prenom}` : ''}
      />
    </div>
  );
};

// Modal d'édition
const EditClientModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSave: (client: Client) => void;
}> = ({ isOpen, onClose, client, onSave }) => {
  const [formData, setFormData] = useState<Partial<Client>>({});

  React.useEffect(() => {
    if (client) {
      setFormData(client);
    }
  }, [client]);

  if (!client) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Client);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier le client" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom
            </label>
            <input
              type="text"
              value={formData.nom || ''}
              onChange={(e) => setFormData({...formData, nom: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prénom
            </label>
            <input
              type="text"
              value={formData.prenom || ''}
              onChange={(e) => setFormData({...formData, prenom: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              value={formData.telephone_parent || ''}
              onChange={(e) => setFormData({...formData, telephone_parent: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localité
            </label>
            <input
              type="text"
              value={formData.localite || ''}
              onChange={(e) => setFormData({...formData, localite: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            value={formData.statut_formation || ''}
            onChange={(e) => setFormData({...formData, statut_formation: e.target.value as any})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="en_cours">En cours</option>
            <option value="suspendu">Suspendu</option>
            <option value="termine">Terminé</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">
            Sauvegarder
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Modal de visualisation
const ViewClientModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}> = ({ isOpen, onClose, client }) => {
  if (!client) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_cours':
        return <Badge variant="success">En cours</Badge>;
      case 'suspendu':
        return <Badge variant="warning">Suspendu</Badge>;
      case 'termine':
        return <Badge variant="info">Terminé</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Détails du client" size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900">Informations personnelles</h4>
            <div className="mt-2 space-y-2">
              <p><span className="text-gray-600">Nom:</span> {client.nom} {client.prenom}</p>
              <p><span className="text-gray-600">Téléphone:</span> {client.telephone_parent}</p>
              <p><span className="text-gray-600">Localité:</span> {client.localite}</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Formation</h4>
            <div className="mt-2 space-y-2">
              <p><span className="text-gray-600">Type:</span> {client.type_formation}</p>
              <p><span className="text-gray-600">Domaine:</span> {client.domaine_etude}</p>
              <p><span className="text-gray-600">Niveau:</span> {client.niveau_scolaire}</p>
              <p><span className="text-gray-600">Durée:</span> {client.duree_formation} mois</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900">Informations financières</h4>
          <div className="mt-2 grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Prix total</p>
              <p className="text-lg font-semibold text-blue-600">
                {formatCurrency(client.prix_formation)}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Montant versé</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(client.montant_verse)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${client.montant_restant > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <p className="text-sm text-gray-600">Reste à payer</p>
              <p className={`text-lg font-semibold ${client.montant_restant > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {formatCurrency(client.montant_restant)}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900">Statut</h4>
          <div className="mt-2">
            {getStatusBadge(client.statut_formation)}
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Modal de confirmation de suppression
const DeleteConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clientName: string;
}> = ({ isOpen, onClose, onConfirm, clientName }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmer la suppression" size="sm">
      <div className="space-y-4">
        <p className="text-gray-600">
          Êtes-vous sûr de vouloir supprimer le client <strong>{clientName}</strong> ? 
          Cette action est irréversible.
        </p>
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Supprimer
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default Clients;