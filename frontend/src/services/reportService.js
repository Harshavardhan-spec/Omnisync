import api from './api';

/**
 * Reporting endpoints exposed by the Django reports application.
 * The shared API client supplies the JWT bearer token and refresh behavior.
 */
export const reportService = {
  getDepartmentReport: async () => {
    const response = await api.get('/reports/department/');
    return response.data;
  },

  getFacultyReport: async () => {
    const response = await api.get('/reports/faculty/');
    return response.data;
  },

  getStudentDashboard: async () => {
    const response = await api.get('/reports/student-dashboard/');
    return response.data;
  },

  exportCSVUrl: '/api/reports/export-csv/',
};