import React, { useState, useEffect } from 'react';
import {
  Search,
  Smartphone,
  CheckCircle,
  Truck,
  User,
  ShieldCheck,
  Calendar,
  RotateCcw,
  ArrowLeftRight,
  Clock,
  Layers,
  FileText,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { formatCurrency, formatDate, getWarrantyBadge } from '../../utils/formatters';

interface ImeiTrackerViewProps {
  initialSearchImei?: string;
  onClearInitialImei?: () => void;
}

export const ImeiTrackerView: React.FC<ImeiTrackerViewProps> = ({
  initialSearchImei,
  onClearInitialImei,
}) => {
  const { getImeiTimeline, settings, mobiles } = useShop();

  const [inputImei, setInputImei] = useState(initialSearchImei || '');
  const [activeImei, setActiveImei] = useState(initialSearchImei || '');

  useEffect(() => {
    if (initialSearchImei) {
      setInputImei(initialSearchImei);
      setActiveImei(initialSearchImei);
    }
  }, [initialSearchImei]);

  const timelineData = activeImei ? getImeiTimeline(activeImei) : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputImei.trim()) {
      setActiveImei(inputImei.trim());
      if (onClearInitialImei) onClearInitialImei();
    }
  };

  const sampleImeis = mobiles.slice(0, 4).map((m) => m.imei1);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="max-w-2xl">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Global IMEI Lifecycle Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Instantly trace any mobile phone from supplier purchase inward, inventory specs, customer outward sale, warranty claims, returns, and trade-in exchange history.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-5 flex gap-2 max-w-xl">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputImei}
              onChange={(e) => setInputImei(e.target.value)}
              placeholder="Enter 15-digit IMEI number (IMEI 1 or IMEI 2)..."
              className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span>Track Phone</span>
          </button>
        </form>

        {/* Quick sample chips */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-500">
          <span>Quick test IMEIs:</span>
          {sampleImeis.map((imei) => (
            <button
              key={imei}
              type="button"
              onClick={() => {
                setInputImei(imei);
                setActiveImei(imei);
              }}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-mono text-slate-700 transition-colors"
            >
              {imei}
            </button>
          ))}
        </div>
      </div>

      {/* Results View */}
      {!activeImei ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
          <Smartphone className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700 text-sm">Enter an IMEI above to view full device history</p>
          <p className="mt-1">Every mobile registered in the shop maintains an immutable lifecycle log.</p>
        </div>
      ) : !timelineData || !timelineData.mobile ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
          <p className="font-semibold text-slate-800 text-sm">No device found matching IMEI "{activeImei}"</p>
          <p className="mt-1">Check whether the number was entered correctly or if this phone was never purchased in this shop.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Device Profile Header Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {timelineData.mobile.brand} {timelineData.mobile.model}
                  </h2>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{timelineData.mobile.ram}/{timelineData.mobile.storage}</span>
                    <span>·</span>
                    <span>Color: {timelineData.mobile.color}</span>
                    <span>·</span>
                    <span>{timelineData.mobile.variant}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Current Status</span>
                  <span
                    className={`font-semibold text-sm ${
                      timelineData.mobile.status === 'In Stock'
                        ? 'text-emerald-600'
                        : timelineData.mobile.status === 'Sold'
                        ? 'text-blue-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {timelineData.mobile.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">PRIMARY IMEI 1:</span>
                <span className="font-mono font-bold text-slate-900">{timelineData.mobile.imei1}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">SECONDARY IMEI 2:</span>
                <span className="font-mono font-bold text-slate-900">{timelineData.mobile.imei2 || 'N/A (Single SIM)'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">CONDITION:</span>
                <span className="font-semibold text-slate-800">{timelineData.mobile.condition}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">SERIAL NUMBER:</span>
                <span className="font-mono text-slate-700">{timelineData.mobile.serialNumber || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Lifecycle Milestones Timeline */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Complete Lifecycle Timeline</span>
            </h3>

            <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-8">
              {/* Event 1: Inward Purchase */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-purple-600 border-2 border-white shadow-xs" />
                <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-purple-900 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-purple-600" />
                      <span>Inward Stock Purchase</span>
                    </span>
                    <span className="text-slate-500 font-mono">
                      {formatDate(timelineData.mobile.purchaseDate)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 space-y-1 mt-2">
                    <div>
                      Supplier: <strong className="text-slate-900">{timelineData.mobile.supplierName}</strong>
                    </div>
                    <div>
                      Purchase Cost:{' '}
                      <strong className="font-mono text-slate-900">
                        {formatCurrency(timelineData.mobile.purchasePrice, settings.currency)}
                      </strong>
                    </div>
                    {timelineData.purchase && (
                      <div className="text-slate-500 text-[11px]">
                        Bill Number: {timelineData.purchase.purchaseNumber} · Paid:{' '}
                        {formatCurrency(timelineData.purchase.paymentAmount, settings.currency)} via{' '}
                        {timelineData.purchase.paymentMethod}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Event 2: Warranty Period */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-xs" />
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-blue-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Warranty Protection</span>
                    </span>
                    <span className="text-slate-500">
                      Expires: {formatDate(timelineData.mobile.warrantyExpiryDate)}
                    </span>
                  </div>
                  <div className="text-slate-700 mt-2">
                    <div>Warranty Type: <strong>{timelineData.mobile.warrantyPeriod}</strong></div>
                    <div className="mt-1">
                      Status:{' '}
                      <span className="font-medium text-blue-800">
                        {getWarrantyBadge(timelineData.mobile.warrantyExpiryDate).label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event 3: Outward Sale (if sold) */}
              {timelineData.sale ? (
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-xs" />
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Sold to Customer ({timelineData.sale.invoiceNumber})</span>
                      </span>
                      <span className="text-slate-500 font-mono">
                        {formatDate(timelineData.sale.saleDate)}
                      </span>
                    </div>
                    <div className="text-slate-700 space-y-1 mt-2">
                      <div>
                        Customer: <strong className="text-slate-900">{timelineData.sale.customerName}</strong> (Ph: {timelineData.sale.customerPhone})
                      </div>
                      <div>
                        Final Sale Price:{' '}
                        <strong className="font-mono text-emerald-800">
                          {formatCurrency(timelineData.sale.finalPrice, settings.currency)}
                        </strong>
                      </div>
                      <div>
                        Amount Paid: <strong className="font-mono">{formatCurrency(timelineData.sale.amountReceived, settings.currency)}</strong> ({timelineData.sale.paymentMethod})
                      </div>
                      <div>
                        Gross Sale Profit:{' '}
                        <strong className="font-mono text-teal-700">
                          +{formatCurrency(timelineData.sale.profit, settings.currency)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-slate-300 border-2 border-white" />
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500">
                    Phone has not been sold yet. Currently available in shop stock.
                  </div>
                </div>
              )}

              {/* Event 4: Returns (if any) */}
              {timelineData.returns.length > 0 && (
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-amber-500 border-2 border-white" />
                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 text-xs space-y-2">
                    <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                      <span>Return Logged</span>
                    </div>
                    {timelineData.returns.map((r) => (
                      <div key={r.id} className="text-slate-700">
                        <div>
                          Return #{r.returnNumber} on {formatDate(r.date)} ({r.type})
                        </div>
                        <div>Reason: <strong>{r.reason}</strong></div>
                        <div>Refund: {formatCurrency(r.refundAmount, settings.currency)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Event 5: Exchanges (if any) */}
              {timelineData.exchanges.length > 0 && (
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-2 border-white" />
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 text-xs space-y-2">
                    <div className="font-semibold text-indigo-900 flex items-center gap-1.5">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Trade-In Exchange Activity</span>
                    </div>
                    {timelineData.exchanges.map((ex) => (
                      <div key={ex.id} className="text-slate-700">
                        <div>
                          Exchange #{ex.exchangeNumber} on {formatDate(ex.date)} by {ex.customerName}
                        </div>
                        <div>
                          Difference Paid: {formatCurrency(ex.paymentReceived, settings.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
