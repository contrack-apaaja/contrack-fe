"use client";

import React, { useState } from 'react';
import { Contract, ContractApprovalResponse } from '../../../services/api';

interface ContractApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  approvalData: ContractApprovalResponse['data'] | null;
  onApprovalComplete: () => void;
}

const ContractApprovalModal: React.FC<ContractApprovalModalProps> = ({
  isOpen,
  onClose,
  contract,
  approvalData,
  onApprovalComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !contract) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRiskLevelColor = (level: string) => {
    const colorMap: { [key: string]: string } = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800',
    };
    return colorMap[level] || 'bg-gray-100 text-gray-800';
  };

  const getApprovalStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'APPROVED': 'bg-green-100 text-green-800',
      'REVIEW_REQUIRED': 'bg-yellow-100 text-yellow-800',
      'REJECTED': 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const handleFinalApproval = async () => {
    setIsProcessing(true);
    try {
      // Here you would call the final approval API
      // For now, we'll just show a success message
      alert(`Contract "${contract.project_name}" has been approved!`);
      onApprovalComplete();
      onClose();
    } catch (error) {
      console.error('Error approving contract:', error);
      alert('Failed to approve contract. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Contract Approval Review</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contract Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Project Name</label>
                  <p className="text-sm text-gray-900">{contract.project_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Contract ID</label>
                  <p className="text-sm text-gray-900">{contract.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Contract Type</label>
                  <p className="text-sm text-gray-900">{contract.contract_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Value</label>
                  <p className="text-sm text-gray-900">{formatCurrency(contract.total_value)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Signing Date</label>
                  <p className="text-sm text-gray-900">{formatDate(contract.signing_date)}</p>
                </div>
              </div>
            </div>

            {/* Approval Analysis */}
            {approvalData && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Analysis</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Risk Level</label>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(approvalData.risk_level)}`}>
                        {approvalData.risk_level.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Risk Score</label>
                    <p className="text-sm text-gray-900">{approvalData.risk_score}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Approval Status</label>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getApprovalStatusColor(approvalData.approval_status)}`}>
                        {approvalData.approval_status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Message</label>
                    <p className="text-sm text-gray-900">{approvalData.approval_message}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Review Reasons and Next Steps */}
          {approvalData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {approvalData.review_reasons.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-2">Review Reasons</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {approvalData.review_reasons.map((reason, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {approvalData.next_steps.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">Next Steps</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {approvalData.next_steps.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleFinalApproval}
              disabled={isProcessing}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isProcessing
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Approve Contract'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractApprovalModal;
