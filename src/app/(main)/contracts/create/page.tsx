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
// Removed LaTeX renderer - using HTML templates instead
import { ChevronLeft, ChevronRight, Plus, X, Eye, Save, Search, Info } from 'lucide-react';
import { clausesApi, contractsApi, aiApi, ClauseTemplate, ContractTemplate } from '@/services/api';

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

// Utility functions moved outside component scope
const generateContractNumber = (contract_type: string, signing_date: string) => {
  // Handle undefined or empty contract_type
  const typeCode = contract_type && contract_type.length >= 3 
    ? contract_type.substring(0, 3).toUpperCase() 
    : 'CTR';
  const date = new Date(signing_date || new Date());
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${typeCode}-${year}${month}-001`;
};

const formatIndonesianDate = (dateString: string) => {
  if (!dateString || dateString.trim() === '') return 'Tidak ditentukan';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Tidak ditentukan';
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'Asia/Jakarta'
    };
    return date.toLocaleDateString('id-ID', options);
  } catch (error) {
    return 'Tidak ditentukan';
  }
};

const formatIndonesianCurrency = (amount: number) => {
  if (!amount || amount === 0 || isNaN(amount)) return 'Rp. 0,00';
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return 'Rp. 0,00';
  }
};

const numberToIndonesianWords = (num: number): string => {
  if (!num || num === 0 || isNaN(num)) return 'Nol Rupiah';
  
  const ones = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan'];
  const teens = ['Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas', 'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'];
  const tens = ['', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh', 'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh'];
  const hundreds = ['', 'Seratus', 'Dua Ratus', 'Tiga Ratus', 'Empat Ratus', 'Lima Ratus', 'Enam Ratus', 'Tujuh Ratus', 'Delapan Ratus', 'Sembilan Ratus'];
  const thousands = ['', 'Seribu', 'Dua Ribu', 'Tiga Ribu', 'Empat Ribu', 'Lima Ribu', 'Enam Ribu', 'Tujuh Ribu', 'Delapan Ribu', 'Sembilan Ribu'];
  const tenThousands = ['', 'Sepuluh Ribu', 'Dua Puluh Ribu', 'Tiga Puluh Ribu', 'Empat Puluh Ribu', 'Lima Puluh Ribu', 'Enam Puluh Ribu', 'Tujuh Puluh Ribu', 'Delapan Puluh Ribu', 'Sembilan Puluh Ribu'];
  const hundredThousands = ['', 'Seratus Ribu', 'Dua Ratus Ribu', 'Tiga Ratus Ribu', 'Empat Ratus Ribu', 'Lima Ratus Ribu', 'Enam Ratus Ribu', 'Tujuh Ratus Ribu', 'Delapan Ratus Ribu', 'Sembilan Ratus Ribu'];
  const millions = ['', 'Satu Juta', 'Dua Juta', 'Tiga Juta', 'Empat Juta', 'Lima Juta', 'Enam Juta', 'Tujuh Juta', 'Delapan Juta', 'Sembilan Juta'];
  
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  if (num < 1000) return hundreds[Math.floor(num / 100)] + (num % 100 ? ' ' + numberToIndonesianWords(num % 100) : '');
  if (num < 10000) return thousands[Math.floor(num / 1000)] + (num % 1000 ? ' ' + numberToIndonesianWords(num % 1000) : '');
  if (num < 100000) return tenThousands[Math.floor(num / 10000)] + (num % 10000 ? ' ' + numberToIndonesianWords(num % 10000) : '');
  if (num < 1000000) return hundredThousands[Math.floor(num / 100000)] + (num % 100000 ? ' ' + numberToIndonesianWords(num % 100000) : '');
  if (num < 10000000) return millions[Math.floor(num / 1000000)] + (num % 1000000 ? ' ' + numberToIndonesianWords(num % 1000000) : '');
  
  return 'Jumlah terlalu besar';
};

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
      // Generate 3 different LaTeX templates
      const mockPreviews: ContractPreview[] = [
        {
          id: 1,
          name: 'Template 1 - Universal ILCS',
          content: generateHTMLContent(1)
        },
        {
          id: 2,
          name: 'Template 2 - Construction Contract',
          content: generateHTMLContent(2)
        },
        {
          id: 3,
          name: 'Template 3 - Service Agreement',
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

  // Generate HTML contract content based on template
  const generateHTMLContent = (templateNumber: number = 1) => {
    const { project_name, contract_type, signing_place, signing_date, total_value, funding_source, stakeholders } = formData;
    

    // Handle stakeholders
    const generateStakeholdersSection = () => {
      let stakeholdersContent = '';
      
      // Find Institution stakeholder or use first one as PIHAK PERTAMA
      const institutionStakeholder = stakeholders.find(s => 
        s.role_in_contract.toLowerCase().includes('institution')
      );
      const firstStakeholder = institutionStakeholder || stakeholders[0];
      const otherStakeholders = stakeholders.filter(s => s !== firstStakeholder);

      // PIHAK PERTAMA
      stakeholdersContent += `\\subsection{PIHAK PERTAMA}\n`;
      stakeholdersContent += `\\begin{tabular}{ll}\n`;
      if (firstStakeholder?.role_in_contract.toLowerCase().includes('institution')) {
        stakeholdersContent += `Nama & : PT Indonesia Logistic Cargo Services (ILCS) Pelindo \\\\\n`;
        stakeholdersContent += `Alamat & : Jl. Pelabuhan Tanjung Priok, Jakarta Utara \\\\\n`;
      } else {
        stakeholdersContent += `Nama & : \\textbf{[Nama Perusahaan: ${firstStakeholder?.representative_name || 'Tidak ditentukan'}]} \\\\\n`;
        stakeholdersContent += `Alamat & : \\textbf{[Alamat: Tidak ditentukan]} \\\\\n`;
      }
      stakeholdersContent += `Dalam hal ini diwakili oleh & : \\textbf{${firstStakeholder?.representative_name || 'Tidak ditentukan'}} \\\\\n`;
      stakeholdersContent += `Jabatan & : \\textbf{${firstStakeholder?.representative_title || 'Tidak ditentukan'}} \\\\\n`;
      stakeholdersContent += `\\end{tabular}\n\n`;
      stakeholdersContent += `Selanjutnya disebut sebagai \\textbf{PIHAK PERTAMA}\n\n`;

      // Additional parties
      otherStakeholders.forEach((stakeholder, index) => {
        const partyNumber = index + 2;
        const partyNames = ['', 'KEDUA', 'KETIGA', 'KEEMPAT', 'KELIMA', 'KEENAM'];
        const partyName = partyNames[partyNumber] || `KE-${partyNumber}`;
        
        stakeholdersContent += `\\subsection{PIHAK ${partyName}}\n`;
        stakeholdersContent += `\\begin{tabular}{ll}\n`;
        stakeholdersContent += `Nama & : \\textbf{[Nama Perusahaan: ${stakeholder.representative_name || 'Tidak ditentukan'}]} \\\\\n`;
        stakeholdersContent += `Alamat & : \\textbf{[Alamat: Tidak ditentukan]} \\\\\n`;
        stakeholdersContent += `Peran dalam Kontrak & : \\textbf{${stakeholder.role_in_contract || 'Tidak ditentukan'}} \\\\\n`;
        stakeholdersContent += `Dalam hal ini diwakili oleh & : \\textbf{${stakeholder.representative_name || 'Tidak ditentukan'}} \\\\\n`;
        stakeholdersContent += `Jabatan & : \\textbf{${stakeholder.representative_title || 'Tidak ditentukan'}} \\\\\n`;
        stakeholdersContent += `\\end{tabular}\n\n`;
        stakeholdersContent += `Selanjutnya disebut sebagai \\textbf{PIHAK ${partyName}}\n\n`;
      });

      return stakeholdersContent;
    };

    // Generate clauses section
    const generateClausesSection = () => {
      let clausesContent = '';
      const activeClauses = selectedClauses.filter(Boolean);
      
      activeClauses.forEach((clause, index) => {
        if (clause) {
          clausesContent += `\\subsection{\\textbf{${clause.title}}}\n`;
          clausesContent += `${clause.content.replace(/\n/g, '\\\\\n')}\n\n`;
        }
      });

      return clausesContent;
    };

    // Generate signature section
    const generateSignatureSection = () => {
      if (stakeholders.length === 2) {
        return `\\begin{center}\n\\begin{tabular}{p{6cm}p{2cm}p{6cm}}\n\\centering\n\\textbf{PIHAK PERTAMA} & & \\textbf{PIHAK KEDUA} \\\\[3cm]\n\n\\rule{5cm}{0.5pt} & & \\rule{5cm}{0.5pt} \\\\\n\\textbf{${stakeholders[0]?.representative_name || 'Tidak ditentukan'}} & & \\textbf{${stakeholders[1]?.representative_name || 'Tidak ditentukan'}} \\\\\n\\textbf{${stakeholders[0]?.representative_title || 'Tidak ditentukan'}} & & \\textbf{${stakeholders[1]?.representative_title || 'Tidak ditentukan'}} \\\\\n\\end{tabular}\n\\end{center}`;
      } else {
        let signatureContent = `\\begin{center}\n`;
        stakeholders.forEach((stakeholder, index) => {
          const partyNames = ['PERTAMA', 'KEDUA', 'KETIGA', 'KEEMPAT', 'KELIMA', 'KEENAM'];
          const partyName = partyNames[index] || `KE-${index + 1}`;
          signatureContent += `\\textbf{PIHAK ${partyName}}\\\\[3cm]\n\\rule{5cm}{0.5pt} \\\\\n\\textbf{${stakeholder.representative_name || 'Tidak ditentukan'}} \\\\\n\\textbf{${stakeholder.representative_title || 'Tidak ditentukan'}} \\\\[1cm]\n`;
        });
        signatureContent += `\\end{center}`;
        return signatureContent;
      }
    };


    // Template 2: Construction Contract Template
    const generateTemplate2 = () => {
      const institutionStakeholder = stakeholders.find(s => s.role_in_contract.toLowerCase().includes('institution'));
      const contractorStakeholder = stakeholders.find(s => !s.role_in_contract.toLowerCase().includes('institution'));
      
      return '\\documentclass[a4paper,12pt]{article}' +
        '\\usepackage[utf8]{inputenc}' +
        '\\usepackage[indonesian]{babel}' +
        '\\usepackage{geometry}' +
        '\\usepackage{fancyhdr}' +
        '\\usepackage{graphicx}' +
        '\\usepackage{array}' +
        '\\usepackage{longtable}' +
        '\\usepackage{amsmath}' +
        '\\usepackage{setspace}' +
        '\\usepackage{enumitem}' +
        '' +
        '\\geometry{' +
        '    left=2.5cm,' +
        '    right=2.5cm,' +
        '    top=3cm,' +
        '    bottom=3cm' +
        '}' +
        '' +
        '\\pagestyle{fancy}' +
        '\\fancyhf{}' +
        '% \\fancyhead[L]{\\includegraphics[height=2cm]{logo_pelindo.png}}' +
        '\\fancyhead[L]{LOGO PELINDO}' +
        '\\fancyhead[R]{\\textbf{PT ILCS PELINDO}}' +
        '\\fancyfoot[C]{\\thepage}' +
        '' +
        '\\setlength{\\parindent}{0pt}' +
        '\\setlength{\\parskip}{6pt}' +
        '\\onehalfspacing' +
        '' +
        '\\begin{document}' +
        '' +
        '% Header Section' +
        '\\begin{center}' +
        '    {\\Large \\textbf{KONTRAK KERJA KONSTRUKSI}}\\\\[0.5cm]' +
        '    {\\large \\textbf{NOMOR: ' + generateContractNumber() + '}}\\\\[0.5cm]' +
        '% METADATA: external_reference' +
        '    {\\large \\textbf{' + (project_name || 'Tidak ditentukan') + '}}\\\\' +
        '% METADATA: project_name' +
        '    {\\large \\textbf{' + (contract_type || 'Construction') + '}}\\\\[1cm]' +
        '% METADATA: package_name' +
        '\\end{center}' +
        '' +
        '% Contract Parties Section' +
        '\\textbf{KONTRAK KERJA KONSTRUKSI} ini dibuat dan ditandatangani di \\textbf{' + (signing_place || 'Tidak ditentukan') + '} pada hari ini, tanggal \\textbf{' + formatIndonesianDate(signing_date) + '}, antara:' +
        '% METADATA: signing_place, signing_date' +
        '' +
        '\\vspace{0.5cm}' +
        '' +
        '\\textbf{PIHAK PERTAMA:}' +
        '' +
        '\\begin{tabular}{p{3cm}p{1cm}p{10cm}}' +
        'Nama & : & PT ILCS PELINDO \\\\' +
        'Alamat & : & Jl. Raya Pelabuhan No. 1, Jakarta Utara \\\\' +
        'Diwakili oleh & : & ' + (institutionStakeholder?.representative_name || 'Tidak ditentukan') + ' \\\\' +
        '% METADATA: stakeholder dengan role_in_contract = "Institution" - representative_name' +
        'Jabatan & : & ' + (institutionStakeholder?.representative_title || 'Tidak ditentukan') + ' \\\\' +
        '% METADATA: stakeholder dengan role_in_contract = "Institution" - representative_title' +
        '\\end{tabular}' +
        '' +
        '\\vspace{0.3cm}' +
        'Selanjutnya disebut sebagai \\textbf{``PENGGUNA JASA\'\'}' +
        '' +
        '\\vspace{0.5cm}' +
        '' +
        '\\textbf{PIHAK KEDUA:}' +
        '' +
        '\\begin{tabular}{p{3cm}p{1cm}p{10cm}}' +
        'Nama & : & ' + (contractorStakeholder?.representative_name || 'Tidak ditentukan') + ' \\\\' +
        '% METADATA: stakeholder dengan role_in_contract = "Contractor" - nama perusahaan' +
        'Alamat & : & Jl. Konstruksi No. 123, Jakarta Selatan \\\\' +
        '% METADATA: alamat dari data stakeholder' +
        'Diwakili oleh & : & ' + (contractorStakeholder?.representative_name || 'Tidak ditentukan') + ' \\\\' +
        '% METADATA: stakeholder dengan role_in_contract = "Contractor" - representative_name' +
        'Jabatan & : & ' + (contractorStakeholder?.representative_title || 'Tidak ditentukan') + ' \\\\' +
        '% METADATA: stakeholder dengan role_in_contract = "Contractor" - representative_title' +
        'Nomor Izin & : & CONST-2024-001 \\\\' +
        '% METADATA: stakeholder dengan role_in_contract = "Contractor" - other_details.license_number' +
        '\\end{tabular}' +
        '' +
        '\\vspace{0.3cm}' +
        'Selanjutnya disebut sebagai \\textbf{``PENYEDIA JASA\'\'}' +
        '' +
        '% Contract Details Section' +
        '\\section*{INFORMASI KONTRAK}' +
        '' +
        '\\begin{tabular}{p{4cm}p{1cm}p{9cm}}' +
        'Jenis Kontrak & : & ' + (contract_type || 'Tidak ditentukan') + ' \\\\' +
        '% METADATA: contract_type' +
        'Nama Proyek & : & ' + (project_name || 'Tidak ditentukan') + ' \\\\' +
        '% METADATA: project_name' +
        'Nama Paket & : & ' + (contract_type || 'Construction') + ' \\\\' +
        '% METADATA: package_name' +
        'Nilai Kontrak & : & ' + formatIndonesianCurrency(total_value) + ' \\\\' +
        '% METADATA: total_value (format currency)' +
        '& & (' + numberToIndonesianWords(total_value) + ') \\\\' +
        '% METADATA: total_value dalam terbilang' +
        'Sumber Pembiayaan & : & ' + (funding_source || 'Tidak ditentukan') + ' \\\\' +
        '% METADATA: funding_source' +
        'Tempat Penandatanganan & : & ' + (signing_place || 'Tidak ditentukan') + ' \\\\' +
        '% METADATA: signing_place' +
        'Tanggal Penandatanganan & : & ' + formatIndonesianDate(signing_date) + ' \\\\' +
        '% METADATA: signing_date' +
        '\\end{tabular}' +
        '' +
        '% Contract Terms and Conditions' +
        '\\section*{SYARAT DAN KETENTUAN}' +
        '' +
        'Kedua belah pihak sepakat untuk mengadakan kontrak kerja konstruksi dengan syarat dan ketentuan sebagai berikut:' +
        '' +
        '% Dynamic Clauses Section' +
        '\\section*{KETENTUAN KONTRAK}' +
        '' +
        '% METADATA: Loop untuk setiap clause_template_id dalam clause_template_ids [2, 3, 4]' +
        '% Contoh untuk clause_template_id = 4:' +
        '' +
        '\\subsection*{PASAL 003 - HARGA KONTRAK, SUMBER PEMBIAYAAN DAN PEMBAYARAN}' +
        '% METADATA: clause.title dari database berdasarkan clause_template_id' +
        '' +
        '(1) Harga Kontrak termasuk Pajak Pertambahan Nilai (PPN) yang diperoleh berdasarkan total harga penawaran terkoreksi sebagaimana tercantum dalam Daftar Kuantitas dan Harga (BoQ) adalah sebesar ' + formatIndonesianCurrency(total_value) + ' (' + numberToIndonesianWords(total_value) + ') termasuk PPN 11\\%, PPh 1,5\\% dan bunga diskonto SCF.' +
        '% METADATA: Ganti nilai dengan total_value dan total_value terbilang' +
        '' +
        '(2) Harga pekerjaan dalam perjanjian ini merupakan Harga Satuan Tetap (Unit Price), dimana harga satuan yang tersebut pada daftar kuantitas pekerjaan merupakan kuantitas perkiraan.' +
        '' +
        '(3) Kontrak ini dibiayai dari ' + (funding_source || 'Tidak ditentukan') + '.' +
        '% METADATA: Ganti dengan funding_source' +
        '' +
        '(4) Pihak Pertama melakukan pembayaran uang muka maksimum 10\\% dengan counter jaminan bank garansi kepada Pihak Kedua, sebelum barang diproduksi.' +
        '' +
        '(5) Pihak Kedua dapat menagihkan biaya sebesar 50\\% dari harga produksi material yang sudah terproduksi, 25\\% dari progress distribusi, dan 25\\% setelah stressing kepada Pihak Pertama setelah dilakukan checklist bersama terhadap material yang akan diprogres dengan konsultan/owner dan dituangkan dalam berita acara.' +
        '' +
        '(6) Pembayaran untuk kontrak ini dilakukan ke rekening sebagai berikut:' +
        '' +
        'Bank: Mandiri | No. Rekening: 0060097045862 | Atas Nama: Wijaya Karya Beton' +
        '' +
        'Bank: BNI | No. Rekening: 8928860 | Atas Nama: Wijaya Karya Beton' +
        '' +
        'Bank: Artha Graha | No. Rekening: 1079837331 | Atas Nama: Wijaya Karya Beton' +
        '' +
        '\\subsection*{PASAL KEDUA - [JUDUL KLAUSUL]}' +
        '% METADATA: clause.title untuk clause_template_id[1]' +
        '' +
        '[Isi klausul akan diambil dari database berdasarkan clause\\_template\\_id kedua]' +
        '% METADATA: clause.content untuk clause_template_id[1]' +
        '' +
        '\\subsection*{PASAL KETIGA - [JUDUL KLAUSUL]}' +
        '% METADATA: clause.title untuk clause_template_id[2]' +
        '' +
        '[Isi klausul akan diambil dari database berdasarkan clause\\_template\\_id ketiga]' +
        '% METADATA: clause.content untuk clause_template_id[2]' +
        '' +
        '% Additional Standard Clauses' +
        '\\section*{KETENTUAN UMUM}' +
        '' +
        '\\subsection*{BERLAKUNYA KONTRAK}' +
        'Kontrak ini mulai berlaku sejak tanggal penandatanganan dan berakhir setelah seluruh kewajiban para pihak telah dipenuhi.' +
        '' +
        '\\subsection*{PENYELESAIAN PERSELISIHAN}' +
        'Segala perselisihan yang timbul dari pelaksanaan kontrak ini akan diselesaikan melalui musyawarah mufakat. Apabila tidak tercapai kesepakatan, maka akan diselesaikan melalui arbitrase sesuai dengan peraturan yang berlaku.' +
        '' +
        '\\subsection*{FORCE MAJEURE}' +
        'Para pihak dibebaskan dari tanggung jawab atas keterlambatan atau kegagalan pelaksanaan kontrak yang disebabkan oleh keadaan kahar (force majeure).' +
        '' +
        '% Signature Section' +
        '\\vspace{2cm}' +
        '' +
        '\\begin{center}' +
        '\\begin{tabular}{p{7cm}p{7cm}}' +
        '\\textbf{PIHAK PERTAMA} & \\textbf{PIHAK KEDUA} \\\\' +
        '\\textbf{PT ILCS PELINDO} & \\textbf{' + (contractorStakeholder?.representative_name || 'Tidak ditentukan') + '} \\\\' +
        '% METADATA: Nama perusahaan contractor & \\\\[3cm]' +
        '& \\\\[3cm]' +
        '\\rule{5cm}{0.5pt} & \\rule{5cm}{0.5pt} \\\\' +
        (institutionStakeholder?.representative_name || 'Tidak ditentukan') + ' & ' + (contractorStakeholder?.representative_name || 'Tidak ditentukan') + ' \\\\' +
        '% METADATA: representative_name Institution & representative_name Contractor' +
        (institutionStakeholder?.representative_title || 'Tidak ditentukan') + ' & ' + (contractorStakeholder?.representative_title || 'Tidak ditentukan') + ' \\\\' +
        '% METADATA: representative_title Institution & representative_title Contractor' +
        '\\end{tabular}' +
        '\\end{center}' +
        '' +
        '% Footer' +
        '\\vspace{1cm}' +
        '\\begin{center}' +
        '\\textit{Kontrak ini dibuat dalam 2 (dua) rangkap yang mempunyai kekuatan hukum yang sama}\\\\' +
        '\\textit{dan masing-masing pihak menerima 1 (satu) rangkap asli}' +
        '\\end{center}' +
        '' +
        '\\end{document}';
    };

    // Template 3: Service Agreement Template
    const generateTemplate3 = () => {
      const institutionStakeholder = stakeholders.find(s => s.role_in_contract.toLowerCase().includes('institution'));
      const contractorStakeholder = stakeholders.find(s => !s.role_in_contract.toLowerCase().includes('institution'));
      
      const fundingSubsection = funding_source ? '\\subsection{Sumber Pembiayaan}\nPerjanjian ini dibiayai dari \\textbf{' + funding_source + '}.\n' : '';
      
      const financialSection = total_value > 0 ? '% FINANCIAL TERMS\n\\section{NILAI KONTRAK DAN PEMBIAYAAN}\n\n\\subsection{Nilai Kontrak}\nNilai total perjanjian ini adalah sebesar \\textbf{' + formatIndonesianCurrency(total_value) + '} \\textbf{(' + numberToIndonesianWords(total_value) + ')}.\n\n' + fundingSubsection : '';
      
      return '\\documentclass[12pt,a4paper]{article}' +
        '\\usepackage[utf8]{inputenc}' +
        '\\usepackage[indonesian]{babel}' +
        '\\usepackage{geometry}' +
        '\\usepackage{setspace}' +
        '\\usepackage{titlesec}' +
        '\\usepackage{enumitem}' +
        '\\usepackage{fancyhdr}' +
        '\\usepackage{graphicx}' +
        '\\usepackage{amsmath}' +
        '\\usepackage{array}' +
        '\\usepackage{longtable}' +
        '\\usepackage{booktabs}' +
        '' +
        '% Page setup' +
        '\\geometry{left=3cm, right=2.5cm, top=3cm, bottom=3cm}' +
        '\\onehalfspacing' +
        '\\pagestyle{fancy}' +
        '\\fancyhf{}' +
        '\\fancyhead[C]{\\textbf{PERJANJIAN JASA}}' +
        '\\fancyfoot[C]{\\thepage}' +
        '\\renewcommand{\\headrulewidth}{0.4pt}' +
        '\\renewcommand{\\footrulewidth}{0.4pt}' +
        '' +
        '% Title formatting' +
        '\\titleformat{\\section}{\\large\\bfseries}{\\thesection.}{1em}{}' +
        '\\titleformat{\\subsection}{\\normalsize\\bfseries}{\\thesubsection.}{1em}{}' +
        '' +
        '\\begin{document}' +
        '' +
        '% HEADER SECTION' +
        '\\begin{center}' +
        '    \\textbf{\\Large PERJANJIAN JASA}\\\\' +
        '    \\vspace{0.3cm}' +
        '    \\textbf{\\large PT INDONESIA LOGISTIC CARGO SERVICES (ILCS) PELINDO}\\\\' +
        '    \\vspace{0.5cm}' +
        '    \\textbf{Nomor: ' + generateContractNumber() + '}' +
        '\\end{center}' +
        '' +
        '\\vspace{1cm}' +
        '' +
        '% METADATA SECTION' +
        'Pada hari ini, \\textbf{' + formatIndonesianDate(signing_date) + '}, bertempat di \\textbf{' + (signing_place || 'Tidak ditentukan') + '}, telah dibuat dan ditandatangani Perjanjian Jasa untuk \\textbf{' + (project_name || 'Tidak ditentukan') + '} dengan ketentuan sebagai berikut:' +
        '' +
        '\\vspace{0.5cm}' +
        '' +
        '% STAKEHOLDER INFORMATION' +
        '\\section{PARA PIHAK}' +
        '' +
        'Yang bertanda tangan di bawah ini:' +
        '' +
        '\\subsection{PIHAK PERTAMA}' +
        '\\begin{tabular}{ll}' +
        'Nama & : PT Indonesia Logistic Cargo Services (ILCS) Pelindo \\\\' +
        'Alamat & : Jl. Pelabuhan Tanjung Priok, Jakarta Utara \\\\' +
        'Dalam hal ini diwakili oleh & : \\textbf{' + (institutionStakeholder?.representative_name || 'Tidak ditentukan') + '} \\\\' +
        'Jabatan & : \\textbf{' + (institutionStakeholder?.representative_title || 'Tidak ditentukan') + '} \\\\' +
        '\\end{tabular}' +
        '' +
        'Selanjutnya disebut sebagai \\textbf{PIHAK PERTAMA}' +
        '' +
        '\\subsection{PIHAK KEDUA}' +
        '\\begin{tabular}{ll}' +
        'Nama & : [Nama Perusahaan] \\\\' +
        'Alamat & : [Alamat Perusahaan] \\\\' +
        'Dalam hal ini diwakili oleh & : \\textbf{' + (contractorStakeholder?.representative_name || 'Tidak ditentukan') + '} \\\\' +
        'Jabatan & : \\textbf{' + (contractorStakeholder?.representative_title || 'Tidak ditentukan') + '} \\\\' +
        '\\end{tabular}' +
        '' +
        'Selanjutnya disebut sebagai \\textbf{PIHAK KEDUA}' +
        '' +
        '\\vspace{0.5cm}' +
        '' +
        '% RECITALS' +
        '\\section{LATAR BELAKANG}' +
        '' +
        'Para pihak sepakat untuk mengadakan perjanjian jasa dengan latar belakang:' +
        '' +
        '\\begin{enumerate}[label=\\alph*.]' +
        '    \\item Bahwa PIHAK PERTAMA memerlukan jasa untuk pelaksanaan \\textbf{' + (project_name || 'proyek') + '};' +
        '    \\item Bahwa PIHAK KEDUA memiliki kemampuan dan keahlian untuk melaksanakan pekerjaan tersebut;' +
        '    \\item Bahwa berdasarkan hal tersebut, para pihak sepakat untuk mengikat diri dalam perjanjian ini.' +
        '\\end{enumerate}' +
        '' +
        '\\vspace{0.5cm}' +
        '' +
        '% CONTRACT CLAUSES' +
        '\\section{KETENTUAN PERJANJIAN}' +
        '' +
        generateClausesSection() +
        '' +
        financialSection +
        '' +
        '% STANDARD TERMS' +
        '\\section{KETENTUAN PENUTUP}' +
        '' +
        '\\subsection{Perubahan Perjanjian}' +
        'Perubahan terhadap perjanjian ini hanya dapat dilakukan dengan persetujuan tertulis dari kedua belah pihak.' +
        '' +
        '\\subsection{Penyelesaian Sengketa}' +
        'Segala perselisihan yang timbul dari perjanjian ini akan diselesaikan melalui musyawarah mufakat. Apabila tidak tercapai kesepakatan, maka akan diselesaikan melalui Badan Arbitrase Nasional Indonesia (BANI).' +
        '' +
        '\\subsection{Hukum yang Berlaku}' +
        'Perjanjian ini tunduk pada hukum Republik Indonesia.' +
        '' +
        '\\vspace{1cm}' +
        '' +
        '% SIGNATURE SECTION' +
        '\\section{PENUTUP}' +
        '' +
        'Demikian perjanjian ini dibuat dalam 2 (dua) rangkap asli, masing-masing mempunyai kekuatan hukum yang sama, dan ditandatangani oleh kedua belah pihak pada hari dan tanggal tersebut di atas.' +
        '' +
        '\\vspace{1cm}' +
        '' +
        '\\begin{center}' +
        '\\begin{tabular}{p{6cm}p{2cm}p{6cm}}' +
        '\\centering' +
        '\\textbf{PIHAK PERTAMA} & & \\textbf{PIHAK KEDUA} \\\\[3cm]' +
        '' +
        '\\rule{5cm}{0.5pt} & & \\rule{5cm}{0.5pt} \\\\' +
        '\\textbf{' + (institutionStakeholder?.representative_name || 'Tidak ditentukan') + '} & & \\textbf{' + (contractorStakeholder?.representative_name || 'Tidak ditentukan') + '} \\\\' +
        '\\textbf{' + (institutionStakeholder?.representative_title || 'Tidak ditentukan') + '} & & \\textbf{' + (contractorStakeholder?.representative_title || 'Tidak ditentukan') + '} \\\\' +
        '\\end{tabular}' +
        '\\end{center}' +
        '' +
        '\\vspace{1cm}' +
        '' +
        '% FOOTER NOTE' +
        '\\begin{center}' +
        '\\small' +
        '\\textit{Perjanjian ini dibuat berdasarkan Template Perjanjian Jasa ILCS Pelindo}\\\\' +
        '\\textit{Tanggal Pembuatan: ' + new Date().toLocaleDateString('id-ID') + '}' +
        '\\end{center}' +
        '' +
        '\\end{document}';
    };

    // Generate LaTeX content based on template number
    let latexContent = '';
    
    switch (templateNumber) {
      case 1:
        // Template 1: Universal ILCS Template
        return generateHTMLTemplate1(formData, formData.stakeholders);
      case 2:
        // Template 2: Construction Contract Template
        return generateHTMLTemplate2(formData, formData.stakeholders);
      case 3:
        // Template 3: Service Agreement Template
        return generateHTMLTemplate3(formData, formData.stakeholders);
      default:
        return generateHTMLTemplate1(formData, formData.stakeholders);
    }

    return latexContent;
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
        .dynamic-field { background-color: #fff3cd; padding: 2px 4px; border-radius: 3px; font-weight: bold; color: #856404; }
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
        .clause-section { background-color: #f8f9fa; padding: 1cm; margin: 1cm 0; border-left: 4px solid #007bff; }
        .clause-content { margin: 0.5cm 0; }
        .clause-content p { margin-bottom: 0.5cm; }
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
        <div class="contract-number">Nomor: <span class="dynamic-field">${contractNumber}</span></div>
    </div>

    <div class="section">
        <p>Pada hari ini, <strong><span class="dynamic-field">${indonesianDate}</span></strong>, 
        bertempat di <strong><span class="dynamic-field">${signing_place || 'Tidak ditentukan'}</span></strong>, 
        telah dibuat dan ditandatangani Perjanjian Jasa untuk 
        <strong><span class="dynamic-field">${project_name || 'Tidak ditentukan'}</span></strong> dengan ketentuan sebagai berikut:</p>
    </div>

    <div class="section">
        <div class="section-title">1. PARA PIHAK</div>
        <p>Yang bertanda tangan di bawah ini:</p>

        <div class="party-info">
            <div class="subsection-title">1.1 PIHAK PERTAMA</div>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td>PT Indonesia Logistic Cargo Services (ILCS) Pelindo</td></tr>
                <tr><td>Alamat</td><td>:</td><td>Jl. Raya Pelabuhan No. 1, Jakarta Utara</td></tr>
                <tr><td>Dalam hal ini diwakili oleh</td><td>:</td><td><strong><span class="dynamic-field">${institutionStakeholder?.representative_name || 'Tidak ditentukan'}</span></strong></td></tr>
                <tr><td>Jabatan</td><td>:</td><td><strong><span class="dynamic-field">${institutionStakeholder?.representative_title || 'Tidak ditentukan'}</span></strong></td></tr>
            </table>
            <div class="party-designation">Selanjutnya disebut sebagai <strong>"PIHAK PERTAMA"</strong></div>
        </div>

        <div class="party-info">
            <div class="subsection-title">1.2 PIHAK KEDUA</div>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td><strong><span class="dynamic-field">${contractorStakeholder?.representative_name || 'Tidak ditentukan'}</span></strong></td></tr>
                <tr><td>Alamat</td><td>:</td><td><strong><span class="dynamic-field">[Alamat Perusahaan]</span></strong></td></tr>
                <tr><td>Dalam hal ini diwakili oleh</td><td>:</td><td><strong><span class="dynamic-field">${contractorStakeholder?.representative_name || 'Tidak ditentukan'}</span></strong></td></tr>
                <tr><td>Jabatan</td><td>:</td><td><strong><span class="dynamic-field">${contractorStakeholder?.representative_title || 'Tidak ditentukan'}</span></strong></td></tr>
            </table>
            <div class="party-designation">Selanjutnya disebut sebagai <strong>"PIHAK KEDUA"</strong></div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">2. LATAR BELAKANG</div>
        <p>Para pihak sepakat untuk mengadakan perjanjian jasa dengan latar belakang:</p>
        <ol class="background-list" type="a">
            <li>Bahwa PIHAK PERTAMA memerlukan jasa untuk pelaksanaan <strong><span class="dynamic-field">${project_name || 'Tidak ditentukan'}</span></strong>;</li>
            <li>Bahwa PIHAK KEDUA memiliki kemampuan dan keahlian untuk melaksanakan pekerjaan tersebut;</li>
            <li>Bahwa berdasarkan hal tersebut, para pihak sepakat untuk mengikat diri dalam perjanjian ini.</li>
        </ol>
    </div>

    <div class="section">
        <div class="section-title">3. KETENTUAN PERJANJIAN</div>
        <div class="clause-section">
            <div class="subsection-title">3.1 HARGA KONTRAK, SUMBER PEMBIAYAAN DAN PEMBAYARAN</div>
            <div class="clause-content">
                <p><strong>(1)</strong> Harga Kontrak termasuk Pajak Pertambahan Nilai (PPN) yang diperoleh berdasarkan total harga penawaran terkoreksi sebagaimana tercantum dalam Daftar Kuantitas dan Harga (BoQ) adalah sebesar <strong><span class="dynamic-field">${indonesianCurrency}</span></strong> (<strong><span class="dynamic-field">${indonesianWords}</span></strong>) termasuk PPN 11%, PPh 1,5% dan bunga diskonto SCF.</p>
                <p><strong>(2)</strong> Harga pekerjaan dalam perjanjian ini merupakan Harga Satuan Tetap (Unit Price), dimana harga satuan yang tersebut pada daftar kuantitas pekerjaan merupakan kuantitas perkiraan.</p>
                <p><strong>(3)</strong> Kontrak ini dibiayai dari <strong><span class="dynamic-field">${funding_source || 'Tidak ditentukan'}</span></strong>.</p>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">4. KETENTUAN PENUTUP</div>
        <div class="subsection-title">4.1 Perubahan Perjanjian</div>
        <p>Perubahan terhadap perjanjian ini hanya dapat dilakukan dengan persetujuan tertulis dari kedua belah pihak.</p>
        <div class="subsection-title">4.2 Penyelesaian Sengketa</div>
        <p>Segala perselisihan yang timbul dari perjanjian ini akan diselesaikan melalui musyawarah mufakat. Apabila tidak tercapai kesepakatan, maka akan diselesaikan melalui Badan Arbitrase Nasional Indonesia (BANI).</p>
    </div>

    <div class="signature-section">
        <table class="signature-table">
            <tr><td><strong>PIHAK PERTAMA</strong></td><td><strong>PIHAK KEDUA</strong></td></tr>
            <tr><td><strong>PT ILCS PELINDO</strong></td><td><strong><span class="dynamic-field">${contractorStakeholder?.representative_name || 'Tidak ditentukan'}</span></strong></td></tr>
            <tr>
                <td><div class="signature-line"></div><strong><span class="dynamic-field">${institutionStakeholder?.representative_name || 'Tidak ditentukan'}</span></strong><br><strong><span class="dynamic-field">${institutionStakeholder?.representative_title || 'Tidak ditentukan'}</span></strong></td>
                <td><div class="signature-line"></div><strong><span class="dynamic-field">${contractorStakeholder?.representative_name || 'Tidak ditentukan'}</span></strong><br><strong><span class="dynamic-field">${contractorStakeholder?.representative_title || 'Tidak ditentukan'}</span></strong></td>
            </tr>
        </table>
    </div>

    <div class="footer-note">
        <p><em>Perjanjian ini dibuat berdasarkan Template Perjanjian Jasa ILCS Pelindo</em></p>
        <p><em>Tanggal Pembuatan: ${new Date().toLocaleString('id-ID')}</em></p>
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
    <title>Kontrak Kerja Konstruksi - PT ILCS PELINDO</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #333; max-width: 21cm; margin: 0 auto; padding: 3cm 2.5cm; background: white; }
        .header { text-align: center; margin-bottom: 2cm; padding-bottom: 1cm; border-bottom: 2px solid #333; }
        .header h1 { font-size: 18pt; font-weight: bold; margin-bottom: 0.5cm; }
        .header h2 { font-size: 14pt; font-weight: bold; margin-bottom: 0.5cm; }
        .contract-number { font-size: 12pt; font-weight: bold; color: #666; }
        .dynamic-field { background-color: #fff3cd; padding: 2px 4px; border-radius: 3px; font-weight: bold; color: #856404; }
        .section { margin: 1cm 0; }
        .section-title { font-size: 14pt; font-weight: bold; margin-bottom: 0.5cm; text-decoration: underline; }
        .subsection-title { font-size: 12pt; font-weight: bold; margin: 0.5cm 0 0.3cm 0; }
        .party-info { margin: 0.5cm 0; }
        .info-table { width: 100%; margin: 0.5cm 0; }
        .info-table td { padding: 3px 0; vertical-align: top; }
        .info-table td:first-child { width: 200px; }
        .info-table td:nth-child(2) { width: 20px; text-align: center; }
        .party-designation { font-weight: bold; margin: 0.3cm 0; }
        .clause-section { background-color: #f8f9fa; padding: 1cm; margin: 1cm 0; border-left: 4px solid #007bff; }
        .clause-content { margin: 0.5cm 0; }
        .clause-content p { margin-bottom: 0.5cm; }
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
        <div class="contract-number">Nomor: <span class="dynamic-field">${contractNumber}</span></div>
    </div>

    <div class="section">
        <p><strong>KONTRAK KERJA KONSTRUKSI</strong> ini dibuat dan ditandatangani di <strong><span class="dynamic-field">${signing_place || 'Tidak ditentukan'}</span></strong> pada hari ini, tanggal <strong><span class="dynamic-field">${indonesianDate}</span></strong>, antara:</p>
    </div>

    <div class="section">
        <div class="section-title">1. PARA PIHAK</div>
        <p>Yang bertanda tangan di bawah ini:</p>

        <div class="party-info">
            <div class="subsection-title">1.1 PIHAK PERTAMA</div>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td>PT ILCS PELINDO</td></tr>
                <tr><td>Alamat</td><td>:</td><td>Jl. Raya Pelabuhan No. 1, Jakarta Utara</td></tr>
                <tr><td>Diwakili oleh</td><td>:</td><td><strong><span class="dynamic-field">${institutionStakeholder?.representative_name || 'Tidak ditentukan'}</span></strong></td></tr>
                <tr><td>Jabatan</td><td>:</td><td><strong><span class="dynamic-field">${institutionStakeholder?.representative_title || 'Tidak ditentukan'}</span></strong></td></tr>
            </table>
            <div class="party-designation">Selanjutnya disebut sebagai <strong>"PENGGUNA JASA"</strong></div>
        </div>

        <div class="party-info">
            <div class="subsection-title">1.2 PIHAK KEDUA</div>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td><strong><span class="dynamic-field">${contractorStakeholder?.representative_name || 'Tidak ditentukan'}</span></strong></td></tr>
                <tr><td>Alamat</td><td>:</td><td><strong><span class="dynamic-field">[Alamat Perusahaan]</span></strong></td></tr>
                <tr><td>Diwakili oleh</td><td>:</td><td><strong><span class="dynamic-field">${contractorStakeholder?.representative_name || 'Tidak ditentukan'}</span></strong></td></tr>
                <tr><td>Jabatan</td><td>:</td><td><strong><span class="dynamic-field">${contractorStakeholder?.representative_title || 'Tidak ditentukan'}</span></strong></td></tr>
                <tr><td>Nomor Izin</td><td>:</td><td><strong><span class="dynamic-field">CONST-2024-001</span></strong></td></tr>
            </table>
            <div class="party-designation">Selanjutnya disebut sebagai <strong>"PENYEDIA JASA"</strong></div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">2. INFORMASI KONTRAK</div>
        <table class="info-table">
            <tr><td>Jenis Kontrak</td><td>:</td><td><span class="dynamic-field">${contract_type || 'Tidak ditentukan'}</span></td></tr>
            <tr><td>Nama Proyek</td><td>:</td><td><span class="dynamic-field">${project_name || 'Tidak ditentukan'}</span></td></tr>
            <tr><td>Nilai Kontrak</td><td>:</td><td><span class="dynamic-field">${indonesianCurrency}</span></td></tr>
            <tr><td></td><td></td><td><span class="dynamic-field">(${indonesianWords})</span></td></tr>
            <tr><td>Sumber Pembiayaan</td><td>:</td><td><span class="dynamic-field">${funding_source || 'Tidak ditentukan'}</span></td></tr>
            <tr><td>Tempat Penandatanganan</td><td>:</td><td><span class="dynamic-field">${signing_place || 'Tidak ditentukan'}</span></td></tr>
            <tr><td>Tanggal Penandatanganan</td><td>:</td><td><span class="dynamic-field">${indonesianDate}</span></td></tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">3. SYARAT DAN KETENTUAN</div>
        <p>Kedua belah pihak sepakat untuk mengadakan kontrak kerja konstruksi dengan syarat dan ketentuan sebagai berikut:</p>
    </div>

    <div class="section">
        <div class="section-title">4. KETENTUAN KONTRAK</div>
        <div class="clause-section">
            <div class="subsection-title">4.1 PASAL 003 - HARGA KONTRAK, SUMBER PEMBIAYAAN DAN PEMBAYARAN</div>
            <div class="clause-content">
                <p><strong>(1)</strong> Harga Kontrak termasuk Pajak Pertambahan Nilai (PPN) yang diperoleh berdasarkan total harga penawaran terkoreksi sebagaimana tercantum dalam Daftar Kuantitas dan Harga (BoQ) adalah sebesar <strong><span class="dynamic-field">${indonesianCurrency}</span></strong> (<strong><span class="dynamic-field">${indonesianWords}</span></strong>) termasuk PPN 11%, PPh 1,5% dan bunga diskonto SCF.</p>
                <p><strong>(2)</strong> Harga pekerjaan dalam perjanjian ini merupakan Harga Satuan Tetap (Unit Price), dimana harga satuan yang tersebut pada daftar kuantitas pekerjaan merupakan kuantitas perkiraan.</p>
                <p><strong>(3)</strong> Kontrak ini dibiayai dari <strong><span class="dynamic-field">${funding_source || 'Tidak ditentukan'}</span></strong>.</p>
                <p><strong>(4)</strong> Pihak Pertama melakukan pembayaran uang muka maksimum 10% dengan counter jaminan bank garansi kepada Pihak Kedua, sebelum barang diproduksi.</p>
                <p><strong>(5)</strong> Pihak Kedua dapat menagihkan biaya sebesar 50% dari harga produksi material yang sudah terproduksi, 25% dari progress distribusi, dan 25% setelah stressing kepada Pihak Pertama setelah dilakukan checklist bersama terhadap material yang akan diprogres dengan konsultan/owner dan dituangkan dalam berita acara.</p>
                <p><strong>(6)</strong> Pembayaran untuk kontrak ini dilakukan ke rekening sebagai berikut:</p>
                <ul>
                    <li><strong>Bank:</strong> Mandiri | <strong>No. Rekening:</strong> 0060097045862 | <strong>Atas Nama:</strong> Wijaya Karya Beton</li>
                    <li><strong>Bank:</strong> BNI | <strong>No. Rekening:</strong> 8928860 | <strong>Atas Nama:</strong> Wijaya Karya Beton</li>
                    <li><strong>Bank:</strong> Artha Graha | <strong>No. Rekening:</strong> 1079837331 | <strong>Atas Nama:</strong> Wijaya Karya Beton</li>
                </ul>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">5. KETENTUAN UMUM</div>
        <div class="subsection-title">5.1 BERLAKUNYA KONTRAK</div>
        <p>Kontrak ini mulai berlaku sejak tanggal penandatanganan dan berakhir setelah seluruh kewajiban para pihak telah dipenuhi.</p>
        <div class="subsection-title">5.2 PENYELESAIAN PERSELISIHAN</div>
        <p>Segala perselisihan yang timbul dari pelaksanaan kontrak ini akan diselesaikan melalui musyawarah mufakat. Apabila tidak tercapai kesepakatan, maka akan diselesaikan melalui arbitrase sesuai dengan peraturan yang berlaku.</p>
        <div class="subsection-title">5.3 FORCE MAJEURE</div>
        <p>Para pihak dibebaskan dari tanggung jawab atas keterlambatan atau kegagalan pelaksanaan kontrak yang disebabkan oleh keadaan kahar (force majeure).</p>
    </div>

    <div class="signature-section">
        <table class="signature-table">
            <tr><td><strong>PIHAK PERTAMA</strong></td><td><strong>PIHAK KEDUA</strong></td></tr>
            <tr><td><strong>PT ILCS PELINDO</strong></td><td><strong><span class="dynamic-field">${contractorStakeholder?.representative_name || 'Tidak ditentukan'}</span></strong></td></tr>
            <tr>
                <td><div class="signature-line"></div><strong><span class="dynamic-field">${institutionStakeholder?.representative_name || 'Tidak ditentukan'}</span></strong><br><strong><span class="dynamic-field">${institutionStakeholder?.representative_title || 'Tidak ditentukan'}</span></strong></td>
                <td><div class="signature-line"></div><strong><span class="dynamic-field">${contractorStakeholder?.representative_name || 'Tidak ditentukan'}</span></strong><br><strong><span class="dynamic-field">${contractorStakeholder?.representative_title || 'Tidak ditentukan'}</span></strong></td>
            </tr>
        </table>
    </div>

    <div class="footer-note">
        <p><em>Kontrak ini dibuat dalam 2 (dua) rangkap yang mempunyai kekuatan hukum yang sama</em></p>
        <p><em>dan masing-masing pihak menerima 1 (satu) rangkap asli</em></p>
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
        .page-header { position: fixed; top: 1cm; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; padding: 0.5cm 2.5cm; border-bottom: 1px solid #ddd; background: white; z-index: 1000; }
        .header-logo { font-weight: bold; color: #0066cc; font-size: 14pt; }
        .header-company { font-weight: bold; font-size: 14pt; }
        .page-footer { position: fixed; bottom: 1cm; left: 0; right: 0; text-align: center; border-top: 1px solid #ddd; padding-top: 0.5cm; background: white; z-index: 1000; }
        .content { margin-top: 4cm; margin-bottom: 3cm; }
        .document-title { text-align: center; margin-bottom: 2cm; }
        .document-title h1 { font-size: 18pt; font-weight: bold; margin: 0 0 0.5cm 0; }
        .document-title .contract-number { font-size: 14pt; font-weight: bold; margin-bottom: 0.5cm; }
        .document-title .project-name { font-size: 14pt; font-weight: bold; margin-bottom: 0.3cm; }
        .document-title .package-name { font-size: 14pt; font-weight: bold; margin-bottom: 1cm; }
        .dynamic { font-weight: bold; color: #0066cc; background-color: #f0f8ff; padding: 0.1cm 0.2cm; border-radius: 2px; }
        .party-info { margin: 1cm 0; }
        .info-table { width: 100%; border-collapse: collapse; margin: 0.3cm 0; }
        .info-table td { padding: 0.2cm; vertical-align: top; }
        .info-table td:first-child { width: 3cm; font-weight: bold; }
        .info-table td:nth-child(2) { width: 1cm; text-align: center; }
        .section-header { font-size: 14pt; font-weight: bold; margin: 1.5cm 0 1cm 0; text-align: center; border-bottom: 1px solid #333; padding-bottom: 0.3cm; }
        .subsection-header { font-size: 12pt; font-weight: bold; margin: 1cm 0 0.5cm 0; }
        .contract-clause { margin: 1cm 0; }
        .clause-content { text-align: justify; margin-bottom: 0.5cm; }
        .clause-content p { margin: 0.3cm 0; }
        .signature-section { margin-top: 2cm; text-align: center; }
        .signature-table { width: 100%; margin: 1cm auto; }
        .signature-table td { text-align: center; padding: 1cm; vertical-align: top; }
        .signature-line { border-bottom: 0.5pt solid black; width: 5cm; height: 3cm; display: inline-block; margin-bottom: 0.3cm; }
        .footer-note { text-align: center; font-style: italic; margin-top: 2cm; font-size: 11pt; }
        .margin-top-1 { margin-top: 1cm; }
        @media print { .page-header, .page-footer { position: running(); } .dynamic { color: black; background-color: transparent; } }
    </style>
</head>
<body>
    <div class="page-header">
        <div class="header-logo">LOGO PELINDO</div>
        <div class="header-company">PT ILCS PELINDO</div>
    </div>
    
    <div class="page-footer">
        <span id="page-number">1</span>
    </div>
    
    <div class="content">
        <div class="document-title">
            <h1>KONTRAK KERJA KONSTRUKSI</h1>
            <div class="contract-number">NOMOR: <span class="dynamic">${contractNumber}</span></div>
            <div class="project-name"><span class="dynamic">${project_name || 'Tidak ditentukan'}</span></div>
            <div class="package-name"><span class="dynamic">${contract_type || 'Construction'}</span></div>
        </div>
        
        <div class="contract-intro">
            <p><strong>KONTRAK KERJA KONSTRUKSI</strong> ini dibuat dan ditandatangani di <strong><span class="dynamic">${signing_place || 'Tidak ditentukan'}</span></strong> pada hari ini, tanggal <strong><span class="dynamic">${indonesianDate}</span></strong>, antara:</p>
        </div>
        
        <div class="party-info">
            <p><strong>PIHAK PERTAMA:</strong></p>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td>PT ILCS PELINDO</td></tr>
                <tr><td>Alamat</td><td>:</td><td>Jl. Raya Pelabuhan No. 1, Jakarta Utara</td></tr>
                <tr><td>Diwakili oleh</td><td>:</td><td><span class="dynamic">${institutionStakeholder?.representative_name || 'Tidak ditentukan'}</span></td></tr>
                <tr><td>Jabatan</td><td>:</td><td><span class="dynamic">${institutionStakeholder?.representative_title || 'Tidak ditentukan'}</span></td></tr>
            </table>
            <p>Selanjutnya disebut sebagai <strong>"PENGGUNA JASA"</strong></p>
        </div>
        
        <div class="party-info">
            <p><strong>PIHAK KEDUA:</strong></p>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td><span class="dynamic">${contractorStakeholder?.representative_name || 'Tidak ditentukan'}</span></td></tr>
                <tr><td>Alamat</td><td>:</td><td><span class="dynamic">[Alamat Perusahaan]</span></td></tr>
                <tr><td>Diwakili oleh</td><td>:</td><td><span class="dynamic">${contractorStakeholder?.representative_name || 'Tidak ditentukan'}</span></td></tr>
                <tr><td>Jabatan</td><td>:</td><td><span class="dynamic">${contractorStakeholder?.representative_title || 'Tidak ditentukan'}</span></td></tr>
                <tr><td>Nomor Izin</td><td>:</td><td><span class="dynamic">CONST-2024-001</span></td></tr>
            </table>
            <p>Selanjutnya disebut sebagai <strong>"PENYEDIA JASA"</strong></p>
        </div>
        
        <div class="section-header">INFORMASI KONTRAK</div>
        <table class="info-table">
            <tr><td>Jenis Kontrak</td><td>:</td><td><span class="dynamic">${contract_type || 'Tidak ditentukan'}</span></td></tr>
            <tr><td>Nama Proyek</td><td>:</td><td><span class="dynamic">${project_name || 'Tidak ditentukan'}</span></td></tr>
            <tr><td>Nama Paket</td><td>:</td><td><span class="dynamic">${contract_type || 'Construction'}</span></td></tr>
            <tr><td>Nilai Kontrak</td><td>:</td><td><span class="dynamic">${indonesianCurrency}</span></td></tr>
            <tr><td></td><td></td><td><span class="dynamic">(${indonesianWords})</span></td></tr>
            <tr><td>Sumber Pembiayaan</td><td>:</td><td><span class="dynamic">${funding_source || 'Tidak ditentukan'}</span></td></tr>
            <tr><td>Tempat Penandatanganan</td><td>:</td><td><span class="dynamic">${signing_place || 'Tidak ditentukan'}</span></td></tr>
            <tr><td>Tanggal Penandatanganan</td><td>:</td><td><span class="dynamic">${indonesianDate}</span></td></tr>
        </table>
        
        <div class="section-header">SYARAT DAN KETENTUAN</div>
        <p>Kedua belah pihak sepakat untuk mengadakan kontrak kerja konstruksi dengan syarat dan ketentuan sebagai berikut:</p>
        
        <div class="section-header">KETENTUAN KONTRAK</div>
        <div class="contract-clause">
            <div class="subsection-header">PASAL 003 - HARGA KONTRAK, SUMBER PEMBIAYAAN DAN PEMBAYARAN</div>
            <div class="clause-content">
                <p>(1) Harga Kontrak termasuk Pajak Pertambahan Nilai (PPN) yang diperoleh berdasarkan total harga penawaran terkoreksi sebagaimana tercantum dalam Daftar Kuantitas dan Harga (BoQ) adalah sebesar <span class="dynamic">${indonesianCurrency}</span> <span class="dynamic">(${indonesianWords})</span> termasuk PPN 11%, PPh 1,5% dan bunga diskonto SCF.</p>
                <p>(2) Harga pekerjaan dalam perjanjian ini merupakan Harga Satuan Tetap (Unit Price), dimana harga satuan yang tersebut pada daftar kuantitas pekerjaan merupakan kuantitas perkiraan.</p>
                <p>(3) Kontrak ini dibiayai dari <span class="dynamic">${funding_source || 'Tidak ditentukan'}</span>.</p>
                <p>(4) Pihak Pertama melakukan pembayaran uang muka maksimum 10% dengan counter jaminan bank garansi kepada Pihak Kedua, sebelum barang diproduksi.</p>
                <p>(5) Pihak Kedua dapat menagihkan biaya sebesar 50% dari harga produksi material yang sudah terproduksi, 25% dari progress distribusi, dan 25% setelah stressing kepada Pihak Pertama setelah dilakukan checklist bersama terhadap material yang akan diprogres dengan konsultan/owner dan dituangkan dalam berita acara.</p>
                <p>(6) Pembayaran untuk kontrak ini dilakukan ke rekening sebagai berikut:</p>
                <p><strong>Bank:</strong> Mandiri | <strong>No. Rekening:</strong> 0060097045862 | <strong>Atas Nama:</strong> Wijaya Karya Beton</p>
                <p><strong>Bank:</strong> BNI | <strong>No. Rekening:</strong> 8928860 | <strong>Atas Nama:</strong> Wijaya Karya Beton</p>
                <p><strong>Bank:</strong> Artha Graha | <strong>No. Rekening:</strong> 1079837331 | <strong>Atas Nama:</strong> Wijaya Karya Beton</p>
            </div>
        </div>
        
        <div class="contract-clause">
            <div class="subsection-header">PASAL KEDUA - <span class="dynamic">[JUDUL KLAUSUL]</span></div>
            <div class="clause-content">
                <p><span class="dynamic">[Isi klausul akan diambil dari database berdasarkan clause_template_id kedua]</span></p>
            </div>
        </div>
        
        <div class="contract-clause">
            <div class="subsection-header">PASAL KETIGA - <span class="dynamic">[JUDUL KLAUSUL]</span></div>
            <div class="clause-content">
                <p><span class="dynamic">[Isi klausul akan diambil dari database berdasarkan clause_template_id ketiga]</span></p>
            </div>
        </div>
        
        <div class="section-header">KETENTUAN UMUM</div>
        <div class="contract-clause">
            <div class="subsection-header">BERLAKUNYA KONTRAK</div>
            <div class="clause-content">
                <p>Kontrak ini mulai berlaku sejak tanggal penandatanganan dan berakhir setelah seluruh kewajiban para pihak telah dipenuhi.</p>
            </div>
        </div>
        
        <div class="contract-clause">
            <div class="subsection-header">PENYELESAIAN PERSELISIHAN</div>
            <div class="clause-content">
                <p>Segala perselisihan yang timbul dari pelaksanaan kontrak ini akan diselesaikan melalui musyawarah mufakat. Apabila tidak tercapai kesepakatan, maka akan diselesaikan melalui arbitrase sesuai dengan peraturan yang berlaku.</p>
            </div>
        </div>
        
        <div class="contract-clause">
            <div class="subsection-header">FORCE MAJEURE</div>
            <div class="clause-content">
                <p>Para pihak dibebaskan dari tanggung jawab atas keterlambatan atau kegagalan pelaksanaan kontrak yang disebabkan oleh keadaan kahar (force majeure).</p>
            </div>
        </div>
        
        <div class="signature-section margin-top-1">
            <table class="signature-table">
                <tr><td><strong>PIHAK PERTAMA</strong></td><td><strong>PIHAK KEDUA</strong></td></tr>
                <tr><td><strong>PT ILCS PELINDO</strong></td><td><strong><span class="dynamic">${contractorStakeholder?.representative_name || 'Tidak ditentukan'}</span></strong></td></tr>
                <tr><td><div class="signature-line"></div></td><td><div class="signature-line"></div></td></tr>
                <tr><td><span class="dynamic">${institutionStakeholder?.representative_name || 'Tidak ditentukan'}</span></td><td><span class="dynamic">${contractorStakeholder?.representative_name || 'Tidak ditentukan'}</span></td></tr>
                <tr><td><span class="dynamic">${institutionStakeholder?.representative_title || 'Tidak ditentukan'}</span></td><td><span class="dynamic">${contractorStakeholder?.representative_title || 'Tidak ditentukan'}</span></td></tr>
            </table>
        </div>
        
        <div class="footer-note margin-top-1">
            <em>Kontrak ini dibuat dalam 2 (dua) rangkap yang mempunyai kekuatan hukum yang sama</em><br>
            <em>dan masing-masing pihak menerima 1 (satu) rangkap asli</em>
        </div>
    </div>
</body>
</html>`;
  };

  // Generate contract content based on template (fallback for non-LaTeX)
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
      
      // Get contract ID from response
      const contractId = response.data.id;
      const clauseTemplateIds = contractData.clause_template_ids;
      
      // Call AI analyze API
      try {
        console.log('🤖 Starting AI clause analysis...');
        const aiResponse = await aiApi.analyzeClauses(contractId, clauseTemplateIds);
        console.log('🤖 AI analysis completed:', aiResponse);
      } catch (aiError) {
        console.error('⚠️ AI analysis failed (contract still created):', aiError);
        // Don't fail the entire process if AI analysis fails
      }
      
      setError(null);
      
      // Show success message
      alert('Contract created successfully! AI analysis has been initiated.');
      
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
                <div className="border rounded-lg p-4 bg-gray-50 max-h-[90vh] overflow-y-auto">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {previews[currentPreviewIndex]?.name}
                  </h3>
                  <div className="bg-white rounded border">
                    <iframe
                      srcDoc={previews[currentPreviewIndex]?.content || ''}
                      className="w-full h-[85vh] border-0"
                      title="Contract Preview"
                    />
                  </div>
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
