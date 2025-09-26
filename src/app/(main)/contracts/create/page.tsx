"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Select } from '@/app/components/ui/select';
import { SearchableSelect } from '@/app/components/ui/searchable-select';
import { ChevronLeft, ChevronRight, Plus, X, Eye, Save, Search, Info } from 'lucide-react';
import { clausesApi, contractsApi, ClauseTemplate, ContractTemplate } from '@/services/api';

interface Stakeholder {
  stakeholder_id: number;
  role_in_contract: string;
  representative_name: string;
  representative_title: string;
  other_details?: any;
}

interface ContractFormData {
  project_name: string;
  contract_type: string;
  signing_place: string;
  signing_date: string;
  total_value: number;
  funding_source: string;
  stakeholders: Stakeholder[];
  clause_template_ids: number[];
}

interface ContractPreview {
  id: number;
  name: string;
  content: string;
}

const CreateContractPage = () => {
  // Contract type options
  const contractTypeOptions = [
    { value: 'Kontrak Kerja', label: 'Kontrak Kerja' },
    { value: 'Kontrak Freelance', label: 'Kontrak Freelance' },
    { value: 'Kontrak Magang', label: 'Kontrak Magang' },
    { value: 'Perjanjian Kerahasiaan (NDA)', label: 'Perjanjian Kerahasiaan (NDA)' },
    { value: 'Perjanjian Non-Kompetisi', label: 'Perjanjian Non-Kompetisi' },
    { value: 'Kontrak Jual Beli', label: 'Kontrak Jual Beli' },
    { value: 'Perjanjian Jasa', label: 'Perjanjian Jasa' },
    { value: 'Perjanjian Sewa', label: 'Perjanjian Sewa' },
    { value: 'Perjanjian Pinjaman', label: 'Perjanjian Pinjaman' },
    { value: 'Perjanjian Waralaba', label: 'Perjanjian Waralaba' },
    { value: 'Perjanjian Kerja Sama', label: 'Perjanjian Kerja Sama' },
    { value: 'Kontrak Proyek', label: 'Kontrak Proyek' },
    { value: 'Kontrak Konstruksi', label: 'Kontrak Konstruksi' },
    { value: 'Kontrak Pemeliharaan', label: 'Kontrak Pemeliharaan' },
    { value: 'Perjanjian Pasokan', label: 'Perjanjian Pasokan' },
    { value: 'Perjanjian Hak Kekayaan Intelektual (HKI)', label: 'Perjanjian Hak Kekayaan Intelektual (HKI)' },
    { value: 'Perjanjian Usaha Patungan', label: 'Perjanjian Usaha Patungan' },
    { value: 'Perjanjian Penyelesaian Sengketa', label: 'Perjanjian Penyelesaian Sengketa' },
    { value: 'Perjanjian Pemegang Saham', label: 'Perjanjian Pemegang Saham' }
  ];

  // Form data state
  const [formData, setFormData] = useState<ContractFormData>({
    project_name: '',
    contract_type: '',
    signing_place: '',
    signing_date: '',
    total_value: 0,
    funding_source: '',
    stakeholders: [
      { stakeholder_id: 0, role_in_contract: '', representative_name: '', representative_title: '', other_details: null },
      { stakeholder_id: 0, role_in_contract: '', representative_name: '', representative_title: '', other_details: null }
    ],
    clause_template_ids: []
  });

  // UI state
  const [clauses, setClauses] = useState<ClauseTemplate[]>([]);
  const [selectedClauses, setSelectedClauses] = useState<(ClauseTemplate | null)[]>([null]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Preview state
  const [previews, setPreviews] = useState<ContractPreview[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  
  // Dialog states
  const [isCreateClauseDialogOpen, setIsCreateClauseDialogOpen] = useState(false);
  const [clauseFormData, setClauseFormData] = useState({
    clause_code: '',
    title: '',
    type: '',
    content: '',
    is_active: true
  });
  const [clauseFormErrors, setClauseFormErrors] = useState<Record<string, string>>({});

  // Load clauses on component mount
  useEffect(() => {
    fetchClauses();
  }, []);

  // Debug selected clauses changes
  useEffect(() => {
    console.log('🔄 Selected clauses changed:', selectedClauses);
    console.log('🔄 Selected clauses length:', selectedClauses.length);
  }, [selectedClauses]);

  // Debug clauses array changes
  useEffect(() => {
    console.log('📋 Clauses array changed:', clauses);
    console.log('📋 Clauses length:', clauses.length);
    console.log('📋 Clauses with IDs:', clauses.filter(c => c && c.id));
    console.log('📋 Clauses without IDs:', clauses.filter(c => !c || !c.id));
  }, [clauses]);

  const fetchClauses = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Fetching clauses...');
      const response = await clausesApi.getClauses();
      console.log('📋 Clauses response:', response);
      console.log('📋 Response data:', response.data);
      console.log('📋 Clause templates:', response.data.clause_templates);
      
      const clausesList = response.data.clause_templates || [];
      setClauses(clausesList);
      console.log('📋 Clauses loaded:', clausesList);
      console.log('📋 Clauses count:', clausesList.length);
      console.log('📋 First clause structure:', clausesList[0]);
      console.log('📋 First clause ID type:', typeof clausesList[0]?.id);
    } catch (err: any) {
      console.error('❌ Error fetching clauses:', err);
      setError('Failed to load clauses');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form field changes
  const handleFormChange = (field: keyof ContractFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle stakeholder changes
  const handleStakeholderChange = (index: number, field: keyof Stakeholder, value: any) => {
    setFormData(prev => ({
      ...prev,
      stakeholders: prev.stakeholders.map((stakeholder, i) => 
        i === index ? { ...stakeholder, [field]: value } : stakeholder
      )
    }));
  };

  // Add new stakeholder
  const addStakeholder = () => {
    setFormData(prev => ({
      ...prev,
      stakeholders: [...prev.stakeholders, {
        stakeholder_id: 0,
        role_in_contract: '',
        representative_name: '',
        representative_title: '',
        other_details: null
      }]
    }));
  };

  // Remove stakeholder
  const removeStakeholder = (index: number) => {
    if (formData.stakeholders.length > 1) {
      setFormData(prev => ({
        ...prev,
        stakeholders: prev.stakeholders.filter((_, i) => i !== index)
      }));
    }
  };

  // Handle clause selection
  const handleClauseSelection = (clauseId: string, index: number) => {
    console.log('🎯 Selecting clause:', clauseId, 'at index:', index);
    console.log('🎯 Available clauses:', clauses);
    console.log('🎯 Clause IDs in array:', clauses.map(c => c.id));
    
    const clause = clauses.find(c => c.id === clauseId || c.id === parseInt(clauseId));
    console.log('🎯 Found clause:', clause);
    
    if (clause) {
      setSelectedClauses(prev => {
        const newClauses = [...prev];
        newClauses[index] = clause;
        console.log('🎯 Updated selected clauses:', newClauses);
        
        // Add new empty slot if this is the last one
        if (index === prev.length - 1) {
          newClauses.push(null);
          console.log('🎯 Added new empty slot:', newClauses);
        }
        
        return newClauses;
      });
    }
  };

  // Remove clause
  const removeClause = (index: number) => {
    setSelectedClauses(prev => prev.filter((_, i) => i !== index));
  };

  // Generate preview
  const generatePreview = async () => {
    setIsGeneratingPreview(true);
    try {
      // Simulate generating 3 different preview templates
      const mockPreviews: ContractPreview[] = [
        {
          id: 1,
          name: 'Template 1 - Professional',
          content: generateContractContent('professional')
        },
        {
          id: 2,
          name: 'Template 2 - Legal',
          content: generateContractContent('legal')
        },
        {
          id: 3,
          name: 'Template 3 - Modern',
          content: generateContractContent('modern')
        }
      ];
      
      setPreviews(mockPreviews);
      setCurrentPreviewIndex(0);
    } catch (err) {
      console.error('Error generating preview:', err);
      setError('Failed to generate preview');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Generate contract content based on template
  const generateContractContent = (template: string) => {
    const { project_name, contract_type, signing_place, signing_date, total_value, funding_source, stakeholders } = formData;
    
    let content = '';
    
    switch (template) {
      case 'professional':
        content = `
# CONTRACT AGREEMENT

**Project:** ${project_name}
**Type:** ${contract_type}

## Contract Details
- **Signing Place:** ${signing_place}
- **Signing Date:** ${signing_date}
- **Total Value:** $${total_value.toLocaleString()}
- **Funding Source:** ${funding_source}

## Stakeholders
${stakeholders.map((stakeholder, index) => `
### Stakeholder ${index + 1}
- **Role:** ${stakeholder.role_in_contract}
- **Representative:** ${stakeholder.representative_name}
- **Title:** ${stakeholder.representative_title}
`).join('')}

## Contract Clauses
${selectedClauses.filter(Boolean).map((clause, index) => `
### ${index + 1}. ${clause?.title}
${clause?.content?.replace(/\\n/g, '\n') || ''}
`).join('')}

---
*This contract is legally binding and enforceable.*
        `;
        break;
        
      case 'legal':
        content = `
# LEGAL CONTRACT DOCUMENT

**DATE:** ${signing_date}
**LOCATION:** ${signing_place}

## PARTIES INVOLVED
${stakeholders.map((stakeholder, index) => `
**PARTY ${index + 1}:** ${stakeholder.representative_name}
**ROLE:** ${stakeholder.role_in_contract}
**TITLE:** ${stakeholder.representative_title}
`).join('')}

## CONTRACT TERMS
**PROJECT:** ${project_name}
**VALUE:** $${total_value.toLocaleString()}
**FUNDING:** ${funding_source}

## LEGAL CLAUSES
${selectedClauses.filter(Boolean).map((clause, index) => `
**CLAUSE ${index + 1}:** ${clause?.title}
${clause?.content?.replace(/\\n/g, '\n') || ''}
`).join('')}

**SIGNATURES REQUIRED**
        `;
        break;
        
      case 'modern':
        content = `
# 📋 CONTRACT AGREEMENT

## 🏗️ Project Information
- **Project:** ${project_name}
- **Type:** ${contract_type}

## 📍 Contract Details
- **Location:** ${signing_place}
- **Date:** ${signing_date}
- **Value:** $${total_value.toLocaleString()}
- **Funding:** ${funding_source}

## 👥 Stakeholders
${stakeholders.map((stakeholder, index) => `
### 👤 Stakeholder ${index + 1}
- **Role:** ${stakeholder.role_in_contract}
- **Name:** ${stakeholder.representative_name}
- **Title:** ${stakeholder.representative_title}
`).join('')}

## 📜 Contract Clauses
${selectedClauses.filter(Boolean).map((clause, index) => `
### ${index + 1}. ${clause?.title}
${clause?.content?.replace(/\\n/g, '\n') || ''}
`).join('')}

---
✅ **Contract Status:** Ready for Signing
        `;
        break;
    }
    
    return content.trim();
  };

  // Navigate preview carousel
  const nextPreview = () => {
    setCurrentPreviewIndex(prev => (prev + 1) % previews.length);
  };

  const prevPreview = () => {
    setCurrentPreviewIndex(prev => (prev - 1 + previews.length) % previews.length);
  };

  // Create new clause
  const handleCreateClause = async () => {
    if (!validateClauseForm()) return;
    
    setIsSubmitting(true);
    try {
      console.log('🚀 Creating new clause:', clauseFormData);
      const response = await clausesApi.createClause(clauseFormData);
      console.log('✅ Clause created successfully:', response);
      
      // Close dialog and reset form
      setIsCreateClauseDialogOpen(false);
      setClauseFormData({
        clause_code: '',
        title: '',
        type: '',
        content: '',
        is_active: true
      });
      setClauseFormErrors({});
      
      // Automatically add the new clause to selected clauses immediately
      const newClause = response.data.clause_template;
      console.log('🎯 New clause from API response:', newClause);
      console.log('🎯 Full response data:', response.data);
      
      setSelectedClauses(prev => {
        const newClauses = [...prev];
        // Find the first empty slot
        const emptyIndex = newClauses.findIndex(clause => clause === null);
        if (emptyIndex !== -1) {
          // Fill the first empty slot
          newClauses[emptyIndex] = newClause;
          console.log('🎯 Filled empty slot at index:', emptyIndex);
        } else {
          // If no empty slots, add to the end
          newClauses.push(newClause);
          console.log('🎯 Added new clause to end');
        }
        // Always add a new empty slot after adding a clause
        newClauses.push(null);
        console.log('🎯 Added new clause to selected clauses:', newClauses);
        console.log('🎯 Total clauses now:', newClauses.length);
        return newClauses;
      });
      
      // Add the new clause to the clauses list for future selections
      setClauses(prev => {
        const updatedClauses = [...prev, newClause];
        console.log('🎯 Updated clauses list:', updatedClauses);
        console.log('🎯 New clause structure:', newClause);
        console.log('🎯 New clause ID:', newClause?.id, 'Type:', typeof newClause?.id);
        return updatedClauses;
      });
      
      // Add a delay and then refresh clauses list to ensure consistency
      console.log('⏳ Refreshing clauses list after 2 seconds...');
      setTimeout(async () => {
        await fetchClauses();
      }, 2000);
      
      setError(null);
    } catch (err: any) {
      console.error('❌ Error creating clause:', err);
      setError(`Failed to create clause: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate clause form
  const validateClauseForm = () => {
    const errors: Record<string, string> = {};
    
    if (!clauseFormData.clause_code.trim()) {
      errors.clause_code = 'Clause code is required';
    }
    if (!clauseFormData.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!clauseFormData.type.trim()) {
      errors.type = 'Type is required';
    }
    if (!clauseFormData.content.trim()) {
      errors.content = 'Content is required';
    } else if (clauseFormData.content.trim().length < 10) {
      errors.content = 'Content must be at least 10 characters long';
    }
    
    setClauseFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle clause form changes
  const handleClauseFormChange = (field: string, value: any) => {
    setClauseFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (clauseFormErrors[field]) {
      setClauseFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate contract form
  const validateContractForm = () => {
    const errors: string[] = [];
    
    if (!formData.project_name.trim()) {
      errors.push('Project name is required');
    }
    
    if (!formData.contract_type.trim()) {
      errors.push('Contract type is required');
    }
    
    if (!formData.signing_place.trim()) {
      errors.push('Signing place is required');
    }
    
    if (!formData.signing_date.trim()) {
      errors.push('Signing date is required');
    }
    
    if (formData.total_value <= 0) {
      errors.push('Total value must be greater than 0');
    }
    
    // Check if at least one stakeholder is filled
    const hasValidStakeholder = formData.stakeholders.some(stakeholder => 
      stakeholder.role_in_contract.trim() && 
      stakeholder.representative_name.trim() && 
      stakeholder.representative_title.trim()
    );
    
    if (!hasValidStakeholder) {
      errors.push('At least one stakeholder is required');
    }
    
    // Check if at least one clause is selected
    const hasSelectedClause = selectedClauses.some(clause => clause !== null);
    
    if (!hasSelectedClause) {
      errors.push('At least one clause is required');
    }
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }
    
    return true;
  };

  // Save contract
  const handleSaveContract = async () => {
    if (!validateContractForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log('🎯 Saving contract:', formData);
      
      // Prepare contract data to match API structure
      const contractData = {
        project_name: formData.project_name,
        package_name: "", // Empty string instead of null
        external_reference: "", // Empty string instead of null
        contract_type: formData.contract_type,
        signing_place: formData.signing_place,
        signing_date: formData.signing_date,
        total_value: formData.total_value,
        funding_source: formData.funding_source,
        stakeholders: formData.stakeholders.map((stakeholder, index) => ({
          stakeholder_id: index + 1, // Generate sequential IDs
          role_in_contract: stakeholder.role_in_contract,
          representative_name: stakeholder.representative_name,
          representative_title: stakeholder.representative_title,
          other_details: stakeholder.other_details || {}
        })),
        clause_template_ids: selectedClauses.filter(Boolean).map(clause => parseInt(clause?.id || '0'))
      };
      
      console.log('🎯 Prepared contract data:', contractData);
      
      const response = await contractsApi.createContract(contractData);
      console.log('🎯 Contract created:', response);
      
      setError(null);
      
      // Show success message
      alert('Contract created successfully!');
      
      // Reset form
      setFormData({
        project_name: '',
        contract_type: '',
        signing_place: '',
        signing_date: '',
        total_value: 0,
        funding_source: '',
        stakeholders: [
          { stakeholder_id: 0, role_in_contract: '', representative_name: '', representative_title: '', other_details: null },
          { stakeholder_id: 0, role_in_contract: '', representative_name: '', representative_title: '', other_details: null }
        ],
        clause_template_ids: []
      });
      setSelectedClauses([null]);
      
      // TODO: Redirect to contracts list page
      // window.location.href = '/contracts';
    } catch (err: any) {
      console.error('❌ Error saving contract:', err);
      setError(`Failed to save contract: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Contract</h1>
          <p className="text-gray-600 mt-2">Create a new contract with customizable templates and clauses</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Contract Preview Carousel */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Contract Preview</h2>
              <Button
                onClick={generatePreview}
                disabled={isGeneratingPreview}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Eye className="w-4 h-4 mr-2" />
                {isGeneratingPreview ? 'Generating...' : 'Preview'}
              </Button>
            </div>

            {previews.length > 0 ? (
              <div className="space-y-4">
                {/* Preview Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevPreview}
                    disabled={previews.length <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    {currentPreviewIndex + 1} of {previews.length}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextPreview}
                    disabled={previews.length <= 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Preview Content */}
                <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {previews[currentPreviewIndex]?.name}
                  </h3>
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {previews[currentPreviewIndex]?.content}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Click "Preview" to generate contract previews</p>
              </div>
            )}
          </div>

          {/* Right Side - Form Fields */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Contract Details</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Basic Contract Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    Project Name *
                    <div className="group relative">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        The main name or title of the project
                      </div>
                    </div>
                  </label>
                  <Input
                    value={formData.project_name}
                    onChange={(e) => handleFormChange('project_name', e.target.value)}
                    placeholder="Enter project name"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    Contract Type *
                    <div className="group relative">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        Select the type of contract from the predefined options
                      </div>
                    </div>
                  </label>
                  <SearchableSelect
                    value={formData.contract_type}
                    onValueChange={(value) => handleFormChange('contract_type', value)}
                    options={contractTypeOptions}
                    placeholder="Choose contract type..."
                    searchPlaceholder="Search contract types..."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    Signing Place *
                    <div className="group relative">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        Location where the contract will be signed
                      </div>
                    </div>
                  </label>
                  <Input
                    value={formData.signing_place}
                    onChange={(e) => handleFormChange('signing_place', e.target.value)}
                    placeholder="Enter signing place"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    Signing Date *
                    <div className="group relative">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        Date when the contract will be signed
                      </div>
                    </div>
                  </label>
                  <Input
                    type="date"
                    value={formData.signing_date}
                    onChange={(e) => handleFormChange('signing_date', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    Total Value *
                    <div className="group relative">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        Total monetary value of the contract
                      </div>
                    </div>
                  </label>
                  <Input
                    type="number"
                    value={formData.total_value}
                    onChange={(e) => handleFormChange('total_value', parseFloat(e.target.value) || 0)}
                    placeholder="Enter total value"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    Funding Source
                    <div className="group relative">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        Source of funding for this contract (optional)
                      </div>
                    </div>
                  </label>
                  <Input
                    value={formData.funding_source}
                    onChange={(e) => handleFormChange('funding_source', e.target.value)}
                    placeholder="Enter funding source"
                    disabled={formData.total_value === 0}
                    className={`w-full ${formData.total_value === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              {/* Stakeholders Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Stakeholders</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStakeholder}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Stakeholder
                  </Button>
                </div>

                {formData.stakeholders.map((stakeholder, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Stakeholder {index + 1}</h4>
                      {formData.stakeholders.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeStakeholder(index)}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                          Role in Contract *
                          <div className="group relative">
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                              Stakeholder's role (e.g., Contractor, Client, Consultant)
                            </div>
                          </div>
                        </label>
                        <Input
                          value={stakeholder.role_in_contract}
                          onChange={(e) => handleStakeholderChange(index, 'role_in_contract', e.target.value)}
                          placeholder="e.g., Contractor, Client"
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                          Representative Name *
                          <div className="group relative">
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                              Full name of the person representing this stakeholder
                            </div>
                          </div>
                        </label>
                        <Input
                          value={stakeholder.representative_name}
                          onChange={(e) => handleStakeholderChange(index, 'representative_name', e.target.value)}
                          placeholder="Enter representative name"
                          className="w-full"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                          Representative Title *
                          <div className="group relative">
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                              Job title or position of the representative
                            </div>
                          </div>
                        </label>
                        <Input
                          value={stakeholder.representative_title}
                          onChange={(e) => handleStakeholderChange(index, 'representative_title', e.target.value)}
                          placeholder="Enter representative title"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clauses Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Contract Clauses</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateClauseDialogOpen(true)}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Create New Clause
                  </Button>
                </div>

                {isLoading && (
                  <div className="text-center py-4 text-gray-500">
                    Loading clauses...
                  </div>
                )}

                {!isLoading && clauses.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No clauses available. Create a new clause to get started.
                  </div>
                )}

                {!isLoading && clauses.length > 0 && (
                  <div className="text-sm text-gray-600 mb-2">
                    {clauses.length} clauses available
                  </div>
                )}


                {selectedClauses.map((clause, index) => {
                  console.log('🎨 Rendering clause', index, ':', clause);
                  return (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Clause {index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeClause(index)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select Clause
                        </label>
                        <SearchableSelect
                          value={clause?.id?.toString() || ''}
                          onValueChange={(value) => {
                            console.log('🎯 Dropdown changed:', value, 'at index:', index);
                            console.log('🎯 Current clause at index:', clause);
                            handleClauseSelection(value, index);
                          }}
                          options={clauses.filter(clause => clause && clause.id).map(clauseOption => ({
                            value: clauseOption.id.toString(),
                            label: `${clauseOption.title} - ${clauseOption.type}`
                          }))}
                          placeholder="Choose a clause..."
                          searchPlaceholder="Search clauses..."
                          className="w-full"
                        />
                      </div>

                      {clause && (
                        <div className="bg-white p-3 rounded border">
                          <h5 className="font-medium text-gray-900 mb-2">{clause.title}</h5>
                          <div className="text-sm text-gray-600 whitespace-pre-wrap">
                            {clause.content}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t">
                <Button
                  onClick={handleSaveContract}
                  disabled={isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Saving...' : 'Save Contract'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Clause Dialog */}
      <Dialog open={isCreateClauseDialogOpen} onOpenChange={setIsCreateClauseDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Create New Clause
                </DialogTitle>
                <DialogDescription className="mt-2">
                  Fill in the details to create a new clause template
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                onClick={() => setIsCreateClauseDialogOpen(false)}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clause Code *
            </label>
            <Input
              value={clauseFormData.clause_code}
              onChange={(e) => handleClauseFormChange('clause_code', e.target.value)}
              placeholder="Enter clause code"
              className="w-full"
            />
            {clauseFormErrors.clause_code && (
              <p className="text-red-500 text-xs mt-1">{clauseFormErrors.clause_code}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <Input
              value={clauseFormData.title}
              onChange={(e) => handleClauseFormChange('title', e.target.value)}
              placeholder="Enter clause title"
              className="w-full"
            />
            {clauseFormErrors.title && (
              <p className="text-red-500 text-xs mt-1">{clauseFormErrors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <Input
              value={clauseFormData.type}
              onChange={(e) => handleClauseFormChange('type', e.target.value)}
              placeholder="Enter clause type"
              className="w-full"
            />
            {clauseFormErrors.type && (
              <p className="text-red-500 text-xs mt-1">{clauseFormErrors.type}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content *
            </label>
            <textarea
              value={clauseFormData.content}
              onChange={(e) => handleClauseFormChange('content', e.target.value)}
              placeholder="Enter clause content (minimum 10 characters)"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
            {clauseFormErrors.content && (
              <p className="text-red-500 text-xs mt-1">{clauseFormErrors.content}</p>
            )}
          </div>

          <div className="flex space-x-2">
            <Button
              type="button"
              onClick={() => handleClauseFormChange('is_active', true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                clauseFormData.is_active
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
            >
              Active
            </Button>
            <Button
              type="button"
              onClick={() => handleClauseFormChange('is_active', false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                !clauseFormData.is_active
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
            >
              Inactive
            </Button>
          </div>

          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsCreateClauseDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateClause}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Clause'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateContractPage;
