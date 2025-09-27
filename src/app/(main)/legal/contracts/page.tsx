"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { contractsApi, Contract, aiApi, ContractAnalysis } from '@/services/api';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  FileText,
  AlertTriangle,
  Shield,
  Building,
  Loader2,
  Scale,
  Banknote,
  Clock,
  Eye,
  Bot,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface LegalContract extends Contract {
  // Extended with legal-specific analysis data
  ai_analysis?: ContractAnalysis;
  ai_analysis_date?: string;
  review_notes?: string;
}

interface AIAnalysisState {
  [contractId: number]: {
    analysis: ContractAnalysis;
    timestamp: string;
    isAnalyzing?: boolean;
  };
}

function LegalContractsPageContent() {
  const router = useRouter();
  const [contracts, setContracts] = useState<LegalContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiAnalyses, setAiAnalyses] = useState<AIAnalysisState>({});
  const [analyzingIds, setAnalyzingIds] = useState<Set<number>>(new Set());

  const fetchLegalContracts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await contractsApi.getContracts();
      
      if (response.data && Array.isArray(response.data.contracts)) {
        // Filter for PENDING_LEGAL_REVIEW status
        const legalContracts = response.data.contracts
          .filter(contract => contract.status === 'PENDING_LEGAL_REVIEW')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setContracts(legalContracts);
      } else {
        setContracts([]);
      }
    } catch (err) {
      console.error('Error fetching contracts:', err);
      setError('Failed to load contracts for legal review');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLegalContracts();
  }, [fetchLegalContracts]);

  const handleAIAnalysis = async (contract: LegalContract) => {
    try {
      setAnalyzingIds(prev => new Set(prev).add(contract.id));
      
      // Call AI analysis API
      const analysisResponse = await aiApi.analyzeContract(contract.id);
      
      if (analysisResponse.status === 'success') {
        const newAnalysis = {
          analysis: analysisResponse.data.contract_analysis,
          timestamp: new Date().toISOString(),
          isAnalyzing: false
        };
        
        // Store in React state
        setAiAnalyses(prev => ({
          ...prev,
          [contract.id]: newAnalysis
        }));
        
        // Update contract in the list
        setContracts(prev => prev.map(c => 
          c.id === contract.id 
            ? { 
                ...c, 
                ai_analysis: analysisResponse.data.contract_analysis,
                ai_analysis_date: new Date().toISOString()
              }
            : c
        ));
      }
    } catch (err) {
      console.error('Error analyzing contract:', err);
      alert('Failed to analyze contract. Please try again.');
    } finally {
      setAnalyzingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(contract.id);
        return newSet;
      });
    }
  };

  const handleViewDetails = (contract: LegalContract) => {
    // Navigate to contract detail page with legal review context
    router.push(`/legal/contracts/${contract.id}`);
  };

  const handleMoveToSignature = async (contract: LegalContract) => {
    try {
      // Update contract status to PENDING_SIGNATURE
      await contractsApi.changeContractStatus(contract.id, {
        status: 'PENDING_SIGNATURE',
        change_reason: 'Legal review completed',
        comments: 'Contract reviewed by legal team and approved for signature'
      });
      
      // Remove from pending legal review list
      setContracts(prev => prev.filter(c => c.id !== contract.id));
      
      alert(`Contract ${contract.contract_number} has been moved to signature queue!`);
    } catch (err) {
      console.error('Error moving contract to signature:', err);
      alert('Failed to move contract. Please try again.');
    }
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
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading contracts for legal review...</p>
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
              Legal Review
            </h1>
            <p className="text-gray-600 mt-2">Review contracts with AI-powered analysis and recommendations</p>
          </div>
          
          {/* Summary Stats */}
          <div className="flex space-x-4">
            <div className="bg-white rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{contracts.length}</p>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>
            <div className="bg-white rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {Object.keys(aiAnalyses).length}
              </p>
              <p className="text-sm text-gray-600">AI Analyzed</p>
            </div>
            <div className="bg-white rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">
                {Object.values(aiAnalyses).filter(a => 
                  a.analysis.overall_risk_level === 'high' || a.analysis.overall_risk_level === 'critical'
                ).length}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Analysis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financial Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContracts.map((contract) => {
                const analysis = aiAnalyses[contract.id]?.analysis || contract.ai_analysis;
                const isAnalyzing = analyzingIds.has(contract.id);
                
                return (
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
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(contract.created_at)}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-3">
                        {analysis ? (
                          <>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(analysis.overall_risk_level)}`}>
                                <Shield className="h-3 w-3 mr-1" />
                                {analysis.overall_risk_level.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Score: <span className="font-semibold">{analysis.overall_risk_score.toFixed(1)}/100</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              <span className="flex items-center">
                                <Bot className="h-3 w-3 mr-1" />
                                {analysis.total_clauses_analyzed} clauses analyzed
                              </span>
                              {analysis.high_risk_clauses > 0 && (
                                <span className="text-red-600 font-medium">
                                  {analysis.high_risk_clauses} high-risk clauses
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">
                            <Bot className="h-4 w-4 inline mr-2" />
                            No analysis yet
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
                        {analysis ? (
                          <div className="space-y-1">
                            <div className="flex items-center text-green-600">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">Analyzed</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(aiAnalyses[contract.id]?.timestamp || contract.ai_analysis_date || contract.created_at)}
                            </div>
                            {analysis.recommendations.length > 0 && (
                              <div className="text-xs text-orange-600 font-medium">
                                {analysis.recommendations.length} recommendations
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Awaiting analysis
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(contract)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Review
                        </Button>
                        
                        <Button
                          onClick={() => handleAIAnalysis(contract)}
                          disabled={isAnalyzing}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          size="sm"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Bot className="h-3 w-3 mr-1" />
                              AI Analysis
                            </>
                          )}
                        </Button>
                        
                        {analysis && (
                          <Button
                            onClick={() => handleMoveToSignature(contract)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredContracts.length === 0 && !loading && (
          <div className="text-center py-16">
            <Scale className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No contracts pending legal review</p>
            <p className="text-sm text-gray-400 mt-2">
              {searchTerm ? 'Try adjusting your search filters' : 'All contracts have been processed'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LegalContractsPage() {
  return (
    <RoleGuard requiredPage="legal" allowedRoles={['LEGAL']}>
      <LegalContractsPageContent />
    </RoleGuard>
  );
}