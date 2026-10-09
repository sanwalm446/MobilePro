import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Coins,
  Receipt,
  Smartphone,
  Headphones,
  Users,
  Truck,
  Layers,
  Printer,
  FileText,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ShopLogo } from '../common/ShopLogo';
import { generateReportPdf } from '../../utils/pdfExport';
import {
  downloadReportAsPdf,
  generateProfessionalFinancialPdf,
  generateProfessionalInventoryPdf,
} from '../../utils/reportPdfGenerator';

type DateFilterOption = 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'This Year' | 'All Time' | 'Custom';

export const ReportsView: React.FC = () => {
  const {
    sales,
    purchases,
    expenses,
    accessories,
    accessorySales,
    mobiles,
    customers,
    suppliers,
    settings,
  } = useShop();

  const [dateFilter, setDateFilter] = useState<DateFilterOption>('This Month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeReportTab, setActiveReportTab] = useState<
    'pnl' | 'sales' | 'purchases' | 'stock' | 'receivables' | 'expenses'
  >('pnl');

  // Determine date bounds
  const { start, end } = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (dateFilter === 'Today') {
      return { start: todayStr, end: todayStr };
    }

    if (dateFilter === 'Yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      return { start: yStr, end: yStr };
    }

    if (dateFilter === 'This Week') {
      const w = new Date();
      w.setDate(w.getDate() - 7);
      return { start: w.toISOString().split('T')[0], end: todayStr };
    }

    if (dateFilter === 'This Month') {
      const m = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: m.toISOString().split('T')[0], end: todayStr };
    }

    if (dateFilter === 'This Year') {
      const yr = new Date(today.getFullYear(), 0, 1);
      return { start: yr.toISOString().split('T')[0], end: todayStr };
    }

    if (dateFilter === 'Custom' && customStartDate && customEndDate) {
      return { start: customStartDate, end: customEndDate };
    }

    return { start: '2020-01-01', end: '2030-12-31' };
  }, [dateFilter, customStartDate, customEndDate]);

  // Filter items by date
  const filteredSales = useMemo(
    () => sales.filter((s) => s.saleDate >= start && s.saleDate <= end),
    [sales, start, end]
  );

  const filteredAccSales = useMemo(
    () => accessorySales.filter((a) => a.date >= start && a.date <= end),
    [accessorySales, start, end]
  );

  const filteredPurchases = useMemo(
    () => purchases.filter((p) => p.purchaseDate >= start && p.purchaseDate <= end),
    [purchases, start, end]
  );

  const filteredExpenses = useMemo(
    () => expenses.filter((e) => e.date >= start && e.date <= end),
    [expenses, start, end]
  );

  // Financial Metrics for Period
  const periodMobileRevenue = useMemo(
    () => filteredSales.reduce((sum, s) => sum + s.finalPrice, 0),
    [filteredSales]
  );

  const periodAccRevenue = useMemo(
    () => filteredAccSales.reduce((sum, a) => sum + a.totalAmount, 0),
    [filteredAccSales]
  );

  const totalPeriodRevenue = periodMobileRevenue + periodAccRevenue;

  const periodCOGS = useMemo(() => {
    const mobCogs = filteredSales.reduce((sum, s) => sum + s.purchasePrice, 0);
    const accCogs = filteredAccSales.reduce((sum, a) => sum + a.quantity * a.unitPurchasePrice, 0);
    return mobCogs + accCogs;
  }, [filteredSales, filteredAccSales]);

  const grossProfit = totalPeriodRevenue - periodCOGS;

  const totalPeriodExpenses = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  const netProfit = grossProfit - totalPeriodExpenses;

  // Stock Valuation
  const inStockMobiles = mobiles.filter((m) => m.status === 'In Stock');
  const totalMobileValuation = inStockMobiles.reduce((sum, m) => sum + m.purchasePrice, 0);
  const totalAccValuation = accessories.reduce((sum, a) => sum + a.quantity * a.purchasePrice, 0);
  const totalInventoryValuation = totalMobileValuation + totalAccValuation;

  // Receivables & Payables
  const totalReceivables = customers.reduce((sum, c) => sum + c.remainingBalance, 0);
  const totalPayables = suppliers.reduce((sum, s) => sum + s.remainingPayable, 0);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  const handleExportReportPdf = async (customTitle?: string, elementId?: string) => {
    setIsGeneratingPdf(true);
    setPdfSuccessMessage(null);
    try {
      const targetId = elementId || 'active-report-printable-area';
      const targetEl = document.getElementById(targetId);

      // Financial Report High-Precision PDF
      if (activeReportTab === 'pnl') {
        const financialResult = generateProfessionalFinancialPdf({
          shopName: settings.shopName,
          tagline: settings.tagline,
          address: settings.address,
          phone: settings.phone,
          currency: settings.currency,
          periodLabel: dateFilter === 'Custom' ? `${start} to ${end}` : dateFilter,
          generatedDate: new Date().toLocaleString(),
          metrics: {
            mobileRevenue: periodMobileRevenue,
            accessoryRevenue: periodAccRevenue,
            totalRevenue: totalPeriodRevenue,
            cogs: periodCOGS,
            grossProfit,
            grossMarginPercent: totalPeriodRevenue > 0 ? (grossProfit / totalPeriodRevenue) * 100 : 0,
            operatingExpenses: totalPeriodExpenses,
            netProfit,
            netMarginPercent: totalPeriodRevenue > 0 ? (netProfit / totalPeriodRevenue) * 100 : 0,
          },
        });

        if (financialResult.success && financialResult.fileName) {
          setPdfSuccessMessage(`Financial Statement PDF downloaded: ${financialResult.fileName}`);
          setTimeout(() => setPdfSuccessMessage(null), 4000);
          return;
        }
      }

      // Stock & Inventory Valuation High-Precision PDF
      if (activeReportTab === 'stock') {
        const inventoryResult = generateProfessionalInventoryPdf({
          shopName: settings.shopName,
          currency: settings.currency,
          periodLabel: dateFilter,
          totalDevices: inStockMobiles.length,
          totalDeviceValuation: totalMobileValuation,
          totalAccessories: accessories.reduce((sum, a) => sum + a.quantity, 0),
          totalAccessoryValuation: totalAccValuation,
          totalInventoryValuation,
          mobiles: inStockMobiles.map((m) => ({
            brand: m.brand,
            model: m.model,
            ram: m.ram,
            storage: m.storage,
            imei1: m.imei1,
            condition: m.condition,
            cost: m.purchasePrice,
            salePrice: m.salePrice,
            status: m.status,
          })),
        });

        if (inventoryResult.success && inventoryResult.fileName) {
          setPdfSuccessMessage(`Inventory Valuation PDF downloaded: ${inventoryResult.fileName}`);
          setTimeout(() => setPdfSuccessMessage(null), 4000);
          return;
        }
      }

      // Other tabs (Sales, Purchases, Receivables, Expenses) using rendered audit-report layout
      if (!targetEl) return;

      const title =
        customTitle ||
        (activeReportTab === 'sales'
          ? 'Sales_Performance'
          : activeReportTab === 'purchases'
          ? 'Purchases_Inward'
          : activeReportTab === 'receivables'
          ? 'Receivables_and_Payables'
          : 'Operating_Expenses');

      const result = await downloadReportAsPdf(targetEl, activeReportTab, {
        title,
        period: dateFilter,
      });

      if (result.success && result.fileName) {
        setPdfSuccessMessage(`Report PDF downloaded: ${result.fileName}`);
        setTimeout(() => setPdfSuccessMessage(null), 4000);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportCsv = () => {
    let rows: string[][] = [];
    let title = 'report';

    if (activeReportTab === 'pnl') {
      title = 'profit_and_loss';
      rows = [
        ['Item', 'Amount'],
        ['Mobile Sales Revenue', `${periodMobileRevenue}`],
        ['Accessory Sales Revenue', `${periodAccRevenue}`],
        ['Total Gross Revenue', `${totalPeriodRevenue}`],
        ['Cost of Goods Sold (COGS)', `${periodCOGS}`],
        ['Gross Profit', `${grossProfit}`],
        ['Operating Expenses', `${totalPeriodExpenses}`],
        ['Net Profit', `${netProfit}`],
      ];
    } else if (activeReportTab === 'sales') {
      title = 'sales_report';
      rows = [
        ['Invoice', 'Date', 'Customer', 'Mobile', 'Price', 'Discount', 'Net', 'Profit'],
        ...filteredSales.map((s) => [
          s.invoiceNumber,
          s.saleDate,
          s.customerName,
          `"${s.brand} ${s.model}"`,
          `${s.salePrice}`,
          `${s.discount}`,
          `${s.finalPrice}`,
          `${s.profit}`,
        ]),
      ];
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${title}_${dateFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <ShopLogo
            logoUrl={settings.logoUrl}
            shopName={settings.shopName}
            size="md"
            variant="light"
            rounded="xl"
            showBorder
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Financial & Inventory Reports</span>
              <span className="text-xs font-semibold text-slate-500 font-normal hidden sm:inline">
                · {settings.shopName}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Audit-ready Income Statements, Sales Performance, Stock Valuations & Aging Receivables.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleExportReportPdf()}
            disabled={isGeneratingPdf}
            className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            title="Generate and download active report tab as PDF"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Report</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* PDF Generation Notification */}
      {pdfSuccessMessage && (
        <div className="no-print p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{pdfSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setPdfSuccessMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-slate-600 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Period:</span>
          </span>
          {(['Today', 'Yesterday', 'This Week', 'This Month', 'This Year', 'All Time', 'Custom'] as DateFilterOption[]).map(
            (opt) => (
              <button
                key={opt}
                onClick={() => setDateFilter(opt)}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  dateFilter === opt
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt}
              </button>
            )
          )}
        </div>

        {dateFilter === 'Custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
            />
            <span>to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
            />
          </div>
        )}

        <div className="text-slate-400 font-mono text-[11px]">
          Scope: {formatDate(start)} → {formatDate(end)}
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-px text-xs font-medium">
        <button
          onClick={() => setActiveReportTab('pnl')}
          className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 ${
            activeReportTab === 'pnl'
              ? 'border-emerald-600 text-emerald-700 bg-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Profit & Loss Statement
        </button>
        <button
          onClick={() => setActiveReportTab('sales')}
          className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 ${
            activeReportTab === 'sales'
              ? 'border-emerald-600 text-emerald-700 bg-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Sales Report ({filteredSales.length})
        </button>
        <button
          onClick={() => setActiveReportTab('purchases')}
          className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 ${
            activeReportTab === 'purchases'
              ? 'border-emerald-600 text-emerald-700 bg-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Purchases Report ({filteredPurchases.length})
        </button>
        <button
          onClick={() => setActiveReportTab('stock')}
          className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 ${
            activeReportTab === 'stock'
              ? 'border-emerald-600 text-emerald-700 bg-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Inventory Valuation
        </button>
        <button
          onClick={() => setActiveReportTab('receivables')}
          className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 ${
            activeReportTab === 'receivables'
              ? 'border-emerald-600 text-emerald-700 bg-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Receivables & Payables
        </button>
        <button
          onClick={() => setActiveReportTab('expenses')}
          className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 ${
            activeReportTab === 'expenses'
              ? 'border-emerald-600 text-emerald-700 bg-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Operating Expenses
        </button>
      </div>

      {/* Printable & PDF Export Container */}
      <div id="active-report-printable-area" data-printable-report="true" className="space-y-6">
        {/* Print-Only Official Shop Letterhead for Printable Documents & PDF Exports */}
        <div className="hidden print:block print-report-header pb-4 mb-4 border-b border-slate-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <ShopLogo
                logoUrl={settings.logoUrl}
                shopName={settings.shopName}
                size="lg"
                variant="light"
                rounded="lg"
                showBorder
              />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">{settings.shopName}</h1>
                {settings.tagline && <p className="text-xs text-slate-600">{settings.tagline}</p>}
                <p className="text-xs text-slate-600 mt-0.5">
                  {settings.address}{settings.city ? `, ${settings.city}` : ''}
                </p>
                <p className="text-xs text-slate-600">
                  Phone: {settings.phone}{settings.whatsapp ? ` · WhatsApp: ${settings.whatsapp}` : ''}
                  {settings.email ? ` · Email: ${settings.email}` : ''}
                </p>
                {settings.taxNumber && (
                  <p className="text-[11px] font-mono text-slate-500">Tax / NTN: {settings.taxNumber}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900 uppercase">Official Business Report</span>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                Generated: {new Date().toISOString().split('T')[0]}
              </div>
              <div className="text-xs text-slate-500">
                Scope: {formatDate(start)} → {formatDate(end)}
              </div>
            </div>
          </div>
        </div>

        {/* Tab 1: Profit & Loss Statement (Income Statement) */}
        {activeReportTab === 'pnl' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs max-w-3xl space-y-6">
            <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Profit & Loss Statement ({dateFilter})
                </h2>
                <p className="text-xs text-slate-500">
                  Operating period from {formatDate(start)} to {formatDate(end)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExportReportPdf('Profit_and_Loss')}
                disabled={isGeneratingPdf}
                className="no-print px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-center"
                title="Download Profit & Loss Report PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download P&L PDF</span>
              </button>
            </div>

          <div className="space-y-4 text-xs font-mono">
            {/* Revenue */}
            <div className="space-y-1.5">
              <div className="font-bold text-slate-900 text-sm font-sans flex items-center justify-between">
                <span>1. OPERATING REVENUE</span>
                <span className="tabular-nums font-mono">{formatCurrency(totalPeriodRevenue, settings.currency)}</span>
              </div>
              <div className="pl-4 flex justify-between text-slate-600">
                <span>Mobile Phones Net Sales</span>
                <span className="tabular-nums">{formatCurrency(periodMobileRevenue, settings.currency)}</span>
              </div>
              <div className="pl-4 flex justify-between text-slate-600">
                <span>Accessories Net Sales</span>
                <span className="tabular-nums">{formatCurrency(periodAccRevenue, settings.currency)}</span>
              </div>
            </div>

            {/* COGS */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="font-bold text-slate-900 text-sm font-sans flex items-center justify-between">
                <span>2. COST OF GOODS SOLD (COGS)</span>
                <span className="tabular-nums font-mono text-slate-700">-{formatCurrency(periodCOGS, settings.currency)}</span>
              </div>
              <div className="pl-4 text-slate-500 text-[11px]">
                Original inventory acquisition cost of units sold during this period.
              </div>
            </div>

            {/* Gross Profit */}
            <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center text-sm font-bold text-slate-900">
              <span>GROSS PROFIT (Revenue - COGS):</span>
              <span className="tabular-nums font-mono text-emerald-700">
                {formatCurrency(grossProfit, settings.currency)}
              </span>
            </div>

            {/* Expenses */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="font-bold text-slate-900 text-sm font-sans flex items-center justify-between">
                <span>3. OPERATING EXPENDITURES</span>
                <span className="tabular-nums font-mono text-rose-700">-{formatCurrency(totalPeriodExpenses, settings.currency)}</span>
              </div>
              {filteredExpenses.map((exp) => (
                <div key={exp.id} className="pl-4 flex justify-between text-slate-600">
                  <span>{exp.category} ({exp.description})</span>
                  <span className="tabular-nums">{formatCurrency(exp.amount, settings.currency)}</span>
                </div>
              ))}
            </div>

            {/* Net Profit */}
            <div
              className={`p-4 rounded-xl border flex justify-between items-center text-base font-bold ${
                netProfit >= 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <span>NET SHOP PROFIT:</span>
              <span className="tabular-nums font-mono text-xl">
                {formatCurrency(netProfit, settings.currency)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sales Report */}
      {activeReportTab === 'sales' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap justify-between items-center text-xs gap-3">
            <span className="font-semibold text-slate-800">
              Period Sales Total: <strong className="font-mono text-emerald-700">{formatCurrency(periodMobileRevenue, settings.currency)}</strong> ({filteredSales.length} phones sold)
            </span>
            <button
              type="button"
              onClick={() => handleExportReportPdf('Sales_Report')}
              disabled={isGeneratingPdf}
              className="no-print px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Download Sales Performance Report PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sales PDF</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Device & IMEI</th>
                  <th className="py-2.5 px-3 text-right">Sale Price</th>
                  <th className="py-2.5 px-3 text-right">Cost</th>
                  <th className="py-2.5 px-4 text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{s.invoiceNumber}</td>
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{formatDate(s.saleDate)}</td>
                    <td className="py-2.5 px-4 text-slate-800 font-medium">{s.customerName}</td>
                    <td className="py-2.5 px-4">
                      <div>{s.brand} {s.model}</div>
                      <div className="font-mono text-[10px] text-slate-400">{s.imei1}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatCurrency(s.finalPrice, settings.currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                      {formatCurrency(s.purchasePrice, settings.currency)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-teal-700">
                      +{formatCurrency(s.profit, settings.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Purchases Report */}
      {activeReportTab === 'purchases' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap justify-between items-center text-xs gap-3">
            <span className="font-semibold text-slate-800">
              Period Purchases Total:{' '}
              <strong className="font-mono text-purple-700">
                {formatCurrency(
                  filteredPurchases.reduce((sum, p) => sum + p.purchasePrice, 0),
                  settings.currency
                )}
              </strong> ({filteredPurchases.length} inward bills)
            </span>
            <button
              type="button"
              onClick={() => handleExportReportPdf('Purchases_Report')}
              disabled={isGeneratingPdf}
              className="no-print px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Download Purchases Inward Report PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Purchases PDF</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Bill #</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Wholesaler</th>
                  <th className="py-2.5 px-4">Mobile & IMEI</th>
                  <th className="py-2.5 px-3 text-right">Cost Price</th>
                  <th className="py-2.5 px-3 text-right">Paid Now</th>
                  <th className="py-2.5 px-4 text-right">Remaining Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{p.purchaseNumber}</td>
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{formatDate(p.purchaseDate)}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">{p.supplierName}</td>
                    <td className="py-2.5 px-4">
                      <div>{p.brand} {p.model}</div>
                      <div className="font-mono text-[10px] text-slate-400">{p.imei1}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatCurrency(p.purchasePrice, settings.currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700">
                      {formatCurrency(p.paymentAmount, settings.currency)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {p.remainingPayable > 0 ? (
                        <span className="font-bold text-rose-600">{formatCurrency(p.remainingPayable, settings.currency)}</span>
                      ) : (
                        <span className="text-slate-400">Full Cash</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Inventory Valuation */}
      {activeReportTab === 'stock' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center no-print">
            <span className="text-xs font-semibold text-slate-700">Stock Valuation & Inventory Audit</span>
            <button
              type="button"
              onClick={() => handleExportReportPdf('Inventory_Valuation')}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Download Stock Valuation Report PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Stock Audit PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500">Mobiles Stock Value</span>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                {formatCurrency(totalMobileValuation, settings.currency)}
              </div>
              <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">{inStockMobiles.length} mobiles in stock</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500">Accessories Stock Value</span>
              <div className="text-xl font-bold font-mono text-indigo-700 mt-1">
                {formatCurrency(totalAccValuation, settings.currency)}
              </div>
              <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                {accessories.reduce((sum, a) => sum + a.quantity, 0)} accessories in stock
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs bg-slate-900 text-white">
              <span className="text-xs text-slate-400">Combined Total Inventory Worth</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {formatCurrency(totalInventoryValuation, settings.currency)}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Liquid asset capital</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Receivables & Payables */}
      {activeReportTab === 'receivables' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center no-print">
            <span className="text-xs font-semibold text-slate-700">Customer & Supplier Ledger Balances</span>
            <button
              type="button"
              onClick={() => handleExportReportPdf('Receivables_and_Payables')}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Download Receivables & Payables Report PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Ledger Balances PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-900">Customer Receivables</span>
                <span className="font-mono font-bold text-amber-600">{formatCurrency(totalReceivables, settings.currency)}</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {customers
                  .filter((c) => c.remainingBalance > 0)
                  .map((c) => (
                    <div key={c.id} className="py-2 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-slate-800">{c.name}</div>
                        <div className="text-[10px] text-slate-400">{c.phone}</div>
                      </div>
                      <span className="font-mono font-bold text-amber-600">
                        {formatCurrency(c.remainingBalance, settings.currency)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-900">Supplier Payables</span>
                <span className="font-mono font-bold text-rose-600">{formatCurrency(totalPayables, settings.currency)}</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {suppliers
                  .filter((s) => s.remainingPayable > 0)
                  .map((s) => (
                    <div key={s.id} className="py-2 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-slate-800">{s.companyName}</div>
                        <div className="text-[10px] text-slate-400">Contact: {s.name}</div>
                      </div>
                      <span className="font-mono font-bold text-rose-600">
                        {formatCurrency(s.remainingPayable, settings.currency)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Expenses */}
      {activeReportTab === 'expenses' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap justify-between items-center text-xs gap-3">
            <span className="font-semibold text-slate-800">
              Total Period Expenses: <strong className="font-mono text-rose-700">{formatCurrency(totalPeriodExpenses, settings.currency)}</strong> ({filteredExpenses.length} entries)
            </span>
            <button
              type="button"
              onClick={() => handleExportReportPdf('Operating_Expenses')}
              disabled={isGeneratingPdf}
              className="no-print px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Download Operating Expenses Report PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Expenses PDF</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Ref #</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{formatDate(e.date)}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{e.category}</td>
                    <td className="py-2.5 px-4 text-slate-700">{e.description}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-400">{e.receiptRef || '-'}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-rose-700">
                      {formatCurrency(e.amount, settings.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
