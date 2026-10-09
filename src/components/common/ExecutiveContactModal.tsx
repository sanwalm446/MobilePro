import React from 'react';
import { X, Phone, Mail, Award, ShieldCheck, CheckCircle2, MessageSquare, ExternalLink } from 'lucide-react';
import founderPhoto from '../../assets/images/founder_muhammad_sanwal_1791449991747.jpg';
import managerPhoto from '../../assets/images/manager_muhammad_hanan_1791294638510.jpg';

interface ExecutiveContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutiveContactModal: React.FC<ExecutiveContactModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-sky-100 max-w-2xl w-full overflow-hidden animate-in zoom-in-95">
        {/* Header with Blue-to-Green Gradient Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>MobiFlow Executive Team & Technical Leadership</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Official Software Administration & Support
          </h2>
          <p className="text-xs text-sky-100 mt-1">
            Direct executive contacts for software support, licensing, custom mobile shop modules & integrations.
          </p>
        </div>

        {/* Content: Two Executive Cards with Owner & Manager Images */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Founder & Owner */}
            <div className="bg-gradient-to-br from-sky-50/60 to-emerald-50/40 rounded-xl p-4 border-2 border-emerald-500/40 shadow-xs relative flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3.5 mb-3">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-900 border-2 border-emerald-400 shadow-md flex items-center justify-center text-white font-extrabold text-lg">
                      <img
                        src={founderPhoto}
                        alt="Muhammad Sanwal"
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="hidden">MS</span>
                    </div>
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-black uppercase shadow-xs">
                      Founder
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-slate-900 truncate">
                      Muhammad Sanwal
                    </h3>
                    <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                      Founder & Owner
                    </p>
                    <p className="text-[10px] text-slate-500">
                      MobiFlow Software · Lead Architect
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed mb-3">
                  Founder & Owner of MobiFlow Software. Created MobiFlow to turn complex mobile shop management into a simple, smart digital experience.
                </p>
              </div>

              <div className="pt-3 border-t border-emerald-200/60 space-y-1.5 text-xs">
                <a
                  href="tel:03292920600"
                  className="flex items-center gap-2 p-2 rounded-lg bg-white border border-emerald-200 text-slate-900 font-semibold hover:border-emerald-500 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-mono text-xs">0329-2920600</span>
                  <span className="text-[10px] ml-auto px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                    Call / WhatsApp
                  </span>
                </a>
                <div className="flex items-center gap-2 px-2 py-1 text-slate-600 text-[11px]">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-700">Direct Founder Helpline</span>
                </div>
              </div>
            </div>

            {/* Card 2: General Manager */}
            <div className="bg-gradient-to-br from-sky-50/60 to-blue-50/40 rounded-xl p-4 border-2 border-blue-500/40 shadow-xs relative flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3.5 mb-3">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-900 border-2 border-blue-400 shadow-md flex items-center justify-center text-white font-extrabold text-lg">
                      <img
                        src={managerPhoto}
                        alt="Muhammad Hanan"
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="hidden">MH</span>
                    </div>
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase shadow-xs">
                      MGR
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-slate-900 truncate">
                      Muhammad Hanan
                    </h3>
                    <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                      Co-Owner & Operations Lead
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Co-Owner & Technical Success
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed mb-3">
                  Co-owner and head of client onboarding, technical setup, and nationwide shop support across Pakistan.
                </p>
              </div>

              <div className="pt-3 border-t border-blue-200/60 space-y-1.5 text-xs">
                <a
                  href="tel:03081158191"
                  className="flex items-center gap-2 p-2 rounded-lg bg-white border border-blue-200 text-slate-900 font-semibold hover:border-blue-500 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-mono text-xs">0308-1158191</span>
                  <span className="text-[10px] ml-auto px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                    Call / WhatsApp
                  </span>
                </a>
                <div className="flex items-center gap-2 px-2 py-1 text-slate-600 text-[11px]">
                  <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-mono truncate">hanan.manager@mobiflow.pk</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Dedicated 24/7 Priority Assistance for registered shop retailers.</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors text-xs shrink-0 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
