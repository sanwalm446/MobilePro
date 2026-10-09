import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  FileText,
  Receipt,
  Phone,
  Calendar,
  CreditCard,
  User,
  ShieldCheck,
  Building,
  Smartphone,
  Loader2,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { formatCurrency, formatDate, formatDateTime, numberToWords } from '../../utils/formatters';
import { ShopLogo } from '../common/ShopLogo';
import { exportElementToPdf } from '../../utils/pdfExport';
import { printInvoice, PrintFormat } from '../../utils/printInvoice';

export interface PaymentReceiptData {
  receiptNumber: string;
  receiptType: 'customer' | 'supplier' | 'cash_in' | 'cash_out';
  title?: string;
  date: string;
  partyName: string;
  partyPhone?: string;
  partyAddress?: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  previousBalance?: number;
  currentBalance?: number;
  receivedBy?: string;
}

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: PaymentReceiptData | null;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
}) => {
  const { settings, currentUser } = useShop();
  const [layoutMode, setLayoutMode] = useState<'a4' | '80mm'>('a4');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showDualCopy, setShowDualCopy] = useState(false); // For A4: Customer & Office copy

  if (!isOpen || !receipt) return null;

  const cashierName = receipt.receivedBy || currentUser?.name || 'Authorized Cashier';

  const isOutgoing = receipt.receiptType === 'supplier' || receipt.receiptType === 'cash_out';
  const receiptTitle =
    receipt.title ||
    (receipt.receiptType === 'customer'
      ? 'Payment Recovery Receipt'
      : receipt.receiptType === 'supplier'
      ? 'Supplier Payment Voucher'
      : receipt.receiptType === 'cash_in'
      ? 'Cash Deposit Receipt'
      : 'Cash Payment Voucher');

  const handlePrint = async () => {
    const targetEl = document.getElementById('printable-payment-receipt-content');
    if (!targetEl) return;
    await printInvoice(targetEl, {
      format: layoutMode === '80mm' ? '80mm' : 'a4',
      documentTitle: `Receipt-${receipt.receiptNumber}`,
    });
  };

  const handleDownloadPdf = async () => {
    const targetEl = document.getElementById('printable-payment-receipt-content');
    if (!targetEl) return;

    setIsExportingPdf(true);
    try {
      const fileName = `Receipt-${receipt.receiptNumber}${layoutMode === '80mm' ? '-80mm' : ''}.pdf`;
      await exportElementToPdf(targetEl, {
        fileName,
        format: layoutMode === '80mm' ? '80mm' : 'a4',
        quality: 2,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full my-6 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 transition-all ${
        layoutMode === 'a4' ? 'max-w-4xl' : 'max-w-md'
      }`}>
        {/* Top Control Bar - Hidden during print */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-950 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight flex items-center gap-2">
                <span>{receiptTitle}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  {receipt.receiptNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                MobiFlow Software · Payment & Cash Voucher System
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Format Switcher: A4 vs 80mm */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setLayoutMode('a4')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  layoutMode === 'a4'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Standard A4 Size</span>
              </button>

              <button
                type="button"
                onClick={() => setLayoutMode('80mm')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  layoutMode === '80mm'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>80mm Thermal Size</span>
              </button>
            </div>

            {/* A4 Extra: Dual Copy Toggle */}
            {layoutMode === 'a4' && (
              <button
                type="button"
                onClick={() => setShowDualCopy(!showDualCopy)}
                className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
                  showDualCopy
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="Print Customer & Accounts Copy on same sheet"
              >
                {showDualCopy ? 'Dual Copy: ON' : 'Dual Copy: OFF'}
              </button>
            )}

            {/* PDF Export Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
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

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print ({layoutMode === 'a4' ? 'A4' : '80mm'})</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors ml-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Container */}
        <div className="p-4 sm:p-8 max-h-[82vh] overflow-y-auto bg-slate-100 flex justify-center items-start">
          <div
            id="printable-payment-receipt-content"
            data-print-format={layoutMode === '80mm' ? '80mm' : 'a4'}
            className={`transition-all duration-200 ${layoutMode === '80mm' ? 'print-page-thermal' : 'print-page-a4'}`}
          >
            {layoutMode === '80mm' ? (
              /* ========================================================= */
              /* 80mm THERMAL POS ROLL RECEIPT                             */
              /* ========================================================= */
              <div className="thermal-receipt-container print-page-thermal w-[302px] max-w-[302px] sm:w-[80mm] sm:max-w-[80mm] bg-white p-3.5 pb-3 shadow-md border border-slate-300 rounded-xs text-slate-900 font-mono text-xs select-text h-auto min-h-0">
                {/* Brand Header */}
                <div className="text-center pb-3 border-b-2 border-dashed border-slate-400">
                  <div className="flex justify-center mb-2">
                    <ShopLogo
                      logoUrl={settings.logoUrl}
                      shopName={settings.shopName}
                      size="md"
                      variant="mono"
                      rounded="md"
                    />
                  </div>
                  <h2 className="font-bold text-base tracking-tight text-slate-950 uppercase leading-snug">
                    {settings.shopName}
                  </h2>
                  {settings.tagline && (
                    <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">
                      {settings.tagline}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-600 mt-1 leading-tight">
                    {settings.address}
                    {settings.city ? `, ${settings.city}` : ''}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-800 mt-0.5">
                    Ph: {settings.phone}
                    {settings.whatsapp ? ` · WA: ${settings.whatsapp}` : ''}
                  </p>
                  {settings.taxNumber && (
                    <p className="text-[9px] text-slate-500 font-mono">
                      NTN / Tax: {settings.taxNumber}
                    </p>
                  )}
                </div>

                {/* Receipt Title Badge */}
                <div className="text-center my-2.5">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider rounded-xs">
                    {receiptTitle}
                  </span>
                </div>

                {/* Meta details */}
                <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">RECEIPT #:</span>
                    <span className="font-bold text-slate-900">{receipt.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">DATE:</span>
                    <span>{formatDate(receipt.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">TIME:</span>
                    <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CASHIER:</span>
                    <span className="truncate max-w-[170px]">{cashierName}</span>
                  </div>
                </div>

                {/* Party Details */}
                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      {isOutgoing ? 'PAID TO:' : 'RECEIVED FROM:'}
                    </span>
                    <span className="font-bold text-slate-950 truncate max-w-[180px] text-right">
                      {receipt.partyName}
                    </span>
                  </div>
                  {receipt.partyPhone && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">PHONE:</span>
                      <span className="font-mono">{receipt.partyPhone}</span>
                    </div>
                  )}
                  {receipt.reference && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">REF / SLIP:</span>
                      <span className="font-mono text-slate-800">{receipt.reference}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">METHOD:</span>
                    <span className="font-semibold text-emerald-800">{receipt.paymentMethod}</span>
                  </div>
                </div>

                {/* Amount Highlight Box */}
                <div className="my-3 p-3 bg-slate-50 border-2 border-slate-900 rounded-xs text-center space-y-1">
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    {isOutgoing ? 'Total Amount Paid' : 'Total Amount Received'}
                  </div>
                  <div className="text-xl font-bold font-mono tracking-tight text-slate-950">
                    {formatCurrency(receipt.amount, settings.currency)}
                  </div>
                  <div className="text-[9px] text-slate-600 italic font-sans leading-tight pt-0.5">
                    {numberToWords(receipt.amount)}
                  </div>
                </div>

                {/* Balance Statement if available */}
                {(receipt.previousBalance !== undefined || receipt.currentBalance !== undefined) && (
                  <div className="py-2 border-t border-b border-dashed border-slate-300 space-y-1 text-[11px]">
                    {receipt.previousBalance !== undefined && (
                      <div className="flex justify-between text-slate-600">
                        <span>Previous Balance:</span>
                        <span className="tabular-nums font-mono">
                          {formatCurrency(receipt.previousBalance, settings.currency)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-900 font-bold">
                      <span>This Payment:</span>
                      <span className="tabular-nums font-mono text-emerald-700">
                        {isOutgoing ? '-' : '+'}
                        {formatCurrency(receipt.amount, settings.currency)}
                      </span>
                    </div>
                    {receipt.currentBalance !== undefined && (
                      <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-dotted border-slate-300">
                        <span>Remaining Balance:</span>
                        <span className="tabular-nums font-mono text-amber-800">
                          {formatCurrency(receipt.currentBalance, settings.currency)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Remarks / Notes */}
                {receipt.notes && (
                  <div className="py-2 text-[10px] text-slate-600 border-b border-dashed border-slate-300">
                    <span className="font-bold text-slate-700">Remarks: </span>
                    <span>{receipt.notes}</span>
                  </div>
                )}

                {/* Thermal Signatures & Footer */}
                <div className="pt-4 text-center space-y-2 text-[9px] text-slate-600 font-sans">
                  <div className="flex justify-between pt-6 border-b border-slate-300 pb-1 text-[9px] font-mono">
                    <div className="text-center">
                      <div className="w-24 border-t border-slate-400 mb-1"></div>
                      <span>Customer Sign</span>
                    </div>
                    <div className="text-center">
                      <div className="w-24 border-t border-slate-400 mb-1"></div>
                      <span>Cashier / Stamp</span>
                    </div>
                  </div>

                  <p className="font-urdu text-[11px] text-slate-800 font-semibold pt-1">
                    براہ کرم تمام ادائیگیوں کی رسید اپنے پاس محفوظ رکھیں۔
                  </p>
                  <p className="font-bold text-slate-800">Thank you for your business!</p>
                  <p className="text-[8px] text-slate-400 font-mono">
                    Powered by MobiFlow Software · {new Date().toISOString().split('T')[0]}
                  </p>
                </div>
              </div>
            ) : (
              /* ========================================================= */
              /* STANDARD A4 MODERN OFFICIAL STATIONERY RECEIPT             */
              /* ========================================================= */
              <div className="space-y-6">
                {/* Single Copy or First Copy (Customer Copy) */}
                <SingleA4Receipt
                  settings={settings}
                  receipt={receipt}
                  cashierName={cashierName}
                  isOutgoing={isOutgoing}
                  receiptTitle={receiptTitle}
                  copyType={showDualCopy ? 'CUSTOMER COPY' : 'ORIGINAL RECEIPT'}
                />

                {/* Second Copy if Dual Copy is toggled ON */}
                {showDualCopy && (
                  <div className="pt-4 border-t-2 border-dashed border-slate-300">
                    <SingleA4Receipt
                      settings={settings}
                      receipt={receipt}
                      cashierName={cashierName}
                      isOutgoing={isOutgoing}
                      receiptTitle={receiptTitle}
                      copyType="ACCOUNTS / OFFICE COPY"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Status bar */}
        <div className="no-print px-6 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready for printing & export · Formatted for {layoutMode === 'a4' ? 'A4 Paper (Laser / Inkjet)' : '80mm Thermal Receipt Printer'}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            MobiFlow POS & Financial Accounting
          </div>
        </div>
      </div>
    </div>
  );
};

interface SingleA4ReceiptProps {
  settings: any;
  receipt: PaymentReceiptData;
  cashierName: string;
  isOutgoing: boolean;
  receiptTitle: string;
  copyType: string;
}

const SingleA4Receipt: React.FC<SingleA4ReceiptProps> = ({
  settings,
  receipt,
  cashierName,
  isOutgoing,
  receiptTitle,
  copyType,
}) => {
  return (
    <div className="w-[720px] bg-white p-8 rounded-lg shadow-md border border-slate-200 text-slate-800 font-sans">
      {/* Top Header */}
      <div className="flex justify-between items-start pb-5 border-b-2 border-slate-900">
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
              Phone: <strong className="text-slate-900">{settings.phone}</strong>
              {settings.whatsapp && (
                <span> · WhatsApp: <strong className="text-slate-900">{settings.whatsapp}</strong></span>
              )}
            </p>
            {settings.email && (
              <p className="text-xs text-slate-500">Email: {settings.email}</p>
            )}
            {settings.taxNumber && (
              <p className="text-xs font-mono text-slate-600 mt-0.5">
                NTN / Reg: <strong>{settings.taxNumber}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <span className="text-[11px] font-bold tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 uppercase mb-2">
            {copyType}
          </span>
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
            {receiptTitle}
          </h2>
          <div className="mt-1 space-y-0.5 text-xs text-slate-600 font-mono">
            <div>
              <span className="text-slate-400">Voucher No: </span>
              <strong className="text-slate-900 text-sm">{receipt.receiptNumber}</strong>
            </div>
            <div>
              <span className="text-slate-400">Date: </span>
              <span>{formatDate(receipt.date)}</span>
            </div>
            <div>
              <span className="text-slate-400">Time: </span>
              <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Party & Voucher Information Box */}
      <div className="grid grid-cols-2 gap-4 my-5 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            {isOutgoing ? 'Beneficiary / Payee Details' : 'Payer / Customer Details'}
          </span>
          <div className="text-sm font-bold text-slate-950">
            {receipt.partyName}
          </div>
          {receipt.partyPhone && (
            <div className="text-slate-600 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{receipt.partyPhone}</span>
            </div>
          )}
          {receipt.partyAddress && (
            <div className="text-slate-500 text-[11px]">
              {receipt.partyAddress}
            </div>
          )}
        </div>

        <div className="space-y-1.5 border-l border-slate-200 pl-4">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Transaction Specifications
          </span>
          <div className="flex justify-between">
            <span className="text-slate-500">Payment Mode:</span>
            <span className="font-semibold text-emerald-800">{receipt.paymentMethod}</span>
          </div>
          {receipt.reference && (
            <div className="flex justify-between">
              <span className="text-slate-500">Reference / Slip #:</span>
              <span className="font-mono font-semibold text-slate-900">{receipt.reference}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Authorized Cashier:</span>
            <span className="font-medium text-slate-800">{cashierName}</span>
          </div>
        </div>
      </div>

      {/* Main Financial Table */}
      <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden my-4">
        <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
          <tr>
            <th className="py-2.5 px-4 text-left">Description / Particulars</th>
            <th className="py-2.5 px-4 text-left">Mode</th>
            <th className="py-2.5 px-4 text-left">Reference</th>
            <th className="py-2.5 px-4 text-right">Amount ({settings.currency})</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-mono">
          <tr className="bg-white">
            <td className="py-3 px-4 font-sans">
              <div className="font-bold text-slate-900 text-sm">
                {isOutgoing ? 'Payment made towards account balance' : 'Payment received towards account balance'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-normal">
                {receipt.notes || 'Full / partial ledger recovery settlement.'}
              </div>
            </td>
            <td className="py-3 px-4 font-sans text-slate-700">{receipt.paymentMethod}</td>
            <td className="py-3 px-4 text-slate-600">{receipt.reference || '-'}</td>
            <td className="py-3 px-4 text-right font-bold text-slate-950 text-base tabular-nums">
              {formatCurrency(receipt.amount, settings.currency)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Amount in words & Ledger Statement */}
      <div className="grid grid-cols-12 gap-4 items-start my-4">
        <div className="col-span-7 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Amount in Words:
          </div>
          <div className="text-xs font-semibold text-slate-900 mt-0.5 italic">
            "{numberToWords(receipt.amount)}"
          </div>
          {receipt.notes && (
            <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-700">Remarks: </span>
              {receipt.notes}
            </div>
          )}
        </div>

        <div className="col-span-5 bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-1.5 text-xs font-mono">
          {receipt.previousBalance !== undefined && (
            <div className="flex justify-between text-slate-600">
              <span className="font-sans">Previous Balance:</span>
              <span className="tabular-nums font-semibold">
                {formatCurrency(receipt.previousBalance, settings.currency)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1.5">
            <span className="font-sans">Amount Paid:</span>
            <span className="tabular-nums text-emerald-700">
              {isOutgoing ? '-' : '+'}
              {formatCurrency(receipt.amount, settings.currency)}
            </span>
          </div>
          {receipt.currentBalance !== undefined && (
            <div className="flex justify-between text-slate-950 font-bold border-t border-slate-300 pt-1.5">
              <span className="font-sans">Net Balance Remaining:</span>
              <span className="tabular-nums text-amber-700 text-sm">
                {formatCurrency(receipt.currentBalance, settings.currency)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Official Signatures & Stamp section */}
      <div className="pt-10 pb-4 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
        <div>
          <div className="border-t border-slate-400 pt-1.5 mx-auto w-40 font-medium text-slate-700">
            {isOutgoing ? 'Paid By / Cashier' : 'Customer / Payer'}
          </div>
          <p className="text-[10px] text-slate-400">Signature / Thumb Impression</p>
        </div>

        <div>
          <div className="border border-dashed border-slate-300 rounded h-14 w-28 mx-auto flex items-center justify-center text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            Store Stamp
          </div>
        </div>

        <div>
          <div className="border-t border-slate-400 pt-1.5 mx-auto w-40 font-medium text-slate-700">
            Authorized Signature
          </div>
          <p className="text-[10px] text-slate-400">{settings.shopName}</p>
        </div>
      </div>

      {/* Official Footer Note */}
      <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-mono">
        <span>MobiFlow Software · Complete Mobile Shop POS & Management System</span>
        <span>Original computer generated voucher · No physical correction valid</span>
      </div>
    </div>
  );
};
