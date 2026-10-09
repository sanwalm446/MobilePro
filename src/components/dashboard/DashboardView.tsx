import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Headphones,
  TrendingUp,
  ShoppingBag,
  Coins,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  PieChart,
  BarChart,
  Calendar,
  Layers,
  CheckCircle2,
  DollarSign,
  Award,
  Phone,
  UserCheck,
} from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useShop } from '../../context/ShopContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ShopLogo } from '../common/ShopLogo';
import { ExecutiveContactModal } from '../common/ExecutiveContactModal';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  currency?: string;
}

const CustomDailyTooltip: React.FC<CustomTooltipProps> = ({ active, payload, currency = 'Rs.' }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    if (!data) return null;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-2xl border border-blue-500/30 text-xs space-y-2 min-w-[220px]">
        <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
          <span className="text-sm font-semibold">{data.label}</span>
          <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
            {data.transactions || 0} Tx Orders
          </span>
        </div>
        <div className="flex items-center justify-between text-blue-300">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block shadow-xs shadow-blue-500/50" />
            <span>Sales Volume (Blue):</span>
          </span>
          <span className="font-mono font-bold text-white">
            {formatCurrency(Number(data.sales) || 0, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between text-amber-300">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 inline-block shadow-xs shadow-amber-400/50" />
            <span>Purchases / Stock (Yellow):</span>
          </span>
          <span className="font-mono font-bold text-white">
            {formatCurrency(Number(data.purchases) || 0, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between text-emerald-400 pt-1.5 border-t border-slate-800 font-semibold">
          <span>Gross Margin / Profit:</span>
          <span className="font-mono font-bold">
            {formatCurrency(Number(data.profit) || 0, currency)}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 flex items-center justify-between">
          <span>Proprietor:</span>
          <span className="text-blue-300 font-semibold">Muhammad Sanwal (Owner)</span>
        </div>
      </div>
    );
  }
  return null;
};

interface DashboardViewProps {
  onNavigate: (view: any) => void;
  onOpenNewSale: () => void;
  onOpenNewPurchase: () => void;
  onOpenCustomerPayment: () => void;
  onOpenSupplierPayment: () => void;
  onOpenAddExpense: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenNewSale,
  onOpenNewPurchase,
  onOpenCustomerPayment,
  onOpenSupplierPayment,
  onOpenAddExpense,
}) => {
  const {
    totalMobileStockCount,
    totalMobileStockValue,
    totalAccessoriesStockCount,
    totalAccessoriesStockValue,
    todaySales,
    todayPurchases,
    todayProfit,
    totalCashBalance,
    customerReceivables,
    supplierPayables,
    totalExpenses,
    totalProfit,
    grossProfit,
    settings,
    sales,
    purchases,
    expenses,
    mobiles,
    cashTransactions,
    accessorySales,
    logs,
  } = useShop();

  const [chartPeriod, setChartPeriod] = useState<'7days' | 'monthly'>('7days');
  const [dailyChartMode, setDailyChartMode] = useState<'both' | 'sales' | 'purchases'>('both');
  const [showExecutiveModal, setShowExecutiveModal] = useState(false);
  const ownerName = 'Muhammad Sanwal';

  // Compute 7 days sales data
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
  }, []);

  const dailyChartData = useMemo(() => {
    return last7Days.map((dateStr) => {
      const daySalesList = sales.filter((s) => s.saleDate === dateStr);
      const dayPurchasesList = purchases.filter((p) => p.purchaseDate === dateStr);
      const dayAccSalesList = (accessorySales || []).filter((s) => s.date === dateStr);

      const daySales = daySalesList.reduce((sum, s) => sum + s.finalPrice, 0) +
        dayAccSalesList.reduce((sum, s) => sum + s.totalAmount, 0);
      const dayPurchases = dayPurchasesList.reduce((sum, p) => sum + p.purchasePrice, 0);
      const dayProfit = daySalesList.reduce((sum, s) => sum + s.profit, 0) +
        dayAccSalesList.reduce((sum, s) => sum + s.profit, 0);
      const transactionsCount = daySalesList.length + dayAccSalesList.length;

      const d = new Date(dateStr);
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      return {
        date: dateStr,
        label,
        sales: daySales,
        purchases: dayPurchases,
        profit: dayProfit,
        transactions: transactionsCount,
      };
    });
  }, [last7Days, sales, purchases, accessorySales]);

  const daily7DaySummary = useMemo(() => {
    const totalSales = dailyChartData.reduce((acc, curr) => acc + curr.sales, 0);
    const totalPurchases = dailyChartData.reduce((acc, curr) => acc + curr.purchases, 0);
    const totalTx = dailyChartData.reduce((acc, curr) => acc + curr.transactions, 0);
    const avgDailySales = Math.round(totalSales / 7);
    return { totalSales, totalPurchases, totalTx, avgDailySales };
  }, [dailyChartData]);

  // Compute 30 days daily profit margins, income, expenses & purchases for line chart
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  const thirtyDayChartData = last30Days.map((dateStr) => {
    const daySales = sales
      .filter((s) => s.saleDate === dateStr)
      .reduce((sum, s) => sum + s.finalPrice, 0);

    const dayPurchases = purchases
      .filter((p) => p.purchaseDate === dateStr)
      .reduce((sum, p) => sum + p.purchasePrice, 0);

    const dayExpenses = (expenses || [])
      .filter((e) => e.date === dateStr)
      .reduce((sum, e) => sum + e.amount, 0);

    const dayGrossProfit = sales
      .filter((s) => s.saleDate === dateStr)
      .reduce((sum, s) => sum + s.profit, 0);

    // Net profit = Gross Profit from sales - Daily Operating Expenses
    const dayNetProfit = dayGrossProfit - dayExpenses;

    // Profit margin percentage = (Gross Profit / Sales Revenue) * 100
    const profitMarginPct = daySales > 0 ? Math.round((dayGrossProfit / daySales) * 100) : 0;

    const d = new Date(dateStr);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      date: dateStr,
      label,
      sales: daySales,
      purchases: dayPurchases,
      expenses: dayExpenses,
      profit: dayGrossProfit,
      netProfit: dayNetProfit,
      marginPct: profitMarginPct,
    };
  });

  // Calculate 30-day aggregates
  const thirtyDayTotals = {
    totalSales: thirtyDayChartData.reduce((acc, curr) => acc + curr.sales, 0),
    totalExpenses: thirtyDayChartData.reduce((acc, curr) => acc + curr.expenses, 0),
    totalGrossProfit: thirtyDayChartData.reduce((acc, curr) => acc + curr.profit, 0),
    totalNetProfit: thirtyDayChartData.reduce((acc, curr) => acc + curr.netProfit, 0),
    avgMargin: Math.round(
      thirtyDayChartData.reduce((acc, curr) => acc + curr.marginPct, 0) / Math.max(1, thirtyDayChartData.filter(d => d.sales > 0).length)
    ),
  };

  const maxDailyVal = Math.max(
    ...dailyChartData.map((d) => Math.max(d.sales, d.purchases, 10000)),
    50000
  );

  // Compute Brand Stock Breakdown
  const brandStockCount: { [brand: string]: number } = {};
  mobiles
    .filter((m) => m.status === 'In Stock')
    .forEach((m) => {
      brandStockCount[m.brand] = (brandStockCount[m.brand] || 0) + 1;
    });

  const brandEntries = Object.entries(brandStockCount).sort((a, b) => b[1] - a[1]);

  // Condition breakdown
  const conditionCount = {
    New: mobiles.filter((m) => m.status === 'In Stock' && m.condition === 'New').length,
    Used: mobiles.filter((m) => m.status === 'In Stock' && m.condition === 'Used').length,
    'Open Box': mobiles.filter((m) => m.status === 'In Stock' && m.condition === 'Open Box').length,
  };

  const kpis = [
    {
      title: 'Total Mobile Stock',
      value: `${totalMobileStockCount} Units`,
      subValue: `Value: ${formatCurrency(totalMobileStockValue, settings.currency)}`,
      icon: Smartphone,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
      action: () => onNavigate('stock'),
    },
    {
      title: 'Accessories Stock',
      value: `${totalAccessoriesStockCount} Items`,
      subValue: `Value: ${formatCurrency(totalAccessoriesStockValue, settings.currency)}`,
      icon: Headphones,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-100',
      action: () => onNavigate('accessories'),
    },
    {
      title: "Today's Sales",
      value: formatCurrency(todaySales, settings.currency),
      subValue: 'Total mobile & acc sales',
      icon: TrendingUp,
      color: 'text-blue-700 bg-blue-50 border-blue-100',
      action: () => onNavigate('sales'),
    },
    {
      title: "Today's Purchases",
      value: formatCurrency(todayPurchases, settings.currency),
      subValue: 'New stock inward',
      icon: ShoppingBag,
      color: 'text-purple-700 bg-purple-50 border-purple-100',
      action: () => onNavigate('purchases'),
    },
    {
      title: "Today's Net Profit",
      value: formatCurrency(todayProfit, settings.currency),
      subValue: 'Sales profit minus expenses',
      icon: Coins,
      color: todayProfit >= 0 ? 'text-teal-700 bg-teal-50 border-teal-100' : 'text-rose-700 bg-rose-50 border-rose-100',
      action: () => onNavigate('reports'),
    },
    {
      title: 'Total Cash Balance',
      value: formatCurrency(totalCashBalance, settings.currency),
      subValue: 'Shop register + Bank balances',
      icon: Wallet,
      color: 'text-cyan-700 bg-cyan-50 border-cyan-100',
      action: () => onNavigate('cash-bank'),
    },
    {
      title: 'Customer Receivables',
      value: formatCurrency(customerReceivables, settings.currency),
      subValue: 'Pending customer debts',
      icon: ArrowDownLeft,
      color: 'text-amber-700 bg-amber-50 border-amber-100',
      action: () => onNavigate('customers'),
    },
    {
      title: 'Supplier Payables',
      value: formatCurrency(supplierPayables, settings.currency),
      subValue: 'Due to wholesalers',
      icon: ArrowUpRight,
      color: 'text-rose-700 bg-rose-50 border-rose-100',
      action: () => onNavigate('suppliers'),
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(totalExpenses, settings.currency),
      subValue: 'Rent, Bills, Salaries',
      icon: Receipt,
      color: 'text-slate-700 bg-slate-100 border-slate-200',
      action: () => onNavigate('expenses'),
    },
    {
      title: 'Net Profit (All-Time)',
      value: formatCurrency(totalProfit, settings.currency),
      subValue: `Gross Profit: ${formatCurrency(grossProfit, settings.currency)}`,
      icon: DollarSign,
      color: totalProfit >= 0 ? 'text-emerald-800 bg-emerald-100/60 border-emerald-200' : 'text-red-700 bg-red-50 border-red-100',
      action: () => onNavigate('reports'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <ShopLogo
            logoUrl={settings.logoUrl}
            shopName={settings.shopName}
            size="md"
            variant="light"
            rounded="xl"
            showBorder
          />
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>{settings.shopName}</span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md hidden md:inline-block">
                Dashboard
              </span>
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Owner: <span className="font-semibold text-slate-800">Muhammad Sanwal</span> · {settings.tagline || 'Real-time stock valuation, cash registers, invoices, and ledger summary.'}
            </p>
          </div>
        </div>

        {/* Action button cluster */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowExecutiveModal(true)}
            className="px-3.5 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="App Owner Muhammad Sanwal & Manager Muhammad Hanan Contacts"
          >
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>Leadership & Support</span>
          </button>
          <button
            onClick={onOpenNewSale}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Sell Phone (POS)</span>
          </button>
          <button
            onClick={onOpenNewPurchase}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add Stock</span>
          </button>
          <button
            onClick={onOpenCustomerPayment}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600" />
            <span>Customer Pay</span>
          </button>
          <button
            onClick={onOpenSupplierPayment}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-purple-600" />
            <span>Pay Supplier</span>
          </button>
          <button
            onClick={onOpenAddExpense}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Receipt className="w-3.5 h-3.5 text-rose-600" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Empty State UI for Fresh Shop Workspace */}
      {mobiles.length === 0 && sales.length === 0 && purchases.length === 0 && (
        <div className="bg-gradient-to-r from-emerald-50 via-sky-50 to-teal-50 border border-emerald-200/80 p-5 rounded-2xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Welcome to MobiFlow Software
                </h2>
                <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                  Your store workspace <strong>{settings.shopName}</strong> is active. Start by adding your first product, customer, or sale.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onOpenNewPurchase}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                + Add First Phone Stock
              </button>
              <button
                type="button"
                onClick={onOpenNewSale}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Record First Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10 KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              onClick={kpi.action}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all shadow-xs cursor-pointer hover:shadow-sm group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-500 truncate">{kpi.title}</span>
                <div className={`p-1.5 rounded-lg border ${kpi.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-mono tabular-nums">
                {kpi.value}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 truncate">{kpi.subValue}</div>
            </div>
          );
        })}
      </div>

      {/* Visual Analytics / Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Daily Sales Volume & Transactions (Recharts in Blue & Yellow) */}
        <div className="lg:col-span-2 bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          {/* Chart Header with Owner Badge & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-sm md:text-base text-slate-900 flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-blue-600" />
                  <span>Daily Sales Volume & Transactions</span>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    Last 7 Days
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Visualizing last 7 days daily sales volume (Blue) and transaction turnover (Yellow)
              </p>
            </div>

            {/* Owner Muhammad Sanwal Badge & Mode Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200/80 text-blue-900 text-xs font-bold tracking-tight shadow-2xs">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Owner: <strong className="font-black text-blue-950">Muhammad Sanwal</strong></span>
              </div>

              {/* Theme / Series Toggle */}
              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDailyChartMode('both')}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    dailyChartMode === 'both'
                      ? 'bg-white text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="View both Blue and Yellow series"
                >
                  Both
                </button>
                <button
                  type="button"
                  onClick={() => setDailyChartMode('sales')}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    dailyChartMode === 'sales'
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="View Sales Volume in Blue"
                >
                  Sales (Blue)
                </button>
                <button
                  type="button"
                  onClick={() => setDailyChartMode('purchases')}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    dailyChartMode === 'purchases'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="View Volume / Stock in Yellow"
                >
                  Volume (Yellow)
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar for 7-Day Performance */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 p-2.5 bg-slate-50/80 rounded-lg border border-slate-100">
            <div className="bg-white p-2 rounded-md border border-blue-100/80 shadow-2xs">
              <div className="text-[10px] text-blue-700 font-semibold uppercase flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-blue-600 inline-block" />
                7-Day Sales Volume
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 font-mono mt-0.5">
                {formatCurrency(daily7DaySummary.totalSales, settings.currency)}
              </div>
            </div>

            <div className="bg-white p-2 rounded-md border border-amber-200/80 shadow-2xs">
              <div className="text-[10px] text-amber-700 font-semibold uppercase flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-amber-400 inline-block" />
                7-Day Transactions
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 font-mono mt-0.5">
                {daily7DaySummary.totalTx} Tx Invoices
              </div>
            </div>

            <div className="bg-white p-2 rounded-md border border-slate-200 shadow-2xs">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">
                Daily Average Volume
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 font-mono mt-0.5">
                {formatCurrency(daily7DaySummary.avgDailySales, settings.currency)}
              </div>
            </div>

            <div className="bg-white p-2 rounded-md border border-slate-200 shadow-2xs">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">
                Shop Proprietor
              </div>
              <div className="text-xs sm:text-sm font-bold text-blue-900 truncate mt-0.5">
                Muhammad Sanwal
              </div>
            </div>
          </div>

          {/* Recharts Bar Chart Container */}
          <div className="h-64 mt-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={dailyChartData}
                margin={{ top: 12, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `Rs.${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                />
                <Tooltip
                  content={<CustomDailyTooltip currency={settings.currency} />}
                  cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                />
                {(dailyChartMode === 'both' || dailyChartMode === 'sales') && (
                  <Bar
                    dataKey="sales"
                    name="Daily Sales Volume"
                    fill="#2563eb"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={32}
                  />
                )}
                {(dailyChartMode === 'both' || dailyChartMode === 'purchases') && (
                  <Bar
                    dataKey="purchases"
                    name="Daily Volume / Purchases"
                    fill="#eab308"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={32}
                  />
                )}
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Footer with Legibility & Owner Attribution */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-slate-500 pt-3 mt-2 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <span className="font-medium text-slate-700">
                Peak Day Sales: <span className="font-bold text-blue-700 font-mono">{formatCurrency(maxDailyVal, settings.currency)}</span>
              </span>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="text-slate-600 hidden sm:inline">
                Recharts Dual-Series (Blue & Yellow)
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>Verified Ledger · Owner: <strong className="font-bold text-slate-900">Muhammad Sanwal</strong></span>
            </div>
          </div>
        </div>

        {/* Chart 2: Stock Status & Condition Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              <span>Available Stock Breakdown</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">By brand and condition status</p>
          </div>

          {/* Condition Pills / Horizontal Split */}
          <div className="my-3 p-3 bg-slate-50 rounded-lg">
            <div className="text-xs font-semibold text-slate-700 mb-2">Inventory Conditions:</div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-medium">New (Box)</div>
                <div className="text-sm font-bold text-slate-900 font-mono">{conditionCount.New}</div>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-medium">Used</div>
                <div className="text-sm font-bold text-slate-900 font-mono">{conditionCount.Used}</div>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-medium">Open Box</div>
                <div className="text-sm font-bold text-slate-900 font-mono">{conditionCount['Open Box']}</div>
              </div>
            </div>
          </div>

          {/* Top Brands Progress Bars */}
          <div className="space-y-2.5 flex-1 justify-center flex flex-col">
            <div className="text-xs font-semibold text-slate-700">Stock By Brand:</div>
            {brandEntries.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No mobiles currently in stock</p>
            ) : (
              brandEntries.slice(0, 5).map(([brand, count]) => {
                const pct = Math.round((count / Math.max(1, totalMobileStockCount)) * 100);
                return (
                  <div key={brand} className="text-xs">
                    <div className="flex justify-between mb-1 text-slate-700">
                      <span className="font-medium">{brand}</span>
                      <span className="font-mono text-slate-500">
                        {count} units ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-1.5 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Total in stock:</span>
            <span className="font-bold text-slate-900 font-mono">{totalMobileStockCount} Mobiles</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 30-DAY FINANCIAL & PROFIT MARGIN LINE CHART                   */}
      {/* Visualizes daily Profit Margins, Income/Sales & Expenses     */}
      {/* with distinctive color coding for each financial feature      */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-base text-slate-900">
                30-Day Daily Profit Margins & Financial Performance
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                Last 30 Days
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Visual track of Sales Income, Operating Expenses, Gross Profit, and Net Profit Margin % to evaluate shop financial health.
            </p>
          </div>

          {/* 30-Day KPI Mini Summary Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50/80 border border-emerald-200/80 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-medium">30D Sales:</span>
              <span className="font-bold font-mono text-emerald-700">{formatCurrency(thirtyDayTotals.totalSales, settings.currency)}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-rose-50/80 border border-rose-200/80 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-slate-600 font-medium">30D Expenses:</span>
              <span className="font-bold font-mono text-rose-700">{formatCurrency(thirtyDayTotals.totalExpenses, settings.currency)}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-blue-50/80 border border-blue-200/80 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-slate-600 font-medium">Net Profit:</span>
              <span className="font-bold font-mono text-blue-700">{formatCurrency(thirtyDayTotals.totalNetProfit, settings.currency)}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-teal-50/80 border border-teal-200/80 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <span className="text-slate-600 font-medium">Avg Margin:</span>
              <span className="font-bold font-mono text-teal-700">{thirtyDayTotals.avgMargin}%</span>
            </div>
          </div>
        </div>

        {/* Feature Color Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Features & Metric Series:
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full bg-[#10b981]" />
              <span className="font-semibold text-slate-700">Sales / Income (Green)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full bg-[#f43f5e]" />
              <span className="font-semibold text-slate-700">Expenses (Rose Red)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full bg-[#3b82f6]" />
              <span className="font-semibold text-slate-700">Gross Profit (Royal Blue)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full bg-[#8b5cf6]" />
              <span className="font-semibold text-slate-700">Stock Purchases (Purple)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full bg-[#0d9488] border-t border-dashed border-[#0d9488]" />
              <span className="font-semibold text-teal-800">Profit Margin % (Teal Axis)</span>
            </div>
          </div>
        </div>

        {/* Recharts Dual-Axis Line Chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart
              data={thirtyDayChartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                interval={2}
              />
              {/* Left Axis: Currency (Sales, Expenses, Profit) */}
              <YAxis
                yAxisId="currency"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `Rs.${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
              />
              {/* Right Axis: Profit Margin Percentage */}
              <YAxis
                yAxisId="percent"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#0d9488' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '10px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '11px',
                  padding: '10px 14px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                }}
                formatter={(val: any, name: any) => {
                  if (name === 'Profit Margin %') {
                    return [`${val}%`, name];
                  }
                  return [formatCurrency(Number(val) || 0, settings.currency), name];
                }}
                labelStyle={{ fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px' }}
              />
              <Legend
                verticalAlign="bottom"
                height={30}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              />
              {/* Green: Sales Income */}
              <Line
                yAxisId="currency"
                type="monotone"
                dataKey="sales"
                name="Sales Income"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: '#10b981' }}
                activeDot={{ r: 5 }}
              />
              {/* Red / Rose: Operating Expenses */}
              <Line
                yAxisId="currency"
                type="monotone"
                dataKey="expenses"
                name="Shop Expenses"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={{ r: 2, fill: '#f43f5e' }}
                activeDot={{ r: 5 }}
              />
              {/* Royal Blue: Gross Profit */}
              <Line
                yAxisId="currency"
                type="monotone"
                dataKey="profit"
                name="Gross Profit"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: '#3b82f6' }}
                activeDot={{ r: 5 }}
              />
              {/* Purple: Purchases */}
              <Line
                yAxisId="currency"
                type="monotone"
                dataKey="purchases"
                name="Stock Purchases"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={{ r: 2, fill: '#8b5cf6' }}
                activeDot={{ r: 4 }}
              />
              {/* Teal: Profit Margin % */}
              <Line
                yAxisId="percent"
                type="monotone"
                dataKey="marginPct"
                name="Profit Margin %"
                stroke="#0d9488"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#0d9488' }}
                activeDot={{ r: 5 }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 gap-2">
          <span>
            Continuous 30-day multi-stream monitoring: Track profit trends against expenditures in real-time.
          </span>
          <span className="font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Dual-Scale Recharts Line Visualization Active</span>
          </span>
        </div>
      </div>

      {/* Recent Cash Transactions & Recent Activities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Cash Flow Transactions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>Recent Cash & Bank Transactions</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time financial movement</p>
            </div>
            <button
              onClick={() => onNavigate('cash-bank')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View Full Book →
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {cashTransactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      tx.type === 'Cash In'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}
                  >
                    {tx.type === 'Cash In' ? (
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-slate-800 line-clamp-1">{tx.description}</div>
                    <div className="text-[10px] text-slate-400">
                      {formatDate(tx.date)} · {tx.paymentMethod}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`font-semibold font-mono tabular-nums ${
                      tx.type === 'Cash In' ? 'text-emerald-700' : 'text-slate-900'
                    }`}
                  >
                    {tx.type === 'Cash In' ? '+' : '-'}
                    {formatCurrency(tx.amount, settings.currency)}
                  </div>
                  <div className="text-[10px] text-slate-400">{tx.category}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Activity & Audit Trail */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Shop Activity Log</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Staff audit trail with timestamp</p>
            </div>
            <button
              onClick={() => onNavigate('activity-log')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Full Audit Trail →
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {logs.slice(0, 5).map((log) => (
              <div key={log.id} className="py-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{log.action}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">{log.details}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  By {log.userName} ({log.role})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Executive Team Direct Contact Modal */}
      <ExecutiveContactModal
        isOpen={showExecutiveModal}
        onClose={() => setShowExecutiveModal(false)}
      />
    </div>
  );
};
