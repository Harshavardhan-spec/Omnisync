import api from './api';

export const assessmentService = {
  getAssessments: async (params = {}) => {
    const response = await api.get('/assessments/', { params });
    return response.data;
  },

  getGradebook: async (projectId = null) => {
    const params = projectId ? { project: projectId } : {};
    const response = await api.get('/assessments/gradebook/', { params });
    return response.data;
  },

  createAssessment: async (data) => {
    const response = await api.post('/assessments/', data);
    return response.data;
  },

  enterMarks: async (data) => {
    const response = await api.post('/assessment-results/', data);
    return response.data;
  },

  updateMarks: async (id, data) => {
    const response = await api.patch(`/assessment-results/${id}/`, data);
    return response.data;
  },
};
