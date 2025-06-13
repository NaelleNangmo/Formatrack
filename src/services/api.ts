import axios from 'axios';

const API_BASE_URL =  'http://localhost:50545/api';

// Configuration d'axios
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Services d'authentification
export const authService = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    const { token, user } = response.data;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
    return { token, user };
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('current_user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  },
};

// Services pour les clients
export const clientService = {
  getAll: async () => {
    const response = await api.get('/clients');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  create: async (clientData: never) => {
    const response = await api.post('/clients', clientData);
    return response.data;
  },

  update: async (id: number, clientData: any) => {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },

  getPaiements: async (id: number) => {
    const response = await api.get(`/clients/${id}/paiements`);
    return response.data;
  },

  getAbsencesRetards: async (id: number) => {
    const response = await api.get(`/clients/${id}/absences-retards`);
    return response.data;
  },
};

// Services pour les cours
export const coursService = {
  getAll: async () => {
    const response = await api.get('/cours');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/cours/${id}`);
    return response.data;
  },

  create: async (coursData: any) => {
    const response = await api.post('/cours', coursData);
    return response.data;
  },

  update: async (id: number, coursData: any) => {
    const response = await api.put(`/cours/${id}`, coursData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/cours/${id}`);
    return response.data;
  },

  getClients: async (id: number) => {
    const response = await api.get(`/cours/${id}/clients`);
    return response.data;
  },
};

// Services pour les présences
export const presenceService = {
  getAll: async () => {
    const response = await api.get('/presences');
    return response.data;
  },

  create: async (presenceData: any) => {
    const response = await api.post('/presences', presenceData);
    return response.data;
  },
};

// Services pour les paiements
export const paiementService = {
  getAll: async () => {
    const response = await api.get('/paiements');
    return response.data;
  },

  create: async (paiementData: any) => {
    const response = await api.post('/paiements', paiementData);
    return response.data;
  },
};

// Services pour les absences et retards
export const absenceRetardService = {
  getAll: async () => {
    const response = await api.get('/absences-retards');
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/absences-retards/${id}`);
    return response.data;
  },
};

// Services pour les utilisateurs
export const userService = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  create: async (userData: any) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// Services pour le dashboard
export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};

export default api;