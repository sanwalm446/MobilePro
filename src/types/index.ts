export type MobileCondition = 'New' | 'Used' | 'Open Box';
export type MobileStatus = 'In Stock' | 'Sold' | 'Returned' | 'Exchanged';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'EasyPaisa' | 'JazzCash' | 'Cheque';
export type UserRole = 'SUPER_ADMIN' | 'SHOP_OWNER' | 'Admin' | 'Manager' | 'Shop Keeper' | 'Salesman' | 'Accountant' | 'Employee';

export type UserStatus = 'Active' | 'Pending' | 'Suspended' | 'Deactivated';

export type PermissionKey =
  // Dashboard
  | 'view_dashboard'
  // Mobile Stock
  | 'view_stock'
  | 'add_mobile'
  | 'edit_mobile'
  | 'delete_mobile'
  | 'search_imei'
  | 'view_purchase_price'
  | 'view_stock_value'
  // Purchases
  | 'view_purchases'
  | 'add_purchase'
  | 'edit_purchase'
  | 'delete_purchase'
  // Sales
  | 'view_sales'
  | 'create_sale'
  | 'edit_sale'
  | 'delete_sale'
  | 'apply_discount'
  | 'view_profit'
  // Customers
  | 'view_customers'
  | 'add_customer'
  | 'edit_customer'
  | 'delete_customer'
  | 'view_customer_ledger'
  | 'receive_customer_payment'
  | 'view_customer_outstanding'
  // Suppliers
  | 'view_suppliers'
  | 'add_supplier'
  | 'edit_supplier'
  | 'delete_supplier'
  | 'view_supplier_ledger'
  | 'make_supplier_payment'
  | 'view_supplier_payable'
  // Cash / Bank
  | 'view_cash'
  | 'deposit_cash'
  | 'withdraw_cash'
  | 'view_cash_transactions'
  | 'edit_transactions'
  | 'delete_transactions'
  | 'view_cash_balance'
  // Expenses
  | 'view_expenses'
  | 'add_expense'
  | 'edit_expense'
  | 'delete_expense'
  // Returns
  | 'view_returns'
  | 'create_customer_return'
  | 'create_supplier_return'
  | 'edit_return'
  | 'delete_return'
  // Exchange
  | 'view_exchange'
  | 'create_exchange'
  | 'edit_exchange'
  | 'delete_exchange'
  // Accessories
  | 'view_accessories'
  | 'add_accessories'
  | 'edit_accessories'
  | 'delete_accessories'
  | 'sell_accessories'
  // Warranty
  | 'view_warranty'
  | 'add_warranty'
  | 'edit_warranty'
  | 'delete_warranty'
  // Invoices
  | 'view_invoices'
  | 'create_invoice'
  | 'print_invoice'
  | 'download_invoice'
  | 'delete_invoice'
  // Reports
  | 'view_reports'
  | 'view_sales_reports'
  | 'view_purchase_reports'
  | 'view_profit_loss'
  | 'view_stock_reports'
  | 'view_customer_reports'
  | 'view_supplier_reports'
  | 'view_cash_reports'
  | 'view_expense_reports'
  | 'view_business_reports'
  // User Management
  | 'view_users'
  | 'add_users'
  | 'edit_users'
  | 'delete_users'
  | 'activate_deactivate_users'
  | 'assign_roles'
  | 'assign_permissions'
  | 'reset_passwords'
  | 'view_activity_logs'
  // Settings
  | 'view_settings'
  | 'edit_shop_settings'
  | 'edit_invoice_settings'
  | 'manage_users'
  | 'manage_roles'
  | 'manage_permissions'
  | 'backup_restore';

export interface Mobile {
  id: string;
  brand: string;
  model: string;
  variant: string; // e.g., 'Official PTA', 'Non-PTA / JV', 'Global Dual SIM'
  ram: string; // e.g., '8GB', '12GB'
  storage: string; // e.g., '128GB', '256GB'
  color: string;
  imei1: string;
  imei2?: string;
  serialNumber?: string;
  condition: MobileCondition;
  purchasePrice: number;
  salePrice: number;
  purchaseDate: string; // YYYY-MM-DD
  supplierId: string;
  supplierName: string;
  warrantyPeriod: string; // e.g. '1 Year Official', '7 Days Checking'
  warrantyExpiryDate: string; // YYYY-MM-DD
  status: MobileStatus;
  notes?: string;
  imageUrl?: string;
  images?: string[];
  createdAt: string;
}

export interface MobilePurchase {
  id: string;
  purchaseNumber: string; // e.g. 'PUR-1001'
  supplierId: string;
  supplierName: string;
  mobileId: string;
  brand: string;
  model: string;
  imei1: string;
  imei2?: string;
  purchasePrice: number;
  paymentAmount: number;
  remainingPayable: number;
  paymentMethod: PaymentMethod;
  purchaseDate: string;
  notes?: string;
  createdAt: string;
}

export interface MobileSale {
  id: string;
  invoiceNumber: string; // e.g. 'INV-1001'
  mobileId: string;
  brand: string;
  model: string;
  imei1: string;
  imei2?: string;
  condition: MobileCondition;
  purchasePrice: number;
  salePrice: number;
  discount: number;
  finalPrice: number;
  amountReceived: number;
  remainingAmount: number;
  profit: number; // finalPrice - purchasePrice - relatedExpenses
  relatedExpenses: number;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerCnic?: string;
  paymentMethod: PaymentMethod;
  saleDate: string;
  warrantyInfo: string;
  notes?: string;
  salesmanName?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  cnic?: string;
  totalPurchases: number;
  totalPaid: number;
  remainingBalance: number;
  createdAt: string;
}

export interface CustomerPayment {
  id: string;
  receiptNumber: string; // e.g. 'CR-1001'
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  companyName: string;
  totalPurchases: number;
  totalPaid: number;
  remainingPayable: number;
  createdAt: string;
}

export interface SupplierPayment {
  id: string;
  voucherNumber: string; // e.g. 'SP-1001'
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export type CashTxType = 'Cash In' | 'Cash Out';
export type CashTxCategory =
  | 'Mobile Sale'
  | 'Accessory Sale'
  | 'Customer Payment'
  | 'Other Income'
  | 'Supplier Refund'
  | 'Deposit'
  | 'Mobile Purchase'
  | 'Supplier Payment'
  | 'Shop Rent'
  | 'Electricity'
  | 'Salary'
  | 'Transport'
  | 'Repair Expense'
  | 'Other Expense'
  | 'Return Refund'
  | 'Withdrawal'
  | 'Exchange Payment'
  | 'Other';

export interface CashTransaction {
  id: string;
  date: string;
  amount: number;
  type: CashTxType;
  category: CashTxCategory;
  description: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Rent'
  | 'Electricity'
  | 'Internet'
  | 'Salary'
  | 'Transport'
  | 'Repair'
  | 'Marketing'
  | 'Food'
  | 'Other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  description: string;
  receiptRef?: string;
  createdAt: string;
}

export type AccessoryCategory =
  | 'Chargers'
  | 'Data Cables'
  | 'Handsfree'
  | 'Mobile Covers'
  | 'Screen Protectors'
  | 'Power Banks'
  | 'Earbuds'
  | 'Smart Watches'
  | 'Other';

export interface Accessory {
  id: string;
  name: string;
  category: AccessoryCategory;
  brand: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  supplier: string;
  minStockLevel: number;
  createdAt: string;
}

export interface AccessorySale {
  id: string;
  invoiceNumber: string;
  accessoryId: string;
  accessoryName: string;
  category: AccessoryCategory;
  quantity: number;
  unitPurchasePrice: number;
  unitSalePrice: number;
  totalAmount: number;
  profit: number;
  customerName?: string;
  customerPhone?: string;
  paymentMethod: PaymentMethod;
  date: string;
  createdAt: string;
}

export interface ReturnRecord {
  id: string;
  returnNumber: string;
  type: 'Customer Return' | 'Supplier Return';
  mobileId: string;
  saleId?: string;
  purchaseId?: string;
  brand: string;
  model: string;
  imei1: string;
  partyName: string;
  partyPhone?: string;
  refundAmount: number;
  reason: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface ExchangeRecord {
  id: string;
  exchangeNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  oldMobileBrand: string;
  oldMobileModel: string;
  oldMobileImei: string;
  oldMobileCondition: MobileCondition;
  oldMobileValue: number;
  newMobileId: string;
  newMobileBrand: string;
  newMobileModel: string;
  newMobileImei: string;
  newMobilePrice: number;
  differenceAmount: number; // newMobilePrice - oldMobileValue
  paymentReceived: number;
  paymentMethod: PaymentMethod;
  date: string;
  notes?: string;
  createdAt: string;
}

export type TenantSubscriptionStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'CANCELLED';

export interface TenantSubscription {
  plan: 'Starter' | 'Professional' | 'Enterprise';
  status: TenantSubscriptionStatus;
  expiresAt: string;
  autoRenew: boolean;
  maxUsers: number;
  maxInventory: number;
}

export type OtpChannel = 'email' | 'sms';
export type OtpSecurityMode = 'password_plus_otp' | 'otp_only';

export interface OtpSecuritySettings {
  otpEnabled: boolean;
  channel: OtpChannel;
  securityMode: OtpSecurityMode;
  expirationMinutes: number; // e.g. 5
  resendCooldownSeconds: number; // e.g. 60
  maxAttempts: number; // e.g. 5
  emailProviderConfigured?: boolean;
  smsProviderConfigured?: boolean;
}

export type BackupFrequency =
  | 'DISABLED'
  | 'HOURLY'
  | 'EVERY_4_HOURS'
  | 'DAILY'
  | 'WEEKLY';

export interface DatabaseSnapshotEntry {
  id: string;
  timestamp: string;
  sizeBytes: number;
  itemCounts: {
    mobiles: number;
    sales: number;
    customers: number;
    purchases: number;
  };
  trigger: 'AUTOMATIC' | 'MANUAL';
  dataPayload?: string;
}

export interface BackupScheduleSettings {
  enabled: boolean;
  frequency: BackupFrequency;
  lastSnapshotAt?: string;
  nextScheduledSnapshotAt?: string;
  autoDownloadLocalFile: boolean;
  maxRetainedSnapshots: number; // default: 5
}

export interface ShopSettings {
  tenantId?: string;
  shopName: string;
  logoUrl?: string; // Data URL or URL for tenant's shop logo
  tagline: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  email?: string;
  address: string;
  city: string;
  website?: string;
  taxNumber?: string;
  currency: string;
  invoiceTerms: string;
  warrantyPolicy: string;
  openingCashBalance: number;
  founderPhotoUrl?: string; // Master original uploaded photo URL or data URL
  founderPhotoOriginalName?: string;
  founderPhotoUpdatedAt?: string;
  subscription?: TenantSubscription;
  securitySettings?: OtpSecuritySettings;
  backupSettings?: BackupScheduleSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  tenantId?: string; // Customer / tenant / workspace ID for multi-tenant isolation
  name: string;
  username: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  permissions: PermissionKey[];
  avatarUrl?: string; // Profile picture URL or data URL
  designation?: string; // e.g. 'CEO & App Developer', 'General Manager'
  fatherName?: string; // Father's name
  cnic?: string; // Employee CNIC / ID Card number (e.g., 35201-1234567-1)
  cnicFrontUrl?: string; // ID Card front image (data URL or uploaded image)
  cnicBackUrl?: string; // ID Card back image (data URL or uploaded image)
  dob?: string; // Date of birth (YYYY-MM-DD)
  address?: string; // Residential home address
  emergencyContact?: string; // Alternate / Emergency phone number
  joiningDate?: string; // Employment start date
  salary?: number; // Monthly base salary in PKR
  createdAt: string;
  lastLogin?: string;
  isMainAdmin?: boolean; // Root administrator account protected against deletion or role change
}

export type AttendanceStatus = 'Present' | 'Late' | 'Half Day' | 'Absent' | 'On Leave';

export interface StaffAttendance {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  date: string; // YYYY-MM-DD
  checkInTime?: string; // HH:MM:SS
  checkOutTime?: string; // HH:MM:SS
  status: AttendanceStatus;
  notes?: string;
  markedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginHistoryItem {
  id: string;
  userId: string;
  username: string;
  role: UserRole;
  timestamp: string;
  status: 'Success' | 'Failed' | 'Blocked';
  ipAddress?: string;
  deviceInfo?: string;
}

export type ActivityCategory =
  | 'Stock'
  | 'Sales'
  | 'Purchases'
  | 'Customer Payments'
  | 'Supplier Payments'
  | 'Expenses'
  | 'Returns'
  | 'Exchanges'
  | 'Accessories'
  | 'Cash & Bank'
  | 'Settings'
  | 'User Management'
  | 'Auth'
  | 'System';

export type ActivitySeverity = 'info' | 'success' | 'warning' | 'danger';

export interface ActivityLog {
  id: string;
  userName: string;
  role: UserRole;
  action: string;
  category: ActivityCategory;
  details: string;
  timestamp: string;
  entityId?: string;
  entityRef?: string;
  severity?: ActivitySeverity;
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}
