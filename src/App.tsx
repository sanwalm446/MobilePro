import React, { useState, useEffect } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavView } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { MobileStockView } from './components/stock/MobileStockView';
import { SalesManagementView } from './components/sales/SalesManagementView';
import { PurchaseManagementView } from './components/purchases/PurchaseManagementView';
import { CustomerManagementView } from './components/customers/CustomerManagementView';
import { SupplierManagementView } from './components/suppliers/SupplierManagementView';
import { CashBankManagementView } from './components/cash/CashBankManagementView';
import { ExpenseManagementView } from './components/expenses/ExpenseManagementView';
import { CustomerPaymentsView } from './components/payments/CustomerPaymentsView';
import { SupplierPaymentsView } from './components/payments/SupplierPaymentsView';
import { ReturnsManagementView } from './components/returns/ReturnsManagementView';
import { ExchangeManagementView } from './components/exchange/ExchangeManagementView';
import { AccessoriesView } from './components/accessories/AccessoriesView';
import { WarrantyView } from './components/warranty/WarrantyView';
import { ImeiTrackerView } from './components/imei/ImeiTrackerView';
import { MarketIntelligenceView } from './components/intel/MarketIntelligenceView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { ActivityLogView } from './components/activity/ActivityLogView';
import { UserManagementView } from './components/users/UserManagementView';
import { AuthContainer } from './components/auth/AuthContainer';
import { LandingPage } from './components/public/LandingPage';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { PermissionKey } from './types';
import { ShieldAlert, ArrowLeft, BadgeAlert } from 'lucide-react';

const VIEW_REQUIRED_PERMISSIONS: Record<NavView, PermissionKey> = {
  dashboard: 'view_dashboard',
  stock: 'view_stock',
  sales: 'view_sales',
  purchases: 'view_purchases',
  exchange: 'view_exchange',
  returns: 'view_returns',
  accessories: 'view_accessories',
  'imei-tracker': 'search_imei',
  'market-intel': 'view_stock',
  warranty: 'view_warranty',
  customers: 'view_customers',
  suppliers: 'view_suppliers',
  'customer-payments': 'receive_customer_payment',
  'supplier-payments': 'make_supplier_payment',
  'cash-bank': 'view_cash',
  expenses: 'view_expenses',
  reports: 'view_reports',
  'activity-log': 'view_activity_logs',
  users: 'view_users',
  settings: 'view_settings',
};

type AppRoute = 'landing' | 'auth' | 'app' | 'admin';

function getInitialRoute(): AppRoute {
  if (typeof window === 'undefined') return 'landing';
  const pathname = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  if (pathname.startsWith('/admin') || hash.startsWith('#/admin') || hash === '#admin') {
    return 'admin';
  }
  if (pathname.startsWith('/app') || hash.startsWith('#/app') || hash === '#app') {
    return 'app';
  }
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/signup') ||
    hash.startsWith('#/login') ||
    hash.startsWith('#/signup') ||
    hash === '#login' ||
    hash === '#signup'
  ) {
    return 'auth';
  }
  return 'landing';
}

function getInitialAuthTab(): 'login' | 'signup' {
  if (typeof window === 'undefined') return 'login';
  const pathname = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();

  if (
    pathname.startsWith('/signup') ||
    hash.startsWith('#/signup') ||
    hash === '#signup' ||
    search.includes('tab=signup')
  ) {
    return 'signup';
  }
  return 'login';
}

function MainAppContent() {
  const { isAuthenticated, hasPermission, currentUser, settings, updateSubscription, login, logout } = useShop();
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getInitialRoute);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>(getInitialAuthTab);
  const [activeView, setActiveView] = useState<NavView>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Synchronize browser history / URL with currentRoute
  const navigateTo = (target: AppRoute, initialTab?: 'login' | 'signup') => {
    const effectiveTab = initialTab || authTab;
    if (initialTab) {
      setAuthTab(initialTab);
    }
    setCurrentRoute(target);

    if (typeof window !== 'undefined') {
      const urlMap: Record<AppRoute, string> = {
        landing: '/',
        auth: effectiveTab === 'signup' ? '/signup' : '/login',
        app: '/app',
        admin: '/admin',
      };
      try {
        window.history.pushState(null, '', urlMap[target]);
      } catch {
        // Fallback for restricted iframe environments
        window.location.hash = urlMap[target];
      }
    }
  };

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handleLocationChange = () => {
      const detected = getInitialRoute();
      setCurrentRoute(detected);
      if (detected === 'auth') {
        setAuthTab(getInitialAuthTab());
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Synchronize authenticated session: redirect directly to dashboard if on auth route
  useEffect(() => {
    if (isAuthenticated && currentRoute === 'auth') {
      if (currentUser?.role === 'SUPER_ADMIN') {
        navigateTo('admin');
      } else {
        navigateTo('app');
      }
    }
  }, [isAuthenticated, currentRoute, currentUser]);

  // Launch pre-seeded live interactive demo with 1-click
  const handleLaunchDemo = async () => {
    try {
      await login('admin', '123456', false);
      navigateTo('app');
    } catch {
      navigateTo('auth', 'login');
    }
  };

  // If user role changes and current view is not permitted, auto-route to first permitted view
  useEffect(() => {
    if (isAuthenticated) {
      const requiredPerm = VIEW_REQUIRED_PERMISSIONS[activeView];
      if (requiredPerm && !hasPermission(requiredPerm)) {
        const allViews: NavView[] = [
          'dashboard',
          'sales',
          'stock',
          'customers',
          'accessories',
          'cash-bank',
          'reports',
          'settings',
        ];
        const firstAllowed = allViews.find((v) => {
          const p = VIEW_REQUIRED_PERMISSIONS[v];
          return p ? hasPermission(p) : false;
        });
        if (firstAllowed) {
          setActiveView(firstAllowed);
        }
      }
    }
  }, [currentUser, activeView, isAuthenticated, hasPermission]);

  // Cross-screen triggers
  const [targetMobileIdForSale, setTargetMobileIdForSale] = useState<string | null>(null);
  const [targetSaleIdForReturn, setTargetSaleIdForReturn] = useState<string | null>(null);
  const [targetImeiForSearch, setTargetImeiForSearch] = useState<string>('');

  // Global search cross-screen navigation target
  const [globalSearchNav, setGlobalSearchNav] = useState<{
    view: NavView;
    targetId?: string;
    targetQuery?: string;
    extra?: any;
  } | null>(null);

  const handleGlobalNavigate = (target: {
    view: NavView;
    targetId?: string;
    targetQuery?: string;
    extra?: any;
  }) => {
    setActiveView(target.view);
    setGlobalSearchNav(target);
    if (target.view === 'imei-tracker' && (target.targetQuery || target.targetId)) {
      setTargetImeiForSearch(target.targetQuery || target.targetId || '');
    }
  };

  const handleTrackImei = (imei: string) => {
    setTargetImeiForSearch(imei);
    setActiveView('imei-tracker');
  };

  const handleSellMobile = (mobileId: string) => {
    setTargetMobileIdForSale(mobileId);
    setActiveView('sales');
  };

  const handleReturnSale = (saleId: string) => {
    setTargetSaleIdForReturn(saleId);
    setActiveView('returns');
  };

  // -------------------------------------------------------------------------
  // 1. PUBLIC LANDING WEBSITE (Route: '/')
  // -------------------------------------------------------------------------
  if (currentRoute === 'landing') {
    return (
      <LandingPage
        onNavigateToLogin={(tab) => navigateTo('auth', tab || 'login')}
        onLaunchDemo={handleLaunchDemo}
        onOpenApp={() => navigateTo('app')}
        isAuthenticated={isAuthenticated}
        userName={currentUser?.name && currentUser.name !== 'Hafiz Usman' ? currentUser.name : 'Muhammad Sanwal'}
      />
    );
  }

  // -------------------------------------------------------------------------
  // 2. AUTHENTICATION PORTAL (Route: '/login' or '/auth')
  // -------------------------------------------------------------------------
  if (currentRoute === 'auth') {
    return (
      <AuthContainer
        initialTab={authTab}
        onTabChange={(tab) => {
          setAuthTab(tab);
          if (typeof window !== 'undefined') {
            try {
              window.history.replaceState(null, '', tab === 'signup' ? '/signup' : '/login');
            } catch {
              window.location.hash = tab === 'signup' ? '#/signup' : '#/login';
            }
          }
        }}
        onBackToLanding={() => navigateTo('landing')}
        onSuccessLogin={(role) => {
          if (role === 'SUPER_ADMIN' || currentUser?.role === 'SUPER_ADMIN') {
            navigateTo('admin');
          } else {
            navigateTo('app');
          }
        }}
      />
    );
  }

  // -------------------------------------------------------------------------
  // 3. SUPER ADMIN CONSOLE (Route: '/admin')
  // -------------------------------------------------------------------------
  if (currentRoute === 'admin') {
    if (!isAuthenticated) {
      return (
        <AuthContainer
          initialTab="login"
          onBackToLanding={() => navigateTo('landing')}
          onSuccessLogin={(role) => {
            if (role === 'SUPER_ADMIN' || currentUser?.role === 'SUPER_ADMIN') {
              navigateTo('admin');
            } else {
              navigateTo('app');
            }
          }}
        />
      );
    }

    if (currentUser?.role !== 'SUPER_ADMIN') {
      // Requirement 19: Do not expose admin panel to tenant users!
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-center font-sans">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Denied: Super Admin Portal</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
            The <code>/admin</code> panel is strictly restricted to MobiFlow platform Super Administrators.
            Your account ({currentUser?.name}) belongs to tenant workspace <strong>{settings.shopName}</strong> as <strong>{currentUser?.role}</strong>.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigateTo('app')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all"
            >
              Open Your Shop Dashboard
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                navigateTo('auth', 'login');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer border border-slate-700 transition-all"
            >
              Sign In as Super Admin
            </button>
          </div>
        </div>
      );
    }

    return (
      <SuperAdminDashboard
        onLogout={() => {
          logout();
          navigateTo('landing');
        }}
        onGoToLanding={() => navigateTo('landing')}
      />
    );
  }

  // -------------------------------------------------------------------------
  // 4. SECURE PRIVATE APPLICATION (Route: '/app')
  // -------------------------------------------------------------------------
  // Critical Security Check: If unauthenticated on /app, NEVER expose business data.
  // Immediately show login barrier with clear return-to-landing option.
  if (!isAuthenticated) {
    return (
      <AuthContainer
        initialTab="login"
        onBackToLanding={() => navigateTo('landing')}
        onSuccessLogin={(role) => {
          if (role === 'SUPER_ADMIN' || currentUser?.role === 'SUPER_ADMIN') {
            navigateTo('admin');
          } else {
            navigateTo('app');
          }
        }}
      />
    );
  }

  // Page level permission check for activeView
  const currentViewPerm = VIEW_REQUIRED_PERMISSIONS[activeView];
  const isViewAllowed = !currentViewPerm || hasPermission(currentViewPerm);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Navigation Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onGoToLanding={() => navigateTo('landing')}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Header
          activeView={activeView}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenNewSale={() => setActiveView('sales')}
          onOpenNewPurchase={() => setActiveView('purchases')}
          onQuickSearchImei={handleTrackImei}
          onGoToLanding={() => navigateTo('landing')}
          onGoToAdmin={() => navigateTo('admin')}
          onGlobalNavigate={handleGlobalNavigate}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Subscription Expired / Suspended Barrier */}
          {settings.subscription?.status === 'EXPIRED' && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between flex-wrap gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <BadgeAlert className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Subscription Expired — Workspace in Read-Only Mode</div>
                  <div className="text-[11px] text-amber-700 mt-0.5">
                    Your tenant subscription has expired. All customer records, phone stock, and financial ledgers remain completely safe.
                  </div>
                </div>
              </div>
              {currentUser?.role === 'Admin' && (
                <button
                  type="button"
                  onClick={() => updateSubscription({ status: 'ACTIVE' })}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Reactivate Workspace License
                </button>
              )}
            </div>
          )}

          {!isViewAllowed ? (
            <div className="p-8 max-w-md mx-auto my-12 bg-white rounded-2xl border border-rose-200 text-center shadow-lg space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your account role (<strong>{currentUser?.role}</strong>) does not have permission to access the{' '}
                  <strong className="text-slate-800">{activeView}</strong> module.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Required permission: <code className="text-rose-600">{currentViewPerm}</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('dashboard')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Allowed View</span>
              </button>
            </div>
          ) : (
            <>
              {activeView === 'dashboard' && (
                <DashboardView
                  onNavigate={setActiveView}
                  onOpenNewSale={() => setActiveView('sales')}
                  onOpenNewPurchase={() => setActiveView('purchases')}
                  onOpenCustomerPayment={() => setActiveView('customer-payments')}
                  onOpenSupplierPayment={() => setActiveView('supplier-payments')}
                  onOpenAddExpense={() => setActiveView('expenses')}
                />
              )}

              {activeView === 'stock' && (
                <MobileStockView
                  onOpenNewSaleForMobile={handleSellMobile}
                  onTrackImei={handleTrackImei}
                  initialMobileIdToView={globalSearchNav?.view === 'stock' ? globalSearchNav.targetId : null}
                  initialSearchQuery={globalSearchNav?.view === 'stock' ? globalSearchNav.targetQuery : undefined}
                />
              )}

              {activeView === 'sales' && (
                <SalesManagementView
                  initialMobileIdToSell={targetMobileIdForSale}
                  onClearInitialMobileId={() => setTargetMobileIdForSale(null)}
                  onOpenCustomerReturn={handleReturnSale}
                  initialInvoiceIdToView={globalSearchNav?.view === 'sales' ? globalSearchNav.targetId : null}
                  initialSearchQuery={globalSearchNav?.view === 'sales' ? globalSearchNav.targetQuery : undefined}
                />
              )}

              {activeView === 'purchases' && (
                <PurchaseManagementView
                  onOpenSupplierLedger={(supId) => {
                    setActiveView('suppliers');
                  }}
                  initialSearchQuery={globalSearchNav?.view === 'purchases' ? globalSearchNav.targetQuery : undefined}
                />
              )}

              {activeView === 'customers' && (
                <CustomerManagementView
                  onOpenReceivePayment={(custId) => setActiveView('customer-payments')}
                  initialCustomerIdToView={globalSearchNav?.view === 'customers' ? globalSearchNav.targetId : null}
                  initialCustomerSearch={globalSearchNav?.view === 'customers' ? globalSearchNav.targetQuery : undefined}
                />
              )}

              {activeView === 'suppliers' && (
                <SupplierManagementView
                  onOpenPaySupplier={(supId) => setActiveView('supplier-payments')}
                  initialSupplierIdToView={globalSearchNav?.view === 'suppliers' ? globalSearchNav.targetId : null}
                  initialSupplierSearch={globalSearchNav?.view === 'suppliers' ? globalSearchNav.targetQuery : undefined}
                />
              )}

              {activeView === 'cash-bank' && (
                <CashBankManagementView
                  initialSearchQuery={globalSearchNav?.view === 'cash-bank' ? globalSearchNav.targetQuery : undefined}
                />
              )}

              {activeView === 'expenses' && (
                <ExpenseManagementView
                  initialSearchQuery={globalSearchNav?.view === 'expenses' ? globalSearchNav.targetQuery : undefined}
                />
              )}

              {activeView === 'customer-payments' && (
                <CustomerPaymentsView
                  initialReceiptNumber={globalSearchNav?.view === 'customer-payments' ? globalSearchNav.targetId : null}
                  initialSearchQuery={globalSearchNav?.view === 'customer-payments' ? globalSearchNav.targetQuery : undefined}
                />
              )}

              {activeView === 'supplier-payments' && (
                <SupplierPaymentsView
                  initialVoucherNumber={globalSearchNav?.view === 'supplier-payments' ? globalSearchNav.targetId : null}
                  initialSearchQuery={globalSearchNav?.view === 'supplier-payments' ? globalSearchNav.targetQuery : undefined}
                />
              )}

              {activeView === 'returns' && (
                <ReturnsManagementView
                  initialSaleIdToReturn={targetSaleIdForReturn}
                  onClearInitialSaleId={() => setTargetSaleIdForReturn(null)}
                  initialSearchQuery={globalSearchNav?.view === 'returns' ? globalSearchNav.targetQuery : undefined}
                />
              )}

              {activeView === 'exchange' && (
                <ExchangeManagementView
                  initialSearchQuery={globalSearchNav?.view === 'exchange' ? globalSearchNav.targetQuery : undefined}
                />
              )}

              {activeView === 'accessories' && (
                <AccessoriesView
                  initialAccessoryIdToEdit={globalSearchNav?.view === 'accessories' ? globalSearchNav.targetId : null}
                  initialSearchQuery={globalSearchNav?.view === 'accessories' ? globalSearchNav.targetQuery : undefined}
                />
              )}

              {activeView === 'warranty' && (
                <WarrantyView
                  onTrackImei={handleTrackImei}
                  initialSearchQuery={globalSearchNav?.view === 'warranty' ? globalSearchNav.targetQuery : undefined}
                />
              )}

              {activeView === 'imei-tracker' && (
                <ImeiTrackerView
                  initialSearchImei={
                    globalSearchNav?.view === 'imei-tracker'
                      ? globalSearchNav.targetQuery || globalSearchNav.targetId || targetImeiForSearch
                      : targetImeiForSearch
                  }
                  onClearInitialImei={() => {
                    setTargetImeiForSearch('');
                    if (globalSearchNav?.view === 'imei-tracker') {
                      setGlobalSearchNav(null);
                    }
                  }}
                />
              )}

              {activeView === 'market-intel' && (
                <MarketIntelligenceView
                  initialQuery={globalSearchNav?.view === 'market-intel' ? globalSearchNav.targetQuery : undefined}
                  onOpenNewMobile={(model) => {
                    setActiveView('stock');
                  }}
                />
              )}

              {activeView === 'reports' && <ReportsView />}

              {activeView === 'activity-log' && (
                <ActivityLogView onNavigate={setActiveView} onTrackImei={handleTrackImei} />
              )}

              {activeView === 'users' && (
                <UserManagementView
                  initialUserIdToView={globalSearchNav?.view === 'users' ? globalSearchNav.targetId : null}
                  initialTab={globalSearchNav?.view === 'users' ? globalSearchNav.extra?.tab : undefined}
                  initialSearchQuery={globalSearchNav?.view === 'users' ? globalSearchNav.targetQuery : undefined}
                />
              )}

              {activeView === 'settings' && <SettingsView onNavigate={setActiveView} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ShopProvider>
      <MainAppContent />
    </ShopProvider>
  );
}
