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

  let yPosition = 14;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  const footer = (page: number) => {
    pdf.setFontSize(8);
    pdf.setTextColor(130);
    pdf.text(`Page ${page}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
    pdf.setTextColor(0);
  };
  let pageNumber = 1;

  const drawPageTop = (includeHeaderBand: boolean) => {
    if (includeHeaderBand) {
      pdf.setFillColor(14, 23, 38);
      pdf.rect(0, 0, pageWidth, 28, 'F');
    }
  };

  const addNewPage = () => {
    footer(pageNumber);
    pdf.addPage();
    pageNumber += 1;
    yPosition = 20;
  };

  drawPageTop(true);

  // Add Title
  if (title) {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255);
    pdf.text(title, margin, yPosition);
    pdf.setTextColor(0);
    yPosition += 7;
  }

  // Add Subtitle
  if (subtitle) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(215);
    pdf.text(subtitle, margin, yPosition);
    yPosition = 34;
    pdf.setTextColor(0);
  } else {
    yPosition = 30;
  }

  // Add Charts
  for (const { ref, title: chartTitle } of chartRefs) {
    try {
      const canvas = await html2canvas(ref, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (doc: Document) => {
          const body = doc.body;
          if (body) {
            body.style.background = '#ffffff';
          }
        },
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const chartTitleHeight = chartTitle ? 8 : 0;

      if (yPosition + chartTitleHeight + imgHeight > pageHeight - 20) {
        addNewPage();
      }

      if (chartTitle) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(32);
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
      addNewPage();
    }

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(236, 240, 246);

    // Table header
    const colWidth = contentWidth / headers.length;
    const baseRowHeight = 7;
    headers.forEach((header, idx) => {
      pdf.setFillColor(236, 240, 246);
      pdf.rect(margin + idx * colWidth, yPosition - 5, colWidth, baseRowHeight, 'F');
      pdf.setDrawColor(210, 216, 224);
      pdf.rect(margin + idx * colWidth, yPosition - 5, colWidth, baseRowHeight, 'S');
      pdf.setTextColor(25, 31, 45);
      pdf.text(header, margin + idx * colWidth + 2, yPosition, { maxWidth: colWidth - 4 });
    });

    yPosition += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(45);

    // Table rows
    data.forEach((row, rowIndex) => {
      const rowCellLines = headers.map((header) => {
        const cellValue = String(row[header] ?? '');
        return pdf.splitTextToSize(cellValue, colWidth - 4).slice(0, 3);
      });
      const maxLines = Math.max(1, ...rowCellLines.map((lines) => lines.length));
      const rowHeight = Math.max(baseRowHeight, maxLines * 4 + 2);

      if (yPosition + rowHeight > pageHeight - 15) {
        addNewPage();

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        headers.forEach((header, idx) => {
          pdf.setFillColor(236, 240, 246);
          pdf.rect(margin + idx * colWidth, yPosition - 5, colWidth, baseRowHeight, 'F');
          pdf.setDrawColor(210, 216, 224);
          pdf.rect(margin + idx * colWidth, yPosition - 5, colWidth, baseRowHeight, 'S');
          pdf.setTextColor(25, 31, 45);
          pdf.text(header, margin + idx * colWidth + 2, yPosition, { maxWidth: colWidth - 4 });
        });
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(45);
      }

      if (rowIndex % 2 === 1) {
        pdf.setFillColor(250, 251, 253);
        pdf.rect(margin, yPosition - 5, contentWidth, rowHeight, 'F');
      }

      headers.forEach((_header, idx) => {
        const lines = rowCellLines[idx];
        pdf.text(lines, margin + idx * colWidth + 2, yPosition, {
          maxWidth: colWidth - 4,
        });
        pdf.setDrawColor(228, 232, 237);
        pdf.rect(margin + idx * colWidth, yPosition - 5, colWidth, rowHeight, 'S');
      });

      yPosition += rowHeight;
    });
  }

  footer(pageNumber);

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
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return `${currency} ${formatted}`;
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
