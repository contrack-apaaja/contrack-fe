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
  clause_code?: string;
  title: string;
  type: string;
  content?: string;
  is_active: boolean;
  updated_at: string;
  created_at: string;
}

export interface Stakeholder {
  stakeholder_id: number;
  role_in_contract: string;
  representative_name: string;
  representative_title: string;
  other_details?: any;
}

export interface ContractTemplate {
  id: string;
  project_name: string;
  package_name: string;
  external_reference: string;
  contract_type: string;
  signing_place: string;
  signing_date: string;
  total_value: number;
  funding_source: string;
  stakeholders: Stakeholder[];
  clause_template_ids: number[];
  created_at: string;
  updated_at: string;
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
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Clauses API
export const clausesApi = {
  getClauses: async (): Promise<{ data: ClausesResponse }> => {
    const response = await api.get('/api/clauses/');
    console.log(response.data);
    return response.data as { data: ClausesResponse };
  },
  
  getClause: async (id: string): Promise<{ data: ClauseTemplate }> => {
    const response = await api.get(`/api/clauses/${id}`);
    return response.data as { data: ClauseTemplate };
  },
  
  createClause: async (data: Partial<ClauseTemplate>): Promise<{ data: ClauseTemplate }> => {
    console.log('🚀 API: Creating clause with data:', data);
    console.log('🚀 API: Data type:', typeof data);
    console.log('🚀 API: Data keys:', Object.keys(data));
    
    const response = await api.post('/api/clauses/', data);
    console.log('🚀 API: Create response:', response);
    return response.data as { data: ClauseTemplate };
  },
  
  updateClause: async (id: string, data: Partial<ClauseTemplate>): Promise<{ data: ClauseTemplate }> => {
    const response = await api.put(`/api/clauses/${id}`, data);
    return response.data as { data: ClauseTemplate };
  },
  
  deleteClause: async (id: string): Promise<void> => {
    await api.delete(`/api/clauses/${id}`);
  }
};

// Contract API functions
export const contractsApi = {
  getContracts: async (): Promise<{ data: ContractTemplate[] }> => {
    const response = await api.get('/api/contracts');
    return response.data as { data: ContractTemplate[] };
  },
  
  getContract: async (id: string): Promise<{ data: ContractTemplate }> => {
    const response = await api.get(`/api/contracts/${id}`);
    return response.data as { data: ContractTemplate };
  },
  
  createContract: async (data: Partial<ContractTemplate>): Promise<{ data: ContractTemplate }> => {
    console.log('🚀 API: Creating contract with data:', data);
    const response = await api.post('/api/contracts/', data);
    return response.data as { data: ContractTemplate };
  },
  
  updateContract: async (id: string, data: Partial<ContractTemplate>): Promise<{ data: ContractTemplate }> => {
    const response = await api.put(`/api/contracts/${id}`, data);
    return response.data as { data: ContractTemplate };
  },
  
  deleteContract: async (id: string): Promise<void> => {
    await api.delete(`/api/contracts/${id}`);
  }
};

export default api;