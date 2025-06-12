import React, { useState, useEffect } from 'react';
import { UserX, Search, Eye, Trash2, Calendar, Clock } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../components/UI/Card';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import Modal from '../components/UI/Modal';
import { absenceRetardService, clientService } from '../services/api';
import { formatDateShort, formatTime } from '../utils/format';

interface AbsenceRetard {
  id: number;
  client_id: number;
  cours_id: number;
  date: string;
  heure_presence?: string;
  type: 'absence' | 'retard';
  remarque?: string;
  nom: string;
  prenom: string;
  cours_nom: string;
}

interface Client {
  id: number;
  nom: string;
  prenom: string;
  type_formation: string;
  statut_formation: string;
}

const AbsencesRetards: React.FC = () => {
  const [absencesRetards, setAbsencesRetards] = useState<AbsenceRetard[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientAbsencesRetards, setClientAbsencesRetards] = useState<AbsenceRetard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAbsenceRetard, setSelectedAbsenceRetard] = useState<AbsenceRetard | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [absencesRetardsData, clientsData] = await Promise.all([
        absenceRetardService.getAll(),
        clientService.getAll()
      ]);
      setAbsencesRetards(absencesRetardsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAbsencesRetards = absencesRetards.filter(ar => {
    const matchesSearch = 
      ar.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ar.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ar.cours_nom.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || ar.type === filterType;

    return matchesSearch && matchesType;
  });

  const handleViewClient = async (client: Client) => {
    try {
      setSelectedClient(client);
      const clientData = await clientService.getAbsencesRetards(client.id);
      setClientAbsencesRetards(clientData);
      setShowClientModal(true);
    } catch (error) {
      console.error('Erreur chargement absences/retards client:', error);
    }
  };

  const handleDeleteAbsenceRetard = (absenceRetard: AbsenceRetard) => {
    setSelectedAbsenceRetard(absenceRetard);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedAbsenceRetard) {
      try {
        await absenceRetardService.delete(selectedAbsenceRetard.id);
        await loadData();
        setShowDeleteModal(false);
        setSelectedAbsenceRetard(null);
      } catch (error) {
        console.error('Erreur suppression absence/retard:', error);
      }
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'absence' ? 
      <Badge variant="danger">Absence</Badge> : 
      <Badge variant="warning">Retard</Badge>;
  };

  const getClientStats = (clientId: number) => {
    const clientAbsences = absencesRetards.filter(ar => ar.client_id === clientId);
    const absences = clientAbsences.filter(ar => ar.type === 'absence').length;
    const retards = clientAbsences.filter(ar => ar.type === 'retard').length;
    return { absences, retards };
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
      <div className="flex items-center space-x-3">
        <UserX className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Absences & Retards</h1>
          <p className="text-gray-600">Suivi des absences et retards des clients</p>
        </div>
      </div>

      {/* Statistiques par client */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Statistiques par Client</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => {
              const stats = getClientStats(client.id);
              return (
                <div
                  key={client.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => handleViewClient(client)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {client.nom} {client.prenom}
                      </h4>
                      <p className="text-sm text-gray-600">{client.type_formation}</p>
                    </div>
                    <Button size="sm" icon={Eye}>
                      Détails
                    </Button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="bg-red-50 p-2 rounded text-center">
                      <div className="text-lg font-bold text-red-600">{stats.absences}</div>
                      <div className="text-xs text-gray-600">Absences</div>
                    </div>
                    <div className="bg-orange-50 p-2 rounded text-center">
                      <div className="text-lg font-bold text-orange-600">{stats.retards}</div>
                      <div className="text-xs text-gray-600">Retards</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, prénom ou cours..."
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
                <option value="absence">Absences</option>
                <option value="retard">Retards</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600">
              {filteredAbsencesRetards.length} enregistrement(s) trouvé(s)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Liste des absences et retards */}
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
                    Cours
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Heure
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAbsencesRetards.map((ar) => (
                  <tr key={ar.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium text-gray-900">
                        {ar.nom} {ar.prenom}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900">{ar.cours_nom}</div>
                    </td>
                    <td className="py-4 px-6">
                      {getTypeBadge(ar.type)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatDateShort(ar.date)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {ar.heure_presence ? (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {formatTime(ar.heure_presence)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleDeleteAbsenceRetard(ar)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAbsencesRetards.length === 0 && (
              <div className="text-center py-12">
                <UserX className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-lg font-medium text-gray-900">Aucun enregistrement trouvé</p>
                <p className="text-gray-500">Aucune absence ou retard enregistré.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal détails client */}
      <Modal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        title={selectedClient ? `Absences & Retards - ${selectedClient.nom} ${selectedClient.prenom}` : ''}
        size="lg"
      >
        {selectedClient && (
          <div className="space-y-6">
            {/* Informations client */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Informations Client</h4>
              <div className="grid grid-cols-2 gap-4">
                <p><span className="text-gray-600">Nom:</span> {selectedClient.nom} {selectedClient.prenom}</p>
                <p><span className="text-gray-600">Type:</span> {selectedClient.type_formation}</p>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {clientAbsencesRetards.filter(ar => ar.type === 'absence').length}
                </div>
                <div className="text-sm text-gray-600">Total Absences</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {clientAbsencesRetards.filter(ar => ar.type === 'retard').length}
                </div>
                <div className="text-sm text-gray-600">Total Retards</div>
              </div>
            </div>

            {/* Historique */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Historique Détaillé</h4>
              {clientAbsencesRetards.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune absence ou retard enregistré</p>
              ) : (
                <div className="space-y-3">
                  {clientAbsencesRetards.map((ar) => (
                    <div key={ar.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="flex items-center space-x-3">
                          {getTypeBadge(ar.type)}
                          <span className="text-sm font-medium text-gray-900">{ar.cours_nom}</span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-600">{formatDateShort(ar.date)}</span>
                          </div>
                          {ar.heure_presence && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-600">{formatTime(ar.heure_presence)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Êtes-vous sûr de vouloir supprimer cet enregistrement d'
            <strong>{selectedAbsenceRetard?.type}</strong> ?
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AbsencesRetards;