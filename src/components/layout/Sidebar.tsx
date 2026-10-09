import React, { useMemo } from 'react';
import {
  LayoutDashboard,
  Smartphone,
  ShoppingBag,
  Receipt,
  Users,
  Truck,
  Wallet,
  ReceiptText,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
  ArrowLeftRight,
  Headphones,
  ShieldCheck,
  Search,
  BarChart3,
  Settings,
  History,
  UserCog,
  LogOut,
  X,
  Globe,
  Award,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { PermissionKey } from '../../types';
import { ShopLogo } from '../common/ShopLogo';
import { ExecutiveContactModal } from '../common/ExecutiveContactModal';

export type NavView =
  | 'dashboard'
  | 'stock'
  | 'purchases'
  | 'sales'
  | 'customers'
  | 'suppliers'
  | 'cash-bank'
  | 'expenses'
  | 'customer-payments'
  | 'supplier-payments'
  | 'returns'
  | 'exchange'
  | 'accessories'
  | 'warranty'
  | 'imei-tracker'
  | 'market-intel'
  | 'reports'
  | 'activity-log'
  | 'users'
  | 'settings';

interface SidebarProps {
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  isOpen: boolean;
  onClose: () => void;
  onGoToLanding?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isOpen,
  onClose,
  onGoToLanding,
}) => {
  const [showExecutiveModal, setShowExecutiveModal] = React.useState(false);
  const {
    totalMobileStockCount,
    totalAccessoriesStockCount,
    settings,
    currentUser,
    hasPermission,
    logout,
  } = useShop();

  const allNavSections: {
    title: string;
    items: {
      id: NavView;
      label: string;
      icon: any;
      permission: PermissionKey;
      badge?: number;
    }[];
  }[] = [
    {
      title: 'CORE OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'view_dashboard' },
        {
          id: 'stock',
          label: 'Mobile Stock',
          icon: Smartphone,
          permission: 'view_stock',
          badge: totalMobileStockCount,
        },
        { id: 'sales', label: 'Sales (POS)', icon: Receipt, permission: 'view_sales' },
        { id: 'purchases', label: 'Purchases', icon: ShoppingBag, permission: 'view_purchases' },
        { id: 'exchange', label: 'Mobile Exchange', icon: ArrowLeftRight, permission: 'view_exchange' },
        { id: 'returns', label: 'Returns', icon: RotateCcw, permission: 'view_returns' },
      ],
    },
    {
      title: 'INVENTORY & TRACKING',
      items: [
        {
          id: 'accessories',
          label: 'Accessories',
          icon: Headphones,
          permission: 'view_accessories',
          badge: totalAccessoriesStockCount,
        },
        { id: 'imei-tracker', label: 'Global IMEI Search', icon: Search, permission: 'search_imei' },
        { id: 'market-intel', label: 'Google Market Intel', icon: Globe, permission: 'view_stock' },
        { id: 'warranty', label: 'Warranty Tracker', icon: ShieldCheck, permission: 'view_warranty' },
      ],
    },
    {
      title: 'LEDGERS & ACCOUNTS',
      items: [
        { id: 'customers', label: 'Customers & Ledger', icon: Users, permission: 'view_customers' },
        { id: 'suppliers', label: 'Suppliers & Ledger', icon: Truck, permission: 'view_suppliers' },
        { id: 'customer-payments', label: 'Customer Payments', icon: ArrowDownCircle, permission: 'receive_customer_payment' },
        { id: 'supplier-payments', label: 'Supplier Payments', icon: ArrowUpCircle, permission: 'make_supplier_payment' },
        { id: 'cash-bank', label: 'Cash & Bank Book', icon: Wallet, permission: 'view_cash' },
        { id: 'expenses', label: 'Expense Manager', icon: ReceiptText, permission: 'view_expenses' },
      ],
    },
    {
      title: 'ANALYTICS & SYSTEM',
      items: [
        { id: 'reports', label: 'Financial Reports', icon: BarChart3, permission: 'view_reports' },
        { id: 'activity-log', label: 'Activity & Audit Log', icon: History, permission: 'view_activity_logs' },
        { id: 'users', label: 'User & Permissions', icon: UserCog, permission: 'view_users' },
        { id: 'settings', label: 'Settings & Backup', icon: Settings, permission: 'view_settings' },
      ],
    },
  ];

  // Dynamically filter sections and items according to current user's permissions
  const visibleSections = useMemo(() => {
    return allNavSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => hasPermission(item.permission)),
      }))
      .filter((section) => section.items.length > 0);
  }, [allNavSections, hasPermission]);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShopLogo
              logoUrl={settings.logoUrl}
              shopName={settings.shopName}
              size="sm"
              variant="dark"
              rounded="lg"
            />
            <div className="min-w-0 pr-1">
              <div
                className="font-bold text-sm text-white tracking-tight truncate max-w-[135px]"
                title={settings.shopName}
              >
                {settings.shopName}
              </div>
              <div
                className="text-[10px] text-slate-400 truncate max-w-[135px]"
                title={settings.tagline || 'Mobile Shop ERP & POS'}
              >
                {settings.tagline || 'Mobile Shop ERP & POS'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white lg:hidden shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto text-xs">
          {visibleSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[10px] font-semibold tracking-wider text-slate-400">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors text-left ${
                      isActive
                        ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] rounded font-mono tabular-nums ${
                          isActive
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Session & Logout Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-lg object-cover border border-emerald-400/50 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                  {currentUser?.name ? currentUser.name[0] : 'U'}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate" title={currentUser?.name}>
                  {currentUser?.name && currentUser.name !== 'Hafiz Usman' ? currentUser.name : 'Muhammad Sanwal'}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono font-medium truncate">
                  {currentUser?.designation || (currentUser?.role === 'SHOP_OWNER' ? 'Shop Owner' : currentUser?.role || 'Staff')}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 flex items-center justify-between">
            <span className="truncate">{settings.city}</span>
            <span className="font-mono text-emerald-400 font-semibold">{settings.currency}</span>
          </div>

          {/* Executive Leadership Direct Contacts Trigger */}
          <div className="mt-2 pt-2 border-t border-slate-800/60">
            <button
              type="button"
              onClick={() => setShowExecutiveModal(true)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="CEO Muhammad Sanwal (03292920600) & Manager Muhammad Hanan (03150408601)"
            >
              <span className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Leadership & Support</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">Help</span>
            </button>
          </div>

          {onGoToLanding && (
            <div className="mt-1 pt-1 border-t border-slate-800/60">
              <button
                type="button"
                onClick={onGoToLanding}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 transition-colors"
                title="Return to Public Landing Website"
              >
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Public Website</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">/</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Executive Team Direct Contact Modal */}
      <ExecutiveContactModal
        isOpen={showExecutiveModal}
        onClose={() => setShowExecutiveModal(false)}
      />
    </>
  );
};
