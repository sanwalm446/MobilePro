import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Smartphone,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import {
  queryGoogleSearchGrounding,
  MarketSearchCategory,
  MarketSearchResponse,
  MARKET_SEARCH_PRESETS,
  checkAiServiceStatus,
  AiServiceStatus,
} from '../../services/marketIntelligenceService';

interface MarketIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  initialCategory?: MarketSearchCategory;
}

export const MarketIntelligenceModal: React.FC<MarketIntelligenceModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  initialCategory = 'market',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<MarketSearchCategory>(initialCategory);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MarketSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiServiceStatus | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkAiServiceStatus().then(setAiStatus).catch(() => {});
      if (initialQuery && initialQuery !== query) {
        setQuery(initialQuery);
        handleExecuteSearch(initialQuery, initialCategory);
      }
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  const handleExecuteSearch = async (searchQuery: string, cat: MarketSearchCategory) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await queryGoogleSearchGrounding(searchQuery.trim(), cat);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to search Google market data.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecuteSearch(query, category);
  };

  const handleSelectPreset = (presetQuery: string, cat: MarketSearchCategory) => {
    setQuery(presetQuery);
    setCategory(cat);
    handleExecuteSearch(presetQuery, cat);
  };

  const handleCopyAnswer = () => {
    if (!result?.answer) return;
    navigator.clipboard.writeText(result.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Google Search Live Market Intelligence
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  gemini-2.5-flash
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Up-to-date Pakistan market rates, official PTA tax slabs, and phone specs grounded with live Google Search
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Area */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. iPhone 16 Pro Max 256GB PTA tax and Pakistan market price..."
                className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 text-sm placeholder:text-slate-400 border border-slate-300 rounded-xl shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>Search Google</span>
                </>
              )}
            </button>
          </form>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" /> Focus:
            </span>
            {[
              { id: 'market', label: 'General Market', icon: Globe },
              { id: 'price', label: 'Live Market Price', icon: TrendingUp },
              { id: 'pta', label: 'Official PTA Tax', icon: ShieldCheck },
              { id: 'specs', label: 'Full Phone Specs', icon: Smartphone },
            ].map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as MarketSearchCategory)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-blue-700 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <span className="text-slate-400 font-semibold shrink-0">Popular:</span>
            {MARKET_SEARCH_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.query, preset.category)}
                className="shrink-0 px-2.5 py-0.5 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-800 font-medium transition-colors cursor-pointer"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Search Grounding Notification</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
              {error.includes('Settings > Secrets') && (
                <div className="text-[11px] text-rose-600 font-mono bg-rose-100/60 p-2 rounded-lg">
                  Tip: Ensure GEMINI_API_KEY is configured in your project secrets to enable Google Search Grounding.
                </div>
              )}
            </div>
          )}

          {isLoading && (
            <div className="p-10 text-center space-y-3">
              <div className="relative w-12 h-12 mx-auto">
                <div className="w-12 h-12 rounded-full border-3 border-blue-200 border-t-blue-700 animate-spin" />
                <Globe className="w-5 h-5 text-blue-700 absolute inset-0 m-auto" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-900">Querying Google Search Grounding...</div>
                <div className="text-xs text-slate-500">
                  Retrieving real-time web verification with <strong>gemini-2.5-flash</strong>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !result && !error && (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Globe className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-bold text-slate-900">
                  Search Live Mobile Market Data & Official PTA Taxes
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter any handset model name or click any popular preset above to retrieve accurate, verified market prices,
                  official PTA tax slabs, and real-time Google web sources.
                </p>
              </div>
            </div>
          )}

          {!isLoading && result && (
            <div className="space-y-5">
              {/* Answer Card */}
              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800">
                      Grounded Response ({result.model})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAnswer}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Summary</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Formatted Markdown text */}
                <div className="prose prose-sm max-w-none text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {result.answer}
                </div>
              </div>

              {/* Google Search Sources (Citations) */}
              {result.sources && result.sources.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
                    <span>Verified Google Web Sources & References ({result.sources.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-2xs transition-all text-xs"
                      >
                        <div className="truncate mr-2">
                          <div className="font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                            {src.title}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">{src.uri}</div>
                        </div>
                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Search queries executed */}
              {result.searchQueries && result.searchQueries.length > 0 && (
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                  <span>Google Searches:</span>
                  {result.searchQueries.map((q, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      "{q}"
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>MobiFlow Market Intelligence · Live Google Search Grounded</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
