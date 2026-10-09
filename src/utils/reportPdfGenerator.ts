import jsPDF from 'jspdf';
import { exportElementToPdf, PdfExportResult } from '../utils/pdfExport';
import { formatCurrency, formatDate } from '../utils/formatters';

export interface FinancialReportData {
  shopName: string;
  tagline?: string;
  address?: string;
  phone?: string;
  currency?: string;
  periodLabel: string;
  generatedDate?: string;
  metrics: {
    mobileRevenue: number;
    accessoryRevenue: number;
    totalRevenue: number;
    cogs: number;
    grossProfit: number;
    grossMarginPercent: number;
    operatingExpenses: number;
    netProfit: number;
    netMarginPercent: number;
  };
  breakdowns?: {
    category: string;
    amount: number;
    percentage?: number;
  }[];
}

export interface InventoryReportData {
  shopName: string;
  currency?: string;
  periodLabel?: string;
  totalDevices: number;
  totalDeviceValuation: number;
  totalAccessories: number;
  totalAccessoryValuation: number;
  totalInventoryValuation: number;
  mobiles: {
    brand: string;
    model: string;
    ram: string;
    storage: string;
    imei1: string;
    condition: string;
    cost: number;
    salePrice: number;
    status: string;
  }[];
}

/**
 * Generates a professionally styled PDF for Financial / Profit & Loss Statement
 * using clean vector typography and tabular layout via jsPDF.
 */
export function generateProfessionalFinancialPdf(data: FinancialReportData): PdfExportResult {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const curr = data.currency || 'Rs.';
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = 18;

    // Header Band
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, y, contentWidth, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(data.shopName, margin + 6, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(data.tagline || 'Mobile Point of Sale & Inventory System', margin + 6, y + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(52, 211, 153); // emerald-400
    doc.text('FINANCIAL STATEMENT', pageWidth - margin - 6, y + 9, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Period: ${data.periodLabel}`, pageWidth - margin - 6, y + 16, { align: 'right' });

    y += 30;

    // Subheader / Metadata
    doc.setTextColor(71, 85, 105); // slate-600
    doc.setFontSize(8);
    doc.text(`Generated: ${data.generatedDate || new Date().toLocaleString()}`, margin, y);
    if (data.phone) {
      doc.text(`Contact: ${data.phone}`, pageWidth - margin, y, { align: 'right' });
    }

    y += 8;

    // KPI Summary Cards
    const cardWidth = (contentWidth - 6) / 3;
    const cardHeight = 18;

    // Card 1: Gross Revenue
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL REVENUE', margin + 4, y + 6);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(data.metrics.totalRevenue, curr), margin + 4, y + 13);

    // Card 2: Operating Expenses
    const card2X = margin + cardWidth + 3;
    doc.roundedRect(card2X, y, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('OPERATING EXPENSES', card2X + 4, y + 6);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text(formatCurrency(data.metrics.operatingExpenses, curr), card2X + 4, y + 13);

    // Card 3: Net Profit
    const card3X = card2X + cardWidth + 3;
    const isNetPositive = data.metrics.netProfit >= 0;
    doc.setFillColor(isNetPositive ? 236 : 254, isNetPositive ? 253 : 242, isNetPositive ? 245 : 242);
    doc.setDrawColor(isNetPositive ? 167 : 254, isNetPositive ? 243 : 202, isNetPositive ? 208 : 202);
    doc.roundedRect(card3X, y, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(isNetPositive ? 5 : 159, isNetPositive ? 150 : 18, isNetPositive ? 105 : 57);
    doc.text('NET PROFIT / (LOSS)', card3X + 4, y + 6);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(data.metrics.netProfit, curr), card3X + 4, y + 13);

    y += 24;

    // Statement Table Header
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text('STATEMENT LINE ITEM', margin + 4, y + 5);
    doc.text('AMOUNT', pageWidth - margin - 4, y + 5, { align: 'right' });

    y += 9;

    // Line items
    const rows: { label: string; amount: number; bold?: boolean; isHighlight?: boolean }[] = [
      { label: 'Mobile Handset Sales Revenue', amount: data.metrics.mobileRevenue },
      { label: 'Accessories & Spare Parts Sales Revenue', amount: data.metrics.accessoryRevenue },
      { label: 'Total Gross Revenue', amount: data.metrics.totalRevenue, bold: true },
      { label: 'Less: Cost of Goods Sold (COGS)', amount: -data.metrics.cogs },
      { label: `Gross Profit (Margin: ${data.metrics.grossMarginPercent.toFixed(1)}%)`, amount: data.metrics.grossProfit, bold: true, isHighlight: true },
      { label: 'Less: Operating Expenses (Rent, Utilities, Salaries)', amount: -data.metrics.operatingExpenses },
      { label: `Net Profit Before Tax (Margin: ${data.metrics.netMarginPercent.toFixed(1)}%)`, amount: data.metrics.netProfit, bold: true, isHighlight: true },
    ];

    rows.forEach((row) => {
      if (row.isHighlight) {
        doc.setFillColor(row.amount >= 0 ? 240 : 254, row.amount >= 0 ? 253 : 242, row.amount >= 0 ? 244 : 242);
        doc.rect(margin, y - 4, contentWidth, 7, 'F');
      }

      doc.setFont('helvetica', row.bold ? 'bold' : 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(row.isHighlight ? (row.amount >= 0 ? 6 : 159) : 30, row.isHighlight ? (row.amount >= 0 ? 95 : 18) : 41, row.isHighlight ? (row.amount >= 0 ? 70 : 57) : 59);
      doc.text(row.label, margin + 4, y);

      const sign = row.amount < 0 ? '-' : '';
      const absAmount = Math.abs(row.amount);
      doc.text(`${sign}${formatCurrency(absAmount, curr)}`, pageWidth - margin - 4, y, { align: 'right' });

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 2, pageWidth - margin, y + 2);

      y += 8;
    });

    // Footer
    y = 280;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('MobiFlow Software · Generated Computer Statement · Verified Audit Report', margin, y + 5);
    doc.text('Page 1 of 1', pageWidth - margin, y + 5, { align: 'right' });

    const fileName = `Financial_Report_${data.periodLabel.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    return { success: true, fileName };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to generate financial PDF.';
    return { success: false, error: errorMsg };
  }
}

/**
 * Generates a professionally formatted Stock & Inventory Valuation PDF
 */
export function generateProfessionalInventoryPdf(data: InventoryReportData): PdfExportResult {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const curr = data.currency || 'Rs.';
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = 16;

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, contentWidth, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(data.shopName, margin + 6, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Comprehensive Stock Valuation & In-Stock Handset Audit', margin + 6, y + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(52, 211, 153);
    doc.text(`TOTAL VALUATION: ${formatCurrency(data.totalInventoryValuation, curr)}`, pageWidth - margin - 6, y + 8, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Active Devices: ${data.totalDevices} | Accessories: ${data.totalAccessories}`, pageWidth - margin - 6, y + 14, { align: 'right' });

    y += 26;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    const cols = [
      { header: '#', x: margin + 3 },
      { header: 'DEVICE & MODEL', x: margin + 12 },
      { header: 'SPECS (RAM/ROM)', x: margin + 70 },
      { header: 'IMEI 1 NUMBER', x: margin + 115 },
      { header: 'CONDITION', x: margin + 160 },
      { header: 'PURCHASE COST', x: margin + 195, align: 'right' },
      { header: 'TARGET SALE', x: margin + 235, align: 'right' },
      { header: 'STATUS', x: pageWidth - margin - 4, align: 'right' },
    ];

    cols.forEach((col) => {
      doc.text(col.header, col.x, y + 4.5, { align: (col.align as 'right') || 'left' });
    });

    y += 8;

    // Rows
    const maxItemsPerPage = 22;
    data.mobiles.slice(0, 50).forEach((mob, idx) => {
      if (y > 185) {
        doc.addPage();
        y = 16;
        // Repeat table header on new page
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, contentWidth, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        cols.forEach((col) => {
          doc.text(col.header, col.x, y + 4.5, { align: (col.align as 'right') || 'left' });
        });
        y += 8;
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);

      doc.text(String(idx + 1), cols[0].x, y);
      doc.setFont('helvetica', 'bold');
      doc.text(`${mob.brand} ${mob.model}`, cols[1].x, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`${mob.ram}/${mob.storage}`, cols[2].x, y);
      doc.text(mob.imei1, cols[3].x, y);
      doc.text(mob.condition, cols[4].x, y);
      doc.text(formatCurrency(mob.cost, curr), cols[5].x, y, { align: 'right' });
      doc.setTextColor(16, 185, 129);
      doc.text(formatCurrency(mob.salePrice, curr), cols[6].x, y, { align: 'right' });
      doc.setTextColor(51, 65, 85);
      doc.text(mob.status, cols[7].x, y, { align: 'right' });

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 6;
    });

    const fileName = `Inventory_Stock_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    return { success: true, fileName };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to generate inventory PDF.';
    return { success: false, error: errorMsg };
  }
}

/**
 * Universal PDF downloader dispatcher for reports module
 */
export async function downloadReportAsPdf(
  elementOrId: string | HTMLElement,
  reportType: 'financial' | 'inventory' | 'sales' | 'purchases' | 'expenses' | 'receivables' | 'pnl' | 'stock',
  options: {
    title?: string;
    period?: string;
    financialData?: FinancialReportData;
    inventoryData?: InventoryReportData;
  } = {}
): Promise<PdfExportResult> {
  // If structured data is provided, use the high-fidelity native vector PDF builder
  if ((reportType === 'financial' || reportType === 'pnl') && options.financialData) {
    return generateProfessionalFinancialPdf(options.financialData);
  }

  if ((reportType === 'inventory' || reportType === 'stock') && options.inventoryData) {
    return generateProfessionalInventoryPdf(options.inventoryData);
  }

  // Otherwise, use html2canvas + jsPDF to capture the rendered audit report layout
  const cleanTitle = (options.title || reportType)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const cleanPeriod = (options.period || 'current')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `${cleanTitle}_report_${cleanPeriod}_${dateStr}.pdf`;

  return exportElementToPdf(elementOrId, {
    fileName,
    format: 'a4',
    quality: 2,
  });
}
