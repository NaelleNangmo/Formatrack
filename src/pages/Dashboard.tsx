import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Banknote, UserX, TrendingUp, Calendar } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../components/UI/Card';
import { dashboardService, clientService, paiementService } from '../services/api';
import { formatCurrency } from '../utils/format';

interface DashboardStats {
  totalClients: number;
  clientsActifs: number;
  totalCours: number;
  paiementsAujourdhui: number;
  absentsAujourdhui: number;
  totalRecettes: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    clientsActifs: 0,
    totalCours: 0,
    paiementsAujourdhui: 0,
    absentsAujourdhui: 0,
    totalRecettes: 0,
  });
  const [recentClients, setRecentClients] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, clientsData, paymentsData] = await Promise.all([
        dashboardService.getStats(),
        clientService.getAll(),
        paiementService.getAll()
      ]);

      setStats(statsData);
      setRecentClients(clientsData.slice(0, 5));
      setRecentPayments(paymentsData.slice(0, 5));
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Clients',
      value: stats.totalClients,
      subtitle: `${stats.clientsActifs} actifs`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Cours Disponibles',
      value: stats.totalCours,
      subtitle: 'formations',
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Paiements Aujourd\'hui',
      value: formatCurrency(stats.paiementsAujourdhui),
      subtitle: 'reçus aujourd\'hui',
      icon: Banknote,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Absents Aujourd\'hui',
      value: stats.absentsAujourdhui,
      subtitle: 'absences',
      icon: UserX,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Recettes Totales',
      value: formatCurrency(stats.totalRecettes),
      subtitle: 'depuis le début',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Date d\'Aujourd\'hui',
      value: new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
      subtitle: new Date().getFullYear().toString(),
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-2">
          Vue d'ensemble de votre centre de formation
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.subtitle}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Clients Récemment Inscrits</h3>
          </CardHeader>
          <CardContent>
            <RecentClients clients={recentClients} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Derniers Paiements</h3>
          </CardHeader>
          <CardContent>
            <RecentPayments payments={recentPayments} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const RecentClients: React.FC<{ clients: any[] }> = ({ clients }) => {
  if (clients.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">Aucun client inscrit récemment</p>
    );
  }

  return (
    <div className="space-y-3">
      {clients.map((client) => (
        <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">{client.nom} {client.prenom}</p>
            <p className="text-sm text-gray-600">{client.domaine_etude}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{client.type_formation}</p>
            <p className="text-xs text-gray-500">
              {new Date(client.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

const RecentPayments: React.FC<{ payments: any[] }> = ({ payments }) => {
  if (payments.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">Aucun paiement récent</p>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((paiement) => (
        <div key={paiement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">
              {paiement.nom} {paiement.prenom}
            </p>
            <p className="text-sm text-gray-600">
              {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-green-600">
              {formatCurrency(paiement.montant)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;