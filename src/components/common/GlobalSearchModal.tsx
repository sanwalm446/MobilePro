import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  Smartphone,
  Users,
  Truck,
  Receipt,
  ShoppingBag,
  Headphones,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingDown,
  Wallet,
  UserCheck,
  Calendar,
  ShieldCheck,
  RotateCcw,
  ArrowLeftRight,
  ArrowRight,
  CornerDownLeft,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Hash,
  Activity,
  Layers,
  Globe,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { NavView } from '../layout/Sidebar';
import { formatCurrency, formatDate } from '../../utils/formatters';

export type GlobalSearchCategory =
  | 'all'
  | 'customers'
  | 'suppliers'
  | 'stock'
  | 'sales'
  | 'purchases'
  | 'accessories'
  | 'payments'
  | 'users'
  | 'attendance'
  | 'expenses'
  | 'warranty'
  | 'returns';

export interface GlobalSearchNavigationTarget {
  view: NavView;
  targetId?: string;
  targetQuery?: string;
  action?: string;
  extra?: any;
}

export interface GlobalSearchResultItem {
  id: string;
  category: GlobalSearchCategory;
  moduleLabel: string;
  badgeColorClass: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  metadata?: string;
  extraBadge?: string;
  actionLabel: string;
  targetView: NavView;
  targetId?: string;
  targetQuery?: string;
  extraPayload?: any;
  searchableText: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (target: GlobalSearchNavigationTarget) => void;
  initialQuery?: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  initialQuery = '',
}) => {
  const {
    mobiles,
    sales,
    purchases,
    customers,
    suppliers,
    customerPayments,
    supplierPayments,
    accessories,
    expenses,
    cashTransactions,
    returns,
    exchanges,
    users,
    attendanceList,
    logs,
    hasPermission,
    settings,
  } = useShop();

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<GlobalSearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Sync initial query when opened
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery || '');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, initialQuery]);

  // Build the universal searchable database index
  const allSearchableItems: GlobalSearchResultItem[] = useMemo(() => {
    const list: GlobalSearchResultItem[] = [];

    // 1. CUSTOMERS
    if (hasPermission('view_customers')) {
      customers.forEach((c) => {
        list.push({
          id: `cust-${c.id}`,
          category: 'customers',
          moduleLabel: 'Customer',
          badgeColorClass: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: Users,
          title: c.name,
          subtitle: `Phone: ${c.phone} ${c.cnic ? '• CNIC: ' + c.cnic : ''} ${c.address ? '• ' + c.address : ''}`,
          metadata: `Balance: ${formatCurrency(c.remainingBalance)} • Total: ${formatCurrency(c.totalPurchases)}`,
          extraBadge: c.remainingBalance > 0 ? 'Receivable Pending' : 'Clear',
          actionLabel: 'Open Customer Ledger',
          targetView: 'customers',
          targetId: c.id,
          targetQuery: c.name,
          searchableText: `${c.name} ${c.phone} ${c.cnic || ''} ${c.address || ''} ${c.id} customer`.toLowerCase(),
        });
      });
    }

    // 2. SUPPLIERS
    if (hasPermission('view_suppliers')) {
      suppliers.forEach((s) => {
        list.push({
          id: `sup-${s.id}`,
          category: 'suppliers',
          moduleLabel: 'Supplier',
          badgeColorClass: 'bg-purple-100 text-purple-700 border-purple-200',
          icon: Truck,
          title: s.name,
          subtitle: `${s.companyName || 'Supplier'} • Phone: ${s.phone} ${s.address ? '• ' + s.address : ''}`,
          metadata: `Payable: ${formatCurrency(s.remainingPayable)} • Total: ${formatCurrency(s.totalPurchases)}`,
          extraBadge: s.remainingPayable > 0 ? 'Payable Due' : 'Settled',
          actionLabel: 'Open Supplier Ledger',
          targetView: 'suppliers',
          targetId: s.id,
          targetQuery: s.name,
          searchableText: `${s.name} ${s.companyName || ''} ${s.phone} ${s.address || ''} ${s.id} supplier`.toLowerCase(),
        });
      });
    }

    // 3. MOBILES / PHONE STOCK
    if (hasPermission('view_stock')) {
      mobiles.forEach((m) => {
        list.push({
          id: `mobile-${m.id}`,
          category: 'stock',
          moduleLabel: 'Phone Stock',
          badgeColorClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          icon: Smartphone,
          title: `${m.brand} ${m.model}`,
          subtitle: `IMEI: ${m.imei1} ${m.imei2 ? '• IMEI2: ' + m.imei2 : ''} ${m.serialNumber ? '• S/N: ' + m.serialNumber : ''} • ${m.variant} (${m.ram}/${m.storage}) • ${m.color}`,
          metadata: `Price: ${formatCurrency(m.salePrice)} • Status: ${m.status} • Condition: ${m.condition}`,
          extraBadge: m.status === 'In Stock' ? 'In Stock' : m.status,
          actionLabel: 'View Phone Details',
          targetView: 'stock',
          targetId: m.id,
          targetQuery: m.imei1,
          searchableText: `${m.brand} ${m.model} ${m.variant} ${m.ram} ${m.storage} ${m.color} ${m.imei1} ${m.imei2 || ''} ${m.serialNumber || ''} ${m.supplierName || ''} ${m.condition} ${m.status} stock phone mobile`.toLowerCase(),
        });

        // Also index under Warranty if warranty is active/available
        list.push({
          id: `warranty-${m.id}`,
          category: 'warranty',
          moduleLabel: 'Warranty',
          badgeColorClass: 'bg-cyan-100 text-cyan-700 border-cyan-200',
          icon: ShieldCheck,
          title: `${m.brand} ${m.model} — Warranty Tracker`,
          subtitle: `IMEI: ${m.imei1} • Policy: ${m.warrantyPeriod || 'Brand Warranty'} • Expiry: ${m.warrantyExpiryDate ? formatDate(m.warrantyExpiryDate) : 'N/A'}`,
          metadata: `Current Status: ${m.status} • Condition: ${m.condition}`,
          extraBadge: m.warrantyPeriod || 'Warranty',
          actionLabel: 'Track IMEI & Warranty',
          targetView: 'imei-tracker',
          targetId: m.imei1,
          targetQuery: m.imei1,
          searchableText: `${m.brand} ${m.model} ${m.imei1} ${m.imei2 || ''} ${m.warrantyPeriod || ''} ${m.warrantyExpiryDate || ''} warranty guarantee`.toLowerCase(),
        });
      });
    }

    // 4. SALES / INVOICES
    if (hasPermission('view_sales')) {
      sales.forEach((s) => {
        list.push({
          id: `sale-${s.id}`,
          category: 'sales',
          moduleLabel: 'Invoice',
          badgeColorClass: 'bg-indigo-100 text-indigo-700 border-indigo-200',
          icon: Receipt,
          title: `${s.invoiceNumber} — ${s.brand} ${s.model}`,
          subtitle: `Customer: ${s.customerName} (${s.customerPhone}) • IMEI: ${s.imei1} ${s.salesmanName ? '• Salesman: ' + s.salesmanName : ''}`,
          metadata: `Total: ${formatCurrency(s.finalPrice)} • Received: ${formatCurrency(s.amountReceived)} • ${formatDate(s.saleDate)}`,
          extraBadge: s.remainingAmount > 0 ? `Unpaid: ${formatCurrency(s.remainingAmount)}` : 'Fully Paid',
          actionLabel: 'Open Invoice Print & Details',
          targetView: 'sales',
          targetId: s.id,
          targetQuery: s.invoiceNumber,
          searchableText: `${s.invoiceNumber} ${s.customerName} ${s.customerPhone} ${s.customerCnic || ''} ${s.customerAddress || ''} ${s.brand} ${s.model} ${s.imei1} ${s.imei2 || ''} ${s.salesmanName || ''} ${s.notes || ''} invoice sale bill`.toLowerCase(),
        });
      });
    }

    // 5. PURCHASES
    if (hasPermission('view_purchases')) {
      purchases.forEach((p) => {
        list.push({
          id: `pur-${p.id}`,
          category: 'purchases',
          moduleLabel: 'Purchase',
          badgeColorClass: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: ShoppingBag,
          title: `${p.purchaseNumber} — ${p.brand} ${p.model}`,
          subtitle: `Supplier: ${p.supplierName} • IMEI: ${p.imei1} ${p.imei2 ? '• IMEI2: ' + p.imei2 : ''} • Date: ${formatDate(p.purchaseDate)}`,
          metadata: `Cost: ${formatCurrency(p.purchasePrice)} • Paid: ${formatCurrency(p.paymentAmount)} • Remaining: ${formatCurrency(p.remainingPayable)}`,
          extraBadge: p.paymentMethod || 'Purchase',
          actionLabel: 'View Purchase Details',
          targetView: 'purchases',
          targetId: p.id,
          targetQuery: p.purchaseNumber,
          searchableText: `${p.purchaseNumber} ${p.supplierName} ${p.brand} ${p.model} ${p.imei1} ${p.imei2 || ''} ${p.purchaseDate} purchase buy stock in`.toLowerCase(),
        });
      });
    }

    // 6. ACCESSORIES & PRODUCTS
    if (hasPermission('view_accessories')) {
      accessories.forEach((a) => {
        list.push({
          id: `acc-${a.id}`,
          category: 'accessories',
          moduleLabel: 'Accessory',
          badgeColorClass: 'bg-teal-100 text-teal-700 border-teal-200',
          icon: Headphones,
          title: a.name,
          subtitle: `Category: ${a.category} • Brand: ${a.brand || 'Generic'} • Supplier: ${a.supplier || 'Standard'}`,
          metadata: `Stock: ${a.quantity} units • Sale: ${formatCurrency(a.salePrice)} • Cost: ${formatCurrency(a.purchasePrice)}`,
          extraBadge: a.quantity <= a.minStockLevel ? 'Low Stock' : `${a.quantity} In Stock`,
          actionLabel: 'View & Edit Accessory',
          targetView: 'accessories',
          targetId: a.id,
          targetQuery: a.name,
          searchableText: `${a.name} ${a.category} ${a.brand || ''} ${a.supplier || ''} accessory product charger cable cover handsfree watch earbuds`.toLowerCase(),
        });
      });
    }

    // 7. PAYMENTS (Customer & Supplier)
    if (hasPermission('receive_customer_payment')) {
      customerPayments.forEach((cp) => {
        list.push({
          id: `cp-${cp.id}`,
          category: 'payments',
          moduleLabel: 'Customer Payment',
          badgeColorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: ArrowDownCircle,
          title: `Receipt ${cp.receiptNumber} — ${cp.customerName}`,
          subtitle: `Payment via ${cp.paymentMethod} • Ref: ${cp.reference || 'N/A'} • Date: ${formatDate(cp.date)}`,
          metadata: `Amount Collected: ${formatCurrency(cp.amount)} ${cp.notes ? '• Notes: ' + cp.notes : ''}`,
          extraBadge: cp.paymentMethod,
          actionLabel: 'View Payment Receipt',
          targetView: 'customer-payments',
          targetId: cp.receiptNumber,
          targetQuery: cp.receiptNumber,
          searchableText: `${cp.receiptNumber} ${cp.customerName} ${cp.paymentMethod} ${cp.reference || ''} ${cp.notes || ''} payment customer receive credit`.toLowerCase(),
        });
      });
    }

    if (hasPermission('make_supplier_payment')) {
      supplierPayments.forEach((sp) => {
        list.push({
          id: `sp-${sp.id}`,
          category: 'payments',
          moduleLabel: 'Supplier Payment',
          badgeColorClass: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: ArrowUpCircle,
          title: `Voucher ${sp.voucherNumber} — ${sp.supplierName}`,
          subtitle: `Payment via ${sp.paymentMethod} • Ref: ${sp.reference || 'N/A'} • Date: ${formatDate(sp.date)}`,
          metadata: `Amount Paid Out: ${formatCurrency(sp.amount)} ${sp.notes ? '• Notes: ' + sp.notes : ''}`,
          extraBadge: sp.paymentMethod,
          actionLabel: 'View Supplier Voucher',
          targetView: 'supplier-payments',
          targetId: sp.voucherNumber,
          targetQuery: sp.voucherNumber,
          searchableText: `${sp.voucherNumber} ${sp.supplierName} ${sp.paymentMethod} ${sp.reference || ''} ${sp.notes || ''} payment supplier voucher pay debit`.toLowerCase(),
        });
      });
    }

    // 8. EXPENSES
    if (hasPermission('view_expenses')) {
      expenses.forEach((e) => {
        list.push({
          id: `exp-${e.id}`,
          category: 'expenses',
          moduleLabel: 'Expense',
          badgeColorClass: 'bg-rose-100 text-rose-700 border-rose-200',
          icon: TrendingDown,
          title: `${e.category}: ${e.description}`,
          subtitle: `Paid via ${e.paymentMethod} • Ref: ${e.receiptRef || 'None'} • Date: ${formatDate(e.date)}`,
          metadata: `Expense Amount: ${formatCurrency(e.amount)}`,
          extraBadge: e.category,
          actionLabel: 'View Expense Record',
          targetView: 'expenses',
          targetId: e.id,
          targetQuery: e.description,
          searchableText: `${e.category} ${e.description} ${e.receiptRef || ''} ${e.paymentMethod} ${e.date} expense cost rent electricity salary`.toLowerCase(),
        });
      });
    }

    // 9. CASH & BANK
    if (hasPermission('view_cash')) {
      cashTransactions.forEach((tx) => {
        list.push({
          id: `cash-${tx.id}`,
          category: 'expenses',
          moduleLabel: 'Cash & Bank',
          badgeColorClass: tx.type === 'Cash In' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200',
          icon: Wallet,
          title: `${tx.type} — ${tx.description}`,
          subtitle: `Category: ${tx.category} • Method: ${tx.paymentMethod} • Ref: ${tx.reference || 'None'} • ${formatDate(tx.date)}`,
          metadata: `Amount: ${formatCurrency(tx.amount)} ${tx.notes ? '• ' + tx.notes : ''}`,
          extraBadge: tx.type,
          actionLabel: 'View Cash Transaction',
          targetView: 'cash-bank',
          targetId: tx.id,
          targetQuery: tx.description,
          searchableText: `${tx.description} ${tx.category} ${tx.type} ${tx.paymentMethod} ${tx.reference || ''} ${tx.notes || ''} cash bank ledger`.toLowerCase(),
        });
      });
    }

    // 10. EMPLOYEES & USERS
    if (hasPermission('view_users')) {
      users.forEach((u) => {
        list.push({
          id: `user-${u.id}`,
          category: 'users',
          moduleLabel: 'Staff Member',
          badgeColorClass: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: UserCheck,
          title: `${u.name} (@${u.username})`,
          subtitle: `Role: ${u.role} • ${u.designation || 'Staff'} • Phone: ${u.phone} ${u.cnic ? '• CNIC: ' + u.cnic : ''} ${u.fatherName ? '• S/O: ' + u.fatherName : ''}`,
          metadata: `Status: ${u.status} ${u.salary ? '• Monthly Salary: ' + formatCurrency(u.salary) : ''} • Email: ${u.email}`,
          extraBadge: u.role,
          actionLabel: 'View Staff Profile & ID Details',
          targetView: 'users',
          targetId: u.id,
          targetQuery: u.name,
          extraPayload: { tab: 'users' },
          searchableText: `${u.name} ${u.username} ${u.email} ${u.phone} ${u.role} ${u.designation || ''} ${u.cnic || ''} ${u.fatherName || ''} ${u.address || ''} staff employee user admin`.toLowerCase(),
        });
      });
    }

    // 11. STAFF ATTENDANCE
    if (hasPermission('view_users')) {
      attendanceList.forEach((att) => {
        list.push({
          id: `att-${att.id}`,
          category: 'attendance',
          moduleLabel: 'Attendance',
          badgeColorClass:
            att.status === 'Present'
              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
              : att.status === 'Late'
              ? 'bg-amber-100 text-amber-700 border-amber-200'
              : 'bg-rose-100 text-rose-700 border-rose-200',
          icon: Calendar,
          title: `${att.userName} (${att.role}) — ${att.status}`,
          subtitle: `Date: ${formatDate(att.date)} • Check-in: ${att.checkInTime || '--'} • Check-out: ${att.checkOutTime || '--'} ${att.notes ? '• ' + att.notes : ''}`,
          metadata: `Recorded by: ${att.markedBy || 'System'}`,
          extraBadge: att.status,
          actionLabel: 'Open Attendance Register',
          targetView: 'users',
          targetId: att.userId,
          targetQuery: att.userName,
          extraPayload: { tab: 'attendance' },
          searchableText: `${att.userName} ${att.role} ${att.date} ${att.status} ${att.notes || ''} attendance present absent late staff`.toLowerCase(),
        });
      });
    }

    // 12. RETURNS
    if (hasPermission('view_returns')) {
      returns.forEach((r) => {
        list.push({
          id: `ret-${r.id}`,
          category: 'returns',
          moduleLabel: 'Return',
          badgeColorClass: 'bg-orange-100 text-orange-700 border-orange-200',
          icon: RotateCcw,
          title: `${r.returnNumber} — ${r.type}`,
          subtitle: `${r.brand} ${r.model} • IMEI: ${r.imei1} • Party: ${r.partyName} (${r.partyPhone || ''}) • Reason: ${r.reason}`,
          metadata: `Refund Amount: ${formatCurrency(r.refundAmount)} • Date: ${formatDate(r.date)}`,
          extraBadge: r.type,
          actionLabel: 'View Return Record',
          targetView: 'returns',
          targetId: r.id,
          targetQuery: r.returnNumber,
          searchableText: `${r.returnNumber} ${r.type} ${r.brand} ${r.model} ${r.imei1} ${r.partyName} ${r.partyPhone || ''} ${r.reason} ${r.notes || ''} return refund`.toLowerCase(),
        });
      });
    }

    // 13. EXCHANGES
    if (hasPermission('view_exchange')) {
      exchanges.forEach((ex) => {
        list.push({
          id: `exc-${ex.id}`,
          category: 'returns',
          moduleLabel: 'Exchange',
          badgeColorClass: 'bg-indigo-100 text-indigo-700 border-indigo-200',
          icon: ArrowLeftRight,
          title: `${ex.exchangeNumber} — ${ex.customerName}`,
          subtitle: `Old: ${ex.oldMobileBrand} ${ex.oldMobileModel} (${ex.oldMobileImei}) ➔ New: ${ex.newMobileBrand} ${ex.newMobileModel} (${ex.newMobileImei})`,
          metadata: `Difference: ${formatCurrency(ex.differenceAmount)} • Received: ${formatCurrency(ex.paymentReceived)} • Date: ${formatDate(ex.date)}`,
          extraBadge: 'Exchange',
          actionLabel: 'View Exchange Record',
          targetView: 'exchange',
          targetId: ex.id,
          targetQuery: ex.exchangeNumber,
          searchableText: `${ex.exchangeNumber} ${ex.customerName} ${ex.customerPhone} ${ex.oldMobileBrand} ${ex.oldMobileModel} ${ex.oldMobileImei} ${ex.newMobileBrand} ${ex.newMobileModel} ${ex.newMobileImei} exchange trade old new`.toLowerCase(),
        });
      });
    }

    // 14. ACTIVITY LOGS
    if (hasPermission('view_activity_logs')) {
      logs.slice(0, 50).forEach((l) => {
        list.push({
          id: `log-${l.id}`,
          category: 'all',
          moduleLabel: 'Activity Log',
          badgeColorClass: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Activity,
          title: l.action,
          subtitle: `Performed by ${l.userName} (${l.role}) • Details: ${l.details}`,
          metadata: `Category: ${l.category} • Timestamp: ${l.timestamp}`,
          extraBadge: l.category,
          actionLabel: 'View in Activity Logs',
          targetView: 'activity-log',
          targetId: l.id,
          targetQuery: l.action,
          searchableText: `${l.action} ${l.userName} ${l.role} ${l.details} ${l.category} ${l.entityRef || ''} log audit history`.toLowerCase(),
        });
      });
    }

    // 15. GOOGLE SEARCH MARKET INTELLIGENCE COMMAND
    list.push({
      id: 'cmd-google-intel',
      category: 'all',
      moduleLabel: 'Google Search Intel',
      badgeColorClass: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Globe,
      title: 'Google Live Market Rates & Official PTA Tax Intelligence',
      subtitle: 'Query real-time phone prices in Pakistan, official PTA tax slabs, and specs powered by gemini-2.5-flash',
      metadata: 'Google Search Grounding • Real-time Web Sources & Citations',
      extraBadge: 'gemini-2.5-flash',
      actionLabel: 'Open Google Market Intelligence',
      targetView: 'market-intel',
      searchableText: 'google search market price pta tax dirbs rates mobile intelligence pakistani specs gemini live rates'.toLowerCase(),
    });

    return list;
  }, [
    mobiles,
    sales,
    purchases,
    customers,
    suppliers,
    customerPayments,
    supplierPayments,
    accessories,
    expenses,
    cashTransactions,
    returns,
    exchanges,
    users,
    attendanceList,
    logs,
    hasPermission,
  ]);

  // Compute category counts for current query
  const categoryCounts = useMemo(() => {
    const counts: Record<GlobalSearchCategory, number> = {
      all: 0,
      customers: 0,
      suppliers: 0,
      stock: 0,
      sales: 0,
      purchases: 0,
      accessories: 0,
      payments: 0,
      users: 0,
      attendance: 0,
      expenses: 0,
      warranty: 0,
      returns: 0,
    };

    const trimmed = query.trim().toLowerCase();
    const tokens = trimmed.split(/\s+/).filter(Boolean);

    allSearchableItems.forEach((item) => {
      const matches =
        tokens.length === 0 || tokens.every((token) => item.searchableText.includes(token));
      if (matches) {
        counts.all += 1;
        if (counts[item.category] !== undefined) {
          counts[item.category] += 1;
        }
      }
    });

    return counts;
  }, [allSearchableItems, query]);

  // Filtered results based on selected category & search query
  const filteredResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const tokens = trimmed.split(/\s+/).filter(Boolean);

    let items = allSearchableItems;

    // Filter by category
    if (selectedCategory !== 'all') {
      items = items.filter((item) => item.category === selectedCategory);
    }

    // Filter by query terms (all tokens must match)
    if (tokens.length > 0) {
      items = items.filter((item) =>
        tokens.every((token) => item.searchableText.includes(token))
      );
    }

    // Limit to top 100 for blistering fast rendering
    return items.slice(0, 100);
  }, [allSearchableItems, selectedCategory, query]);

  // Keyboard navigation
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : prev));
      scrollActiveItemIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      scrollActiveItemIntoView();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectItem(filteredResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const scrollActiveItemIntoView = () => {
    setTimeout(() => {
      const activeEl = resultsContainerRef.current?.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 20);
  };

  const handleSelectItem = (item: GlobalSearchResultItem) => {
    onNavigate({
      view: item.targetView,
      targetId: item.targetId,
      targetQuery: item.targetQuery,
      extra: item.extraPayload,
    });
    onClose();
  };

  // Quick jump suggestions when query is empty
  const quickJumpShortcuts = [
    {
      title: 'Customer Directory & Ledgers',
      badge: 'Customers',
      category: 'customers' as GlobalSearchCategory,
      icon: Users,
      action: () => {
        onNavigate({ view: 'customers' });
        onClose();
      },
    },
    {
      title: 'All In-Stock Mobile Inventory',
      badge: 'Phones',
      category: 'stock' as GlobalSearchCategory,
      icon: Smartphone,
      action: () => {
        onNavigate({ view: 'stock' });
        onClose();
      },
    },
    {
      title: 'Sales Register & Invoices',
      badge: 'Invoices',
      category: 'sales' as GlobalSearchCategory,
      icon: Receipt,
      action: () => {
        onNavigate({ view: 'sales' });
        onClose();
      },
    },
    {
      title: 'Supplier Payables & Purchase Ledgers',
      badge: 'Suppliers',
      category: 'suppliers' as GlobalSearchCategory,
      icon: Truck,
      action: () => {
        onNavigate({ view: 'suppliers' });
        onClose();
      },
    },
    {
      title: 'Global IMEI Lifecycle Tracker',
      badge: 'Warranty / IMEI',
      category: 'warranty' as GlobalSearchCategory,
      icon: ShieldCheck,
      action: () => {
        onNavigate({ view: 'imei-tracker' });
        onClose();
      },
    },
    {
      title: 'Staff Management & Daily Attendance',
      badge: 'Staff',
      category: 'users' as GlobalSearchCategory,
      icon: UserCheck,
      action: () => {
        onNavigate({ view: 'users', extra: { tab: 'attendance' } });
        onClose();
      },
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16 p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Header & Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anything in MobiFlow (Customers, IMEIs, Invoices, Suppliers, Staff, Expenses)..."
              className="w-full pl-11 pr-24 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-900 placeholder:text-slate-400 font-medium rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-inner"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-md">
                ESC
              </kbd>
            </div>
          </div>

          {/* Module Filter Pills */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-none text-xs">
            {(
              [
                { id: 'all', label: 'All Modules' },
                { id: 'customers', label: 'Customers' },
                { id: 'suppliers', label: 'Suppliers' },
                { id: 'stock', label: 'Phone Stock' },
                { id: 'sales', label: 'Invoices' },
                { id: 'purchases', label: 'Purchases' },
                { id: 'accessories', label: 'Accessories' },
                { id: 'payments', label: 'Payments' },
                { id: 'users', label: 'Staff' },
                { id: 'attendance', label: 'Attendance' },
                { id: 'expenses', label: 'Expenses & Cash' },
                { id: 'warranty', label: 'Warranty' },
                { id: 'returns', label: 'Returns' },
              ] as const
            ).map((cat) => {
              const count = categoryCounts[cat.id];
              const isSelected = selectedCategory === cat.id;
              if (cat.id !== 'all' && count === 0 && !query) return null;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Container */}
        <div
          ref={resultsContainerRef}
          className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-slate-100 min-h-[300px] max-h-[58vh]"
        >
          {query.trim() === '' && (
            <div className="py-2">
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Quick Modules & Shortcuts</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {quickJumpShortcuts.map((shortcut, idx) => {
                  const Icon = shortcut.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={shortcut.action}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 text-left transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-600 flex items-center justify-center shrink-0 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-950 truncate">
                            {shortcut.title}
                          </div>
                          <div className="text-[11px] text-slate-400">{shortcut.badge}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 shrink-0 transition-colors" />
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                <span>
                  💡 <strong>Pro Tip:</strong> Type any customer name, mobile IMEI, invoice number, supplier, or phone number to find live results instantly.
                </span>
                <span className="text-[11px] font-bold text-slate-400">Total Records: {allSearchableItems.length}</span>
              </div>
            </div>
          )}

          {query.trim() !== '' && filteredResults.length === 0 && (
            <div className="py-14 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No records found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No matching customer, supplier, phone IMEI, invoice, payment, or employee record found for "
                <span className="font-semibold text-slate-700">{query}</span>".
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Search in All Modules
                </button>
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Query
                </button>
              </div>
            </div>
          )}

          {query.trim() !== '' && filteredResults.length > 0 && (
            <div className="space-y-1">
              {filteredResults.map((item, index) => {
                const Icon = item.icon;
                const isSelected = selectedIndex === index;

                return (
                  <div
                    key={item.id}
                    data-active={isSelected ? 'true' : 'false'}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`p-3 rounded-xl flex items-start sm:items-center justify-between gap-3 cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/10 shadow-xs'
                        : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      {/* Module Icon */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${item.badgeColorClass}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Main Record Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${item.badgeColorClass}`}
                          >
                            {item.moduleLabel}
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {item.title}
                          </span>
                          {item.extraBadge && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              {item.extraBadge}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 mt-1 truncate">
                          {item.subtitle}
                        </div>

                        {item.metadata && (
                          <div className="text-[11px] font-medium text-slate-700 mt-0.5 flex items-center gap-2">
                            <span>{item.metadata}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shadow-2xs ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>{item.actionLabel}</span>
                        <CornerDownLeft className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-semibold text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-semibold text-[10px]">
                ↓
              </kbd>
              <span>to navigate</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-semibold text-[10px]">
                ↵
              </kbd>
              <span>to select</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-semibold text-[10px]">
                ESC
              </kbd>
              <span>to close</span>
            </span>
          </div>
          <div className="font-semibold text-slate-600">
            {filteredResults.length} {filteredResults.length === 1 ? 'match' : 'matches'}
          </div>
        </div>
      </div>
    </div>
  );
};
