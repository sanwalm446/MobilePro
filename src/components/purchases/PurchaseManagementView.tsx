import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Truck,
  CreditCard,
  CheckCircle,
  FileText,
  X,
  Smartphone,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { MobileCondition, PaymentMethod } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ShopLogo } from '../common/ShopLogo';

interface PurchaseManagementViewProps {
  onOpenSupplierLedger?: (supplierId: string) => void;
  initialSearchQuery?: string;
}

export const PurchaseManagementView: React.FC<PurchaseManagementViewProps> = ({
  onOpenSupplierLedger,
  initialSearchQuery,
}) => {
  const { purchases, suppliers, recordPurchase, settings } = useShop();

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [isNewPurchaseModalOpen, setIsNewPurchaseModalOpen] = useState(false);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Form State
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('Official PTA Approved');
  const [ram, setRam] = useState('8GB');
  const [storage, setStorage] = useState('256GB');
  const [color, setColor] = useState('Black');
  const [condition, setCondition] = useState<MobileCondition>('New');
  const [imei1, setImei1] = useState('');
  const [imei2, setImei2] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [warrantyPeriod, setWarrantyPeriod] = useState('1 Year Official Brand Warranty');
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState(
    new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const remainingPayable = Math.max(0, (purchasePrice || 0) - (paymentAmount || 0));

  const handleOpenAddPurchase = () => {
    setSupplierId(suppliers[0]?.id || '');
    setBrand('');
    setModel('');
    setVariant('Official PTA Approved');
    setRam('8GB');
    setStorage('256GB');
    setColor('');
    setCondition('New');
    setImei1('');
    setImei2('');
    setSerialNumber('');
    setPurchasePrice(0);
    setSalePrice(0);
    setPaymentAmount(0);
    setPaymentMethod('Cash');
    setWarrantyPeriod('1 Year Official Brand Warranty');
    setNotes('');
    setFormError('');
    setIsNewPurchaseModalOpen(true);
  };

  const handlePurchasePriceChange = (val: number) => {
    setPurchasePrice(val);
    setPaymentAmount(val); // default full cash
    setSalePrice(Math.round(val * 1.08)); // default 8% margin
  };

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!supplierId) {
      setFormError('Please select a supplier.');
      return;
    }

    if (!brand.trim() || !model.trim()) {
      setFormError('Brand and Model are required.');
      return;
    }

    if (!imei1.trim() || imei1.trim().length < 10) {
      setFormError('Please enter a valid IMEI 1 (minimum 10 digits).');
      return;
    }

    if (purchasePrice <= 0 || salePrice <= 0) {
      setFormError('Purchase Price and Sale Price must be greater than zero.');
      return;
    }

    const res = recordPurchase({
      supplierId,
      mobileData: {
        brand: brand.trim(),
        model: model.trim(),
        variant: variant.trim(),
        ram: ram.trim(),
        storage: storage.trim(),
        color: color.trim() || 'Standard',
        imei1: imei1.trim(),
        imei2: imei2.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        condition,
        purchasePrice: Number(purchasePrice),
        salePrice: Number(salePrice),
        purchaseDate,
        warrantyPeriod: warrantyPeriod.trim(),
        warrantyExpiryDate,
        notes: notes.trim() || undefined,
      },
      paymentAmount: Number(paymentAmount),
      paymentMethod,
      purchaseDate,
      notes: notes.trim() || undefined,
    });

    if (!res.success) {
      setFormError(res.message);
      return;
    }

    setIsNewPurchaseModalOpen(false);
  };

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.purchaseNumber.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.imei1.includes(q)
      );
    });
  }, [purchases, searchQuery]);

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
              <span>Purchase Management</span>
              <span className="text-xs font-semibold text-slate-500 font-normal hidden sm:inline">
                · {settings.shopName}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Record inward mobile stock with cash/credit terms, auto-add to inventory and update supplier ledger.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddPurchase}
          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Mobile Purchase</span>
        </button>
      </div>

      {/* Purchases Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search purchases by number, supplier, IMEI..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="text-xs text-slate-500">
            Total Inward Purchases: <strong className="text-slate-800">{filteredPurchases.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Purchase Bill #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Mobile & IMEI</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Paid Amount</th>
                <th className="py-3 px-3 text-right">Remaining Payable</th>
                <th className="py-3 px-3">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No purchases recorded yet. Click "New Mobile Purchase" to record inventory inward.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {pur.purchaseNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(pur.purchaseDate)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{pur.supplierName}</div>
                      {onOpenSupplierLedger && (
                        <button
                          onClick={() => onOpenSupplierLedger(pur.supplierId)}
                          className="text-[10px] text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          View Ledger →
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {pur.brand} {pur.model}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        IMEI: {pur.imei1}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatCurrency(pur.purchasePrice, settings.currency)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-emerald-700">
                      {formatCurrency(pur.paymentAmount, settings.currency)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {pur.remainingPayable > 0 ? (
                        <span className="font-bold text-rose-600">
                          {formatCurrency(pur.remainingPayable, settings.currency)}
                        </span>
                      ) : (
                        <span className="text-slate-400">Paid in Full</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {pur.paymentMethod}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      {isNewPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-sm">Record Mobile Inward Purchase</h3>
              </div>
              <button
                onClick={() => setIsNewPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {formError}
                </div>
              )}

              {/* Step 1: Supplier */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Select Wholesaler / Supplier *</span>
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 font-medium"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.companyName} ({s.name}) — Current Payable: {formatCurrency(s.remainingPayable, settings.currency)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Device Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>Mobile Phone Specifications & Condition *</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Brand *</label>
                    <input
                      type="text"
                      required
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. Apple, Samsung, Xiaomi"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Model *</label>
                    <input
                      type="text"
                      required
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. iPhone 15 Pro Max"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">PTA / Variant</label>
                    <input
                      type="text"
                      value={variant}
                      onChange={(e) => setVariant(e.target.value)}
                      placeholder="e.g. Official PTA Dual SIM"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">RAM</label>
                    <input
                      type="text"
                      value={ram}
                      onChange={(e) => setRam(e.target.value)}
                      placeholder="e.g. 8GB"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Storage</label>
                    <input
                      type="text"
                      value={storage}
                      onChange={(e) => setStorage(e.target.value)}
                      placeholder="e.g. 256GB"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Condition</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as MobileCondition)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    >
                      <option value="New">New (Box Packed)</option>
                      <option value="Used">Used</option>
                      <option value="Open Box">Open Box</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">IMEI 1 (Unique) *</label>
                    <input
                      type="text"
                      required
                      value={imei1}
                      onChange={(e) => setImei1(e.target.value)}
                      placeholder="15-digit IMEI"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">IMEI 2 (Optional)</label>
                    <input
                      type="text"
                      value={imei2}
                      onChange={(e) => setImei2(e.target.value)}
                      placeholder="Second IMEI"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Color</label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="e.g. Titanium Blue"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Purchase Terms & Pricing */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>Cost, Selling Price & Payment Terms *</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Cost Price ({settings.currency}) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={purchasePrice || ''}
                      onChange={(e) => handlePurchasePriceChange(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Planned Sale Price ({settings.currency}) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={salePrice || ''}
                      onChange={(e) => setSalePrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-emerald-700 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Paid Now ({settings.currency}) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max={purchasePrice}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Remaining Credit</label>
                    <div className="px-3 py-2 bg-slate-200/70 border border-slate-300 rounded-lg font-mono font-bold text-slate-900">
                      {formatCurrency(remainingPayable, settings.currency)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    >
                      <option value="Cash">Cash in Hand</option>
                      <option value="Bank Transfer">Bank Transfer (Meezan/HBL)</option>
                      <option value="EasyPaisa">EasyPaisa</option>
                      <option value="JazzCash">JazzCash</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Purchase Date</label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Warranty Period</label>
                    <input
                      type="text"
                      value={warrantyPeriod}
                      onChange={(e) => setWarrantyPeriod(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {remainingPayable > 0 && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs flex justify-between items-center text-purple-900">
                    <span>Credit Purchase: Pending payable added to supplier account:</span>
                    <span className="font-mono font-bold text-sm">
                      {formatCurrency(remainingPayable, settings.currency)}
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewPurchaseModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Save Purchase & Add to Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
