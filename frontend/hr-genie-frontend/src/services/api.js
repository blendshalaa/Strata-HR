import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Chat endpoints
export const chatAPI = {
  sendMessage: (data) => api.post('/chat/message', data),
  getConversations: () => api.get('/chat/conversations'),
  getConversationMessages: (id) => api.get(`/chat/conversations/${id}`),
  deleteConversation: (id) => api.delete(`/chat/conversations/${id}`),
};

// Leave endpoints
export const leaveAPI = {
  getMyRequests: () => api.get('/leave/my-requests'),
  getAllRequests: (status) => api.get('/leave/all-requests', { params: { status } }),
  createRequest: (data) => api.post('/leave/request', data),
  updateStatus: (id, status) => api.patch(`/leave/${id}/status`, { status }),
  getBalance: () => api.get('/leave/balance'),
};

// Knowledge endpoints
export const knowledgeAPI = {
  getAll: (params) => api.get('/knowledge', { params }),
  getById: (id) => api.get(`/knowledge/${id}`),
  search: (query, category) => api.get('/knowledge/search', { params: { query, category } }),
  create: (data) => api.post('/knowledge', data),
  update: (id, data) => api.put(`/knowledge/${id}`, data),
  delete: (id) => api.delete(`/knowledge/${id}`),
  getCategories: () => api.get('/knowledge/categories'),
};

// Analytics endpoints
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getUserActivity: (days) => api.get('/analytics/activity', { params: { days } }),
};

// User endpoints
export const userAPI = {
  getDirectory: () => api.get('/users/directory'),
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  invite: (email) => api.post('/users/invite', { email }),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Department endpoints
export const departmentAPI = {
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

export default api;