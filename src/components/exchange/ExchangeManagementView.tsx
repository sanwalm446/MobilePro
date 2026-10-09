import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Search,
  Smartphone,
  CheckCircle,
  X,
  Printer,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { ExchangeRecord, MobileCondition, PaymentMethod } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ExchangeManagementViewProps {
  initialSearchQuery?: string;
}

export const ExchangeManagementView: React.FC<ExchangeManagementViewProps> = ({
  initialSearchQuery,
}) => {
  const { exchanges, mobiles, recordMobileExchange, settings } = useShop();

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Old Mobile
  const [oldBrand, setOldBrand] = useState('');
  const [oldModel, setOldModel] = useState('');
  const [oldImei, setOldImei] = useState('');
  const [oldCondition, setOldCondition] = useState<MobileCondition>('Used');
  const [oldTradeValue, setOldTradeValue] = useState<number>(0);

  // New Mobile
  const [newMobileId, setNewMobileId] = useState('');
  const [newMobilePrice, setNewMobilePrice] = useState<number>(0);
  const [paymentReceived, setPaymentReceived] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const availableMobiles = useMemo(
    () => mobiles.filter((m) => m.status === 'In Stock'),
    [mobiles]
  );

  const selectedNewMobile = useMemo(
    () => mobiles.find((m) => m.id === newMobileId),
    [mobiles, newMobileId]
  );

  const differenceAmount = Math.max(0, (newMobilePrice || 0) - (oldTradeValue || 0));

  const handleSelectNewMobile = (mobId: string) => {
    setNewMobileId(mobId);
    const m = mobiles.find((item) => item.id === mobId);
    if (m) {
      setNewMobilePrice(m.salePrice);
      const diff = Math.max(0, m.salePrice - oldTradeValue);
      setPaymentReceived(diff);
    }
  };

  const handleTradeValueChange = (val: number) => {
    setOldTradeValue(val);
    const diff = Math.max(0, newMobilePrice - val);
    setPaymentReceived(diff);
  };

  const handleOpenAdd = () => {
    setCustomerName('');
    setCustomerPhone('');
    setOldBrand('');
    setOldModel('');
    setOldImei('');
    setOldCondition('Used');
    setOldTradeValue(0);
    if (availableMobiles.length > 0) {
      handleSelectNewMobile(availableMobiles[0].id);
    } else {
      setNewMobileId('');
      setNewMobilePrice(0);
      setPaymentReceived(0);
    }
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSubmitExchange = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim() || !customerPhone.trim()) {
      setFormError('Customer Name and Phone Number are required.');
      return;
    }

    if (!oldBrand.trim() || !oldModel.trim() || !oldImei.trim()) {
      setFormError('Old mobile Brand, Model and IMEI are required.');
      return;
    }

    if (oldTradeValue <= 0) {
      setFormError('Please enter a valid trade-in evaluation value.');
      return;
    }

    if (!newMobileId) {
      setFormError('Please select a new mobile from stock.');
      return;
    }

    const res = recordMobileExchange({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      oldMobile: {
        brand: oldBrand.trim(),
        model: oldModel.trim(),
        imei: oldImei.trim(),
        condition: oldCondition,
        tradeValue: Number(oldTradeValue),
      },
      newMobileId,
      newMobilePrice: Number(newMobilePrice),
      paymentReceived: Number(paymentReceived),
      paymentMethod,
      date,
      notes: notes.trim() || undefined,
    });

    if (!res.success) {
      setFormError(res.message);
      return;
    }

    setIsAddModalOpen(false);
  };

  const filteredExchanges = useMemo(() => {
    return exchanges.filter((e) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.exchangeNumber.toLowerCase().includes(q) ||
        e.customerName.toLowerCase().includes(q) ||
        e.oldMobileBrand.toLowerCase().includes(q) ||
        e.oldMobileModel.toLowerCase().includes(q) ||
        e.newMobileBrand.toLowerCase().includes(q) ||
        e.newMobileModel.toLowerCase().includes(q) ||
        e.oldMobileImei.includes(q) ||
        e.newMobileImei.includes(q)
      );
    });
  }, [exchanges, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Mobile Trade-In & Exchange</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Accept old phones as trade-in credit against new mobile purchases with dual-IMEI tracking.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Mobile Exchange</span>
        </button>
      </div>

      {/* Exchanges Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exchange#, IMEI, customer..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="text-xs text-slate-500">
            Total Exchanges Recorded: <strong className="text-slate-800">{filteredExchanges.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Exchange #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Old Mobile Handed In</th>
                <th className="py-3 px-4">New Mobile Given</th>
                <th className="py-3 px-3 text-right">Difference Amount</th>
                <th className="py-3 px-3 text-right">Cash Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExchanges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No mobile exchange records on file. Click "New Mobile Exchange" to process a trade-in.
                  </td>
                </tr>
              ) : (
                filteredExchanges.map((exc) => (
                  <tr key={exc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {exc.exchangeNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(exc.date)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{exc.customerName}</div>
                      <div className="text-[10px] text-slate-400">{exc.customerPhone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {exc.oldMobileBrand} {exc.oldMobileModel}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        IMEI: {exc.oldMobileImei} · Value: {formatCurrency(exc.oldMobileValue, settings.currency)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-emerald-800">
                        {exc.newMobileBrand} {exc.newMobileModel}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        IMEI: {exc.newMobileImei} · Price: {formatCurrency(exc.newMobilePrice, settings.currency)}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-medium text-slate-800">
                      {formatCurrency(exc.differenceAmount, settings.currency)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-emerald-700">
                      +{formatCurrency(exc.paymentReceived, settings.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Mobile Exchange Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-sm">Process Mobile Phone Exchange (Trade-In)</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExchange} className="p-6 space-y-5 text-xs">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {formError}
                </div>
              )}

              {/* Customer */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="font-bold text-slate-800 block text-xs">
                  1. Customer Information *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Zubair Ahmed"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Customer Phone *</label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 0301-2345678"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Old Phone (Inward Trade) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="font-bold text-slate-800 block text-xs">
                  2. Old Mobile Handed in by Customer (Inward Stock) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Brand *</label>
                    <input
                      type="text"
                      required
                      value={oldBrand}
                      onChange={(e) => setOldBrand(e.target.value)}
                      placeholder="e.g. Apple"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Model *</label>
                    <input
                      type="text"
                      required
                      value={oldModel}
                      onChange={(e) => setOldModel(e.target.value)}
                      placeholder="e.g. iPhone 12 Pro"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">IMEI *</label>
                    <input
                      type="text"
                      required
                      value={oldImei}
                      onChange={(e) => setOldImei(e.target.value)}
                      placeholder="Old phone IMEI"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Condition</label>
                    <select
                      value={oldCondition}
                      onChange={(e) => setOldCondition(e.target.value as MobileCondition)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    >
                      <option value="Used">Used</option>
                      <option value="Open Box">Open Box</option>
                      <option value="New">New</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-medium mb-1">
                      Evaluated Trade-In Value ({settings.currency}) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={oldTradeValue || ''}
                      onChange={(e) => handleTradeValueChange(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* New Phone (Outward Stock) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="font-bold text-slate-800 block text-xs">
                  3. New Mobile Taken from Available Stock *
                </label>
                {availableMobiles.length === 0 ? (
                  <p className="text-amber-700 bg-amber-50 p-3 rounded-lg">No mobiles available in stock to give.</p>
                ) : (
                  <select
                    value={newMobileId}
                    onChange={(e) => handleSelectNewMobile(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono text-xs"
                  >
                    {availableMobiles.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.brand} {m.model} ({m.ram}/{m.storage}) — IMEI: {m.imei1} — Price: {formatCurrency(m.salePrice, settings.currency)}
                      </option>
                    ))}
                  </select>
                )}

                {/* Differential Settlement */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-slate-500 mb-1">New Mobile Price</label>
                    <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900">
                      {formatCurrency(newMobilePrice, settings.currency)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Old Mobile Trade Value</label>
                    <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-700">
                      -{formatCurrency(oldTradeValue, settings.currency)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Calculated Difference</label>
                    <div className="px-3 py-2 bg-slate-200/80 border border-slate-300 rounded-lg font-mono font-bold text-emerald-800">
                      {formatCurrency(differenceAmount, settings.currency)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Cash Received from Customer ({settings.currency}) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={paymentReceived}
                      onChange={(e) => setPaymentReceived(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-sm text-emerald-700 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="EasyPaisa">EasyPaisa</option>
                      <option value="JazzCash">JazzCash</option>
                    </select>
                  </div>
                </div>
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
                  disabled={availableMobiles.length === 0}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
                >
                  Complete Exchange & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
