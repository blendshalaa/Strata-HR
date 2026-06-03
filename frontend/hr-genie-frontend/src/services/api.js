import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000, // 30s timeout — prevents infinite hangs during backend cold starts
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
    // Retry config defaults
    config.__retryCount = config.__retryCount || 0;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors — includes retry logic for cold-start resilience
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Retry on network errors or timeouts (Render cold-start), up to 2 retries
    const isRetryable = !error.response && (error.code === 'ECONNABORTED' || error.message?.includes('Network Error'));
    if (isRetryable && config && config.__retryCount < 2) {
      config.__retryCount += 1;
      const delay = config.__retryCount * 3000; // 3s, 6s
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(config);
    }

    if (error.response?.status === 401) {
      const isLoginRequest = config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        // Session expired — show a message before redirecting
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Store a flag so the login page can show a "session expired" message
        sessionStorage.setItem('session_expired', '1');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Wake-up ping — fire-and-forget request to the health endpoint.
 * Call this early to start the Render cold-boot in the background
 * so that subsequent authenticated requests respond faster.
 */
export const wakeUpBackend = () => {
  const baseUrl = API_URL.replace('/api', '');
  fetch(`${baseUrl}/health`, { mode: 'cors' }).catch(() => {});
};


// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Chat endpoints
export const chatAPI = {
  sendMessage: (data) => api.post('/chat/message', data),
  confirmAction: (data) => api.post('/chat/confirm', data),
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
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteAvatar: () => api.delete('/users/me/avatar'),
};

// Department endpoints
export const departmentAPI = {
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// Audit log endpoints
export const auditAPI = {
  getLogs: (params) => api.get('/audit', { params }),
  getStats: () => api.get('/audit/stats'),
};

export default api;