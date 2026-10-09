import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  TrendingUp,
  CreditCard,
  ArrowRight,
  ChevronDown,
  Zap,
  BarChart3,
  Users,
  Search,
  Check,
  Phone,
  Award,
  Calendar,
  Layers,
  Sparkles,
  FileCheck,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Clock,
  ArrowUpRight,
  Building2,
  FileText,
  BadgeCheck,
  AlertCircle,
  Receipt,
  CheckCircle,
  ShoppingBag,
  Shield,
  Coins,
  Wallet,
  ArrowDownLeft,
  DollarSign,
  Headphones,
  Sliders,
  X,
  Send,
  Lock,
  Store,
  LogIn,
  UserPlus,
  Globe,
} from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MobiFlowBrandLogo } from '../common/MobiFlowBrandLogo';
import { FounderSection, FounderHomepageTeaser } from './FounderSection';

interface LandingPageProps {
  onNavigateToLogin: (tab?: 'login' | 'signup') => void;
  onOpenApp: () => void;
  isAuthenticated: boolean;
  userName?: string;
  onLaunchDemo?: () => void;
}

// 7-Day sample data for the real dashboard showcase inside the laptop
const SHOWCASE_7DAY_CHART = [
  { label: 'Thu, 10/1', sales: 320000, purchases: 280000 },
  { label: 'Fri, 10/2', sales: 410000, purchases: 195000 },
  { label: 'Sat, 10/3', sales: 580000, purchases: 340000 },
  { label: 'Sun, 10/4', sales: 490000, purchases: 210000 },
  { label: 'Mon, 10/5', sales: 360000, purchases: 180000 },
  { label: 'Tue, 10/6', sales: 440000, purchases: 310000 },
  { label: 'Wed, 10/7', sales: 520000, purchases: 260000 },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToLogin,
  onOpenApp,
  isAuthenticated,
  userName = 'Muhammad Sanwal',
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [activeFeatureTab, setActiveFeatureTab] = useState<
    'dashboard' | 'sales' | 'stock' | 'purchases' | 'expenses' | 'profit' | 'customers' | 'attendance' | 'google-search'
  >('dashboard');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Demo consultation form state
  const [demoShopName, setDemoShopName] = useState('');
  const [demoCity, setDemoCity] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [demoMessageSent, setDemoMessageSent] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendDemoRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Assalam o Alaikum MobiFlow Software Team,%0A%0AI would like to request a demo and shop onboarding for:%0A*Shop Name:* ${encodeURIComponent(
      demoShopName || 'My Mobile Shop'
    )}%0A*City:* ${encodeURIComponent(demoCity || 'Pakistan')}%0A*Phone:* ${encodeURIComponent(
      demoPhone || 'N/A'
    )}%0A%0APlease connect with me for software setup.`;

    window.open(`https://wa.me/923292920600?text=${text}`, '_blank');
    setDemoMessageSent(true);
    setTimeout(() => {
      setShowDemoModal(false);
      setDemoMessageSent(false);
    }, 2500);
  };

  // Safe display name: prioritize Muhammad Sanwal if default
  const cleanDisplayName = userName && userName !== 'Hafiz Usman' ? userName : 'Muhammad Sanwal';

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP ANNOUNCEMENT BAR (Soft Sky Blue & Emerald Gradient)     */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-blue-50 via-emerald-50 to-sky-50 border-b border-blue-100/80 px-4 py-2 text-center text-xs text-slate-700 flex flex-wrap items-center justify-center gap-2">
        <span className="font-bold flex items-center gap-1.5 text-blue-800">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>MobiFlow Software v3.4:</span>
        </span>
        <span className="hidden sm:inline font-medium text-slate-600">
          Smart Mobile Shop Management · Dual-IMEI Strict Validation & Staff Attendance Records
        </span>
        <div className="flex items-center gap-2">
          <a
            href="tel:03292920600"
            className="hidden md:inline-flex items-center gap-1 text-blue-700 font-bold hover:underline"
          >
            <Phone className="w-3 h-3 text-emerald-600" />
            <span>0329-2920600</span>
          </a>
          <button
            onClick={() => onNavigateToLogin('signup')}
            className="px-2.5 py-0.5 rounded-full bg-blue-700 hover:bg-blue-800 text-white font-bold transition-all cursor-pointer text-[11px]"
          >
            Start Free Trial →
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. HEADER / NAVBAR (White with Clean Soft Blur & Logo)       */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo Zone */}
          <div className="flex items-center gap-3">
            <MobiFlowBrandLogo size="md" theme="light" showText={true} />
          </div>

          {/* Desktop Navigation Links (Zone 2) */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-700">
            <button
              onClick={() => scrollToSection('hero')}
              className="hover:text-blue-700 transition-colors cursor-pointer py-1"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-blue-700 transition-colors cursor-pointer py-1"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('solutions')}
              className="hover:text-blue-700 transition-colors cursor-pointer py-1"
            >
              Solutions
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-blue-700 transition-colors cursor-pointer py-1"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="hover:text-blue-700 transition-colors cursor-pointer py-1"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="hover:text-blue-700 transition-colors cursor-pointer py-1"
            >
              About Founder
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="hover:text-blue-700 transition-colors cursor-pointer py-1"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="hover:text-blue-700 transition-colors cursor-pointer py-1 text-blue-700 font-bold"
            >
              Contact
            </button>
          </nav>

          {/* Right Action Buttons (Zone 3) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* 1. Enter Workspace Button */}
            <button
              type="button"
              onClick={isAuthenticated ? onOpenApp : () => onNavigateToLogin('login')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer border ${
                isAuthenticated
                  ? 'text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border-emerald-300'
                  : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200'
              }`}
              title={isAuthenticated ? `Open active workspace for ${cleanDisplayName}` : 'Sign in to access your shop workspace'}
            >
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAuthenticated ? `Workspace (${cleanDisplayName})` : 'Enter Workspace'}</span>
            </button>

            {/* 2. Start Free Trial (Prominent Primary Call-to-Action) */}
            <button
              type="button"
              onClick={() => onNavigateToLogin('signup')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-800 hover:via-blue-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-blue-700/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="Start your free trial now"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer ml-1"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3 shadow-lg">
            <button
              onClick={() => scrollToSection('hero')}
              className="block w-full text-left py-2 text-xs font-semibold text-slate-700 hover:text-blue-700"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left py-2 text-xs font-semibold text-slate-700 hover:text-blue-700"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('solutions')}
              className="block w-full text-left py-2 text-xs font-semibold text-slate-700 hover:text-blue-700"
            >
              Solutions
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left py-2 text-xs font-semibold text-slate-700 hover:text-blue-700"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="block w-full text-left py-2 text-xs font-semibold text-slate-700 hover:text-blue-700"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="block w-full text-left py-2 text-xs font-semibold text-slate-700 hover:text-blue-700"
            >
              About Founder
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="block w-full text-left py-2 text-xs font-semibold text-slate-700 hover:text-blue-700"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="block w-full text-left py-2 text-xs font-bold text-blue-700"
            >
              Contact
            </button>
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isAuthenticated) {
                    onOpenApp();
                  } else {
                    onNavigateToLogin('login');
                  }
                }}
                className="w-full py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 shadow-2xs cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAuthenticated ? `Enter Workspace (${cleanDisplayName})` : 'Enter Workspace'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateToLogin('signup');
                }}
                className="w-full py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl shadow-md shadow-blue-700/20 cursor-pointer"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 3. HERO SECTION: White, Soft Light Blue, Emerald Glow         */}
      {/* ------------------------------------------------------------- */}
      <section
        id="hero"
        className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 overflow-hidden bg-gradient-to-b from-[#f8fafc] via-[#f0f7ff] to-white"
      >
        {/* Soft atmospheric gradient blurs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-blue-200/30 blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute top-20 right-10 w-[450px] h-[350px] bg-emerald-200/25 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Product Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-blue-200/80 text-blue-900 text-xs font-bold mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Smart Mobile Shop Management Software</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-950 tracking-tight leading-[1.12] max-w-5xl mx-auto">
            Manage your mobile shop with{' '}
            <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-emerald-600 bg-clip-text text-transparent">
              complete clarity & zero errors.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
            Run your mobile shop smarter with powerful tools for sales, inventory, purchases, expenses, profit
            tracking, customers, suppliers, staff and business reporting — all in one connected system.
          </p>

          {/* Primary Action & Direct Authentication Buttons in Hero Section */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
            {/* 1. Login Button */}
            <button
              type="button"
              onClick={() => onNavigateToLogin('login')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md shadow-slate-900/20 transition-all cursor-pointer hover:scale-[1.01] flex items-center justify-center gap-2 border border-slate-800"
              title="Sign in to your MobiFlow account"
            >
              <LogIn className="w-4 h-4 text-emerald-400" />
              <span>Login</span>
            </button>

            {/* 2. Sign Up / Create Account Button */}
            <button
              type="button"
              onClick={() => onNavigateToLogin('signup')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-sm shadow-lg shadow-blue-700/25 transition-all cursor-pointer hover:scale-[1.01] flex items-center justify-center gap-2"
              title="Create a new store workspace"
            >
              <UserPlus className="w-4 h-4 text-white" />
              <span>Sign Up / Create Account</span>
            </button>

            {/* 3. Start Free Trial */}
            <button
              type="button"
              onClick={() => onNavigateToLogin('signup')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-sm border border-blue-200 transition-all cursor-pointer flex items-center justify-center gap-2"
              title="Start your 14-day free trial"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* 4. View Features */}
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>View Features</span>
            </button>

            {/* 5. Request Demo */}
            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-sm border border-emerald-200 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              <span>Request Demo</span>
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Real-Time Stock & Profit Tracking
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Dual-IMEI Strict Validation
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Staff Attendance Records
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> 100% Isolated Tenant Security
            </span>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* HERO VISUAL: REAL MOBIFLOW DASHBOARD IN PREMIUM LAPTOP FRAME */}
          {/* ------------------------------------------------------------- */}
          <div className="mt-14 max-w-5xl mx-auto relative group">
            {/* Ambient metallic chassis glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-sky-500/10 rounded-3xl blur-2xl opacity-70 group-hover:opacity-100 transition-opacity" />

            {/* Laptop Display Outer Bezel */}
            <div className="relative bg-[#1e293b] p-3 sm:p-4 rounded-t-3xl rounded-b-lg shadow-2xl border-4 border-slate-700/60 ring-1 ring-slate-900/10">
              {/* Laptop Top Camera Notch */}
              <div className="flex items-center justify-center gap-2 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-slate-600/50" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
              </div>

              {/* Inside Screen: REAL MOBIFLOW DASHBOARD PREVIEW */}
              <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200 text-left p-4 sm:p-6 shadow-inner font-sans">
                {/* Dashboard Top Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-700 text-white font-bold flex items-center justify-center shadow-xs">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>MobiFlow Software</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Live Active Workspace
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Owner: <span className="font-semibold text-slate-800">Muhammad Sanwal</span> · Smart Mobile Shop POS & Inventory
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200">
                      7-Day Revenue Sync
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                      Live Demonstration Mode
                    </span>
                  </div>
                </div>

                {/* Real KPI Cards Strip (5 Marquee Metrics) */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">Total Mobile Stock</div>
                    <div className="text-sm sm:text-base font-bold text-slate-900 font-mono mt-0.5">48 Units</div>
                    <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Val: Rs. 4,210,000</div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">Accessories Stock</div>
                    <div className="text-sm sm:text-base font-bold text-slate-900 font-mono mt-0.5">142 Items</div>
                    <div className="text-[10px] text-blue-700 font-medium mt-0.5">Val: Rs. 285,000</div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">Today's Sales</div>
                    <div className="text-sm sm:text-base font-bold text-slate-900 font-mono mt-0.5">Rs. 435,000</div>
                    <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Cash & Ledger</div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">Gross Profit (Today)</div>
                    <div className="text-sm sm:text-base font-bold text-emerald-700 font-mono mt-0.5">+ Rs. 38,500</div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">Margin: ~8.8%</div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">Cash In Drawer</div>
                    <div className="text-sm sm:text-base font-bold text-blue-900 font-mono mt-0.5">Rs. 540,000</div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">Drawer Tally OK</div>
                  </div>
                </div>

                {/* Real 7-Day Sales Volume Chart in Blue & Yellow (Recharts) */}
                <div className="mt-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-blue-700" />
                        <span>Daily Sales Revenue & Acquisition Volume (Last 7 Days)</span>
                      </h4>
                      <p className="text-[10px] text-slate-500">Real transaction trends: Blue (Sales) and Yellow (Purchases)</p>
                    </div>

                    <div className="flex items-center gap-3 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-blue-600" />
                        <span className="text-slate-600 font-medium">Sales Revenue (Blue)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-amber-400" />
                        <span className="text-slate-600 font-medium">Purchases (Yellow)</span>
                      </div>
                    </div>
                  </div>

                  {/* Recharts Bar Component */}
                  <div className="h-44 mt-3 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={SHOWCASE_7DAY_CHART} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `Rs.${v / 1000}k`} />
                        <Tooltip
                          formatter={(value: any, name: any) => [
                            `Rs. ${Number(value).toLocaleString()}`,
                            name === 'sales' ? 'Sales Revenue' : 'Stock Purchases',
                          ]}
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderRadius: '8px',
                            border: 'none',
                            color: '#fff',
                            fontSize: '11px',
                            padding: '6px 10px',
                          }}
                        />
                        <Bar dataKey="sales" name="Sales Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={22} />
                        <Bar dataKey="purchases" name="Stock Purchases" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={22} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Laptop Base Stand / Hinge */}
            <div className="relative mx-auto w-[96%] h-4 bg-slate-800 rounded-b-2xl border-t border-slate-700 shadow-xl">
              <div className="w-24 h-1.5 bg-slate-600 mx-auto rounded-full mt-1" />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. MAIN FEATURES SHOWCASE (Interactive Real Workflow Tabs)    */}
      {/* ------------------------------------------------------------- */}
      <section id="features" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700">
              CORE PRODUCT CAPABILITIES
            </h2>
            <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Everything Your Mobile Shop Needs in One Place
            </h3>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Explore the real features engineered specifically for mobile device retailers, accessories shops,
              and wholesale suppliers across Pakistan.
            </p>
          </div>

          {/* Interactive Feature Selectors */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'dashboard', label: '1. Smart Dashboard', icon: BarChart3 },
              { id: 'profit', label: '2. Profit Management', icon: TrendingUp },
              { id: 'stock', label: '3. Stock & Inventory', icon: Smartphone },
              { id: 'sales', label: '4. Sales & POS', icon: Zap },
              { id: 'purchases', label: '5. Purchase Management', icon: ShoppingBag },
              { id: 'expenses', label: '6. Expense Tracking', icon: Receipt },
              { id: 'customers', label: '7. Customer & Supplier Khata', icon: Users },
              { id: 'attendance', label: '8. Staff & Attendance', icon: Calendar },
              { id: 'google-search', label: '9. Google Search Data', icon: Globe },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFeatureTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFeatureTab(tab.id as any)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20 scale-102'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Feature Deep Dive Panel */}
          <div className="mt-8 bg-slate-50 rounded-2xl border border-slate-200/80 p-6 sm:p-10 shadow-xs">
            {/* 1. Smart Dashboard */}
            {activeFeatureTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700">
                    <BarChart3 className="w-4 h-4" /> REAL-TIME BUSINESS OVERVIEW
                  </div>
                  <h4 className="text-2xl font-bold text-slate-950">
                    Smart Dashboard for Instant Financial Clarity
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    View total mobile stock, accessories count, today's sales, purchases, gross profit, cash in drawer,
                    customer receivables, and supplier payables at a single glance.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700 font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Live 10 KPI indicators updated automatically on every transaction</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Visual 7-day sales and transaction volume chart in Blue and Yellow</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Instant inventory condition breakdown (New, Used, Open Box)</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 font-mono text-xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Live Metric Breakdown</div>
                  <div className="grid grid-cols-2 gap-2 text-slate-900">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-500">Mobile Stock</div>
                      <div className="font-bold text-sm">48 Sets (Rs. 4.2M)</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-500">Accessories</div>
                      <div className="font-bold text-sm">142 Items (Rs. 285k)</div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <div className="text-[10px] text-emerald-700">Today Sales</div>
                      <div className="font-bold text-sm text-emerald-800">Rs. 435,000</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-[10px] text-blue-700">Cash in Drawer</div>
                      <div className="font-bold text-sm text-blue-800">Rs. 540,000</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Profit Management */}
            {activeFeatureTab === 'profit' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <TrendingUp className="w-4 h-4" /> PROFIT MANAGEMENT
                  </div>
                  <h4 className="text-2xl font-bold text-slate-950">
                    Know Your Profit. Grow Your Business.
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Stop guessing your earnings at the end of the month. MobiFlow automatically calculates exact gross
                    profit on every sold phone, deducts daily shop operating expenses, and computes net profit margins.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700 font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Automatic purchase cost deduction on every retail and wholesale sale</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>30-day profit margin analytics and historical financial trends</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Granular role protection: prevent salesmen from seeing your purchase costs</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                    <span>TRANSACTION PROFIT LOG</span>
                    <span className="text-emerald-700">MARGIN: 8.8%</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg space-y-1 text-slate-800">
                    <div className="flex justify-between font-bold">
                      <span>iPhone 15 Pro Max 256GB</span>
                      <span>Rs. 435,000</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Inward Purchase Cost:</span>
                      <span>- Rs. 418,000</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-200 pt-1">
                      <span>Gross Profit Earned:</span>
                      <span>+ Rs. 17,000</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Stock & Inventory Control */}
            {activeFeatureTab === 'stock' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700">
                    <Smartphone className="w-4 h-4" /> STOCK & INVENTORY
                  </div>
                  <h4 className="text-2xl font-bold text-slate-950">
                    Complete Stock Control for Your Mobile Shop
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Track mobile handsets with Dual-IMEI 1 & 2 validation, warranty period, condition (New, Used, Open Box),
                    and manage complete accessories with barcode scanning and low-stock alerts.
                  </p>
                  <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600 font-medium">
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">Mobile Phones</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">Chargers & Adapters</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">Cables & Handsfree</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">AirPods & Earbuds</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">LCD Panels & Batteries</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">Covers & Protectors</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">Power Banks & Smart Watches</span>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2.5 font-mono text-xs">
                  <div className="text-[11px] font-bold text-slate-700">DUAL-IMEI AUDIT SAMPLE</div>
                  <div className="p-3 bg-slate-50 rounded-lg space-y-1 text-slate-800">
                    <div className="font-bold text-slate-900">Samsung Galaxy S24 Ultra (Titanium Gray)</div>
                    <div className="text-slate-600">IMEI 1: 358491029481723</div>
                    <div className="text-slate-600">IMEI 2: 358491029481731</div>
                    <div className="text-emerald-700 font-bold text-[11px]">✓ Official PTA Approved · In Stock</div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Sales Management */}
            {activeFeatureTab === 'sales' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700">
                    <Zap className="w-4 h-4" /> POINT OF SALE COUNTER
                  </div>
                  <h4 className="text-2xl font-bold text-slate-950">
                    Fast Counter Billing & Customer Checkout
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Create sales in under 15 seconds. Select customer, scan handset IMEI or accessories barcode, apply allowable
                    discounts, record cash or khata payments, and generate invoices with automatic ledger updating.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700 font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Multiple payment methods: Cash, Bank Transfer, JazzCash, EasyPaisa, or Udhar</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Direct phone trade-in exchange calculation with differential balance</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 font-mono text-xs text-slate-800">
                  <div className="text-[11px] font-bold text-slate-600 uppercase">POS Checkout Summary</div>
                  <div className="p-2.5 bg-slate-50 rounded-lg flex justify-between">
                    <span>Item Sold:</span>
                    <span className="font-bold text-slate-900">Redmi Note 13 Pro 5G</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg flex justify-between">
                    <span>Retail Price:</span>
                    <span className="font-bold text-slate-900">Rs. 118,000</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-lg flex justify-between text-emerald-800 font-bold">
                    <span>Payment Received:</span>
                    <span>Rs. 118,000 (Cash)</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Purchase Management */}
            {activeFeatureTab === 'purchases' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700">
                    <ShoppingBag className="w-4 h-4" /> PURCHASE & INWARD STOCK
                  </div>
                  <h4 className="text-2xl font-bold text-slate-950">
                    Supplier Purchasing & Wholesale Shipments
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Record stock acquisitions directly from wholesale dealers. Add suppliers, log incoming handset batches with
                    cost price, increase stock automatically, and maintain payables ledgers.
                  </p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 font-mono text-xs text-slate-800">
                  <div className="text-[11px] font-bold text-slate-600 uppercase">Supplier Inward Record</div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <div>Supplier: <strong className="text-slate-900">Al-Rehman Mobiles, Hafeez Centre</strong></div>
                    <div className="text-slate-600 mt-1">Batch: 10x Vivo V30 5G · Total: Rs. 1,220,000</div>
                    <div className="text-blue-700 font-bold mt-1">✓ Stock increased +10 units automatically</div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Expense Tracking */}
            {activeFeatureTab === 'expenses' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700">
                    <Receipt className="w-4 h-4" /> EXPENSE TRACKING
                  </div>
                  <h4 className="text-2xl font-bold text-slate-950">
                    Track Every Business Expense
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Record day-to-day shop operational expenses: Shop Rent, Electricity Bills, Internet, Staff Salaries,
                    Transport, and Repairs. All recorded expenses directly contribute to real net profit calculation.
                  </p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 font-mono text-xs text-slate-800">
                  <div className="text-[11px] font-bold text-slate-600 uppercase">Daily Expense Register</div>
                  <div className="p-2 bg-slate-50 rounded flex justify-between">
                    <span>Shop Electricity Bill</span>
                    <span className="font-bold">Rs. 18,500</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded flex justify-between">
                    <span>Counter Staff Tea & Refreshments</span>
                    <span className="font-bold">Rs. 2,400</span>
                  </div>
                  <div className="p-2 bg-rose-50 rounded flex justify-between text-rose-800 font-bold">
                    <span>Total Expenses Deducted</span>
                    <span>Rs. 20,900</span>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Customers & Suppliers */}
            {activeFeatureTab === 'customers' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700">
                    <Users className="w-4 h-4" /> KHATA & LEDGERS
                  </div>
                  <h4 className="text-2xl font-bold text-slate-950">
                    Customer Udhar & Supplier Payables Ledgers
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Maintain accurate customer credit accounts with partial payments, remaining balances, and credit limits.
                    Never lose track of who owes you money or what you owe wholesale suppliers.
                  </p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 font-mono text-xs text-slate-800">
                  <div className="text-[11px] font-bold text-slate-600 uppercase">Customer Khata Statement</div>
                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="font-bold text-slate-900">Malik Tariq (Wholesale Dealer)</div>
                    <div className="text-slate-600 text-[11px]">Phone: 0300-8844221</div>
                    <div className="flex justify-between font-bold text-rose-700 mt-1 pt-1 border-t border-amber-200">
                      <span>Outstanding Balance:</span>
                      <span>Rs. 185,000</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 8. Staff & Attendance */}
            {activeFeatureTab === 'attendance' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700">
                    <Calendar className="w-4 h-4" /> TEAM MANAGEMENT & ATTENDANCE
                  </div>
                  <h4 className="text-2xl font-bold text-slate-950">
                    Staff Profiles & Daily Attendance Tracking
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Store real employee profiles with photos, designations, CNIC numbers, father's names, home addresses,
                    and emergency contacts. Punch in/out daily to track present, late, and absent days.
                  </p>
                  {/* Coming Soon Notice for Attendance-Based Salary */}
                  <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-blue-900">
                    <div className="font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-700" />
                      <span>Staff Salary Management — Coming Soon</span>
                    </div>
                    <p className="text-[11px] text-blue-700 mt-1">
                      Manage employee salaries and automate attendance-based salary calculations in an upcoming MobiFlow release.
                    </p>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2.5 font-mono text-xs text-slate-800">
                  <div className="text-[11px] font-bold text-slate-600 uppercase">Verified Staff Record</div>
                  <div className="p-3 bg-slate-50 rounded-lg flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-700 text-white font-bold flex items-center justify-center text-xs">
                      ZB
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Zeeshan Butt (Senior Salesman)</div>
                      <div className="text-[11px] text-slate-600">S/O Muhammad Aslam Butt · CNIC: 35202-6184920-1</div>
                      <div className="text-emerald-700 text-[10px] font-bold mt-0.5">✓ Today Check-In: 09:12 AM</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 9. Google Search Data & Market Intelligence */}
            {activeFeatureTab === 'google-search' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700">
                    <Globe className="w-4 h-4" /> GOOGLE SEARCH GROUNDING · GEMINI 2.5 FLASH
                  </div>
                  <h4 className="text-2xl font-bold text-slate-950">
                    Real-Time Mobile Market Prices & Official PTA Taxes
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Never sell at a loss or quote outdated prices again. MobiFlow connects directly to live Google Search
                    data using <strong>gemini-2.5-flash</strong> with real-time web search grounding to verify official retail launch
                    prices, wholesale market rates, and official PTA tax registration slabs with direct web citations.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700 font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Live market prices for Pakistan and international handsets with brand new vs used benchmarks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Official PTA regulatory tax calculation on Passport vs CNIC registration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Direct clickable Google Search web sources and citations for complete transparency</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 font-mono text-xs text-slate-800">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                    <span className="flex items-center gap-1 text-blue-700">
                      <Globe className="w-3.5 h-3.5" /> GOOGLE SEARCH GROUNDED RESULT
                    </span>
                    <span className="text-emerald-700 font-bold">MODEL: gemini-2.5-flash</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 border border-slate-200">
                    <div className="font-bold text-slate-900 text-sm">iPhone 16 Pro Max 256GB (Pakistan Market)</div>
                    <div className="text-slate-600 text-[11px]">
                      • Official PTA Approved Retail: <strong className="text-slate-900">Rs. 515,000 – 535,000</strong>
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      • Non-PTA / JV Physical SIM: <strong className="text-slate-900">Rs. 365,000 – 380,000</strong>
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      • Official PTA Tax Slab (CNIC): <strong className="text-emerald-700">~Rs. 155,000</strong>
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      • Official PTA Tax Slab (Passport): <strong className="text-blue-700">~Rs. 132,000</strong>
                    </div>
                  </div>

                  <div className="p-2.5 bg-blue-50/70 rounded-lg border border-blue-200/80 space-y-1 text-[11px]">
                    <div className="font-bold text-blue-900 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3 text-blue-600" /> Grounded Web Citations:
                    </div>
                    <div className="text-blue-800 flex flex-wrap gap-1.5 text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-white border border-blue-200">dirbs.pta.gov.pk</span>
                      <span className="px-2 py-0.5 rounded bg-white border border-blue-200">propakistani.pk</span>
                      <span className="px-2 py-0.5 rounded bg-white border border-blue-200">whatmobile.com.pk</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. SOLUTIONS SECTION (WHO MOBIFLOW IS FOR)                    */}
      {/* ------------------------------------------------------------- */}
      <section id="solutions" className="py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700">
              TAILORED SOLUTIONS
            </h2>
            <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Built for Every Mobile Business Model
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              Whether you manage a single retail counter or a multi-staff distribution warehouse, MobiFlow adapts to your scale.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Mobile Retail Shops</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fast POS billing, dual IMEI verification, second-hand phone checking warranties, customer udhar ledgers,
                and daily cash drawer reconciliation.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Headphones className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Accessories & Spare Parts Stores</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Complete category stock management: chargers, cables, earbuds, covers, screens, batteries, low stock alerts,
                and fast barcode checkout.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Wholesale Dealers & Distributors</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Wholesale pricing tiers, bulk batch purchasing, supplier payables, dealer credit management, multi-role staff
                permissions, and business reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. HOW IT WORKS (7 STEPS WORKFLOW)                            */}
      {/* ------------------------------------------------------------- */}
      <section id="how-it-works" className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700">
              SIMPLE ONBOARDING
            </h2>
            <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Get Started in 7 Simple Steps
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              No technical setup needed. Start managing your mobile counter within minutes.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { num: '01', title: 'Create Your Shop', desc: 'Sign up in 30 seconds and activate your isolated shop workspace.' },
              { num: '02', title: 'Add Products & Stock', desc: 'Enter mobile phones with IMEIs or add accessories with barcodes.' },
              { num: '03', title: 'Manage Sales & Purchases', desc: 'Perform fast counter checkouts and record incoming supplier stock.' },
              { num: '04', title: 'Track Expenses & Profit', desc: 'Log shop utility bills, tea, and calculate live gross profit margins.' },
              { num: '05', title: 'Manage Khata & Ledgers', desc: 'Track customer udhar balances and supplier wholesale payables.' },
              { num: '06', title: 'Manage Staff & Attendance', desc: 'Add employee profiles with photos, CNIC cards, and punch in/out.' },
              { num: '07', title: 'Monitor Dashboard', desc: 'View live 10 KPI indicators, 7-day volume charts, and generate business reports.' },
            ].map((step) => (
              <div key={step.num} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                <span className="text-2xl font-black text-blue-700 font-mono">{step.num}</span>
                <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6.5 HOMEPAGE FOUNDER TEASER: BUILT WITH A VISION              */}
      {/* ------------------------------------------------------------- */}
      <FounderHomepageTeaser onMeetFounderClick={() => scrollToSection('about')} />

      {/* ------------------------------------------------------------- */}
      {/* 7. PRICING & SUBSCRIPTIONS (Basic Rs. 1,500 / Pro Rs. 2,500)  */}
      {/* ------------------------------------------------------------- */}
      <section id="pricing" className="py-20 bg-gradient-to-b from-[#f8fafc] via-[#f0f7ff] to-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700">
              TRANSPARENT PRICING
            </h2>
            <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Simple, Affordable Plans for Every Mobile Shop
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              Start with a free trial. Upgrade anytime to unlock advanced features. Prices in Pakistani Rupees (PKR).
            </p>

            {/* Billing Toggle */}
            <div className="mt-6 inline-flex items-center p-1 bg-slate-200/80 rounded-xl">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Plan
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === 'annual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Annual Plan</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">12-Month Access</span>
              </button>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {/* Free Trial Tier */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TRIAL ACCESS</span>
                <h4 className="text-lg font-bold text-slate-900 mt-1">Start Free</h4>
                <p className="text-xs text-slate-500 mt-1">Explore MobiFlow with limited access before upgrading.</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 font-mono">Rs. 0</span>
                  <span className="text-xs text-slate-500">/ 7-day trial</span>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Single Counter POS Access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Basic Mobile Stock Entry</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Customer & Supplier Records</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Admin-Configurable Duration</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => onNavigateToLogin('signup')}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  Start Free Trial
                </button>
              </div>
            </div>

            {/* Plan 1: BASIC (Rs. 1,500 / month) */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-md flex flex-col justify-between relative">
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">STANDARD RETAIL</span>
                <h4 className="text-lg font-bold text-slate-900 mt-1">Basic Plan</h4>
                <p className="text-xs text-slate-500 mt-1">Ideal for single-counter retail mobile shops.</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 font-mono">Rs. 1,500</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Smart Dashboard & Analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Complete Sales & Purchases POS</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dual-IMEI Mobile Inventory Tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Customer Udhar & Supplier Ledgers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Expense Tracking & Profit Calculations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Standard Business Reports</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => onNavigateToLogin('signup')}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Choose Basic Plan
                </button>
              </div>
            </div>

            {/* Plan 2: PRO (Rs. 2,500 / month) - Featured */}
            <div className="bg-white p-7 rounded-2xl border-2 border-blue-600 shadow-xl shadow-blue-600/10 flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                MOST POPULAR
              </div>

              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">ALL-INCLUSIVE PRO</span>
                <h4 className="text-lg font-bold text-slate-900 mt-1">Pro Plan</h4>
                <p className="text-xs text-slate-500 mt-1">Full software suite for growing shops & multi-staff counters.</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-blue-700 font-mono">Rs. 2,500</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Everything in Basic Plan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unlimited Inventory & Wholesale Products</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Staff Profiles & Daily Attendance Tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>65-Permission Role-Based User Controls</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Shop Branding & Custom Logo on Invoices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Advanced Financial Analytics & PDF Reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Priority WhatsApp Engineering Support</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => onNavigateToLogin('signup')}
                  className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-700/25 transition-all cursor-pointer"
                >
                  Activate Pro License
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. ABOUT MOBIFLOW & FOUNDER EXPERIENCE                        */}
      {/* ------------------------------------------------------------- */}
      <FounderSection onContactClick={() => scrollToSection('contact')} />

      {/* ------------------------------------------------------------- */}
      {/* 9. FREQUENTLY ASKED QUESTIONS (FAQ)                           */}
      {/* ------------------------------------------------------------- */}
      <section id="faq" className="py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700">
              FREQUENTLY ASKED QUESTIONS
            </h2>
            <h3 className="mt-2 text-3xl font-extrabold text-slate-950 tracking-tight">
              Common Questions & Answers
            </h3>
          </div>

          <div className="mt-12 space-y-3">
            {[
              {
                q: 'What is MobiFlow?',
                a: 'MobiFlow Software is an enterprise management platform designed specifically for smartphone retailers, wholesale dealers, and mobile accessories shops to manage daily sales, dual-IMEI stock, customer khatas, expenses, and gross profit.',
              },
              {
                q: 'Is MobiFlow designed specifically for mobile shops?',
                a: 'Yes. Every feature—from dual-IMEI Luhn verification, PTA status tagging, used phone condition grades (New, Used, Open Box), to customer credit balances—is tailored directly for the mobile electronics business.',
              },
              {
                q: 'Can I manage mobile phones and accessories?',
                a: 'Yes. You can manage smartphones with full IMEI audit trails alongside a dedicated accessories catalog covering chargers, data cables, handsfree, AirPods, covers, screen protectors, batteries, and LCD panels.',
              },
              {
                q: 'Can I track real profit per phone?',
                a: 'Yes. MobiFlow automatically deducts the inward purchase cost from the sale price to calculate exact gross profit on each transaction, subtracting operating shop expenses to give you your true net profit.',
              },
              {
                q: 'Does MobiFlow support staff attendance?',
                a: 'Yes. MobiFlow includes employee profile management and daily attendance tracking (Present, Late, Absent, Leave) with single-click check-in and check-out recording.',
              },
              {
                q: 'What happens after the free trial?',
                a: 'When your trial period concludes, your shop records and stock data remain completely safe and intact. You can easily upgrade to either the Basic plan (Rs. 1,500/month) or Pro plan (Rs. 2,500/month) to continue using premium features.',
              },
              {
                q: 'What is the price of Basic and Pro plans?',
                a: 'The Basic plan is Rs. 1,500 / month for single-counter shops. The Pro plan is Rs. 2,500 / month, which includes staff attendance, wholesale products, custom shop branding, and advanced multi-role permissions.',
              },
              {
                q: 'Are my shop records isolated from other customers?',
                a: 'Yes. MobiFlow enforces strict multi-tenant isolation. No visitor or other tenant can view your purchase costs, sales revenue, customer records, or stock levels.',
              },
            ].map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-blue-700' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 10. DIRECT CONTACT & SUPPORT SECTION                          */}
      {/* ------------------------------------------------------------- */}
      <section id="contact" className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-3">
            <Phone className="w-3.5 h-3.5 text-blue-700" />
            <span>EXECUTIVE LEADERSHIP & DIRECT CONTACTS</span>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-950">
            Speak Directly with Software Leadership
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Have questions about onboarding your shop or configuring your account? Contact our founders directly.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
            {/* Owner: Muhammad Sanwal */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
              <div>
                <h4 className="text-base font-bold text-slate-900">Muhammad Sanwal</h4>
                <p className="text-xs font-bold text-blue-700">Founder & Owner, MobiFlow Software</p>
                <p className="text-[11px] text-slate-500">Lead Software Architect</p>
              </div>
              <div className="pt-2 border-t border-slate-200 space-y-2 text-xs">
                <a
                  href="tel:03292920600"
                  className="flex items-center gap-2 font-mono font-bold text-slate-900 hover:text-blue-700 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-700" />
                  <span>0329-2920600</span>
                </a>
                <div className="flex gap-2 pt-1">
                  <a
                    href="tel:03292920600"
                    className="flex-1 py-1.5 px-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-[11px] text-center"
                  >
                    Contact Founder
                  </a>
                  <a
                    href="https://wa.me/923292920600"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] text-center"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Co-Owner / Owner: Muhammad Hanan */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
              <div>
                <h4 className="text-base font-bold text-slate-900">Muhammad Hanan</h4>
                <p className="text-xs font-semibold text-blue-700">Co-Owner & Operations Lead</p>
              </div>
              <div className="pt-2 border-t border-slate-200 space-y-2 text-xs">
                <a
                  href="tel:03081158191"
                  className="flex items-center gap-2 font-mono font-bold text-slate-900 hover:text-blue-700 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-700" />
                  <span>0308-1158191</span>
                </a>
                <div className="flex gap-2 pt-1">
                  <a
                    href="tel:03081158191"
                    className="flex-1 py-1.5 px-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-[11px] text-center"
                  >
                    Call
                  </a>
                  <a
                    href="https://wa.me/923081158191"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] text-center"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 11. FOOTER: Original Logo, Legal Links & Owners Info           */}
      {/* ------------------------------------------------------------- */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
            {/* Col 1: Brand & Tagline */}
            <div className="space-y-3">
              <MobiFlowBrandLogo size="md" theme="dark" showText={true} />
              <p className="text-slate-400 text-xs leading-relaxed pt-1">
                Smart Mobile Shop Management Software. Manage Sales, Stock, Purchases, Expenses, Profit, Customers,
                Staff and More — All in One Place.
              </p>
              <div className="text-[11px] text-slate-300 font-medium">
                Product: <span className="text-white font-bold">MobiFlow Software</span>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <div className="font-bold text-white text-xs mb-3 uppercase tracking-wider">Quick Links</div>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => scrollToSection('hero')} className="hover:text-white cursor-pointer">Home</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white cursor-pointer">Features</button></li>
                <li><button onClick={() => scrollToSection('solutions')} className="hover:text-white cursor-pointer">Solutions</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white cursor-pointer">How It Works</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white cursor-pointer">Pricing</button></li>
                <li><button onClick={() => scrollToSection('about')} className="hover:text-white cursor-pointer">About Founder</button></li>
              </ul>
            </div>

            {/* Col 3: Portal Access & Legal */}
            <div>
              <div className="font-bold text-white text-xs mb-3 uppercase tracking-wider">Portal & Legal</div>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => onNavigateToLogin('login')} className="hover:text-white cursor-pointer">Login to Workspace</button></li>
                <li><button onClick={() => onNavigateToLogin('signup')} className="hover:text-white cursor-pointer">Start Free Trial</button></li>
                <li><button onClick={() => setShowPrivacyModal(true)} className="hover:text-white cursor-pointer">Privacy Policy</button></li>
                <li><button onClick={() => setShowTermsModal(true)} className="hover:text-white cursor-pointer">Terms & Conditions</button></li>
              </ul>
            </div>

            {/* Col 4: Executive Leadership */}
            <div>
              <div className="font-bold text-white text-xs mb-3 uppercase tracking-wider">Owners & Contact</div>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                  <div className="text-white font-bold">Muhammad Sanwal</div>
                  <div className="text-[10px] text-sky-400 font-semibold">Founder & Owner, MobiFlow Software</div>
                  <a href="tel:03292920600" className="text-blue-400 font-mono block mt-0.5 hover:underline">
                    0329-2920600
                  </a>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                  <div className="text-white font-bold">Muhammad Hanan</div>
                  <a href="tel:03081158191" className="text-blue-400 font-mono block mt-0.5 hover:underline">
                    0308-1158191
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              © {new Date().getFullYear()} MobiFlow Software. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <span>Hafeez Centre Lahore</span>
              <span>Hall Road</span>
              <span>Saddar Karachi</span>
              <span>Rawalpindi</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: REQUEST DEMO / CONSULTATION                          */}
      {/* ------------------------------------------------------------- */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowDemoModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Request Software Demo</h3>
              <p className="text-xs text-slate-500 mt-1">Connect directly with CEO Muhammad Sanwal via WhatsApp</p>
            </div>

            {demoMessageSent ? (
              <div className="p-4 bg-emerald-50 rounded-xl text-center text-xs text-emerald-800 font-bold">
                ✓ Opening WhatsApp conversation with Muhammad Sanwal...
              </div>
            ) : (
              <form onSubmit={handleSendDemoRequest} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Your Shop Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Al-Rehman Mobiles"
                    value={demoShopName}
                    onChange={(e) => setDemoShopName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">City / Location:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hafeez Centre Lahore"
                    value={demoCity}
                    onChange={(e) => setDemoCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">WhatsApp Phone Number:</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0329-2920600"
                    value={demoPhone}
                    onChange={(e) => setDemoPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Request to 0329-2920600</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: PRIVACY POLICY                                       */}
      {/* ------------------------------------------------------------- */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Privacy Policy — MobiFlow Software</h3>
            <p className="text-xs text-slate-500 mb-4">Last updated: October 2026</p>
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                <strong>1. Data Ownership & Tenant Isolation:</strong> All inventory, financial ledgers, customer khatas,
                and staff records recorded in your MobiFlow Software workspace remain your exclusive property. MobiFlow Software
                implements tenant data isolation to ensure no external shop can access your records.
              </p>
              <p>
                <strong>2. Customer & Staff Information:</strong> Customer contact details and employee profiles (including
                CNIC and attendance timestamps) are stored strictly for your operational store management and are never sold or shared.
              </p>
              <p>
                <strong>3. Financial Confidentiality:</strong> Your purchase costs, profit margins, supplier balances, and cash drawer
                tallies are encrypted and visible only to authenticated users with explicit managerial permissions.
              </p>
              <p>
                <strong>4. Contact & Support:</strong> If you have privacy queries, contact owner Muhammad Sanwal directly at 0329-2920600.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 text-right">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg"
              >
                Close Privacy Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: TERMS & CONDITIONS                                   */}
      {/* ------------------------------------------------------------- */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowTermsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Terms & Conditions — MobiFlow Software</h3>
            <p className="text-xs text-slate-500 mb-4">Last updated: October 2026</p>
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                <strong>1. Acceptance of Terms:</strong> By registering a shop workspace or subscribing to MobiFlow Software,
                you agree to these Terms and Conditions.
              </p>
              <p>
                <strong>2. Subscription & Renewal:</strong> Subscriptions are available in Basic (Rs. 1,500/month) and Pro (Rs. 2,500/month)
                plans. If a subscription expires, your shop records remain completely safe in read-only access until renewal. Data is never deleted due to expiration.
              </p>
              <p>
                <strong>3. Hardware & Network Responsibility:</strong> MobiFlow Software operates as a web-based management portal.
                Users are responsible for their local hardware, internet connectivity, and POS thermal printer drivers.
              </p>
              <p>
                <strong>4. Support Helpline:</strong> Official support is provided by Muhammad Sanwal (0329-2920600) and Muhammad Hanan (0308-1158191).
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 text-right">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg"
              >
                Close Terms
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
