"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { contractsApi, Contract, aiApi, AIAnalysis, ContractAnalysis } from '@/services/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  FileText,
  DollarSign,
  AlertTriangle,
  Building,
  Loader2,
  Scale,
  Edit3,
  X,
  TrendingUp,
  CheckCircle,
  Save,
  Bot,
  FileCheck,
  Lightbulb
} from 'lucide-react';

interface EditableClause {
  id: number;
  isEditing: boolean;
  originalContent: string;
  editedContent: string;
  hasAIRecommendation: boolean;
  aiAnalysis?: AIAnalysis;
  isAcceptingRecommendation: boolean;
}

export default function LegalContractDetailPage() {
  const params = useParams();
  const contractId = Number(params.id);
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editableClauses, setEditableClauses] = useState<EditableClause[]>([]);
  const [contractAnalysis, setContractAnalysis] = useState<ContractAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [clauseAnalyses, setClauseAnalyses] = useState<{ [key: number]: AIAnalysis }>({});
  const [activeTab, setActiveTab] = useState<'clauses' | 'analysis'>('clauses');
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);

  useEffect(() => {
    if (contractId) {
      fetchContract();
    }
  }, [contractId]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const response = await contractsApi.getContract(contractId);
      setContract(response.data);
      
      if (response.data.clauses) {
        const editableClauses: EditableClause[] = response.data.clauses.map(clause => ({
          id: clause.id,
          isEditing: false,
          originalContent: clause.custom_content || clause.clause_template.content,
          editedContent: clause.custom_content || clause.clause_template.content,
          hasAIRecommendation: false,
          isAcceptingRecommendation: false
        }));
        setEditableClauses(editableClauses);
        
        // Fetch AI analyses for each clause
        fetchClauseAnalyses(response.data.clauses);
      }
    } catch (err) {
      console.error('Error fetching contract:', err);
      setError('Failed to load contract details');
    } finally {
      setLoading(false);
    }
  };

  const fetchClauseAnalyses = async (clauses: { id: number }[]) => {
    const analyses: { [key: number]: AIAnalysis } = {};
    
    for (const clause of clauses) {
      try {
        const response = await aiApi.getAnalysisByClause(clause.id);
        analyses[clause.id] = response.data;
      } catch {
        console.log(`No analysis found for clause ${clause.id}`);
      }
    }
    
    setClauseAnalyses(analyses);
    
    // Update editable clauses with AI recommendation info
    setEditableClauses(prev => prev.map(ec => ({
      ...ec,
      hasAIRecommendation: !!analyses[ec.id],
      aiAnalysis: analyses[ec.id]
    })));
  };

  const generateContractAnalysis = async () => {
    if (!contract?.clauses) return;
    
    try {
      setAnalysisLoading(true);
      const clauseTemplateIds = contract.clauses.map(clause => clause.clause_template_id);
      const response = await aiApi.analyzeContract(contractId, clauseTemplateIds);
      setContractAnalysis(response.data);
      setIsAnalysisDialogOpen(true);
    } catch (err) {
      console.error('Error generating contract analysis:', err);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const generateClauseAnalysis = async (clauseId: number) => {
    try {
      const response = await aiApi.analyzeClause(clauseId);
      setClauseAnalyses(prev => ({
        ...prev,
        [clauseId]: response.data
      }));
      
      // Update editable clause
      setEditableClauses(prev => prev.map(ec => 
        ec.id === clauseId 
          ? { ...ec, hasAIRecommendation: true, aiAnalysis: response.data }
          : ec
      ));
    } catch (err) {
      console.error('Error generating clause analysis:', err);
    }
  };

  const startEditing = (clauseId: number) => {
    setEditableClauses(prev => prev.map(ec => 
      ec.id === clauseId ? { ...ec, isEditing: true } : ec
    ));
  };

  const cancelEditing = (clauseId: number) => {
    setEditableClauses(prev => prev.map(ec => 
      ec.id === clauseId 
        ? { ...ec, isEditing: false, editedContent: ec.originalContent }
        : ec
    ));
  };

  const saveClauseEdit = async (clauseId: number) => {
    const editableClause = editableClauses.find(ec => ec.id === clauseId);
    if (!editableClause) return;

    try {
      // Here you would call an API to save the edited clause
      // For now, we'll just update the local state
      setEditableClauses(prev => prev.map(ec => 
        ec.id === clauseId 
          ? { 
              ...ec, 
              isEditing: false, 
              originalContent: ec.editedContent 
            }
          : ec
      ));
      
      // Update the contract data
      if (contract?.clauses) {
        const updatedClauses = contract.clauses.map(clause => 
          clause.id === clauseId 
            ? { ...clause, custom_content: editableClause.editedContent }
            : clause
        );
        setContract({ ...contract, clauses: updatedClauses });
      }
    } catch (err) {
      console.error('Error saving clause edit:', err);
    }
  };

  const acceptAIRecommendation = async (clauseId: number) => {
    const editableClause = editableClauses.find(ec => ec.id === clauseId);
    const aiAnalysis = clauseAnalyses[clauseId];
    
    if (!editableClause || !aiAnalysis) return;

    try {
      setEditableClauses(prev => prev.map(ec => 
        ec.id === clauseId 
          ? { ...ec, isAcceptingRecommendation: true }
          : ec
      ));

      // Apply the AI recommendation (for demo, we'll use the first recommendation)
      const recommendedContent = aiAnalysis.recommendations[0] || editableClause.originalContent;
      
      setEditableClauses(prev => prev.map(ec => 
        ec.id === clauseId 
          ? { 
              ...ec, 
              editedContent: recommendedContent,
              originalContent: recommendedContent,
              isAcceptingRecommendation: false,
              hasAIRecommendation: false
            }
          : ec
      ));

      // Update the contract data
      if (contract?.clauses) {
        const updatedClauses = contract.clauses.map(clause => 
          clause.id === clauseId 
            ? { ...clause, custom_content: recommendedContent }
            : clause
        );
        setContract({ ...contract, clauses: updatedClauses });
      }
    } catch (err) {
      console.error('Error accepting AI recommendation:', err);
      setEditableClauses(prev => prev.map(ec => 
        ec.id === clauseId 
          ? { ...ec, isAcceptingRecommendation: false }
          : ec
      ));
    }
  };

  const updateClauseContent = (clauseId: number, content: string) => {
    setEditableClauses(prev => prev.map(ec => 
      ec.id === clauseId ? { ...ec, editedContent: content } : ec
    ));
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
      month: 'long',
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
          <p className="text-gray-600">Loading contract details...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <p className="text-gray-600">{error || 'Contract not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <Scale className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{contract.project_name}</h1>
                <p className="text-gray-600">Legal Review & AI Analysis</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Contract Number</p>
                    <p className="font-semibold text-gray-900">{contract.contract_number}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">Total Value</p>
                    <p className="font-semibold text-green-600">{formatCurrency(contract.total_value)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="font-semibold text-gray-900">{contract.contract_type}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center space-x-2">
                  <FileCheck className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">Clauses</p>
                    <p className="font-semibold text-gray-900">{contract.clauses?.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={generateContractAnalysis}
              disabled={analysisLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {analysisLoading ? (
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
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {[
            { id: 'clauses', label: 'Contract Clauses', icon: FileCheck },
            { id: 'analysis', label: 'AI Insights', icon: TrendingUp }
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'clauses' | 'analysis')}
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

      {/* Tab Content */}
      {activeTab === 'clauses' && (
        <div className="space-y-6">
          {contract.clauses && contract.clauses.length > 0 ? (
            contract.clauses
              .sort((a, b) => a.display_order - b.display_order)
              .map((clause) => {
                const editableClause = editableClauses.find(ec => ec.id === clause.id);
                const aiAnalysis = clauseAnalyses[clause.id];
                
                return (
                  <div key={clause.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    {/* Clause Header */}
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 rounded-full p-2">
                            <FileCheck className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {clause.clause_template.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Code: {clause.clause_template.clause_code} • Order: {clause.display_order}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {aiAnalysis && (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(aiAnalysis.risk_level)}`}>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {aiAnalysis.risk_level} RISK
                            </span>
                          )}
                          
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {clause.clause_template.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Clause Content */}
                    <div className="p-6">
                      {editableClause?.isEditing ? (
                        <div className="space-y-4">
                          <textarea
                            value={editableClause.editedContent}
                            onChange={(e) => updateClauseContent(clause.id, e.target.value)}
                            className="w-full min-h-[200px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Edit clause content..."
                          />
                          <div className="flex items-center space-x-3">
                            <Button
                              onClick={() => saveClauseEdit(clause.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => cancelEditing(clause.id)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="prose max-w-none">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {editableClause?.editedContent || clause.custom_content || clause.clause_template.content}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center space-x-3">
                              <Button
                                variant="outline"
                                onClick={() => startEditing(clause.id)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit Clause
                              </Button>
                              
                              {!aiAnalysis && (
                                <Button
                                  variant="outline"
                                  onClick={() => generateClauseAnalysis(clause.id)}
                                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                >
                                  <Bot className="h-4 w-4 mr-2" />
                                  Get AI Analysis
                                </Button>
                              )}
                            </div>
                            
                            {editableClause?.hasAIRecommendation && aiAnalysis && (
                              <Button
                                onClick={() => acceptAIRecommendation(clause.id)}
                                disabled={editableClause.isAcceptingRecommendation}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {editableClause.isAcceptingRecommendation ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Applying...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Accept AI Recommendation
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI Analysis Section */}
                    {aiAnalysis && (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-t border-gray-200 p-6">
                        <div className="flex items-start space-x-4">
                          <div className="bg-purple-100 rounded-full p-2">
                            <Bot className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="flex-1 space-y-4">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">AI Analysis</h4>
                              <p className="text-gray-700">{aiAnalysis.analysis_summary}</p>
                            </div>
                            
                            {aiAnalysis.identified_risks.length > 0 && (
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                                  <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                                  Identified Risks
                                </h5>
                                <ul className="space-y-1">
                                  {aiAnalysis.identified_risks.map((risk, index) => (
                                    <li key={index} className="text-sm text-gray-600 flex items-start">
                                      <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                                      {risk}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {aiAnalysis.recommendations.length > 0 && (
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                                  <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                                  Recommendations
                                </h5>
                                <ul className="space-y-1">
                                  {aiAnalysis.recommendations.map((recommendation, index) => (
                                    <li key={index} className="text-sm text-gray-600 flex items-start">
                                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                                      {recommendation}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>Risk Score: {aiAnalysis.risk_score.toFixed(1)}/10</span>
                                <span>Confidence: {aiAnalysis.confidence_score.toFixed(1)}/10</span>
                              </div>
                              <span className="text-xs text-gray-400">
                                Analyzed: {formatDate(aiAnalysis.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
          ) : (
            <div className="text-center py-16">
              <FileCheck className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No clauses defined for this contract</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center py-16">
              <TrendingUp className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">Generate comprehensive AI analysis for the entire contract</p>
              <Button
                onClick={generateContractAnalysis}
                disabled={analysisLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {analysisLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Contract...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4 mr-2" />
                    Generate Contract Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Analysis Dialog */}
      <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-purple-600" />
              <span>Contract AI Analysis</span>
            </DialogTitle>
            <DialogDescription>
              Comprehensive AI analysis of the entire contract document
            </DialogDescription>
          </DialogHeader>

          {contractAnalysis && (
            <div className="space-y-6">
              {/* Overall Assessment */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Overall Assessment</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(contractAnalysis.overall_risk_level)}`}>
                    {contractAnalysis.overall_risk_level} RISK
                  </span>
                </div>
                <p className="text-gray-700 mb-4">{contractAnalysis.analysis_summary}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-sm text-gray-500">Average Risk Score</p>
                    <p className="text-xl font-bold text-gray-900">{contractAnalysis.average_risk_score.toFixed(1)}/10</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-sm text-gray-500">Clauses Analyzed</p>
                    <p className="text-xl font-bold text-gray-900">{contractAnalysis.total_clauses_analyzed}</p>
                  </div>
                </div>
              </div>

              {/* Key Risks */}
              {contractAnalysis.key_risks.length > 0 && (
                <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                    Key Risks Identified
                  </h3>
                  <ul className="space-y-2">
                    {contractAnalysis.key_risks.map((risk, index) => (
                      <li key={index} className="text-gray-700 flex items-start">
                        <span className="inline-block w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Strategic Recommendations */}
              {contractAnalysis.strategic_recommendations.length > 0 && (
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-green-600" />
                    Strategic Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {contractAnalysis.strategic_recommendations.map((recommendation, index) => (
                      <li key={index} className="text-gray-700 flex items-start">
                        <span className="inline-block w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Clause-by-Clause Analysis */}
              {contractAnalysis.clause_analyses.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6 border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Clause-by-Clause Analysis</h3>
                  <div className="space-y-3">
                    {contractAnalysis.clause_analyses.map((analysis, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">Clause {analysis.clause_id}</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRiskColor(analysis.risk_level)}`}>
                            {analysis.risk_level}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{analysis.summary}</p>
                        <p className="text-xs text-gray-500 mt-2">Risk Score: {analysis.risk_score.toFixed(1)}/10</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnalysisDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}