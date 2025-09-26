"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, LogOut, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Info, Save, Edit, Eye, FileText, TrendingUp, Filter, X } from "lucide-react";
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
            <Button onClick={() => window.location.href = '/contracts/create'} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Contract
            </Button>
            <Button variant="secondary" onClick={handleLogout}>
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
                variant="secondary"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="text-sm"
              >
                <Filter className="h-4 w-4 mr-1" />
                {showAdvancedFilters ? 'Basic' : 'Advanced'}
              </Button>
              <Button
                variant="secondary" 
                onClick={clearAllFilters}
                className="text-sm"
                disabled={activeFilterCount === 0}
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
              <Button
                variant="secondary"
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
                className="text-sm"
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
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(contract);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(contract);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Info className="h-4 w-4" />
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
                variant="secondary"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="secondary"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Contract Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    {selectedContract?.project_name}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    Contract #{selectedContract?.contract_number} • Version {selectedContract?.version_number}
                  </DialogDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => selectedContract && handlePreview(selectedContract)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  {selectedContract?.status === 'DRAFT' && (
                    <Button
                      variant="secondary"
                      onClick={() => selectedContract && handleUpdate(selectedContract)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </DialogHeader>

            {selectedContract && (
              <div className="space-y-6">
                {/* Contract Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Project Name</label>
                      <p className="text-sm text-gray-900">{selectedContract.project_name}</p>
                    </div>
                    {selectedContract.package_name && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Package Name</label>
                        <p className="text-sm text-gray-900">{selectedContract.package_name}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contract Type</label>
                      <p className="text-sm text-gray-900">{selectedContract.contract_type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedContract.status)}`}>
                        {selectedContract.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Value</label>
                      <p className="text-sm text-gray-900 font-semibold">{formatCurrency(selectedContract.total_value)}</p>
                    </div>
                    {selectedContract.signing_date && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Signing Date</label>
                        <p className="text-sm text-gray-900">{formatDate(selectedContract.signing_date)}</p>
                      </div>
                    )}
                    {selectedContract.signing_place && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Signing Place</label>
                        <p className="text-sm text-gray-900">{selectedContract.signing_place}</p>
                      </div>
                    )}
                    {selectedContract.funding_source && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Funding Source</label>
                        <p className="text-sm text-gray-900">{selectedContract.funding_source}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Analysis Section - Similar to Clause Content */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    AI Analysis
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-blue-900">Risk Assessment</h4>
                        <p className="text-sm text-blue-800 mt-1">
                          This contract shows moderate risk levels. The high-value nature and construction type require careful monitoring of milestone deliverables.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900">Key Insights</h4>
                        <ul className="text-sm text-blue-800 mt-1 space-y-1">
                          <li>• Contract value is within expected range for this project type</li>
                          <li>• Status progression is normal for current stage</li>
                          <li>• {selectedContract.stakeholders?.length || 0} stakeholders involved</li>
                          <li>• {selectedContract.clauses?.length || 0} clauses defined</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900">Recommendations</h4>
                        <p className="text-sm text-blue-800 mt-1">
                          Consider adding performance bonds for construction projects of this value. Review milestone payment schedule alignment with deliverables.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stakeholders */}
                {selectedContract.stakeholders && selectedContract.stakeholders.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Stakeholders</h3>
                    <div className="space-y-3">
                      {selectedContract.stakeholders.map((stakeholder) => (
                        <div key={stakeholder.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{stakeholder.stakeholder.legal_name}</h4>
                              <p className="text-sm text-gray-600">{stakeholder.role_in_contract}</p>
                            </div>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {stakeholder.stakeholder.type}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Representative:</span>
                              <span className="ml-1">{stakeholder.representative_name}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Title:</span>
                              <span className="ml-1">{stakeholder.representative_title}</span>
                            </div>
                          </div>
                          {stakeholder.stakeholder.address && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-500">Address:</span>
                              <span className="ml-1">{stakeholder.stakeholder.address}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contract Clauses */}
                {selectedContract.clauses && selectedContract.clauses.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Contract Clauses</h3>
                    <div className="space-y-3">
                      {selectedContract.clauses
                        .sort((a, b) => a.display_order - b.display_order)
                        .map((clause) => (
                        <div key={clause.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{clause.clause_template.title}</h4>
                              <p className="text-sm text-gray-600">Code: {clause.clause_template.clause_code}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                {clause.clause_template.type}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">Order: {clause.display_order}</p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-700">
                            {clause.custom_content || clause.clause_template.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contract Metadata Footer */}
                <div className="border-t pt-4 text-xs text-gray-500 space-y-1">
                  <p>Created: {formatDate(selectedContract.created_at)}</p>
                  <p>Last Modified: {formatDate(selectedContract.updated_at)}</p>
                  <p>Base ID: {selectedContract.base_id}</p>
                  {selectedContract.external_reference && (
                    <p>External Reference: {selectedContract.external_reference}</p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
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
                variant="secondary"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
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
                variant="secondary"
                onClick={() => setIsUpdateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
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