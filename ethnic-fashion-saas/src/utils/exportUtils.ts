import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

export interface ExportOptions {
  filename: string;
  title?: string;
  subtitle?: string;
}

// CSV Export Helper
export const exportToCSV = (
  data: Array<Record<string, any>>,
  headers: string[],
  filename: string
) => {
  if (data.length === 0) return;

  const csvEscape = (value: string | number | null | undefined) => {
    const text = String(value ?? '');
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const csvRows = [
    headers.map(csvEscape).join(','),
    ...data.map((row) => headers.map((h) => csvEscape(row[h])).join(',')),
  ];

  const csv = csvRows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `${filename}.csv`);
};

// Excel Export Helper
export const exportToExcel = (
  sheets: Array<{ name: string; data: Array<Record<string, any>>; headers?: string[] }>,
  filename: string
) => {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ name, data, headers }) => {
    if (data.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    if (headers) {
      // Reorder columns based on headers
      const reorderedData = data.map((row) => {
        const reordered: Record<string, any> = {};
        headers.forEach((h) => {
          reordered[h] = row[h];
        });
        return reordered;
      });
      XLSX.utils.sheet_add_json(worksheet, reorderedData, { origin: 0 });
    }

    // Auto-adjust column widths
    const colWidths: number[] = [];
    Object.keys(data[0] || {}).forEach((key, idx) => {
      const maxLength = Math.max(
        key.length,
        ...data.map((row) => String(row[key] ?? '').length)
      );
      colWidths[idx] = Math.min(maxLength + 2, 50);
    });
    worksheet['!cols'] = colWidths.map((w) => ({ wch: w }));

    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  });

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// PDF Export Helper with Charts
export const exportToPDF = async (
  options: ExportOptions & {
    data?: Array<Record<string, any>>;
    headers?: string[];
    chartRefs?: Array<{ ref: HTMLElement; title: string }>;
  }
) => {
  const { filename, title, subtitle, data = [], headers = [], chartRefs = [] } = options;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let yPosition = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // Add Title
  if (title) {
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin, yPosition);
    yPosition += 10;
  }

  // Add Subtitle
  if (subtitle) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100);
    pdf.text(subtitle, margin, yPosition);
    yPosition += 8;
    pdf.setTextColor(0);
  }

  // Add Charts
  for (const { ref, title: chartTitle } of chartRefs) {
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = 20;
    }

    try {
      const canvas = await html2canvas(ref, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (chartTitle) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(chartTitle, margin, yPosition);
        yPosition += 8;
      }

      pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 10;
    } catch (error) {
      console.error('Failed to capture chart:', error);
    }
  }

  // Add Table Data
  if (data.length > 0 && headers.length > 0) {
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(230, 230, 230);

    // Table header
    const colWidth = contentWidth / headers.length;
    headers.forEach((header, idx) => {
      pdf.rect(margin + idx * colWidth, yPosition - 5, colWidth, 7, 'F');
      pdf.text(header, margin + idx * colWidth + 1, yPosition, { maxWidth: colWidth - 2 });
    });

    yPosition += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    // Table rows
    data.forEach((row) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }

      headers.forEach((header, idx) => {
        const cellValue = String(row[header] ?? '');
        pdf.text(cellValue, margin + idx * colWidth + 1, yPosition, {
          maxWidth: colWidth - 2,
        });
      });

      yPosition += 7;
    });
  }

  pdf.save(`${filename}.pdf`);
};

// Generic File Download Helper
export const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Format currency for display
export const formatCurrencyForExport = (value: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(value);
};

// Format date for display
export const formatDateForExport = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
