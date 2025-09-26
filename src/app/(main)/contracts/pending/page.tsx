"use client";

import React, { useEffect, useState } from 'react';
import Sidebar from '../../../../components/Sidebar';
import { Contract, contractApprovalApi, ContractApprovalResponse } from '../../../../services/api';
import ContractApprovalModal from '../components/ContractApprovalModal';

const PendingContractsPage = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalModal, setApprovalModal] = useState<{
    isOpen: boolean;
    contract: Contract | null;
    approvalData: ContractApprovalResponse['data'] | null;
  }>({
    isOpen: false,
    contract: null,
    approvalData: null
  });
  const [approving, setApproving] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    fetchPendingContracts();
  }, []);

  const fetchPendingContracts = async () => {
    try {
      setLoading(true);
      // Filter contracts with PENDING_SIGNATURE status
      const response = await fetch('http://localhost:8080/api/dashboard/contracts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }
      
      const data = await response.json();
      const pendingContracts = data.data.filter((contract: Contract) => 
        contract.status === 'PENDING_SIGNATURE' || 
        contract.status === 'PENDING_LEGAL_REVIEW' ||
        contract.status === 'DRAFT'
      );
      setContracts(pendingContracts);
    } catch (err: any) {
      console.error('Error fetching pending contracts:', err);
      setError(err.message || 'Failed to fetch pending contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveContract = async (contract: Contract) => {
    try {
      setApproving(contract.id);
      const response = await contractApprovalApi.approveContract(contract.id);
      
      if (response.data.requires_review) {
        // Show review modal for high-risk contracts
        setApprovalModal({
          isOpen: true,
          contract,
          approvalData: response.data
        });
      } else {
        // Auto-approve low-risk contracts
        alert(`Contract "${contract.project_name}" has been approved automatically!`);
        fetchPendingContracts(); // Refresh the list
      }
    } catch (err: any) {
      console.error('Error approving contract:', err);
      alert('Failed to approve contract. Please try again.');
    } finally {
      setApproving(null);
    }
  };

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

  const getContractTypeColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      'Construction': 'bg-blue-100 text-blue-800',
      'Supply': 'bg-green-100 text-green-800',
      'Service Agreement': 'bg-amber-100 text-amber-800',
      'Service': 'bg-purple-100 text-purple-800',
      'Maintenance': 'bg-red-100 text-red-800',
      'Consulting': 'bg-cyan-100 text-cyan-800',
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '20px' }}>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', height: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '20px' }}>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Contracts</h2>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pending Signature Contracts</h1>
            <p className="text-gray-600">Contracts awaiting signature approval</p>
          </div>

          {contracts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Contracts</h3>
                <p className="text-gray-500">There are no contracts currently pending signature.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contracts.map((contract) => (
                <div key={contract.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {contract.project_name}
                      </h3>
                      <p className="text-sm text-gray-500">ID: {contract.id}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getContractTypeColor(contract.contract_type)}`}>
                      {contract.contract_type}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Value:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(contract.total_value)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Signing Date:</span>
                      <span className="text-sm text-gray-900">
                        {contract.signing_date ? formatDate(contract.signing_date) : 'Not set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm text-gray-900">
                        {formatDate(contract.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleApproveContract(contract)}
                      disabled={approving === contract.id}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        approving === contract.id
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {approving === contract.id ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        'Approve Contract'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setApprovalModal({
                          isOpen: true,
                          contract,
                          approvalData: null
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Approval Modal */}
      <ContractApprovalModal
        isOpen={approvalModal.isOpen}
        onClose={() => setApprovalModal({ isOpen: false, contract: null, approvalData: null })}
        contract={approvalModal.contract}
        approvalData={approvalModal.approvalData}
        onApprovalComplete={fetchPendingContracts}
      />
    </div>
  );
};

export default PendingContractsPage;
