import React, { useState } from 'react';
import { UserPlus, Save } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { clientService } from '../services/api';

const Enregistrement: React.FC = () => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    localite: '',
    telephone_parent: '',
    niveau_scolaire: '',
    domaine_etude: '',
    duree_formation: 0,
    type_formation: 'stagiaire' as 'stagiaire' | 'apprenant',
    statut_formation: 'en_cours' as 'en_cours' | 'suspendu' | 'termine',
    prix_formation: 0,
    montant_verse: 0,
  });

  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('formation') || name.includes('montant') || name === 'duree_formation' 
        ? Number(value) || 0 
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      await clientService.create(formData);
      
      setSuccess(true);
      // Reset form
      setFormData({
        nom: '',
        prenom: '',
        localite: '',
        telephone_parent: '',
        niveau_scolaire: '',
        domaine_etude: '',
        duree_formation: 0,
        type_formation: 'stagiaire',
        statut_formation: 'en_cours',
        prix_formation: 0,
        montant_verse: 0,
      });

      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const montantRestant = formData.prix_formation - formData.montant_verse;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <UserPlus className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enregistrement</h1>
          <p className="text-gray-600">Enregistrer un nouveau client (stagiaire ou apprenant)</p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <p className="flex items-center">
            <span className="mr-2">✓</span>
            Client enregistré avec succès !
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="flex items-center">
            <span className="mr-2">✗</span>
            {error}
          </p>
        </div>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Informations du client</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  required
                  value={formData.nom}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nom de famille"
                />
              </div>

              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  required
                  value={formData.prenom}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Prénom"
                />
              </div>

              <div>
                <label htmlFor="localite" className="block text-sm font-medium text-gray-700 mb-2">
                  Localité
                </label>
                <input
                  type="text"
                  id="localite"
                  name="localite"
                  value={formData.localite}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ville ou quartier"
                />
              </div>

              <div>
                <label htmlFor="telephone_parent" className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone du parent *
                </label>
                <input
                  type="tel"
                  id="telephone_parent"
                  name="telephone_parent"
                  required
                  value={formData.telephone_parent}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+225 XX XX XX XX XX"
                />
              </div>
            </div>

            {/* Informations académiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="niveau_scolaire" className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau scolaire
                </label>
                <input
                  type="text"
                  id="niveau_scolaire"
                  name="niveau_scolaire"
                  value={formData.niveau_scolaire}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Terminale, Licence, Master..."
                />
              </div>

              <div>
                <label htmlFor="domaine_etude" className="block text-sm font-medium text-gray-700 mb-2">
                  Domaine d'étude
                </label>
                <input
                  type="text"
                  id="domaine_etude"
                  name="domaine_etude"
                  value={formData.domaine_etude}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Informatique, Marketing, Comptabilité..."
                />
              </div>
            </div>

            {/* Informations de formation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="type_formation" className="block text-sm font-medium text-gray-700 mb-2">
                  Type de formation *
                </label>
                <select
                  id="type_formation"
                  name="type_formation"
                  required
                  value={formData.type_formation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="stagiaire">Stagiaire</option>
                  <option value="apprenant">Apprenant</option>
                </select>
              </div>

              <div>
                <label htmlFor="duree_formation" className="block text-sm font-medium text-gray-700 mb-2">
                  Durée (mois) *
                </label>
                <input
                  type="number"
                  id="duree_formation"
                  name="duree_formation"
                  required
                  min="1"
                  value={formData.duree_formation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="6"
                />
              </div>

              <div>
                <label htmlFor="statut_formation" className="block text-sm font-medium text-gray-700 mb-2">
                  Statut *
                </label>
                <select
                  id="statut_formation"
                  name="statut_formation"
                  required
                  value={formData.statut_formation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="en_cours">En cours</option>
                  <option value="suspendu">Suspendu</option>
                  <option value="termine">Terminé</option>
                </select>
              </div>
            </div>

            {/* Informations financières */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="prix_formation" className="block text-sm font-medium text-gray-700 mb-2">
                  Prix total (FCFA) *
                </label>
                <input
                  type="number"
                  id="prix_formation"
                  name="prix_formation"
                  required
                  min="0"
                  value={formData.prix_formation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="150000"
                />
              </div>

              <div>
                <label htmlFor="montant_verse" className="block text-sm font-medium text-gray-700 mb-2">
                  Montant versé (FCFA)
                </label>
                <input
                  type="number"
                  id="montant_verse"
                  name="montant_verse"
                  min="0"
                  max={formData.prix_formation}
                  value={formData.montant_verse}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant restant (FCFA)
                </label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                  {montantRestant.toLocaleString()} FCFA
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setFormData({
                    nom: '',
                    prenom: '',
                    localite: '',
                    telephone_parent: '',
                    niveau_scolaire: '',
                    domaine_etude: '',
                    duree_formation: 0,
                    type_formation: 'stagiaire',
                    statut_formation: 'en_cours',
                    prix_formation: 0,
                    montant_verse: 0,
                  });
                }}
              >
                Réinitialiser
              </Button>
              <Button
                type="submit"
                icon={Save}
                disabled={loading}
              >
                {loading ? 'Enregistrement...' : 'Enregistrer le client'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Enregistrement;