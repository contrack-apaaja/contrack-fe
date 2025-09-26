"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/Button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/app/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  X, 
  Info, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Search,
  FileText,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  Building,
  User,
  CheckCircle
} from "lucide-react";
import { contractsApi, clausesApi, Contract, ClauseTemplate, Stakeholder } from "@/services/api";

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

interface ContractFormData {
  project_name: string;
  contract_type: string;
  signing_place: string;
  signing_date: string;
  total_value: number;
  funding_source: string;
  stakeholders: Array<{
    stakeholder_id: number;
    role_in_contract: string;
    representative_name: string;
    representative_title: string;
    other_details: any;
  }>;
  clause_template_ids: number[];
}

interface ClauseFormData {
  clause_code: string;
  title: string;
  type: string;
  content: string;
  is_active: boolean;
}

interface ContractPreview {
  id: number;
  name: string;
  content: string;
}

export default function EditContractPage() {
  const router = useRouter();
  const [contractId, setContractId] = useState<string>('');
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
  
  const [clauses, setClauses] = useState<ClauseTemplate[]>([]);
  const [selectedClauses, setSelectedClauses] = useState<(ClauseTemplate | null)[]>([]);
  const [previews, setPreviews] = useState<ContractPreview[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateClauseDialogOpen, setIsCreateClauseDialogOpen] = useState(false);
  
  // Clause creation form state
  const [clauseFormData, setClauseFormData] = useState<ClauseFormData>({
    clause_code: '',
    title: '',
    type: '',
    content: '',
    is_active: true
  });
  const [clauseFormErrors, setClauseFormErrors] = useState<Record<string, string>>({});

  // Get contract ID from URL
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // Get the ID from the URL
    setContractId(id);
  }, []);

  // Load contract data on component mount
  useEffect(() => {
    const loadContractData = async () => {
      try {
        setIsLoading(true);
        
        // Try to get data from sessionStorage first
        const storedData = sessionStorage.getItem('editContractData');
        if (storedData) {
          const contractData = JSON.parse(storedData);
          console.log('📋 Loaded contract data from sessionStorage:', contractData);
          
          // Populate form with stored data
          setFormData({
            project_name: contractData.project_name || '',
            contract_type: contractData.contract_type || '',
            signing_place: contractData.signing_place || '',
            signing_date: contractData.signing_date || '',
            total_value: contractData.total_value || 0,
            funding_source: contractData.funding_source || '',
            stakeholders: contractData.stakeholders || [
              { stakeholder_id: 0, role_in_contract: '', representative_name: '', representative_title: '', other_details: null },
              { stakeholder_id: 0, role_in_contract: '', representative_name: '', representative_title: '', other_details: null }
            ],
            clause_template_ids: contractData.clauses?.map((c: any) => c.id) || []
          });
          
          // Set selected clauses
          if (contractData.clauses && contractData.clauses.length > 0) {
            setSelectedClauses(contractData.clauses.map((c: any) => c.clause_template || c));
          } else {
            setSelectedClauses([null]);
          }
          
          // Clear sessionStorage after use
          sessionStorage.removeItem('editContractData');
        } else {
          // Fallback: fetch from API
          if (contractId) {
            const response = await contractsApi.getContract(contractId);
            const contract = response.data;
            
            setFormData({
              project_name: contract.project_name || '',
              contract_type: contract.contract_type || '',
              signing_place: contract.signing_place || '',
              signing_date: contract.signing_date ? contract.signing_date.split('T')[0] : '',
              total_value: contract.total_value || 0,
              funding_source: contract.funding_source || '',
              stakeholders: contract.stakeholders || [
                { stakeholder_id: 0, role_in_contract: '', representative_name: '', representative_title: '', other_details: null },
                { stakeholder_id: 0, role_in_contract: '', representative_name: '', representative_title: '', other_details: null }
              ],
              clause_template_ids: contract.clauses?.map((c: any) => c.id) || []
            });
            
            if (contract.clauses && contract.clauses.length > 0) {
              setSelectedClauses(contract.clauses.map((c: any) => c.clause_template || c));
            } else {
              setSelectedClauses([null]);
            }
          }
        }
        
        // Fetch available clauses
        await fetchClauses();
        
      } catch (err: any) {
        console.error('❌ Error loading contract data:', err);
        setError(`Failed to load contract data: ${err.response?.data?.message || err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (contractId) {
      loadContractData();
    }
  }, [contractId]);

  // Fetch available clauses
  const fetchClauses = async () => {
    try {
      console.log('🔄 Fetching clauses...');
      const response = await clausesApi.getClauses();
      console.log('📋 Clauses response:', response);
      console.log('📋 Response data:', response.data);
      console.log('📋 Clause templates:', response.data.clause_templates);
      
      const clausesData = response.data.clause_templates || [];
      console.log('📋 Clauses loaded:', clausesData);
      console.log('📋 Clauses count:', clausesData.length);
      setClauses(clausesData);
    } catch (err: any) {
      console.error('❌ Error fetching clauses:', err);
      setError(`Failed to fetch clauses: ${err.response?.data?.message || err.message}`);
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
  const handleStakeholderChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      stakeholders: prev.stakeholders.map((stakeholder, i) => 
        i === index ? { ...stakeholder, [field]: value } : stakeholder
      )
    }));
  };

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
    
    const clause = clauses.find(c => c.id === clauseId || c.id === parseInt(clauseId));
    console.log('🎯 Found clause:', clause);
    
    setSelectedClauses(prev => {
      const newClauses = [...prev];
      newClauses[index] = clause || null;
      
      // If this was the last clause and it's not null, add a new empty slot
      if (index === newClauses.length - 1 && clause) {
        newClauses.push(null);
      }
      
      console.log('🎯 Updated selected clauses:', newClauses);
      return newClauses;
    });
  };

  const removeClause = (index: number) => {
    setSelectedClauses(prev => prev.filter((_, i) => i !== index));
  };

  // Handle create new clause
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

  // Utility functions for contract generation
  const generateContractNumber = (contractType: string, signingDate: string) => {
    if (!contractType || !signingDate) return 'CTR-2025-001';
    
    const date = new Date(signingDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const typeCode = contractType.substring(0, 3).toUpperCase();
    return `${typeCode}-${year}-${month}-${day}`;
  };

  const formatIndonesianDate = (dateString: string) => {
    if (!dateString || dateString.trim() === '') return 'Tidak ditentukan';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Tidak ditentukan';
      const options: Intl.DateTimeFormatOptions = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      };
      return date.toLocaleDateString('id-ID', options);
    } catch (error) {
      return 'Tidak ditentukan';
    }
  };

  const formatIndonesianCurrency = (amount: number) => {
    if (!amount || isNaN(amount)) return 'Rp 0,00';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const numberToIndonesianWords = (num: number) => {
    if (!num || isNaN(num) || num === 0) return 'Nol Rupiah';
    if (num > 999999999) return 'Jumlah terlalu besar';
    
    const ones = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan'];
    const tens = ['', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh', 'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh'];
    const teens = ['Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas', 'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'];
    
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Ratus' + (num % 100 ? ' ' + numberToIndonesianWords(num % 100) : '');
    if (num < 1000000) return numberToIndonesianWords(Math.floor(num / 1000)) + ' Ribu' + (num % 1000 ? ' ' + numberToIndonesianWords(num % 1000) : '');
    if (num < 1000000000) return numberToIndonesianWords(Math.floor(num / 1000000)) + ' Juta' + (num % 1000000 ? ' ' + numberToIndonesianWords(num % 1000000) : '');
    
    return 'Jumlah terlalu besar';
  };

  // Generate HTML contract content based on template
  const generateHTMLContent = (templateNumber: number = 1) => {
    switch (templateNumber) {
      case 1:
        return generateHTMLTemplate1(formData, formData.stakeholders);
      case 2:
        return generateHTMLTemplate2(formData, formData.stakeholders);
      case 3:
        return generateHTMLTemplate3(formData, formData.stakeholders);
      default:
        return generateHTMLTemplate1(formData, formData.stakeholders);
    }
  };

  // HTML Template 1: Universal ILCS Template
  const generateHTMLTemplate1 = (formData: any, stakeholders: any[]) => {
    const institutionStakeholder = stakeholders.find(s => s.role_in_contract.toLowerCase().includes('institution'));
    const contractorStakeholder = stakeholders.find(s => !s.role_in_contract.toLowerCase().includes('institution'));
    
    const { project_name, contract_type, signing_place, signing_date, total_value, funding_source } = formData;
    
    // Generate utility values
    const contractNumber = generateContractNumber(contract_type || '', signing_date || '');
    const indonesianDate = formatIndonesianDate(signing_date || '');
    const indonesianCurrency = formatIndonesianCurrency(total_value || 0);
    const indonesianWords = numberToIndonesianWords(total_value || 0);
    
    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Perjanjian Jasa - PT ILCS PELINDO</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #333; max-width: 21cm; margin: 0 auto; padding: 3cm 2.5cm; background: white; }
        .header { text-align: center; margin-bottom: 2cm; padding-bottom: 1cm; border-bottom: 2px solid #333; }
        .header h1 { font-size: 18pt; font-weight: bold; margin-bottom: 0.5cm; }
        .header h2 { font-size: 14pt; font-weight: bold; margin-bottom: 0.5cm; }
        .contract-number { font-size: 12pt; font-weight: bold; color: #666; }
        .section { margin: 1cm 0; }
        .section-title { font-size: 14pt; font-weight: bold; margin-bottom: 0.5cm; text-decoration: underline; }
        .subsection-title { font-size: 12pt; font-weight: bold; margin: 0.5cm 0 0.3cm 0; }
        .party-info { margin: 0.5cm 0; }
        .info-table { width: 100%; margin: 0.5cm 0; }
        .info-table td { padding: 3px 0; vertical-align: top; }
        .info-table td:first-child { width: 200px; }
        .info-table td:nth-child(2) { width: 20px; text-align: center; }
        .party-designation { font-weight: bold; margin: 0.3cm 0; }
        .background-list { margin: 0.5cm 0; padding-left: 1cm; }
        .background-list li { margin-bottom: 0.3cm; }
        .signature-section { margin: 2cm 0; page-break-inside: avoid; }
        .signature-table { width: 100%; border-collapse: collapse; }
        .signature-table td { text-align: center; vertical-align: top; padding: 1cm; }
        .signature-line { border-top: 1px solid #333; width: 200px; margin: 3cm auto 0.5cm auto; }
        .footer-note { text-align: center; font-style: italic; font-size: 10pt; color: #666; margin-top: 1cm; padding-top: 1cm; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PERJANJIAN JASA</h1>
        <h2>PT INDONESIA LOGISTIC CARGO SERVICES (ILCS) PELINDO</h2>
        <div class="contract-number">Nomor: <span>${contractNumber}</span></div>
    </div>

    <div class="section">
        <p>Pada hari ini, <strong><span>${indonesianDate}</span></strong>, 
        bertempat di <strong><span>${signing_place || 'PT ILCS Pelindo'}</span></strong>, 
        telah dibuat dan ditandatangani Perjanjian Jasa untuk 
        <strong><span>${project_name || 'PT ILCS Pelindo'}</span></strong> dengan ketentuan sebagai berikut:</p>
    </div>

    <div class="section">
        <div class="section-title">1. PARA PIHAK</div>
        <p>Yang bertanda tangan di bawah ini:</p>

        <div class="party-info">
            <div class="subsection-title">1.1 PIHAK PERTAMA</div>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td>PT Indonesia Logistic Cargo Services (ILCS) Pelindo</td></tr>
                <tr><td>Alamat</td><td>:</td><td>Jl. Raya Pelabuhan No. 1, Jakarta Utara</td></tr>
                <tr><td>Dalam hal ini diwakili oleh</td><td>:</td><td><strong><span>${institutionStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></strong></td></tr>
                <tr><td>Jabatan</td><td>:</td><td><strong><span>${institutionStakeholder?.representative_title || 'PT ILCS Pelindo'}</span></strong></td></tr>
            </table>
            <div class="party-designation">Selanjutnya disebut sebagai <strong>"PIHAK PERTAMA"</strong></div>
        </div>

        <div class="party-info">
            <div class="subsection-title">1.2 PIHAK KEDUA</div>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td><strong><span>${contractorStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></strong></td></tr>
                <tr><td>Alamat</td><td>:</td><td><strong><span>[Alamat Perusahaan]</span></strong></td></tr>
                <tr><td>Dalam hal ini diwakili oleh</td><td>:</td><td><strong><span>${contractorStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></strong></td></tr>
                <tr><td>Jabatan</td><td>:</td><td><strong><span>${contractorStakeholder?.representative_title || 'PT ILCS Pelindo'}</span></strong></td></tr>
            </table>
            <div class="party-designation">Selanjutnya disebut sebagai <strong>"PIHAK KEDUA"</strong></div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">2. LATAR BELAKANG</div>
        <p>Para pihak sepakat untuk mengadakan perjanjian jasa dengan latar belakang:</p>
        <ol class="background-list" type="a">
            <li>Bahwa PIHAK PERTAMA memerlukan jasa untuk pelaksanaan <strong><span>${project_name || 'PT ILCS Pelindo'}</span></strong>;</li>
            <li>Bahwa PIHAK KEDUA memiliki kemampuan dan keahlian untuk melaksanakan pekerjaan tersebut;</li>
            <li>Bahwa berdasarkan hal tersebut, para pihak sepakat untuk mengikat diri dalam perjanjian ini.</li>
        </ol>
    </div>

    <div class="section">
        <div class="section-title">3. KETENTUAN PERJANJIAN</div>
        <div>
            <div class="subsection-title">3.1 HARGA KONTRAK, SUMBER PEMBIAYAAN DAN PEMBAYARAN</div>
            <div>
                <p><strong>(1)</strong> Harga Kontrak termasuk Pajak Pertambahan Nilai (PPN) yang diperoleh berdasarkan total harga penawaran terkoreksi sebagaimana tercantum dalam Daftar Kuantitas dan Harga (BoQ) adalah sebesar <strong><span>${indonesianCurrency}</span></strong> (<strong><span>${indonesianWords}</span></strong>) termasuk PPN 11%, PPh 1,5% dan bunga diskonto SCF.</p>
                <p><strong>(2)</strong> Harga pekerjaan dalam perjanjian ini merupakan Harga Satuan Tetap (Unit Price), dimana harga satuan yang tersebut pada daftar kuantitas pekerjaan merupakan kuantitas perkiraan.</p>
                <p><strong>(3)</strong> Kontrak ini dibiayai dari <strong><span>${funding_source || 'PT ILCS Pelindo'}</span></strong>.</p>
            </div>
        </div>
    </div>

    <div class="signature-section">
        <div class="section-title">4. PENUTUP</div>
        <p>Demikian perjanjian ini dibuat dalam 2 rangkap asli, masing-masing mempunyai kekuatan hukum yang sama, dan ditandatangani oleh para pihak pada hari dan tanggal tersebut di atas.</p>
        
        <table class="signature-table">
            <tr><td><strong>PIHAK PERTAMA</strong></td><td><strong>PIHAK KEDUA</strong></td></tr>
            <tr><td><strong>PT ILCS PELINDO</strong></td><td><strong><span>${contractorStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></strong></td></tr>
            <tr>
                <td><div class="signature-line"></div><strong><span>${institutionStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></strong><br><strong><span>${institutionStakeholder?.representative_title || 'PT ILCS Pelindo'}</span></strong></td>
                <td><div class="signature-line"></div><strong><span>${contractorStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></strong><br><strong><span>${contractorStakeholder?.representative_title || 'PT ILCS Pelindo'}</span></strong></td>
            </tr>
        </table>
    </div>

    <div class="footer-note">
        <p>Kontrak ini dibuat berdasarkan Template Universal ILCS Pelindo</p>
        <p>Jenis Kontrak: ${contract_type || 'PT ILCS Pelindo'} | Tanggal Pembuatan: ${new Date().toLocaleDateString('id-ID')}</p>
    </div>
</body>
</html>`;
  };

  // HTML Template 2: Construction Contract Template
  const generateHTMLTemplate2 = (formData: any, stakeholders: any[]) => {
    const institutionStakeholder = stakeholders.find(s => s.role_in_contract.toLowerCase().includes('institution'));
    const contractorStakeholder = stakeholders.find(s => !s.role_in_contract.toLowerCase().includes('institution'));
    
    const { project_name, contract_type, signing_place, signing_date, total_value, funding_source } = formData;
    
    // Generate utility values
    const contractNumber = generateContractNumber(contract_type || '', signing_date || '');
    const indonesianDate = formatIndonesianDate(signing_date || '');
    const indonesianCurrency = formatIndonesianCurrency(total_value || 0);
    const indonesianWords = numberToIndonesianWords(total_value || 0);
    
    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Construction Contract - PT ILCS PELINDO</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #333; max-width: 21cm; margin: 0 auto; padding: 3cm 2.5cm; background: white; }
        .header { text-align: center; margin-bottom: 2cm; padding-bottom: 1cm; border-bottom: 2px solid #333; }
        .header h1 { font-size: 18pt; font-weight: bold; margin-bottom: 0.5cm; }
        .header h2 { font-size: 14pt; font-weight: bold; margin-bottom: 0.5cm; }
        .contract-number { font-size: 12pt; font-weight: bold; color: #666; }
        .section { margin: 1cm 0; }
        .section-title { font-size: 14pt; font-weight: bold; margin-bottom: 0.5cm; text-decoration: underline; }
        .subsection-title { font-size: 12pt; font-weight: bold; margin: 0.5cm 0 0.3cm 0; }
        .party-info { margin: 0.5cm 0; }
        .info-table { width: 100%; margin: 0.5cm 0; }
        .info-table td { padding: 3px 0; vertical-align: top; }
        .info-table td:first-child { width: 200px; }
        .info-table td:nth-child(2) { width: 20px; text-align: center; }
        .party-designation { font-weight: bold; margin: 0.3cm 0; }
        .background-list { margin: 0.5cm 0; padding-left: 1cm; }
        .background-list li { margin-bottom: 0.3cm; }
        .signature-section { margin: 2cm 0; page-break-inside: avoid; }
        .signature-table { width: 100%; border-collapse: collapse; }
        .signature-table td { text-align: center; vertical-align: top; padding: 1cm; }
        .signature-line { border-top: 1px solid #333; width: 200px; margin: 3cm auto 0.5cm auto; }
        .footer-note { text-align: center; font-style: italic; font-size: 10pt; color: #666; margin-top: 1cm; padding-top: 1cm; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>KONTRAK KERJA KONSTRUKSI</h1>
        <h2>PT INDONESIA LOGISTIC CARGO SERVICES (ILCS) PELINDO</h2>
        <div class="contract-number">Nomor: <span>${contractNumber}</span></div>
    </div>

    <div class="section">
        <p><strong>KONTRAK KERJA KONSTRUKSI</strong> ini dibuat dan ditandatangani di <strong><span>${signing_place || 'PT ILCS Pelindo'}</span></strong> pada hari ini, tanggal <strong><span>${indonesianDate}</span></strong>, antara:</p>
    </div>

    <div class="section">
        <div class="section-title">1. PARA PIHAK</div>
        <p>Yang bertanda tangan di bawah ini:</p>

        <div class="party-info">
            <div class="subsection-title">1.1 PIHAK PERTAMA</div>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td>PT ILCS PELINDO</td></tr>
                <tr><td>Alamat</td><td>:</td><td>Jl. Raya Pelabuhan No. 1, Jakarta Utara</td></tr>
                <tr><td>Diwakili oleh</td><td>:</td><td><strong><span>${institutionStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></strong></td></tr>
                <tr><td>Jabatan</td><td>:</td><td><strong><span>${institutionStakeholder?.representative_title || 'PT ILCS Pelindo'}</span></strong></td></tr>
            </table>
            <div class="party-designation">Selanjutnya disebut sebagai <strong>"PENGGUNA JASA"</strong></div>
        </div>

        <div class="party-info">
            <div class="subsection-title">1.2 PIHAK KEDUA</div>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td><strong><span>${contractorStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></strong></td></tr>
                <tr><td>Alamat</td><td>:</td><td><strong><span>[Alamat Perusahaan]</span></strong></td></tr>
                <tr><td>Diwakili oleh</td><td>:</td><td><strong><span>${contractorStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></strong></td></tr>
                <tr><td>Jabatan</td><td>:</td><td><strong><span>${contractorStakeholder?.representative_title || 'PT ILCS Pelindo'}</span></strong></td></tr>
                <tr><td>Nomor Izin</td><td>:</td><td><strong><span>CONST-2024-001</span></strong></td></tr>
            </table>
            <div class="party-designation">Selanjutnya disebut sebagai <strong>"PENYEDIA JASA"</strong></div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">2. INFORMASI KONTRAK</div>
        <table class="info-table">
            <tr><td>Jenis Kontrak</td><td>:</td><td><span>${contract_type || 'PT ILCS Pelindo'}</span></td></tr>
            <tr><td>Nama Proyek</td><td>:</td><td><span>${project_name || 'PT ILCS Pelindo'}</span></td></tr>
            <tr><td>Nilai Kontrak</td><td>:</td><td><span>${indonesianCurrency}</span></td></tr>
            <tr><td></td><td></td><td><span>(${indonesianWords})</span></td></tr>
            <tr><td>Sumber Pembiayaan</td><td>:</td><td><span>${funding_source || 'PT ILCS Pelindo'}</span></td></tr>
            <tr><td>Tempat Penandatanganan</td><td>:</td><td><span>${signing_place || 'PT ILCS Pelindo'}</span></td></tr>
            <tr><td>Tanggal Penandatanganan</td><td>:</td><td><span>${indonesianDate}</span></td></tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">3. KETENTUAN KONTRAK</div>
        <div>
            <div class="subsection-title">3.1 PASAL 003 - HARGA KONTRAK, SUMBER PEMBIAYAAN DAN PEMBAYARAN</div>
            <div>
                <p><strong>(1)</strong> Harga Kontrak termasuk Pajak Pertambahan Nilai (PPN) yang diperoleh berdasarkan total harga penawaran terkoreksi sebagaimana tercantum dalam Daftar Kuantitas dan Harga (BoQ) adalah sebesar <strong><span>${indonesianCurrency}</span></strong> (<strong><span>${indonesianWords}</span></strong>) termasuk PPN 11%, PPh 1,5% dan bunga diskonto SCF.</p>
                <p><strong>(2)</strong> Harga pekerjaan dalam perjanjian ini merupakan Harga Satuan Tetap (Unit Price), dimana harga satuan yang tersebut pada daftar kuantitas pekerjaan merupakan kuantitas perkiraan.</p>
                <p><strong>(3)</strong> Kontrak ini dibiayai dari <strong><span>${funding_source || 'PT ILCS Pelindo'}</span></strong>.</p>
            </div>
        </div>
    </div>

    <div class="signature-section">
        <div class="section-title">4. PENUTUP</div>
        <p>Demikian kontrak ini dibuat dalam 2 rangkap asli, masing-masing mempunyai kekuatan hukum yang sama, dan ditandatangani oleh para pihak pada hari dan tanggal tersebut di atas.</p>
        
        <table class="signature-table">
            <tr><td><strong>PIHAK PERTAMA</strong></td><td><strong>PIHAK KEDUA</strong></td></tr>
            <tr><td><strong>PT ILCS PELINDO</strong></td><td><strong><span>${contractorStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></strong></td></tr>
            <tr>
                <td><div class="signature-line"></div><strong><span>${institutionStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></strong><br><strong><span>${institutionStakeholder?.representative_title || 'PT ILCS Pelindo'}</span></strong></td>
                <td><div class="signature-line"></div><strong><span>${contractorStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></strong><br><strong><span>${contractorStakeholder?.representative_title || 'PT ILCS Pelindo'}</span></strong></td>
            </tr>
        </table>
    </div>

    <div class="footer-note">
        <p>Kontrak ini dibuat berdasarkan Template Konstruksi ILCS Pelindo</p>
        <p>Jenis Kontrak: ${contract_type || 'PT ILCS Pelindo'} | Tanggal Pembuatan: ${new Date().toLocaleDateString('id-ID')}</p>
    </div>
</body>
</html>`;
  };

  // HTML Template 3: Advanced Construction Contract Template
  const generateHTMLTemplate3 = (formData: any, stakeholders: any[]) => {
    const institutionStakeholder = stakeholders.find(s => s.role_in_contract.toLowerCase().includes('institution'));
    const contractorStakeholder = stakeholders.find(s => !s.role_in_contract.toLowerCase().includes('institution'));
    
    const { project_name, contract_type, signing_place, signing_date, total_value, funding_source } = formData;
    
    // Generate utility values
    const contractNumber = generateContractNumber(contract_type || '', signing_date || '');
    const indonesianDate = formatIndonesianDate(signing_date || '');
    const indonesianCurrency = formatIndonesianCurrency(total_value || 0);
    const indonesianWords = numberToIndonesianWords(total_value || 0);
    
    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Construction Contract - PT ILCS PELINDO</title>
    <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; max-width: 21cm; margin: 0 auto; padding: 3cm 2.5cm; background: white; color: black; }
        .page-header { display: flex; justify-content: space-between; align-items: center; padding: 0.5cm 0; border-bottom: 1px solid #ddd; background: white; margin-bottom: 1cm; }
        .header-logo { font-weight: bold; color: #0066cc; font-size: 14pt; }
        .header-company { font-weight: bold; font-size: 14pt; }
        .page-footer { text-align: center; border-top: 1px solid #ddd; padding-top: 0.5cm; background: white; margin-top: 2cm; }
        .content { margin-top: 0; margin-bottom: 0; }
        .document-title { text-align: center; margin-bottom: 2cm; }
        .document-title h1 { font-size: 18pt; font-weight: bold; margin: 0 0 0.5cm 0; }
        .document-title .contract-number { font-size: 14pt; font-weight: bold; margin-bottom: 0.5cm; }
        .document-title .project-name { font-size: 14pt; font-weight: bold; margin-bottom: 0.3cm; }
        .document-title .package-name { font-size: 14pt; font-weight: bold; margin-bottom: 1cm; }
        .dynamic { font-weight: bold; color: black; }
        .party-info { margin: 1cm 0; }
        .info-table { width: 100%; border-collapse: collapse; margin: 0.3cm 0; }
        .info-table td { padding: 0.2cm; vertical-align: top; }
        .info-table td:first-child { width: 3cm; font-weight: bold; }
        .info-table td:nth-child(2) { width: 1cm; text-align: center; }
        .section-header { font-size: 14pt; font-weight: bold; margin: 1.5cm 0 1cm 0; text-align: center; border-bottom: 1px solid #333; padding-bottom: 0.3cm; }
        .subsection-header { font-size: 12pt; font-weight: bold; margin: 1cm 0 0.5cm 0; }
        .contract-clause { margin: 1cm 0; }
        .signature-section { margin-top: 2cm; text-align: center; }
        .signature-table { width: 100%; margin: 1cm auto; }
        .signature-table td { text-align: center; padding: 1cm; vertical-align: top; }
        .signature-line { border-bottom: 0.5pt solid black; width: 5cm; height: 3cm; display: inline-block; margin-bottom: 0.3cm; }
        .footer-note { text-align: center; font-style: italic; margin-top: 2cm; font-size: 11pt; }
        .margin-top-1 { margin-top: 1cm; }
        @media print { .page-header, .page-footer { position: running(); } .dynamic { color: black; } }
    </style>
</head>
<body>
    <div class="page-header">
        <div class="header-logo"><img src="/logo/logo_pelindo.png" alt="Logo Pelindo" style="height: 2cm; max-width: 100%;" /></div>
        <div class="header-company">PT ILCS PELINDO</div>
    </div>
    
    <div class="page-footer">
        <span id="page-number">1</span>
    </div>

    <div class="content">
        <div class="document-title">
            <h1>KONTRAK KERJA KONSTRUKSI</h1>
            <div class="contract-number">Nomor: <span class="dynamic">${contractNumber}</span></div>
            <div class="project-name"><span class="dynamic">${project_name || 'PT ILCS Pelindo'}</span></div>
            <div class="package-name"><span class="dynamic">${contract_type || 'PT ILCS Pelindo'}</span></div>
        </div>

        <div class="section-header">PARA PIHAK</div>
        <p>Yang bertanda tangan di bawah ini:</p>

        <div class="party-info">
            <div class="subsection-header">PIHAK PERTAMA</div>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td>PT ILCS PELINDO</td></tr>
                <tr><td>Alamat</td><td>:</td><td>Jl. Raya Pelabuhan No. 1, Jakarta Utara</td></tr>
                <tr><td>Diwakili oleh</td><td>:</td><td><span class="dynamic">${institutionStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></td></tr>
                <tr><td>Jabatan</td><td>:</td><td><span class="dynamic">${institutionStakeholder?.representative_title || 'PT ILCS Pelindo'}</span></td></tr>
            </table>
            <p class="margin-top-1">Selanjutnya disebut sebagai <strong>"PENGGUNA JASA"</strong></p>
        </div>

        <div class="party-info">
            <div class="subsection-header">PIHAK KEDUA</div>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td><span class="dynamic">${contractorStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></td></tr>
                <tr><td>Alamat</td><td>:</td><td><span class="dynamic">[Alamat Perusahaan]</span></td></tr>
                <tr><td>Diwakili oleh</td><td>:</td><td><span class="dynamic">${contractorStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></td></tr>
                <tr><td>Jabatan</td><td>:</td><td><span class="dynamic">${contractorStakeholder?.representative_title || 'PT ILCS Pelindo'}</span></td></tr>
            </table>
            <p class="margin-top-1">Selanjutnya disebut sebagai <strong>"PENYEDIA JASA"</strong></p>
        </div>

        <div class="section-header">KETENTUAN KONTRAK</div>
        
        <div class="contract-clause">
            <div class="subsection-header">PASAL 003 - HARGA KONTRAK, SUMBER PEMBIAYAAN DAN PEMBAYARAN</div>
            <div>
                <p>(1) Harga Kontrak termasuk Pajak Pertambahan Nilai (PPN) yang diperoleh berdasarkan total harga penawaran terkoreksi sebagaimana tercantum dalam Daftar Kuantitas dan Harga (BoQ) adalah sebesar <span class="dynamic">${indonesianCurrency}</span> <span class="dynamic">(${indonesianWords})</span> termasuk PPN 11%, PPh 1,5% dan bunga diskonto SCF.</p>
                <p>(2) Harga pekerjaan dalam perjanjian ini merupakan Harga Satuan Tetap (Unit Price), dimana harga satuan yang tersebut pada daftar kuantitas pekerjaan merupakan kuantitas perkiraan.</p>
                <p>(3) Kontrak ini dibiayai dari <span class="dynamic">${funding_source || 'PT ILCS Pelindo'}</span>.</p>
            </div>
        </div>

        <div class="contract-clause">
            <div class="subsection-header">PASAL KEDUA - <span class="dynamic">[JUDUL KLAUSUL]</span></div>
            <div>
                <p><span class="dynamic">[Isi klausul akan diambil dari database berdasarkan clause_template_id kedua]</span></p>
            </div>
        </div>

        <div class="contract-clause">
            <div class="subsection-header">PASAL KETIGA - <span class="dynamic">[JUDUL KLAUSUL]</span></div>
            <div>
                <p><span class="dynamic">[Isi klausul akan diambil dari database berdasarkan clause_template_id ketiga]</span></p>
            </div>
        </div>

        <div class="contract-clause">
            <div class="subsection-header">BERLAKUNYA KONTRAK</div>
            <div>
                <p>Kontrak ini mulai berlaku sejak tanggal penandatanganan dan berakhir setelah seluruh kewajiban para pihak telah dipenuhi.</p>
            </div>
        </div>

        <div class="contract-clause">
            <div class="subsection-header">PENYELESAIAN PERSELISIHAN</div>
            <div>
                <p>Segala perselisihan yang timbul dari pelaksanaan kontrak ini akan diselesaikan melalui musyawarah mufakat. Apabila tidak tercapai kesepakatan, maka akan diselesaikan melalui arbitrase sesuai dengan peraturan yang berlaku.</p>
            </div>
        </div>

        <div class="contract-clause">
            <div class="subsection-header">FORCE MAJEURE</div>
            <div>
                <p>Para pihak dibebaskan dari tanggung jawab atas keterlambatan atau kegagalan pelaksanaan kontrak yang disebabkan oleh keadaan kahar (force majeure).</p>
            </div>
        </div>

        <div class="signature-section">
            <div class="section-header">PENUTUP</div>
            <p>Demikian kontrak ini dibuat dalam 2 rangkap asli, masing-masing mempunyai kekuatan hukum yang sama, dan ditandatangani oleh para pihak pada hari dan tanggal tersebut di atas.</p>
            
            <table class="signature-table">
                <tr><td><strong>PIHAK PERTAMA</strong></td><td><strong>PIHAK KEDUA</strong></td></tr>
                <tr><td><strong>PT ILCS PELINDO</strong></td><td><strong><span class="dynamic">${contractorStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></strong></td></tr>
                <tr>
                    <td><div class="signature-line"></div><strong><span class="dynamic">${institutionStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></strong><br><strong><span class="dynamic">${institutionStakeholder?.representative_title || 'PT ILCS Pelindo'}</span></strong></td>
                    <td><div class="signature-line"></div><strong><span class="dynamic">${contractorStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></strong><br><strong><span class="dynamic">${contractorStakeholder?.representative_title || 'PT ILCS Pelindo'}</span></strong></td>
                </tr>
            </table>
        </div>

        <div class="footer-note">
            <p>Kontrak ini dibuat berdasarkan Template Advanced ILCS Pelindo</p>
            <p>Jenis Kontrak: <span class="dynamic">${contract_type || 'PT ILCS Pelindo'}</span> | Tanggal Pembuatan: ${new Date().toLocaleDateString('id-ID')}</p>
        </div>
    </div>
</body>
</html>`;
  };

  // Generate contract content
  const generateContractContent = (template: string = 'professional') => {
    const { formData: data } = formData;
    
    let content = '';
    
    if (template === 'professional') {
      content = `# CONTRACT AGREEMENT\n\n**Project:** ${data.project_name}\n**Type:** ${data.contract_type}\n**Date:** ${data.signing_date}\n**Value:** $${data.total_value.toLocaleString()}\n\n## PARTIES\n\n`;
      
      data.stakeholders.forEach((stakeholder, index) => {
        if (stakeholder.representative_name) {
          content += `**Party ${index + 1}:** ${stakeholder.representative_name}\n`;
          content += `**Role:** ${stakeholder.role_in_contract}\n`;
          content += `**Title:** ${stakeholder.representative_title}\n\n`;
        }
      });
      
      content += `## TERMS AND CONDITIONS\n\n`;
      
      selectedClauses.filter(Boolean).forEach((clause, index) => {
        if (clause) {
          content += `### ${clause.title}\n\n${clause.content.replace(/\\n/g, '\n')}\n\n`;
        }
      });
    }
    
    return content;
  };

  // Handle preview generation
  const handleGeneratePreview = async () => {
    setIsGeneratingPreview(true);
    try {
      // Generate 3 different HTML templates
      const mockPreviews: ContractPreview[] = [
        {
          id: 1,
          name: 'Template 1',
          content: generateHTMLContent(1)
        },
        {
          id: 2,
          name: 'Template 2',
          content: generateHTMLContent(2)
        },
        {
          id: 3,
          name: 'Template 3',
          content: generateHTMLContent(3)
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

  // Handle save contract
  const handleSaveContract = async () => {
    if (!validateContractForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('🎯 Updating contract:', formData);

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

      const response = await contractsApi.updateContract(contractId, contractData);
      console.log('🎯 Contract updated:', response);

      setError(null);

      // Show success message
      alert('Contract updated successfully!');

      // Redirect back to contracts list
      router.push('/contracts');
    } catch (err: any) {
      console.error('❌ Error updating contract:', err);
      setError(`Failed to update contract: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate contract form
  const validateContractForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.project_name.trim()) {
      errors.project_name = 'Project name is required';
    }
    if (!formData.contract_type.trim()) {
      errors.contract_type = 'Contract type is required';
    }
    if (formData.total_value <= 0) {
      errors.total_value = 'Total value must be greater than 0';
    }
    if (formData.stakeholders.length === 0) {
      errors.stakeholders = 'At least one stakeholder is required';
    }
    if (selectedClauses.filter(Boolean).length === 0) {
      errors.clauses = 'At least one clause is required';
    }

    return Object.keys(errors).length === 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="secondary"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Contract</h1>
              <p className="text-gray-600">Modify contract details and clauses</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              onClick={handleGeneratePreview}
              disabled={isGeneratingPreview}
            >
              <Eye className="h-4 w-4 mr-2" />
              {isGeneratingPreview ? 'Generating...' : 'Preview'}
            </Button>
            <Button
              onClick={handleSaveContract}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Side - Contract Preview */}
        <div className="w-1/2 border-r border-gray-200 bg-white">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Contract Preview
            </h2>
            
            {previews.length > 0 ? (
              <div className="space-y-4">
                {/* Preview Navigation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPreviewIndex(Math.max(0, currentPreviewIndex - 1))}
                      disabled={currentPreviewIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      {currentPreviewIndex + 1} of {previews.length}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPreviewIndex(Math.min(previews.length - 1, currentPreviewIndex + 1))}
                      disabled={currentPreviewIndex === previews.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Preview Content */}
                <div className="border border-gray-200 rounded-lg bg-white max-h-[90vh] overflow-hidden">
                  <iframe
                    srcDoc={previews[currentPreviewIndex]?.content || ''}
                    className="w-full h-[85vh] border-0"
                    title="Contract Preview"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Click "Preview" to generate contract preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Contract Form */}
        <div className="w-1/2 bg-white overflow-y-auto">
          <div className="p-6 space-y-8">
            {/* Contract Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                Contract Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                    <Info className="inline h-4 w-4 ml-1 text-gray-400" title="Enter the name of the project this contract is for" />
                  </label>
                  <Input
                    value={formData.project_name}
                    onChange={(e) => handleFormChange('project_name', e.target.value)}
                    placeholder="Enter project name"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contract Type *
                    <Info className="inline h-4 w-4 ml-1 text-gray-400" title="Select the type of contract" />
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Signing Place
                      <Info className="inline h-4 w-4 ml-1 text-gray-400" title="Where the contract will be signed" />
                    </label>
                    <Input
                      value={formData.signing_place}
                      onChange={(e) => handleFormChange('signing_place', e.target.value)}
                      placeholder="Enter signing place"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Signing Date
                      <Info className="inline h-4 w-4 ml-1 text-gray-400" title="When the contract will be signed" />
                    </label>
                    <Input
                      type="date"
                      value={formData.signing_date}
                      onChange={(e) => handleFormChange('signing_date', e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Value *
                      <Info className="inline h-4 w-4 ml-1 text-gray-400" title="Total monetary value of the contract" />
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Funding Source
                      <Info className="inline h-4 w-4 ml-1 text-gray-400" title="Source of funding for this contract" />
                    </label>
                    <Input
                      value={formData.funding_source}
                      onChange={(e) => handleFormChange('funding_source', e.target.value)}
                      placeholder="Enter funding source"
                      className="w-full"
                      disabled={formData.total_value === 0}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stakeholders */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  Stakeholders ({formData.stakeholders.length})
                </h3>
                <Button
                  variant="secondary"
                  onClick={addStakeholder}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Stakeholder</span>
                </Button>
              </div>
              
              <div className="space-y-4">
                {formData.stakeholders.map((stakeholder, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Stakeholder {index + 1}</h4>
                      {formData.stakeholders.length > 1 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => removeStakeholder(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role in Contract *
                        </label>
                        <Input
                          value={stakeholder.role_in_contract}
                          onChange={(e) => handleStakeholderChange(index, 'role_in_contract', e.target.value)}
                          placeholder="e.g., Contractor, Client"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Representative Name *
                        </label>
                        <Input
                          value={stakeholder.representative_name}
                          onChange={(e) => handleStakeholderChange(index, 'representative_name', e.target.value)}
                          placeholder="Enter representative name"
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Representative Title *
                      </label>
                      <Input
                        value={stakeholder.representative_title}
                        onChange={(e) => handleStakeholderChange(index, 'representative_title', e.target.value)}
                        placeholder="e.g., Project Manager, CEO"
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clauses */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  Contract Clauses ({selectedClauses.filter(Boolean).length})
                </h3>
                <Button
                  variant="secondary"
                  onClick={() => setIsCreateClauseDialogOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Clause</span>
                </Button>
              </div>
              
              <div className="space-y-4">
                {selectedClauses.map((clause, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">
                        Clause {index + 1}
                      </h4>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => removeClause(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
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
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Clause Dialog */}
      <Dialog open={isCreateClauseDialogOpen} onOpenChange={setIsCreateClauseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Clause</DialogTitle>
            <DialogDescription>
              Add a new clause template that can be used in contracts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clause Code *
                </label>
                <Input
                  value={clauseFormData.clause_code}
                  onChange={(e) => setClauseFormData({ ...clauseFormData, clause_code: e.target.value })}
                  placeholder="Enter clause code"
                  className={clauseFormErrors.clause_code ? 'border-red-500' : ''}
                />
                {clauseFormErrors.clause_code && (
                  <p className="text-red-500 text-xs mt-1">{clauseFormErrors.clause_code}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <Input
                  value={clauseFormData.title}
                  onChange={(e) => setClauseFormData({ ...clauseFormData, title: e.target.value })}
                  placeholder="Enter clause title"
                  className={clauseFormErrors.title ? 'border-red-500' : ''}
                />
                {clauseFormErrors.title && (
                  <p className="text-red-500 text-xs mt-1">{clauseFormErrors.title}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <Input
                value={clauseFormData.type}
                onChange={(e) => setClauseFormData({ ...clauseFormData, type: e.target.value })}
                placeholder="Enter clause type"
                className={clauseFormErrors.type ? 'border-red-500' : ''}
              />
              {clauseFormErrors.type && (
                <p className="text-red-500 text-xs mt-1">{clauseFormErrors.type}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                value={clauseFormData.content}
                onChange={(e) => setClauseFormData({ ...clauseFormData, content: e.target.value })}
                placeholder="Enter clause content"
                rows={6}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  clauseFormErrors.content ? 'border-red-500' : ''
                }`}
              />
              {clauseFormErrors.content && (
                <p className="text-red-500 text-xs mt-1">{clauseFormErrors.content}</p>
              )}
            </div>

            {/* Active Status Toggle */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setClauseFormData({ ...clauseFormData, is_active: true })}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    clauseFormData.is_active
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setClauseFormData({ ...clauseFormData, is_active: false })}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    !clauseFormData.is_active
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsCreateClauseDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateClause} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Clause
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
