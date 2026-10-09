import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Smartphone,
  FileText,
  Receipt,
  Globe,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Tag,
  ShieldCheck,
  Save,
  HelpCircle,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { ShopLogo } from '../common/ShopLogo';
import { validateLogoFile, optimizeAndProcessLogo } from '../../utils/imageUtils';

export const ShopBrandingSection: React.FC = () => {
  const { settings, updateSettings, currentUser, currentTenantId } = useShop();

  // Local form state
  const [shopName, setShopName] = useState(settings.shopName || '');
  const [tagline, setTagline] = useState(settings.tagline || '');
  const [ownerName, setOwnerName] = useState(settings.ownerName || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp || '');
  const [email, setEmail] = useState(settings.email || '');
  const [address, setAddress] = useState(settings.address || '');
  const [city, setCity] = useState(settings.city || '');
  const [website, setWebsite] = useState(settings.website || '');
  const [taxNumber, setTaxNumber] = useState(settings.taxNumber || '');
  const [currency, setCurrency] = useState(settings.currency || 'Rs.');
  const [invoiceTerms, setInvoiceTerms] = useState(settings.invoiceTerms || '');
  const [openingCashBalance, setOpeningCashBalance] = useState(settings.openingCashBalance || 0);

  // Logo state
  const [logoUrl, setLogoUrl] = useState<string>(settings.logoUrl || '');
  const [isLogoModified, setIsLogoModified] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Feedback notifications
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Live preview tab
  const [previewTab, setPreviewTab] = useState<'header' | 'invoice' | 'receipt'>('header');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize when active tenant or settings change externally
  useEffect(() => {
    setShopName(settings.shopName || '');
    setTagline(settings.tagline || '');
    setOwnerName(settings.ownerName || '');
    setPhone(settings.phone || '');
    setWhatsapp(settings.whatsapp || '');
    setEmail(settings.email || '');
    setAddress(settings.address || '');
    setCity(settings.city || '');
    setWebsite(settings.website || '');
    setTaxNumber(settings.taxNumber || '');
    setCurrency(settings.currency || 'Rs.');
    setInvoiceTerms(settings.invoiceTerms || '');
    setOpeningCashBalance(settings.openingCashBalance || 0);
    setLogoUrl(settings.logoUrl || '');
    setIsLogoModified(false);
  }, [settings, currentTenantId]);

  // Handle Logo File Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // 1. Validation
    const validation = validateLogoFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid logo image file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsUploading(true);
      // 2. Optimization / compression for crispness and performance
      const processedDataUrl = await optimizeAndProcessLogo(file, 800, 800, 0.9);
      setLogoUrl(processedDataUrl);
      setIsLogoModified(true);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process the logo image.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove Logo (reverts to professional default)
  const handleRemoveLogo = () => {
    setLogoUrl('');
    setIsLogoModified(true);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Revert all form changes to currently saved settings
  const handleResetForm = () => {
    setShopName(settings.shopName || '');
    setTagline(settings.tagline || '');
    setOwnerName(settings.ownerName || '');
    setPhone(settings.phone || '');
    setWhatsapp(settings.whatsapp || '');
    setEmail(settings.email || '');
    setAddress(settings.address || '');
    setCity(settings.city || '');
    setWebsite(settings.website || '');
    setTaxNumber(settings.taxNumber || '');
    setCurrency(settings.currency || 'Rs.');
    setInvoiceTerms(settings.invoiceTerms || '');
    setOpeningCashBalance(settings.openingCashBalance || 0);
    setLogoUrl(settings.logoUrl || '');
    setIsLogoModified(false);
    setUploadError(null);
  };

  // Save Branding Changes
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (!shopName.trim()) {
      setSaveError('Shop Name is required.');
      return;
    }

    const res = updateSettings({
      shopName: shopName.trim(),
      tagline: tagline.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      website: website.trim(),
      taxNumber: taxNumber.trim(),
      currency,
      invoiceTerms,
      openingCashBalance: Number(openingCashBalance),
      logoUrl: logoUrl,
    });

    if (res.success) {
      setSaveSuccess(true);
      setIsLogoModified(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } else {
      setSaveError(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Tenant Info */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>Shop Branding & Business Profile</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Multi-Tenant Isolated
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Customize your store identity, official logo, contact information, and invoice stationery.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-700/60">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="text-[11px] leading-tight">
            <div className="text-slate-400">Active Tenant ID:</div>
            <div className="font-mono font-semibold text-emerald-300">{currentTenantId}</div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="text-xs font-bold">Shop Branding Saved Successfully!</div>
            <div className="text-[11px] text-emerald-700">
              Your logo, shop name, and business information have been updated throughout your software, headers, invoices, receipts, and reports.
            </div>
          </div>
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-xl flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="text-xs font-medium">{saveError}</div>
        </div>
      )}

      {/* Main Form and Live Preview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form & Logo Management */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          {/* Logo Upload Card */}
          <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Store Logo</span>
                  {isLogoModified && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Unsaved Preview
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Appears in header, sidebar, customer invoices, receipts, and reports.
                </p>
              </div>

              {logoUrl ? (
                <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                  Custom Logo Active
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                  Default Branding
                </span>
              )}
            </div>

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Logo Preview & Controls Box */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
              {/* Logo Preview Badge */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-white border-2 border-slate-200 shadow-xs flex items-center justify-center p-2 overflow-hidden">
                  <ShopLogo
                    logoUrl={logoUrl}
                    shopName={shopName || 'Mobile Shop'}
                    size="custom"
                    className="w-full h-full"
                    rounded="lg"
                  />
                </div>
                <div className="text-[10px] text-slate-400 text-center mt-1 font-medium">
                  {logoUrl ? 'Live Preview' : 'Default Logo'}
                </div>
              </div>

              {/* Upload & Action Buttons */}
              <div className="flex-1 space-y-2.5 text-center sm:text-left">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    {logoUrl ? 'Change or remove current logo' : 'Upload your official shop logo'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Supports JPG, JPEG, PNG, and WEBP (max 5 MB). Aspect ratio is strictly preserved without stretching.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {logoUrl ? <RefreshCw className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{isUploading ? 'Optimizing...' : logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                  </button>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Logo</span>
                    </button>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Shop Profile Details Card */}
          <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Business Profile Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Shop Name */}
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Shop Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABC Mobile Center or PakMobile Pro"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white font-bold text-sm text-slate-900 transition-colors"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This shop name appears on the application header, sidebar, dashboard, and all printed invoices.
                </p>
              </div>

              {/* Tagline */}
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Tagline / Business Slogan
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Wholesale & Retail Mobile Phones, Accessories & Repairing"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  />
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Primary Phone */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Shop Phone Number *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0300-1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white transition-colors font-mono"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* WhatsApp Number */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  WhatsApp Business Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. 0300-1234567"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white transition-colors font-mono"
                  />
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Shop Email */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Shop Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="contact@yourshop.pk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  City / Region *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lahore, Karachi, Rawalpindi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  />
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Shop Full Address */}
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Shop Address (Printed on Invoices & Receipts)
                </label>
                <input
                  type="text"
                  placeholder="Shop # 18-B, City Mobile Mall, Hall Road"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Website (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="www.yourmobileshop.pk"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  />
                  <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Tax / Registration Number */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Tax / NTN / Registration # (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. NTN-9821034-7"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white transition-colors font-mono"
                />
              </div>

              {/* Owner Name */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Proprietor / Owner Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Muhammad Sanwal"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Currency Symbol */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Currency Symbol
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-bold text-slate-900"
                >
                  <option value="Rs.">Rs. (Pakistani Rupee)</option>
                  <option value="PKR">PKR</option>
                  <option value="$">$ (USD)</option>
                  <option value="AED">AED (Dirham)</option>
                  <option value="SAR">SAR (Riyal)</option>
                </select>
              </div>

              {/* Invoice Terms */}
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Printed Invoice Terms & Warranty Conditions
                </label>
                <textarea
                  rows={3}
                  value={invoiceTerms}
                  onChange={(e) => setInvoiceTerms(e.target.value)}
                  placeholder="Warranty checking rules, LCD break exclusion, returns policy..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-xs leading-relaxed"
                />
              </div>
            </div>

            {/* Submit & Reset Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Reset to Saved
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save All Changes</span>
              </button>
            </div>
          </div>
        </form>

        {/* Right Column: Interactive Live Preview Panel */}
        <div className="lg:col-span-5 space-y-4 sticky top-20">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Live Branding Preview</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Real-time rendering</span>
            </div>

            {/* Preview Navigation Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setPreviewTab('header')}
                className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  previewTab === 'header'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Header</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewTab('invoice')}
                className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  previewTab === 'invoice'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Invoice (A4)</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewTab('receipt')}
                className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  previewTab === 'receipt'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Receipt</span>
              </button>
            </div>

            {/* Tab 1: Header Preview */}
            {previewTab === 'header' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-2">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Sidebar Brand Area (Dark Theme)
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <ShopLogo
                      logoUrl={logoUrl}
                      shopName={shopName || 'Mobile Shop'}
                      size="sm"
                      variant="dark"
                      rounded="md"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate">
                        {shopName || 'Mobile Shop'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {tagline || 'Mobile Shop ERP & POS'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    Main Header Bar (Light Theme)
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ShopLogo
                        logoUrl={logoUrl}
                        shopName={shopName || 'Mobile Shop'}
                        size="xs"
                        variant="light"
                        rounded="md"
                      />
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {shopName || 'Mobile Shop'}
                      </span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        / DASHBOARD
                      </span>
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      POS Active
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Invoice Preview */}
            {previewTab === 'invoice' && (
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-start gap-3">
                    <ShopLogo
                      logoUrl={logoUrl}
                      shopName={shopName || 'Mobile Shop'}
                      size="lg"
                      variant="light"
                      rounded="lg"
                      showBorder
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">
                        {shopName || 'Mobile Shop'}
                      </h4>
                      {tagline && (
                        <p className="text-[10px] text-slate-500 mt-0.5">{tagline}</p>
                      )}
                      <p className="text-[10px] text-slate-600 mt-1 max-w-[200px]">
                        {address || 'Shop # 1, Main Market'}{city ? `, ${city}` : ''}
                      </p>
                      <p className="text-[10px] text-slate-600 font-medium">
                        Ph: {phone || '0300-1234567'}{whatsapp ? ` · WA: ${whatsapp}` : ''}
                      </p>
                      {email && <p className="text-[10px] text-slate-500">{email}</p>}
                      {taxNumber && (
                        <p className="text-[9px] font-mono text-slate-400">NTN: {taxNumber}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      SALES INVOICE
                    </span>
                    <div className="font-mono font-bold text-slate-900 mt-1">INV-1092</div>
                    <div className="text-[10px] text-slate-400">2026-10-02</div>
                  </div>
                </div>

                {/* Dummy invoice line items */}
                <div className="py-1">
                  <div className="flex justify-between text-[11px] font-medium text-slate-700 py-1 border-b border-slate-100">
                    <span>Samsung Galaxy S24 Ultra (256GB)</span>
                    <span className="font-mono font-bold">{currency} 285,000</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 py-1">
                    <span>Checking Warranty (7 Days)</span>
                    <span className="text-emerald-600 font-semibold">Included</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-xs text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono text-emerald-700">{currency} 285,000</span>
                </div>
              </div>
            )}

            {/* Tab 3: Thermal Receipt Preview */}
            {previewTab === 'receipt' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-center">
                <div className="w-[260px] bg-white p-3 shadow-xs border border-dashed border-slate-300 font-mono text-center text-[10px] text-slate-800 space-y-1.5">
                  <div className="flex justify-center pb-1">
                    <ShopLogo
                      logoUrl={logoUrl}
                      shopName={shopName || 'Mobile Shop'}
                      size="sm"
                      variant="mono"
                      rounded="md"
                    />
                  </div>
                  <div className="font-bold text-xs text-slate-900 uppercase">
                    {shopName || 'Mobile Shop'}
                  </div>
                  {tagline && <div className="text-[9px] text-slate-500">{tagline}</div>}
                  <div className="text-[9px] text-slate-600">
                    {address || 'Shop # 1, Main Market'}{city ? `, ${city}` : ''}
                  </div>
                  <div className="text-[9px] font-bold text-slate-700">
                    Ph: {phone || '0300-1234567'}
                  </div>
                  {whatsapp && (
                    <div className="text-[9px] text-slate-600">WhatsApp: {whatsapp}</div>
                  )}

                  <div className="border-t border-dashed border-slate-300 my-1 pt-1 text-left text-[9px] space-y-0.5">
                    <div className="flex justify-between">
                      <span>INV: #1092</span>
                      <span>2026-10-02</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CUST: Walk-in</span>
                      <span>Cash</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-300 my-1 pt-1 text-left text-[9px]">
                    <div className="flex justify-between font-bold">
                      <span>iPhone 15 Pro Max</span>
                      <span>{currency} 340k</span>
                    </div>
                    <div className="text-slate-500 text-[8px]">IMEI: 358291048291032</div>
                  </div>

                  <div className="border-t border-dashed border-slate-300 pt-1 text-[8px] text-slate-500">
                    *** Thank You For Shopping ***
                  </div>
                </div>
              </div>
            )}

            {/* Note & Guidelines */}
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-900 text-[11px] space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>Tenant Isolation Guarantee</span>
              </div>
              <p className="text-blue-700 text-[10px] leading-relaxed">
                Your shop logo and contact credentials are cryptographically tied to tenant{' '}
                <span className="font-mono font-bold">{currentTenantId}</span>. Other customers and shop accounts cannot view or modify your branding.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
