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

// Dashboard types
export interface StatusCount {
  status: string;
  status_display: string;
  count: number;
}

export interface ProjectValueDistribution {
  project_name: string;
  total_value: number;
}

export interface ContractTypeDistribution {
  contract_type: string;
  count: number;
}

export interface DashboardData {
  status_counts: StatusCount[];
  project_value_distribution: ProjectValueDistribution[];
  contract_type_distribution: ContractTypeDistribution[];
  total_contracts: number;
  total_value: number;
}

export interface DashboardResponse {
  status: string;
  message: string;
  data: DashboardData;
}

// Contracts types
export interface Contract {
  id: number;
  project_name: string;
  contract_type: string;
  status: string;
  status_display: string;
  total_value: number;
  signing_date: string;
  created_at: string;
}

export interface ContractsResponse {
  status: string;
  message: string;
  data: Contract[];
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
    console.log('🚀 API: Creating clause with data:', data);
    console.log('🚀 API: Data type:', typeof data);
    console.log('🚀 API: Data keys:', Object.keys(data));
    
    const response = await api.post('/api/clauses/', data);
    console.log('🚀 API: Create response:', response);
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

// Dashboard API
export const dashboardApi = {
  getDashboardData: async (): Promise<DashboardResponse> => {
    const response = await api.get('/api/dashboard/status-counts');
    return response.data;
  },
  
  getContracts: async (): Promise<ContractsResponse> => {
    const response = await api.get('/api/dashboard/contracts');
    return response.data;
  }
};

export default api;