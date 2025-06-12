import React, { useState, useEffect } from 'react';
import { Banknote, Search, Plus, Eye, FileText, CreditCard } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../components/UI/Card';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import Modal from '../components/UI/Modal';
import { clientService, paiementService } from '../services/api';
import { formatCurrency, formatDateShort } from '../utils/format';
import jsPDF from 'jspdf';

interface Client {
  id: number;
  nom: string;
  prenom: string;
  telephone_parent: string;
  type_formation: string;
  prix_formation: number;
  montant_verse: number;
  montant_restant: number;
  statut_formation: string;
}

interface Paiement {
  id: number;
  client_id: number;
  montant: number;
  date_paiement: string;
  username: string;
  nom?: string;
  prenom?: string;
}

const Finance: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [allPaiements, setAllPaiements] = useState<Paiement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [montantPaiement, setMontantPaiement] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsData, paiementsData] = await Promise.all([
        clientService.getAll(),
        paiementService.getAll()
      ]);
      setClients(clientsData);
      setAllPaiements(paiementsData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.telephone_parent.includes(searchTerm)
  );

  const handleViewClient = async (client: Client) => {
    try {
      setSelectedClient(client);
      const clientPaiements = await clientService.getPaiements(client.id);
      setPaiements(clientPaiements);
      setShowClientModal(true);
    } catch (error) {
      console.error('Erreur chargement paiements client:', error);
    }
  };

  const handleAddPaiement = () => {
    setMontantPaiement('');
    setShowPaiementModal(true);
  };

  const handleSubmitPaiement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !montantPaiement) return;

    try {
      const montant = parseInt(montantPaiement);
      if (montant <= 0) {
        alert('Le montant doit être supérieur à 0');
        return;
      }

      if (montant > selectedClient.montant_restant) {
        alert('Le montant ne peut pas être supérieur au montant restant');
        return;
      }

      await paiementService.create({
        client_id: selectedClient.id,
        montant: montant
      });

      // Recharger les données
      await loadData();
      
      // Mettre à jour le client sélectionné
      const updatedClient = await clientService.getById(selectedClient.id);
      setSelectedClient(updatedClient);
      
      // Recharger les paiements du client
      const clientPaiements = await clientService.getPaiements(selectedClient.id);
      setPaiements(clientPaiements);

      setShowPaiementModal(false);
      setMontantPaiement('');
      
      alert('Paiement enregistré avec succès !');
    } catch (error) {
      console.error('Erreur enregistrement paiement:', error);
      alert('Erreur lors de l\'enregistrement du paiement');
    }
  };

  const generateReceipt = (client: Client, paiement: Paiement) => {
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(20);
    doc.text('REÇU DE PAIEMENT', 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('FormaTrack - Centre de Formation', 105, 45, { align: 'center' });
    
    // Informations du reçu
    doc.setFontSize(14);
    doc.text(`Reçu N°: ${paiement.id.toString().padStart(6, '0')}`, 20, 70);
    doc.text(`Date: ${formatDateShort(paiement.date_paiement)}`, 20, 85);
    
    // Informations client
    doc.text('INFORMATIONS CLIENT', 20, 110);
    doc.setFontSize(12);
    doc.text(`Nom: ${client.nom} ${client.prenom}`, 20, 125);
    doc.text(`Téléphone: ${client.telephone_parent}`, 20, 140);
    doc.text(`Type: ${client.type_formation}`, 20, 155);
    
    // Détails du paiement
    doc.setFontSize(14);
    doc.text('DÉTAILS DU PAIEMENT', 20, 180);
    doc.setFontSize(12);
    doc.text(`Montant versé: ${formatCurrency(paiement.montant)}`, 20, 195);
    doc.text(`Prix total formation: ${formatCurrency(client.prix_formation)}`, 20, 210);
    doc.text(`Total versé: ${formatCurrency(client.montant_verse)}`, 20, 225);
    doc.text(`Montant restant: ${formatCurrency(client.montant_restant)}`, 20, 240);
    
    // Signature
    doc.text('Signature:', 20, 270);
    doc.text(`Reçu par: ${paiement.username}`, 120, 270);
    
    doc.save(`recu_${client.nom}_${client.prenom}_${paiement.id}.pdf`);
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

  const getTotalStats = () => {
    const totalRecettes = allPaiements.reduce((sum, p) => sum + p.montant, 0);
    const totalRestant = clients.reduce((sum, c) => sum + c.montant_restant, 0);
    const clientsEnRetard = clients.filter(c => c.montant_restant > 0).length;
    
    return { totalRecettes, totalRestant, clientsEnRetard };
  };

  const stats = getTotalStats();

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
        <Banknote className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion Financière</h1>
          <p className="text-gray-600">Suivi des paiements et finances</p>
        </div>
      </div>

      {/* Statistiques financières */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-50">
                <Banknote className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600">Total Recettes</h3>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalRecettes)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-50">
                <CreditCard className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600">Total Restant</h3>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats.totalRestant)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-50">
                <Eye className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600">Clients en retard</h3>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.clientsEnRetard}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Rechercher un client par nom, prénom ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des clients */}
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
                    Prix Formation
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant Versé
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant Restant
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
                      <Badge variant={client.type_formation === 'stagiaire' ? 'info' : 'default'}>
                        {client.type_formation}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(client.statut_formation)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(client.prix_formation)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(client.montant_verse)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`text-sm font-medium ${
                        client.montant_restant > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(client.montant_restant)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Button
                        size="sm"
                        icon={Eye}
                        onClick={() => handleViewClient(client)}
                      >
                        Voir détails
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredClients.length === 0 && (
              <div className="text-center py-12">
                <Banknote className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-lg font-medium text-gray-900">Aucun client trouvé</p>
                <p className="text-gray-500">Essayez de modifier vos critères de recherche.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal détails client */}
      <Modal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        title={selectedClient ? `Finance - ${selectedClient.nom} ${selectedClient.prenom}` : ''}
        size="xl"
      >
        {selectedClient && (
          <div className="space-y-6">
            {/* Informations client */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Informations Client</h4>
                <div className="space-y-2">
                  <p><span className="text-gray-600">Nom:</span> {selectedClient.nom} {selectedClient.prenom}</p>
                  <p><span className="text-gray-600">Téléphone:</span> {selectedClient.telephone_parent}</p>
                  <p><span className="text-gray-600">Type:</span> {selectedClient.type_formation}</p>
                  <p><span className="text-gray-600">Statut:</span> {getStatusBadge(selectedClient.statut_formation)}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Situation Financière</h4>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Prix total</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {formatCurrency(selectedClient.prix_formation)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Montant versé</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(selectedClient.montant_verse)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    selectedClient.montant_restant > 0 ? 'bg-red-50' : 'bg-gray-50'
                  }`}>
                    <p className="text-sm text-gray-600">Reste à payer</p>
                    <p className={`text-lg font-semibold ${
                      selectedClient.montant_restant > 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {formatCurrency(selectedClient.montant_restant)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center space-x-3">
              {selectedClient.montant_restant > 0 && (
                <Button icon={Plus} onClick={handleAddPaiement}>
                  Ajouter un paiement
                </Button>
              )}
            </div>

            {/* Historique des paiements */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Historique des Paiements</h4>
              {paiements.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucun paiement enregistré</p>
              ) : (
                <div className="space-y-3">
                  {paiements.map((paiement) => (
                    <div key={paiement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(paiement.montant)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDateShort(paiement.date_paiement)} - Par {paiement.username}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={FileText}
                        onClick={() => generateReceipt(selectedClient, paiement)}
                      >
                        Reçu PDF
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal ajout paiement */}
      <Modal
        isOpen={showPaiementModal}
        onClose={() => setShowPaiementModal(false)}
        title="Ajouter un paiement"
        size="sm"
      >
        <form onSubmit={handleSubmitPaiement} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant (FCFA) *
            </label>
            <input
              type="number"
              required
              min="1"
              max={selectedClient?.montant_restant || 0}
              value={montantPaiement}
              onChange={(e) => setMontantPaiement(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Montant à verser"
            />
            {selectedClient && (
              <p className="text-sm text-gray-500 mt-1">
                Maximum: {formatCurrency(selectedClient.montant_restant)}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPaiementModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit">
              Enregistrer le paiement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Finance;