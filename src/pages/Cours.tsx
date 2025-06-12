import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, Users, Search } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../components/UI/Card';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import { coursService, clientService } from '../services/api';
import { formatDateShort } from '../utils/format';

interface Cours {
  id: number;
  intitule: string;
  enseignant: string;
  created_at: string;
  clients_noms?: string;
  nombre_clients: number;
}

interface Client {
  id: number;
  nom: string;
  prenom: string;
  type_formation: string;
  statut_formation: string;
}

const Cours: React.FC = () => {
  const [cours, setCours] = useState<Cours[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCours, setSelectedCours] = useState<Cours | null>(null);

  const [formData, setFormData] = useState({
    intitule: '',
    enseignant: '',
    clients: [] as number[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [coursData, clientsData] = await Promise.all([
        coursService.getAll(),
        clientService.getAll()
      ]);
      setCours(coursData);
      setClients(clientsData.filter((c: Client) => c.statut_formation === 'en_cours'));
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCours = cours.filter(c =>
    c.intitule.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.enseignant.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setFormData({ intitule: '', enseignant: '', clients: [] });
    setShowCreateModal(true);
  };

  const handleEdit = (cours: Cours) => {
    setSelectedCours(cours);
    setFormData({
      intitule: cours.intitule,
      enseignant: cours.enseignant,
      clients: [], // TODO: Charger les clients du cours
    });
    setShowEditModal(true);
  };

  const handleDelete = (cours: Cours) => {
    setSelectedCours(cours);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedCours) {
        await coursService.update(selectedCours.id, formData);
        setShowEditModal(false);
      } else {
        await coursService.create(formData);
        setShowCreateModal(false);
      }
      await loadData();
      setSelectedCours(null);
    } catch (error) {
      console.error('Erreur sauvegarde cours:', error);
    }
  };

  const confirmDelete = async () => {
    if (selectedCours) {
      try {
        await coursService.delete(selectedCours.id);
        await loadData();
        setShowDeleteModal(false);
        setSelectedCours(null);
      } catch (error) {
        console.error('Erreur suppression cours:', error);
      }
    }
  };

  const handleClientToggle = (clientId: number) => {
    setFormData(prev => ({
      ...prev,
      clients: prev.clients.includes(clientId)
        ? prev.clients.filter(id => id !== clientId)
        : [...prev.clients, clientId]
    }));
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
          <BookOpen className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Cours</h1>
            <p className="text-gray-600">Créer et gérer les cours de formation</p>
          </div>
        </div>
        <Button icon={Plus} onClick={handleCreate}>
          Nouveau Cours
        </Button>
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Rechercher par intitulé ou enseignant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              {filteredCours.length} cours trouvé(s)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Liste des cours */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCours.map((cours) => (
          <Card key={cours.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{cours.intitule}</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(cours)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cours)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Enseignant</p>
                  <p className="font-medium">{cours.enseignant}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {cours.nombre_clients} client(s)
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDateShort(cours.created_at)}
                  </span>
                </div>
                {cours.clients_noms && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Clients inscrits:</p>
                    <p className="text-sm text-gray-700 truncate" title={cours.clients_noms}>
                      {cours.clients_noms}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCours.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-lg font-medium text-gray-900">Aucun cours trouvé</p>
            <p className="text-gray-500">Commencez par créer votre premier cours.</p>
            <Button className="mt-4" icon={Plus} onClick={handleCreate}>
              Créer un cours
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de création/édition */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedCours(null);
        }}
        title={selectedCours ? 'Modifier le cours' : 'Nouveau cours'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intitulé du cours *
              </label>
              <input
                type="text"
                required
                value={formData.intitule}
                onChange={(e) => setFormData({ ...formData, intitule: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Développement Web"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enseignant *
              </label>
              <input
                type="text"
                required
                value={formData.enseignant}
                onChange={(e) => setFormData({ ...formData, enseignant: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Prof. Kouame"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clients à affecter
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
              {clients.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucun client actif disponible</p>
              ) : (
                <div className="space-y-2">
                  {clients.map((client) => (
                    <label key={client.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.clients.includes(client.id)}
                        onChange={() => handleClientToggle(client.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">
                        {client.nom} {client.prenom} ({client.type_formation})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setSelectedCours(null);
              }}
            >
              Annuler
            </Button>
            <Button type="submit">
              {selectedCours ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
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
            Êtes-vous sûr de vouloir supprimer le cours{' '}
            <strong>{selectedCours?.intitule}</strong> ?
            Cette action supprimera également toutes les présences associées.
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

export default Cours;