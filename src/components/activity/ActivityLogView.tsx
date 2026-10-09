import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Printer,
  PlusCircle,
  Trash2,
  Calendar,
  User,
  Shield,
  Smartphone,
  Receipt,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Copy,
  Check,
  RotateCcw,
  ArrowLeftRight,
  Headphones,
  Wallet,
  Settings,
  Layers,
  ChevronRight,
  Eye,
  X,
  FileSpreadsheet,
  Clock,
  UserCheck,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { ActivityCategory, ActivityLog, ActivitySeverity, UserRole } from '../../types';
import { formatCurrency, formatDateTime, formatRelativeTime, formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface ActivityLogViewProps {
  onNavigate?: (view: any) => void;
  onTrackImei?: (imei: string) => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ onNavigate, onTrackImei }) => {
  const { logs, clearLogs, addLog, currentUser, users, settings } = useShop();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');

  // Modals
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual Log Form State
  const [manualAction, setManualAction] = useState('Physical Stock Audit');
  const [manualCategory, setManualCategory] = useState<ActivityCategory>('Stock');
  const [manualSeverity, setManualSeverity] = useState<ActivitySeverity>('info');
  const [manualRef, setManualRef] = useState('');
  const [manualDetails, setManualDetails] = useState('');

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Date calculation boundaries
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const sevenDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.getTime();
  }, []);

  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.getTime();
  }, []);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Text Search (action, details, userName, entityRef)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchAction = log.action.toLowerCase().includes(query);
        const matchDetails = log.details.toLowerCase().includes(query);
        const matchUser = log.userName.toLowerCase().includes(query);
        const matchRef = log.entityRef ? log.entityRef.toLowerCase().includes(query) : false;
        const matchCat = log.category.toLowerCase().includes(query);
        if (!matchAction && !matchDetails && !matchUser && !matchRef && !matchCat) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && log.category !== selectedCategory) {
        return false;
      }

      // 3. User Filter
      if (selectedUser !== 'all' && log.userName !== selectedUser) {
        return false;
      }

      // 4. Role Filter
      if (selectedRole !== 'all' && log.role !== selectedRole) {
        return false;
      }

      // 5. Severity Filter
      if (selectedSeverity !== 'all' && (log.severity || 'info') !== selectedSeverity) {
        return false;
      }

      // 6. Date Filter
      const logDate = log.timestamp.split('T')[0];
      const logTime = new Date(log.timestamp).getTime();

      if (dateFilter === 'today' && logDate !== todayStr) return false;
      if (dateFilter === 'yesterday' && logDate !== yesterdayStr) return false;
      if (dateFilter === 'week' && logTime < sevenDaysAgo) return false;
      if (dateFilter === 'month' && logTime < thirtyDaysAgo) return false;
      if (dateFilter === 'custom' && customDate && logDate !== customDate) return false;

      return true;
    });
  }, [
    logs,
    searchQuery,
    selectedCategory,
    selectedUser,
    selectedRole,
    selectedSeverity,
    dateFilter,
    customDate,
    todayStr,
    yesterdayStr,
    sevenDaysAgo,
    thirtyDaysAgo,
  ]);

  // Statistics
  const stats = useMemo(() => {
    const todayLogs = logs.filter((l) => l.timestamp.startsWith(todayStr));
    const stockEvents = logs.filter((l) => l.category === 'Stock' || l.category === 'Accessories');
    const salesEvents = logs.filter((l) => l.category === 'Sales' || l.category === 'Exchanges');
    const paymentEvents = logs.filter(
      (l) => l.category === 'Customer Payments' || l.category === 'Supplier Payments' || l.category === 'Cash & Bank'
    );
    const alertEvents = logs.filter((l) => l.severity === 'warning' || l.severity === 'danger');

    // Count by staff member
    const staffCount: Record<string, number> = {};
    logs.forEach((l) => {
      staffCount[l.userName] = (staffCount[l.userName] || 0) + 1;
    });

    return {
      total: logs.length,
      today: todayLogs.length,
      stock: stockEvents.length,
      sales: salesEvents.length,
      payments: paymentEvents.length,
      alerts: alertEvents.length,
      staffCount,
    };
  }, [logs, todayStr]);

  // Handle Export CSV
  const handleExportCsv = () => {
    if (filteredLogs.length === 0) return;

    const headers = [
      'Log ID',
      'Timestamp (ISO)',
      'Date & Time',
      'User Name',
      'User Role',
      'Category',
      'Action Title',
      'Severity',
      'Entity Reference',
      'Details / Description',
    ];

    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${formatDateTime(l.timestamp)}"`,
      `"${l.userName}"`,
      `"${l.role}"`,
      `"${l.category}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.severity || 'info'}"`,
      `"${(l.entityRef || '').replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pakmobile_audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  // Submit Manual Audit Log
  const handleCreateManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDetails.trim()) return;

    addLog(
      manualAction,
      manualDetails.trim(),
      manualCategory,
      manualSeverity,
      manualRef.trim() || undefined
    );

    setIsManualModalOpen(false);
    setManualDetails('');
    setManualRef('');
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedUser('all');
    setSelectedRole('all');
    setSelectedSeverity('all');
    setDateFilter('all');
    setCustomDate('');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedUser !== 'all' ||
    selectedRole !== 'all' ||
    selectedSeverity !== 'all' ||
    dateFilter !== 'all' ||
    customDate !== '';

  // Category Icon & Styling Helper
  const getCategoryMeta = (category: ActivityCategory) => {
    switch (category) {
      case 'Stock':
        return { icon: Smartphone, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
      case 'Sales':
        return { icon: Receipt, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'Purchases':
        return { icon: ShoppingBag, color: 'text-sky-600 bg-sky-50 border-sky-200' };
      case 'Customer Payments':
        return { icon: DollarSign, color: 'text-teal-600 bg-teal-50 border-teal-200' };
      case 'Supplier Payments':
        return { icon: DollarSign, color: 'text-orange-600 bg-orange-50 border-orange-200' };
      case 'Cash & Bank':
        return { icon: Wallet, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' };
      case 'Expenses':
        return { icon: Receipt, color: 'text-rose-600 bg-rose-50 border-rose-200' };
      case 'Returns':
        return { icon: RotateCcw, color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'Exchanges':
        return { icon: ArrowLeftRight, color: 'text-purple-600 bg-purple-50 border-purple-200' };
      case 'Accessories':
        return { icon: Headphones, color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'Settings':
        return { icon: Settings, color: 'text-slate-600 bg-slate-100 border-slate-300' };
      default:
        return { icon: Layers, color: 'text-slate-600 bg-slate-100 border-slate-200' };
    }
  };

  // Severity Styling Helper
  const getSeverityBadge = (severity?: ActivitySeverity) => {
    switch (severity) {
      case 'success':
        return {
          icon: CheckCircle2,
          label: 'Success',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          label: 'Warning',
          className: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'danger':
        return {
          icon: XCircle,
          label: 'Critical',
          className: 'bg-red-50 text-red-700 border-red-200',
          dot: 'bg-red-500',
        };
      case 'info':
      default:
        return {
          icon: Info,
          label: 'Info',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
        };
    }
  };

  // User Role Badge Styling Helper
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Salesman':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Accountant':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Audit Controls */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <span>System Activity & Audit Log</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-medium">
                  {filteredLogs.length} / {logs.length}
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological audit trail tracking stock movements, sales, purchases, payment collections, and user operations.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Audit Note</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Log</span>
          </button>

          {currentUser?.role === 'Admin' && (
            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              title="Clear all activity logs (Admin Only)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Total Events</span>
            <History className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">System audit entries</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Today's Actions</span>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-600 mt-1">{stats.today}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Operations since 00:00</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Stock Events</span>
            <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-600 mt-1">{stats.stock}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Mobiles & accessories</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Sales & POS</span>
            <Receipt className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">{stats.sales}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Invoices & exchanges</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Payments & Cash</span>
            <DollarSign className="w-3.5 h-3.5 text-teal-500" />
          </div>
          <div className="text-xl font-bold font-mono text-teal-600 mt-1">{stats.payments}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Khata & cash vouchers</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Alerts & Warns</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1">{stats.alerts}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Returns & deletions</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search action, details, IMEI, invoice #, voucher, customer, or user..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="w-full sm:w-44">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-700"
            >
              <option value="all">All Categories</option>
              <option value="Stock">Stock & Inventory</option>
              <option value="Sales">Sales (POS)</option>
              <option value="Purchases">Purchases</option>
              <option value="Customer Payments">Customer Payments</option>
              <option value="Supplier Payments">Supplier Payments</option>
              <option value="Cash & Bank">Cash & Bank Book</option>
              <option value="Expenses">Expenses</option>
              <option value="Returns">Returns</option>
              <option value="Exchanges">Exchanges</option>
              <option value="Accessories">Accessories</option>
              <option value="Settings">Settings</option>
              <option value="System">System Audit</option>
            </select>
          </div>

          {/* User Filter */}
          <div className="w-full sm:w-40">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-700"
            >
              <option value="all">All Operators</option>
              {users.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="w-full sm:w-36">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-700"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>

          {/* Custom Date Input if selected */}
          {dateFilter === 'custom' && (
            <div className="w-full sm:w-36">
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-700"
              />
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'timeline' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Timeline View
            </button>
          </div>
        </div>

        {/* Quick Filter Chips & Reset */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Quick Filters:</span>
            <button
              type="button"
              onClick={() => {
                setDateFilter('today');
                setSelectedCategory('all');
              }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                dateFilter === 'today'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Today's Activity
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Sales');
                setDateFilter('all');
              }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                selectedCategory === 'Sales'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Sales Only
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Stock');
                setDateFilter('all');
              }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                selectedCategory === 'Stock'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Stock Changes
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Customer Payments');
                setDateFilter('all');
              }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                selectedCategory === 'Customer Payments'
                  ? 'bg-teal-50 text-teal-700 border-teal-200 font-semibold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Customer Payments
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedSeverity('warning');
              }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                selectedSeverity === 'warning'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 font-semibold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Warnings & Deletions
            </button>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Table or Timeline View */}
      {viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Operator / Staff</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Audit Description</th>
                  <th className="py-3 px-4">Entity / Ref</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-sm text-slate-600">No activity logs match your filters</p>
                      <p className="text-xs text-slate-400 mt-1">Try resetting the filters or modifying your search terms.</p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-3 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100"
                        >
                          Clear Filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const sev = getSeverityBadge(log.severity);
                    const catMeta = getCategoryMeta(log.category);
                    const SevIcon = sev.icon;
                    const CatIcon = catMeta.icon;

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        {/* Timestamp */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-900 font-mono text-[11px]">
                            {formatDateTime(log.timestamp)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {formatRelativeTime(log.timestamp)}
                          </div>
                        </td>

                        {/* Operator / User Identity */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">{log.userName}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadge(
                                log.role
                              )}`}
                            >
                              {log.role}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${catMeta.color}`}
                          >
                            <CatIcon className="w-2.5 h-2.5" />
                            <span>{log.category}</span>
                          </span>
                        </td>

                        {/* Action Title */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">{log.action}</span>
                        </td>

                        {/* Details / Description */}
                        <td className="py-3 px-4 max-w-md">
                          <p className="text-slate-600 line-clamp-2 leading-relaxed text-[11px]">
                            {log.details}
                          </p>
                        </td>

                        {/* Entity Reference */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {log.entityRef ? (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                                {log.entityRef}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(log.entityRef!, log.id);
                                }}
                                className="text-slate-400 hover:text-slate-600 p-0.5"
                                title="Copy reference"
                              >
                                {copiedId === log.id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Severity */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${sev.className}`}
                          >
                            <SevIcon className="w-2.5 h-2.5" />
                            <span>{sev.label}</span>
                          </span>
                        </td>

                        {/* Inspect */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TIMELINE FEED VIEW */
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-sm text-slate-600">No activity logs found</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting the filters.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {filteredLogs.map((log) => {
                const sev = getSeverityBadge(log.severity);
                const catMeta = getCategoryMeta(log.category);
                const SevIcon = sev.icon;
                const CatIcon = catMeta.icon;

                return (
                  <div key={log.id} className="relative group">
                    {/* Circle marker */}
                    <div
                      className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ring-slate-100 ${sev.dot}`}
                    />

                    {/* Timeline card */}
                    <div
                      onClick={() => setSelectedLog(log)}
                      className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all cursor-pointer space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{log.action}</span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold border ${catMeta.color}`}
                          >
                            <CatIcon className="w-2.5 h-2.5" />
                            <span>{log.category}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-medium border ${sev.className}`}
                          >
                            <SevIcon className="w-2.5 h-2.5" />
                            <span>{sev.label}</span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {formatDateTime(log.timestamp)} ({formatRelativeTime(log.timestamp)})
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">{log.details}</p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700">Operator: {log.userName}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadge(
                              log.role
                            )}`}
                          >
                            {log.role}
                          </span>
                        </div>

                        {log.entityRef && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 text-[10px]">Ref:</span>
                            <span className="font-mono text-[10px] font-semibold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {log.entityRef}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Inspect Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">{selectedLog.action}</h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      getCategoryMeta(selectedLog.category).color
                    }`}
                  >
                    {selectedLog.category}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">Audit ID: {selectedLog.id}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Detailed Description */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="text-[10px] font-semibold uppercase text-slate-400 mb-1">Audit Record Description</div>
                <p className="text-sm font-medium text-slate-800 leading-relaxed">{selectedLog.details}</p>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400">Logged By (User Identity)</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedLog.userName}</div>
                  <span
                    className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadge(
                      selectedLog.role
                    )}`}
                  >
                    Role: {selectedLog.role}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400">Timestamp</div>
                  <div className="font-semibold text-slate-900 font-mono mt-0.5">
                    {formatDateTime(selectedLog.timestamp)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {formatRelativeTime(selectedLog.timestamp)}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400">Severity Level</div>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        getSeverityBadge(selectedLog.severity).className
                      }`}
                    >
                      {selectedLog.severity?.toUpperCase() || 'INFO'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400">Entity Reference</div>
                  {selectedLog.entityRef ? (
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono font-semibold text-slate-900">{selectedLog.entityRef}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedLog.entityRef!, 'modal')}
                        className="text-slate-400 hover:text-slate-700"
                        title="Copy"
                      >
                        {copiedId === 'modal' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="text-slate-400 mt-1">None specified</div>
                  )}
                </div>
              </div>

              {/* Direct context actions */}
              {selectedLog.entityRef && (
                <div className="pt-2 flex items-center justify-end gap-2">
                  {/* If looks like an IMEI (15 digits) */}
                  {/^\d{14,16}$/.test(selectedLog.entityRef) && onTrackImei && (
                    <button
                      type="button"
                      onClick={() => {
                        onTrackImei(selectedLog.entityRef!);
                        setSelectedLog(null);
                      }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Track this IMEI in Global Search</span>
                    </button>
                  )}

                  {/* If sale invoice */}
                  {selectedLog.entityRef.startsWith('INV-') && onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('sales');
                        setSelectedLog(null);
                      }}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View in Sales Registry</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Audit Entry Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">Add Manual Audit Note</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualLog} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Audit Action Title *</label>
                <select
                  value={manualAction}
                  onChange={(e) => setManualAction(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-800"
                >
                  <option value="Physical Stock Audit">Physical Stock Audit (Verification)</option>
                  <option value="Cash Drawer Reconciliation">Cash Drawer Reconciliation (Closing)</option>
                  <option value="IMEI Whitelist PTA Verification">IMEI Whitelist / PTA Verification</option>
                  <option value="Price Mark-Up Revision">Price Mark-Up Revision</option>
                  <option value="Disputed Customer Khata Note">Disputed Customer Khata Note</option>
                  <option value="Supplier Warranty Claim Audit">Supplier Warranty Claim Audit</option>
                  <option value="Security & Access Inspection">Security & Access Inspection</option>
                  <option value="General Audit Observation">General Audit Observation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Category</label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-800"
                  >
                    <option value="Stock">Stock & Inventory</option>
                    <option value="Cash & Bank">Cash & Bank</option>
                    <option value="Sales">Sales</option>
                    <option value="Purchases">Purchases</option>
                    <option value="Customer Payments">Customer Payments</option>
                    <option value="Supplier Payments">Supplier Payments</option>
                    <option value="System">System</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Severity</label>
                  <select
                    value={manualSeverity}
                    onChange={(e) => setManualSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-800"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="danger">Critical / Danger</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Entity Reference (Optional)</label>
                <input
                  type="text"
                  value={manualRef}
                  onChange={(e) => setManualRef(e.target.value)}
                  placeholder="e.g. IMEI, Invoice #, Voucher #, Drawer #..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Audit Details & Findings *</label>
                <textarea
                  required
                  rows={3}
                  value={manualDetails}
                  onChange={(e) => setManualDetails(e.target.value)}
                  placeholder="Describe the audit observation, count findings, discrepancy, or action taken..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-800"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  This record will be signed with user identity <strong>{currentUser?.name || 'Authorized Staff'} ({currentUser?.role || 'Staff'})</strong> and real-time timestamp.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
                >
                  Save Audit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear Logs Confirmation Modal */}
      <ConfirmationModal
        isOpen={isClearModalOpen}
        title="Purge All Activity Logs"
        message="Are you sure you want to permanently clear the audit log trail? This action cannot be undone and will reset the system audit history."
        confirmLabel="Yes, Purge Activity Logs"
        cancelLabel="Cancel"
        isDanger
        onConfirm={() => {
          clearLogs();
          setIsClearModalOpen(false);
        }}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </div>
  );
};
