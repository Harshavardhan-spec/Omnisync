import api from './api';

export const deliverableService = {
  getDeliverables: async (params = {}) => {
    const response = await api.get('/deliverables/', { params });
    return response.data;
  },

  getDeliverable: async (id) => {
    const response = await api.get(`/deliverables/${id}/`);
    return response.data;
  },

  createDeliverable: async (data) => {
    const response = await api.post('/deliverables/', data);
    return response.data;
  },

  updateDeliverable: async (id, data) => {
    const response = await api.patch(`/deliverables/${id}/`, data);
    return response.data;
  },

  getMilestones: async (params = {}) => {
    const response = await api.get('/milestones/', { params });
    return response.data;
  },

  createMilestone: async (data) => {
    const response = await api.post('/milestones/', data);
    return response.data;
  },

  getTasks: async (params = {}) => {
    const response = await api.get('/tasks/', { params });
    return response.data;
  },

  createTask: async (data) => {
    const response = await api.post('/tasks/', data);
    return response.data;
  },

  updateTask: async (id, data) => {
    const response = await api.patch(`/tasks/${id}/`, data);
    return response.data;
  },
};
