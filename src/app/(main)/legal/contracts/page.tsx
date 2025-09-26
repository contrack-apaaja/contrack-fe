"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { contractsApi, Contract, aiApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  FileText,
  Calendar,
  DollarSign,
  AlertTriangle,
  Shield,
  ChevronRight,
  Building,
  Loader2,
  Eye,
  Clock,
  Scale
} from 'lucide-react';

export default function LegalContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [analysisStats, setAnalysisStats] = useState<{
    total_analyses: number;
    average_risk_score: number;
    average_confidence: number;
  } | null>(null);

  const CONTRACT_STATUSES = ['DRAFT', 'PENDING_LEGAL_REVIEW', 'PENDING_SIGNATURE', 'ACTIVE', 'EXPIRED', 'TERMINATED'];

  useEffect(() => {
    fetchContracts();
    fetchAnalysisStats();
  }, [currentPage]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await contractsApi.getContracts();

      if (response.data && Array.isArray(response.data.contracts)) {
        setContracts(response.data.contracts);
        setTotalPages(response.data.pages);
      } else {
        setContracts([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching contracts:', err);
      setError('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysisStats = async () => {
    try {
      const response = await aiApi.getAnalysisStats();
      setAnalysisStats(response.data);
    } catch (err) {
      console.error('Error fetching analysis stats:', err);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchContracts();
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchContracts();
  };

  const handleContractClick = (contract: Contract) => {
    router.push(`/legal/contracts/${contract.id}`);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-100';
      case 'DRAFT': return 'text-yellow-600 bg-yellow-100';
      case 'PENDING_LEGAL_REVIEW': return 'text-blue-600 bg-blue-100';
      case 'PENDING_SIGNATURE': return 'text-purple-600 bg-purple-100';
      case 'TERMINATED': return 'text-red-600 bg-red-100';
      case 'EXPIRED': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevel = (contract: Contract): { level: string; color: string; score: number } => {
    // Mock risk calculation based on contract properties
    let riskScore = 0;
    
    // Status-based risk
    if (contract.status === 'DRAFT') riskScore += 3;
    if (contract.status === 'PENDING_LEGAL_REVIEW') riskScore += 2;
    
    // Value-based risk
    if (contract.total_value > 1000000) riskScore += 2;
    if (contract.total_value > 5000000) riskScore += 1;
    
    // Type-based risk
    if (contract.contract_type === 'Construction') riskScore += 1;
    if (contract.contract_type === 'Service') riskScore += 1;
    
    // Age-based risk
    const daysSinceCreated = Math.floor((Date.now() - new Date(contract.created_at).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreated > 90) riskScore += 1;
    
    if (riskScore <= 2) return { level: 'LOW', color: 'text-green-600 bg-green-100', score: riskScore };
    if (riskScore <= 4) return { level: 'MEDIUM', color: 'text-yellow-600 bg-yellow-100', score: riskScore };
    if (riskScore <= 6) return { level: 'HIGH', color: 'text-orange-600 bg-orange-100', score: riskScore };
    return { level: 'CRITICAL', color: 'text-red-600 bg-red-100', score: riskScore };
  };

  if (loading && contracts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Scale className="h-8 w-8 mr-3 text-blue-600" />
              Legal Review Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Review contracts and manage AI recommendations</p>
          </div>
          
          {/* Analysis Stats */}
          {analysisStats && (
            <div className="flex space-x-4">
              <div className="bg-white rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{analysisStats.total_analyses}</p>
                <p className="text-sm text-gray-600">Total Analyses</p>
              </div>
              <div className="bg-white rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{analysisStats.average_risk_score?.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Avg Risk Score</p>
              </div>
              <div className="bg-white rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{analysisStats.average_confidence?.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Avg Confidence</p>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search contracts by project name, contract number, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                {CONTRACT_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Contracts Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financial Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status & Risk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contracts.map((contract) => {
                const risk = getRiskLevel(contract);
                return (
                  <tr 
                    key={contract.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleContractClick(contract)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{contract.project_name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-mono">{contract.contract_number}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Building className="h-3 w-3 mr-1" />
                            {contract.contract_type}
                          </span>
                          <span>v{contract.version_number}</span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-600">
                            {formatCurrency(contract.total_value)}
                          </span>
                        </div>
                        {contract.funding_source && (
                          <div className="text-xs text-gray-500">
                            Source: {contract.funding_source}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                          {contract.status.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-3 w-3 text-gray-400" />
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${risk.color}`}>
                            {risk.level} RISK
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {formatDate(contract.created_at)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          by {contract.created_by}
                        </div>
                        {contract.signing_date && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>Signed: {formatDate(contract.signing_date)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContractClick(contract);
                          }}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Review
                        </Button>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {contracts.length === 0 && !loading && (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No contracts found</p>
            <p className="text-sm text-gray-400 mt-2">
              {searchTerm || statusFilter ? 'Try adjusting your filters' : 'No contracts available for legal review'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}