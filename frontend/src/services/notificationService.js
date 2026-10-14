import api from './api';

export const notificationService = {
  getNotifications: async () => {
    const response = await api.get('/notifications/');
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.post(`/notifications/${id}/read/`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post('/notifications/mark_all_read/');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread_count/');
    return response.data;
  },

  getMessages: async () => {
    const response = await api.get('/messages/');
    return response.data;
  },

  sendMessage: async (data) => {
    const response = await api.post('/messages/', data);
    return response.data;
  },

  getActivityLogs: async (params = {}) => {
    const response = await api.get('/activity-logs/', { params });
    return response.data;
  },
};


export { reportService } from './reportService';
