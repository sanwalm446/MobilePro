import React, { useState, useEffect, useMemo } from 'react';
import {
  Headphones,
  Plus,
  Search,
  ShoppingCart,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  PackagePlus,
  Tag,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Accessory, AccessoryCategory, PaymentMethod } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface AccessoriesViewProps {
  initialAccessoryIdToEdit?: string | null;
  initialSearchQuery?: string;
}

export const AccessoriesView: React.FC<AccessoriesViewProps> = ({
  initialAccessoryIdToEdit,
  initialSearchQuery,
}) => {
  const {
    accessories,
    addAccessory,
    updateAccessory,
    deleteAccessory,
    recordAccessorySale,
    settings,
  } = useShop();

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(null);

  // Auto-open requested accessory from global search
  useEffect(() => {
    if (initialAccessoryIdToEdit) {
      const found = accessories.find((a) => a.id === initialAccessoryIdToEdit);
      if (found) {
        setEditingAccessory(found);
      }
    }
  }, [initialAccessoryIdToEdit, accessories]);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);
  const [sellingAccessory, setSellingAccessory] = useState<Accessory | null>(null);
  const [restockingAccessory, setRestockingAccessory] = useState<Accessory | null>(null);

  // Add/Edit Form
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<AccessoryCategory>('Chargers');
  const [formBrand, setFormBrand] = useState('');
  const [formQuantity, setFormQuantity] = useState<number>(10);
  const [formPurchasePrice, setFormPurchasePrice] = useState<number>(0);
  const [formSalePrice, setFormSalePrice] = useState<number>(0);
  const [formSupplier, setFormSupplier] = useState('');
  const [formMinStock, setFormMinStock] = useState<number>(5);
  const [formError, setFormError] = useState('');

  // Sell Form
  const [sellQty, setSellQty] = useState<number>(1);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [sellCustomerName, setSellCustomerName] = useState('Walk-in Customer');
  const [sellCustomerPhone, setSellCustomerPhone] = useState('');
  const [sellPaymentMethod, setSellPaymentMethod] = useState<PaymentMethod>('Cash');
  const [sellError, setSellError] = useState('');

  // Restock Form
  const [restockQty, setRestockQty] = useState<number>(10);

  const categories: AccessoryCategory[] = [
    'Chargers',
    'Data Cables',
    'Handsfree',
    'Mobile Covers',
    'Screen Protectors',
    'Power Banks',
    'Earbuds',
    'Smart Watches',
    'Other',
  ];

  const filteredAccessories = useMemo(() => {
    return accessories.filter((a) => {
      if (categoryFilter !== 'All' && a.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          a.brand.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [accessories, categoryFilter, searchQuery]);

  const handleOpenAdd = () => {
    setFormName('');
    setFormCategory('Chargers');
    setFormBrand('');
    setFormQuantity(10);
    setFormPurchasePrice(0);
    setFormSalePrice(0);
    setFormSupplier('');
    setFormMinStock(5);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (acc: Accessory) => {
    setEditingAccessory(acc);
    setFormName(acc.name);
    setFormCategory(acc.category);
    setFormBrand(acc.brand);
    setFormQuantity(acc.quantity);
    setFormPurchasePrice(acc.purchasePrice);
    setFormSalePrice(acc.salePrice);
    setFormSupplier(acc.supplier);
    setFormMinStock(acc.minStockLevel);
    setFormError('');
  };

  const handleSaveAccessory = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim() || !formBrand.trim()) {
      setFormError('Product Name and Brand are required.');
      return;
    }

    if (formPurchasePrice <= 0 || formSalePrice <= 0) {
      setFormError('Purchase and Sale prices must be positive.');
      return;
    }

    if (editingAccessory) {
      updateAccessory(editingAccessory.id, {
        name: formName.trim(),
        category: formCategory,
        brand: formBrand.trim(),
        quantity: Number(formQuantity),
        purchasePrice: Number(formPurchasePrice),
        salePrice: Number(formSalePrice),
        supplier: formSupplier.trim() || 'Wholesale Market',
        minStockLevel: Number(formMinStock),
      });
      setEditingAccessory(null);
    } else {
      addAccessory({
        name: formName.trim(),
        category: formCategory,
        brand: formBrand.trim(),
        quantity: Number(formQuantity),
        purchasePrice: Number(formPurchasePrice),
        salePrice: Number(formSalePrice),
        supplier: formSupplier.trim() || 'Wholesale Market',
        minStockLevel: Number(formMinStock),
      });
      setIsAddModalOpen(false);
    }
  };

  const handleOpenSell = (acc: Accessory) => {
    setSellingAccessory(acc);
    setSellQty(1);
    setSellPrice(acc.salePrice);
    setSellCustomerName('Walk-in Customer');
    setSellCustomerPhone('');
    setSellPaymentMethod('Cash');
    setSellError('');
  };

  const handleExecuteSell = (e: React.FormEvent) => {
    e.preventDefault();
    setSellError('');

    if (!sellingAccessory) return;

    if (sellQty <= 0) {
      setSellError('Quantity must be at least 1.');
      return;
    }

    if (sellQty > sellingAccessory.quantity) {
      setSellError(`Only ${sellingAccessory.quantity} units available in stock!`);
      return;
    }

    const res = recordAccessorySale({
      accessoryId: sellingAccessory.id,
      quantity: Number(sellQty),
      unitSalePrice: Number(sellPrice),
      paymentMethod: sellPaymentMethod,
      customerName: sellCustomerName.trim() || 'Walk-in Customer',
      customerPhone: sellCustomerPhone.trim() || undefined,
    });

    if (!res.success) {
      setSellError(res.message);
      return;
    }

    setSellingAccessory(null);
  };

  const handleExecuteRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockingAccessory) return;
    if (restockQty <= 0) return;

    updateAccessory(restockingAccessory.id, {
      quantity: restockingAccessory.quantity + Number(restockQty),
    });
    setRestockingAccessory(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Accessories Inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Chargers, cables, covers, earbuds, smart watches & power banks with low-stock alerts and instant counter sales.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Accessory</span>
        </button>
      </div>

      {/* Accessories Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search accessory name, brand..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Item Name & Category</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-3 text-center">In Stock Qty</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-4">Wholesaler</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccessories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No accessories found. Click "Add New Accessory" to register stock.
                  </td>
                </tr>
              ) : (
                filteredAccessories.map((acc) => {
                  const isBelowThree = acc.quantity < 3;
                  const isLow = acc.quantity <= acc.minStockLevel || isBelowThree;

                  return (
                    <tr
                      key={acc.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isBelowThree ? 'bg-amber-50/40 border-l-4 border-l-amber-500' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                          <span>{acc.name}</span>
                          {isBelowThree && (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                              title="Low stock reorder point alert (< 3 remaining)"
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-700 animate-pulse" />
                              <span>Reorder Alert ({acc.quantity} left)</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{acc.category}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{acc.brand}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`font-mono font-bold text-sm tabular-nums ${
                              isBelowThree ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                            }`}
                          >
                            {acc.quantity}
                          </span>
                          {isLow && (
                            <span
                              title={`Low stock alert (Quantity: ${acc.quantity}, Min: ${acc.minStockLevel})`}
                              className="text-red-500 bg-red-50 p-0.5 rounded"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                        {formatCurrency(acc.purchasePrice, settings.currency)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-emerald-700">
                        {formatCurrency(acc.salePrice, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{acc.supplier}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenSell(acc)}
                            disabled={acc.quantity === 0}
                            title="Quick Sale"
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-xs"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>Sell</span>
                          </button>
                          <button
                            onClick={() => {
                              setRestockingAccessory(acc);
                              setRestockQty(10);
                            }}
                            title="Restock Units"
                            className="p-1 text-slate-500 hover:text-emerald-600 rounded transition-colors"
                          >
                            <PackagePlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(acc)}
                            title="Edit"
                            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteAccessory(acc.id)}
                            title="Delete"
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Accessory Modal */}
      {(isAddModalOpen || editingAccessory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-sm text-slate-900">
                {editingAccessory ? 'Edit Accessory Product' : 'Add New Accessory Product'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingAccessory(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccessory} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-medium mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Apple 20W Power Adapter (Original)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as AccessoryCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="e.g. Apple, Anker, Joyroom"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Initial Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Cost Price ({settings.currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={formPurchasePrice || ''}
                    onChange={(e) => setFormPurchasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Sale Price ({settings.currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={formSalePrice || ''}
                    onChange={(e) => setFormSalePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-emerald-700 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Supplier / Wholesaler</label>
                  <input
                    type="text"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    placeholder="e.g. Star Telecom / Hall Road"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Low Stock Alert Level</label>
                  <input
                    type="number"
                    min="1"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingAccessory(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
                >
                  {editingAccessory ? 'Update Accessory' : 'Save Accessory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Sell Modal */}
      {sellingAccessory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-900 text-white">
              <h3 className="font-semibold text-sm">Sell Accessory (Counter POS)</h3>
              <button
                onClick={() => setSellingAccessory(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteSell} className="p-5 space-y-4 text-xs">
              {sellError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {sellError}
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900 text-sm">{sellingAccessory.name}</div>
                <div className="text-slate-500 mt-0.5">
                  Available in stock: <span className="font-bold font-mono text-emerald-700">{sellingAccessory.quantity} units</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Quantity to Sell *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={sellingAccessory.quantity}
                    value={sellQty}
                    onChange={(e) => setSellQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Unit Price ({settings.currency}) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex justify-between items-center text-xs">
                <span className="text-emerald-900 font-medium">Total Bill Amount:</span>
                <span className="font-mono font-bold text-base text-emerald-800">
                  {formatCurrency(sellQty * sellPrice, settings.currency)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={sellCustomerName}
                    onChange={(e) => setSellCustomerName(e.target.value)}
                    placeholder="Walk-in Customer"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Payment Method</label>
                  <select
                    value={sellPaymentMethod}
                    onChange={(e) => setSellPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  >
                    <option value="Cash">Cash in Hand</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSellingAccessory(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
                >
                  Confirm Sale & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockingAccessory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-sm text-slate-900">Restock Units</h3>
              <button
                onClick={() => setRestockingAccessory(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteRestock} className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Add units to <strong>{restockingAccessory.name}</strong> (Currently: {restockingAccessory.quantity})
              </p>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Additional Quantity to Add *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockingAccessory(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs"
                >
                  Add to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
