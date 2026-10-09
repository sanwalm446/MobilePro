import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowDownCircle,
  Plus,
  Search,
  DollarSign,
  Printer,
  Calendar,
  X,
  User,
  Receipt,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { CustomerPayment, PaymentMethod } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PaymentReceiptModal, PaymentReceiptData } from './PaymentReceiptModal';
import { ShopLogo } from '../common/ShopLogo';

interface CustomerPaymentsViewProps {
  initialReceiptNumber?: string | null;
  initialSearchQuery?: string;
}

export const CustomerPaymentsView: React.FC<CustomerPaymentsViewProps> = ({
  initialReceiptNumber,
  initialSearchQuery,
}) => {
  const { customerPayments, customers, recordCustomerPayment, settings } = useShop();

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceiptData | null>(null);

  // Auto-open requested receipt from global search
  useEffect(() => {
    if (initialReceiptNumber) {
      const found = customerPayments.find(
        (p) => p.receiptNumber === initialReceiptNumber || p.id === initialReceiptNumber
      );
      if (found) {
        const cust = customers.find((c) => c.id === found.customerId);
        setSelectedReceipt({
          receiptNumber: found.receiptNumber,
          receiptType: 'customer',
          title: 'Customer Payment Recovery Receipt',
          date: found.date,
          partyName: found.customerName,
          partyPhone: cust?.phone,
          partyAddress: cust?.address,
          amount: found.amount,
          paymentMethod: found.paymentMethod,
          reference: found.reference,
          notes: found.notes,
          currentBalance: cust?.remainingBalance,
          previousBalance: cust ? cust.remainingBalance + found.amount : undefined,
        });
      }
    }
  }, [initialReceiptNumber, customerPayments, customers]);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Form State
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId]
  );

  const totalCollected = useMemo(
    () => customerPayments.reduce((sum, p) => sum + p.amount, 0),
    [customerPayments]
  );

  const filteredPayments = useMemo(() => {
    return customerPayments.filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.receiptNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        (p.reference && p.reference.toLowerCase().includes(q))
      );
    });
  }, [customerPayments, searchQuery]);

  const handleViewReceipt = (payment: CustomerPayment) => {
    const cust = customers.find((c) => c.id === payment.customerId);
    const receiptData: PaymentReceiptData = {
      receiptNumber: payment.receiptNumber,
      receiptType: 'customer',
      title: 'Customer Payment Recovery Receipt',
      date: payment.date,
      partyName: payment.customerName,
      partyPhone: cust?.phone,
      partyAddress: cust?.address,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      reference: payment.reference,
      notes: payment.notes,
      currentBalance: cust?.remainingBalance,
      previousBalance: cust ? cust.remainingBalance + payment.amount : undefined,
    };
    setSelectedReceipt(receiptData);
  };

  const handleOpenAdd = () => {
    setCustomerId(customers[0]?.id || '');
    setAmount(0);
    setPaymentMethod('Cash');
    setDate(new Date().toISOString().split('T')[0]);
    setReference('');
    setNotes('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerId) {
      setFormError('Please select a customer.');
      return;
    }

    if (amount <= 0) {
      setFormError('Payment amount must be greater than zero.');
      return;
    }

    const res = recordCustomerPayment({
      customerId,
      amount: Number(amount),
      paymentMethod,
      date,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (!res.success) {
      setFormError(res.message);
      return;
    }

    setIsAddModalOpen(false);

    // Automatically open the payment receipt modal for instant printing or PDF download
    if (res.payment) {
      handleViewReceipt(res.payment);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
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
              <span>Customer Payment Receipts</span>
              <span className="text-xs font-semibold text-slate-500 font-normal hidden sm:inline">
                · {settings.shopName}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Log customer recoveries, issue A4 or 80mm thermal payment receipts, and download PDF vouchers.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Receive Customer Payment</span>
        </button>
      </div>

      {/* Overview Stat */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div>
          <span className="text-xs text-slate-500 font-medium">Total Customer Recoveries Recorded:</span>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">
            {formatCurrency(totalCollected, settings.currency)}
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400">{customerPayments.length} payment vouchers</span>
      </div>

      {/* Payment Registry Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search receipt#, customer name..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="text-xs text-slate-500">
            Total Receipts: <strong className="text-slate-800">{filteredPayments.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-3">Payment Method</th>
                <th className="py-3 px-3">Reference / Slip</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Amount Received</th>
                <th className="py-3 px-4 text-center">Receipt & PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No customer payment receipts logged yet.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(p.date)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {p.customerName}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{p.paymentMethod}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{p.reference || '-'}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{p.notes || '-'}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-700">
                      +{formatCurrency(p.amount, settings.currency)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleViewReceipt(p)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs"
                        title="Print A4 or 80mm Receipt / Download PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receive Payment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-sm text-slate-900">Receive Customer Payment</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-medium mb-1">Select Customer *</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-medium"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) — Due: {formatCurrency(c.remainingBalance, settings.currency)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomer && (
                <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center text-xs">
                  <span className="text-slate-500">Current Outstanding:</span>
                  <span className="font-mono font-bold text-amber-600 text-sm">
                    {formatCurrency(selectedCustomer.remainingBalance, settings.currency)}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Amount Received ({settings.currency}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  >
                    <option value="Cash">Cash in Hand</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Reference / Slip #</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. Bank FT-884920"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Installment 2 cleared"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
                >
                  Confirm Payment Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Receipt & Voucher Modal (A4 & 80mm with PDF Export) */}
      <PaymentReceiptModal
        isOpen={!!selectedReceipt}
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
};
