import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PdfExportOptions {
  fileName?: string;
  format?: 'a4' | '80mm' | '58mm' | 'thermal';
  quality?: number;
}

export interface PdfExportResult {
  success: boolean;
  error?: string;
  fileName?: string;
}

/**
 * Exports an HTML element as a real, downloadable PDF file.
 * Accurately fits 80mm thermal receipts with exact auto-height (no extra blank space or second blank pages),
 * and standard ISO A4 invoices with clean multi-page support.
 */
export async function exportElementToPdf(
  elementOrId: string | HTMLElement,
  options: PdfExportOptions = {}
): Promise<PdfExportResult> {
  const {
    fileName = 'Document.pdf',
    format = '80mm',
    quality = 2,
  } = options;

  const targetElement =
    typeof elementOrId === 'string'
      ? document.getElementById(elementOrId)
      : elementOrId;

  if (!targetElement) {
    const errorMsg = 'Printable element not found in DOM.';
    console.error(errorMsg, elementOrId);
    return { success: false, error: errorMsg };
  }

  try {
    // 1. Ensure all images inside targetElement have loaded before capturing
    const images = Array.from(targetElement.querySelectorAll('img'));
    if (images.length > 0) {
      await Promise.all(
        images.map(async (img) => {
          if (img.complete) return;
          try {
            await img.decode();
          } catch {
            // Ignore decode failures on broken images
          }
        })
      );
    }

    // 2. High-DPI canvas capture using html2canvas
    const canvas = await html2canvas(targetElement, {
      scale: quality,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        // Reveal shop letterhead for report PDF exports
        const printHeader = clonedDoc.querySelector('.print-report-header');
        if (printHeader) {
          (printHeader as HTMLElement).style.display = 'block';
        }

        // Find the cloned element in the cloned document
        const clonedTarget =
          (targetElement.id ? clonedDoc.getElementById(targetElement.id) : null) ||
          clonedDoc.querySelector('.thermal-receipt-container, .a4-invoice-container, [data-printable-report]');

        if (clonedTarget) {
          const el = clonedTarget as HTMLElement;
          // Strip screen shadows, borders and rounding for clean PDF rendering
          el.style.boxShadow = 'none';
          el.style.border = 'none';
          el.style.borderRadius = '0';
          el.style.margin = '0 auto';

          if (format === '80mm' || format === 'thermal' || format === '58mm') {
            const is58mm = format === '58mm';
            el.style.width = is58mm ? '219px' : '302px';
            el.style.maxWidth = is58mm ? '219px' : '302px';
            el.style.height = 'auto';
            el.style.minHeight = '0';
          }
        }
      },
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas render produced empty output.');
    }

    const imgData = canvas.toDataURL('image/png', 1.0);
    const finalFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

    // 3. Handle 80mm and 58mm Thermal Receipt Formats
    if (format === '80mm' || format === 'thermal' || format === '58mm') {
      const is58mm = format === '58mm';
      const pdfWidthMm = is58mm ? 58 : 80;

      // Exact content-based height without arbitrary minimum heights or excessive white space
      const rawHeightMm = (canvas.height * pdfWidthMm) / canvas.width;
      const pdfHeightMm = Math.max(Math.ceil(rawHeightMm), 20); // Round up to cover full content without overflow

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidthMm, pdfHeightMm],
        compress: true,
      });

      // Add image to cover exact content height
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidthMm, rawHeightMm, undefined, 'FAST');

      // Guarantee strictly ONE page for thermal receipt rolls (delete any auto-added trailing blank page)
      while (pdf.getNumberOfPages() > 1) {
        pdf.deletePage(pdf.getNumberOfPages());
      }

      pdf.save(finalFileName);

      return { success: true, fileName: finalFileName };
    }

    // 4. Handle Standard ISO A4 Format (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidthMm = 210;
    const pageHeightMm = 297;
    const marginMm = 8;
    const printWidthMm = pageWidthMm - marginMm * 2;
    const printHeightMm = (canvas.height * printWidthMm) / canvas.width;

    if (printHeightMm <= pageHeightMm - marginMm * 2) {
      // Fits on a single A4 page
      pdf.addImage(imgData, 'PNG', marginMm, marginMm, printWidthMm, printHeightMm, undefined, 'FAST');
    } else {
      // Natural multi-page handling for long documents & invoices
      let heightLeft = printHeightMm;
      let position = marginMm;

      pdf.addImage(imgData, 'PNG', marginMm, position, printWidthMm, printHeightMm, undefined, 'FAST');
      heightLeft -= (pageHeightMm - marginMm * 2);

      while (heightLeft > 0) {
        position = marginMm - (printHeightMm - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', marginMm, position, printWidthMm, printHeightMm, undefined, 'FAST');
        heightLeft -= (pageHeightMm - marginMm * 2);
      }
    }

    pdf.save(finalFileName);

    return { success: true, fileName: finalFileName };
  } catch (error: any) {
    const errorMsg = error?.message || 'Unable to generate PDF document.';
    console.error('Failed to generate PDF:', error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Reliable client-side PDF generation utility using jsPDF and html2canvas.
 * Generates a valid PDF from the given element (default: 'printable-receipt-area'),
 * respecting the currently selected A4 or 80mm format and using the invoice number for the filename.
 */
export async function generatePDF(
  elementOrId: string | HTMLElement = 'printable-receipt-area',
  options: {
    format?: 'a4' | '80mm' | '58mm' | 'thermal';
    fileName?: string;
    invoiceNumber?: string;
    quality?: number;
  } = {}
): Promise<PdfExportResult> {
  const cleanFormat = options.format === 'a4' ? 'a4' : '80mm';
  const fileName =
    options.fileName ||
    (options.invoiceNumber
      ? `Invoice-${options.invoiceNumber}${cleanFormat !== 'a4' ? `-${cleanFormat}` : ''}.pdf`
      : `Document-${cleanFormat}.pdf`);

  return exportElementToPdf(elementOrId, {
    fileName,
    format: cleanFormat,
    quality: options.quality || 2,
  });
}

/**
 * Dedicated function to generate a valid PDF from the 'printable-receipt-area' element,
 * respecting the currently selected A4 or 80mm format and using the invoice number for the filename.
 */
export async function generateInvoicePdf(
  invoiceNumber: string,
  format: 'a4' | '80mm' | '58mm' | 'thermal' = '80mm',
  elementOrId: string | HTMLElement = 'printable-receipt-area',
  quality = 2
): Promise<PdfExportResult> {
  const cleanFormat = format === 'a4' ? 'a4' : '80mm';
  const fileName = `Invoice-${invoiceNumber}${cleanFormat !== 'a4' ? `-${cleanFormat}` : ''}.pdf`;

  return exportElementToPdf(elementOrId, {
    fileName,
    format: cleanFormat,
    quality,
  });
}

/**
 * Dedicated function to generate valid PDFs for each separate report feature tab
 * (e.g. Profit & Loss, Sales, Purchases, Stock Valuation, Receivables, Expenses).
 */
export async function generateReportPdf(
  elementOrId: string | HTMLElement,
  reportTitle: string,
  period = 'current_period',
  quality = 2
): Promise<PdfExportResult> {
  const cleanTitle = reportTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const cleanPeriod = period.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `${cleanTitle}_report_${cleanPeriod}_${dateStr}.pdf`;

  return exportElementToPdf(elementOrId, {
    fileName,
    format: 'a4',
    quality,
  });
}

/**
 * Dedicated function to generate valid PDFs for Customer and Supplier Ledgers.
 */
export async function generateLedgerPdf(
  elementOrId: string | HTMLElement,
  partyName: string,
  partyType: 'customer' | 'supplier' = 'customer',
  quality = 2
): Promise<PdfExportResult> {
  const cleanName = partyName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `${partyType}_ledger_${cleanName}_${dateStr}.pdf`;

  return exportElementToPdf(elementOrId, {
    fileName,
    format: 'a4',
    quality,
  });
}
