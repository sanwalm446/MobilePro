import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Smartphone,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Download,
  ShieldCheck,
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowLeftRight,
  AlertTriangle,
  Camera,
  X,
  Upload,
  Image as ImageIcon,
  Star,
  Check,
  ZoomIn,
  ShieldAlert,
  Globe,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Mobile, MobileCondition, MobileStatus } from '../../types';
import { formatCurrency, formatDate, getWarrantyBadge } from '../../utils/formatters';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { CameraBarcodeScannerModal } from '../common/CameraBarcodeScannerModal';
import { MarketIntelligenceModal } from '../intel/MarketIntelligenceModal';
import { processAndSecureImage } from '../../utils/imageUpload';
import {
  validateProductImageFile,
  validateProductImageBatch,
  uploadProductImageWithValidation,
} from '../../services/productImageService';

interface MobileStockViewProps {
  onOpenNewSaleForMobile?: (mobileId: string) => void;
  onTrackImei?: (imei: string) => void;
  initialMobileIdToView?: string | null;
  initialSearchQuery?: string;
  onClearInitialMobile?: () => void;
}

export const MobileStockView: React.FC<MobileStockViewProps> = ({
  onOpenNewSaleForMobile,
  onTrackImei,
  initialMobileIdToView,
  initialSearchQuery,
  onClearInitialMobile,
}) => {
  const { mobiles, addMobile, updateMobile, deleteMobile, suppliers, settings, hasPermission } = useShop();

  const canAddMobile = hasPermission('add_mobile');
  const canEditMobile = hasPermission('edit_mobile');
  const canDeleteMobile = hasPermission('delete_mobile');
  const canViewPurchasePrice = hasPermission('view_purchase_price');
  const canSellMobile = hasPermission('create_sale');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [imeiQuery, setImeiQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMobile, setEditingMobile] = useState<Mobile | null>(null);
  const [viewingMobile, setViewingMobile] = useState<Mobile | null>(null);

  // Auto-open requested mobile from global search
  useEffect(() => {
    if (initialMobileIdToView) {
      const found = mobiles.find(
        (m) =>
          m.id === initialMobileIdToView ||
          m.imei1 === initialMobileIdToView ||
          m.imei2 === initialMobileIdToView
      );
      if (found) {
        setViewingMobile(found);
      }
    }
  }, [initialMobileIdToView, mobiles]);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'search' | 'form'>('search');
  const [isIntelModalOpen, setIsIntelModalOpen] = useState(false);
  const [selectedIntelModel, setSelectedIntelModel] = useState('');

  // Image Upload States
  const [primaryImage, setPrimaryImage] = useState<string>('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addMoreInputRef = useRef<HTMLInputElement | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    variant: 'Official PTA Approved',
    ram: '8GB',
    storage: '256GB',
    color: 'Black',
    imei1: '',
    imei2: '',
    serialNumber: '',
    condition: 'New' as MobileCondition,
    purchasePrice: 0,
    salePrice: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    supplierId: suppliers[0]?.id || '',
    warrantyPeriod: '1 Year Brand Warranty',
    warrantyExpiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    notes: '',
  });

  const [formError, setFormError] = useState('');

  // Extract unique brands
  const brands = useMemo(() => {
    const list = Array.from(new Set(mobiles.map((m) => m.brand))).filter(Boolean);
    return ['All', ...list.sort()];
  }, [mobiles]);

  // Model-level in-stock count map to identify critical reorder thresholds (< 3)
  const modelStockMap = useMemo(() => {
    const map: Record<string, number> = {};
    mobiles.forEach((m) => {
      if (m.status === 'In Stock') {
        const key = `${m.brand} ${m.model}`.toLowerCase().trim();
        map[key] = (map[key] || 0) + 1;
      }
    });
    return map;
  }, [mobiles]);

  // Filtered list
  const filteredMobiles = useMemo(() => {
    return mobiles.filter((m) => {
      // General search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchGeneral =
          m.brand.toLowerCase().includes(q) ||
          m.model.toLowerCase().includes(q) ||
          m.variant.toLowerCase().includes(q) ||
          (m.serialNumber && m.serialNumber.toLowerCase().includes(q)) ||
          (m.notes && m.notes.toLowerCase().includes(q));
        if (!matchGeneral) return false;
      }

      // IMEI search
      if (imeiQuery.trim()) {
        const q = imeiQuery.trim();
        const matchImei = m.imei1.includes(q) || (m.imei2 && m.imei2.includes(q));
        if (!matchImei) return false;
      }

      // Brand filter
      if (brandFilter !== 'All' && m.brand !== brandFilter) return false;

      // Status filter
      if (statusFilter !== 'All' && m.status !== statusFilter) return false;

      // Condition filter
      if (conditionFilter !== 'All' && m.condition !== conditionFilter) return false;

      return true;
    });
  }, [mobiles, searchQuery, imeiQuery, brandFilter, statusFilter, conditionFilter]);

  const handleOpenAdd = () => {
    setFormData({
      brand: '',
      model: '',
      variant: 'Official PTA Approved',
      ram: '8GB',
      storage: '256GB',
      color: '',
      imei1: '',
      imei2: '',
      serialNumber: '',
      condition: 'New',
      purchasePrice: 0,
      salePrice: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      supplierId: suppliers[0]?.id || '',
      warrantyPeriod: '1 Year Brand Warranty',
      warrantyExpiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      notes: '',
    });
    setPrimaryImage('');
    setAdditionalImages([]);
    setUploadError('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (mobile: Mobile) => {
    setEditingMobile(mobile);
    setFormData({
      brand: mobile.brand,
      model: mobile.model,
      variant: mobile.variant,
      ram: mobile.ram,
      storage: mobile.storage,
      color: mobile.color,
      imei1: mobile.imei1,
      imei2: mobile.imei2 || '',
      serialNumber: mobile.serialNumber || '',
      condition: mobile.condition,
      purchasePrice: mobile.purchasePrice,
      salePrice: mobile.salePrice,
      purchaseDate: mobile.purchaseDate,
      supplierId: mobile.supplierId,
      warrantyPeriod: mobile.warrantyPeriod,
      warrantyExpiryDate: mobile.warrantyExpiryDate,
      notes: mobile.notes || '',
    });
    setPrimaryImage(mobile.imageUrl || (mobile.images && mobile.images[0]) || '');
    setAdditionalImages(
      mobile.images
        ? mobile.images.filter((img) => img !== (mobile.imageUrl || (mobile.images && mobile.images[0])))
        : []
    );
    setUploadError('');
    setFormError('');
  };

  // Client-Side Validated Image Upload Handlers
  const [uploadStatusText, setUploadStatusText] = useState('');

  const handlePrimaryFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Client-Side Instant Pre-Validation
    const validation = validateProductImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid product image file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadError('');
    setIsUploadingImage(true);
    setUploadStatusText('Validating file format and size...');

    try {
      const uploadRes = await uploadProductImageWithValidation(
        file,
        (progress, status) => {
          setUploadStatusText(`${status} (${progress}%)`);
        }
      );

      if (!uploadRes.success || !uploadRes.url) {
        setUploadError(uploadRes.error || 'Failed to process image.');
      } else {
        setPrimaryImage(uploadRes.url);
      }
    } catch {
      setUploadError('Unexpected error uploading image.');
    } finally {
      setIsUploadingImage(false);
      setUploadStatusText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAdditionalFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 1. Client-side Batch Pre-validation
    const batchCheck = validateProductImageBatch(files);
    if (batchCheck.invalidResults.length > 0) {
      const firstInvalid = batchCheck.invalidResults[0];
      setUploadError(
        firstInvalid.error || 'One or more selected files failed format or size validation.'
      );
      if (batchCheck.validFiles.length === 0) {
        if (addMoreInputRef.current) addMoreInputRef.current.value = '';
        return;
      }
    } else {
      setUploadError('');
    }

    setIsUploadingImage(true);
    setUploadStatusText('Processing validated images...');

    try {
      const newImages: string[] = [];
      for (let i = 0; i < batchCheck.validFiles.length; i++) {
        const file = batchCheck.validFiles[i];
        setUploadStatusText(`Securing image ${i + 1} of ${batchCheck.validFiles.length}...`);
        const res = await uploadProductImageWithValidation(file);
        if (!res.success || !res.url) {
          setUploadError(res.error || `Failed to process image ${file.name}`);
          break;
        } else {
          newImages.push(res.url);
        }
      }

      if (newImages.length > 0) {
        if (!primaryImage) {
          setPrimaryImage(newImages[0]);
          setAdditionalImages((prev) => [...prev, ...newImages.slice(1)]);
        } else {
          setAdditionalImages((prev) => [...prev, ...newImages]);
        }
      }
    } catch {
      setUploadError('Error processing additional images.');
    } finally {
      setIsUploadingImage(false);
      setUploadStatusText('');
      if (addMoreInputRef.current) addMoreInputRef.current.value = '';
    }
  };

  const handleSetAsPrimary = (imgToMakePrimary: string) => {
    if (imgToMakePrimary === primaryImage) return;
    const oldPrimary = primaryImage;
    setPrimaryImage(imgToMakePrimary);
    setAdditionalImages((prev) => {
      const filtered = prev.filter((img) => img !== imgToMakePrimary);
      return oldPrimary ? [oldPrimary, ...filtered] : filtered;
    });
  };

  const handleRemovePrimaryImage = () => {
    if (additionalImages.length > 0) {
      const nextPrimary = additionalImages[0];
      setPrimaryImage(nextPrimary);
      setAdditionalImages((prev) => prev.slice(1));
    } else {
      setPrimaryImage('');
    }
  };

  const handleRemoveAdditionalImage = (indexToRemove: number) => {
    setAdditionalImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveMobile = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.brand.trim() || !formData.model.trim()) {
      setFormError('Brand and Model are required.');
      return;
    }

    if (!formData.imei1.trim() || formData.imei1.trim().length < 10) {
      setFormError('Please enter a valid IMEI 1 (at least 10 digits).');
      return;
    }

    if (formData.purchasePrice <= 0 || formData.salePrice <= 0) {
      setFormError('Purchase Price and Sale Price must be greater than zero.');
      return;
    }

    const supplier = suppliers.find((s) => s.id === formData.supplierId);
    const supplierName = supplier ? supplier.companyName || supplier.name : 'Direct Stock';

    // Compile all images with primary at index 0
    const compiledImages: string[] = [];
    if (primaryImage) compiledImages.push(primaryImage);
    additionalImages.forEach((img) => {
      if (img && !compiledImages.includes(img)) compiledImages.push(img);
    });

    if (editingMobile) {
      const res = updateMobile(editingMobile.id, {
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        variant: formData.variant.trim(),
        ram: formData.ram.trim(),
        storage: formData.storage.trim(),
        color: formData.color.trim(),
        imei1: formData.imei1.trim(),
        imei2: formData.imei2.trim() || undefined,
        serialNumber: formData.serialNumber.trim() || undefined,
        condition: formData.condition,
        purchasePrice: Number(formData.purchasePrice),
        salePrice: Number(formData.salePrice),
        purchaseDate: formData.purchaseDate,
        supplierId: formData.supplierId,
        supplierName,
        warrantyPeriod: formData.warrantyPeriod,
        warrantyExpiryDate: formData.warrantyExpiryDate,
        notes: formData.notes.trim() || undefined,
        imageUrl: primaryImage || undefined,
        images: compiledImages.length > 0 ? compiledImages : undefined,
      });

      if (!res.success) {
        setFormError(res.message);
        return;
      }
      setEditingMobile(null);
    } else {
      const res = addMobile({
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        variant: formData.variant.trim(),
        ram: formData.ram.trim(),
        storage: formData.storage.trim(),
        color: formData.color.trim(),
        imei1: formData.imei1.trim(),
        imei2: formData.imei2.trim() || undefined,
        serialNumber: formData.serialNumber.trim() || undefined,
        condition: formData.condition,
        purchasePrice: Number(formData.purchasePrice),
        salePrice: Number(formData.salePrice),
        purchaseDate: formData.purchaseDate,
        supplierId: formData.supplierId,
        supplierName,
        warrantyPeriod: formData.warrantyPeriod,
        warrantyExpiryDate: formData.warrantyExpiryDate,
        status: 'In Stock',
        notes: formData.notes.trim() || undefined,
        imageUrl: primaryImage || undefined,
        images: compiledImages.length > 0 ? compiledImages : undefined,
      });

      if (!res.success) {
        setFormError(res.message);
        return;
      }
      setIsAddModalOpen(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteMobile(deletingId);
      setDeletingId(null);
    }
  };

  const exportStockCsv = () => {
    const headers = [
      'ID',
      'Brand',
      'Model',
      'RAM',
      'Storage',
      'Color',
      'IMEI1',
      'IMEI2',
      'Condition',
      'Purchase Price',
      'Sale Price',
      'Status',
      'Warranty Expiry',
    ];
    const rows = filteredMobiles.map((m) => [
      m.id,
      `"${m.brand}"`,
      `"${m.model}"`,
      m.ram,
      m.storage,
      m.color,
      `'${m.imei1}'`,
      `'${m.imei2 || ''}'`,
      m.condition,
      canViewPurchasePrice ? m.purchasePrice : '[Restricted]',
      m.salePrice,
      m.status,
      m.warrantyExpiryDate,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mobiflow-stock-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Main Controls */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-xs">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Mobile Phone Inventory</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-medium">
                {mobiles.length} Devices
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Manage mobile stock, dual IMEIs, PTA statuses, and verified product photos (JPG, PNG, WebP).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setSelectedIntelModel('iPhone 16 Pro Max 256GB PTA tax and Pakistan market price');
              setIsIntelModalOpen(true);
            }}
            className="px-3 py-2 text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Verify Real-Time Mobile Market Prices & Official PTA Tax Rates via Google Search Grounding"
          >
            <Globe className="w-3.5 h-3.5 text-blue-700" />
            <span>Market Prices & PTA (Google)</span>
          </button>

          <button
            onClick={exportStockCsv}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {canAddMobile && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Mobile Device</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by brand, model, color, notes..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="relative w-full lg:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={imeiQuery}
            onChange={(e) => setImeiQuery(e.target.value)}
            placeholder="Search IMEI 1 or IMEI 2..."
            className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono transition-colors"
          />
          <button
            type="button"
            onClick={() => {
              setScannerTarget('search');
              setIsScannerOpen(true);
            }}
            title="Scan IMEI with Camera"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 p-1"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Brand Filter */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-700"
          >
            {brands.map((b) => (
              <option key={b} value={b}>
                Brand: {b}
              </option>
            ))}
          </select>

          {/* Condition Filter */}
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-700"
          >
            <option value="All">Condition: All</option>
            <option value="New">New (Pin Packed)</option>
            <option value="Used">Used</option>
            <option value="Open Box">Open Box</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-700"
          >
            <option value="All">Status: All</option>
            <option value="In Stock">In Stock</option>
            <option value="Sold">Sold</option>
            <option value="Returned">Returned</option>
            <option value="Exchanged">Exchanged</option>
          </select>

          {(searchQuery || imeiQuery || brandFilter !== 'All' || statusFilter !== 'All' || conditionFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setImeiQuery('');
                setBrandFilter('All');
                setStatusFilter('All');
                setConditionFilter('All');
              }}
              className="px-2.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Stock Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3 text-center w-14">Photo</th>
                <th className="py-3 px-4">Mobile & Specs</th>
                <th className="py-3 px-4">IMEI 1 & 2</th>
                <th className="py-3 px-3">Condition</th>
                <th className="py-3 px-3 text-right">
                  {canViewPurchasePrice ? 'Purchase Price' : 'Purchase Cost'}
                </th>
                <th className="py-3 px-3 text-right">Sale Price</th>
                <th className="py-3 px-3">Warranty</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMobiles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No mobiles match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredMobiles.map((mobile) => {
                  const warrantyBadge = getWarrantyBadge(mobile.warrantyExpiryDate);
                  const modelKey = `${mobile.brand} ${mobile.model}`.toLowerCase().trim();
                  const inStockModelCount = modelStockMap[modelKey] || 0;
                  const isLowStock = mobile.status === 'In Stock' && inStockModelCount < 3;
                  const thumbnail = mobile.imageUrl || (mobile.images && mobile.images[0]) || '';

                  return (
                    <tr
                      key={mobile.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isLowStock ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Photo Thumbnail */}
                      <td className="py-3 px-3 text-center">
                        {thumbnail ? (
                          <div
                            onClick={() => setPreviewZoomImage(thumbnail)}
                            className="relative group w-11 h-11 mx-auto rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:border-emerald-500 transition-all"
                            title="Click to view full photo"
                          >
                            <img
                              src={thumbnail}
                              alt={`${mobile.brand} ${mobile.model}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />
                            {mobile.images && mobile.images.length > 1 && (
                              <span className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[9px] font-bold px-1 rounded-tl">
                                +{mobile.images.length - 1}
                              </span>
                            )}
                            <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ZoomIn className="w-3.5 h-3.5 text-white drop-shadow" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-11 h-11 mx-auto rounded-lg border border-dashed border-slate-200 bg-slate-50/80 flex flex-col items-center justify-center text-slate-300">
                            <ImageIcon className="w-4 h-4" />
                            <span className="text-[8px] uppercase tracking-tighter">No Pic</span>
                          </div>
                        )}
                      </td>

                      {/* Specs */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                          <span>
                            {mobile.brand} {mobile.model}
                          </span>
                          {isLowStock && (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                              title={`Low stock alert: Only ${inStockModelCount} unit(s) left in shop! Consider reordering.`}
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-700 animate-pulse" />
                              <span>Reorder ({inStockModelCount} left)</span>
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          {mobile.ram}/{mobile.storage} · {mobile.color} · {mobile.variant}
                        </div>
                      </td>

                      {/* IMEI */}
                      <td className="py-3 px-4 font-mono text-slate-800">
                        <div className="font-semibold">{mobile.imei1}</div>
                        {mobile.imei2 && <div className="text-[10px] text-slate-400">{mobile.imei2}</div>}
                      </td>

                      {/* Condition */}
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-700">{mobile.condition}</span>
                      </td>

                      {/* Purchase */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                        {canViewPurchasePrice ? (
                          formatCurrency(mobile.purchasePrice, settings.currency)
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px] italic" title="Restricted by Admin">
                            ••••••
                          </span>
                        )}
                      </td>

                      {/* Sale */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-emerald-700">
                        {formatCurrency(mobile.salePrice, settings.currency)}
                      </td>

                      {/* Warranty */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${warrantyBadge.color}`}>
                          {warrantyBadge.label}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {formatDate(mobile.warrantyExpiryDate)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {mobile.status === 'In Stock' && (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>In Stock</span>
                          </span>
                        )}
                        {mobile.status === 'Sold' && (
                          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Sold</span>
                          </span>
                        )}
                        {mobile.status === 'Returned' && (
                          <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Returned</span>
                          </span>
                        )}
                        {mobile.status === 'Exchanged' && (
                          <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            <span>Exchanged</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {mobile.status === 'In Stock' && onOpenNewSaleForMobile && canSellMobile && (
                            <button
                              onClick={() => onOpenNewSaleForMobile(mobile.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors"
                            >
                              Sell
                            </button>
                          )}
                          <button
                            onClick={() => setViewingMobile(mobile)}
                            title="View Details"
                            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEditMobile && (
                            <button
                              onClick={() => handleOpenEdit(mobile)}
                              title="Edit Mobile"
                              className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDeleteMobile && (
                            <button
                              onClick={() => setDeletingId(mobile.id)}
                              title="Delete Mobile"
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Add / Edit Mobile Modal with Full Image Upload Management */}
      {(isAddModalOpen || editingMobile) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-sm text-slate-900">
                  {editingMobile ? `Edit Mobile Record — ${editingMobile.brand} ${editingMobile.model}` : 'Add Mobile Device to Inventory'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingMobile(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMobile} className="p-5 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* PRODUCT IMAGE UPLOAD SECTION */}
              <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Product Images (JPG, PNG, WebP)</span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Upload verified product photos. Files are sanitized and re-encoded securely (Max 5MB).
                    </p>
                  </div>
                  {isUploadingImage && (
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5 animate-pulse bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>{uploadStatusText || 'Validating and uploading...'}</span>
                    </span>
                  )}
                </div>

                {uploadError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Primary Image & Multi-Image Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  {/* Primary Photo Showcase / Uploader */}
                  <div className="md:col-span-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Main Product Image *
                    </span>
                    {primaryImage ? (
                      <div className="relative group rounded-xl overflow-hidden border border-emerald-300 bg-white shadow-2xs aspect-square flex items-center justify-center">
                        <img
                          src={primaryImage}
                          alt="Primary Mobile Preview"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                          <Star className="w-3 h-3 fill-current" />
                          Primary
                        </span>
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-1.5 bg-white text-slate-800 hover:text-emerald-600 rounded-lg text-xs font-semibold shadow"
                            title="Replace Main Photo"
                          >
                            <Upload className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleRemovePrimaryImage}
                            className="p-1.5 bg-rose-600 text-white hover:bg-rose-500 rounded-lg text-xs font-semibold shadow"
                            title="Remove Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white p-4 aspect-square flex flex-col items-center justify-center text-center cursor-pointer transition-colors group shadow-2xs"
                      >
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">Upload Main Photo</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, or WebP</span>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handlePrimaryFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Additional Images Grid & Add More Uploader */}
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Additional Angles & Photos ({additionalImages.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => addMoreInputRef.current?.click()}
                        className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add More Photos</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {additionalImages.map((img, idx) => (
                        <div
                          key={`img-${idx}`}
                          className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white aspect-square flex items-center justify-center"
                        >
                          <img
                            src={img}
                            alt={`Mobile angle ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                            <button
                              type="button"
                              onClick={() => handleSetAsPrimary(img)}
                              className="w-full py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-semibold flex items-center justify-center gap-0.5"
                              title="Set as Main Primary Photo"
                            >
                              <Star className="w-2.5 h-2.5" />
                              <span>Set Main</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveAdditionalImage(idx)}
                              className="w-full py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-semibold flex items-center justify-center gap-0.5"
                              title="Delete this photo"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add More Slot */}
                      <div
                        onClick={() => addMoreInputRef.current?.click()}
                        className="rounded-lg border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-white aspect-square flex flex-col items-center justify-center text-center cursor-pointer transition-colors group p-2 text-slate-400 hover:text-emerald-600"
                        title="Add More Images"
                      >
                        <Plus className="w-4 h-4 mb-0.5 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-semibold">Add Image</span>
                      </div>
                    </div>

                    <input
                      ref={addMoreInputRef}
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handleAdditionalFilesSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* SPECIFICATION & PRICING FORM FIELDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Apple, Samsung, Xiaomi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g. iPhone 15 Pro Max, S24 Ultra"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Variant / PTA Status</label>
                  <input
                    type="text"
                    value={formData.variant}
                    onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                    placeholder="e.g. Official PTA, JV Non-PTA"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Condition *</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as MobileCondition })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  >
                    <option value="New">New (Pin Packed)</option>
                    <option value="Used">Used</option>
                    <option value="Open Box">Open Box</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">RAM</label>
                  <input
                    type="text"
                    value={formData.ram}
                    onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                    placeholder="e.g. 8GB, 12GB"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Storage</label>
                  <input
                    type="text"
                    value={formData.storage}
                    onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                    placeholder="e.g. 128GB, 256GB, 512GB"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="e.g. Natural Titanium, Black"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="e.g. DX39FKL480"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-600 font-medium">IMEI 1 (Unique) *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setScannerTarget('form');
                        setIsScannerOpen(true);
                      }}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Scan Box Barcode</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.imei1}
                    onChange={(e) => setFormData({ ...formData, imei1: e.target.value })}
                    placeholder="15-digit IMEI 1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">IMEI 2 (Optional)</label>
                  <input
                    type="text"
                    value={formData.imei2}
                    onChange={(e) => setFormData({ ...formData, imei2: e.target.value })}
                    placeholder="15-digit IMEI 2 (eSIM / SIM 2)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Purchase Price ({settings.currency}) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.purchasePrice || ''}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Target Sale Price ({settings.currency}) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.salePrice || ''}
                    onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Supplier</label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.companyName || s.name} ({s.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Warranty Period</label>
                  <input
                    type="text"
                    value={formData.warrantyPeriod}
                    onChange={(e) => setFormData({ ...formData, warrantyPeriod: e.target.value })}
                    placeholder="e.g. 1 Year Official / 7 Days Checking"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Warranty Expiry Date</label>
                  <input
                    type="date"
                    value={formData.warrantyExpiryDate}
                    onChange={(e) => setFormData({ ...formData, warrantyExpiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1 text-xs">Notes / Inspection Comments</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Sealed box, Pin packed, Battery health 90%, mint condition"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingMobile(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingImage}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  {editingMobile ? 'Save Changes' : 'Add to Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Mobile Details Modal with Image Gallery */}
      {viewingMobile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full my-6 overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-sm text-slate-900">
                  {viewingMobile.brand} {viewingMobile.model}
                </h3>
              </div>
              <button
                onClick={() => setViewingMobile(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Product Photos in View Modal */}
              {((viewingMobile.imageUrl) || (viewingMobile.images && viewingMobile.images.length > 0)) && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Product Photos
                  </span>
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                    {/* Primary Image */}
                    {viewingMobile.imageUrl && (
                      <div
                        onClick={() => setPreviewZoomImage(viewingMobile.imageUrl || null)}
                        className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-emerald-500 bg-white shrink-0 cursor-pointer shadow-xs hover:opacity-90 transition-opacity"
                        title="Main Photo (Click to zoom)"
                      >
                        <img
                          src={viewingMobile.imageUrl}
                          alt="Primary"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[8px] font-bold text-center py-0.5">
                          Primary
                        </span>
                      </div>
                    )}
                    {/* Additional Images */}
                    {viewingMobile.images
                      ?.filter((img) => img !== viewingMobile.imageUrl)
                      .map((img, idx) => (
                        <div
                          key={`view-img-${idx}`}
                          onClick={() => setPreviewZoomImage(img)}
                          className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 cursor-pointer shadow-2xs hover:border-emerald-500 transition-colors"
                          title="Click to zoom"
                        >
                          <img
                            src={img}
                            alt={`Mobile View ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">IMEI 1:</span>
                  <span className="font-mono font-bold text-slate-900">{viewingMobile.imei1}</span>
                </div>
                {viewingMobile.imei2 && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">IMEI 2:</span>
                    <span className="font-mono font-bold text-slate-900">{viewingMobile.imei2}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block text-[10px]">STATUS:</span>
                  <span className="font-semibold text-emerald-600">{viewingMobile.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">CONDITION:</span>
                  <span className="font-semibold text-slate-800">{viewingMobile.condition}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500">RAM / Storage:</span>
                  <div className="font-medium text-slate-800">
                    {viewingMobile.ram} / {viewingMobile.storage}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Color:</span>
                  <div className="font-medium text-slate-800">{viewingMobile.color}</div>
                </div>
                <div>
                  <span className="text-slate-500">Purchase Price:</span>
                  <div className="font-mono font-bold text-slate-900">
                    {canViewPurchasePrice ? (
                      formatCurrency(viewingMobile.purchasePrice, settings.currency)
                    ) : (
                      <span className="text-slate-400 font-mono italic">•••••• (Restricted)</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Target Sale Price:</span>
                  <div className="font-mono font-bold text-emerald-600">
                    {formatCurrency(viewingMobile.salePrice, settings.currency)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Supplier:</span>
                  <div className="font-medium text-slate-800">{viewingMobile.supplierName}</div>
                </div>
                <div>
                  <span className="text-slate-500">Purchase Date:</span>
                  <div className="font-medium text-slate-800">{formatDate(viewingMobile.purchaseDate)}</div>
                </div>
                <div>
                  <span className="text-slate-500">Warranty:</span>
                  <div className="font-medium text-slate-800">{viewingMobile.warrantyPeriod}</div>
                </div>
                <div>
                  <span className="text-slate-500">Warranty Expiry:</span>
                  <div className="font-medium text-slate-800">{formatDate(viewingMobile.warrantyExpiryDate)}</div>
                </div>
              </div>

              {viewingMobile.notes && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-[10px] font-semibold text-slate-400 block mb-1">INSPECTION NOTES:</span>
                  <p className="text-slate-700">{viewingMobile.notes}</p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {onTrackImei && (
                  <button
                    onClick={() => {
                      onTrackImei(viewingMobile.imei1);
                      setViewingMobile(null);
                    }}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <span>View IMEI Full Lifecycle →</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIntelModel(`${viewingMobile.brand} ${viewingMobile.model} ${viewingMobile.variant} current market price and PTA tax Pakistan`);
                    setIsIntelModalOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ml-2"
                  title="Check live market price, resale rate and official PTA tax with Google Search"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>Google Market Intel</span>
                </button>
                <button
                  onClick={() => setViewingMobile(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Photo Zoom Lightbox Modal */}
      {previewZoomImage && (
        <div
          onClick={() => setPreviewZoomImage(null)}
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800"
          >
            <button
              onClick={() => setPreviewZoomImage(null)}
              className="absolute top-3 right-3 p-1.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full transition-colors z-10"
              title="Close Image"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewZoomImage}
              alt="Full Preview"
              className="max-h-[85vh] w-auto object-contain mx-auto"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deletingId}
        title="Delete Mobile Record"
        message="Are you sure you want to remove this mobile from inventory? If it has related historical sales, deletion will be prevented."
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        isDanger
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />

      {/* Camera Barcode & IMEI Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(val) => {
          if (scannerTarget === 'search') {
            setImeiQuery(val);
          } else {
            setFormData((prev) => ({ ...prev, imei1: val }));
          }
        }}
        title={scannerTarget === 'search' ? 'Scan Device IMEI to Search Stock' : 'Scan Box Barcode for IMEI 1'}
      />

      {/* Google Search Grounding Market Intelligence Modal */}
      <MarketIntelligenceModal
        isOpen={isIntelModalOpen}
        onClose={() => setIsIntelModalOpen(false)}
        initialQuery={selectedIntelModel || 'iPhone 16 Pro Max 256GB PTA tax and Pakistan market price'}
      />
    </div>
  );
};
