import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  Smartphone,
  CheckCircle,
  ShieldCheck,
  Download,
  AlertCircle,
  Receipt,
  Loader2,
} from 'lucide-react';
import { MobileSale } from '../../types';
import { useShop } from '../../context/ShopContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ShopLogo } from '../common/ShopLogo';
import { exportElementToPdf, generateInvoicePdf, generatePDF } from '../../utils/pdfExport';
import { printInvoice, PrintFormat } from '../../utils/printInvoice';

interface InvoiceModalProps {
  sale: MobileSale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, isOpen, onClose }) => {
  const { settings } = useShop();
  const [layoutMode, setLayoutMode] = useState<'a4' | 'thermal' | '58mm'>('a4');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  if (!isOpen || !sale) return null;

  const currentPrintFormat: PrintFormat =
    layoutMode === 'a4' ? 'a4' : layoutMode === '58mm' ? '58mm' : '80mm';

  /**
   * Real browser print execution
   * Opens the real browser print dialog with the exact layout and page size
   */
  const handlePrint = async (targetFormat?: PrintFormat) => {
    const formatToPrint = targetFormat || currentPrintFormat;

    // If a different format was requested, update state to keep UI in sync
    if (targetFormat && targetFormat !== currentPrintFormat) {
      setLayoutMode(targetFormat === 'a4' ? 'a4' : targetFormat === '58mm' ? '58mm' : 'thermal');
    }

    const targetEl = document.getElementById('printable-receipt-area');
    if (!targetEl) {
      setStatusMessage({
        type: 'error',
        text: 'Printable invoice element not found in DOM.',
      });
      return;
    }

    setIsPrinting(true);
    setStatusMessage(null);

    try {
      const success = await printInvoice(targetEl, {
        format: formatToPrint,
        documentTitle: `Invoice-${sale.invoiceNumber}`,
        onError: (err) => {
          setStatusMessage({
            type: 'error',
            text: 'Unable to open browser print dialog. Please check popup permissions or use "Download PDF".',
          });
        },
      });

      if (!success) {
        setStatusMessage({
          type: 'error',
          text: 'Unable to open print dialog. Please use "Download PDF" instead.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Print error: ' + (err?.message || 'Unable to print invoice.'),
      });
    } finally {
      setIsPrinting(false);
    }
  };

  /**
   * Real PDF generation and download
   * Downloads a valid PDF file matching the selected format without empty white spaces
   */
  const handleDownloadPdf = async () => {
    const targetEl = document.getElementById('printable-receipt-area');
    if (!targetEl) {
      setStatusMessage({
        type: 'error',
        text: 'Printable invoice element not found in DOM.',
      });
      return;
    }

    setIsExportingPdf(true);
    setStatusMessage(null);

    try {
      const result = await generatePDF(targetEl, {
        format: currentPrintFormat,
        invoiceNumber: sale.invoiceNumber,
        quality: 2,
      });

      if (!result.success) {
        setStatusMessage({
          type: 'error',
          text: result.error || 'Unable to generate PDF. Please try again.',
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: `PDF downloaded successfully: ${result.fileName || `Invoice-${sale.invoiceNumber}.pdf`}`,
        });
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Failed to generate PDF: ' + (err?.message || 'Please try again.'),
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className={`relative bg-white rounded-xl shadow-2xl w-full my-6 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 transition-all ${
        layoutMode === 'a4' ? 'max-w-4xl' : 'max-w-md'
      }`}>
        {/* Top action bar - Hidden during print */}
        <div className="no-print flex flex-wrap items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-sm">Invoice #{sale.invoiceNumber}</span>
              <span className="text-[11px] text-slate-400 block sm:inline sm:ml-2">
                · {settings.shopName}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Format Selector: A4 vs 80mm vs 58mm */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-xs border border-slate-700">
              <button
                type="button"
                onClick={() => setLayoutMode('a4')}
                className={`px-3 py-1.5 rounded-md transition-colors font-semibold flex items-center gap-1.5 ${
                  layoutMode === 'a4'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Standard A4 Invoice"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Standard A4</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('thermal')}
                className={`px-3 py-1.5 rounded-md transition-colors font-semibold flex items-center gap-1.5 ${
                  layoutMode === 'thermal'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="80mm Thermal Receipt (POS Roll)"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>80mm Thermal</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('58mm')}
                className={`px-2 py-1.5 rounded-md transition-colors font-medium hidden sm:flex items-center gap-1 ${
                  layoutMode === '58mm'
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="58mm Compact Thermal Receipt"
              >
                <span>58mm</span>
              </button>
            </div>

            {/* Download PDF Button with Loading State */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
              title={`Download ${currentPrintFormat === 'a4' ? 'A4' : currentPrintFormat} PDF`}
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {/* Active Format Print Button */}
            <button
              type="button"
              onClick={() => handlePrint()}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs disabled:opacity-50"
              title={`Print in ${currentPrintFormat === 'a4' ? 'A4 format' : `${currentPrintFormat} thermal format`}`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>
                {isPrinting
                  ? 'Opening Print...'
                  : `Print (${currentPrintFormat === 'a4' ? 'A4' : currentPrintFormat})`}
              </span>
            </button>

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors ml-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status notification banner (if any) */}
        {statusMessage && (
          <div
            className={`no-print px-4 py-2 text-xs flex items-center justify-between border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Invoice View Area */}
        <div className="p-3 sm:p-5 max-h-[80vh] overflow-y-auto bg-slate-100 flex justify-center items-start">
          {layoutMode === 'thermal' || layoutMode === '58mm' ? (
            /* ========================================================= */
            /* THERMAL POS ROLL RECEIPT PREVIEW (80mm & 58mm)            */
            /* Height automatically fits content with NO large empty space */
            /* ========================================================= */
            <div
              id="printable-receipt-area"
              data-print-format={layoutMode === '58mm' ? '58mm' : '80mm'}
              className={`thermal-receipt-container print-page-thermal bg-white p-3.5 pb-3 shadow-md border border-slate-300 text-slate-900 font-mono text-xs select-text h-auto min-h-0 ${
                layoutMode === '58mm'
                  ? 'w-[219px] max-w-[219px]'
                  : 'w-[302px] max-w-[302px] sm:w-[80mm] sm:max-w-[80mm]'
              }`}
            >
              {/* Receipt Header */}
              <div className="text-center pb-2.5 border-b border-dashed border-slate-400">
                <div className="flex justify-center mb-1.5">
                  <ShopLogo
                    logoUrl={settings.logoUrl}
                    shopName={settings.shopName}
                    size="md"
                    variant="mono"
                    rounded="md"
                  />
                </div>
                <h2 className="font-bold text-base text-slate-950 uppercase leading-snug tracking-tight break-words">
                  {settings.shopName}
                </h2>
                {settings.tagline && (
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-tight break-words">
                    {settings.tagline}
                  </p>
                )}
                <p className="text-[10px] text-slate-600 mt-1 leading-tight break-words">
                  {settings.address}
                  {settings.city ? `, ${settings.city}` : ''}
                </p>
                <p className="text-[10px] font-semibold text-slate-800 mt-0.5">
                  Ph: {settings.phone}
                  {settings.whatsapp ? ` · WA: ${settings.whatsapp}` : ''}
                </p>
                {settings.email && (
                  <p className="text-[9px] text-slate-500 break-words">{settings.email}</p>
                )}
                {settings.taxNumber && (
                  <p className="text-[9px] font-mono text-slate-500">NTN: {settings.taxNumber}</p>
                )}
              </div>

              {/* Title Badge */}
              <div className="text-center my-2">
                <span className="inline-block px-2.5 py-0.5 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider rounded-xs">
                  CASH SALE RECEIPT
                </span>
              </div>

              {/* Invoice Meta */}
              <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">INV #:</span>
                  <span className="font-bold text-slate-900">{sale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">DATE:</span>
                  <span>{formatDate(sale.saleDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CUSTOMER:</span>
                  <span className="font-medium text-right truncate max-w-[170px]">
                    {sale.customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PHONE:</span>
                  <span className="font-mono">{sale.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SALESMAN:</span>
                  <span className="truncate max-w-[160px]">{sale.salesmanName || 'Staff'}</span>
                </div>
              </div>

              {/* Item Details */}
              <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
                <div className="font-bold text-slate-950 text-xs leading-snug break-words">
                  {sale.brand} {sale.model}
                </div>
                <div className="text-[10px] text-slate-600 flex justify-between">
                  <span>Condition:</span>
                  <span className="font-semibold text-slate-800">{sale.condition}</span>
                </div>
                <div className="text-[10px] text-slate-700 flex justify-between">
                  <span>IMEI 1:</span>
                  <span className="font-mono font-semibold">{sale.imei1}</span>
                </div>
                {sale.imei2 && (
                  <div className="text-[10px] text-slate-700 flex justify-between">
                    <span>IMEI 2:</span>
                    <span className="font-mono font-semibold">{sale.imei2}</span>
                  </div>
                )}
                <div className="text-[10px] text-slate-700 flex justify-between break-words">
                  <span>Warranty:</span>
                  <span className="font-medium text-emerald-800 text-right">{sale.warrantyInfo}</span>
                </div>
              </div>

              {/* Price Calculation */}
              <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-right text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Price:</span>
                  <span className="tabular-nums font-mono">
                    {formatCurrency(sale.salePrice, settings.currency)}
                  </span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span className="tabular-nums font-mono">
                      -{formatCurrency(sale.discount, settings.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-950 text-xs pt-1 border-t border-slate-200">
                  <span>Net Total:</span>
                  <span className="tabular-nums font-mono">
                    {formatCurrency(sale.finalPrice, settings.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Paid ({sale.paymentMethod}):</span>
                  <span className="tabular-nums font-mono font-semibold text-emerald-800">
                    {formatCurrency(sale.amountReceived, settings.currency)}
                  </span>
                </div>
                {sale.remainingAmount > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>Balance Due:</span>
                    <span className="tabular-nums font-mono">
                      {formatCurrency(sale.remainingAmount, settings.currency)}
                    </span>
                  </div>
                )}
              </div>

              {/* Warranty and Footer notes */}
              <div className="pt-2 text-center space-y-1 text-[9px] text-slate-600">
                <p>1. Used mobile checking warranty is 7 days only.</p>
                <p>2. No claim on LCD glass break, display lines or water damage.</p>
                <p>3. Box and receipt required for any warranty claim.</p>
                <p className="font-urdu text-[11px] pt-0.5 text-slate-900 font-semibold">
                  وارنٹی کلیم کیلئے اصل رسید اور ڈبہ لازمی ہے۔
                </p>
                <p className="font-bold text-slate-800 pt-0.5">Thank you for your business!</p>
                <p className="text-[8px] text-slate-400 font-mono pt-1">
                  MobiFlow Software POS · {formatDate(sale.saleDate)}
                </p>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* STANDARD A4 MODERN OFFICIAL INVOICE                       */
            /* Fits standard A4 boundaries with multi-page flow         */
            /* ========================================================= */
            <div
              id="printable-receipt-area"
              data-print-format="a4"
              className="a4-invoice-container print-page-a4 w-full max-w-3xl bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-slate-800 select-text"
            >
              {/* Header */}
              <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900">
                <div className="flex items-start gap-4">
                  <ShopLogo
                    logoUrl={settings.logoUrl}
                    shopName={settings.shopName}
                    size="xl"
                    variant="light"
                    rounded="xl"
                    showBorder
                  />
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950 uppercase leading-none">
                      {settings.shopName}
                    </h1>
                    {settings.tagline && (
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        {settings.tagline}
                      </p>
                    )}
                    <p className="text-xs text-slate-600 mt-1 max-w-sm">
                      {settings.address}
                      {settings.city ? `, ${settings.city}` : ''}
                    </p>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Phone: <span className="font-semibold text-slate-900">{settings.phone}</span>
                      {settings.whatsapp && (
                        <span> · WhatsApp: <span className="font-semibold text-slate-900">{settings.whatsapp}</span></span>
                      )}
                    </p>
                    {settings.email && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Email: {settings.email}
                        {settings.website && <span> · Web: {settings.website}</span>}
                      </p>
                    )}
                    {settings.taxNumber && (
                      <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                        NTN / Tax ID: <strong>{settings.taxNumber}</strong>
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded border border-emerald-200 inline-block mb-1.5 tracking-wider">
                    SALES INVOICE
                  </div>
                  <div className="text-lg font-bold font-mono text-slate-950">{sale.invoiceNumber}</div>
                  <div className="text-xs text-slate-500 font-mono">Date: {formatDate(sale.saleDate)}</div>
                  <div className="text-xs text-slate-500">Salesman: {sale.salesmanName || 'Staff'}</div>
                </div>
              </div>

              {/* Customer & Bill details */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                    Billed To / Customer Details:
                  </span>
                  <div className="font-bold text-slate-950 text-sm">{sale.customerName}</div>
                  <div className="text-slate-600 mt-0.5">Phone: {sale.customerPhone}</div>
                  {sale.customerAddress && (
                    <div className="text-slate-500 mt-0.5">{sale.customerAddress}</div>
                  )}
                  {sale.customerCnic && (
                    <div className="text-slate-500 font-mono mt-0.5">CNIC: {sale.customerCnic}</div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                    Payment Status:
                  </span>
                  <div className="font-medium text-slate-800">
                    Payment Method: <span className="font-semibold text-slate-900">{sale.paymentMethod}</span>
                  </div>
                  <div className="font-medium text-slate-800 mt-0.5">
                    Invoice Status:{' '}
                    {sale.remainingAmount === 0 ? (
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        Fully Paid
                      </span>
                    ) : (
                      <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                        Partial Credit Due
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Item Table */}
              <div className="py-4">
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Item Description & Specifications</th>
                      <th className="py-2.5 px-3">Condition</th>
                      <th className="py-2.5 px-4 text-right">Price ({settings.currency})</th>
                      <th className="py-2.5 px-4 text-right">Discount</th>
                      <th className="py-2.5 px-4 text-right">Net Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-white">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-950 text-sm">
                          {sale.brand} {sale.model}
                        </div>
                        <div className="text-slate-600 font-mono text-[11px] mt-0.5">
                          IMEI 1: <strong className="text-slate-900">{sale.imei1}</strong>
                          {sale.imei2 && (
                            <span> | IMEI 2: <strong className="text-slate-900">{sale.imei2}</strong></span>
                          )}
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Warranty: {sale.warrantyInfo}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">{sale.condition}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {formatCurrency(sale.salePrice, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-600 font-semibold">
                        {sale.discount > 0 ? `-${formatCurrency(sale.discount, settings.currency)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-950 text-sm">
                        {formatCurrency(sale.finalPrice, settings.currency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary Calculations */}
              <div className="border-t border-slate-200 pt-4 flex justify-end">
                <div className="w-72 space-y-1.5 text-xs text-right font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-sans">Subtotal:</span>
                    <span className="tabular-nums">{formatCurrency(sale.salePrice, settings.currency)}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span className="font-sans">Discount:</span>
                      <span className="tabular-nums">-{formatCurrency(sale.discount, settings.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-slate-950 pt-1.5 border-t border-slate-300">
                    <span className="font-sans">Total Amount:</span>
                    <span className="tabular-nums">{formatCurrency(sale.finalPrice, settings.currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 pt-1">
                    <span className="font-sans">Paid ({sale.paymentMethod}):</span>
                    <span className="tabular-nums font-semibold text-emerald-700">
                      {formatCurrency(sale.amountReceived, settings.currency)}
                    </span>
                  </div>
                  {sale.remainingAmount > 0 && (
                    <div className="flex justify-between text-red-600 font-bold pt-1.5 border-t border-dashed border-slate-300">
                      <span className="font-sans">Outstanding Balance:</span>
                      <span className="tabular-nums text-sm">
                        {formatCurrency(sale.remainingAmount, settings.currency)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms, Signatures, and Official Stamp */}
              <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] text-slate-500 font-sans">
                <div className="font-bold text-slate-800 mb-1">Warranty Policy & Terms of Purchase:</div>
                <p className="whitespace-pre-line leading-relaxed">{settings.invoiceTerms}</p>
                <p className="text-[11px] text-slate-900 font-urdu font-semibold mt-1">
                  نوٹ: پانی گرنے، سکرین ٹوٹنے یا لائن آنے کی صورت میں وارنٹی ختم تصور ہو گی۔ کلیم کیلئے اصل رسید اور ڈبہ لازمی ہے۔
                </p>

                <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-200 text-center">
                  <div>
                    <div className="border-b border-slate-400 w-44 mx-auto mb-1"></div>
                    <span className="text-[10px] text-slate-500 font-medium">Customer Signature</span>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 w-44 mx-auto mb-1"></div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Authorized Signature & Stamp ({settings.shopName})
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span>MobiFlow Software · Complete Mobile Shop POS & Management System</span>
                  <span>Invoice: {sale.invoiceNumber}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
