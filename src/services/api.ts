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

export interface Stakeholder {
  id: number;
  contract_id: number;
  stakeholder_id: number;
  role_in_contract: string;
  representative_name: string;
  representative_title: string;
  stakeholder: {
    id: number;
    legal_name: string;
    address: string;
    type: string;
  };
}

export interface ContractClause {
  id: number;
  contract_id: number;
  clause_template_id: number;
  display_order: number;
  custom_content: string | null;
  clause_template: {
    id: number;
    clause_code: string;
    title: string;
    type: string;
    content: string;
    is_active: boolean;
  };
}

export interface Contract {
  id: number;
  base_id: string;
  version_number: number;
  project_name: string;
  package_name?: string;
  contract_number: string;
  external_reference?: string;
  contract_type: string;
  signing_place?: string;
  signing_date?: string;
  total_value: number;
  funding_source?: string;
  status: 'DRAFT' | 'PENDING_LEGAL_REVIEW' | 'PENDING_SIGNATURE' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  created_by: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  stakeholders?: Stakeholder[];
  clauses?: ContractClause[];
}

export interface CreateContractRequest {
  project_name: string;
  package_name?: string;
  external_reference?: string;
  contract_type: string;
  signing_place?: string;
  signing_date?: string;
  total_value: number;
  funding_source?: string;
  stakeholders?: Array<{
    stakeholder_id: number;
    role_in_contract: string;
    representative_name: string;
    representative_title: string;
    other_details?: Record<string, unknown>;
  }>;
  clause_template_ids?: number[];
}

export interface ContractsResponse {
  contracts: Contract[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface StatusHistoryEntry {
  id: number;
  contract_id: number;
  from_status: string;
  to_status: string;
  changed_by: string;
  change_reason: string;
  comments: string;
  changed_at: string;
}

export interface ContractStats {
  DRAFT: number;
  PENDING_LEGAL_REVIEW: number;
  PENDING_SIGNATURE: number;
  ACTIVE: number;
  EXPIRED: number;
  TERMINATED: number;
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

// Contract Approval types
export interface ContractApprovalRequest {
  contract_id: number;
}

export interface ContractApprovalResponse {
  status: string;
  message: string;
  data: {
    contract_id: number;
    contract_name: string;
    total_value: number;
    risk_level: string;
    risk_score: number;
    approval_status: string;
    approval_message: string;
    requires_review: boolean;
    review_reasons: string[];
    next_steps: string[];
  };
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

// Contract Approval API
export const contractApprovalApi = {
  approveContract: async (contractId: number): Promise<ContractApprovalResponse> => {
    const response = await api.post('/api/contracts/approve', {
      contract_id: contractId
    });
    return response.data;
  }
};

// Contracts API
export const contractsApi = {
  getContracts: async (): Promise<{ data: ContractsResponse }> => {
    const response = await api.get('/api/contracts/');
    
    // Handle different possible response structures
    const responseData = response.data;
    
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      // If response has a nested data structure
      return responseData as { data: ContractsResponse };
    } else if (responseData && typeof responseData === 'object' && 'contracts' in responseData && Array.isArray((responseData as Record<string, unknown>).contracts)) {
      // If response.data directly contains contracts
      return { data: responseData as ContractsResponse };
    } else if (Array.isArray(responseData)) {
      // If response.data is directly an array of contracts
      return { 
        data: { 
          contracts: responseData as Contract[], 
          total: responseData.length,
          page: 1,
          limit: responseData.length,
          pages: 1
        } 
      };
    } else {
      // Return empty contracts if unexpected structure
      return { data: { contracts: [], total: 0, page: 1, limit: 10, pages: 0 } };
    }
  },

  getContract: async (id: number): Promise<{ data: Contract }> => {
    const response = await api.get(`/api/contracts/${id}`);
    return response.data as { data: Contract };
  },

  createContract: async (data: CreateContractRequest): Promise<{ data: ContractTemplate }> => {
    console.log('🚀 API: Creating contract with data:', data);
    const response = await api.post('/api/contracts/', data);
    return response.data as { data: ContractTemplate };
  },

  updateContract: async (id: number, data: Partial<CreateContractRequest>): Promise<{ data: null }> => {
    const response = await api.put(`/api/contracts/${id}`, data);
    return response.data as { data: null };
  },

  deleteContract: async (id: number): Promise<{ data: null }> => {
    const response = await api.delete(`/api/contracts/${id}`);
    return response.data as { data: null };
  },

  changeContractStatus: async (id: number, data: {
    status: Contract['status'];
    change_reason: string;
    comments?: string;
  }): Promise<{ data: null }> => {
    const response = await api.post(`/api/contracts/${id}/status`, data);
    return response.data as { data: null };
  },

  getStatusHistory: async (id: number): Promise<{ data: StatusHistoryEntry[] }> => {
    const response = await api.get(`/api/contracts/${id}/status-history/`);
    return response.data as { data: StatusHistoryEntry[] };
  },

  getContractStats: async (): Promise<{ data: ContractStats }> => {
    const response = await api.get('/api/contracts/stats/');
    return response.data as { data: ContractStats };
  },

  createContractVersion: async (baseId: string, data: {
    project_name?: string;
    package_name?: string;
    external_reference?: string;
    contract_type?: string;
    signing_place?: string;
    signing_date?: string;
    total_value?: number;
    funding_source?: string;
    changes_summary: string;
    version_notes?: string;
  }): Promise<{ data: Contract }> => {
    const response = await api.post(`/api/contract-versions/${baseId}`, data);
    return response.data as { data: Contract };
  },

  getContractVersions: async (baseId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: {
    versions: Contract[];
    base_id: string;
    total: number;
    page: number;
    limit: number;
    pages: number;
  } }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get(`/api/contract-versions/${baseId}?${queryParams.toString()}`);
    return response.data as { data: {
      versions: Contract[];
      base_id: string;
      total: number;
      page: number;
      limit: number;
      pages: number;
    } };
  }
};

export default api;