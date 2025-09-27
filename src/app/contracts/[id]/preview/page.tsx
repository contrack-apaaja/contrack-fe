"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { contractsApi, Contract } from "@/services/api";
import { Loader2, FileText, Calendar, Banknote, MapPin, Building2, Users, Scale, ChevronLeft, ChevronRight, Download, Printer } from "lucide-react";

interface ContractPreview {
  id: number;
  name: string;
  content: string;
}

export default function ContractPreviewPage() {
  const params = useParams();
  const contractId = params.id as string;
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Template carousel state
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
  const [templates, setTemplates] = useState<ContractPreview[]>([]);
  const [isGeneratingTemplates, setIsGeneratingTemplates] = useState(false);

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
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
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

  // Utility functions for template generation
  const generateContractNumber = (contract_type: string, signing_date: string) => {
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

  // Generate HTML content for templates
  const generateHTMLContent = (templateNumber: number = 1) => {
    if (!contract) return '';
    
    const formData = {
      project_name: contract.project_name,
      contract_type: contract.contract_type,
      signing_place: contract.signing_place || '',
      signing_date: contract.signing_date || '',
      total_value: contract.total_value,
      funding_source: contract.funding_source || '',
      stakeholders: contract.stakeholders || []
    };

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
    const institutionStakeholder = stakeholders[0] || null;
    const contractorStakeholder = stakeholders[1] || null;
    
    const { project_name, contract_type, signing_place, signing_date, total_value, funding_source } = formData;
    
    const contractNumber = generateContractNumber(contract_type || '', signing_date || '');
    const indonesianDate = formatIndonesianDate(signing_date || '');
    const indonesianCurrency = formatIndonesianCurrency(total_value || 0);
    const indonesianWords = numberToIndonesianWords(total_value || 0);
    
    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kontrak ${contract_type}</title>
    <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.6; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .contract-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .contract-number { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
        .section { margin: 20px 0; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .subsection { margin: 15px 0; }
        .subsection-title { font-size: 16px; font-weight: bold; margin-bottom: 8px; }
        .stakeholder-info { margin: 10px 0; }
        .financial-info { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .signature-section { margin-top: 40px; }
        .signature-line { border-bottom: 1px solid #000; width: 200px; margin: 20px 0; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="contract-title">KONTRAK ${contract_type.toUpperCase()}</div>
        <div class="contract-number">Nomor: ${contractNumber}</div>
    </div>

    <div class="section">
        <p>Pada hari ini, <strong>${indonesianDate}</strong>, bertempat di <strong>${signing_place || 'Tidak ditentukan'}</strong>, telah dibuat dan ditandatangani <strong>${contract_type}</strong> untuk <strong>${project_name}</strong> dengan ketentuan sebagai berikut:</p>
    </div>

    <div class="section">
        <div class="section-title">PARA PIHAK</div>
        <p>Yang bertanda tangan di bawah ini:</p>
        
        ${institutionStakeholder ? `
        <div class="subsection">
            <div class="subsection-title">PIHAK PERTAMA</div>
            <div class="stakeholder-info">
                <p><strong>Nama:</strong> ${institutionStakeholder.stakeholder?.legal_name || 'PT ILCS Pelindo'}</p>
                <p><strong>Alamat:</strong> ${institutionStakeholder.stakeholder?.address || 'Tidak ditentukan'}</p>
                <p><strong>Dalam hal ini diwakili oleh:</strong> ${institutionStakeholder.representative_name || 'Tidak ditentukan'}</p>
                <p><strong>Jabatan:</strong> ${institutionStakeholder.representative_title || 'Tidak ditentukan'}</p>
            </div>
            <p>Selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong></p>
        </div>
        ` : ''}
        
        ${contractorStakeholder ? `
        <div class="subsection">
            <div class="subsection-title">PIHAK KEDUA</div>
            <div class="stakeholder-info">
                <p><strong>Nama:</strong> ${contractorStakeholder.stakeholder?.legal_name || 'Tidak ditentukan'}</p>
                <p><strong>Alamat:</strong> ${contractorStakeholder.stakeholder?.address || 'Tidak ditentukan'}</p>
                <p><strong>Peran dalam Kontrak:</strong> ${contractorStakeholder.role_in_contract || 'Tidak ditentukan'}</p>
                <p><strong>Dalam hal ini diwakili oleh:</strong> ${contractorStakeholder.representative_name || 'Tidak ditentukan'}</p>
                <p><strong>Jabatan:</strong> ${contractorStakeholder.representative_title || 'Tidak ditentukan'}</p>
            </div>
            <p>Selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong></p>
        </div>
        ` : ''}
    </div>

    <div class="section">
        <div class="section-title">LATAR BELAKANG</div>
        <p>Para pihak sepakat untuk mengadakan <strong>${contract_type}</strong> dengan latar belakang:</p>
        <ol>
            <li>Bahwa PIHAK PERTAMA memerlukan layanan untuk pelaksanaan <strong>${project_name}</strong>;</li>
            <li>Bahwa PIHAK KEDUA memiliki kemampuan, keahlian, dan sumber daya yang diperlukan untuk melaksanakan pekerjaan tersebut;</li>
            <li>Bahwa para pihak telah menyepakati syarat dan ketentuan yang akan mengatur hubungan hukum dalam <strong>${contract_type}</strong> ini;</li>
            <li>Bahwa berdasarkan hal tersebut, para pihak sepakat untuk mengikat diri dalam kontrak ini.</li>
        </ol>
    </div>

    ${total_value > 0 ? `
    <div class="section">
        <div class="section-title">KETENTUAN KEUANGAN</div>
        <div class="financial-info">
            <div class="subsection">
                <div class="subsection-title">Nilai Kontrak</div>
                <p>Nilai kontrak ini adalah sebesar <strong>${indonesianCurrency}</strong> <strong>(${indonesianWords})</strong>.</p>
            </div>
            ${funding_source ? `
            <div class="subsection">
                <div class="subsection-title">Sumber Pembiayaan</div>
                <p>Kontrak ini dibiayai dari <strong>${funding_source}</strong>.</p>
            </div>
            ` : ''}
        </div>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">KETENTUAN UMUM</div>
        <div class="subsection">
            <div class="subsection-title">Jangka Waktu</div>
            <p>Jangka waktu pelaksanaan kontrak ini akan ditentukan sesuai dengan ketentuan yang tercantum dalam klausul-klausul di atas.</p>
        </div>
        <div class="subsection">
            <div class="subsection-title">Perubahan Kontrak</div>
            <p>Perubahan terhadap kontrak ini hanya dapat dilakukan dengan persetujuan tertulis dari seluruh pihak yang terlibat dan dibuat dalam bentuk addendum.</p>
        </div>
        <div class="subsection">
            <div class="subsection-title">Force Majeure</div>
            <p>Para pihak dibebaskan dari tanggung jawab atas keterlambatan atau kegagalan dalam memenuhi kewajiban yang disebabkan oleh keadaan kahar (force majeure) yang berada di luar kendali para pihak.</p>
        </div>
        <div class="subsection">
            <div class="subsection-title">Kerahasiaan</div>
            <p>Para pihak sepakat untuk menjaga kerahasiaan informasi yang berkaitan dengan pelaksanaan kontrak ini dan tidak akan membocorkannya kepada pihak ketiga tanpa persetujuan tertulis.</p>
        </div>
        <div class="subsection">
            <div class="subsection-title">Penyelesaian Sengketa</div>
            <p>Segala perselisihan yang timbul dari kontrak ini akan diselesaikan melalui:</p>
            <ol>
                <li>Musyawarah untuk mufakat;</li>
                <li>Mediasi, jika musyawarah tidak berhasil;</li>
                <li>Arbitrase atau pengadilan negeri, jika mediasi tidak berhasil.</li>
            </ol>
        </div>
        <div class="subsection">
            <div class="subsection-title">Hukum yang Berlaku</div>
            <p>Kontrak ini tunduk pada dan ditafsirkan berdasarkan hukum Republik Indonesia.</p>
        </div>
    </div>

    <div class="signature-section">
        <div class="section-title">PENUTUP</div>
        <p>Demikian <strong>${contract_type}</strong> ini dibuat dalam ${stakeholders.length} rangkap asli, masing-masing mempunyai kekuatan hukum yang sama, dan ditandatangani oleh para pihak pada hari dan tanggal tersebut di atas.</p>
        
        <div style="display: flex; justify-content: space-between; margin-top: 40px;">
            <div style="text-align: center;">
                <div class="signature-line"></div>
                <p><strong>PIHAK PERTAMA</strong></p>
                <p>${institutionStakeholder?.representative_name || 'Tidak ditentukan'}</p>
                <p>${institutionStakeholder?.representative_title || 'Tidak ditentukan'}</p>
            </div>
            <div style="text-align: center;">
                <div class="signature-line"></div>
                <p><strong>PIHAK KEDUA</strong></p>
                <p>${contractorStakeholder?.representative_name || 'Tidak ditentukan'}</p>
                <p>${contractorStakeholder?.representative_title || 'Tidak ditentukan'}</p>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Kontrak ini dibuat berdasarkan Template Universal ILCS Pelindo</p>
        <p>Jenis Kontrak: ${contract_type} | Tanggal Pembuatan: ${new Date().toLocaleDateString('id-ID')}</p>
        <p>Stakeholder Count: ${stakeholders.length}</p>
    </div>
</body>
</html>`;
  };

  // HTML Template 2: Construction Contract Template - Exact copy from create contract page
  const generateHTMLTemplate2 = (formData: any, stakeholders: any[]) => {
    // Use first stakeholder as primary, second as secondary
    const institutionStakeholder = stakeholders[0] || null;
    const contractorStakeholder = stakeholders[1] || null;
    
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
        .section { margin: 1cm 0; }
        .section-title { font-size: 14pt; font-weight: bold; margin-bottom: 0.5cm; text-decoration: underline; }
        .subsection-title { font-size: 12pt; font-weight: bold; margin: 0.5cm 0 0.3cm 0; }
        .party-info { margin: 0.5cm 0; }
        .info-table { width: 100%; margin: 0.5cm 0; }
        .info-table td { padding: 3px 0; vertical-align: top; }
        .info-table td:first-child { width: 200px; }
        .info-table td:nth-child(2) { width: 20px; text-align: center; }
        .party-designation { font-weight: bold; margin: 0.3cm 0; }
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
        <div class="section-title">3. SYARAT DAN KETENTUAN</div>
        <p>Kedua belah pihak sepakat untuk mengadakan kontrak kerja konstruksi dengan syarat dan ketentuan sebagai berikut:</p>
    </div>

    <div class="section">
        <div class="section-title">4. KETENTUAN KONTRAK</div>
        <div>
            <div class="subsection-title">4.1 PASAL 003 - HARGA KONTRAK, SUMBER PEMBIAYAAN DAN PEMBAYARAN</div>
            <div>
                <p><strong>(1)</strong> Harga Kontrak termasuk Pajak Pertambahan Nilai (PPN) yang diperoleh berdasarkan total harga penawaran terkoreksi sebagaimana tercantum dalam Daftar Kuantitas dan Harga (BoQ) adalah sebesar <strong><span>${indonesianCurrency}</span></strong> (<strong><span>${indonesianWords}</span></strong>) termasuk PPN 11%, PPh 1,5% dan bunga diskonto SCF.</p>
                <p><strong>(2)</strong> Harga pekerjaan dalam perjanjian ini merupakan Harga Satuan Tetap (Unit Price), dimana harga satuan yang tersebut pada daftar kuantitas pekerjaan merupakan kuantitas perkiraan.</p>
                <p><strong>(3)</strong> Kontrak ini dibiayai dari <strong><span>${funding_source || 'PT ILCS Pelindo'}</span></strong>.</p>
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
            <tr><td><strong>PT ILCS PELINDO</strong></td><td><strong><span>${contractorStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></strong></td></tr>
            <tr>
                <td><div class="signature-line"></div><strong><span>${institutionStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></strong><br><strong><span>${institutionStakeholder?.representative_title || 'PT ILCS Pelindo'}</span></strong></td>
                <td><div class="signature-line"></div><strong><span>${contractorStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></strong><br><strong><span>${contractorStakeholder?.representative_title || 'PT ILCS Pelindo'}</span></strong></td>
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

  // HTML Template 3: Advanced Construction Contract Template - Exact copy from create contract page
  const generateHTMLTemplate3 = (formData: any, stakeholders: any[]) => {
    // Use first stakeholder as primary, second as secondary
    const institutionStakeholder = stakeholders[0] || null;
    const contractorStakeholder = stakeholders[1] || null;
    
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
            <div class="contract-number">NOMOR: <span class="dynamic">${contractNumber}</span></div>
            <div class="project-name"><span class="dynamic">${project_name || 'PT ILCS Pelindo'}</span></div>
            <div class="package-name"><span class="dynamic">${contract_type || 'Construction'}</span></div>
        </div>
        
        <div class="contract-intro">
            <p><strong>KONTRAK KERJA KONSTRUKSI</strong> ini dibuat dan ditandatangani di <strong><span class="dynamic">${signing_place || 'PT ILCS Pelindo'}</span></strong> pada hari ini, tanggal <strong><span class="dynamic">${indonesianDate}</span></strong>, antara:</p>
        </div>
        
        <div class="party-info">
            <p><strong>PIHAK PERTAMA:</strong></p>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td>PT ILCS PELINDO</td></tr>
                <tr><td>Alamat</td><td>:</td><td>Jl. Raya Pelabuhan No. 1, Jakarta Utara</td></tr>
                <tr><td>Diwakili oleh</td><td>:</td><td><span class="dynamic">${institutionStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></td></tr>
                <tr><td>Jabatan</td><td>:</td><td><span class="dynamic">${institutionStakeholder?.representative_title || 'PT ILCS Pelindo'}</span></td></tr>
            </table>
            <p>Selanjutnya disebut sebagai <strong>"PENGGUNA JASA"</strong></p>
        </div>
        
        <div class="party-info">
            <p><strong>PIHAK KEDUA:</strong></p>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td><span class="dynamic">${contractorStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></td></tr>
                <tr><td>Alamat</td><td>:</td><td><span class="dynamic">[Alamat Perusahaan]</span></td></tr>
                <tr><td>Diwakili oleh</td><td>:</td><td><span class="dynamic">${contractorStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></td></tr>
                <tr><td>Jabatan</td><td>:</td><td><span class="dynamic">${contractorStakeholder?.representative_title || 'PT ILCS Pelindo'}</span></td></tr>
                <tr><td>Nomor Izin</td><td>:</td><td><span class="dynamic">CONST-2024-001</span></td></tr>
            </table>
            <p>Selanjutnya disebut sebagai <strong>"PENYEDIA JASA"</strong></p>
        </div>
        
        <div class="section-header">INFORMASI KONTRAK</div>
        <table class="info-table">
            <tr><td>Jenis Kontrak</td><td>:</td><td><span class="dynamic">${contract_type || 'PT ILCS Pelindo'}</span></td></tr>
            <tr><td>Nama Proyek</td><td>:</td><td><span class="dynamic">${project_name || 'PT ILCS Pelindo'}</span></td></tr>
            <tr><td>Nama Paket</td><td>:</td><td><span class="dynamic">${contract_type || 'Construction'}</span></td></tr>
            <tr><td>Nilai Kontrak</td><td>:</td><td><span class="dynamic">${indonesianCurrency}</span></td></tr>
            <tr><td></td><td></td><td><span class="dynamic">(${indonesianWords})</span></td></tr>
            <tr><td>Sumber Pembiayaan</td><td>:</td><td><span class="dynamic">${funding_source || 'PT ILCS Pelindo'}</span></td></tr>
            <tr><td>Tempat Penandatanganan</td><td>:</td><td><span class="dynamic">${signing_place || 'PT ILCS Pelindo'}</span></td></tr>
            <tr><td>Tanggal Penandatanganan</td><td>:</td><td><span class="dynamic">${indonesianDate}</span></td></tr>
        </table>
        
        <div class="section-header">SYARAT DAN KETENTUAN</div>
        <p>Kedua belah pihak sepakat untuk mengadakan kontrak kerja konstruksi dengan syarat dan ketentuan sebagai berikut:</p>
        
        <div class="section-header">KETENTUAN KONTRAK</div>
        <div class="contract-clause">
            <div class="subsection-header">PASAL 003 - HARGA KONTRAK, SUMBER PEMBIAYAAN DAN PEMBAYARAN</div>
            <div>
                <p>(1) Harga Kontrak termasuk Pajak Pertambahan Nilai (PPN) yang diperoleh berdasarkan total harga penawaran terkoreksi sebagaimana tercantum dalam Daftar Kuantitas dan Harga (BoQ) adalah sebesar <span class="dynamic">${indonesianCurrency}</span> <span class="dynamic">(${indonesianWords})</span> termasuk PPN 11%, PPh 1,5% dan bunga diskonto SCF.</p>
                <p>(2) Harga pekerjaan dalam perjanjian ini merupakan Harga Satuan Tetap (Unit Price), dimana harga satuan yang tersebut pada daftar kuantitas pekerjaan merupakan kuantitas perkiraan.</p>
                <p>(3) Kontrak ini dibiayai dari <span class="dynamic">${funding_source || 'PT ILCS Pelindo'}</span>.</p>
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
        
        <div class="section-header">KETENTUAN UMUM</div>
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
        
        <div class="signature-section margin-top-1">
            <table class="signature-table">
                <tr><td><strong>PIHAK PERTAMA</strong></td><td><strong>PIHAK KEDUA</strong></td></tr>
                <tr><td><strong>PT ILCS PELINDO</strong></td><td><strong><span class="dynamic">${contractorStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></strong></td></tr>
                <tr><td><div class="signature-line"></div></td><td><div class="signature-line"></div></td></tr>
                <tr><td><span class="dynamic">${institutionStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></td><td><span class="dynamic">${contractorStakeholder?.representative_name || 'PT ILCS Pelindo'}</span></td></tr>
                <tr><td><span class="dynamic">${institutionStakeholder?.representative_title || 'PT ILCS Pelindo'}</span></td><td><span class="dynamic">${contractorStakeholder?.representative_title || 'PT ILCS Pelindo'}</span></td></tr>
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

  // Generate templates when contract is loaded
  useEffect(() => {
    if (contract) {
      setIsGeneratingTemplates(true);
      try {
        const generatedTemplates: ContractPreview[] = [
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
        setTemplates(generatedTemplates);
      } catch (error) {
        console.error('Error generating templates:', error);
      } finally {
        setIsGeneratingTemplates(false);
      }
    }
  }, [contract]);

  // Navigate preview carousel - matching create contract page
  const prevPreview = () => {
    setCurrentTemplateIndex((prev) => (prev - 1 + templates.length) % templates.length);
  };

  const nextPreview = () => {
    setCurrentTemplateIndex((prev) => (prev + 1) % templates.length);
  };

  // Handle download as PDF
  const handleDownloadPDF = () => {
    if (templates.length > 0) {
      const currentTemplate = templates[currentTemplateIndex];
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Contract - ${currentTemplate.name}</title>
            <style>
              @media print {
                @page { margin: 0.5in; }
                body { -webkit-print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            ${currentTemplate.content}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  // Close the window after printing
                  setTimeout(function() {
                    window.close();
                  }, 1000);
                }, 500);
              };
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
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
            </div>
          </div>
        </div>
      </div>

      {/* Contract Content */}
      <div className="max-w-6xl mx-auto p-6">
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
                  <Banknote className="h-5 w-5 text-gray-500 mt-0.5" />
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

        {/* Contract Preview Carousel - Matching Create Contract Page */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Contract Preview</h2>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
          </div>

          {isGeneratingTemplates ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
              <span className="text-gray-600">Generating templates...</span>
            </div>
          ) : templates.length > 0 ? (
            <div className="space-y-4">
              {/* Preview Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={prevPreview}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={templates.length <= 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                
                <span className="text-sm text-gray-600">
                  {currentTemplateIndex + 1} of {templates.length}
                </span>
                
                <button
                  onClick={nextPreview}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={templates.length <= 1}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>

              {/* Preview Content */}
              <div className="border rounded-lg p-4 bg-gray-50 max-h-[90vh] overflow-y-auto">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {templates[currentTemplateIndex]?.name}
                </h3>
                <div className="bg-white rounded border">
                  <iframe
                    srcDoc={templates[currentTemplateIndex]?.content || ''}
                    className="w-full h-[85vh] border-0"
                    title="Contract Preview"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No templates available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}