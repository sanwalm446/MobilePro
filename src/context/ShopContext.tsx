import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Mobile,
  MobilePurchase,
  MobileSale,
  Customer,
  CustomerPayment,
  Supplier,
  SupplierPayment,
  CashTransaction,
  Expense,
  Accessory,
  AccessorySale,
  ReturnRecord,
  ExchangeRecord,
  ShopSettings,
  User,
  UserRole,
  UserStatus,
  PermissionKey,
  LoginHistoryItem,
  ActivityLog,
  ActivityCategory,
  ActivitySeverity,
  PaymentMethod,
  LedgerEntry,
  OtpSecuritySettings,
  TenantSubscription,
  BackupScheduleSettings,
  StaffAttendance,
} from '../types';
import {
  isSnapshotDue,
  calculateNextSnapshotTime,
  loadTenantSnapshots,
  saveTenantSnapshots,
  createSnapshotFromDatabase,
} from '../services/backupScheduleService';
import {
  initialSettings,
  initialTenantProfiles,
  DEFAULT_UNCONFIGURED_SHOP_NAME,
  initialUsers,
  initialSuppliers,
  initialCustomers,
  initialMobiles,
  initialPurchases,
  initialSales,
  initialAccessories,
  initialAccessorySales,
  initialExpenses,
  initialCustomerPayments,
  initialSupplierPayments,
  initialReturns,
  initialExchanges,
  initialCashTransactions,
  initialLogs,
  initialStaffAttendance,
} from '../data/seedData';
import {
  ROLE_DEFAULT_PERMISSIONS,
  ALL_PERMISSIONS,
  SEED_PASSWORDS,
} from '../data/permissionTemplates';

interface ShopContextType {
  // State
  mobiles: Mobile[];
  sales: MobileSale[];
  purchases: MobilePurchase[];
  customers: Customer[];
  suppliers: Supplier[];
  customerPayments: CustomerPayment[];
  supplierPayments: SupplierPayment[];
  cashTransactions: CashTransaction[];
  expenses: Expense[];
  accessories: Accessory[];
  accessorySales: AccessorySale[];
  returns: ReturnRecord[];
  exchanges: ExchangeRecord[];
  settings: ShopSettings;
  tenantProfiles: Record<string, ShopSettings>;
  currentTenantId: string;
  users: User[];
  currentUser: User | null;
  isAuthenticated: boolean;
  logs: ActivityLog[];
  loginHistory: LoginHistoryItem[];

  // Auth & Session
  login: (
    identifier: string,
    password?: string,
    rememberMe?: boolean,
    skipPasswordCheck?: boolean
  ) => Promise<{ success: boolean; message: string; user?: User }>;
  loginWithGoogle: (googleProfile: {
    email: string;
    name?: string;
    picture?: string;
    googleId?: string;
    shopName?: string;
  }) => Promise<{ success: boolean; message: string; user?: User }>;
  updateSecuritySettings: (settings: Partial<OtpSecuritySettings>) => void;
  updateSubscription: (subscription: Partial<TenantSubscription>) => void;
  signup: (params: {
    name: string;
    username: string;
    email: string;
    phone: string;
    password: string;
    shopName?: string;
    isShopOwner?: boolean;
    tenantId?: string;
  }) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => void;
  setCurrentUser: (user: User | null) => void;

  // Permission Checks
  hasPermission: (permission: PermissionKey) => boolean;
  hasAnyPermission: (permissions: PermissionKey[]) => boolean;

  // User Administration
  addUser: (userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>) => { success: boolean; message: string; id?: string };
  updateUser: (id: string, updates: Partial<User>) => { success: boolean; message: string };
  deleteUser: (id: string) => { success: boolean; message: string };
  approveUser: (id: string, role?: UserRole) => { success: boolean; message: string };
  setUserStatus: (id: string, status: UserStatus) => { success: boolean; message: string };
  setUserRole: (id: string, role: UserRole, applyDefaultPermissions?: boolean) => { success: boolean; message: string };
  setUserPermissions: (id: string, permissions: PermissionKey[]) => { success: boolean; message: string };
  resetUserPassword: (id: string, newPassword: string) => { success: boolean; message: string };
  clearLoginHistory: () => void;

  // Staff Attendance Management
  attendanceList: StaffAttendance[];
  markAttendance: (attendanceData: Omit<StaffAttendance, 'id' | 'createdAt'>) => { success: boolean; message: string };
  updateAttendance: (id: string, updates: Partial<StaffAttendance>) => { success: boolean; message: string };
  deleteAttendance: (id: string) => { success: boolean; message: string };
  checkInStaff: (userId: string, notes?: string) => { success: boolean; message: string };
  checkOutStaff: (userId: string, notes?: string) => { success: boolean; message: string };

  // KPIs
  totalMobileStockCount: number;
  totalMobileStockValue: number;
  totalAccessoriesStockCount: number;
  totalAccessoriesStockValue: number;
  todaySales: number;
  todayPurchases: number;
  todayProfit: number;
  totalCashBalance: number;
  customerReceivables: number;
  supplierPayables: number;
  totalExpenses: number;
  totalProfit: number;
  grossProfit: number;

  // Actions
  addMobile: (mobile: Omit<Mobile, 'id' | 'createdAt'>) => { success: boolean; message: string; id?: string };
  updateMobile: (id: string, mobile: Partial<Mobile>) => { success: boolean; message: string };
  deleteMobile: (id: string) => { success: boolean; message: string };
  
  recordPurchase: (params: {
    supplierId: string;
    mobileData: Omit<Mobile, 'id' | 'supplierId' | 'supplierName' | 'status' | 'createdAt'>;
    paymentAmount: number;
    paymentMethod: PaymentMethod;
    purchaseDate: string;
    notes?: string;
  }) => { success: boolean; message: string; purchaseId?: string };

  recordSale: (params: {
    mobileId: string;
    salePrice: number;
    discount: number;
    amountReceived: number;
    paymentMethod: PaymentMethod;
    saleDate: string;
    customerData: {
      id?: string;
      name: string;
      phone: string;
      address?: string;
      cnic?: string;
    };
    relatedExpenses?: number;
    warrantyInfo?: string;
    notes?: string;
  }) => { success: boolean; message: string; sale?: MobileSale };

  recordAccessorySale: (params: {
    accessoryId: string;
    quantity: number;
    unitSalePrice: number;
    paymentMethod: PaymentMethod;
    customerName?: string;
    customerPhone?: string;
  }) => { success: boolean; message: string };

  addAccessory: (acc: Omit<Accessory, 'id' | 'createdAt'>) => void;
  updateAccessory: (id: string, acc: Partial<Accessory>) => void;
  deleteAccessory: (id: string) => void;

  addCustomer: (cust: Omit<Customer, 'id' | 'totalPurchases' | 'totalPaid' | 'remainingBalance' | 'createdAt'>) => string;
  updateCustomer: (id: string, cust: Partial<Customer>) => void;
  deleteCustomer: (id: string) => { success: boolean; message: string };

  recordCustomerPayment: (params: {
    customerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    date: string;
    reference?: string;
    notes?: string;
  }) => { success: boolean; message: string; payment?: CustomerPayment };

  addSupplier: (sup: Omit<Supplier, 'id' | 'totalPurchases' | 'totalPaid' | 'remainingPayable' | 'createdAt'>) => string;
  updateSupplier: (id: string, sup: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => { success: boolean; message: string };

  recordSupplierPayment: (params: {
    supplierId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    date: string;
    reference?: string;
    notes?: string;
  }) => { success: boolean; message: string; payment?: SupplierPayment };

  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;

  recordCashTransaction: (tx: Omit<CashTransaction, 'id' | 'createdAt'>) => void;

  recordCustomerReturn: (params: {
    saleId: string;
    refundAmount: number;
    reason: string;
    date: string;
    notes?: string;
  }) => { success: boolean; message: string };

  recordSupplierReturn: (params: {
    mobileId: string;
    refundAmount: number;
    reason: string;
    date: string;
    notes?: string;
  }) => { success: boolean; message: string };

  recordMobileExchange: (params: {
    customerName: string;
    customerPhone: string;
    oldMobile: {
      brand: string;
      model: string;
      imei: string;
      condition: 'New' | 'Used' | 'Open Box';
      tradeValue: number;
    };
    newMobileId: string;
    newMobilePrice: number;
    paymentReceived: number;
    paymentMethod: PaymentMethod;
    date: string;
    notes?: string;
  }) => { success: boolean; message: string; exchangeId?: string };

  updateSettings: (newSettings: Partial<ShopSettings>) => { success: boolean; message: string };

  // Ledgers & Timeline
  getCustomerLedger: (customerId: string) => LedgerEntry[];
  getSupplierLedger: (supplierId: string) => LedgerEntry[];
  getImeiTimeline: (imeiQuery: string) => {
    mobile?: Mobile;
    purchase?: MobilePurchase;
    sale?: MobileSale;
    returns: ReturnRecord[];
    exchanges: ExchangeRecord[];
  } | null;

  // Data management
  resetToSampleData: () => void;
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonString: string) => { success: boolean; message: string };
  clearLogs: () => void;
  addLog: (
    action: string,
    details: string,
    category?: ActivityCategory,
    severity?: ActivitySeverity,
    entityRef?: string
  ) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const STORAGE_PREFIX = 'pakmobile_pos_';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error(`Error loading ${key} from localStorage:`, err);
  }
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobiles, setMobiles] = useState<Mobile[]>(() => loadFromStorage('mobiles', initialMobiles));
  const [sales, setSales] = useState<MobileSale[]>(() => loadFromStorage('sales', initialSales));
  const [purchases, setPurchases] = useState<MobilePurchase[]>(() => loadFromStorage('purchases', initialPurchases));
  const [customers, setCustomers] = useState<Customer[]>(() => loadFromStorage('customers', initialCustomers));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadFromStorage('suppliers', initialSuppliers));
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>(() => loadFromStorage('cust_payments', initialCustomerPayments));
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(() => loadFromStorage('sup_payments', initialSupplierPayments));
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(() => loadFromStorage('cash_tx', initialCashTransactions));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadFromStorage('expenses', initialExpenses));
  const [accessories, setAccessories] = useState<Accessory[]>(() => loadFromStorage('accessories', initialAccessories));
  const [accessorySales, setAccessorySales] = useState<AccessorySale[]>(() => loadFromStorage('acc_sales', initialAccessorySales));
  const [returns, setReturns] = useState<ReturnRecord[]>(() => loadFromStorage('returns', initialReturns));
  const [exchanges, setExchanges] = useState<ExchangeRecord[]>(() => loadFromStorage('exchanges', initialExchanges));
  const [tenantProfiles, setTenantProfiles] = useState<Record<string, ShopSettings>>(() => {
    const loaded = loadFromStorage('tenant_profiles', initialTenantProfiles);
    if (loaded && loaded['tenant-default']) {
      loaded['tenant-default'].ownerName = 'Muhammad Sanwal';
    }
    return loaded;
  });
  const [users, setUsers] = useState<User[]>(() => {
    const raw = loadFromStorage('users', initialUsers) as User[];
    return raw.map((u) => {
      const seeded = initialUsers.find((init) => init.id === u.id);
      const isOwnerSanwal = u.id === 'usr-1' || u.name === 'Hafiz Usman' || u.username === 'admin';
      const cleanName = isOwnerSanwal ? 'Muhammad Sanwal' : u.name;
      if (!seeded) return { ...u, name: cleanName };
      return {
        ...u,
        name: cleanName,
        fatherName: u.fatherName || seeded.fatherName,
        cnic: u.cnic || seeded.cnic,
        dob: u.dob || seeded.dob,
        address: u.address || seeded.address,
        emergencyContact: u.emergencyContact || seeded.emergencyContact,
        salary: u.salary || seeded.salary,
        designation: u.designation || seeded.designation,
      };
    });
  });
  const [attendanceList, setAttendanceList] = useState<StaffAttendance[]>(() =>
    loadFromStorage('attendance', initialStaffAttendance)
  );
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>(() =>
    loadFromStorage('login_history', [
      {
        id: 'lh-1',
        userId: 'usr-1',
        username: 'admin',
        role: 'Admin',
        timestamp: '2026-09-29T08:00:00Z',
        status: 'Success',
      },
    ])
  );

  // Restore authenticated session (from localStorage or sessionStorage)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const storedId =
        localStorage.getItem('pakmobile_auth_session') ||
        sessionStorage.getItem('pakmobile_auth_session');
      if (storedId) {
        const loadedUsers = loadFromStorage('users', initialUsers) as User[];
        const found = loadedUsers.find((u) => u.id === storedId && u.status === 'Active');
        if (found) {
          const isSanwal = found.id === 'usr-1' || found.name === 'Hafiz Usman' || found.username === 'admin';
          return isSanwal ? { ...found, name: 'Muhammad Sanwal' } : found;
        }
      }
    } catch {
      // ignore
    }
    // Secure by default: unauthenticated visitors must sign in before accessing private shop data
    return null;
  });

  const isAuthenticated = Boolean(currentUser && currentUser.status === 'Active');

  // Multi-Tenant Isolation: Determine active tenant ID for the current authenticated user
  const currentTenantId = useMemo(() => {
    if (currentUser?.tenantId) return currentUser.tenantId;
    if (currentUser?.id) return `tenant-${currentUser.id}`;
    return 'tenant-default';
  }, [currentUser]);

  // Professional fallback default branding if customer has not yet customized their branding
  const defaultBrandingForTenant: ShopSettings = useMemo(() => ({
    tenantId: currentTenantId,
    shopName: DEFAULT_UNCONFIGURED_SHOP_NAME, // 'Mobile Shop'
    logoUrl: '',
    tagline: 'Professional Mobile Shop ERP & POS',
    ownerName: currentUser?.name || 'Shop Owner',
    phone: currentUser?.phone || '0300-1234567',
    whatsapp: currentUser?.phone || '0300-1234567',
    email: currentUser?.email || 'contact@mobileshop.pk',
    address: 'Shop # 1, Main Mobile Plaza',
    city: 'Lahore, Pakistan',
    website: '',
    taxNumber: '',
    currency: 'Rs.',
    invoiceTerms:
      '1. 7 days checking warranty on used phones. No warranty on LCD break, line or liquid damage.\n2. Original invoice and box required for any warranty claim.\n3. Goods once sold cannot be returned without valid defect reason within 24 hours.',
    warrantyPolicy: 'Official brand warranty claims must be directed to designated authorized service centers.',
    openingCashBalance: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }), [currentTenantId, currentUser]);

  // Active settings resolves strictly from current authenticated tenant's profile
  const settings: ShopSettings = useMemo(() => {
    return tenantProfiles[currentTenantId] || defaultBrandingForTenant;
  }, [tenantProfiles, currentTenantId, defaultBrandingForTenant]);

  const [logs, setLogs] = useState<ActivityLog[]>(() => loadFromStorage('logs', initialLogs));

  // Sync state to local storage
  useEffect(() => saveToStorage('mobiles', mobiles), [mobiles]);
  useEffect(() => saveToStorage('sales', sales), [sales]);
  useEffect(() => saveToStorage('purchases', purchases), [purchases]);
  useEffect(() => saveToStorage('customers', customers), [customers]);
  useEffect(() => saveToStorage('suppliers', suppliers), [suppliers]);
  useEffect(() => saveToStorage('cust_payments', customerPayments), [customerPayments]);
  useEffect(() => saveToStorage('sup_payments', supplierPayments), [supplierPayments]);
  useEffect(() => saveToStorage('cash_tx', cashTransactions), [cashTransactions]);
  useEffect(() => saveToStorage('expenses', expenses), [expenses]);
  useEffect(() => saveToStorage('accessories', accessories), [accessories]);
  useEffect(() => saveToStorage('acc_sales', accessorySales), [accessorySales]);
  useEffect(() => saveToStorage('returns', returns), [returns]);
  useEffect(() => saveToStorage('exchanges', exchanges), [exchanges]);
  useEffect(() => saveToStorage('tenant_profiles', tenantProfiles), [tenantProfiles]);
  useEffect(() => saveToStorage('settings', settings), [settings]);
  useEffect(() => saveToStorage('users', users), [users]);
  useEffect(() => saveToStorage('attendance', attendanceList), [attendanceList]);
  useEffect(() => saveToStorage('login_history', loginHistory), [loginHistory]);
  useEffect(() => saveToStorage('logs', logs), [logs]);

  // Keep active currentUser synchronized with users database
  useEffect(() => {
    if (currentUser) {
      const fresh = users.find((u) => u.id === currentUser.id);
      if (!fresh || fresh.status !== 'Active') {
        setCurrentUser(null);
        localStorage.removeItem('pakmobile_auth_session');
        sessionStorage.removeItem('pakmobile_auth_session');
      } else if (JSON.stringify(fresh) !== JSON.stringify(currentUser)) {
        setCurrentUser(fresh);
      }
    }
  }, [users]);

  // Automated Recurring Database Snapshot Runner
  useEffect(() => {
    const backupCfg = settings.backupSettings;
    if (!backupCfg || !backupCfg.enabled || backupCfg.frequency === 'DISABLED') {
      return;
    }

    const checkAndRunSnapshot = () => {
      if (isSnapshotDue(settings.backupSettings)) {
        try {
          const dbJson = exportDatabaseJson();
          const newSnap = createSnapshotFromDatabase(dbJson, 'AUTOMATIC');
          const maxRetained = settings.backupSettings?.maxRetainedSnapshots || 5;

          const existing = loadTenantSnapshots(currentTenantId || 'default');
          const updated = [newSnap, ...existing];
          saveTenantSnapshots(currentTenantId || 'default', updated, maxRetained);

          const nowIso = new Date().toISOString();
          const nextTime = calculateNextSnapshotTime(settings.backupSettings!.frequency, nowIso);

          setTenantProfiles((prev) => ({
            ...prev,
            [currentTenantId]: {
              ...settings,
              backupSettings: {
                ...settings.backupSettings!,
                lastSnapshotAt: nowIso,
                nextScheduledSnapshotAt: nextTime,
              },
            },
          }));

          addLog(
            'Automated Snapshot Created',
            `System captured scheduled ${settings.backupSettings!.frequency.toLowerCase()} snapshot #${newSnap.id}`,
            'System',
            'info'
          );
        } catch (err) {
          console.error('Automated snapshot runner error:', err);
        }
      }
    };

    // Run check on mount
    checkAndRunSnapshot();

    // Periodic check every 60 seconds
    const interval = setInterval(checkAndRunSnapshot, 60 * 1000);
    return () => clearInterval(interval);
  }, [settings.backupSettings, currentTenantId, mobiles, sales, purchases, customers]);

  // Log helper with user identity, timestamp, category and severity
  const addLog = (
    action: string,
    details: string,
    category: ActivityCategory = 'System',
    severity: ActivitySeverity = 'info',
    entityRef?: string
  ) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userName: currentUser ? currentUser.name : 'System',
      role: currentUser ? currentUser.role : 'Admin',
      action,
      category,
      details,
      timestamp: new Date().toISOString(),
      entityRef,
      severity,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 499)]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const clearLoginHistory = () => {
    setLoginHistory([]);
  };

  // Calculations
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const totalMobileStockCount = useMemo(
    () => mobiles.filter((m) => m.status === 'In Stock').length,
    [mobiles]
  );

  const totalMobileStockValue = useMemo(
    () => mobiles.filter((m) => m.status === 'In Stock').reduce((sum, m) => sum + (m.purchasePrice || 0), 0),
    [mobiles]
  );

  const totalAccessoriesStockCount = useMemo(
    () => accessories.reduce((sum, a) => sum + (a.quantity || 0), 0),
    [accessories]
  );

  const totalAccessoriesStockValue = useMemo(
    () => accessories.reduce((sum, a) => sum + (a.purchasePrice || 0) * (a.quantity || 0), 0),
    [accessories]
  );

  const todaySales = useMemo(() => {
    const mobSalesToday = sales
      .filter((s) => s.saleDate === todayStr)
      .reduce((sum, s) => sum + (s.finalPrice || 0), 0);
    const accSalesToday = accessorySales
      .filter((a) => a.date === todayStr)
      .reduce((sum, a) => sum + (a.totalAmount || 0), 0);
    return mobSalesToday + accSalesToday;
  }, [sales, accessorySales, todayStr]);

  const todayPurchases = useMemo(
    () => purchases.filter((p) => p.purchaseDate === todayStr).reduce((sum, p) => sum + (p.purchasePrice || 0), 0),
    [purchases, todayStr]
  );

  const todayProfit = useMemo(() => {
    const mobProfitToday = sales
      .filter((s) => s.saleDate === todayStr)
      .reduce((sum, s) => sum + (s.profit || 0), 0);
    const accProfitToday = accessorySales
      .filter((a) => a.date === todayStr)
      .reduce((sum, a) => sum + (a.profit || 0), 0);
    const expensesToday = expenses
      .filter((e) => e.date === todayStr)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    return mobProfitToday + accProfitToday - expensesToday;
  }, [sales, accessorySales, expenses, todayStr]);

  const customerReceivables = useMemo(
    () => customers.reduce((sum, c) => sum + Math.max(0, c.remainingBalance || 0), 0),
    [customers]
  );

  const supplierPayables = useMemo(
    () => suppliers.reduce((sum, s) => sum + Math.max(0, s.remainingPayable || 0), 0),
    [suppliers]
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    [expenses]
  );

  const grossProfit = useMemo(() => {
    const mobProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0);
    const accProfit = accessorySales.reduce((sum, a) => sum + (a.profit || 0), 0);
    return mobProfit + accProfit;
  }, [sales, accessorySales]);

  const totalProfit = useMemo(() => grossProfit - totalExpenses, [grossProfit, totalExpenses]);

  // Current Cash Balance: Opening Balance + All Cash In - All Cash Out
  const totalCashBalance = useMemo(() => {
    const totalCashIn = cashTransactions
      .filter((tx) => tx.type === 'Cash In')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const totalCashOut = cashTransactions
      .filter((tx) => tx.type === 'Cash Out')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    return totalCashIn - totalCashOut;
  }, [cashTransactions]);

  // Add mobile
  const addMobile = (mobileData: Omit<Mobile, 'id' | 'createdAt'>) => {
    const cleanImei1 = mobileData.imei1.trim();
    if (mobiles.some((m) => m.imei1.trim() === cleanImei1)) {
      return { success: false, message: `IMEI 1 (${cleanImei1}) already exists in inventory!` };
    }
    if (mobileData.imei2 && mobileData.imei2.trim()) {
      const cleanImei2 = mobileData.imei2.trim();
      if (mobiles.some((m) => m.imei2?.trim() === cleanImei2 || m.imei1.trim() === cleanImei2)) {
        return { success: false, message: `IMEI 2 (${cleanImei2}) already exists in inventory!` };
      }
    }

    const newId = `mob-${Date.now()}`;
    const newMobile: Mobile = {
      ...mobileData,
      id: newId,
      imei1: cleanImei1,
      imei2: mobileData.imei2?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    setMobiles((prev) => [newMobile, ...prev]);
    addLog(
      'Mobile Added',
      `Added ${newMobile.brand} ${newMobile.model} (${newMobile.ram}/${newMobile.storage}, ${newMobile.color}) - Cost: Rs. ${newMobile.purchasePrice.toLocaleString()}`,
      'Stock',
      'info',
      newMobile.imei1
    );
    return { success: true, message: 'Mobile added successfully to inventory!', id: newId };
  };

  // Update mobile
  const updateMobile = (id: string, mobileData: Partial<Mobile>) => {
    const current = mobiles.find((m) => m.id === id);
    if (!current) return { success: false, message: 'Mobile not found' };

    if (mobileData.imei1 && mobileData.imei1.trim() !== current.imei1) {
      const cleanImei1 = mobileData.imei1.trim();
      if (mobiles.some((m) => m.id !== id && m.imei1.trim() === cleanImei1)) {
        return { success: false, message: `IMEI 1 (${cleanImei1}) already in use by another mobile!` };
      }
    }

    setMobiles((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...mobileData } : m))
    );
    addLog(
      'Mobile Updated',
      `Updated details of ${current.brand} ${current.model} (IMEI: ${current.imei1})`,
      'Stock',
      'info',
      current.imei1
    );
    return { success: true, message: 'Mobile updated successfully!' };
  };

  // Delete mobile
  const deleteMobile = (id: string) => {
    const mobile = mobiles.find((m) => m.id === id);
    if (!mobile) return { success: false, message: 'Mobile not found' };
    if (mobile.status === 'Sold') {
      return { success: false, message: 'Cannot delete sold mobile. Please process a customer return first.' };
    }

    setMobiles((prev) => prev.filter((m) => m.id !== id));
    addLog(
      'Mobile Deleted',
      `Deleted ${mobile.brand} ${mobile.model} (IMEI: ${mobile.imei1}) from inventory`,
      'Stock',
      'danger',
      mobile.imei1
    );
    return { success: true, message: 'Mobile removed from stock' };
  };

  // Record Purchase
  const recordPurchase = (params: {
    supplierId: string;
    mobileData: Omit<Mobile, 'id' | 'supplierId' | 'supplierName' | 'status' | 'createdAt'>;
    paymentAmount: number;
    paymentMethod: PaymentMethod;
    purchaseDate: string;
    notes?: string;
  }) => {
    const supplier = suppliers.find((s) => s.id === params.supplierId);
    if (!supplier) return { success: false, message: 'Selected supplier not found' };

    const cleanImei1 = params.mobileData.imei1.trim();
    if (mobiles.some((m) => m.imei1.trim() === cleanImei1)) {
      return { success: false, message: `IMEI 1 (${cleanImei1}) is already in the database!` };
    }

    const mobileId = `mob-${Date.now()}`;
    const newMobile: Mobile = {
      ...params.mobileData,
      id: mobileId,
      supplierId: supplier.id,
      supplierName: supplier.companyName || supplier.name,
      status: 'In Stock',
      createdAt: new Date().toISOString(),
    };

    const purchaseNumber = `PUR-${Date.now().toString().slice(-5)}`;
    const remainingPayable = Math.max(0, params.mobileData.purchasePrice - params.paymentAmount);

    const newPurchase: MobilePurchase = {
      id: `pur-${Date.now()}`,
      purchaseNumber,
      supplierId: supplier.id,
      supplierName: supplier.companyName || supplier.name,
      mobileId,
      brand: newMobile.brand,
      model: newMobile.model,
      imei1: newMobile.imei1,
      imei2: newMobile.imei2,
      purchasePrice: newMobile.purchasePrice,
      paymentAmount: params.paymentAmount,
      remainingPayable,
      paymentMethod: params.paymentMethod,
      purchaseDate: params.purchaseDate,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    // 1. Add mobile
    setMobiles((prev) => [newMobile, ...prev]);

    // 2. Add purchase record
    setPurchases((prev) => [newPurchase, ...prev]);

    // 3. Update supplier ledger
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === supplier.id
          ? {
              ...s,
              totalPurchases: s.totalPurchases + newMobile.purchasePrice,
              totalPaid: s.totalPaid + params.paymentAmount,
              remainingPayable: s.remainingPayable + remainingPayable,
            }
          : s
      )
    );

    // 4. Update cash balance (Cash Out) if paid amount > 0
    if (params.paymentAmount > 0) {
      const cashTx: CashTransaction = {
        id: `ctx-${Date.now()}`,
        date: params.purchaseDate,
        amount: params.paymentAmount,
        type: 'Cash Out',
        category: 'Mobile Purchase',
        description: `Purchase of ${newMobile.brand} ${newMobile.model} (${purchaseNumber}) - ${supplier.name}`,
        paymentMethod: params.paymentMethod,
        reference: purchaseNumber,
        notes: params.notes,
        createdAt: new Date().toISOString(),
      };
      setCashTransactions((prev) => [cashTx, ...prev]);
    }

    addLog(
      'Purchase Recorded',
      `${purchaseNumber}: Bought ${newMobile.brand} ${newMobile.model} from ${supplier.name} for Rs. ${newMobile.purchasePrice.toLocaleString()}`,
      'Purchases',
      'info',
      purchaseNumber
    );

    return { success: true, message: 'Mobile purchased & added to stock successfully!', purchaseId: newPurchase.id };
  };

  // Add / Find Customer
  const addCustomer = (custData: Omit<Customer, 'id' | 'totalPurchases' | 'totalPaid' | 'remainingBalance' | 'createdAt'>): string => {
    const newId = `cust-${Date.now()}`;
    const newCustomer: Customer = {
      ...custData,
      id: newId,
      totalPurchases: 0,
      totalPaid: 0,
      remainingBalance: 0,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    addLog(
      'Customer Created',
      `New customer profile: ${custData.name} (${custData.phone})`,
      'Customer Payments',
      'info'
    );
    return newId;
  };

  const updateCustomer = (id: string, cust: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...cust } : c)));
    addLog('Customer Updated', `Updated profile for customer ID ${id}`, 'Customer Payments', 'info');
  };

  const deleteCustomer = (id: string) => {
    const cust = customers.find((c) => c.id === id);
    if (!cust) return { success: false, message: 'Customer not found' };
    if (cust.remainingBalance > 0) {
      return { success: false, message: `Cannot delete customer with outstanding balance of Rs. ${cust.remainingBalance.toLocaleString()}` };
    }
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    addLog('Customer Deleted', `Deleted customer profile ${cust.name}`, 'Customer Payments', 'warning');
    return { success: true, message: 'Customer deleted successfully' };
  };

  // Add / Update / Delete Supplier
  const addSupplier = (supData: Omit<Supplier, 'id' | 'totalPurchases' | 'totalPaid' | 'remainingPayable' | 'createdAt'>): string => {
    const newId = `sup-${Date.now()}`;
    const newSupplier: Supplier = {
      ...supData,
      id: newId,
      totalPurchases: 0,
      totalPaid: 0,
      remainingPayable: 0,
      createdAt: new Date().toISOString(),
    };
    setSuppliers((prev) => [newSupplier, ...prev]);
    addLog(
      'Supplier Created',
      `New wholesaler registered: ${supData.name} (${supData.companyName})`,
      'Supplier Payments',
      'info'
    );
    return newId;
  };

  const updateSupplier = (id: string, sup: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...sup } : s)));
    addLog('Supplier Updated', `Updated wholesaler profile ID ${id}`, 'Supplier Payments', 'info');
  };

  const deleteSupplier = (id: string) => {
    const sup = suppliers.find((s) => s.id === id);
    if (!sup) return { success: false, message: 'Supplier not found' };
    if (sup.remainingPayable > 0) {
      return { success: false, message: `Cannot delete supplier with pending payable of Rs. ${sup.remainingPayable.toLocaleString()}` };
    }
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    addLog('Supplier Deleted', `Deleted wholesaler ${sup.name}`, 'Supplier Payments', 'warning');
    return { success: true, message: 'Supplier deleted successfully' };
  };

  // Record Sale
  const recordSale = (params: {
    mobileId: string;
    salePrice: number;
    discount: number;
    amountReceived: number;
    paymentMethod: PaymentMethod;
    saleDate: string;
    customerData: {
      id?: string;
      name: string;
      phone: string;
      address?: string;
      cnic?: string;
    };
    relatedExpenses?: number;
    warrantyInfo?: string;
    notes?: string;
  }) => {
    const mobile = mobiles.find((m) => m.id === params.mobileId);
    if (!mobile) return { success: false, message: 'Selected mobile not found' };
    if (mobile.status !== 'In Stock') {
      return { success: false, message: `This mobile is not available for sale (Status: ${mobile.status})` };
    }

    // Resolve customer ID
    let customerId = params.customerData.id;
    if (!customerId) {
      // Find existing by phone
      const existing = customers.find((c) => c.phone.trim() === params.customerData.phone.trim());
      if (existing) {
        customerId = existing.id;
      } else {
        // Create customer
        customerId = addCustomer({
          name: params.customerData.name,
          phone: params.customerData.phone,
          address: params.customerData.address || '',
          cnic: params.customerData.cnic,
        });
      }
    }

    const finalPrice = Math.max(0, params.salePrice - (params.discount || 0));
    const remainingAmount = Math.max(0, finalPrice - params.amountReceived);
    const relatedExpenses = params.relatedExpenses || 0;
    const profit = finalPrice - mobile.purchasePrice - relatedExpenses;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    const newSale: MobileSale = {
      id: `sale-${Date.now()}`,
      invoiceNumber,
      mobileId: mobile.id,
      brand: mobile.brand,
      model: mobile.model,
      imei1: mobile.imei1,
      imei2: mobile.imei2,
      condition: mobile.condition,
      purchasePrice: mobile.purchasePrice,
      salePrice: params.salePrice,
      discount: params.discount,
      finalPrice,
      amountReceived: params.amountReceived,
      remainingAmount,
      profit,
      relatedExpenses,
      customerId,
      customerName: params.customerData.name,
      customerPhone: params.customerData.phone,
      customerAddress: params.customerData.address,
      customerCnic: params.customerData.cnic,
      paymentMethod: params.paymentMethod,
      saleDate: params.saleDate,
      warrantyInfo: params.warrantyInfo || mobile.warrantyPeriod,
      notes: params.notes,
      salesmanName: currentUser ? currentUser.name : 'Counter Staff',
      createdAt: new Date().toISOString(),
    };

    // 1. Mark mobile Sold
    setMobiles((prev) =>
      prev.map((m) => (m.id === mobile.id ? { ...m, status: 'Sold' } : m))
    );

    // 2. Add to sales
    setSales((prev) => [newSale, ...prev]);

    // 3. Update customer record
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              totalPurchases: c.totalPurchases + finalPrice,
              totalPaid: c.totalPaid + params.amountReceived,
              remainingBalance: c.remainingBalance + remainingAmount,
            }
          : c
      )
    );

    // 4. Update Cash balance (Cash In) if amount received > 0
    if (params.amountReceived > 0) {
      const cashTx: CashTransaction = {
        id: `ctx-${Date.now()}`,
        date: params.saleDate,
        amount: params.amountReceived,
        type: 'Cash In',
        category: 'Mobile Sale',
        description: `Sale of ${mobile.brand} ${mobile.model} (${invoiceNumber}) to ${params.customerData.name}`,
        paymentMethod: params.paymentMethod,
        reference: invoiceNumber,
        notes: params.notes,
        createdAt: new Date().toISOString(),
      };
      setCashTransactions((prev) => [cashTx, ...prev]);
    }

    addLog(
      'Sale Completed',
      `${invoiceNumber}: Sold ${mobile.brand} ${mobile.model} (IMEI: ${mobile.imei1}) to ${params.customerData.name} for Rs. ${finalPrice.toLocaleString()} (Profit: Rs. ${profit.toLocaleString()})`,
      'Sales',
      'success',
      invoiceNumber
    );

    return { success: true, message: 'Sale recorded and invoice generated successfully!', sale: newSale };
  };

  // Record Accessory Sale
  const recordAccessorySale = (params: {
    accessoryId: string;
    quantity: number;
    unitSalePrice: number;
    paymentMethod: PaymentMethod;
    customerName?: string;
    customerPhone?: string;
  }) => {
    const acc = accessories.find((a) => a.id === params.accessoryId);
    if (!acc) return { success: false, message: 'Accessory not found' };
    if (acc.quantity < params.quantity) {
      return { success: false, message: `Only ${acc.quantity} units available in stock!` };
    }

    const totalAmount = params.quantity * params.unitSalePrice;
    const profit = totalAmount - params.quantity * acc.purchasePrice;
    const invoiceNumber = `ACC-${Date.now().toString().slice(-5)}`;
    const today = new Date().toISOString().split('T')[0];

    const sale: AccessorySale = {
      id: `accsale-${Date.now()}`,
      invoiceNumber,
      accessoryId: acc.id,
      accessoryName: acc.name,
      category: acc.category,
      quantity: params.quantity,
      unitPurchasePrice: acc.purchasePrice,
      unitSalePrice: params.unitSalePrice,
      totalAmount,
      profit,
      customerName: params.customerName || 'Walk-in Customer',
      customerPhone: params.customerPhone,
      paymentMethod: params.paymentMethod,
      date: today,
      createdAt: new Date().toISOString(),
    };

    // 1. Decrement accessory quantity
    setAccessories((prev) =>
      prev.map((a) => (a.id === acc.id ? { ...a, quantity: a.quantity - params.quantity } : a))
    );

    // 2. Add to accessory sales
    setAccessorySales((prev) => [sale, ...prev]);

    // 3. Cash In
    const cashTx: CashTransaction = {
      id: `ctx-${Date.now()}`,
      date: today,
      amount: totalAmount,
      type: 'Cash In',
      category: 'Accessory Sale',
      description: `Sold ${params.quantity}x ${acc.name} (${invoiceNumber})`,
      paymentMethod: params.paymentMethod,
      reference: invoiceNumber,
      createdAt: new Date().toISOString(),
    };
    setCashTransactions((prev) => [cashTx, ...prev]);

    addLog(
      'Accessory Sale',
      `Sold ${params.quantity}x ${acc.name} for Rs. ${totalAmount.toLocaleString()} to ${params.customerName || 'Walk-in Customer'}`,
      'Accessories',
      'success',
      invoiceNumber
    );
    return { success: true, message: 'Accessory sale recorded successfully!' };
  };

  const addAccessory = (accData: Omit<Accessory, 'id' | 'createdAt'>) => {
    const newAcc: Accessory = {
      ...accData,
      id: `acc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAccessories((prev) => [newAcc, ...prev]);
    addLog(
      'Accessory Added',
      `Added accessory: ${newAcc.name} (Qty: ${newAcc.quantity})`,
      'Accessories',
      'info'
    );
  };

  const updateAccessory = (id: string, accData: Partial<Accessory>) => {
    setAccessories((prev) => prev.map((a) => (a.id === id ? { ...a, ...accData } : a)));
    addLog('Accessory Updated', `Updated accessory ID ${id}`, 'Accessories', 'info');
  };

  const deleteAccessory = (id: string) => {
    setAccessories((prev) => prev.filter((a) => a.id !== id));
    addLog('Accessory Deleted', `Deleted accessory ID ${id}`, 'Accessories', 'warning');
  };

  // Record Customer Payment (settle balance)
  const recordCustomerPayment = (params: {
    customerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    date: string;
    reference?: string;
    notes?: string;
  }) => {
    const customer = customers.find((c) => c.id === params.customerId);
    if (!customer) return { success: false, message: 'Customer not found' };

    const receiptNumber = `CR-${Date.now().toString().slice(-5)}`;
    const newPayment: CustomerPayment = {
      id: `cpay-${Date.now()}`,
      receiptNumber,
      customerId: customer.id,
      customerName: customer.name,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      date: params.date,
      reference: params.reference,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    // 1. Update customer ledger
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customer.id
          ? {
              ...c,
              totalPaid: c.totalPaid + params.amount,
              remainingBalance: Math.max(0, c.remainingBalance - params.amount),
            }
          : c
      )
    );

    // 2. Add customer payment record
    setCustomerPayments((prev) => [newPayment, ...prev]);

    // 3. Cash In
    const cashTx: CashTransaction = {
      id: `ctx-${Date.now()}`,
      date: params.date,
      amount: params.amount,
      type: 'Cash In',
      category: 'Customer Payment',
      description: `Payment received from ${customer.name} (${receiptNumber})`,
      paymentMethod: params.paymentMethod,
      reference: receiptNumber,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };
    setCashTransactions((prev) => [cashTx, ...prev]);

    addLog(
      'Customer Payment Received',
      `${receiptNumber}: Received Rs. ${params.amount.toLocaleString()} from ${customer.name} (${params.paymentMethod})`,
      'Customer Payments',
      'success',
      receiptNumber
    );

    return {
      success: true,
      message: `Payment of Rs. ${params.amount.toLocaleString()} recorded successfully!`,
      payment: newPayment,
    };
  };

  // Record Supplier Payment (settle payable)
  const recordSupplierPayment = (params: {
    supplierId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    date: string;
    reference?: string;
    notes?: string;
  }) => {
    const supplier = suppliers.find((s) => s.id === params.supplierId);
    if (!supplier) return { success: false, message: 'Supplier not found' };

    const voucherNumber = `SP-${Date.now().toString().slice(-5)}`;
    const newPayment: SupplierPayment = {
      id: `spay-${Date.now()}`,
      voucherNumber,
      supplierId: supplier.id,
      supplierName: supplier.companyName || supplier.name,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      date: params.date,
      reference: params.reference,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    // 1. Update supplier ledger
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === supplier.id
          ? {
              ...s,
              totalPaid: s.totalPaid + params.amount,
              remainingPayable: Math.max(0, s.remainingPayable - params.amount),
            }
          : s
      )
    );

    // 2. Add supplier payment record
    setSupplierPayments((prev) => [newPayment, ...prev]);

    // 3. Cash Out
    const cashTx: CashTransaction = {
      id: `ctx-${Date.now()}`,
      date: params.date,
      amount: params.amount,
      type: 'Cash Out',
      category: 'Supplier Payment',
      description: `Payment to supplier ${supplier.name} (${voucherNumber})`,
      paymentMethod: params.paymentMethod,
      reference: voucherNumber,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };
    setCashTransactions((prev) => [cashTx, ...prev]);

    addLog(
      'Supplier Payment Paid',
      `${voucherNumber}: Paid Rs. ${params.amount.toLocaleString()} to ${supplier.name} (${params.paymentMethod})`,
      'Supplier Payments',
      'warning',
      voucherNumber
    );

    return {
      success: true,
      message: `Supplier payment of Rs. ${params.amount.toLocaleString()} recorded!`,
      payment: newPayment,
    };
  };

  // Add Expense
  const addExpense = (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setExpenses((prev) => [newExpense, ...prev]);

    // Cash Out
    const cashTx: CashTransaction = {
      id: `ctx-${Date.now()}`,
      date: expenseData.date,
      amount: expenseData.amount,
      type: 'Cash Out',
      category: 'Other Expense',
      description: `Expense [${expenseData.category}]: ${expenseData.description}`,
      paymentMethod: expenseData.paymentMethod,
      reference: expenseData.receiptRef,
      createdAt: new Date().toISOString(),
    };
    setCashTransactions((prev) => [cashTx, ...prev]);

    addLog(
      'Expense Added',
      `Rs. ${expenseData.amount.toLocaleString()} for ${expenseData.category} - ${expenseData.description}`,
      'Expenses',
      'warning',
      expenseData.receiptRef
    );
  };

  const deleteExpense = (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    if (!exp) return;
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    addLog(
      'Expense Deleted',
      `Removed expense of Rs. ${exp.amount.toLocaleString()} (${exp.category}) - ${exp.description}`,
      'Expenses',
      'danger'
    );
  };

  // Manual Cash Transaction
  const recordCashTransaction = (txData: Omit<CashTransaction, 'id' | 'createdAt'>) => {
    const newTx: CashTransaction = {
      ...txData,
      id: `ctx-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCashTransactions((prev) => [newTx, ...prev]);
    addLog(
      `Cash Transaction (${txData.type})`,
      `${txData.type}: Rs. ${txData.amount.toLocaleString()} [${txData.category}] - ${txData.description}`,
      'Cash & Bank',
      txData.type === 'Cash In' ? 'success' : 'warning',
      txData.reference
    );
  };

  // Customer Return
  const recordCustomerReturn = (params: {
    saleId: string;
    refundAmount: number;
    reason: string;
    date: string;
    notes?: string;
  }) => {
    const sale = sales.find((s) => s.id === params.saleId);
    if (!sale) return { success: false, message: 'Sale record not found' };

    const mobile = mobiles.find((m) => m.id === sale.mobileId);
    const returnNumber = `RET-C-${Date.now().toString().slice(-4)}`;

    const retRecord: ReturnRecord = {
      id: `ret-${Date.now()}`,
      returnNumber,
      type: 'Customer Return',
      mobileId: sale.mobileId,
      saleId: sale.id,
      brand: sale.brand,
      model: sale.model,
      imei1: sale.imei1,
      partyName: sale.customerName,
      partyPhone: sale.customerPhone,
      refundAmount: params.refundAmount,
      reason: params.reason,
      date: params.date,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    // 1. Put mobile back to stock
    setMobiles((prev) =>
      prev.map((m) => (m.id === sale.mobileId ? { ...m, status: 'In Stock' } : m))
    );

    // 2. Deduct from customer total purchases
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === sale.customerId
          ? {
              ...c,
              totalPurchases: Math.max(0, c.totalPurchases - sale.finalPrice),
              remainingBalance: Math.max(0, c.remainingBalance - (sale.remainingAmount || 0)),
            }
          : c
      )
    );

    // 3. Cash Out refund if refundAmount > 0
    if (params.refundAmount > 0) {
      const cashTx: CashTransaction = {
        id: `ctx-${Date.now()}`,
        date: params.date,
        amount: params.refundAmount,
        type: 'Cash Out',
        category: 'Return Refund',
        description: `Customer Return Refund (${returnNumber}) - ${sale.brand} ${sale.model} (IMEI: ${sale.imei1})`,
        paymentMethod: 'Cash',
        reference: returnNumber,
        notes: params.reason,
        createdAt: new Date().toISOString(),
      };
      setCashTransactions((prev) => [cashTx, ...prev]);
    }

    setReturns((prev) => [retRecord, ...prev]);
    addLog(
      'Customer Return Processed',
      `${returnNumber}: ${sale.brand} ${sale.model} (IMEI: ${sale.imei1}) returned by ${sale.customerName}. Refunded Rs. ${params.refundAmount.toLocaleString()}`,
      'Returns',
      'warning',
      returnNumber
    );

    return { success: true, message: 'Return processed and mobile restored to stock!' };
  };

  // Supplier Return
  const recordSupplierReturn = (params: {
    mobileId: string;
    refundAmount: number;
    reason: string;
    date: string;
    notes?: string;
  }) => {
    const mobile = mobiles.find((m) => m.id === params.mobileId);
    if (!mobile) return { success: false, message: 'Mobile not found' };
    if (mobile.status !== 'In Stock') {
      return { success: false, message: 'Can only return in-stock mobile to supplier' };
    }

    const returnNumber = `RET-S-${Date.now().toString().slice(-4)}`;
    const retRecord: ReturnRecord = {
      id: `ret-${Date.now()}`,
      returnNumber,
      type: 'Supplier Return',
      mobileId: mobile.id,
      brand: mobile.brand,
      model: mobile.model,
      imei1: mobile.imei1,
      partyName: mobile.supplierName,
      refundAmount: params.refundAmount,
      reason: params.reason,
      date: params.date,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    // 1. Mark mobile status 'Returned'
    setMobiles((prev) =>
      prev.map((m) => (m.id === mobile.id ? { ...m, status: 'Returned' } : m))
    );

    // 2. Adjust supplier ledger: reduce remaining payable or give cash
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === mobile.supplierId
          ? {
              ...s,
              totalPurchases: Math.max(0, s.totalPurchases - mobile.purchasePrice),
              remainingPayable: Math.max(0, s.remainingPayable - mobile.purchasePrice),
            }
          : s
      )
    );

    // 3. If cash refund received from supplier, Cash In
    if (params.refundAmount > 0) {
      const cashTx: CashTransaction = {
        id: `ctx-${Date.now()}`,
        date: params.date,
        amount: params.refundAmount,
        type: 'Cash In',
        category: 'Supplier Refund',
        description: `Supplier Return Refund (${returnNumber}) from ${mobile.supplierName}`,
        paymentMethod: 'Cash',
        reference: returnNumber,
        notes: params.reason,
        createdAt: new Date().toISOString(),
      };
      setCashTransactions((prev) => [cashTx, ...prev]);
    }

    setReturns((prev) => [retRecord, ...prev]);
    addLog(
      'Supplier Return Processed',
      `${returnNumber}: Returned ${mobile.brand} ${mobile.model} (IMEI: ${mobile.imei1}) to wholesaler ${mobile.supplierName}. Reason: ${params.reason}`,
      'Returns',
      'info',
      returnNumber
    );

    return { success: true, message: 'Mobile returned to supplier successfully!' };
  };

  // Mobile Exchange
  const recordMobileExchange = (params: {
    customerName: string;
    customerPhone: string;
    oldMobile: {
      brand: string;
      model: string;
      imei: string;
      condition: 'New' | 'Used' | 'Open Box';
      tradeValue: number;
    };
    newMobileId: string;
    newMobilePrice: number;
    paymentReceived: number;
    paymentMethod: PaymentMethod;
    date: string;
    notes?: string;
  }) => {
    const newMobile = mobiles.find((m) => m.id === params.newMobileId);
    if (!newMobile) return { success: false, message: 'Target mobile not found' };
    if (newMobile.status !== 'In Stock') {
      return { success: false, message: 'Selected mobile is not available in stock' };
    }

    const exchangeNumber = `EXC-${Date.now().toString().slice(-4)}`;
    const differenceAmount = params.newMobilePrice - params.oldMobile.tradeValue;

    // Check existing customer
    let customer = customers.find((c) => c.phone.trim() === params.customerPhone.trim());
    let customerId = customer?.id;
    if (!customer) {
      customerId = addCustomer({
        name: params.customerName,
        phone: params.customerPhone,
        address: 'Walk-in customer',
      });
    }

    // 1. Mark new mobile as Sold
    setMobiles((prev) =>
      prev.map((m) => (m.id === newMobile.id ? { ...m, status: 'Sold' } : m))
    );

    // 2. Add old mobile into inventory as "Used" (trade-in inward)
    const oldMobileInward: Mobile = {
      id: `mob-exch-${Date.now()}`,
      brand: params.oldMobile.brand,
      model: params.oldMobile.model,
      variant: 'Trade-In Exchange',
      ram: 'N/A',
      storage: 'N/A',
      color: 'Standard',
      imei1: params.oldMobile.imei,
      condition: params.oldMobile.condition,
      purchasePrice: params.oldMobile.tradeValue,
      salePrice: Math.round(params.oldMobile.tradeValue * 1.15), // suggested 15% resale markup
      purchaseDate: params.date,
      supplierId: 'trade-in',
      supplierName: `Trade-In: ${params.customerName}`,
      warrantyPeriod: '7 Days Checking',
      warrantyExpiryDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'In Stock',
      notes: `Exchanged against ${newMobile.brand} ${newMobile.model} (${exchangeNumber})`,
      createdAt: new Date().toISOString(),
    };
    setMobiles((prev) => [oldMobileInward, ...prev]);

    // 3. Record exchange
    const exchangeRecord: ExchangeRecord = {
      id: `exc-${Date.now()}`,
      exchangeNumber,
      customerId: customerId!,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      oldMobileBrand: params.oldMobile.brand,
      oldMobileModel: params.oldMobile.model,
      oldMobileImei: params.oldMobile.imei,
      oldMobileCondition: params.oldMobile.condition,
      oldMobileValue: params.oldMobile.tradeValue,
      newMobileId: newMobile.id,
      newMobileBrand: newMobile.brand,
      newMobileModel: newMobile.model,
      newMobileImei: newMobile.imei1,
      newMobilePrice: params.newMobilePrice,
      differenceAmount,
      paymentReceived: params.paymentReceived,
      paymentMethod: params.paymentMethod,
      date: params.date,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };
    setExchanges((prev) => [exchangeRecord, ...prev]);

    // 4. Update Cash balance if paymentReceived > 0
    if (params.paymentReceived > 0) {
      const cashTx: CashTransaction = {
        id: `ctx-${Date.now()}`,
        date: params.date,
        amount: params.paymentReceived,
        type: 'Cash In',
        category: 'Exchange Payment',
        description: `Exchange difference received from ${params.customerName} (${exchangeNumber})`,
        paymentMethod: params.paymentMethod,
        reference: exchangeNumber,
        notes: params.notes,
        createdAt: new Date().toISOString(),
      };
      setCashTransactions((prev) => [cashTx, ...prev]);
    }

    addLog(
      'Mobile Exchange Completed',
      `${exchangeNumber}: Customer ${params.customerName} traded ${params.oldMobile.brand} ${params.oldMobile.model} (Valued: Rs. ${params.oldMobile.tradeValue.toLocaleString()}) for ${newMobile.brand} ${newMobile.model}. Received difference Rs. ${params.paymentReceived.toLocaleString()}`,
      'Exchanges',
      'success',
      exchangeNumber
    );

    return { success: true, message: 'Exchange completed and inventory updated!', exchangeId: exchangeRecord.id };
  };

  // Update Settings strictly with Tenant Isolation & Security
  const updateSettings = (newSettings: Partial<ShopSettings>): { success: boolean; message: string } => {
    if (!currentUser) {
      return { success: false, message: 'Authentication required to update shop branding.' };
    }
    if (currentUser.role !== 'Admin' && !currentUser.permissions.includes('view_settings')) {
      return { success: false, message: 'Permission denied: Only shop administrators can update shop branding.' };
    }

    setTenantProfiles((prev) => {
      const existing = prev[currentTenantId] || defaultBrandingForTenant;
      const updated: ShopSettings = {
        ...existing,
        ...newSettings,
        tenantId: currentTenantId,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        [currentTenantId]: updated,
      };
    });

    addLog(
      'Shop Branding Updated',
      `Shop branding profile updated for "${newSettings.shopName || settings.shopName}" (Tenant: ${currentTenantId})`,
      'Settings',
      'info'
    );

    return { success: true, message: 'Shop profile & branding saved successfully!' };
  };

  // Customer Ledger
  const getCustomerLedger = (customerId: string): LedgerEntry[] => {
    const entries: LedgerEntry[] = [];
    const custSales = sales.filter((s) => s.customerId === customerId);
    const custPays = customerPayments.filter((p) => p.customerId === customerId);

    custSales.forEach((s) => {
      entries.push({
        id: s.id,
        date: s.saleDate,
        type: 'Sale Invoice',
        reference: s.invoiceNumber,
        description: `${s.brand} ${s.model} (IMEI: ${s.imei1})`,
        debit: s.finalPrice,
        credit: s.amountReceived,
        balance: 0,
      });
    });

    custPays.forEach((p) => {
      entries.push({
        id: p.id,
        date: p.date,
        type: 'Payment Received',
        reference: p.receiptNumber,
        description: `Payment via ${p.paymentMethod}${p.notes ? ` - ${p.notes}` : ''}`,
        debit: 0,
        credit: p.amount,
        balance: 0,
      });
    });

    // Sort by date ascending
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;
    return entries.map((e) => {
      running += e.debit - e.credit;
      return { ...e, balance: running };
    });
  };

  // Supplier Ledger
  const getSupplierLedger = (supplierId: string): LedgerEntry[] => {
    const entries: LedgerEntry[] = [];
    const supPurchases = purchases.filter((p) => p.supplierId === supplierId);
    const supPays = supplierPayments.filter((p) => p.supplierId === supplierId);

    supPurchases.forEach((p) => {
      entries.push({
        id: p.id,
        date: p.purchaseDate,
        type: 'Purchase Bill',
        reference: p.purchaseNumber,
        description: `${p.brand} ${p.model} (IMEI: ${p.imei1})`,
        debit: p.paymentAmount,
        credit: p.purchasePrice,
        balance: 0,
      });
    });

    supPays.forEach((p) => {
      entries.push({
        id: p.id,
        date: p.date,
        type: 'Supplier Payment',
        reference: p.voucherNumber,
        description: `Paid via ${p.paymentMethod}${p.notes ? ` - ${p.notes}` : ''}`,
        debit: p.amount,
        credit: 0,
        balance: 0,
      });
    });

    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;
    return entries.map((e) => {
      running += e.credit - e.debit;
      return { ...e, balance: running };
    });
  };

  // IMEI Global Tracker
  const getImeiTimeline = (imeiQuery: string) => {
    const clean = imeiQuery.trim();
    if (!clean) return null;

    const mobile = mobiles.find(
      (m) =>
        m.imei1.toLowerCase().includes(clean.toLowerCase()) ||
        (m.imei2 && m.imei2.toLowerCase().includes(clean.toLowerCase()))
    );

    if (!mobile) return null;

    const purchase = purchases.find((p) => p.mobileId === mobile.id || p.imei1 === mobile.imei1);
    const sale = sales.find((s) => s.mobileId === mobile.id || s.imei1 === mobile.imei1);
    const retRecords = returns.filter((r) => r.mobileId === mobile.id || r.imei1 === mobile.imei1);
    const excRecords = exchanges.filter(
      (e) => e.newMobileImei === mobile.imei1 || e.oldMobileImei === mobile.imei1
    );

    return {
      mobile,
      purchase,
      sale,
      returns: retRecords,
      exchanges: excRecords,
    };
  };

  // Reset to initial sample data
  const resetToSampleData = () => {
    setMobiles(initialMobiles);
    setSales(initialSales);
    setPurchases(initialPurchases);
    setCustomers(initialCustomers);
    setSuppliers(initialSuppliers);
    setCustomerPayments(initialCustomerPayments);
    setSupplierPayments(initialSupplierPayments);
    setCashTransactions(initialCashTransactions);
    setExpenses(initialExpenses);
    setAccessories(initialAccessories);
    setAccessorySales(initialAccessorySales);
    setReturns(initialReturns);
    setExchanges(initialExchanges);
    setTenantProfiles(initialTenantProfiles);
    setLogs(initialLogs);
    addLog('System Reset', 'All records reset to sample Pakistani mobile shop dataset');
  };

  // Permission checking functions
  const hasPermission = (permission: PermissionKey): boolean => {
    if (!currentUser) return false;
    if (currentUser.status !== 'Active') return false;
    if (
      currentUser.role === 'SUPER_ADMIN' ||
      currentUser.role === 'SHOP_OWNER' ||
      currentUser.role === 'Admin'
    ) {
      return true;
    }
    return Boolean(currentUser.permissions && currentUser.permissions.includes(permission));
  };

  const hasAnyPermission = (permissions: PermissionKey[]): boolean => {
    if (!currentUser) return false;
    if (currentUser.status !== 'Active') return false;
    if (
      currentUser.role === 'SUPER_ADMIN' ||
      currentUser.role === 'SHOP_OWNER' ||
      currentUser.role === 'Admin'
    ) {
      return true;
    }
    return permissions.some((p) => currentUser.permissions && currentUser.permissions.includes(p));
  };

  // Auth: Login
  const login = async (
    identifier: string,
    password = '',
    rememberMe = false,
    skipPasswordCheck = false
  ): Promise<{ success: boolean; message: string; user?: User }> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = identifier.replace(/[^0-9]/g, '');
    let foundUser = users.find(
      (u) =>
        u.username.toLowerCase() === cleanId ||
        u.email.toLowerCase() === cleanId ||
        (cleanPhone.length >= 7 && u.phone.replace(/[^0-9]/g, '').includes(cleanPhone))
    );

    if (!foundUser) {
      const failedLog: LoginHistoryItem = {
        id: `login-${Date.now()}`,
        userId: 'unknown',
        username: identifier,
        role: 'Employee',
        timestamp: new Date().toISOString(),
        status: 'Failed',
      };
      setLoginHistory((prev) => [failedLog, ...prev.slice(0, 99)]);
      return { success: false, message: 'Invalid username, email, or phone.' };
    }

    if (!skipPasswordCheck) {
      const isMatch =
        foundUser.passwordHash === password ||
        SEED_PASSWORDS[foundUser.username] === password;

      if (!isMatch) {
        const failedLog: LoginHistoryItem = {
          id: `login-${Date.now()}`,
          userId: foundUser.id,
          username: foundUser.username,
          role: foundUser.role,
          timestamp: new Date().toISOString(),
          status: 'Failed',
        };
        setLoginHistory((prev) => [failedLog, ...prev.slice(0, 99)]);
        return { success: false, message: 'Invalid password. Please check your credentials.' };
      }
    }

    // Check account status
    // If account was in Pending status, automatically activate it since correct credentials given by owner were provided!
    if (foundUser.status === 'Pending') {
      const activatedUser: User = { ...foundUser, status: 'Active' };
      foundUser = activatedUser;
      setUsers((prev) => prev.map((u) => (u.id === activatedUser.id ? activatedUser : u)));
    }

    if (foundUser.status === 'Suspended') {
      return { success: false, message: 'Your account has been suspended by the shop Administrator. Access denied.' };
    }

    if (foundUser.status === 'Deactivated') {
      return { success: false, message: 'This account has been deactivated. Please contact the Administrator.' };
    }

    // Success
    const updatedUser: User = {
      ...foundUser,
      lastLogin: new Date().toISOString(),
    };

    setUsers((prev) => prev.map((u) => (u.id === foundUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);

    if (rememberMe) {
      localStorage.setItem('pakmobile_auth_session', updatedUser.id);
      sessionStorage.removeItem('pakmobile_auth_session');
    } else {
      sessionStorage.setItem('pakmobile_auth_session', updatedUser.id);
      localStorage.removeItem('pakmobile_auth_session');
    }

    const successLog: LoginHistoryItem = {
      id: `login-${Date.now()}`,
      userId: foundUser.id,
      username: foundUser.username,
      role: foundUser.role,
      timestamp: new Date().toISOString(),
      status: 'Success',
    };
    setLoginHistory((prev) => [successLog, ...prev.slice(0, 99)]);

    addLog(
      'User Signed In',
      `${updatedUser.name} (@${updatedUser.username}) signed in successfully as ${updatedUser.role}`,
      'Auth',
      'info'
    );

    return { success: true, message: 'Login successful!', user: updatedUser };
  };

  const updateSecuritySettings = (newSettings: Partial<OtpSecuritySettings>) => {
    setTenantProfiles((prev) => {
      const current = prev[currentTenantId] || defaultBrandingForTenant;
      const updated: ShopSettings = {
        ...current,
        securitySettings: {
          otpEnabled: true,
          channel: 'email',
          securityMode: 'password_plus_otp',
          expirationMinutes: 5,
          resendCooldownSeconds: 60,
          maxAttempts: 5,
          ...(current.securitySettings || {}),
          ...newSettings,
        },
      };
      return {
        ...prev,
        [currentTenantId]: updated,
      };
    });
    addLog('Security Settings Updated', 'Admin modified OTP authentication security policy', 'Settings', 'warning');
  };

  const updateSubscription = (subUpdates: Partial<TenantSubscription>) => {
    setTenantProfiles((prev) => {
      const current = prev[currentTenantId] || defaultBrandingForTenant;
      const currentSub: TenantSubscription = current.subscription || {
        plan: 'Professional',
        status: 'ACTIVE',
        expiresAt: '2027-12-31T23:59:59Z',
        autoRenew: true,
        maxUsers: 10,
        maxInventory: 5000,
      };
      const updated: ShopSettings = {
        ...current,
        subscription: {
          ...currentSub,
          ...subUpdates,
        },
      };
      return {
        ...prev,
        [currentTenantId]: updated,
      };
    });
    addLog('Subscription Updated', `Tenant subscription modified: ${subUpdates.status || 'Updated'}`, 'Settings', 'info');
  };

  // Auth: Signup with Multi-Tenant Shop Owner support
  const signup = async (params: {
    name: string;
    username: string;
    email: string;
    phone: string;
    password: string;
    shopName?: string;
    isShopOwner?: boolean;
    tenantId?: string;
  }): Promise<{ success: boolean; message: string; user?: User }> => {
    const cleanUsername = params.username.trim().toLowerCase();
    const cleanEmail = params.email.trim().toLowerCase();

    if (!params.name.trim() || !cleanUsername || !cleanEmail || !params.password) {
      return { success: false, message: 'Please complete all required fields.' };
    }

    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: `Username "${params.username}" is already taken.` };
    }

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: `Email "${params.email}" is already registered.` };
    }

    if (params.password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    const isOwner = Boolean(params.isShopOwner);
    const newTenantId = isOwner ? `tenant-${cleanUsername}` : (params.tenantId || 'tenant-default');

    const newUser: User = {
      id: `usr-${Date.now()}`,
      tenantId: newTenantId,
      name: params.name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      phone: params.phone.trim(),
      passwordHash: params.password,
      role: isOwner ? 'SHOP_OWNER' : 'Employee',
      status: 'Active',
      permissions: isOwner ? ROLE_DEFAULT_PERMISSIONS.SHOP_OWNER : ROLE_DEFAULT_PERMISSIONS.Employee,
      createdAt: new Date().toISOString(),
      isMainAdmin: isOwner,
    };

    if (isOwner) {
      const initialShopName = params.shopName?.trim() || 'My Mobile Shop';
      const newTenantProfile: ShopSettings = {
        tenantId: newTenantId,
        shopName: initialShopName,
        logoUrl: '',
        tagline: 'Professional Mobile Shop ERP & POS',
        ownerName: params.name.trim(),
        phone: params.phone.trim(),
        whatsapp: params.phone.trim(),
        email: cleanEmail,
        address: 'Shop # 1, Main Market',
        city: 'Lahore, Pakistan',
        website: '',
        taxNumber: '',
        currency: 'Rs.',
        invoiceTerms:
          '1. 7 days checking warranty on used phones.\n2. Original invoice required for warranty claim.',
        warrantyPolicy: 'Official warranty policy applies.',
        openingCashBalance: 0,
        subscription: {
          plan: 'Professional',
          status: 'ACTIVE',
          expiresAt: '2028-12-31T23:59:59Z',
          autoRenew: true,
          maxUsers: 10,
          maxInventory: 5000,
        },
        securitySettings: {
          otpEnabled: false,
          channel: 'email',
          securityMode: 'password_plus_otp',
          expirationMinutes: 5,
          resendCooldownSeconds: 60,
          maxAttempts: 5,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTenantProfiles((prev) => {
        const next = { ...prev, [newTenantId]: newTenantProfile };
        saveToStorage('tenant_profiles', next);
        return next;
      });

      // Synchronize with server backend
      fetch('/api/auth/register-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: params.name,
          username: cleanUsername,
          email: cleanEmail,
          phone: params.phone,
          shopName: initialShopName,
          password: params.password,
        }),
      }).catch(() => {});

      // Immediately authenticate newly registered user — zero waiting, instant software entry
      setCurrentUser(newUser);
      localStorage.setItem('pakmobile_auth_session', newUser.id);
      sessionStorage.removeItem('pakmobile_auth_session');
    } else {
      // Staff registration is also activated and authenticated immediately!
      setCurrentUser(newUser);
      localStorage.setItem('pakmobile_auth_session', newUser.id);
      sessionStorage.removeItem('pakmobile_auth_session');
    }

    setUsers((prev) => {
      const next = [...prev, newUser];
      saveToStorage('users', next);
      return next;
    });

    addLog(
      isOwner ? 'New Shop Business Registered' : 'Staff Account Registered',
      isOwner
        ? `New shop registered: "${params.shopName || DEFAULT_UNCONFIGURED_SHOP_NAME}" by ${newUser.name} (@${newUser.username})`
        : `New staff account registered: ${newUser.name} (@${newUser.username}). Status: Active`,
      'User Management',
      'success'
    );

    return {
      success: true,
      message: isOwner
        ? 'Shop registered and authenticated! Opening your dashboard...'
        : 'Staff account registered successfully! Opening software...',
      user: newUser,
    };
  };

  // Auth: Real Google OAuth Login & Registration
  const loginWithGoogle = async (googleProfile: {
    email: string;
    name?: string;
    picture?: string;
    googleId?: string;
    shopName?: string;
  }): Promise<{ success: boolean; message: string; user?: User }> => {
    const cleanEmail = googleProfile.email.trim().toLowerCase();
    const displayName = (googleProfile.name && googleProfile.name.trim()) ? googleProfile.name.trim() : cleanEmail.split('@')[0];
    const cleanUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '') || `user${Date.now().toString().slice(-4)}`;

    // 1. Check existing account
    let foundUser = users.find(
      (u) => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUsername
    );

    if (foundUser) {
      if (foundUser.status === 'Suspended') {
        return { success: false, message: 'This Google account has been suspended by the shop Administrator.' };
      }
      if (foundUser.status === 'Deactivated') {
        return { success: false, message: 'This Google account has been deactivated. Please contact the Administrator.' };
      }

      const updatedUser: User = {
        ...foundUser,
        status: 'Active',
        lastLogin: new Date().toISOString(),
      };

      setUsers((prev) => prev.map((u) => (u.id === foundUser!.id ? updatedUser : u)));
      setCurrentUser(updatedUser);
      localStorage.setItem('pakmobile_auth_session', updatedUser.id);
      sessionStorage.removeItem('pakmobile_auth_session');

      const successLog: LoginHistoryItem = {
        id: `login-${Date.now()}`,
        userId: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        timestamp: new Date().toISOString(),
        status: 'Success',
      };
      setLoginHistory((prev) => [successLog, ...prev.slice(0, 99)]);

      addLog('Google Sign In', `${updatedUser.name} signed in successfully via Google account`, 'Auth', 'info');

      // Sync with server
      fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          name: displayName,
          picture: googleProfile.picture,
          googleId: googleProfile.googleId,
        }),
      }).catch(() => {});

      return { success: true, message: 'Signed in with Google successfully!', user: updatedUser };
    }

    // 2. New Google user -> auto-provision tenant workspace & SHOP_OWNER account
    const tenantId = `tenant-${cleanUsername}`;
    const newUser: User = {
      id: `usr-${Date.now()}`,
      tenantId,
      name: displayName,
      username: cleanUsername,
      email: cleanEmail,
      phone: '0300-1234567',
      passwordHash: 'google-oauth-authenticated',
      role: 'SHOP_OWNER',
      status: 'Active',
      permissions: ROLE_DEFAULT_PERMISSIONS.SHOP_OWNER,
      createdAt: new Date().toISOString(),
      isMainAdmin: true,
    };

    const initialShopName = googleProfile.shopName?.trim() || `${displayName}'s Mobile Shop`;
    const newTenantProfile: ShopSettings = {
      tenantId,
      shopName: initialShopName,
      logoUrl: googleProfile.picture || '',
      tagline: 'Professional Mobile Shop ERP & POS',
      ownerName: displayName,
      phone: '0300-1234567',
      whatsapp: '0300-1234567',
      email: cleanEmail,
      address: 'Shop # 1, Main Mobile Center',
      city: 'Pakistan',
      website: '',
      taxNumber: '',
      currency: 'Rs.',
      invoiceTerms:
        '1. 7 days checking warranty on used phones.\n2. Original invoice required for warranty claim.',
      warrantyPolicy: 'Official warranty policy applies.',
      openingCashBalance: 0,
      subscription: {
        plan: 'Professional',
        status: 'ACTIVE',
        expiresAt: '2028-12-31T23:59:59Z',
        autoRenew: true,
        maxUsers: 10,
        maxInventory: 5000,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTenantProfiles((prev) => {
      const next = { ...prev, [tenantId]: newTenantProfile };
      saveToStorage('tenant_profiles', next);
      return next;
    });

    setUsers((prev) => {
      const next = [...prev, newUser];
      saveToStorage('users', next);
      return next;
    });

    setCurrentUser(newUser);
    localStorage.setItem('pakmobile_auth_session', newUser.id);
    sessionStorage.removeItem('pakmobile_auth_session');

    addLog(
      'Google Account Registered',
      `New store workspace "${initialShopName}" registered by Google user ${displayName} (@${newUser.username})`,
      'Auth',
      'success'
    );

    // Sync with server
    fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        name: displayName,
        picture: googleProfile.picture,
        googleId: googleProfile.googleId,
        shopName: initialShopName,
      }),
    }).catch(() => {});

    return { success: true, message: 'Google account registered! Opening your workspace...', user: newUser };
  };

  // Auth: Logout
  const logout = () => {
    if (currentUser) {
      addLog(
        'User Signed Out',
        `${currentUser.name} signed out of the system`,
        'Auth',
        'info'
      );
    }
    localStorage.removeItem('pakmobile_auth_session');
    sessionStorage.removeItem('pakmobile_auth_session');
    setCurrentUser(null);
  };

  // User Management Methods
  const addUser = (userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): { success: boolean; message: string; id?: string } => {
    const cleanUsername = userData.username.trim().toLowerCase();
    const cleanEmail = userData.email.trim().toLowerCase();

    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: `Username "${userData.username}" is already in use.` };
    }
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: `Email "${userData.email}" is already in use.` };
    }

    const newId = `usr-${Date.now()}`;
    const newUser: User = {
      ...userData,
      id: newId,
      tenantId: userData.tenantId || currentUser?.tenantId || 'tenant-default',
      username: cleanUsername,
      email: cleanEmail,
      status: 'Active',
      permissions:
        userData.permissions && userData.permissions.length > 0
          ? userData.permissions
          : ROLE_DEFAULT_PERMISSIONS[userData.role] || [],
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);

    // Synchronize to backend server for instant recognition
    fetch('/api/auth/save-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newId,
        tenantId: newUser.tenantId,
        name: newUser.name,
        username: cleanUsername,
        email: cleanEmail,
        phone: newUser.phone,
        password: userData.passwordHash,
        role: newUser.role,
        status: 'Active',
      }),
    }).catch(() => {});

    addLog(
      'Staff Account Created',
      `Admin created user: ${newUser.name} (@${newUser.username}) with role ${newUser.role} and status ${newUser.status}`,
      'User Management',
      'info'
    );

    return { success: true, message: `User ${newUser.name} created successfully!`, id: newId };
  };

  const updateUser = (id: string, updates: Partial<User>): { success: boolean; message: string } => {
    const target = users.find((u) => u.id === id);
    if (!target) return { success: false, message: 'User not found.' };

    if (target.isMainAdmin) {
      if (updates.role && updates.role !== 'Admin') {
        return { success: false, message: 'The primary Admin account role cannot be changed!' };
      }
      if (updates.status && updates.status !== 'Active') {
        return { success: false, message: 'The primary Admin account cannot be deactivated or suspended!' };
      }
    }

    if (updates.username && updates.username.toLowerCase() !== target.username.toLowerCase()) {
      const conflict = users.some(
        (u) => u.id !== id && u.username.toLowerCase() === updates.username!.trim().toLowerCase()
      );
      if (conflict) return { success: false, message: 'Username is already taken by another account.' };
    }

    if (updates.email && updates.email.toLowerCase() !== target.email.toLowerCase()) {
      const conflict = users.some(
        (u) => u.id !== id && u.email.toLowerCase() === updates.email!.trim().toLowerCase()
      );
      if (conflict) return { success: false, message: 'Email is already taken by another account.' };
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );

    addLog(
      'Staff Account Updated',
      `Admin updated profile for ${target.name} (@${target.username})`,
      'User Management',
      'info'
    );

    return { success: true, message: 'User updated successfully!' };
  };

  const deleteUser = (id: string): { success: boolean; message: string } => {
    const target = users.find((u) => u.id === id);
    if (!target) return { success: false, message: 'User not found.' };

    if (target.isMainAdmin) {
      return { success: false, message: 'The primary Admin account is protected and cannot be deleted!' };
    }

    if (currentUser && currentUser.id === id) {
      return { success: false, message: 'You cannot delete your own currently active account!' };
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));

    addLog(
      'Staff Account Deleted',
      `Admin permanently removed user: ${target.name} (@${target.username})`,
      'User Management',
      'danger'
    );

    return { success: true, message: `User ${target.name} deleted successfully.` };
  };

  const approveUser = (id: string, role?: UserRole): { success: boolean; message: string } => {
    const target = users.find((u) => u.id === id);
    if (!target) return { success: false, message: 'User not found.' };

    const newRole = role || (target.role === 'Employee' ? 'Salesman' : target.role);
    const permissions =
      newRole !== target.role || target.permissions.length === 0
        ? ROLE_DEFAULT_PERMISSIONS[newRole]
        : target.permissions;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              status: 'Active',
              role: newRole,
              permissions,
            }
          : u
      )
    );

    addLog(
      'User Account Approved',
      `Admin approved and activated account for ${target.name} (@${target.username}) as ${newRole}`,
      'User Management',
      'success'
    );

    return { success: true, message: `Account for ${target.name} approved and activated!` };
  };

  const setUserStatus = (id: string, status: UserStatus): { success: boolean; message: string } => {
    const target = users.find((u) => u.id === id);
    if (!target) return { success: false, message: 'User not found.' };

    if (target.isMainAdmin && status !== 'Active') {
      return { success: false, message: 'The primary Admin account cannot be deactivated or suspended!' };
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status } : u))
    );

    addLog(
      'User Status Changed',
      `Admin changed account status of ${target.name} to ${status}`,
      'User Management',
      status === 'Active' ? 'success' : 'warning'
    );

    return { success: true, message: `Status updated to ${status}.` };
  };

  const setUserRole = (
    id: string,
    role: UserRole,
    applyDefaultPermissions = true
  ): { success: boolean; message: string } => {
    const target = users.find((u) => u.id === id);
    if (!target) return { success: false, message: 'User not found.' };

    if (target.isMainAdmin && role !== 'Admin') {
      return { success: false, message: 'The primary Admin cannot be demoted from Admin role!' };
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              role,
              permissions: applyDefaultPermissions
                ? ROLE_DEFAULT_PERMISSIONS[role]
                : u.permissions,
            }
          : u
      )
    );

    addLog(
      'User Role Changed',
      `Admin assigned role ${role} to ${target.name} (permissions updated)`,
      'User Management',
      'warning'
    );

    return { success: true, message: `Role changed to ${role} successfully!` };
  };

  const setUserPermissions = (
    id: string,
    permissions: PermissionKey[]
  ): { success: boolean; message: string } => {
    const target = users.find((u) => u.id === id);
    if (!target) return { success: false, message: 'User not found.' };

    const effectivePermissions = target.isMainAdmin ? ALL_PERMISSIONS : permissions;

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, permissions: effectivePermissions } : u))
    );

    addLog(
      'User Permissions Customized',
      `Admin configured permissions for ${target.name} (${effectivePermissions.length} features allowed)`,
      'User Management',
      'info'
    );

    return { success: true, message: 'Permissions updated successfully!' };
  };

  const resetUserPassword = (id: string, newPassword: string): { success: boolean; message: string } => {
    const target = users.find((u) => u.id === id);
    if (!target) return { success: false, message: 'User not found.' };

    if (newPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, passwordHash: newPassword } : u))
    );

    addLog(
      'Password Reset by Admin',
      `Admin reset password for ${target.name} (@${target.username})`,
      'User Management',
      'warning'
    );

    return { success: true, message: `Password for ${target.name} has been reset!` };
  };

  // Staff Attendance Handlers
  const markAttendance = (attendanceData: Omit<StaffAttendance, 'id' | 'createdAt'>): { success: boolean; message: string } => {
    const existingIndex = attendanceList.findIndex(
      (a) => a.userId === attendanceData.userId && a.date === attendanceData.date
    );

    const nowIso = new Date().toISOString();

    if (existingIndex >= 0) {
      setAttendanceList((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, ...attendanceData, updatedAt: nowIso }
            : item
        )
      );
      addLog(
        'Staff Attendance Updated',
        `Attendance updated for ${attendanceData.userName} on ${attendanceData.date}: ${attendanceData.status}`,
        'User Management',
        'info'
      );
      return { success: true, message: `Attendance for ${attendanceData.userName} updated.` };
    }

    const newRecord: StaffAttendance = {
      ...attendanceData,
      id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: nowIso,
    };

    setAttendanceList((prev) => [newRecord, ...prev]);
    addLog(
      'Staff Attendance Marked',
      `Attendance marked for ${attendanceData.userName} on ${attendanceData.date}: ${attendanceData.status}`,
      'User Management',
      'info'
    );
    return { success: true, message: `Attendance marked for ${attendanceData.userName}.` };
  };

  const updateAttendance = (id: string, updates: Partial<StaffAttendance>): { success: boolean; message: string } => {
    const target = attendanceList.find((a) => a.id === id);
    if (!target) return { success: false, message: 'Attendance record not found.' };

    setAttendanceList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a))
    );
    return { success: true, message: 'Attendance record updated successfully.' };
  };

  const deleteAttendance = (id: string): { success: boolean; message: string } => {
    const target = attendanceList.find((a) => a.id === id);
    if (!target) return { success: false, message: 'Attendance record not found.' };

    setAttendanceList((prev) => prev.filter((a) => a.id !== id));
    addLog(
      'Staff Attendance Deleted',
      `Attendance record for ${target.userName} on ${target.date} was removed`,
      'User Management',
      'warning'
    );
    return { success: true, message: 'Attendance record deleted.' };
  };

  const checkInStaff = (userId: string, notes?: string): { success: boolean; message: string } => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return { success: false, message: 'Staff member not found.' };

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return markAttendance({
      userId: targetUser.id,
      userName: targetUser.name,
      role: targetUser.role,
      date: todayStr,
      checkInTime: nowTimeStr,
      status: 'Present',
      notes: notes || 'Checked in at front desk',
      markedBy: currentUser?.name || 'Admin',
    });
  };

  const checkOutStaff = (userId: string, notes?: string): { success: boolean; message: string } => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return { success: false, message: 'Staff member not found.' };

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const existing = attendanceList.find((a) => a.userId === userId && a.date === todayStr);
    if (existing) {
      return updateAttendance(existing.id, {
        checkOutTime: nowTimeStr,
        notes: notes ? `${existing.notes || ''} | ${notes}` : existing.notes,
      });
    }

    return markAttendance({
      userId: targetUser.id,
      userName: targetUser.name,
      role: targetUser.role,
      date: todayStr,
      checkOutTime: nowTimeStr,
      status: 'Present',
      notes: notes || 'Checked out',
      markedBy: currentUser?.name || 'Admin',
    });
  };

  // Export JSON
  const exportDatabaseJson = (): string => {
    const db = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      mobiles,
      sales,
      purchases,
      customers,
      suppliers,
      customerPayments,
      supplierPayments,
      cashTransactions,
      expenses,
      accessories,
      accessorySales,
      returns,
      exchanges,
      settings,
      tenantProfiles,
      users,
      loginHistory,
      logs,
    };
    return JSON.stringify(db, null, 2);
  };

  // Import JSON
  const importDatabaseJson = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.mobiles || (!data.settings && !data.tenantProfiles)) {
        return { success: false, message: 'Invalid backup format. Missing core tables.' };
      }
      if (data.mobiles) setMobiles(data.mobiles);
      if (data.sales) setSales(data.sales);
      if (data.purchases) setPurchases(data.purchases);
      if (data.customers) setCustomers(data.customers);
      if (data.suppliers) setSuppliers(data.suppliers);
      if (data.customerPayments) setCustomerPayments(data.customerPayments);
      if (data.supplierPayments) setSupplierPayments(data.supplierPayments);
      if (data.cashTransactions) setCashTransactions(data.cashTransactions);
      if (data.expenses) setExpenses(data.expenses);
      if (data.accessories) setAccessories(data.accessories);
      if (data.accessorySales) setAccessorySales(data.accessorySales);
      if (data.returns) setReturns(data.returns);
      if (data.exchanges) setExchanges(data.exchanges);
      if (data.tenantProfiles) {
        setTenantProfiles(data.tenantProfiles);
      } else if (data.settings) {
        setTenantProfiles((prev) => ({
          ...prev,
          [currentTenantId]: data.settings,
        }));
      }
      if (data.users) setUsers(data.users);
      if (data.loginHistory) setLoginHistory(data.loginHistory);
      addLog('Backup Restored', 'Database restored from imported backup file');
      return { success: true, message: 'Backup imported and applied successfully!' };
    } catch (err: any) {
      return { success: false, message: `Failed to parse backup JSON: ${err.message}` };
    }
  };

  return (
    <ShopContext.Provider
      value={{
        mobiles,
        sales,
        purchases,
        customers,
        suppliers,
        customerPayments,
        supplierPayments,
        cashTransactions,
        expenses,
        accessories,
        accessorySales,
        returns,
        exchanges,
        settings,
        tenantProfiles,
        currentTenantId,
        users,
        currentUser,
        isAuthenticated,
        logs,
        loginHistory,

        login,
        loginWithGoogle,
        signup,
        logout,
        setCurrentUser,

        hasPermission,
        hasAnyPermission,

        addUser,
        updateUser,
        deleteUser,
        approveUser,
        setUserStatus,
        setUserRole,
        setUserPermissions,
        resetUserPassword,
        clearLoginHistory,

        attendanceList,
        markAttendance,
        updateAttendance,
        deleteAttendance,
        checkInStaff,
        checkOutStaff,

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

        addMobile,
        updateMobile,
        deleteMobile,
        recordPurchase,
        recordSale,
        recordAccessorySale,
        addAccessory,
        updateAccessory,
        deleteAccessory,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        recordCustomerPayment,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        recordSupplierPayment,
        addExpense,
        deleteExpense,
        recordCashTransaction,
        recordCustomerReturn,
        recordSupplierReturn,
        recordMobileExchange,
        updateSettings,
        updateSecuritySettings,
        updateSubscription,

        getCustomerLedger,
        getSupplierLedger,
        getImeiTimeline,

        resetToSampleData,
        exportDatabaseJson,
        importDatabaseJson,
        clearLogs,
        addLog,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
