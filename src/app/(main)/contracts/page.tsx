"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, LogOut, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Info, Save, Edit, Eye, FileText, TrendingUp } from "lucide-react";
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
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // New state for enhanced features
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [sortField, setSortField] = useState<keyof Contract | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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

  // Fetch contracts when authenticated or filters change
  useEffect(() => {
    const fetchContracts = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        setError(null);

        const params = {
          q: searchTerm || undefined,
          status: statusFilter || undefined,
          contract_type: typeFilter || undefined,
          page: currentPage,
          limit: itemsPerPage,
          sort_by: sortField || 'created_at',
          sort_dir: sortDirection
        };

        const response = await contractsApi.getContracts(params);
        setContracts(response.data.contracts);
      } catch (err) {
        setError("Failed to fetch contracts. Please try again.");
        console.error("Error fetching contracts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [isAuthenticated, searchTerm, statusFilter, typeFilter, currentPage, itemsPerPage, sortField, sortDirection]);

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

  // Handle create new contract
  const handleCreateNew = () => {
    setFormData({
      project_name: '',
      package_name: '',
      external_reference: '',
      contract_type: '',
      signing_place: '',
      signing_date: '',
      total_value: 0,
      funding_source: ''
    });
    setFormErrors({});
    setIsCreateDialogOpen(true);
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
      const params = {
        q: searchTerm || undefined,
        status: statusFilter || undefined,
        contract_type: typeFilter || undefined,
        page: currentPage,
        limit: itemsPerPage,
        sort_by: sortField || 'created_at',
        sort_dir: sortDirection
      };

      const response = await contractsApi.getContracts(params);
      setContracts(response.data.contracts);
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

  // Pagination
  const totalPages = Math.ceil(contracts.length / itemsPerPage);

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

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search contracts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <UltraSimpleSelect
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={[
              { value: '', label: 'All Statuses' },
              ...CONTRACT_STATUSES.map(status => ({
                value: status,
                label: status.replace(/_/g, ' ')
              }))
            ]}
          />

          <UltraSimpleSelect
            value={typeFilter}
            onValueChange={setTypeFilter}
            options={[
              { value: '', label: 'All Types' },
              ...CONTRACT_TYPES.map(type => ({
                value: type,
                label: type
              }))
            ]}
          />

          <UltraSimpleSelect
            value={itemsPerPage.toString()}
            onValueChange={(value) => setItemsPerPage(Number(value))}
            options={[
              { value: '10', label: '10 per page' },
              { value: '25', label: '25 per page' },
              { value: '50', label: '50 per page' }
            ]}
          />
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
              ) : contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No contracts found</p>
                      <p className="text-sm">Get started by creating your first contract</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((contract) => (
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
        {!loading && contracts.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, contracts.length)} of {contracts.length} contracts
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