import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  Plus,
  Search,
  CheckCircle,
  Truck,
  User,
  X,
  Smartphone,
  ArrowRight,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { ReturnRecord } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ReturnsManagementViewProps {
  initialSaleIdToReturn?: string | null;
  onClearInitialSaleId?: () => void;
  initialSearchQuery?: string;
}

export const ReturnsManagementView: React.FC<ReturnsManagementViewProps> = ({
  initialSaleIdToReturn,
  onClearInitialSaleId,
  initialSearchQuery,
}) => {
  const {
    returns,
    sales,
    mobiles,
    suppliers,
    recordCustomerReturn,
    recordSupplierReturn,
    settings,
  } = useShop();

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);
  const [returnTypeModal, setReturnTypeModal] = useState<'customer' | 'supplier' | null>(
    initialSaleIdToReturn ? 'customer' : null
  );

  // Customer Return Form State
  const [selectedSaleId, setSelectedSaleId] = useState(initialSaleIdToReturn || '');
  const [custRefundAmount, setCustRefundAmount] = useState<number>(0);
  const [custReason, setCustReason] = useState('Hardware Fault within checking warranty');
  const [custDate, setCustDate] = useState(new Date().toISOString().split('T')[0]);
  const [custNotes, setCustNotes] = useState('');
  const [custError, setCustError] = useState('');

  // Supplier Return Form State
  const [selectedMobileId, setSelectedMobileId] = useState('');
  const [supRefundAmount, setSupRefundAmount] = useState<number>(0);
  const [supReason, setSupReason] = useState('Dead on Arrival (DOA) / Defective Unit');
  const [supDate, setSupDate] = useState(new Date().toISOString().split('T')[0]);
  const [supNotes, setSupNotes] = useState('');
  const [supError, setSupError] = useState('');

  // Available sold mobiles for customer returns
  const returnableSales = useMemo(() => {
    return sales;
  }, [sales]);

  // Available in-stock mobiles for supplier returns
  const returnableToSupplierMobiles = useMemo(() => {
    return mobiles.filter((m) => m.status === 'In Stock');
  }, [mobiles]);

  const selectedSale = useMemo(
    () => sales.find((s) => s.id === selectedSaleId),
    [sales, selectedSaleId]
  );

  const selectedInStockMobile = useMemo(
    () => mobiles.find((m) => m.id === selectedMobileId),
    [mobiles, selectedMobileId]
  );

  const handleSelectSale = (saleId: string) => {
    setSelectedSaleId(saleId);
    const s = sales.find((item) => item.id === saleId);
    if (s) {
      setCustRefundAmount(s.amountReceived);
    }
  };

  const handleSelectMobileForSupplierReturn = (mobId: string) => {
    setSelectedMobileId(mobId);
    const m = mobiles.find((item) => item.id === mobId);
    if (m) {
      setSupRefundAmount(m.purchasePrice);
    }
  };

  const handleSaveCustomerReturn = (e: React.FormEvent) => {
    e.preventDefault();
    setCustError('');

    if (!selectedSaleId) {
      setCustError('Please select a sale record.');
      return;
    }

    if (!custReason.trim()) {
      setCustError('Return reason is required.');
      return;
    }

    const res = recordCustomerReturn({
      saleId: selectedSaleId,
      refundAmount: Number(custRefundAmount),
      reason: custReason.trim(),
      date: custDate,
      notes: custNotes.trim() || undefined,
    });

    if (!res.success) {
      setCustError(res.message);
      return;
    }

    setReturnTypeModal(null);
    if (onClearInitialSaleId) onClearInitialSaleId();
  };

  const handleSaveSupplierReturn = (e: React.FormEvent) => {
    e.preventDefault();
    setSupError('');

    if (!selectedMobileId) {
      setSupError('Please select a mobile to return to wholesaler.');
      return;
    }

    if (!supReason.trim()) {
      setSupError('Return reason is required.');
      return;
    }

    const res = recordSupplierReturn({
      mobileId: selectedMobileId,
      refundAmount: Number(supRefundAmount),
      reason: supReason.trim(),
      date: supDate,
      notes: supNotes.trim() || undefined,
    });

    if (!res.success) {
      setSupError(res.message);
      return;
    }

    setReturnTypeModal(null);
  };

  const filteredReturns = useMemo(() => {
    return returns.filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.returnNumber.toLowerCase().includes(q) ||
        r.brand.toLowerCase().includes(q) ||
        r.model.toLowerCase().includes(q) ||
        r.imei1.includes(q) ||
        r.partyName.toLowerCase().includes(q)
      );
    });
  }, [returns, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Returns Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Handle customer warranty returns (phone back to stock) and supplier RMA returns (reduce payables).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (returnableSales.length > 0) {
                handleSelectSale(returnableSales[0].id);
              }
              setCustError('');
              setReturnTypeModal('customer');
            }}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Customer Return</span>
          </button>

          <button
            onClick={() => {
              if (returnableToSupplierMobiles.length > 0) {
                handleSelectMobileForSupplierReturn(returnableToSupplierMobiles[0].id);
              }
              setSupError('');
              setReturnTypeModal('supplier');
            }}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Supplier Return</span>
          </button>
        </div>
      </div>

      {/* Returns Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by return#, IMEI, model..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="text-xs text-slate-500">
            Total Return Records: <strong className="text-slate-800">{filteredReturns.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Return #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Mobile & IMEI</th>
                <th className="py-3 px-4">Party (Customer / Wholesaler)</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4 text-right">Refund Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No return records on file.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {ret.returnNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(ret.date)}
                    </td>
                    <td className="py-3 px-4">
                      {ret.type === 'Customer Return' ? (
                        <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                          Customer Return
                        </span>
                      ) : (
                        <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[11px]">
                          Supplier Return
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {ret.brand} {ret.model}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        IMEI: {ret.imei1}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{ret.partyName}</div>
                      {ret.partyPhone && <div className="text-[10px] text-slate-400">{ret.partyPhone}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs">{ret.reason}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatCurrency(ret.refundAmount, settings.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Return Modal */}
      {returnTypeModal === 'customer' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-amber-50">
              <div className="flex items-center gap-2 text-amber-800">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-sm">Process Customer Mobile Return</h3>
              </div>
              <button
                onClick={() => setReturnTypeModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerReturn} className="p-6 space-y-4 text-xs">
              {custError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {custError}
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Select Original Sale / Invoice *
                </label>
                <select
                  value={selectedSaleId}
                  onChange={(e) => handleSelectSale(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-500 font-mono"
                >
                  {returnableSales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.invoiceNumber} — {s.brand} {s.model} (IMEI: {s.imei1}) — Sold to: {s.customerName} on {formatDate(s.saleDate)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSale && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer:</span>
                    <span className="font-semibold text-slate-800">{selectedSale.customerName} ({selectedSale.customerPhone})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Device Sold:</span>
                    <span className="font-semibold text-slate-800">{selectedSale.brand} {selectedSale.model} [IMEI: {selectedSale.imei1}]</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice Net Amount:</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(selectedSale.finalPrice, settings.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Customer Paid:</span>
                    <span className="font-mono font-bold text-emerald-700">{formatCurrency(selectedSale.amountReceived, settings.currency)}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Refund Amount to Customer ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={custRefundAmount || ''}
                    onChange={(e) => setCustRefundAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Return Date</label>
                  <input
                    type="date"
                    value={custDate}
                    onChange={(e) => setCustDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Return Reason / Defect Detail *</label>
                <input
                  type="text"
                  required
                  value={custReason}
                  onChange={(e) => setCustReason(e.target.value)}
                  placeholder="e.g. WiFi issue, Mic not working, Customer unsatisfied"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={custNotes}
                  onChange={(e) => setCustNotes(e.target.value)}
                  placeholder="e.g. Checked phone condition, box complete, refunded cash from register"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800">
                Notice: Processing this return will automatically restore the mobile back to <strong>'In Stock'</strong>, reverse sales profit, and deduct the refund from cash register.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReturnTypeModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors shadow-xs"
                >
                  Accept Return & Restore to Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Return Modal */}
      {returnTypeModal === 'supplier' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-purple-50">
              <div className="flex items-center gap-2 text-purple-800">
                <Truck className="w-4 h-4 text-purple-600" />
                <h3 className="font-semibold text-sm">Return In-Stock Mobile to Wholesaler</h3>
              </div>
              <button
                onClick={() => setReturnTypeModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplierReturn} className="p-6 space-y-4 text-xs">
              {supError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {supError}
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Select Mobile from Available Stock *
                </label>
                {returnableToSupplierMobiles.length === 0 ? (
                  <p className="text-slate-500 p-3 bg-slate-50 rounded-lg">No mobiles available in stock to return.</p>
                ) : (
                  <select
                    value={selectedMobileId}
                    onChange={(e) => handleSelectMobileForSupplierReturn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-purple-500 font-mono"
                  >
                    {returnableToSupplierMobiles.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.brand} {m.model} (IMEI: {m.imei1}) — Bought from: {m.supplierName} ({formatCurrency(m.purchasePrice, settings.currency)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedInStockMobile && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Supplier:</span>
                    <span className="font-semibold text-slate-800">{selectedInStockMobile.supplierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Purchase Price:</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(selectedInStockMobile.purchasePrice, settings.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">IMEI 1:</span>
                    <span className="font-mono font-bold text-slate-700">{selectedInStockMobile.imei1}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Debit Amount / Refund from Supplier ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={supRefundAmount || ''}
                    onChange={(e) => setSupRefundAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-sm outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Return Date</label>
                  <input
                    type="date"
                    value={supDate}
                    onChange={(e) => setSupDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">RMA Reason / Claim Detail *</label>
                <input
                  type="text"
                  required
                  value={supReason}
                  onChange={(e) => setSupReason(e.target.value)}
                  placeholder="e.g. Factory defect, Box damaged, Disapproved unit"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={supNotes}
                  onChange={(e) => setSupNotes(e.target.value)}
                  placeholder="e.g. Sent back with courier/sales agent"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReturnTypeModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returnableToSupplierMobiles.length === 0}
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
                >
                  Return to Wholesaler & Adjust Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
