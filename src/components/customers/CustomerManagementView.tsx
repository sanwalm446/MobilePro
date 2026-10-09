import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  DollarSign,
  ArrowDownLeft,
  FileText,
  Printer,
  Edit2,
  Trash2,
  X,
  Phone,
  MapPin,
  CheckCircle,
  Download,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Customer, LedgerEntry, PaymentMethod } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ShopLogo } from '../common/ShopLogo';
import { generateLedgerPdf } from '../../utils/pdfExport';

interface CustomerManagementViewProps {
  onOpenReceivePayment?: (customerId: string) => void;
  initialCustomerIdToView?: string | null;
  initialCustomerSearch?: string;
  onClearInitialCustomer?: () => void;
}

export const CustomerManagementView: React.FC<CustomerManagementViewProps> = ({
  onOpenReceivePayment,
  initialCustomerIdToView,
  initialCustomerSearch,
  onClearInitialCustomer,
}) => {
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerLedger,
    recordCustomerPayment,
    settings,
  } = useShop();

  const [searchQuery, setSearchQuery] = useState(initialCustomerSearch || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingLedgerCustomerId, setViewingLedgerCustomerId] = useState<string | null>(
    initialCustomerIdToView || null
  );

  useEffect(() => {
    if (initialCustomerIdToView) {
      setViewingLedgerCustomerId(initialCustomerIdToView);
    }
  }, [initialCustomerIdToView]);

  useEffect(() => {
    if (initialCustomerSearch) {
      setSearchQuery(initialCustomerSearch);
    }
  }, [initialCustomerSearch]);

  // Quick Payment modal state
  const [quickPayCustomer, setQuickPayCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Cash');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState('');

  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCnic, setFormCnic] = useState('');
  const [formError, setFormError] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.cnic && c.cnic.includes(q))
      );
    });
  }, [customers, searchQuery]);

  const handleOpenAdd = () => {
    setFormName('');
    setFormPhone('');
    setFormAddress('');
    setFormCnic('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormAddress(c.address || '');
    setFormCnic(c.cnic || '');
    setFormError('');
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim() || !formPhone.trim()) {
      setFormError('Customer Name and Phone Number are required.');
      return;
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: formName.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim(),
        cnic: formCnic.trim() || undefined,
      });
      setEditingCustomer(null);
    } else {
      addCustomer({
        name: formName.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim(),
        cnic: formCnic.trim() || undefined,
      });
      setIsAddModalOpen(false);
    }
  };

  const handleOpenQuickPay = (c: Customer) => {
    setQuickPayCustomer(c);
    setPayAmount(c.remainingBalance > 0 ? c.remainingBalance : 0);
    setPayMethod('Cash');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayNotes('');
    setPayError('');
  };

  const handleSaveQuickPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    if (!quickPayCustomer) return;
    if (payAmount <= 0) {
      setPayError('Payment amount must be greater than zero.');
      return;
    }

    const res = recordCustomerPayment({
      customerId: quickPayCustomer.id,
      amount: Number(payAmount),
      paymentMethod: payMethod,
      date: payDate,
      notes: payNotes.trim() || undefined,
    });

    if (!res.success) {
      setPayError(res.message);
      return;
    }

    setQuickPayCustomer(null);
  };

  const activeLedger = useMemo(() => {
    if (!viewingLedgerCustomerId) return null;
    const cust = customers.find((c) => c.id === viewingLedgerCustomerId);
    if (!cust) return null;
    const ledger = getCustomerLedger(cust.id);
    return { customer: cust, entries: ledger };
  }, [viewingLedgerCustomerId, customers, getCustomerLedger]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Customer Ledgers & Accounts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain customer khata with date-wise sales, payments received and outstanding receivables.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Customer Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer by name, phone, CNIC..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="text-xs text-slate-500">
            Total Customer Accounts: <strong className="text-slate-800">{filteredCustomers.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone / WhatsApp</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-3 text-right">Total Purchases</th>
                <th className="py-3 px-3 text-right">Total Paid</th>
                <th className="py-3 px-3 text-right">Remaining Balance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No customers found. Click "Add New Customer" to register one.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-sm">{cust.name}</div>
                      {cust.cnic && <div className="text-[10px] text-slate-400 font-mono">CNIC: {cust.cnic}</div>}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{cust.phone}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">{cust.address || '-'}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                      {formatCurrency(cust.totalPurchases, settings.currency)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-700">
                      {formatCurrency(cust.totalPaid, settings.currency)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {cust.remainingBalance > 0 ? (
                        <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {formatCurrency(cust.remainingBalance, settings.currency)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Cleared</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenQuickPay(cust)}
                          title="Receive Payment"
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-semibold border border-emerald-200 transition-colors flex items-center gap-1"
                        >
                          <ArrowDownLeft className="w-3 h-3" />
                          <span>Pay</span>
                        </button>
                        <button
                          onClick={() => setViewingLedgerCustomerId(cust.id)}
                          title="View Date-wise Ledger"
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3 text-slate-500" />
                          <span>Ledger</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(cust)}
                          title="Edit Customer"
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

      {/* Date-wise Customer Ledger Modal */}
      {activeLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-900 text-white">
              <div>
                <h3 className="font-semibold text-sm">
                  Customer Ledger: {activeLedger.customer.name}
                </h3>
                <p className="text-[11px] text-slate-300">
                  Phone: {activeLedger.customer.phone} · Outstanding: {formatCurrency(activeLedger.customer.remainingBalance, settings.currency)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const el = document.getElementById('printable-customer-ledger-area');
                    if (el) await generateLedgerPdf(el, activeLedger.customer.name, 'customer');
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
                  onClick={() => setViewingLedgerCustomerId(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div id="printable-customer-ledger-area" className="p-6 space-y-4">
              {/* Official Store Stationery Header for Customer Documents */}
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
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    CUSTOMER ACCOUNT STATEMENT
                  </span>
                  <div className="text-xs text-slate-500 mt-1 font-mono">Date: {new Date().toISOString().split('T')[0]}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Purchases</span>
                  <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                    {formatCurrency(activeLedger.customer.totalPurchases, settings.currency)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Paid</span>
                  <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                    {formatCurrency(activeLedger.customer.totalPaid, settings.currency)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Balance Due (Receivable)</span>
                  <div className="text-base font-bold font-mono text-amber-600 mt-0.5">
                    {formatCurrency(activeLedger.customer.remainingBalance, settings.currency)}
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
                      <th className="py-2.5 px-3 text-right">Debit (Sales)</th>
                      <th className="py-2.5 px-3 text-right">Credit (Paid)</th>
                      <th className="py-2.5 px-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeLedger.entries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No transactions recorded for this customer yet.
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
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900">
                            {entry.debit > 0 ? formatCurrency(entry.debit, settings.currency) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                            {entry.credit > 0 ? formatCurrency(entry.credit, settings.currency) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
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
                  onClick={() => setViewingLedgerCustomerId(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Close Ledger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Receive Payment Modal */}
      {quickPayCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-sm text-slate-900">
                Receive Payment from {quickPayCustomer.name}
              </h3>
              <button
                onClick={() => setQuickPayCustomer(null)}
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
                <span className="text-slate-500">Current Outstanding:</span>
                <span className="font-mono font-bold text-amber-600 text-sm">
                  {formatCurrency(quickPayCustomer.remainingBalance, settings.currency)}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Amount Received ({settings.currency}) *
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
                    <option value="Cash">Cash in Hand</option>
                    <option value="Bank Transfer">Bank Transfer (Meezan/HBL)</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
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
                  <label className="block text-slate-600 font-medium mb-1">Notes / Transaction Ref</label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="e.g. Cleared installment, Bank TID# 8849"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickPayCustomer(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
                >
                  Save & Update Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {(isAddModalOpen || editingCustomer) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-sm text-slate-900">
                {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer Profile'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCustomer(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-medium mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Tariq Mehmood"
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
                  placeholder="e.g. 0321-4567890"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Address / Shop Location</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. House 42, Sector Y, DHA, Lahore"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">CNIC Number (Optional)</label>
                <input
                  type="text"
                  value={formCnic}
                  onChange={(e) => setFormCnic(e.target.value)}
                  placeholder="e.g. 35202-1234567-1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCustomer(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
                >
                  {editingCustomer ? 'Update Profile' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
