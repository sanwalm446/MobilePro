// ============================================================================
// MOBIFLOW GOOGLE SEARCH GROUNDING SERVICE
// Powered by gemini-2.5-flash with googleSearch tool
// Real-time Mobile Market Prices, Official PTA Tax Verification & Specs
// ============================================================================

export type MarketSearchCategory = 'market' | 'price' | 'pta' | 'specs' | 'trends';

export interface MarketSource {
  title: string;
  uri: string;
}

export interface MarketSearchResponse {
  success: boolean;
  model: string;
  answer: string;
  sources: MarketSource[];
  searchQueries: string[];
  grounded: boolean;
  timestamp?: string;
  code?: string;
  message?: string;
}

export interface AiServiceStatus {
  success: boolean;
  configured: boolean;
  model: string;
  features: string[];
}

export async function checkAiServiceStatus(): Promise<AiServiceStatus> {
  try {
    const res = await fetch('/api/ai/status');
    if (!res.ok) {
      return {
        success: false,
        configured: false,
        model: 'gemini-2.5-flash',
        features: [],
      };
    }
    return await res.json();
  } catch {
    return {
      success: false,
      configured: false,
      model: 'gemini-2.5-flash',
      features: [],
    };
  }
}

export async function queryGoogleSearchGrounding(
  query: string,
  category: MarketSearchCategory = 'market',
  country: string = 'Pakistan'
): Promise<MarketSearchResponse> {
  const response = await fetch('/api/ai/google-search-grounding', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, category, country }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to retrieve Google search grounded data.');
  }

  return data;
}

// Preset Quick Query Helpers for Mobile Shopkeepers
export const MARKET_SEARCH_PRESETS = [
  {
    id: 'pta-iphone',
    title: 'iPhone 16 Pro Max PTA Tax & Slabs',
    query: 'iPhone 16 Pro Max official PTA tax in Pakistan on Passport vs CNIC 2025 2026',
    category: 'pta' as MarketSearchCategory,
    badge: 'Official PTA',
  },
  {
    id: 'price-s24',
    title: 'Samsung S24 Ultra Current Market Price',
    query: 'Samsung Galaxy S24 Ultra current market price in Pakistan brand new vs used',
    category: 'price' as MarketSearchCategory,
    badge: 'Market Price',
  },
  {
    id: 'price-redmi',
    title: 'Redmi Note 14 Pro Specs & Pakistan Price',
    query: 'Xiaomi Redmi Note 14 Pro official price in Pakistan and release date specs',
    category: 'price' as MarketSearchCategory,
    badge: 'Price & Specs',
  },
  {
    id: 'price-vivo',
    title: 'Vivo V40 5G Retail vs Wholesale Rate',
    query: 'Vivo V40 5G retail and wholesale market rate in Pakistan today',
    category: 'price' as MarketSearchCategory,
    badge: 'Market Rate',
  },
  {
    id: 'pta-slabs',
    title: 'Latest PTA Tax Slabs 2025/2026',
    query: 'Current mobile phone PTA tax slabs and regulatory rates in Pakistan 2025 2026',
    category: 'pta' as MarketSearchCategory,
    badge: 'Regulations',
  },
  {
    id: 'trends-flagships',
    title: 'Top Selling Mobile Handsets & Resale Value',
    query: 'Most in-demand mobile phones and highest resale value models in Pakistan right now',
    category: 'trends' as MarketSearchCategory,
    badge: 'Shop Insights',
  },
];
