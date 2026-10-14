import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    if (response.data.access) {
      localStorage.setItem('omnisync_access_token', response.data.access);
      localStorage.setItem('omnisync_refresh_token', response.data.refresh);
      localStorage.setItem('omnisync_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me/');
    localStorage.setItem('omnisync_user', JSON.stringify(response.data));
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.patch('/auth/me/', data);
    localStorage.setItem('omnisync_user', JSON.stringify(response.data));
    return response.data;
  },

  getUsers: async (params = {}) => {
    const response = await api.get('/auth/users/', { params });
    return response.data;
  },

  provisionUser: async (userData) => {
    const response = await api.post('/auth/provision/', userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('omnisync_access_token');
    localStorage.removeItem('omnisync_refresh_token');
    localStorage.removeItem('omnisync_user');
  },

  getStoredUser: () => {
    const u = localStorage.getItem('omnisync_user');
    return u ? JSON.parse(u) : null;
  },
};
