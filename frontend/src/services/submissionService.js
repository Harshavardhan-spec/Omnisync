import api from './api';

export const submissionService = {
  getSubmissions: async (params = {}) => {
    const response = await api.get('/submissions/', { params });
    return response.data;
  },

  getSubmission: async (id) => {
    const response = await api.get(`/submissions/${id}/`);
    return response.data;
  },

  submitDeliverable: async (formData) => {
    const response = await api.post('/submissions/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  reviewSubmission: async (id, reviewData) => {
    const response = await api.post(`/submissions/${id}/review/`, reviewData);
    return response.data;
  },
};
