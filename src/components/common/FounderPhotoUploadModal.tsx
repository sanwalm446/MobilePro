import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  User,
  Image as ImageIcon,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { processFounderPhoto } from '../../utils/founderPhotoService';
import defaultFounderPhoto from '../../assets/images/founder_muhammad_sanwal_1791449991747.jpg';

interface FounderPhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FounderPhotoUploadModal: React.FC<FounderPhotoUploadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { settings, updateSettings, currentUser } = useShop();

  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePhoto = selectedPreviewUrl || settings.founderPhotoUrl || defaultFounderPhoto;
  const isCustomPhoto = !!(settings.founderPhotoUrl || selectedPreviewUrl);

  const isOwnerOrAdmin =
    currentUser?.role === 'SHOP_OWNER' ||
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.permissions?.includes('edit_shop_settings') ||
    currentUser?.permissions?.includes('view_settings');

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsProcessing(true);

    try {
      const result = await processFounderPhoto(file);
      if (!result.success || !result.dataUrl) {
        setErrorMessage(result.error || 'Failed to process image file.');
        return;
      }

      setSelectedPreviewUrl(result.dataUrl);
      setSelectedFileName(result.originalFileName || file.name);
      setSelectedFileSize(result.sizeBytes || file.size);
      setSuccessMessage('Photo loaded successfully! Click "Save Original Photo" below to apply it across MobiFlow.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error reading image file.';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSavePhoto = () => {
    if (!selectedPreviewUrl) {
      setErrorMessage('Please select a photo first.');
      return;
    }

    if (!isOwnerOrAdmin) {
      setErrorMessage('Permission denied: Only the shop owner or admin can update the Founder photograph.');
      return;
    }

    const res = updateSettings({
      founderPhotoUrl: selectedPreviewUrl,
      founderPhotoOriginalName: selectedFileName || 'founder_photo.jpg',
      founderPhotoUpdatedAt: new Date().toISOString(),
    });

    if (res.success) {
      setSuccessMessage('Founder photograph saved successfully! Updated across homepage, about section, and leadership support.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleResetToDefault = () => {
    if (!isOwnerOrAdmin) {
      setErrorMessage('Permission denied: Only the shop owner or admin can update the Founder photograph.');
      return;
    }

    const res = updateSettings({
      founderPhotoUrl: undefined,
      founderPhotoOriginalName: undefined,
      founderPhotoUpdatedAt: new Date().toISOString(),
    });

    if (res.success) {
      setSelectedPreviewUrl(null);
      setSelectedFileName(null);
      setSelectedFileSize(null);
      setSuccessMessage('Founder photo reset to default system picture.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-600 p-5 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>MobiFlow Identity Preservation</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Founder & Owner Photograph</h2>
          <p className="text-xs text-blue-100 mt-1">
            Upload Muhammad Sanwal's authentic photograph. Displayed directly as-is without any AI alterations or facial distortion.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Photo Preview Container */}
          <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="relative group shrink-0">
              <div className="w-36 h-48 sm:w-40 sm:h-52 rounded-xl overflow-hidden bg-slate-900 border-2 border-emerald-500 shadow-md relative">
                <img
                  src={activePhoto}
                  alt="Muhammad Sanwal — Founder & Owner"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 p-2 rounded-lg bg-slate-900/90 text-white hover:bg-emerald-600 shadow-md transition-colors cursor-pointer"
                title="Choose new photograph"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-center sm:text-left min-w-0 flex-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                {isCustomPhoto ? 'Custom Master Photo Active' : 'Default Preset Photo'}
              </div>
              <h3 className="font-bold text-slate-900 text-base">Muhammad Sanwal</h3>
              <p className="text-xs text-slate-500">Founder & Owner, MobiFlow Software</p>

              {selectedFileName && (
                <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 font-mono truncate">
                  File: {selectedFileName}
                  {selectedFileSize && ` (${(selectedFileSize / 1024).toFixed(0)} KB)`}
                </div>
              )}

              <div className="pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 hover:border-emerald-500 text-slate-800 font-semibold text-xs transition-all shadow-2xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isProcessing ? 'Processing...' : 'Upload Original Photo'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Zero AI Alterations Notice */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-blue-900">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Identity Preservation Protocol Active</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              When you select your photo (e.g. from WhatsApp or camera roll), MobiFlow stores and displays the <strong>exact authentic photograph</strong> without passing it through AI face generators, retouching filters, or face alteration services. Facial likeness and expressions remain 100% natural.
            </p>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {settings.founderPhotoUrl ? (
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Default</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSavePhoto}
              disabled={!selectedPreviewUrl || isProcessing}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save Original Photo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
