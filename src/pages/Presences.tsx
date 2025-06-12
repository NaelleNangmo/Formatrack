import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Calendar, Clock, Users, CheckCircle, XCircle } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../components/UI/Card';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import { coursService, presenceService } from '../services/api';
import { getCurrentTime, formatTime } from '../utils/format';

interface Cours {
  id: number;
  intitule: string;
  enseignant: string;
  nombre_clients: number;
}

interface Client {
  id: number;
  nom: string;
  prenom: string;
  type_formation: string;
  statut_formation: string;
}

interface PresenceData {
  client_id: number;
  etat: 'present' | 'absent';
  heure_presence: string;
}

const Presences: React.FC = () => {
  const [cours, setCours] = useState<Cours[]>([]);
  const [selectedCours, setSelectedCours] = useState<Cours | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [presences, setPresences] = useState<PresenceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  useEffect(() => {
    loadCours();
    
    // Mettre à jour l'heure toutes les secondes
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCours) {
      loadClientsForCours(selectedCours.id);
    }
  }, [selectedCours]);

  const loadCours = async () => {
    try {
      setLoading(true);
      const coursData = await coursService.getAll();
      setCours(coursData.filter((c: Cours) => c.nombre_clients > 0));
    } catch (error) {
      console.error('Erreur chargement cours:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClientsForCours = async (coursId: number) => {
    try {
      const clientsData = await coursService.getClients(coursId);
      setClients(clientsData);
      
      // Initialiser les présences
      const initialPresences = clientsData.map((client: Client) => ({
        client_id: client.id,
        etat: 'absent' as const,
        heure_presence: currentTime,
      }));
      setPresences(initialPresences);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  const handlePresenceChange = (clientId: number, etat: 'present' | 'absent') => {
    setPresences(prev => prev.map(p => 
      p.client_id === clientId 
        ? { ...p, etat, heure_presence: etat === 'present' ? currentTime : '' }
        : p
    ));
  };

  const handleSubmitPresences = async () => {
    if (!selectedCours) return;

    try {
      setSaving(true);
      
      for (const presence of presences) {
        await presenceService.create({
          client_id: presence.client_id,
          cours_id: selectedCours.id,
          etat: presence.etat,
          heure_presence: presence.heure_presence || currentTime,
        });
      }

      alert('Présences enregistrées avec succès !');
      
      // Réinitialiser les présences
      const initialPresences = clients.map(client => ({
        client_id: client.id,
        etat: 'absent' as const,
        heure_presence: currentTime,
      }));
      setPresences(initialPresences);
      
    } catch (error) {
      console.error('Erreur enregistrement présences:', error);
      alert('Erreur lors de l\'enregistrement des présences');
    } finally {
      setSaving(false);
    }
  };

  const isLate = (timeString: string): boolean => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours > 9 || (hours === 9 && minutes > 0);
  };

  const getPresenceStats = () => {
    const presents = presences.filter(p => p.etat === 'present').length;
    const absents = presences.filter(p => p.etat === 'absent').length;
    const retards = presences.filter(p => p.etat === 'present' && isLate(p.heure_presence)).length;
    
    return { presents, absents, retards };
  };

  const stats = getPresenceStats();

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
        <ClipboardCheck className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appel / Présences</h1>
          <p className="text-gray-600">Enregistrer les présences des clients</p>
        </div>
      </div>

      {/* Informations actuelles */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">
                  {new Date().toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Heure actuelle</p>
                <p className="font-medium text-lg">{currentTime}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Cours sélectionné</p>
                <p className="font-medium">
                  {selectedCours ? selectedCours.intitule : 'Aucun cours sélectionné'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sélection du cours */}
      {!selectedCours && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Sélectionner un cours</h3>
          </CardHeader>
          <CardContent>
            {cours.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucun cours avec des clients affectés disponible
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cours.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCours(c)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <h4 className="font-medium text-gray-900">{c.intitule}</h4>
                    <p className="text-sm text-gray-600">{c.enseignant}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {c.nombre_clients} client(s) affecté(s)
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Interface d'appel */}
      {selectedCours && (
        <>
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
                <div className="text-sm text-gray-600">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.presents}</div>
                <div className="text-sm text-gray-600">Présents</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.absents}</div>
                <div className="text-sm text-gray-600">Absents</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.retards}</div>
                <div className="text-sm text-gray-600">Retards</div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des clients */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Appel - {selectedCours.intitule}
                </h3>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSelectedCours(null);
                      setClients([]);
                      setPresences([]);
                    }}
                  >
                    Changer de cours
                  </Button>
                  <Button
                    onClick={handleSubmitPresences}
                    disabled={saving}
                    variant="success"
                  >
                    {saving ? 'Enregistrement...' : 'Valider l\'appel'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {clients.map((client) => {
                  const presence = presences.find(p => p.client_id === client.id);
                  const isPresent = presence?.etat === 'present';
                  const isClientLate = isPresent && presence && isLate(presence.heure_presence);

                  return (
                    <div
                      key={client.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        isPresent 
                          ? isClientLate 
                            ? 'border-orange-200 bg-orange-50' 
                            : 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {client.nom} {client.prenom}
                            </h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={client.type_formation === 'stagiaire' ? 'info' : 'default'}>
                                {client.type_formation}
                              </Badge>
                              {isPresent && presence && (
                                <>
                                  <span className="text-sm text-gray-600">
                                    Arrivée: {formatTime(presence.heure_presence)}
                                  </span>
                                  {isClientLate && (
                                    <Badge variant="warning">Retard</Badge>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Button
                            size="sm"
                            variant={isPresent ? 'success' : 'secondary'}
                            icon={CheckCircle}
                            onClick={() => handlePresenceChange(client.id, 'present')}
                          >
                            Présent
                          </Button>
                          <Button
                            size="sm"
                            variant={!isPresent ? 'danger' : 'secondary'}
                            icon={XCircle}
                            onClick={() => handlePresenceChange(client.id, 'absent')}
                          >
                            Absent
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {clients.length === 0 && (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-lg font-medium text-gray-900">Aucun client affecté</p>
                  <p className="text-gray-500">Ce cours n'a pas encore de clients affectés.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Presences;