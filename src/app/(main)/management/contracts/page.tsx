"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { contractsApi, Contract } from '@/services/api';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  FileText,
  Banknote,
  AlertTriangle,
  Shield,
  Building,
  Loader2,
  CheckCircle,
  TrendingUp,
  Clock,
  Eye
} from 'lucide-react';

interface ManagementContract extends Contract {
  // Extended with management-specific mock data
  overall_risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  overall_risk_score: number;
  total_clauses: number;
  overall_recommendations: string[];
  key_risks: string[];
}

function ManagementContractsPageContent() {
  const router = useRouter();
  const [contracts, setContracts] = useState<ManagementContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [approvingIds, setApprovingIds] = useState<Set<number>>(new Set());

  const fetchPendingContracts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await contractsApi.getContracts();
      
      if (response.data && Array.isArray(response.data.contracts)) {
        // Filter for PENDING_SIGNATURE status and add mock management data
        const pendingContracts = response.data.contracts
          .filter(contract => contract.status === 'PENDING_SIGNATURE')
          .map(contract => enhanceContractWithMockData(contract))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setContracts(pendingContracts);
      } else {
        setContracts([]);
      }
    } catch (err) {
      console.error('Error fetching contracts:', err);
      setError('Failed to load contracts for approval');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingContracts();
  }, [fetchPendingContracts]);

  const enhanceContractWithMockData = (contract: Contract): ManagementContract => {
    // Generate consistent mock data based on contract properties
    const contractHash = contract.id + contract.total_value;
    const riskSeed = contractHash % 100;
    
    let overall_risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    let overall_risk_score: number;
    
    if (riskSeed < 25) {
      overall_risk_level = 'LOW';
      overall_risk_score = 1 + (riskSeed / 25) * 3;
    } else if (riskSeed < 60) {
      overall_risk_level = 'MEDIUM';
      overall_risk_score = 3 + ((riskSeed - 25) / 35) * 3;
    } else if (riskSeed < 85) {
      overall_risk_level = 'HIGH';
      overall_risk_score = 6 + ((riskSeed - 60) / 25) * 2;
    } else {
      overall_risk_level = 'CRITICAL';
      overall_risk_score = 8 + ((riskSeed - 85) / 15) * 2;
    }

    const total_clauses = contract.clauses?.length || (5 + (contractHash % 10));
    
    const keyRisksPool = [
      'Insufficient termination clauses',
      'Ambiguous payment terms',
      'Limited liability coverage',
      'Unclear intellectual property rights',
      'Missing force majeure provisions',
      'Inadequate dispute resolution mechanism',
      'Vague performance standards',
      'Missing compliance requirements'
    ];
    
    const recommendationsPool = [
      'Add comprehensive termination procedures',
      'Clarify payment schedules and penalties',
      'Include liability caps and indemnification',
      'Define IP ownership and usage rights',
      'Add force majeure and business continuity clauses',
      'Specify arbitration and mediation processes',
      'Set measurable performance indicators',
      'Include regulatory compliance checkpoints'
    ];

    const numRisks = Math.min(3, Math.max(1, Math.floor(overall_risk_score / 2)));
    const numRecommendations = Math.min(4, Math.max(1, Math.floor(overall_risk_score / 1.5)));

    return {
      ...contract,
      overall_risk_level,
      overall_risk_score,
      total_clauses,
      key_risks: keyRisksPool.slice(contractHash % 5, (contractHash % 5) + numRisks),
      overall_recommendations: recommendationsPool.slice(contractHash % 4, (contractHash % 4) + numRecommendations)
    };
  };

  const handleApprove = async (contract: ManagementContract) => {
    try {
      setApprovingIds(prev => new Set(prev).add(contract.id));
      
      // Update contract status to ACTIVE using the dedicated status endpoint
      await contractsApi.changeContractStatus(contract.id, {
        status: 'ACTIVE',
        change_reason: 'Management approval completed',
        comments: 'Contract approved by management team and ready for execution'
      });
      
      // Remove from pending contracts list
      setContracts(prev => prev.filter(c => c.id !== contract.id));
      
      // Show success message
      alert(`Contract ${contract.contract_number} has been approved successfully!`);
      
    } catch (err) {
      console.error('Error approving contract:', err);
      alert('Failed to approve contract. Please try again.');
    } finally {
      setApprovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(contract.id);
        return newSet;
      });
    }
  };

  const handleContractClick = (contract: ManagementContract) => {
    // Navigate to existing detail view
    router.push(`/contracts/${contract.id}/preview`);
  };

  const filteredContracts = contracts.filter(contract =>
    contract.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.contract_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
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

  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-600 bg-green-100 border-green-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'HIGH': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'CRITICAL': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading contracts for approval...</p>
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
              <CheckCircle className="h-8 w-8 mr-3 text-green-600" />
              Management Approval
            </h1>
            <p className="text-gray-600 mt-2">Review and approve contracts pending signature</p>
          </div>
          
          {/* Summary Stats */}
          <div className="flex space-x-4">
            <div className="bg-white rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{contracts.length}</p>
              <p className="text-sm text-gray-600">Pending Approval</p>
            </div>
            <div className="bg-white rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {contracts.filter(c => c.overall_risk_level === 'LOW').length}
              </p>
              <p className="text-sm text-gray-600">Low Risk</p>
            </div>
            <div className="bg-white rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold text-red-600">
                {contracts.filter(c => c.overall_risk_level === 'HIGH' || c.overall_risk_level === 'CRITICAL').length}
              </p>
              <p className="text-sm text-gray-600">High Risk</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg border p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search contracts by project name, contract number, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Assessment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financial Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key Insights</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
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
                        <span className="flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          {contract.total_clauses} clauses
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(contract.created_at)}
                        </span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(contract.overall_risk_level)}`}>
                          <Shield className="h-3 w-3 mr-1" />
                          {contract.overall_risk_level}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Score: <span className="font-semibold">{contract.overall_risk_score.toFixed(1)}/10</span>
                      </div>
                      {contract.key_risks.length > 0 && (
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Top Risk:</span> {contract.key_risks[0]}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Banknote className="h-4 w-4 text-green-600" />
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
                  
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {contract.overall_recommendations.length > 0 && (
                        <div className="text-xs text-gray-600">
                          <span className="flex items-center font-medium mb-1">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Recommendations ({contract.overall_recommendations.length})
                          </span>
                          <div className="text-gray-500">
                            {contract.overall_recommendations[0]}
                            {contract.overall_recommendations.length > 1 && (
                              <span className="text-blue-600">
                                {' '}+{contract.overall_recommendations.length - 1} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContractClick(contract)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        onClick={() => handleApprove(contract)}
                        disabled={approvingIds.has(contract.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        {approvingIds.has(contract.id) ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredContracts.length === 0 && !loading && (
          <div className="text-center py-16">
            <CheckCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No contracts pending approval</p>
            <p className="text-sm text-gray-400 mt-2">
              {searchTerm ? 'Try adjusting your search filters' : 'All contracts have been processed'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ManagementContractsPage() {
  return (
    <RoleGuard requiredPage="management" allowedRoles={['MANAGEMENT']}>
      <ManagementContractsPageContent />
    </RoleGuard>
  );
}