import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Bell,
  PlusCircle,
  ShoppingCart,
  Menu,
  Shield,
  Smartphone,
  AlertCircle,
  AlertTriangle,
  X,
  UserCheck,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Volume2,
  Globe,
  Award,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { UserRole } from '../../types';
import { ShopLogo } from '../common/ShopLogo';
import { ExecutiveContactModal } from '../common/ExecutiveContactModal';
import { GlobalSearchModal, GlobalSearchNavigationTarget } from '../common/GlobalSearchModal';
import { MarketIntelligenceModal } from '../intel/MarketIntelligenceModal';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenNewSale: () => void;
  onOpenNewPurchase: () => void;
  onQuickSearchImei: (imei: string) => void;
  onGoToLanding?: () => void;
  onGoToAdmin?: () => void;
  activeView: string;
  onGlobalNavigate?: (target: GlobalSearchNavigationTarget) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenNewSale,
  onOpenNewPurchase,
  onQuickSearchImei,
  onGoToLanding,
  onGoToAdmin,
  activeView,
  onGlobalNavigate,
}) => {
  const {
    settings,
    currentUser,
    setCurrentUser,
    logout,
    hasPermission,
    users,
    accessories,
    mobiles,
    customers,
    suppliers,
  } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showExecutiveModal, setShowExecutiveModal] = useState(false);
  const [isMarketIntelOpen, setIsMarketIntelOpen] = useState(false);
  const [hasNotifiedPush, setHasNotifiedPush] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Critical Low-Stock calculation (quantities <= 1)
  const criticalAccessories = useMemo(
    () => accessories.filter((a) => a.quantity <= 1),
    [accessories]
  );

  // Group mobiles by model in stock to check if any model has only 0 or 1 unit remaining
  const mobileModelStockCounts = useMemo(() => {
    const counts: Record<string, { brand: string; model: string; count: number }> = {};
    mobiles.forEach((m) => {
      const key = `${m.brand} ${m.model}`.trim();
      if (!counts[key]) {
        counts[key] = { brand: m.brand, model: m.model, count: 0 };
      }
      if (m.status === 'In Stock') {
        counts[key].count += 1;
      }
    });
    return Object.values(counts).filter((item) => item.count <= 1);
  }, [mobiles]);

  const totalCriticalCount = criticalAccessories.length + mobileModelStockCounts.length;

  // Automated Web Push Notification Trigger
  useEffect(() => {
    if (totalCriticalCount > 0 && !hasNotifiedPush && typeof window !== 'undefined') {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          const sampleItem = criticalAccessories[0]?.name || mobileModelStockCounts[0]?.model || 'Item';
          try {
            new Notification('🚨 Critical Low-Stock Warning!', {
              body: `Attention: ${totalCriticalCount} item(s) have critical stock (0 or 1 left), including "${sampleItem}". Please reorder immediately.`,
              icon: '/favicon.ico',
            });
            setHasNotifiedPush(true);
          } catch (e) {
            console.warn('Push notification delivery skipped:', e);
          }
        }
      }
    }
  }, [totalCriticalCount, hasNotifiedPush, criticalAccessories, mobileModelStockCounts]);

  const requestNotificationPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('Push Notifications Enabled', {
            body: 'You will receive instant alerts when stock drops to 0 or 1 unit.',
          });
        }
      });
    }
  };

  // Compute all operational alerts
  const lowStockAccessories = accessories.filter((a) => a.quantity <= a.minStockLevel);
  const expiringMobiles = mobiles.filter((m) => {
    if (m.status !== 'In Stock') return false;
    const expiry = new Date(m.warrantyExpiryDate).getTime();
    const now = new Date().getTime();
    const daysLeft = Math.ceil((expiry - now) / (1000 * 3600 * 24));
    return daysLeft >= 0 && daysLeft <= 30;
  });
  const highReceivables = customers.filter((c) => c.remainingBalance > 30000);
  const highPayables = suppliers.filter((s) => s.remainingPayable > 50000);

  const totalAlertsCount =
    lowStockAccessories.length + expiringMobiles.length + highReceivables.length + highPayables.length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onQuickSearchImei(searchQuery.trim());
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-slate-200">
      {/* Zone 1: Mobile Hamburger & Brand/Breadcrumb Wordmark */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 text-slate-600 rounded-lg lg:hidden hover:bg-slate-100"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <ShopLogo
            logoUrl={settings.logoUrl}
            shopName={settings.shopName}
            size="sm"
            variant="light"
            rounded="md"
            showBorder
          />
          <span className="font-bold text-base md:text-lg tracking-tight text-slate-900 truncate max-w-[180px] sm:max-w-xs" title={settings.shopName}>
            {settings.shopName}
          </span>
          <span className="hidden sm:inline-block text-xs text-slate-400 font-normal">
            / {activeView.replace('-', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Zone 2: Global Search & Fast Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-lg mx-3 sm:mx-6">
        <div
          onClick={() => setIsGlobalSearchOpen(true)}
          className="relative w-full cursor-pointer group"
          role="search"
          title="Click to search anything in MobiFlow (or press Ctrl+K)"
        >
          <input
            type="text"
            readOnly
            placeholder="Search anything in MobiFlow..."
            className="w-full pl-9 pr-14 sm:pr-20 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/90 focus:bg-white text-slate-800 placeholder:text-slate-400 border border-slate-200 group-hover:border-emerald-400 rounded-lg outline-none transition-all cursor-pointer shadow-2xs select-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
              Ctrl+K
            </kbd>
          </div>
        </div>

        {/* Dedicated mobile search icon trigger */}
        <button
          type="button"
          onClick={() => setIsGlobalSearchOpen(true)}
          className="sm:hidden p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Global Smart Search (Ctrl+K)"
          aria-label="Open global search"
        >
          <Search className="w-4 h-4" />
        </button>

        {hasPermission('create_sale') && (
          <button
            type="button"
            onClick={onOpenNewSale}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>New Sale (POS)</span>
          </button>
        )}

        {hasPermission('add_purchase') && (
          <button
            type="button"
            onClick={onOpenNewPurchase}
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Purchase</span>
          </button>
        )}
      </div>

      {/* Zone 3: Alerts Drawer Trigger & Role Switcher */}
      <div className="flex items-center gap-2 relative">
        {/* Google Market Intelligence Trigger */}
        <button
          type="button"
          onClick={() => setIsMarketIntelOpen(true)}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
          title="Google Search Grounded Mobile Market Rates & Official PTA Tax Verification (gemini-2.5-flash)"
        >
          <Globe className="w-3.5 h-3.5 text-blue-700" />
          <span>Google Market Intel</span>
        </button>

        {/* Executive Leadership Contacts Trigger */}
        <button
          type="button"
          onClick={() => setShowExecutiveModal(true)}
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-500 rounded-lg transition-colors shadow-2xs cursor-pointer"
          title="App Owner Muhammad Sanwal & Manager Muhammad Hanan Contacts"
        >
          <Award className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-slate-900">Leadership & Support</span>
        </button>

        {/* Critical Low Stock Visual Alert Pill */}
        {totalCriticalCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAlerts(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-2xs transition-all animate-pulse"
            title="Items with 0 or 1 stock remaining - Restock required immediately!"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="hidden sm:inline">Critical Stock:</span>
            <span>{totalCriticalCount} Low (0-1 left)</span>
          </button>
        )}

        {/* Alerts Bell */}
        <button
          type="button"
          onClick={() => setShowAlerts(!showAlerts)}
          className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="View alerts"
        >
          <Bell className="w-5 h-5" />
          {totalCriticalCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
          {totalAlertsCount > 0 && (
            <span
              className={`absolute top-1 right-1 w-4 h-4 text-[10px] font-bold text-white rounded-full flex items-center justify-center ${
                totalCriticalCount > 0 ? 'bg-rose-600' : 'bg-red-600'
              }`}
            >
              {totalAlertsCount}
            </span>
          )}
        </button>

        {/* User Role Switcher & Account Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-5 h-5 rounded object-cover border border-emerald-500 shadow-2xs"
              />
            ) : (
              <div className="w-5 h-5 rounded bg-gradient-to-tr from-blue-600 to-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">
                {currentUser?.role === 'SHOP_OWNER' ? '👑' : currentUser?.role ? currentUser.role[0] : 'U'}
              </div>
            )}
            <span className="hidden sm:inline font-semibold">
              {currentUser?.name && currentUser.name !== 'Hafiz Usman'
                ? currentUser.name
                : currentUser?.role === 'SHOP_OWNER' || currentUser?.role === 'Admin'
                ? 'Muhammad Sanwal'
                : currentUser?.role === 'SUPER_ADMIN'
                ? 'Super Admin'
                : 'Muhammad Sanwal'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
              {/* Current user header */}
              <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-xl object-cover border-2 border-emerald-500 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                    {currentUser?.name ? currentUser.name[0] : 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-slate-900 truncate">
                    {currentUser?.name && currentUser.name !== 'Hafiz Usman' ? currentUser.name : 'Muhammad Sanwal'}
                  </div>
                  <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider truncate">
                    {currentUser?.designation || (currentUser?.role === 'SHOP_OWNER' ? 'Shop Owner' : currentUser?.role)}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    {currentUser?.phone && (
                      <span className="font-mono text-slate-600 font-semibold">{currentUser.phone}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Role Switcher for easy testing / evaluation */}
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
                Switch Role (Permission Demo)
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      currentUser?.id === u.id ? 'font-semibold text-emerald-600 bg-emerald-50/50' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-800 flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {u.status !== 'Active' && (
                          <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-800 font-medium">
                            {u.status}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {u.role} · @{u.username}
                      </div>
                    </div>
                    {currentUser?.id === u.id && <UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                ))}
              </div>

              {/* Public Website and Sign Out Buttons */}
              <div className="p-1.5 border-t border-slate-100 bg-slate-50/40 space-y-1">
                {currentUser?.role === 'SUPER_ADMIN' && onGoToAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleMenu(false);
                      onGoToAdmin();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 text-purple-600" />
                    <span>Super Admin Console</span>
                  </button>
                )}
                {onGoToLanding && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleMenu(false);
                      onGoToLanding();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>View Public Website</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out (Lock Session)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications Drawer */}
      {showAlerts && (
        <div className="absolute right-4 top-16 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h4 className="font-semibold text-xs text-slate-900">
                System Alerts ({totalAlertsCount})
              </h4>
            </div>
            <button
              onClick={() => setShowAlerts(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs py-1">
            {/* Browser push notification setup pill */}
            <div className="p-2.5 bg-slate-50 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-700 font-medium text-[11px]">
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Automated Desktop Push</span>
              </div>
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
              >
                Enable Push
              </button>
            </div>

            {/* Critical Low Stock Priority Section */}
            {totalCriticalCount > 0 && (
              <div className="p-2.5 bg-rose-50/70 border-b border-rose-100 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-rose-800 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
                  <span>CRITICAL LOW STOCK (0 or 1 Remaining):</span>
                </div>
                <div className="space-y-1.5">
                  {criticalAccessories.map((a) => (
                    <div
                      key={`crit-${a.id}`}
                      className="p-1.5 bg-white rounded border border-rose-200 flex items-center justify-between shadow-2xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-slate-900 truncate text-[11px]">{a.name}</div>
                        <div className="text-[10px] text-slate-500">{a.category} · {a.brand}</div>
                      </div>
                      <span className="font-bold font-mono px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] shrink-0">
                        {a.quantity} left
                      </span>
                    </div>
                  ))}
                  {mobileModelStockCounts.map((m) => (
                    <div
                      key={`crit-mob-${m.brand}-${m.model}`}
                      className="p-1.5 bg-white rounded border border-rose-200 flex items-center justify-between shadow-2xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-slate-900 truncate text-[11px]">
                          {m.brand} {m.model}
                        </div>
                        <div className="text-[10px] text-slate-500">Mobile Phone Stock</div>
                      </div>
                      <span className="font-bold font-mono px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] shrink-0">
                        {m.count} in stock
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalAlertsCount === 0 && totalCriticalCount === 0 ? (
              <p className="py-6 text-center text-slate-400">All inventory and accounts normal!</p>
            ) : (
              <>
                {lowStockAccessories.map((a) => (
                  <div key={a.id} className="py-2 flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-800">Low Stock: {a.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Remaining: <span className="font-bold text-red-600">{a.quantity}</span> units (Min: {a.minStockLevel})
                      </div>
                    </div>
                  </div>
                ))}

                {expiringMobiles.map((m) => (
                  <div key={m.id} className="py-2 flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-800">
                        Warranty Expiring: {m.brand} {m.model}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        IMEI: {m.imei1} · Expires {formatDate(m.warrantyExpiryDate)}
                      </div>
                    </div>
                  </div>
                ))}

                {highReceivables.map((c) => (
                  <div key={c.id} className="py-2 flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-800">Customer Balance Overdue: {c.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Receivable: <span className="font-bold text-amber-600">{formatCurrency(c.remainingBalance, settings.currency)}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {highPayables.map((s) => (
                  <div key={s.id} className="py-2 flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 mt-1 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-800">Supplier Payable Due: {s.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Payable: <span className="font-bold text-purple-600">{formatCurrency(s.remainingPayable, settings.currency)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
      {/* Executive Team Direct Contact Modal */}
      <ExecutiveContactModal
        isOpen={showExecutiveModal}
        onClose={() => setShowExecutiveModal(false)}
      />

      {/* Real Global Smart Search System Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onNavigate={(target) => {
          if (onGlobalNavigate) {
            onGlobalNavigate(target);
          } else if (target.view === 'imei-tracker' && target.targetQuery) {
            onQuickSearchImei(target.targetQuery);
          }
        }}
      />

      {/* Google Search Market Intelligence Modal */}
      <MarketIntelligenceModal
        isOpen={isMarketIntelOpen}
        onClose={() => setIsMarketIntelOpen(false)}
      />
    </header>
  );
};
