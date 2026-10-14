import api from './api';

export const projectService = {
  getProjects: async (params = {}) => {
    const response = await api.get('/projects/', { params });
    return response.data;
  },

  getProject: async (id) => {
    const response = await api.get(`/projects/${id}/`);
    return response.data;
  },

  createProject: async (projectData) => {
    const response = await api.post('/projects/', projectData);
    return response.data;
  },

  updateProject: async (id, data) => {
    const response = await api.patch(`/projects/${id}/`, data);
    return response.data;
  },

  approveProject: async (id) => {
    const response = await api.post(`/projects/${id}/approve/`);
    return response.data;
  },

  rejectProject: async (id, reason) => {
    const response = await api.post(`/projects/${id}/reject/`, { reason });
    return response.data;
  },

  assignMentor: async (id, facultyId) => {
    const response = await api.post(`/projects/${id}/assign_mentor/`, { faculty_id: facultyId });
    return response.data;
  },

  getTeams: async (params = {}) => {
    const response = await api.get('/teams/', { params });
    return response.data;
  },

  addTeamMember: async (teamId, studentId, responsibility) => {
    const response = await api.post(`/teams/${teamId}/add_member/`, {
      student_id: studentId,
      responsibility,
    });
    return response.data;
  },

  removeTeamMember: async (teamId, studentId) => {
    const response = await api.delete(`/teams/${teamId}/remove_member/`, {
      data: { student_id: studentId },
    });
    return response.data;
  },
};
