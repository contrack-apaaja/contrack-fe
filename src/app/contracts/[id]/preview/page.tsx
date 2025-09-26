"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { contractsApi, Contract } from "@/services/api";
import { Loader2, FileText, Calendar, DollarSign, MapPin, Building2, Users, Scale } from "lucide-react";

export default function ContractPreviewPage() {
  const params = useParams();
  const contractId = params.id as string;
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        setLoading(true);
        const response = await contractsApi.getContract(Number(contractId));
        setContract(response.data);
      } catch (err) {
        console.error("Error fetching contract:", err);
        setError("Failed to load contract preview");
      } finally {
        setLoading(false);
      }
    };

    if (contractId) {
      fetchContract();
    }
  }, [contractId]);

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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'DRAFT': return 'text-gray-600 bg-gray-100';
      case 'PENDING_LEGAL_REVIEW': return 'text-yellow-700 bg-yellow-100';
      case 'PENDING_SIGNATURE': return 'text-blue-700 bg-blue-100';
      case 'ACTIVE': return 'text-green-700 bg-green-100';
      case 'EXPIRED': return 'text-orange-700 bg-orange-100';
      case 'TERMINATED': return 'text-red-700 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading contract preview...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Contract Not Found</h1>
          <p className="text-gray-600">{error || "The requested contract could not be found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contract Preview</h1>
              <p className="text-sm text-gray-600 mt-1">
                {contract.contract_number} • Version {contract.version_number}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                {contract.status.replace(/_/g, ' ')}
              </span>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Print Contract
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Contract Header */}
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                CONTRACT AGREEMENT
              </h1>
              <p className="text-lg text-gray-700">
                {contract.project_name}
              </p>
              {contract.package_name && (
                <p className="text-md text-gray-600 mt-1">
                  Package: {contract.package_name}
                </p>
              )}
            </div>
          </div>

          {/* Contract Details Grid */}
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Contract Number</p>
                    <p className="text-sm text-gray-900 font-mono">{contract.contract_number}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Building2 className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Contract Type</p>
                    <p className="text-sm text-gray-900">{contract.contract_type}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Value</p>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(contract.total_value)}</p>
                  </div>
                </div>

                {contract.funding_source && (
                  <div className="flex items-start space-x-3">
                    <Scale className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Funding Source</p>
                      <p className="text-sm text-gray-900">{contract.funding_source}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {contract.signing_date && (
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Signing Date</p>
                      <p className="text-sm text-gray-900">{formatDate(contract.signing_date)}</p>
                    </div>
                  </div>
                )}

                {contract.signing_place && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Signing Place</p>
                      <p className="text-sm text-gray-900">{contract.signing_place}</p>
                    </div>
                  </div>
                )}

                {contract.external_reference && (
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">External Reference</p>
                      <p className="text-sm text-gray-900">{contract.external_reference}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created Date</p>
                    <p className="text-sm text-gray-900">{formatDate(contract.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stakeholders Section */}
          {contract.stakeholders && contract.stakeholders.length > 0 && (
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">Parties to this Agreement</h2>
              </div>
              <div className="space-y-4">
                {contract.stakeholders.map((stakeholder, index) => (
                  <div key={stakeholder.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Party {index + 1}: {stakeholder.stakeholder.legal_name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Role: {stakeholder.role_in_contract}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {stakeholder.stakeholder.type}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Representative:</span> {stakeholder.representative_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Title:</span> {stakeholder.representative_title}
                        </p>
                      </div>
                      {stakeholder.stakeholder.address && (
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Address:</span> {stakeholder.stakeholder.address}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contract Clauses */}
          {contract.clauses && contract.clauses.length > 0 && (
            <div className="px-8 py-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Terms and Conditions</h2>
              <div className="space-y-6">
                {contract.clauses
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((clause, index) => (
                  <div key={clause.id} className="border-l-4 border-blue-200 pl-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {index + 1}. {clause.clause_template.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Code: {clause.clause_template.clause_code} | Type: {clause.clause_template.type}
                    </p>
                    <div className="prose prose-sm max-w-none text-gray-700">
                      {clause.custom_content || clause.clause_template.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contract Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
            <div className="text-center text-sm text-gray-500">
              <p>This contract was generated on {formatDate(new Date().toISOString())}</p>
              <p className="mt-1">Base ID: {contract.base_id}</p>
              <p className="mt-1">
                Status: <span className="font-medium">{contract.status.replace(/_/g, ' ')}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}