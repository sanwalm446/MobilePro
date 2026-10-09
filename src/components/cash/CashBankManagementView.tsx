import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  DollarSign,
  Download,
  Calendar,
  X,
  CreditCard,
  Building,
  Printer,
  Receipt,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { CashTransaction, CashTxType, CashTxCategory, PaymentMethod } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PaymentReceiptModal, PaymentReceiptData } from '../payments/PaymentReceiptModal';
import { ShopLogo } from '../common/ShopLogo';

interface CashBankManagementViewProps {
  initialSearchQuery?: string;
}

export const CashBankManagementView: React.FC<CashBankManagementViewProps> = ({
  initialSearchQuery,
}) => {
  const { cashTransactions, recordCashTransaction, settings } = useShop();

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [typeFilter, setTypeFilter] = useState<'All' | CashTxType>('All');
  const [methodFilter, setMethodFilter] = useState<'All' | PaymentMethod>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceiptData | null>(null);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Form State
  const [txType, setTxType] = useState<CashTxType>('Cash In');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<CashTxCategory>('Deposit');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Calculations
  const totalCashIn = useMemo(
    () =>
      cashTransactions
        .filter((tx) => tx.type === 'Cash In')
        .reduce((sum, tx) => sum + tx.amount, 0),
    [cashTransactions]
  );

  const totalCashOut = useMemo(
    () =>
      cashTransactions
        .filter((tx) => tx.type === 'Cash Out')
        .reduce((sum, tx) => sum + tx.amount, 0),
    [cashTransactions]
  );

  const currentBalance = totalCashIn - totalCashOut;

  // Filtered transactions
  const filteredTxs = useMemo(() => {
    return cashTransactions.filter((tx) => {
      if (typeFilter !== 'All' && tx.type !== typeFilter) return false;
      if (methodFilter !== 'All' && tx.paymentMethod !== methodFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tx.description.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          (tx.reference && tx.reference.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [cashTransactions, typeFilter, methodFilter, searchQuery]);

  const handleOpenAdd = () => {
    setTxType('Cash In');
    setAmount(0);
    setCategory('Deposit');
    setDescription('');
    setPaymentMethod('Cash');
    setDate(new Date().toISOString().split('T')[0]);
    setReference('');
    setNotes('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (amount <= 0) {
      setFormError('Amount must be greater than zero.');
      return;
    }

    if (!description.trim()) {
      setFormError('Description is required.');
      return;
    }

    recordCashTransaction({
      type: txType,
      amount: Number(amount),
      category,
      description: description.trim(),
      paymentMethod,
      date,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setIsAddModalOpen(false);
  };

  const handlePrintCashReceipt = (tx: CashTransaction) => {
    const isOut = tx.type === 'Cash Out';
    const receiptData: PaymentReceiptData = {
      receiptNumber: tx.reference || `TX-${tx.id.slice(-6).toUpperCase()}`,
      receiptType: isOut ? 'cash_out' : 'cash_in',
      title: isOut ? 'Cash Payment Voucher' : 'Cash Receipt Voucher',
      date: tx.date,
      partyName: tx.description || (isOut ? 'Cash Disbursement' : 'Cash Inflow'),
      amount: tx.amount,
      paymentMethod: tx.paymentMethod,
      reference: tx.reference,
      notes: `Category: ${tx.category} · ${tx.notes || ''}`.trim(),
    };
    setSelectedReceipt(receiptData);
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
              <span>Cash & Bank Management</span>
              <span className="text-xs font-semibold text-slate-500 font-normal hidden sm:inline">
                · {settings.shopName}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Single-entry cash register and bank ledger for sales, purchases, payments, withdrawals & deposits.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Record Cash In / Out</span>
        </button>
      </div>

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block mb-1">Opening Cash Balance</span>
          <div className="text-lg font-bold font-mono text-slate-900">
            {formatCurrency(settings.openingCashBalance, settings.currency)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Baseline start capital</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500">Total Cash In</span>
            <div className="p-1 rounded bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold font-mono text-emerald-700">
            +{formatCurrency(totalCashIn, settings.currency)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Sales, customer dues & deposits</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500">Total Cash Out</span>
            <div className="p-1 rounded bg-rose-50 text-rose-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold font-mono text-rose-700">
            -{formatCurrency(totalCashOut, settings.currency)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Purchases, bills & expenses</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-emerald-900">Current Net Cash Balance</span>
            <div className="p-1 rounded bg-emerald-600 text-white">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-800">
            {formatCurrency(currentBalance, settings.currency)}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
            Register drawer + Bank funds
          </span>
        </div>
      </div>

      {/* Filter and Transaction Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search description, reference..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
            >
              <option value="All">Type: All</option>
              <option value="Cash In">Cash In (Inflow)</option>
              <option value="Cash Out">Cash Out (Outflow)</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
            >
              <option value="All">Method: All</option>
              <option value="Cash">Cash in Hand</option>
              <option value="Bank Transfer">Bank Account</option>
              <option value="EasyPaisa">EasyPaisa</option>
              <option value="JazzCash">JazzCash</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3">Ref #</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Receipt & PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No cash transactions recorded for this filter.
                  </td>
                </tr>
              ) : (
                filteredTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-3 px-4">
                      {tx.type === 'Cash In' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <ArrowDownLeft className="w-3 h-3" />
                          <span>Cash In</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <ArrowUpRight className="w-3 h-3" />
                          <span>Cash Out</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{tx.category}</td>
                    <td className="py-3 px-4 text-slate-800 max-w-sm font-medium">{tx.description}</td>
                    <td className="py-3 px-3 text-slate-600">{tx.paymentMethod}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{tx.reference || '-'}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold">
                      <span className={tx.type === 'Cash In' ? 'text-emerald-700' : 'text-slate-900'}>
                        {tx.type === 'Cash In' ? '+' : '-'}
                        {formatCurrency(tx.amount, settings.currency)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handlePrintCashReceipt(tx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors shadow-2xs"
                        title="Print A4 or 80mm Receipt / Download PDF"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Cash In / Out Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-sm text-slate-900">Record Cash In / Cash Out</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {formError}
                </div>
              )}

              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setTxType('Cash In');
                    setCategory('Deposit');
                  }}
                  className={`py-1.5 font-semibold rounded-md transition-colors ${
                    txType === 'Cash In'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  + Cash In (Deposit/Income)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxType('Cash Out');
                    setCategory('Withdrawal');
                  }}
                  className={`py-1.5 font-semibold rounded-md transition-colors ${
                    txType === 'Cash Out'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  - Cash Out (Withdrawal)
                </button>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Amount ({settings.currency}) *
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

              <div>
                <label className="block text-slate-600 font-medium mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CashTxCategory)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                >
                  {txType === 'Cash In' ? (
                    <>
                      <option value="Deposit">Owner Capital Deposit</option>
                      <option value="Other Income">Other Shop Income</option>
                      <option value="Supplier Refund">Supplier Refund</option>
                    </>
                  ) : (
                    <>
                      <option value="Withdrawal">Owner Cash Drawing / Withdrawal</option>
                      <option value="Repair Expense">Mobile Repair Tool / Parts</option>
                      <option value="Other Expense">Miscellaneous Shop Expense</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Owner added extra cash for stock buying"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Method / Account</label>
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
                  placeholder="e.g. Bank Slip # 10482"
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
                  Record Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Voucher & Payment Receipt Modal (A4 & 80mm with PDF Export) */}
      <PaymentReceiptModal
        isOpen={!!selectedReceipt}
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
};
