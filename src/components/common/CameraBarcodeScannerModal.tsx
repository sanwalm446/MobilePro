import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Flashlight, AlertCircle, RefreshCw, CheckCircle2, ScanLine } from 'lucide-react';

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedValue: string) => void;
  title?: string;
}

export const CameraBarcodeScannerModal: React.FC<CameraBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Device Box or IMEI Barcode',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported on this browser or environment.');
        setIsScanning(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn('Video play error:', err);
        });
      }

      // Check if native BarcodeDetector API exists
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['qr_code', 'code_128', 'ean_13', 'upc_a', 'code_39'],
          });

          const interval = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const rawVal = barcodes[0].rawValue;
                  clearInterval(interval);
                  handleSuccessfulScan(rawVal);
                }
              } catch (e) {
                // detector scan loop
              }
            }
          }, 300);

          return () => clearInterval(interval);
        } catch (e) {
          console.log('BarcodeDetector initialization fallback', e);
        }
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in browser settings, or enter IMEI below.'
          : 'Unable to open camera on this device. You can test with manual input or sample IMEIs.'
      );
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleSuccessfulScan = (value: string) => {
    const clean = value.trim();
    if (!clean) return;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([40, 40, 40]);
      } catch {
        // ignore
      }
    }

    setScannedFeedback(clean);
    setTimeout(() => {
      onScan(clean);
      onClose();
    }, 600);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleSuccessfulScan(manualInput.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative bg-slate-950 text-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-xs tracking-wide">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative h-64 sm:h-72 bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center space-y-3 max-w-xs">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 rounded-lg hover:bg-emerald-900 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera</span>
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Targeting Overlay Frame */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                <div className="relative w-64 h-36 border-2 border-emerald-400/80 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center">
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

                  {/* Scanning Laser Line */}
                  <div className="absolute left-2 right-2 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />

                  <span className="text-[10px] font-mono font-medium text-emerald-300 bg-slate-900/80 px-2 py-0.5 rounded tracking-wider">
                    ALIGN BARCODE / QR
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-4 bg-slate-900/80 px-3 py-1 rounded-full">
                  Position barcode or QR label inside the frame
                </p>
              </div>

              {scannedFeedback && (
                <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2" />
                  <div className="font-bold text-sm text-white">Barcode Detected!</div>
                  <div className="font-mono text-xs text-emerald-300 mt-1 font-bold">{scannedFeedback}</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Manual / Quick Test Options */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 space-y-3">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Or enter / paste IMEI digits manually..."
              className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono placeholder:text-slate-500 outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
            >
              Use
            </button>
          </form>

          {/* Quick Demo IMEI chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400">Quick Test Samples:</span>
            {['352948110948271', '864294061284950', '359182047291048'].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => handleSuccessfulScan(sample)}
                className="text-[10px] font-mono bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded text-emerald-300 border border-slate-700 transition-colors"
              >
                {sample.slice(-6)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
