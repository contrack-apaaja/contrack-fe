"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { contractsApi, Contract, aiApi, ContractAnalysis, ClauseAnalysis, AIRecommendationsResponse } from '@/services/api';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  Shield,
  Building,
  Loader2,
  Scale,
  Banknote,
  Clock,
  Bot,
  ArrowRight,
  Edit3,
  Save,
  X,
  TrendingUp,
  Eye,
  AlertCircle
} from 'lucide-react';

interface LegalContract extends Contract {
  ai_analysis?: ContractAnalysis;
  ai_analysis_date?: string;
  review_notes?: string;
}

interface ClauseWithAnalysis {
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
  ai_analysis?: ClauseAnalysis;
  is_editing?: boolean;
  edited_content?: string;
}

interface AIAnalysisState {
  contract_analysis?: ContractAnalysis;
  clause_analyses: { [clauseId: number]: ClauseAnalysis };
  recommendations?: AIRecommendationsResponse['data'];
  timestamp: string;
}

function LegalContractDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const contractId = parseInt(params.id as string);

  const [contract, setContract] = useState<LegalContract | null>(null);
  const [clauses, setClauses] = useState<ClauseWithAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisState | null>(null);
  const [analyzingContract, setAnalyzingContract] = useState(false);
  const [analyzingClauses, setAnalyzingClauses] = useState<Set<number>>(new Set());
  const [savingClauses, setSavingClauses] = useState<Set<number>>(new Set());
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  const fetchContractDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await contractsApi.getContract(contractId);
      
      if (response.data) {
        setContract(response.data);
        
        // Convert clauses to include analysis structure
        if (response.data.clauses) {
          const clausesWithAnalysis: ClauseWithAnalysis[] = response.data.clauses.map(clause => ({
            ...clause,
            is_editing: false,
            edited_content: clause.custom_content || clause.clause_template.content
          }));
          setClauses(clausesWithAnalysis);
        }
      } else {
        setError('Contract not found');
      }
    } catch (err) {
      console.error('Error fetching contract:', err);
      setError('Failed to load contract details');
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    fetchContractDetails();
  }, [fetchContractDetails]);

  const handleContractAnalysis = async () => {
    if (!contract) return;
    
    try {
      setAnalyzingContract(true);
      
      // Analyze entire contract
      const contractAnalysisResponse = await aiApi.analyzeContract(contract.id);
      
      if (contractAnalysisResponse.status === 'success') {
        // Get recommendations
        const recommendationsResponse = await aiApi.getContractRecommendations(contract.id);
        
        const newAnalysis: AIAnalysisState = {
          contract_analysis: contractAnalysisResponse.data.contract_analysis,
          clause_analyses: {},
          recommendations: recommendationsResponse.status === 'success' ? recommendationsResponse.data : undefined,
          timestamp: new Date().toISOString()
        };
        
        setAiAnalysis(newAnalysis);
        setContract(prev => prev ? {
          ...prev,
          ai_analysis: contractAnalysisResponse.data.contract_analysis,
          ai_analysis_date: new Date().toISOString()
        } : null);
      }
    } catch (err) {
      console.error('Error analyzing contract:', err);
      alert('Failed to analyze contract. Please try again.');
    } finally {
      setAnalyzingContract(false);
    }
  };

  const handleClauseAnalysis = async (clause: ClauseWithAnalysis) => {
    try {
      setAnalyzingClauses(prev => new Set(prev).add(clause.id));
      
      const analysisResponse = await aiApi.analyzeClause(clause.id);
      
      if (analysisResponse.status === 'success') {
        const clauseAnalysis = analysisResponse.data.analysis;
        
        // Update AI analysis state
        setAiAnalysis(prev => prev ? {
          ...prev,
          clause_analyses: {
            ...prev.clause_analyses,
            [clause.id]: clauseAnalysis
          }
        } : {
          clause_analyses: { [clause.id]: clauseAnalysis },
          timestamp: new Date().toISOString()
        });
        
        // Update clause in the list
        setClauses(prev => prev.map(c =>
          c.id === clause.id ? { ...c, ai_analysis: clauseAnalysis } : c
        ));
      }
    } catch (err) {
      console.error('Error analyzing clause:', err);
      alert('Failed to analyze clause. Please try again.');
    } finally {
      setAnalyzingClauses(prev => {
        const newSet = new Set(prev);
        newSet.delete(clause.id);
        return newSet;
      });
    }
  };

  const toggleClauseEdit = (clauseId: number) => {
    setClauses(prev => prev.map(clause =>
      clause.id === clauseId 
        ? { 
            ...clause, 
            is_editing: !clause.is_editing,
            edited_content: clause.is_editing 
              ? (clause.custom_content || clause.clause_template.content)
              : clause.edited_content
          }
        : clause
    ));
  };

  const handleClauseContentChange = (clauseId: number, content: string) => {
    setClauses(prev => prev.map(clause =>
      clause.id === clauseId ? { ...clause, edited_content: content } : clause
    ));
  };

  const saveClauseEdit = async (clause: ClauseWithAnalysis) => {
    if (!clause.edited_content) return;
    
    try {
      setSavingClauses(prev => new Set(prev).add(clause.id));
      
      // Update clause content (this would typically call a clause update API)
      // For now, we'll just update local state
      setClauses(prev => prev.map(c =>
        c.id === clause.id 
          ? { 
              ...c, 
              custom_content: clause.edited_content || '',
              is_editing: false 
            }
          : c
      ));
      
      // Re-analyze the clause after editing
      await handleClauseAnalysis({ ...clause, custom_content: clause.edited_content || '' });
      
    } catch (err) {
      console.error('Error saving clause:', err);
      alert('Failed to save clause. Please try again.');
    } finally {
      setSavingClauses(prev => {
        const newSet = new Set(prev);
        newSet.delete(clause.id);
        return newSet;
      });
    }
  };

  const handleMoveToSignature = async () => {
    if (!contract) return;
    
    try {
      await contractsApi.changeContractStatus(contract.id, {
        status: 'PENDING_SIGNATURE',
        change_reason: 'Legal review completed',
        comments: 'Contract reviewed by legal team with AI analysis and approved for signature'
      });
      
      alert(`Contract ${contract.contract_number} has been sent to management for approval!`);
      router.push('/legal/contracts');
    } catch (err) {
      console.error('Error moving contract to signature:', err);
      alert('Failed to move contract. Please try again.');
    }
  };

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          <p className="text-gray-600">Loading contract details...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg font-medium">{error || 'Contract not found'}</p>
          <Button 
            onClick={() => router.push('/legal/contracts')} 
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Legal Review
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => router.push('/legal/contracts')} 
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Scale className="h-8 w-8 mr-3 text-blue-600" />
                Legal Review: {contract.project_name}
              </h1>
              <p className="text-gray-600 mt-2">Contract #{contract.contract_number}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleContractAnalysis}
              disabled={analyzingContract}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {analyzingContract ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  AI Analysis
                </>
              )}
            </Button>
            
            {aiAnalysis?.contract_analysis && (
              <Dialog open={showAnalysisModal} onOpenChange={setShowAnalysisModal}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Analysis
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <Bot className="h-5 w-5 mr-2 text-purple-600" />
                      AI Contract Analysis
                    </DialogTitle>
                    <DialogDescription>
                      Comprehensive analysis of {contract.project_name}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Overall Risk Assessment */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3">Overall Risk Assessment</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Risk Level</p>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(aiAnalysis.contract_analysis.overall_risk_level)}`}>
                            <Shield className="h-4 w-4 mr-1" />
                            {aiAnalysis.contract_analysis.overall_risk_level.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Risk Score</p>
                          <p className="text-xl font-bold">{aiAnalysis.contract_analysis.overall_risk_score.toFixed(1)}/100</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Clauses Analyzed</p>
                          <p className="text-xl font-bold">{aiAnalysis.contract_analysis.total_clauses_analyzed}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">High Risk Clauses</p>
                          <p className="text-xl font-bold text-red-600">{aiAnalysis.contract_analysis.high_risk_clauses}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Recommendations */}
                    {aiAnalysis.contract_analysis.recommendations.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <TrendingUp className="h-5 w-5 mr-2" />
                          AI Recommendations
                        </h3>
                        <div className="space-y-2">
                          {aiAnalysis.contract_analysis.recommendations.map((rec, index) => (
                            <div key={index} className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                              <p className="text-blue-800">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Detailed Recommendations */}
                    {aiAnalysis.recommendations && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Clause-Specific Recommendations</h3>
                        <div className="space-y-3">
                          {aiAnalysis.recommendations.recommendations.map((rec, index) => (
                            <div key={index} className="border p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{rec.clause_name}</h4>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(rec.risk_level)}`}>
                                    {rec.risk_level.toUpperCase()}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    rec.priority === 'high' ? 'bg-red-100 text-red-600' :
                                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                    'bg-green-100 text-green-600'
                                  }`}>
                                    {rec.priority.toUpperCase()} PRIORITY
                                  </span>
                                </div>
                              </div>
                              <p className="text-gray-700">{rec.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            <Button
              onClick={handleMoveToSignature}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Send to Management
            </Button>
          </div>
        </div>

        {/* Contract Summary */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Contract Type</p>
              <p className="font-semibold flex items-center">
                <Building className="h-4 w-4 mr-2" />
                {contract.contract_type}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="font-semibold flex items-center">
                <Banknote className="h-4 w-4 mr-2" />
                {formatCurrency(contract.total_value)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="font-semibold flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {formatDate(contract.created_at)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                {contract.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          
          {aiAnalysis?.contract_analysis && (
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-600">AI Risk Level</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(aiAnalysis.contract_analysis.overall_risk_level)}`}>
                    <Shield className="h-4 w-4 mr-1" />
                    {aiAnalysis.contract_analysis.overall_risk_level.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Risk Score</p>
                  <p className="font-semibold">{aiAnalysis.contract_analysis.overall_risk_score.toFixed(1)}/100</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Clauses Analyzed</p>
                  <p className="font-semibold">{aiAnalysis.contract_analysis.total_clauses_analyzed}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">High Risk Clauses</p>
                  <p className="font-semibold text-red-600">{aiAnalysis.contract_analysis.high_risk_clauses}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clauses Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <FileText className="h-6 w-6 mr-3" />
          Contract Clauses ({clauses.length})
        </h2>
        
        {clauses.map((clause) => {
          const analysis = aiAnalysis?.clause_analyses[clause.id] || clause.ai_analysis;
          const isAnalyzing = analyzingClauses.has(clause.id);
          const isSaving = savingClauses.has(clause.id);
          
          return (
            <div key={clause.id} className="bg-white rounded-lg border">
              {/* Clause Header */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {clause.clause_template.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Code: {clause.clause_template.clause_code} | Type: {clause.clause_template.type}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {analysis && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(analysis.risk_level)}`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {analysis.risk_level.toUpperCase()}
                      </span>
                    )}
                    
                    <Button
                      onClick={() => handleClauseAnalysis(clause)}
                      disabled={isAnalyzing}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Analyzing
                        </>
                      ) : (
                        <>
                          <Bot className="h-3 w-3 mr-1" />
                          Analyze
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => toggleClauseEdit(clause.id)}
                      size="sm"
                      variant="outline"
                    >
                      {clause.is_editing ? (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Edit3 className="h-3 w-3 mr-1" />
                          Edit
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Clause Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Side - Clause Content */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Clause Content</h4>
                    {clause.is_editing ? (
                      <div className="space-y-3">
                        <textarea
                          value={clause.edited_content || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleClauseContentChange(clause.id, e.target.value)}
                          rows={8}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter clause content..."
                        />
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => saveClauseEdit(clause)}
                            disabled={isSaving}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-3 w-3 mr-1" />
                                Save & Re-analyze
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {clause.custom_content || clause.clause_template.content}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Right Side - AI Analysis */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Bot className="h-4 w-4 mr-2" />
                      AI Analysis & Recommendations
                    </h4>
                    
                    {analysis ? (
                      <div className="space-y-4">
                        {/* Risk Assessment */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Risk Assessment</span>
                            <span className="text-sm text-gray-600">
                              Score: {analysis.risk_score.toFixed(1)}/100
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRiskColor(analysis.risk_level)}`}>
                              {analysis.risk_level.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              Confidence: {analysis.confidence_score.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Summary */}
                        {analysis.analysis_summary && (
                          <div>
                            <h5 className="text-sm font-medium mb-2">Summary</h5>
                            <p className="text-sm text-gray-700">{analysis.analysis_summary}</p>
                          </div>
                        )}
                        
                        {/* Identified Risks */}
                        {analysis.identified_risks.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium mb-2 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1 text-red-500" />
                              Identified Risks
                            </h5>
                            <ul className="space-y-1">
                              {analysis.identified_risks.map((risk, index) => (
                                <li key={index} className="text-sm text-red-700 flex items-start">
                                  <span className="block w-2 h-2 bg-red-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                                  {risk}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Recommendations */}
                        {analysis.recommendations.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium mb-2 flex items-center">
                              <TrendingUp className="h-4 w-4 mr-1 text-blue-500" />
                              Recommendations
                            </h5>
                            <ul className="space-y-1">
                              {analysis.recommendations.map((rec, index) => (
                                <li key={index} className="text-sm text-blue-700 flex items-start">
                                  <span className="block w-2 h-2 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Legal Implications */}
                        {analysis.legal_implications && (
                          <div>
                            <h5 className="text-sm font-medium mb-2">Legal Implications</h5>
                            <p className="text-sm text-gray-700">{analysis.legal_implications}</p>
                          </div>
                        )}
                        
                        {/* Compliance Notes */}
                        {analysis.compliance_notes && (
                          <div>
                            <h5 className="text-sm font-medium mb-2">Compliance Notes</h5>
                            <p className="text-sm text-gray-700">{analysis.compliance_notes}</p>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 border-t pt-2">
                          Analysis generated on {formatDate(analysis.created_at)} using {analysis.model_version}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Bot className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No AI analysis yet</p>
                        <p className="text-xs">Click &quot;Analyze&quot; to get AI recommendations</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LegalContractDetailPage() {
  return (
    <RoleGuard requiredPage="legal" allowedRoles={['LEGAL']}>
      <LegalContractDetailPageContent />
    </RoleGuard>
  );
}