import React, { useState } from 'react';
import {
  Globe,
  Search,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import {
  queryGoogleSearchGrounding,
  MarketSearchCategory,
  MarketSearchResponse,
  MARKET_SEARCH_PRESETS,
} from '../../services/marketIntelligenceService';
import { useShop } from '../../context/ShopContext';

interface MarketIntelligenceViewProps {
  onOpenNewMobile?: (model?: string) => void;
  initialQuery?: string;
}

export const MarketIntelligenceView: React.FC<MarketIntelligenceViewProps> = ({
  onOpenNewMobile,
  initialQuery = '',
}) => {
  const { mobiles } = useShop();
  const [query, setQuery] = useState(initialQuery || 'iPhone 16 Pro Max 256GB PTA tax and Pakistan market price');
  const [category, setCategory] = useState<MarketSearchCategory>('market');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MarketSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = async (targetQuery?: string, targetCategory?: MarketSearchCategory) => {
    const activeQ = targetQuery !== undefined ? targetQuery : query;
    const activeCat = targetCategory !== undefined ? targetCategory : category;

    if (!activeQ.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await queryGoogleSearchGrounding(activeQ.trim(), activeCat);
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to search Google market data.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = (presetQuery: string, cat: MarketSearchCategory) => {
    setQuery(presetQuery);
    setCategory(cat);
    handleSearch(presetQuery, cat);
  };

  const handleCopy = () => {
    if (!result?.answer) return;
    navigator.clipboard.writeText(result.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-emerald-300">
            <Globe className="w-3.5 h-3.5" />
            <span>Google Search Grounding · gemini-2.5-flash</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Live Mobile Market & PTA Intelligence
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Verify real-time mobile prices across Pakistani retail markets, official PTA tax slabs, DIRBS compliance,
            and exact phone specifications powered by live Google Search data.
          </p>
        </div>
      </div>

      {/* Main Search Bar & Filter Options */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search handset model for live prices, PTA taxes, or specs (e.g. Samsung S24 Ultra market price)..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 focus:bg-white text-slate-900 text-sm placeholder:text-slate-400 border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 rounded-xl outline-none font-medium transition-all shadow-2xs"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Grounding Search...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>Search Google Data</span>
              </>
            )}
          </button>
        </form>

        {/* Category Selector */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Search Focus:
          </span>
          {[
            { id: 'market', label: 'General Market', icon: Globe },
            { id: 'price', label: 'Live Market Rates', icon: TrendingUp },
            { id: 'pta', label: 'Official PTA Taxes', icon: ShieldCheck },
            { id: 'specs', label: 'Phone Specifications', icon: Smartphone },
            { id: 'trends', label: 'Market Demand & Trends', icon: Sparkles },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id as MarketSearchCategory)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Query Presets */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs pb-1">
          <span className="text-slate-400 font-semibold shrink-0">1-Click Presets:</span>
          {MARKET_SEARCH_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePresetClick(p.query, p.category)}
              className="shrink-0 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors cursor-pointer border border-slate-200"
            >
              <span className="text-blue-700 font-bold mr-1">[{p.badge}]</span>
              <span>{p.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Card */}
      {error && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Search Grounding Notification</span>
          </div>
          <p className="text-xs sm:text-sm text-rose-700 leading-relaxed">{error}</p>
          {error.includes('Settings > Secrets') && (
            <p className="text-xs text-rose-600 font-mono bg-rose-100/70 p-2.5 rounded-lg">
              Make sure GEMINI_API_KEY is configured in your project secrets to use Google Search Grounding.
            </p>
          )}
        </div>
      )}

      {/* Loading Card */}
      {isLoading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="relative w-14 h-14 mx-auto">
            <div className="w-14 h-14 rounded-full border-3 border-blue-200 border-t-blue-700 animate-spin" />
            <Globe className="w-6 h-6 text-blue-700 absolute inset-0 m-auto" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">Querying Google Search in Real Time...</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Connecting with <strong>gemini-2.5-flash</strong> and retrieving verified Google web citations for "{query}"
            </p>
          </div>
        </div>
      )}

      {/* Search Results Display */}
      {!isLoading && result && (
        <div className="space-y-5">
          {/* Main Answer Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Real-time Grounded Answer ({result.model})
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Breakdown</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-slate-900 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {result.answer}
            </div>
          </div>

          {/* Web Sources & Citations */}
          {result.sources && result.sources.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <ExternalLink className="w-4 h-4 text-blue-700" />
                <span>Verified Google Web Sources ({result.sources.length})</span>
              </div>
              <p className="text-xs text-slate-500">
                These external web pages were consulted by Google Search Grounding to verify this information:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {result.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all group"
                  >
                    <div className="truncate mr-3">
                      <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700 truncate">
                        {src.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">{src.uri}</div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Search Queries Used */}
          {result.searchQueries && result.searchQueries.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-100 text-xs text-slate-600 flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-700">Google Search Queries:</span>
              {result.searchQueries.map((q, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[11px]">
                  "{q}"
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Initial Empty / Prompt State */}
      {!isLoading && !result && !error && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 mx-auto flex items-center justify-center">
            <Globe className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-slate-900">
              Ready to Search Live Mobile Market Data
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enter any handset model name above or pick a preset to check exact retail rates, used market valuations,
              and official PTA tax regulations with Google Search citations.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
