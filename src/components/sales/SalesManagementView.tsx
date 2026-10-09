import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  User,
  ShieldCheck,
  CheckCircle,
  Camera,
  X,
  RotateCcw,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { MobileSale, PaymentMethod } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { InvoiceModal } from '../invoices/InvoiceModal';
import { CameraBarcodeScannerModal } from '../common/CameraBarcodeScannerModal';
import { ShopLogo } from '../common/ShopLogo';

interface SalesManagementViewProps {
  initialMobileIdToSell?: string | null;
  onClearInitialMobileId?: () => void;
  onOpenCustomerReturn?: (saleId: string) => void;
  initialInvoiceIdToView?: string | null;
  initialSearchQuery?: string;
  onClearInitialInvoiceId?: () => void;
}

export const SalesManagementView: React.FC<SalesManagementViewProps> = ({
  initialMobileIdToSell,
  onClearInitialMobileId,
  onOpenCustomerReturn,
  initialInvoiceIdToView,
  initialSearchQuery,
  onClearInitialInvoiceId,
}) => {
  const { mobiles, sales, customers, recordSale, settings, hasPermission } = useShop();

  const canCreateSale = hasPermission('create_sale');
  const canApplyDiscount = hasPermission('apply_discount');
  const canViewProfit = hasPermission('view_profit');
  const canViewPurchasePrice = hasPermission('view_purchase_price');
  const canProcessReturn = hasPermission('create_customer_return');

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<MobileSale | null>(null);

  // Auto-open requested invoice from global search
  useEffect(() => {
    if (initialInvoiceIdToView) {
      const found = sales.find(
        (s) => s.id === initialInvoiceIdToView || s.invoiceNumber === initialInvoiceIdToView
      );
      if (found) {
        setSelectedInvoiceForModal(found);
      }
    }
  }, [initialInvoiceIdToView, sales]);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(!!initialMobileIdToSell);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'search' | 'pos'>('pos');

  // Form fields
  const [selectedMobileId, setSelectedMobileId] = useState<string>(initialMobileIdToSell || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCnic, setCustomerCnic] = useState('');

  const [salePrice, setSalePrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [warrantyInfo, setWarrantyInfo] = useState('');
  const [relatedExpenses, setRelatedExpenses] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Available in-stock phones
  const availableMobiles = useMemo(
    () => mobiles.filter((m) => m.status === 'In Stock'),
    [mobiles]
  );

  // When a mobile is selected, prefill price & warranty
  const handleSelectMobile = (mobileId: string) => {
    setSelectedMobileId(mobileId);
    const m = mobiles.find((item) => item.id === mobileId);
    if (m) {
      setSalePrice(m.salePrice);
      setDiscount(0);
      setAmountReceived(m.salePrice);
      setWarrantyInfo(m.warrantyPeriod);
    }
  };

  // When customer is selected from dropdown
  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    if (!custId) {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerCnic('');
      return;
    }
    const c = customers.find((cust) => cust.id === custId);
    if (c) {
      setCustomerName(c.name);
      setCustomerPhone(c.phone);
      setCustomerAddress(c.address || '');
      setCustomerCnic(c.cnic || '');
    }
  };

  const selectedMobile = useMemo(
    () => mobiles.find((m) => m.id === selectedMobileId),
    [mobiles, selectedMobileId]
  );

  const finalPrice = Math.max(0, (salePrice || 0) - (discount || 0));
  const remainingAmount = Math.max(0, finalPrice - (amountReceived || 0));
  const estimatedProfit = selectedMobile
    ? finalPrice - selectedMobile.purchasePrice - (relatedExpenses || 0)
    : 0;

  const handleOpenNewSale = () => {
    setFormError('');
    if (availableMobiles.length > 0) {
      handleSelectMobile(availableMobiles[0].id);
    } else {
      setSelectedMobileId('');
    }
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerCnic('');
    setDiscount(0);
    setRelatedExpenses(0);
    setNotes('');
    setIsNewSaleModalOpen(true);
  };

  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedMobileId) {
      setFormError('Please select a mobile phone from available stock.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setFormError('Customer Name and Phone Number are required.');
      return;
    }

    if (finalPrice <= 0) {
      setFormError('Final sale price must be greater than zero.');
      return;
    }

    const res = recordSale({
      mobileId: selectedMobileId,
      salePrice: Number(salePrice),
      discount: Number(discount),
      amountReceived: Number(amountReceived),
      paymentMethod,
      saleDate,
      customerData: {
        id: selectedCustomerId || undefined,
        name: customerName.trim(),
        phone: customerPhone.trim(),
        address: customerAddress.trim() || undefined,
        cnic: customerCnic.trim() || undefined,
      },
      relatedExpenses: Number(relatedExpenses),
      warrantyInfo: warrantyInfo.trim(),
      notes: notes.trim() || undefined,
    });

    if (!res.success) {
      setFormError(res.message);
      return;
    }

    setIsNewSaleModalOpen(false);
    if (onClearInitialMobileId) onClearInitialMobileId();
    if (res.sale) {
      setSelectedInvoiceForModal(res.sale);
    }
  };

  // Filter sales history
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.invoiceNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.customerPhone.includes(q) ||
        s.brand.toLowerCase().includes(q) ||
        s.model.toLowerCase().includes(q) ||
        s.imei1.includes(q)
      );
    });
  }, [sales, searchQuery]);

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
              <span>Mobile Sales (POS)</span>
              <span className="text-xs font-semibold text-slate-500 font-normal hidden sm:inline">
                · {settings.shopName}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Sell phones with real-time stock deduction, ledger updates, profit tracking & instant receipt.
            </p>
          </div>
        </div>

        {canCreateSale && (
          <button
            onClick={handleOpenNewSale}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Mobile Sale (POS)</span>
          </button>
        )}
      </div>

      {/* Search & Sales History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full flex gap-1.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by invoice#, customer, IMEI..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="button"
              onClick={() => {
                setScannerTarget('search');
                setIsScannerOpen(true);
              }}
              title="Scan IMEI to find past sale invoice"
              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors shrink-0"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
            </button>
          </div>

          <div className="text-xs text-slate-500">
            Total Sales Records: <strong className="text-slate-800">{filteredSales.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Sold Mobile & IMEI</th>
                <th className="py-3 px-3 text-right">Net Price</th>
                <th className="py-3 px-3 text-right">Paid Amount</th>
                <th className="py-3 px-3 text-right">Profit</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No sales recorded yet. Click "New Mobile Sale" to process your first sale.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(sale.saleDate)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{sale.customerName}</div>
                      <div className="text-[11px] text-slate-400">{sale.customerPhone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {sale.brand} {sale.model}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        IMEI: {sale.imei1}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatCurrency(sale.finalPrice, settings.currency)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      <span className="font-semibold text-emerald-700">
                        {formatCurrency(sale.amountReceived, settings.currency)}
                      </span>
                      {sale.remainingAmount > 0 && (
                        <div className="text-[10px] text-red-600 font-bold">
                          Due: {formatCurrency(sale.remainingAmount, settings.currency)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-teal-700">
                      {canViewProfit ? (
                        `+${formatCurrency(sale.profit, settings.currency)}`
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px] italic" title="Profit margin restricted">
                          ••••••
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInvoiceForModal(sale)}
                          title="Print / View Invoice"
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3 text-slate-500" />
                          <span>Invoice</span>
                        </button>
                        {onOpenCustomerReturn && canProcessReturn && (
                          <button
                            onClick={() => onOpenCustomerReturn(sale.id)}
                            title="Process Customer Return"
                            className="p-1 text-slate-400 hover:text-amber-600 rounded transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sale Modal (POS Flow) */}
      {isNewSaleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <ShopLogo
                  logoUrl={settings.logoUrl}
                  shopName={settings.shopName}
                  size="xs"
                  variant="dark"
                  rounded="md"
                />
                <div>
                  <h3 className="font-semibold text-sm leading-tight">New Mobile Sale (POS) · {settings.shopName}</h3>
                  <div className="text-[10px] text-slate-400">Generate customer invoice & update stock</div>
                </div>
              </div>
              <button
                onClick={() => setIsNewSaleModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSale} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {formError}
                </div>
              )}

              {/* Step 1: Select Mobile from Stock */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>Select Mobile Phone from Available Stock *</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setScannerTarget('pos');
                        setIsScannerOpen(true);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Scan Box IMEI</span>
                    </button>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {availableMobiles.length} in-stock
                    </span>
                  </div>
                </div>

                {availableMobiles.length === 0 ? (
                  <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    No phones currently marked 'In Stock'. Please add stock or purchase phones first.
                  </div>
                ) : (
                  <select
                    value={selectedMobileId}
                    onChange={(e) => handleSelectMobile(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none focus:border-emerald-500"
                  >
                    {availableMobiles.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.brand} {m.model} ({m.ram}/{m.storage}, {m.color}) — IMEI: {m.imei1} — Target: {formatCurrency(m.salePrice, settings.currency)} [{m.condition}]
                      </option>
                    ))}
                  </select>
                )}

                {/* Selected Mobile Details & Margin Preview */}
                {selectedMobile && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">IMEI 1:</span>
                      <span className="font-mono font-semibold text-slate-800">{selectedMobile.imei1}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">CONDITION:</span>
                      <span className="font-medium text-slate-800">{selectedMobile.condition}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">PURCHASE COST:</span>
                      <span className="font-mono font-semibold text-slate-600">
                        {canViewPurchasePrice ? (
                          formatCurrency(selectedMobile.purchasePrice, settings.currency)
                        ) : (
                          <span className="text-slate-400 italic">•••••• (Hidden)</span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">PROJECTED PROFIT:</span>
                      <span
                        className={`font-mono font-bold ${
                          estimatedProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {canViewProfit ? (
                          formatCurrency(estimatedProfit, settings.currency)
                        ) : (
                          <span className="text-slate-400 font-normal italic">•••••• (Hidden)</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Customer Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>Customer Details (Ledger Profile) *</span>
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-md outline-none"
                  >
                    <option value="">Or select existing customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Customer Full Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Tariq Mehmood"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Mobile / WhatsApp Number *</label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 0321-4567890"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Address / Area</label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="e.g. DHA Phase 5, Lahore"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">CNIC (Optional)</label>
                    <input
                      type="text"
                      value={customerCnic}
                      onChange={(e) => setCustomerCnic(e.target.value)}
                      placeholder="e.g. 35202-1234567-1"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Sale Pricing & Payment Breakdown */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>Pricing, Discount & Received Cash *</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Sale Price ({settings.currency}) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={salePrice || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSalePrice(val);
                        setAmountReceived(Math.max(0, val - discount));
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Discount ({settings.currency})</label>
                    <input
                      type="number"
                      min="0"
                      value={discount || ''}
                      onChange={(e) => {
                        const disc = Number(e.target.value);
                        setDiscount(disc);
                        setAmountReceived(Math.max(0, salePrice - disc));
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Final Amount</label>
                    <div className="px-3 py-2 bg-slate-200/70 border border-slate-300 rounded-lg font-mono font-bold text-slate-900">
                      {formatCurrency(finalPrice, settings.currency)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Amount Paid ({settings.currency}) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max={finalPrice}
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-emerald-700 outline-none focus:border-emerald-500"
                    />
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
                    <label className="block text-slate-600 font-medium mb-1">Sale Date</label>
                    <input
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Warranty Term on Bill</label>
                    <input
                      type="text"
                      value={warrantyInfo}
                      onChange={(e) => setWarrantyInfo(e.target.value)}
                      placeholder="e.g. 7 Days Checking Warranty"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {remainingAmount > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs flex justify-between items-center text-amber-800">
                    <span>Outstanding Customer Balance to be added to ledger:</span>
                    <span className="font-mono font-bold text-sm">
                      {formatCurrency(remainingAmount, settings.currency)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewSaleModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={availableMobiles.length === 0}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Complete Sale & Print Bill</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Viewer Modal */}
      <InvoiceModal
        sale={selectedInvoiceForModal}
        isOpen={!!selectedInvoiceForModal}
        onClose={() => setSelectedInvoiceForModal(null)}
      />

      {/* Camera Barcode / IMEI Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(scannedVal) => {
          if (scannerTarget === 'search') {
            setSearchQuery(scannedVal);
          } else {
            const match = availableMobiles.find(
              (m) =>
                m.imei1.includes(scannedVal) ||
                (m.imei2 && m.imei2.includes(scannedVal))
            );
            if (match) {
              handleSelectMobile(match.id);
            } else {
              setSearchQuery(scannedVal);
            }
          }
        }}
        title={
          scannerTarget === 'search'
            ? 'Scan Device IMEI to Find Sale Invoice'
            : 'Scan Device Box Barcode for POS Checkout'
        }
      />
    </div>
  );
};
