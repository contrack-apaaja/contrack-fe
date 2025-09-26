"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, LogOut, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Info, Save, Edit, Eye, FileText, TrendingUp, Filter, X, Download, Calendar, DollarSign, Users, FileCheck, AlertTriangle, Shield, Clock, Building, MapPin, User, CheckCircle, Activity, History, Upload } from "lucide-react";
import { Button } from "@/app/components/Button";
import { Input } from "@/components/ui/input";
import { UltraSimpleSelect } from "@/app/components/ui/ultra-simple-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { contractsApi, Contract, CreateContractRequest, authUtils } from "@/services/api";

const CONTRACT_STATUSES = [
  'DRAFT',
  'PENDING_LEGAL_REVIEW',
  'PENDING_SIGNATURE',
  'ACTIVE',
  'EXPIRED',
  'TERMINATED'
] as const;

const CONTRACT_TYPES = [
  'Construction',
  'Service Agreement',
  'Supply Agreement',
  'Maintenance',
  'Consulting',
  'Software Development',
  'Other'
];

export default function ContractsPage() {
  const [allContracts, setAllContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [createdByFilter, setCreatedByFilter] = useState<string>("");
  const [fundingSourceFilter, setFundingSourceFilter] = useState<string>("");
  
  // Date range filters
  const [signingDateFrom, setSigningDateFrom] = useState<string>("");
  const [signingDateTo, setSigningDateTo] = useState<string>("");
  const [createdDateFrom, setCreatedDateFrom] = useState<string>("");
  const [createdDateTo, setCreatedDateTo] = useState<string>("");
  
  // Value range filters
  const [minValue, setMinValue] = useState<string>("");
  const [maxValue, setMaxValue] = useState<string>("");
  
  // Display and pagination state
  const [sortField, setSortField] = useState<keyof Contract | null>('updated_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'stakeholders' | 'clauses' | 'analysis' | 'audit'>('overview');
  const [isPublishingDraft, setIsPublishingDraft] = useState(false);
  
  // Create/Update dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<CreateContractRequest>({
    project_name: '',
    package_name: '',
    external_reference: '',
    contract_type: '',
    signing_place: '',
    signing_date: '',
    total_value: 0,
    funding_source: ''
  });
  
  // Form validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authUtils.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (!authenticated) {
        window.location.href = '/login';
        return;
      }
    };

    checkAuth();
  }, []);

  // Load all contracts once when authenticated
  useEffect(() => {
    const fetchAllContracts = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        setError(null);

        const response = await contractsApi.getContracts();

        
        // If no contracts returned, use mock data for testing
        if (response.data.contracts.length === 0) {
          const mockContracts: Contract[] = [
            {
              id: 1,
              base_id: 'mock-1',
              version_number: 1,
              project_name: 'Highway Construction Project',
              package_name: 'Phase 1',
              contract_number: 'CTR-2025-001',
              external_reference: 'EXT-001',
              contract_type: 'Construction',
              signing_place: 'Manila',
              signing_date: '2025-01-15',
              total_value: 5000000,
              funding_source: 'Government Budget',
              status: 'ACTIVE',
              created_by: 'john.doe@example.com',
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-01-15T00:00:00Z',
              is_deleted: false
            },
            {
              id: 2,
              base_id: 'mock-2',
              version_number: 1,
              project_name: 'IT Support Services',
              package_name: 'Annual Contract',
              contract_number: 'CTR-2025-002',
              external_reference: 'EXT-002',
              contract_type: 'Service Agreement',
              signing_place: 'Quezon City',
              signing_date: '2025-02-01',
              total_value: 1200000,
              funding_source: 'Private Investment',
              status: 'DRAFT',
              created_by: 'jane.smith@example.com',
              created_at: '2025-01-20T00:00:00Z',
              updated_at: '2025-01-25T00:00:00Z',
              is_deleted: false
            },
            {
              id: 3,
              base_id: 'mock-3',
              version_number: 1,
              project_name: 'Office Supplies Contract',
              package_name: 'Q1 2025',
              contract_number: 'CTR-2025-003',
              external_reference: 'EXT-003',
              contract_type: 'Supply Agreement',
              signing_place: 'Makati',
              signing_date: '2025-03-01',
              total_value: 300000,
              funding_source: 'Operational Budget',
              status: 'PENDING_SIGNATURE',
              created_by: 'mike.johnson@example.com',
              created_at: '2025-02-15T00:00:00Z',
              updated_at: '2025-02-20T00:00:00Z',
              is_deleted: false
            }
          ];
          setAllContracts(mockContracts);
        } else {
          setAllContracts(response.data.contracts);
        }
      } catch (err) {
        setError("Failed to fetch contracts. Please try again.");
        console.error("Error fetching contracts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllContracts();
  }, [isAuthenticated]);

  // Filter and sort contracts whenever filters or data change
  useEffect(() => {
    let filtered = [...allContracts];

    // Apply search filter (across multiple fields)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(contract => 
        contract.project_name.toLowerCase().includes(searchLower) ||
        contract.contract_number.toLowerCase().includes(searchLower) ||
        contract.contract_type.toLowerCase().includes(searchLower) ||
        (contract.package_name && contract.package_name.toLowerCase().includes(searchLower)) ||
        (contract.external_reference && contract.external_reference.toLowerCase().includes(searchLower)) ||
        contract.created_by.toLowerCase().includes(searchLower) ||
        (contract.funding_source && contract.funding_source.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter(contract => contract.contract_type === typeFilter);
    }

    // Apply created by filter
    if (createdByFilter) {
      filtered = filtered.filter(contract => 
        contract.created_by.toLowerCase().includes(createdByFilter.toLowerCase())
      );
    }

    // Apply funding source filter
    if (fundingSourceFilter) {
      filtered = filtered.filter(contract => 
        contract.funding_source && 
        contract.funding_source.toLowerCase().includes(fundingSourceFilter.toLowerCase())
      );
    }

    // Apply signing date range filter
    if (signingDateFrom || signingDateTo) {
      filtered = filtered.filter(contract => {
        if (!contract.signing_date) return false;
        const signingDate = new Date(contract.signing_date);
        const fromDate = signingDateFrom ? new Date(signingDateFrom) : null;
        const toDate = signingDateTo ? new Date(signingDateTo) : null;
        
        if (fromDate && signingDate < fromDate) return false;
        if (toDate && signingDate > toDate) return false;
        return true;
      });
    }

    // Apply created date range filter
    if (createdDateFrom || createdDateTo) {
      filtered = filtered.filter(contract => {
        const createdDate = new Date(contract.created_at);
        const fromDate = createdDateFrom ? new Date(createdDateFrom) : null;
        const toDate = createdDateTo ? new Date(createdDateTo) : null;
        
        if (fromDate && createdDate < fromDate) return false;
        if (toDate && createdDate > toDate) return false;
        return true;
      });
    }

    // Apply value range filter
    if (minValue || maxValue) {
      filtered = filtered.filter(contract => {
        const value = contract.total_value;
        const min = minValue ? parseFloat(minValue) : null;
        const max = maxValue ? parseFloat(maxValue) : null;
        
        if (min !== null && value < min) return false;
        if (max !== null && value > max) return false;
        return true;
      });
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        // Handle null/undefined values
        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';

        // Convert to strings for comparison if needed
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredContracts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [
    allContracts, 
    searchTerm, 
    statusFilter, 
    typeFilter, 
    createdByFilter, 
    fundingSourceFilter,
    signingDateFrom, 
    signingDateTo, 
    createdDateFrom, 
    createdDateTo,
    minValue, 
    maxValue, 
    sortField, 
    sortDirection
  ]);

  // Handle logout
  const handleLogout = () => {
    authUtils.logout();
  };

  // Handle sorting
  const handleSort = (field: keyof Contract) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Handle row click to open details dialog
  const handleRowClick = async (contract: Contract) => {
    try {
      // Fetch full contract details including stakeholders and clauses
      const response = await contractsApi.getContract(contract.id);
      setSelectedContract(response.data);
      setIsDialogOpen(true);
    } catch (err) {
      console.error("Error fetching contract details:", err);
      setError("Failed to fetch contract details.");
    }
  };



  // Handle update contract
  const handleUpdate = (contract: Contract) => {
    setSelectedContract(contract);
    setFormData({
      project_name: contract.project_name,
      package_name: contract.package_name || '',
      external_reference: contract.external_reference || '',
      contract_type: contract.contract_type,
      signing_place: contract.signing_place || '',
      signing_date: contract.signing_date ? contract.signing_date.split('T')[0] : '',
      total_value: contract.total_value,
      funding_source: contract.funding_source || ''
    });
    setFormErrors({});
    setIsUpdateDialogOpen(true);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.project_name.trim()) {
      errors.project_name = 'Project name is required';
    }

    if (!formData.contract_type.trim()) {
      errors.contract_type = 'Contract type is required';
    }

    if (formData.total_value <= 0) {
      errors.total_value = 'Total value must be greater than 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Refetch contracts helper
  const refetchContracts = async () => {
    try {
      const response = await contractsApi.getContracts();
      setAllContracts(response.data.contracts);
    } catch (err) {
      console.error("Error fetching contracts:", err);
      setError("Failed to fetch contracts. Please try again.");
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (isCreateDialogOpen) {
        await contractsApi.createContract(formData);
        setIsCreateDialogOpen(false);
      } else if (isUpdateDialogOpen && selectedContract) {
        await contractsApi.updateContract(selectedContract.id, formData);
        setIsUpdateDialogOpen(false);
      }
      
      await refetchContracts();
    } catch (err) {
      console.error("Error submitting form:", err);
      setError("Failed to save contract. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle preview - opens a new tab with contract preview
  const handlePreview = (contract: Contract) => {
    // Generate a preview URL - you can customize this based on your backend implementation
    const previewUrl = `/contracts/${contract.id}/preview`;
    window.open(previewUrl, '_blank');
  };

  // Handle edit contract - redirects to edit page with pre-filled data
  const handleEditContract = (contract: Contract) => {
    // Store contract data in sessionStorage for the edit page to use
    const contractData = {
      id: contract.id,
      project_name: contract.project_name,
      package_name: contract.package_name || '',
      external_reference: contract.external_reference || '',
      contract_type: contract.contract_type,
      signing_place: contract.signing_place || '',
      signing_date: contract.signing_date ? contract.signing_date.split('T')[0] : '',
      total_value: contract.total_value,
      funding_source: contract.funding_source || '',
      stakeholders: contract.stakeholders || [],
      clauses: contract.clauses || []
    };
    
    sessionStorage.setItem('editContractData', JSON.stringify(contractData));
    
    // Redirect to edit page
    window.location.href = `/contracts/${contract.id}/edit`;
  };

  // Handle publish draft - changes contract status from DRAFT to PENDING_SIGNATURE
  const handlePublishDraft = async () => {
    if (!selectedContract) return;
    
    setIsPublishingDraft(true);
    try {
      await contractsApi.changeContractStatus(selectedContract.id, {
        status: 'PENDING_LEGAL_REVIEW',
        change_reason: 'Ready for approvement',
        comments: 'All documents are complete and ready for management approvement'
      });
      
      // Update the contract status in the local state
      setAllContracts(prev => 
        prev.map(contract => 
          contract.id === selectedContract.id 
            ? { ...contract, status: 'PENDING_LEGAL_REVIEW' as const }
            : contract
        )
      );
      
      // Update the selected contract
      setSelectedContract(prev => 
        prev ? { ...prev, status: 'PENDING_LEGAL_REVIEW' as const } : null
      );
      
      // Show success message
      alert('Contract published successfully! Status changed to PENDING_LEGAL_REVIEW.');
      
    } catch (error) {
      console.error('Error publishing draft:', error);
      alert('Failed to publish contract. Please try again.');
    } finally {
      setIsPublishingDraft(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'PENDING_LEGAL_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'PENDING_SIGNATURE': return 'bg-blue-100 text-blue-800';
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'EXPIRED': return 'bg-orange-100 text-orange-800';
      case 'TERMINATED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get unique values for filters
  const getUniqueCreatedBy = (): string[] => {
    const unique = [...new Set(allContracts.map(c => c.created_by))];
    return unique.filter(Boolean).sort();
  };

  const getUniqueFundingSources = (): string[] => {
    const unique = [...new Set(allContracts.map(c => c.funding_source).filter(Boolean) as string[])];
    return unique.sort();
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setTypeFilter("");
    setCreatedByFilter("");
    setFundingSourceFilter("");
    setSigningDateFrom("");
    setSigningDateTo("");
    setCreatedDateFrom("");
    setCreatedDateTo("");
    setMinValue("");
    setMaxValue("");
  };

  // Count active filters
  const getActiveFilterCount = (): number => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter) count++;
    if (typeFilter) count++;
    if (createdByFilter) count++;
    if (fundingSourceFilter) count++;
    if (signingDateFrom || signingDateTo) count++;
    if (createdDateFrom || createdDateTo) count++;
    if (minValue || maxValue) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Calculate contract metrics for visualization
  const calculateContractMetrics = (contract: Contract) => {
    // Timeline progress (based on status)
    const statusProgress = {
      'DRAFT': 20,
      'PENDING_LEGAL_REVIEW': 40,
      'PENDING_SIGNATURE': 60,
      'ACTIVE': 80,
      'EXPIRED': 100,
      'TERMINATED': 100
    };

    // Risk score calculation (simplified)
    const getRiskScore = () => {
      let riskScore = 0;
      if (contract.total_value > 1000000) riskScore += 30;
      else if (contract.total_value > 500000) riskScore += 20;
      else riskScore += 10;

      if (contract.contract_type === 'Construction') riskScore += 25;
      else if (contract.contract_type === 'Software Development') riskScore += 15;
      else riskScore += 10;

      if (contract.status === 'DRAFT') riskScore += 15;
      else if (contract.status === 'PENDING_LEGAL_REVIEW') riskScore += 10;

      return Math.min(riskScore, 100);
    };

    // Compliance score (simplified)
    const getComplianceScore = () => {
      let score = 100;
      if (!contract.signing_date) score -= 10;
      if (!contract.signing_place) score -= 5;
      if (!contract.funding_source) score -= 10;
      if (!contract.stakeholders || contract.stakeholders.length === 0) score -= 15;
      if (!contract.clauses || contract.clauses.length === 0) score -= 20;
      return Math.max(score, 0);
    };

    return {
      timeline: statusProgress[contract.status] || 0,
      risk: getRiskScore(),
      compliance: getComplianceScore()
    };
  };

  // Mock audit trail data (since we don't have real audit data)
  const generateAuditTrail = (contract: Contract) => [
    {
      id: 1,
      action: 'Contract Created',
      user: contract.created_by,
      timestamp: contract.created_at,
      details: `Contract ${contract.contract_number} was created for ${contract.project_name}`
    },
    {
      id: 2,
      action: 'Status Updated',
      user: contract.created_by,
      timestamp: contract.updated_at,
      details: `Status changed to ${contract.status.replace(/_/g, ' ')}`
    }
  ];

  // Pagination - get current page data from filtered contracts
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageContracts = filteredContracts.slice(startIndex, endIndex);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">      
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contract Management</h1>
            <p className="text-gray-600 mt-2">Manage your contracts and track their lifecycle</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={() => window.location.href = '/contracts/create'} className="!bg-blue-600 !hover:bg-blue-700 !text-white !border-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              New Contract
            </Button>
            <Button onClick={handleLogout} className="!bg-white !hover:bg-gray-50 !text-gray-700 !border-gray-300 !border">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Enhanced Filters */}
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>
              {activeFilterCount > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {activeFilterCount} active
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="!text-sm !bg-white !hover:bg-blue-50 !text-blue-700 !border !border-blue-200"
              >
                <Filter className="h-4 w-4 mr-1" />
                {showAdvancedFilters ? 'Basic' : 'Advanced'}
              </Button>
              <Button
                onClick={clearAllFilters}
                className="!text-sm !bg-white !hover:bg-blue-50 !text-blue-700 !border !border-blue-200 !disabled:bg-gray-50 !disabled:text-gray-400 !disabled:border-gray-200"
                disabled={activeFilterCount === 0}
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
              <Button
                onClick={() => {
                  console.log('🧪 Debug - Current state:', {
                    allContracts: allContracts.length,
                    filteredContracts: filteredContracts.length,
                    statusFilter,
                    typeFilter,
                    searchTerm,
                    activeFilterCount
                  });
                }}
                className="!text-sm !bg-white !hover:bg-blue-50 !text-blue-700 !border !border-blue-200"
              >
                Debug
              </Button>
              <span className="text-sm text-gray-500">
                {filteredContracts.length} of {allContracts.length} contracts
              </span>
            </div>
          </div>

          {/* Row 1: Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search all fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Statuses</option>
              {CONTRACT_STATUSES.map(status => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Types</option>
              {CONTRACT_TYPES.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={itemsPerPage.toString()}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>

          {/* Advanced Filters - Collapsible */}
          {showAdvancedFilters && (
            <>
              {/* Row 2: Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <select
                  value={createdByFilter}
                  onChange={(e) => setCreatedByFilter(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">All Creators</option>
                  {getUniqueCreatedBy().map(creator => (
                    <option key={creator} value={creator}>
                      {creator}
                    </option>
                  ))}
                </select>

                <select
                  value={fundingSourceFilter}
                  onChange={(e) => setFundingSourceFilter(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">All Funding Sources</option>
                  {getUniqueFundingSources().map(source => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>

                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Min Value"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                    className="w-1/2"
                  />
                  <Input
                    type="number"
                    placeholder="Max Value"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                    className="w-1/2"
                  />
                </div>
              </div>

              {/* Row 3: Date Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Signing Date Range</label>
                  <div className="flex space-x-2">
                    <Input
                      type="date"
                      value={signingDateFrom}
                      onChange={(e) => setSigningDateFrom(e.target.value)}
                      className="w-1/2"
                      placeholder="From"
                    />
                    <Input
                      type="date"
                      value={signingDateTo}
                      onChange={(e) => setSigningDateTo(e.target.value)}
                      className="w-1/2"
                      placeholder="To"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Created Date Range</label>
                  <div className="flex space-x-2">
                    <Input
                      type="date"
                      value={createdDateFrom}
                      onChange={(e) => setCreatedDateFrom(e.target.value)}
                      className="w-1/2"
                      placeholder="From"
                    />
                    <Input
                      type="date"
                      value={createdDateTo}
                      onChange={(e) => setCreatedDateTo(e.target.value)}
                      className="w-1/2"
                      placeholder="To"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Table */}
        <div className="border border-gray-300 rounded-xl bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-300">
                <TableHead
                  className="font-semibold text-black cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('project_name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Project Name</span>
                    {sortField === 'project_name' && (
                      sortDirection === 'asc' ?
                        <ChevronUp className="h-4 w-4" /> :
                        <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="font-semibold text-black cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('contract_number')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Contract Number</span>
                    {sortField === 'contract_number' && (
                      sortDirection === 'asc' ?
                        <ChevronUp className="h-4 w-4" /> :
                        <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="font-semibold text-black cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('contract_type')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Type</span>
                    {sortField === 'contract_type' && (
                      sortDirection === 'asc' ?
                        <ChevronUp className="h-4 w-4" /> :
                        <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="font-semibold text-black cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {sortField === 'status' && (
                      sortDirection === 'asc' ?
                        <ChevronUp className="h-4 w-4" /> :
                        <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="font-semibold text-black cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('total_value')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Value</span>
                    {sortField === 'total_value' && (
                      sortDirection === 'asc' ?
                        <ChevronUp className="h-4 w-4" /> :
                        <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="font-semibold text-black cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('updated_at')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Last Modified</span>
                    {sortField === 'updated_at' && (
                      sortDirection === 'asc' ?
                        <ChevronUp className="h-4 w-4" /> :
                        <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-black text-center w-32">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                      <span className="text-gray-600">Loading contracts...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">
                        {allContracts.length === 0 ? "No contracts found" : "No contracts match your filters"}
                      </p>
                      <p className="text-sm">
                        {allContracts.length === 0 
                          ? "Get started by creating your first contract" 
                          : "Try adjusting your search criteria"
                        }
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentPageContracts.map((contract) => (
                  <TableRow
                    key={contract.id}
                    className="cursor-pointer hover:bg-gray-50 border-b border-gray-100"
                    onClick={() => handleRowClick(contract)}
                  >
                    <TableCell className="font-medium">{contract.project_name}</TableCell>
                    <TableCell className="text-gray-600 font-mono text-sm">{contract.contract_number}</TableCell>
                    <TableCell className="text-gray-600">{contract.contract_type}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                        {contract.status.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(contract.total_value)}</TableCell>
                    <TableCell className="text-gray-600">{formatDate(contract.updated_at)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(contract);
                          }}
                          className="!h-8 !w-8 !p-0 !bg-white !hover:bg-blue-50 !text-blue-700 !border !border-blue-200 !hover:border-blue-300"
                          title="Preview Contract"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(contract);
                          }}
                          className="!h-8 !w-8 !p-0 !bg-white !hover:bg-blue-50 !text-blue-700 !border !border-blue-200 !hover:border-blue-300"
                          title="View Details"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditContract(contract);
                          }}
                          className="!h-8 !w-8 !p-0 !bg-white !hover:bg-blue-50 !text-blue-700 !border !border-blue-200 !hover:border-blue-300"
                          title="Edit Contract"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && filteredContracts.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredContracts.length)} of {filteredContracts.length} contracts
              {filteredContracts.length !== allContracts.length && (
                <span className="text-gray-500"> (filtered from {allContracts.length} total)</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="!bg-white !hover:bg-blue-50 !text-blue-700 !border !border-blue-200 !disabled:bg-gray-50 !disabled:text-gray-400 !disabled:border-gray-200"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="!bg-white !hover:bg-blue-50 !text-blue-700 !border !border-blue-200 !disabled:bg-gray-50 !disabled:text-gray-400 !disabled:border-gray-200"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Contract Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setActiveTab('overview'); // Reset tab when closing
        }}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0">
            {selectedContract && (
              <>
          {/* Prominent Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4 mb-4 flex-shrink-0">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {selectedContract.project_name}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    {selectedContract.contract_number}
                  </span>
                  <span className="flex items-center">
                    <Building className="h-4 w-4 mr-1" />
                    {selectedContract.contract_type}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    v{selectedContract.version_number}
                  </span>
                </div>
                
                {/* Key Metrics Cards */}
                <div className="flex items-center space-x-6">
                  <div className="bg-white rounded-lg px-4 py-3 shadow-sm border">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-500">Contract Value</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(selectedContract.total_value)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg px-4 py-3 shadow-sm border">
                    <div className="flex items-center space-x-2">
                      <span className={`h-3 w-3 rounded-full ${
                        selectedContract.status === 'ACTIVE' ? 'bg-green-500' :
                        selectedContract.status === 'DRAFT' ? 'bg-yellow-500' :
                        selectedContract.status === 'TERMINATED' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`} />
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <p className="font-semibold text-gray-900">{selectedContract.status.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const metrics = calculateContractMetrics(selectedContract);
                    return (
                      <>
                        <div className="bg-white rounded-lg px-4 py-3 shadow-sm border">
                          <div className="flex items-center space-x-2">
                            <Shield className={`h-5 w-5 ${
                              metrics.risk < 30 ? 'text-green-600' :
                              metrics.risk < 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`} />
                            <div>
                              <p className="text-xs text-gray-500">Risk Level</p>
                              <p className="font-semibold text-gray-900">{metrics.risk}%</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg px-4 py-3 shadow-sm border">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className={`h-5 w-5 ${
                              metrics.compliance > 80 ? 'text-green-600' :
                              metrics.compliance > 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`} />
                            <div>
                              <p className="text-xs text-gray-500">Compliance</p>
                              <p className="font-semibold text-gray-900">{metrics.compliance}%</p>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              {/* Action Buttons - Now below the title and metrics */}
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={() => handlePreview(selectedContract)}
                    className="!bg-white !hover:bg-blue-50 !text-blue-700 !border !border-blue-200 !hover:border-blue-300"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  
                  {/* Download only enabled for Active contracts */}
                  <Button
                    disabled={selectedContract.status !== 'ACTIVE'}
                    onClick={() => {
                      // Handle download logic
                      console.log('Download contract:', selectedContract.id);
                    }}
                    className="!bg-white !hover:bg-blue-50 !text-blue-700 !border !border-blue-200 !hover:border-blue-300 !disabled:bg-gray-100 !disabled:text-gray-400 !disabled:border-gray-200"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                
                <div className="flex items-center">
                  <Button
                    onClick={() => handleEditContract(selectedContract)}
                    className="!w-full !bg-white !hover:bg-blue-50 !text-blue-700 !border !border-blue-200 !hover:border-blue-300"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Contract
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 px-6 mb-4 flex-shrink-0">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: Info },
                { id: 'stakeholders', label: 'Stakeholders', icon: Users },
                { id: 'clauses', label: 'Clauses', icon: FileCheck },
                { id: 'analysis', label: 'AI Analysis', icon: TrendingUp },
                { id: 'audit', label: 'Audit Trail', icon: History }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'stakeholders' | 'clauses' | 'analysis' | 'audit')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <IconComponent className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
                );
              })}
            </nav>
          </div>
              </>
            )}

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6" style={{ maxHeight: 'calc(95vh - 250px)' }}>
              {selectedContract && (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Progress Metrics */}
                {(() => {
            const metrics = calculateContractMetrics(selectedContract);
            return (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-600" />
                  Contract Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Timeline Progress</span>
                <span className="text-sm text-gray-600">{metrics.timeline}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${metrics.timeline}%` }}
                />
              </div>
                  </div>
                  
                  <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Risk Level</span>
                <span className="text-sm text-gray-600">{metrics.risk}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metrics.risk < 30 ? 'bg-green-500' :
                    metrics.risk < 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${metrics.risk}%` }}
                />
              </div>
                  </div>
                  
                  <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Compliance Score</span>
                <span className="text-sm text-gray-600">{metrics.compliance}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metrics.compliance > 80 ? 'bg-green-500' :
                    metrics.compliance > 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${metrics.compliance}%` }}
                />
              </div>
                  </div>
                </div>
              </div>
            );
                })()}

                {/* Contract Information Groups */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Legal Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-6 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-gray-600" />
                Legal Information
              </h4>
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <Building className="h-4 w-4 mt-1 text-gray-400" />
                  <div className="flex-1">
              <label className="text-sm font-medium text-gray-500">Project Name</label>
              <p className="text-sm text-gray-900 mt-1">{selectedContract.project_name}</p>
                  </div>
                </div>
                
                {selectedContract.package_name && (
                  <div className="flex items-start space-x-3">
              <FileText className="h-4 w-4 mt-1 text-gray-400" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-500">Package Name</label>
                <p className="text-sm text-gray-900 mt-1">{selectedContract.package_name}</p>
              </div>
                  </div>
                )}
                
                <div className="flex items-start space-x-3">
                  <FileCheck className="h-4 w-4 mt-1 text-gray-400" />
                  <div className="flex-1">
              <label className="text-sm font-medium text-gray-500">Contract Type</label>
              <p className="text-sm text-gray-900 mt-1">{selectedContract.contract_type}</p>
                  </div>
                </div>
                
                {selectedContract.external_reference && (
                  <div className="flex items-start space-x-3">
              <FileText className="h-4 w-4 mt-1 text-gray-400" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-500">External Reference</label>
                <p className="text-sm text-gray-900 mt-1">{selectedContract.external_reference}</p>
              </div>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-6 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Financial Information
              </h4>
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <DollarSign className="h-4 w-4 mt-1 text-gray-400" />
                  <div className="flex-1">
              <label className="text-sm font-medium text-gray-500">Total Value</label>
              <p className="text-lg font-bold text-green-600 mt-1">{formatCurrency(selectedContract.total_value)}</p>
                  </div>
                </div>
                
                {selectedContract.funding_source && (
                  <div className="flex items-start space-x-3">
              <Building className="h-4 w-4 mt-1 text-gray-400" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-500">Funding Source</label>
                <p className="text-sm text-gray-900 mt-1">{selectedContract.funding_source}</p>
              </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-6 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Timeline Information
              </h4>
              <div className="space-y-6">
                {selectedContract.signing_date && (
                  <div className="flex items-start space-x-3">
              <Calendar className="h-4 w-4 mt-1 text-gray-400" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-500">Signing Date</label>
                <p className="text-sm text-gray-900 mt-1">{formatDate(selectedContract.signing_date)}</p>
              </div>
                  </div>
                )}
                
                {selectedContract.signing_place && (
                  <div className="flex items-start space-x-3">
              <MapPin className="h-4 w-4 mt-1 text-gray-400" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-500">Signing Place</label>
                <p className="text-sm text-gray-900 mt-1">{selectedContract.signing_place}</p>
              </div>
                  </div>
                )}
                
                <div className="flex items-start space-x-3">
                  <Clock className="h-4 w-4 mt-1 text-gray-400" />
                  <div className="flex-1">
              <label className="text-sm font-medium text-gray-500">Created</label>
              <p className="text-sm text-gray-900 mt-1">{formatDate(selectedContract.created_at)}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="h-4 w-4 mt-1 text-gray-400" />
                  <div className="flex-1">
              <label className="text-sm font-medium text-gray-500">Last Modified</label>
              <p className="text-sm text-gray-900 mt-1">{formatDate(selectedContract.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-6 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-purple-600" />
                Status Information
              </h4>
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <div className={`h-4 w-4 mt-1 rounded-full ${
              selectedContract.status === 'ACTIVE' ? 'bg-green-500' :
              selectedContract.status === 'DRAFT' ? 'bg-yellow-500' :
              selectedContract.status === 'TERMINATED' ? 'bg-red-500' :
              'bg-blue-500'
                  }`} />
                  <div className="flex-1">
              <label className="text-sm font-medium text-gray-500">Current Status</label>
              <p className="text-sm font-semibold text-gray-900 mt-1">{selectedContract.status.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <User className="h-4 w-4 mt-1 text-gray-400" />
                  <div className="flex-1">
              <label className="text-sm font-medium text-gray-500">Created By</label>
              <p className="text-sm text-gray-900 mt-1">{selectedContract.created_by}</p>
                  </div>
                </div>
              </div>
            </div>
                </div>
              </div>
            )}

            {/* Stakeholders Tab */}
            {activeTab === 'stakeholders' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Stakeholders ({selectedContract.stakeholders?.length || 0})
            </h3>
                </div>
                
                {selectedContract.stakeholders && selectedContract.stakeholders.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {selectedContract.stakeholders.map((stakeholder) => (
                <div key={stakeholder.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-6">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <Building className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{stakeholder.stakeholder.legal_name}</h4>
                  <p className="text-sm text-blue-600 font-medium mt-1">{stakeholder.role_in_contract}</p>
                </div>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {stakeholder.stakeholder.type}
              </span>
                  </div>
                  
                  <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-500">Representative: </span>
                  <span className="text-sm font-medium text-gray-900">{stakeholder.representative_name}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-500">Title: </span>
                  <span className="text-sm font-medium text-gray-900">{stakeholder.representative_title}</span>
                </div>
              </div>
              
              {stakeholder.stakeholder.address && (
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <span className="text-sm text-gray-500">Address: </span>
                    <span className="text-sm text-gray-900">{stakeholder.stakeholder.address}</span>
                  </div>
                </div>
              )}
                  </div>
                </div>
              ))}
            </div>
                ) : (
            <div className="text-center py-16">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No stakeholders defined for this contract</p>
            </div>
                )}
              </div>
            )}

            {/* Clauses Tab */}
            {activeTab === 'clauses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center">
              <FileCheck className="h-5 w-5 mr-2 text-green-600" />
              Contract Clauses ({selectedContract.clauses?.length || 0})
            </h3>
                </div>
                
                {selectedContract.clauses && selectedContract.clauses.length > 0 ? (
            <div className="space-y-6">
              {selectedContract.clauses
                .sort((a, b) => a.display_order - b.display_order)
                .map((clause) => (
                <div key={clause.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-6">
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 rounded-full p-2">
                  <FileCheck className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{clause.clause_template.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">Code: {clause.clause_template.clause_code}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full mb-1 inline-block">
                  {clause.clause_template.type}
                </span>
                <p className="text-xs text-gray-500">Order: {clause.display_order}</p>
              </div>
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4">
              {clause.custom_content || clause.clause_template.content}
                  </div>
                </div>
              ))}
            </div>
                ) : (
            <div className="text-center py-16">
              <FileCheck className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No clauses defined for this contract</p>
            </div>
                )}
              </div>
            )}

            {/* AI Analysis Tab */}
            {activeTab === 'analysis' && (
              <div className="space-y-8">
                <h3 className="text-lg font-semibold flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
            AI Analysis & Insights
                </h3>

                {(() => {
            const metrics = calculateContractMetrics(selectedContract);
            return (
              <>
                {/* Risk Assessment */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center mb-6">
              <AlertTriangle className={`h-6 w-6 mr-3 ${
                metrics.risk < 30 ? 'text-green-600' :
                metrics.risk < 60 ? 'text-yellow-600' :
                'text-red-600'
              }`} />
              <h4 className="text-lg font-semibold text-gray-900">Risk Assessment</h4>
              <div className="ml-auto">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  metrics.risk < 30 ? 'bg-green-100 text-green-800' :
                  metrics.risk < 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {metrics.risk < 30 ? 'Low Risk' : metrics.risk < 60 ? 'Medium Risk' : 'High Risk'}
                </span>
              </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
              This contract shows {metrics.risk < 30 ? 'low' : metrics.risk < 60 ? 'moderate' : 'high'} risk levels. 
              The {selectedContract.total_value > 1000000 ? 'high-value' : 'moderate-value'} nature and {selectedContract.contract_type.toLowerCase()} type require 
              {metrics.risk > 60 ? ' immediate attention and ' : ' '} careful monitoring of milestone deliverables.
                  </p>
                </div>

                {/* Key Insights */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-blue-900 mb-6 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Key Insights
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">Contract value is {selectedContract.total_value > 1000000 ? 'above' : 'within'} expected range</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">Status progression is normal for current stage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">{selectedContract.stakeholders?.length || 0} stakeholders involved</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <FileCheck className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">{selectedContract.clauses?.length || 0} clauses defined</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">Compliance score: {metrics.compliance}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">Timeline progress: {metrics.timeline}%</span>
                </div>
              </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-green-900 mb-6 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              AI Recommendations
                  </h4>
                  <div className="space-y-4">
              {selectedContract.contract_type === 'Construction' && (
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 rounded-full p-1 mt-0.5">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <p className="text-sm text-green-800">Consider adding performance bonds for construction projects of this value</p>
                </div>
              )}
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 rounded-full p-1 mt-0.5">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
                <p className="text-sm text-green-800">Review milestone payment schedule alignment with deliverables</p>
              </div>
              {metrics.compliance < 80 && (
                <div className="flex items-start space-x-3">
                  <div className="bg-yellow-100 rounded-full p-1 mt-0.5">
                    <AlertTriangle className="h-3 w-3 text-yellow-600" />
                  </div>
                  <p className="text-sm text-green-800">Improve compliance by adding missing contract details</p>
                </div>
              )}
                  </div>
                </div>
              </>
            );
                })()}
              </div>
            )}

            {/* Audit Trail Tab */}
            {activeTab === 'audit' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center">
                    <History className="h-5 w-5 mr-2 text-gray-600" />
                    Audit Trail
                  </h3>
                  
                  {/* Publish Draft Button - Only show for DRAFT status */}
                  {selectedContract.status === 'DRAFT' && (
                    <Button
                      onClick={handlePublishDraft}
                      disabled={isPublishingDraft}
                      className="!bg-green-600 !hover:bg-green-700 !text-white !border-green-600"
                    >
                      {isPublishingDraft ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Publish Draft
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                <div className="space-y-6">
            {generateAuditTrail(selectedContract).map((entry) => (
              <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 rounded-full p-2 mt-1">
              <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{entry.action}</h4>
                <time className="text-sm text-gray-500">{formatDate(entry.timestamp)}</time>
              </div>
              <p className="text-sm text-gray-600 mb-3">{entry.details}</p>
              <div className="flex items-center space-x-2">
                <User className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">{entry.user}</span>
              </div>
                  </div>
                </div>
              </div>
            ))}
                </div>
              </div>
            )}
          </>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="border-t border-gray-200 px-6 py-3 mt-4 bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {selectedContract && (
              <>
                Base ID: {selectedContract.base_id} • 
                Created: {formatDate(selectedContract.created_at)}
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setIsDialogOpen(false)} className="!bg-white !hover:bg-blue-50 !text-blue-700 !border !border-blue-200">
              Close
            </Button>
          </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Contract Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Contract</DialogTitle>
              <DialogDescription>
                Enter the contract details below. All required fields must be completed.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <Input
                    value={formData.project_name}
                    onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                    placeholder="Enter project name"
                    className={formErrors.project_name ? 'border-red-500' : ''}
                  />
                  {formErrors.project_name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.project_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Package Name
                  </label>
                  <Input
                    value={formData.package_name}
                    onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                    placeholder="Enter package name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract Type *
                  </label>
                  <UltraSimpleSelect
                    value={formData.contract_type}
                    onValueChange={(value) => setFormData({ ...formData, contract_type: value })}
                    options={[
                      { value: '', label: 'Select contract type' },
                      ...CONTRACT_TYPES.map(type => ({
                        value: type,
                        label: type
                      }))
                    ]}
                  />
                  {formErrors.contract_type && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.contract_type}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Value *
                  </label>
                  <Input
                    type="number"
                    value={formData.total_value}
                    onChange={(e) => setFormData({ ...formData, total_value: Number(e.target.value) })}
                    placeholder="Enter total value"
                    className={formErrors.total_value ? 'border-red-500' : ''}
                  />
                  {formErrors.total_value && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.total_value}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Signing Date
                  </label>
                  <Input
                    type="date"
                    value={formData.signing_date}
                    onChange={(e) => setFormData({ ...formData, signing_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Signing Place
                  </label>
                  <Input
                    value={formData.signing_place}
                    onChange={(e) => setFormData({ ...formData, signing_place: e.target.value })}
                    placeholder="Enter signing place"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  External Reference
                </label>
                <Input
                  value={formData.external_reference}
                  onChange={(e) => setFormData({ ...formData, external_reference: e.target.value })}
                  placeholder="Enter external reference"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Funding Source
                </label>
                <Input
                  value={formData.funding_source}
                  onChange={(e) => setFormData({ ...formData, funding_source: e.target.value })}
                  placeholder="Enter funding source"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSubmitting}
                className="!bg-white !hover:bg-blue-50 !text-blue-700 !border !border-blue-200"
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="!bg-blue-600 !hover:bg-blue-700 !text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Contract
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Contract Dialog */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Update Contract</DialogTitle>
              <DialogDescription>
                Modify the contract details below. Only contracts in DRAFT status can be edited.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <Input
                    value={formData.project_name}
                    onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                    placeholder="Enter project name"
                    className={formErrors.project_name ? 'border-red-500' : ''}
                  />
                  {formErrors.project_name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.project_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Package Name
                  </label>
                  <Input
                    value={formData.package_name}
                    onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                    placeholder="Enter package name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract Type *
                  </label>
                  <UltraSimpleSelect
                    value={formData.contract_type}
                    onValueChange={(value) => setFormData({ ...formData, contract_type: value })}
                    options={[
                      { value: '', label: 'Select contract type' },
                      ...CONTRACT_TYPES.map(type => ({
                        value: type,
                        label: type
                      }))
                    ]}
                  />
                  {formErrors.contract_type && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.contract_type}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Value *
                  </label>
                  <Input
                    type="number"
                    value={formData.total_value}
                    onChange={(e) => setFormData({ ...formData, total_value: Number(e.target.value) })}
                    placeholder="Enter total value"
                    className={formErrors.total_value ? 'border-red-500' : ''}
                  />
                  {formErrors.total_value && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.total_value}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Signing Date
                  </label>
                  <Input
                    type="date"
                    value={formData.signing_date}
                    onChange={(e) => setFormData({ ...formData, signing_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Signing Place
                  </label>
                  <Input
                    value={formData.signing_place}
                    onChange={(e) => setFormData({ ...formData, signing_place: e.target.value })}
                    placeholder="Enter signing place"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  External Reference
                </label>
                <Input
                  value={formData.external_reference}
                  onChange={(e) => setFormData({ ...formData, external_reference: e.target.value })}
                  placeholder="Enter external reference"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Funding Source
                </label>
                <Input
                  value={formData.funding_source}
                  onChange={(e) => setFormData({ ...formData, funding_source: e.target.value })}
                  placeholder="Enter funding source"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setIsUpdateDialogOpen(false)}
                disabled={isSubmitting}
                className="!bg-white !hover:bg-blue-50 !text-blue-700 !border !border-blue-200"
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="!bg-blue-600 !hover:bg-blue-700 !text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Contract
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}