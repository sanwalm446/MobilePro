import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  DollarSign,
  ArrowUpRight,
  FileText,
  Printer,
  Edit2,
  Trash2,
  X,
  Phone,
  Building,
  Download,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Supplier, LedgerEntry, PaymentMethod } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ShopLogo } from '../common/ShopLogo';
import { generateLedgerPdf } from '../../utils/pdfExport';

interface SupplierManagementViewProps {
  onOpenPaySupplier?: (supplierId: string) => void;
  initialSupplierIdToView?: string | null;
  initialSupplierSearch?: string;
  onClearInitialSupplier?: () => void;
}

export const SupplierManagementView: React.FC<SupplierManagementViewProps> = ({
  onOpenPaySupplier,
  initialSupplierIdToView,
  initialSupplierSearch,
  onClearInitialSupplier,
}) => {
  const {
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierLedger,
    recordSupplierPayment,
    settings,
  } = useShop();

  const [searchQuery, setSearchQuery] = useState(initialSupplierSearch || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingLedgerSupplierId, setViewingLedgerSupplierId] = useState<string | null>(
    initialSupplierIdToView || null
  );

  useEffect(() => {
    if (initialSupplierIdToView) {
      setViewingLedgerSupplierId(initialSupplierIdToView);
    }
  }, [initialSupplierIdToView]);

  useEffect(() => {
    if (initialSupplierSearch) {
      setSearchQuery(initialSupplierSearch);
    }
  }, [initialSupplierSearch]);

  // Quick Pay Modal State
  const [quickPaySupplier, setQuickPaySupplier] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Bank Transfer');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState('');

  // Form State
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formError, setFormError] = useState('');

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.companyName.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        (s.address && s.address.toLowerCase().includes(q))
      );
    });
  }, [suppliers, searchQuery]);

  const handleOpenAdd = () => {
    setFormName('');
    setFormCompany('');
    setFormPhone('');
    setFormAddress('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormName(s.name);
    setFormCompany(s.companyName);
    setFormPhone(s.phone);
    setFormAddress(s.address);
    setFormError('');
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim() || !formPhone.trim() || !formCompany.trim()) {
      setFormError('Supplier Name, Company Name and Phone are required.');
      return;
    }

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        name: formName.trim(),
        companyName: formCompany.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim(),
      });
      setEditingSupplier(null);
    } else {
      addSupplier({
        name: formName.trim(),
        companyName: formCompany.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim(),
      });
      setIsAddModalOpen(false);
    }
  };

  const handleOpenQuickPay = (s: Supplier) => {
    setQuickPaySupplier(s);
    setPayAmount(s.remainingPayable > 0 ? s.remainingPayable : 0);
    setPayMethod('Bank Transfer');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayRef('');
    setPayNotes('');
    setPayError('');
  };

  const handleSaveQuickPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    if (!quickPaySupplier) return;
    if (payAmount <= 0) {
      setPayError('Payment amount must be greater than zero.');
      return;
    }

    const res = recordSupplierPayment({
      supplierId: quickPaySupplier.id,
      amount: Number(payAmount),
      paymentMethod: payMethod,
      date: payDate,
      reference: payRef.trim() || undefined,
      notes: payNotes.trim() || undefined,
    });

    if (!res.success) {
      setPayError(res.message);
      return;
    }

    setQuickPaySupplier(null);
  };

  const activeLedger = useMemo(() => {
    if (!viewingLedgerSupplierId) return null;
    const sup = suppliers.find((s) => s.id === viewingLedgerSupplierId);
    if (!sup) return null;
    const ledger = getSupplierLedger(sup.id);
    return { supplier: sup, entries: ledger };
  }, [viewingLedgerSupplierId, suppliers, getSupplierLedger]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Supplier & Wholesaler Ledgers</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track inward stock bills, payments made and outstanding supplier payables.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Supplier Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search supplier by company, name, phone..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="text-xs text-slate-500">
            Total Wholesalers: <strong className="text-slate-800">{filteredSuppliers.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Company & Contact</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Location / Mall</th>
                <th className="py-3 px-3 text-right">Total Purchases</th>
                <th className="py-3 px-3 text-right">Total Paid</th>
                <th className="py-3 px-3 text-right">Outstanding Payable</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No suppliers found. Click "Add New Supplier" to create a supplier account.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-sm">{sup.companyName}</div>
                      <div className="text-[11px] text-slate-500">Contact: {sup.name}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{sup.phone}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">{sup.address}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                      {formatCurrency(sup.totalPurchases, settings.currency)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-700">
                      {formatCurrency(sup.totalPaid, settings.currency)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {sup.remainingPayable > 0 ? (
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {formatCurrency(sup.remainingPayable, settings.currency)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Nil Due</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenQuickPay(sup)}
                          title="Pay Supplier"
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-[11px] font-semibold border border-purple-200 transition-colors flex items-center gap-1"
                        >
                          <ArrowUpRight className="w-3 h-3" />
                          <span>Pay</span>
                        </button>
                        <button
                          onClick={() => setViewingLedgerSupplierId(sup.id)}
                          title="View Date-wise Ledger"
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3 text-slate-500" />
                          <span>Ledger</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(sup)}
                          title="Edit Supplier"
                          className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Date-wise Supplier Ledger Modal */}
      {activeLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-900 text-white">
              <div>
                <h3 className="font-semibold text-sm">
                  Supplier Ledger: {activeLedger.supplier.companyName} ({activeLedger.supplier.name})
                </h3>
                <p className="text-[11px] text-slate-300">
                  Phone: {activeLedger.supplier.phone} · Pending Payable: {formatCurrency(activeLedger.supplier.remainingPayable, settings.currency)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const el = document.getElementById('printable-supplier-ledger-area');
                    if (el) await generateLedgerPdf(el, activeLedger.supplier.companyName, 'supplier');
                  }}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors flex items-center gap-1 shadow-xs"
                  title="Download Ledger as PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded transition-colors flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setViewingLedgerSupplierId(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div id="printable-supplier-ledger-area" className="p-6 space-y-4">
              {/* Official Store Stationery Header for Supplier Documents */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <ShopLogo
                    logoUrl={settings.logoUrl}
                    shopName={settings.shopName}
                    size="lg"
                    variant="light"
                    rounded="xl"
                    showBorder
                  />
                  <div>
                    <h2 className="font-bold text-base text-slate-900 leading-tight">{settings.shopName}</h2>
                    {settings.tagline && <p className="text-[10px] text-slate-500">{settings.tagline}</p>}
                    <p className="text-[10px] text-slate-600 mt-0.5">{settings.address}{settings.city ? `, ${settings.city}` : ''}</p>
                    <p className="text-[10px] text-slate-600 font-medium">Ph: {settings.phone}{settings.whatsapp ? ` · WA: ${settings.whatsapp}` : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    SUPPLIER VOUCHER & LEDGER
                  </span>
                  <div className="text-xs text-slate-500 mt-1 font-mono">Date: {new Date().toISOString().split('T')[0]}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Purchases</span>
                  <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                    {formatCurrency(activeLedger.supplier.totalPurchases, settings.currency)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Paid</span>
                  <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                    {formatCurrency(activeLedger.supplier.totalPaid, settings.currency)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Pending Payable</span>
                  <div className="text-base font-bold font-mono text-rose-600 mt-0.5">
                    {formatCurrency(activeLedger.supplier.remainingPayable, settings.currency)}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Reference</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Bill (Credit)</th>
                      <th className="py-2.5 px-3 text-right">Paid (Debit)</th>
                      <th className="py-2.5 px-3 text-right">Payable Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeLedger.entries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No transactions recorded for this supplier yet.
                        </td>
                      </tr>
                    ) : (
                      activeLedger.entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                            {formatDate(entry.date)}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{entry.type}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{entry.reference}</td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate">{entry.description}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900 font-semibold">
                            {entry.credit > 0 ? formatCurrency(entry.credit, settings.currency) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                            {entry.debit > 0 ? formatCurrency(entry.debit, settings.currency) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-rose-700">
                            {formatCurrency(entry.balance, settings.currency)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setViewingLedgerSupplierId(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Close Ledger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Pay Supplier Modal */}
      {quickPaySupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-sm text-slate-900">
                Pay Wholesaler: {quickPaySupplier.companyName}
              </h3>
              <button
                onClick={() => setQuickPaySupplier(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickPayment} className="p-5 space-y-4">
              {payError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {payError}
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-lg text-xs flex justify-between items-center">
                <span className="text-slate-500">Total Outstanding Payable:</span>
                <span className="font-mono font-bold text-rose-600 text-sm">
                  {formatCurrency(quickPaySupplier.remainingPayable, settings.currency)}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Payment Amount ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={payAmount || ''}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  >
                    <option value="Bank Transfer">Bank Transfer (Meezan/HBL)</option>
                    <option value="Cash">Cash from Register</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Bank Reference / Voucher Ref</label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="e.g. Meezan FT# 9948271"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Notes</label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="e.g. Paid against iPhone 15 Pro Max stock"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickPaySupplier(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors shadow-xs"
                >
                  Save & Update Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      {(isAddModalOpen || editingSupplier) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-sm text-slate-900">
                {editingSupplier ? 'Edit Supplier Profile' : 'Add New Supplier / Distributor'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingSupplier(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-medium mb-1">Company / Shop Name *</label>
                <input
                  type="text"
                  required
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  placeholder="e.g. Star Telecom Distribution"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Contact Person Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Malik Nadeem"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Phone / WhatsApp Number *</label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. 0321-9988771"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Market Location / Address</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. Plaza 4, Hall Road, Lahore"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingSupplier(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
                >
                  {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
