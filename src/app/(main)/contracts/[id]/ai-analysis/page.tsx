"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Loader2, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Shield, 
  FileText, 
  Brain,
  Target,
  Lightbulb,
  AlertCircle,
  Clock,
  DollarSign,
  Users,
  FileCheck
} from 'lucide-react';
import { Button } from '@/app/components/Button';
import { aiAnalysisApi } from '@/services/api';

// Types for AI Analysis API response
interface ClauseAnalysis {
  clause_id: number;
  risk_level: string;
  risk_score: number;
  analysis_summary: string;
  identified_risks: string[];
  recommendations: string[];
  legal_implications: string;
  compliance_notes: string;
}

interface AIAnalysisResponse {
  status: string;
  data: {
    contract_id: number;
    overall_risk_level: string;
    overall_risk_score: number;
    contract_summary: string;
    clause_analyses: ClauseAnalysis[];
    key_risks: string[];
    recommendations: string[];
  };
}

const ContractAIAnalysisPage = () => {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AIAnalysisResponse['data'] | null>(null);
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (contractId) {
      fetchContractInfo();
    }
  }, [contractId]);

  const fetchContractInfo = async () => {
    try {
      setLoading(true);
      
      // Check authentication
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch contract details
        const response = await fetch(`http://localhost:8080/api/contracts/${contractId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch contract details');
        }

        const data = await response.json();
        setContractInfo(data.data);
      }
    } catch (err: any) {
      console.error('Error fetching contract info:', err);
      setError(err.message || 'Failed to fetch contract details');
    } finally {
      setLoading(false);
    }
  };

  const runAIAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError(null);

      // Check authentication
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }
      }

      // Updated API call - only send contract_id
      const data = await aiAnalysisApi.analyzeContract(parseInt(contractId));
      setAnalysisData(data.data);
    } catch (err: any) {
      console.error('Error running AI analysis:', err);
      setError(err.message || 'Failed to run AI analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const saveAnalysis = async () => {
    if (!analysisData) return;

    try {
      setSaving(true);
      setError(null);

      // Check authentication
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }
      }

      // Updated API call - only send contract_id and analysis_result
      const result = await aiAnalysisApi.saveAnalysis(
        parseInt(contractId),
        analysisData
      );

      setSaved(true);
      
      // Show success message
      alert(`Analysis saved successfully! ${result.data.message}`);
      
    } catch (err: any) {
      console.error('Error saving analysis:', err);
      setError(err.message || 'Failed to save analysis');
    } finally {
      setSaving(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading contract details...</p>
        </div>
      </div>
    );
  }

  if (error && !analysisData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                onClick={() => router.back()}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AI Contract Analysis</h1>
                {contractInfo && (
                  <p className="text-sm text-gray-600">{contractInfo.project_name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!analysisData ? (
                <Button
                  onClick={runAIAnalysis}
                  disabled={analyzing}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Run AI Analysis
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={saveAnalysis}
                  disabled={saving || saved}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : saved ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Analysis Saved
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Save Analysis
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Analysis Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {saved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-green-800">Analysis Saved Successfully</h3>
                <p className="text-sm text-green-700 mt-1">The analysis has been saved and the contract is ready for legal review.</p>
              </div>
            </div>
          </div>
        )}

        {!analysisData ? (
          <div className="text-center py-16">
            <Brain className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for AI Analysis</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Click "Run AI Analysis" to get comprehensive risk assessment and recommendations for this contract.
            </p>
            {contractInfo && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
                <h4 className="font-semibold text-gray-900 mb-4">Contract Overview</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Project:</span>
                    <span className="ml-2 font-medium">{contractInfo.project_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2 font-medium">{contractInfo.contract_type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Value:</span>
                    <span className="ml-2 font-medium">{formatCurrency(contractInfo.total_value)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 font-medium">{contractInfo.status}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overall Risk Assessment */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Shield className="h-6 w-6 mr-2 text-purple-600" />
                  Overall Risk Assessment
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(analysisData.overall_risk_level)}`}>
                  {analysisData.overall_risk_level.toUpperCase()} RISK
                </span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Risk Score</span>
                    <span className={`text-2xl font-bold ${getRiskScoreColor(analysisData.overall_risk_score)}`}>
                      {analysisData.overall_risk_score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        analysisData.overall_risk_score < 30 ? 'bg-green-500' :
                        analysisData.overall_risk_score < 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${analysisData.overall_risk_score}%` }}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Contract ID: {analysisData.contract_id}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Analysis completed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contract Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Contract Summary
              </h3>
              <p className="text-gray-700 leading-relaxed">{analysisData.contract_summary}</p>
            </div>

            {/* Key Risks */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                Key Risks Identified
              </h3>
              <div className="space-y-3">
                {analysisData.key_risks.map((risk, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="bg-red-100 rounded-full p-1 mt-0.5">
                      <AlertTriangle className="h-3 w-3 text-red-600" />
                    </div>
                    <p className="text-sm text-gray-700">{risk}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Recommendations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
                Strategic Recommendations
              </h3>
              <div className="space-y-3">
                {analysisData.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="bg-yellow-100 rounded-full p-1 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-yellow-600" />
                    </div>
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Clause Analysis */}
            {analysisData.clause_analyses && analysisData.clause_analyses.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <FileCheck className="h-5 w-5 mr-2 text-green-600" />
                  Clause-by-Clause Analysis
                </h3>
                <div className="space-y-6">
                  {analysisData.clause_analyses.map((clause, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Clause {clause.clause_id}</h4>
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(clause.risk_level)}`}>
                            {clause.risk_level.toUpperCase()}
                          </span>
                          <span className={`text-sm font-medium ${getRiskScoreColor(clause.risk_score)}`}>
                            {clause.risk_score}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Analysis Summary</h5>
                          <p className="text-sm text-gray-600">{clause.analysis_summary}</p>
                        </div>
                        
                        {clause.identified_risks.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Identified Risks</h5>
                            <ul className="space-y-1">
                              {clause.identified_risks.map((risk, riskIndex) => (
                                <li key={riskIndex} className="text-sm text-gray-600 flex items-start space-x-2">
                                  <span className="text-red-500 mt-1">•</span>
                                  <span>{risk}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {clause.recommendations.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h5>
                            <ul className="space-y-1">
                              {clause.recommendations.map((rec, recIndex) => (
                                <li key={recIndex} className="text-sm text-gray-600 flex items-start space-x-2">
                                  <span className="text-green-500 mt-1">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {clause.legal_implications && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Legal Implications</h5>
                            <p className="text-sm text-gray-600">{clause.legal_implications}</p>
                          </div>
                        )}
                        
                        {clause.compliance_notes && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Compliance Notes</h5>
                            <p className="text-sm text-gray-600">{clause.compliance_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="secondary"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Contracts
              </Button>
              <Button
                onClick={runAIAnalysis}
                disabled={analyzing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Re-analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Re-run Analysis
                  </>
                )}
              </Button>
              <Button
                onClick={saveAnalysis}
                disabled={saving || saved}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Analysis Saved
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Save Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractAIAnalysisPage;
