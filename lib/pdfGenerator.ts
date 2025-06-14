import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ContractData {
  id: string;
  title: string;
  description?: string;
  status: string;
  type: string;
  value?: number;
  startDate?: string;
  endDate?: string;
  otherPartyName?: string;
  otherPartyEmail?: string;
  createdAt: string;
  createdBy: {
    name?: string;
    email: string;
  };
  company?: {
    name: string;
  };
}

export const generateContractPDF = async (contract: ContractData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Sayfa kenar boşlukları
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let currentY = margin;

  // Header - Şirket bilgileri
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CONTRAVO', margin, currentY);
  currentY += 10;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Sözleşme Yönetim Sistemi', margin, currentY);
  currentY += 15;

  // Çizgi
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // Sözleşme Başlığı
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  const title = contract.title || 'Başlıksız Sözleşme';
  pdf.text(title, margin, currentY);
  currentY += 15;

  // Sözleşme Bilgileri
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');

  // ID ve Durum
  pdf.text(`Sözleşme ID: ${contract.id}`, margin, currentY);
  currentY += 7;

  const statusText = getStatusText(contract.status);
  pdf.text(`Durum: ${statusText}`, margin, currentY);
  currentY += 7;

  const typeText = getTypeText(contract.type);
  pdf.text(`Tür: ${typeText}`, margin, currentY);
  currentY += 7;

  if (contract.value) {
    pdf.text(`Değer: ${contract.value.toLocaleString('tr-TR')} TL`, margin, currentY);
    currentY += 7;
  }

  if (contract.startDate) {
    pdf.text(`Başlangıç Tarihi: ${new Date(contract.startDate).toLocaleDateString('tr-TR')}`, margin, currentY);
    currentY += 7;
  }

  if (contract.endDate) {
    pdf.text(`Bitiş Tarihi: ${new Date(contract.endDate).toLocaleDateString('tr-TR')}`, margin, currentY);
    currentY += 7;
  }

  currentY += 10;

  // Taraflar
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Taraflar', margin, currentY);
  currentY += 10;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');

  // Birinci Taraf (Sözleşme Sahibi)
  pdf.text('Birinci Taraf:', margin, currentY);
  currentY += 7;
  pdf.text(`• İsim: ${contract.createdBy.name || 'Belirtilmemiş'}`, margin + 5, currentY);
  currentY += 7;
  pdf.text(`• E-posta: ${contract.createdBy.email}`, margin + 5, currentY);
  currentY += 10;

  // İkinci Taraf
  pdf.text('İkinci Taraf:', margin, currentY);
  currentY += 7;
  pdf.text(`• İsim: ${contract.otherPartyName || 'Belirtilmemiş'}`, margin + 5, currentY);
  currentY += 7;
  if (contract.otherPartyEmail) {
    pdf.text(`• E-posta: ${contract.otherPartyEmail}`, margin + 5, currentY);
    currentY += 7;
  }
  currentY += 10;

  // Açıklama
  if (contract.description) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Açıklama', margin, currentY);
    currentY += 10;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    // Uzun metinleri böl
    const lines = pdf.splitTextToSize(contract.description, contentWidth);
    pdf.text(lines, margin, currentY);
    currentY += lines.length * 7 + 10;
  }

  // Footer
  const footerY = pageHeight - 30;
  pdf.line(margin, footerY, pageWidth - margin, footerY);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Oluşturulma Tarihi: ${new Date(contract.createdAt).toLocaleDateString('tr-TR')}`, margin, footerY + 10);
  pdf.text(`PDF Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}`, margin, footerY + 17);
  
  // Sayfa numarası
  pdf.text('Sayfa 1/1', pageWidth - margin - 20, footerY + 10);

  return pdf;
};

export const downloadContractPDF = async (contract: ContractData) => {
  const pdf = await generateContractPDF(contract);
  const fileName = `${contract.title.replace(/[^a-zA-Z0-9]/g, '_')}_${contract.id}.pdf`;
  pdf.save(fileName);
};

// HTML elementini PDF'e çevirme (gelişmiş layout için)
export const generatePDFFromElement = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element bulunamadı');
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    width: element.scrollWidth,
    height: element.scrollHeight
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
  const scaledWidth = imgWidth * ratio;
  const scaledHeight = imgHeight * ratio;
  
  // Sayfayı ortala
  const x = (pdfWidth - scaledWidth) / 2;
  const y = (pdfHeight - scaledHeight) / 2;
  
  pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
  pdf.save(filename);
};

// Helper fonksiyonlar
function getStatusText(status: string): string {
  switch (status) {
    case 'SIGNED': return 'İmzalandı';
    case 'IN_REVIEW': return 'İncelemede';
    case 'APPROVED': return 'Onaylandı';
    case 'REJECTED': return 'Reddedildi';
    case 'DRAFT': return 'Taslak';
    case 'ARCHIVED': return 'Arşivlendi';
    default: return status;
  }
}

function getTypeText(type: string): string {
  switch (type) {
    case 'general': return 'Genel Sözleşme';
    case 'procurement': return 'Tedarik Sözleşmesi';
    case 'service': return 'Hizmet Sözleşmesi';
    case 'sales': return 'Satış Sözleşmesi';
    case 'employment': return 'İş Sözleşmesi';
    case 'partnership': return 'Ortaklık Sözleşmesi';
    case 'nda': return 'Gizlilik Sözleşmesi (NDA)';
    case 'rental': return 'Kira Sözleşmesi';
    default: return type;
  }
} 