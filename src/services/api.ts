import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface ClauseTemplate {
  id: string;
  title: string;
  type: string;
  is_active: boolean;
  updated_at: string;
  created_at: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ClausesResponse {
  clause_templates: ClauseTemplate[];
  pagination: PaginationInfo;
}


// Auth utilities
export const authUtils = {
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  },
  
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },
  
  setToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
  },
  
  logout: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
};

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = authUtils.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Clauses API
export const clausesApi = {
  getClauses: async (): Promise<{ data: ClausesResponse }> => {
    const response = await api.get('/api/clauses/');
    console.log(response.data);
    return response.data;
  },
  
  getClause: async (id: string): Promise<{ data: ClauseTemplate }> => {
    const response = await api.get(`/api/clauses/${id}`);
    return response.data;
  },
  
  createClause: async (data: Partial<ClauseTemplate>): Promise<{ data: ClauseTemplate }> => {
    const response = await api.post('/api/clauses', data);
    return response.data;
  },
  
  updateClause: async (id: string, data: Partial<ClauseTemplate>): Promise<{ data: ClauseTemplate }> => {
    const response = await api.put(`/api/clauses/${id}`, data);
    return response.data;
  },
  
  deleteClause: async (id: string): Promise<void> => {
    await api.delete(`/api/clauses/${id}`);
  }
};

export default api;