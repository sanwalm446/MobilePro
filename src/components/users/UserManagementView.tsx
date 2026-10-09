import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Search,
  Sliders,
  RotateCcw,
  Edit,
  Trash2,
  Clock,
  Check,
  X,
  UserCheck,
  UserX,
  History,
  Phone,
  Mail,
  ChevronRight,
  Eye,
  MoreVertical,
  Calendar,
  CreditCard,
  Camera,
  Upload,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { User, UserRole, UserStatus, PermissionKey } from '../../types';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { PermissionModal } from './PermissionModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { StaffAttendanceTab } from './StaffAttendanceTab';
import { StaffProfileModal } from './StaffProfileModal';
import { processAndSecureImage } from '../../utils/imageUpload';
import { ROLE_DEFAULT_PERMISSIONS, ALL_PERMISSIONS } from '../../data/permissionTemplates';

interface UserManagementViewProps {
  initialUserIdToView?: string | null;
  initialTab?: 'users' | 'attendance' | 'loginHistory';
  initialSearchQuery?: string;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  initialUserIdToView,
  initialTab,
  initialSearchQuery,
}) => {
  const {
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    approveUser,
    setUserStatus,
    setUserRole,
    setUserPermissions,
    resetUserPassword,
    loginHistory,
    clearLoginHistory,
    attendanceList,
  } = useShop();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'users' | 'attendance' | 'loginHistory'>(
    initialTab || 'users'
  );

  // Modals state
  const [permissionUser, setPermissionUser] = useState<User | null>(null);
  const [profileModalUser, setProfileModalUser] = useState<User | null>(null);

  // Auto-handle navigation from global search
  useEffect(() => {
    if (initialUserIdToView) {
      const found = users.find((u) => u.id === initialUserIdToView);
      if (found) {
        setProfileModalUser(found);
      }
    }
  }, [initialUserIdToView, users]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Add / Edit Form State
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('Salesman');
  const [formStatus, setFormStatus] = useState<UserStatus>('Active');
  const [formPassword, setFormPassword] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formFatherName, setFormFatherName] = useState('');
  const [formCnic, setFormCnic] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formEmergencyContact, setFormEmergencyContact] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [formCnicFrontUrl, setFormCnicFrontUrl] = useState('');
  const [formCnicBackUrl, setFormCnicBackUrl] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Image upload refs
  const addAvatarInputRef = useRef<HTMLInputElement>(null);
  const addCnicFrontInputRef = useRef<HTMLInputElement>(null);
  const addCnicBackInputRef = useRef<HTMLInputElement>(null);
  const editAvatarInputRef = useRef<HTMLInputElement>(null);
  const editCnicFrontInputRef = useRef<HTMLInputElement>(null);
  const editCnicBackInputRef = useRef<HTMLInputElement>(null);

  // Helper for image file uploads
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setFormError(null);
    try {
      const res = await processAndSecureImage(file);
      if (res.success && res.dataUrl) {
        setter(res.dataUrl);
      } else {
        setFormError(res.error || 'Failed to process image');
      }
    } catch (err: any) {
      setFormError(err.message || 'Image processing error');
    } finally {
      setIsProcessingImage(false);
      e.target.value = '';
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = u.name.toLowerCase().includes(q);
        const mUser = u.username.toLowerCase().includes(q);
        const mEmail = u.email.toLowerCase().includes(q);
        const mPhone = u.phone ? u.phone.includes(q) : false;
        const mCnic = u.cnic ? u.cnic.toLowerCase().includes(q) : false;
        const mFather = u.fatherName ? u.fatherName.toLowerCase().includes(q) : false;
        if (!mName && !mUser && !mEmail && !mPhone && !mCnic && !mFather) return false;
      }
      if (selectedRole !== 'all' && u.role !== selectedRole) return false;
      if (selectedStatus !== 'all' && u.status !== selectedStatus) return false;
      return true;
    });
  }, [users, searchQuery, selectedRole, selectedStatus]);

  // Pending users count
  const pendingUsers = useMemo(() => {
    return users.filter((u) => u.status === 'Pending');
  }, [users]);

  // Today attendance present count
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayPresentCount = useMemo(() => {
    return attendanceList.filter(
      (a) => a.date === todayDateStr && (a.status === 'Present' || a.status === 'Late' || a.status === 'Half Day')
    ).length;
  }, [attendanceList, todayDateStr]);

  // Reset form
  const resetForm = () => {
    setFormName('');
    setFormUsername('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('Salesman');
    setFormStatus('Active');
    setFormPassword('');
    setFormDesignation('');
    setFormFatherName('');
    setFormCnic('');
    setFormDob('');
    setFormAddress('');
    setFormEmergencyContact('');
    setFormSalary('');
    setFormAvatarUrl('');
    setFormCnicFrontUrl('');
    setFormCnicBackUrl('');
    setFormError(null);
  };

  // Open Edit User
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormEmail(user.email);
    setFormPhone(user.phone || '');
    setFormRole(user.role);
    setFormStatus(user.status);
    setFormPassword('');
    setFormDesignation(user.designation || '');
    setFormFatherName(user.fatherName || '');
    setFormCnic(user.cnic || '');
    setFormDob(user.dob || '');
    setFormAddress(user.address || '');
    setFormEmergencyContact(user.emergencyContact || '');
    setFormSalary(user.salary ? String(user.salary) : '');
    setFormAvatarUrl(user.avatarUrl || '');
    setFormCnicFrontUrl(user.cnicFrontUrl || '');
    setFormCnicBackUrl(user.cnicBackUrl || '');
    setFormError(null);
  };

  // Submit Add User
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || !formUsername.trim() || !formEmail.trim() || !formPassword) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (formPassword.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    const res = addUser({
      name: formName.trim(),
      username: formUsername.trim().toLowerCase(),
      email: formEmail.trim().toLowerCase(),
      phone: formPhone.trim(),
      passwordHash: formPassword,
      role: formRole,
      status: formStatus,
      permissions: ROLE_DEFAULT_PERMISSIONS[formRole],
      designation: formDesignation.trim() || undefined,
      fatherName: formFatherName.trim() || undefined,
      cnic: formCnic.trim() || undefined,
      dob: formDob || undefined,
      address: formAddress.trim() || undefined,
      emergencyContact: formEmergencyContact.trim() || undefined,
      salary: formSalary ? Number(formSalary) : undefined,
      avatarUrl: formAvatarUrl || undefined,
      cnicFrontUrl: formCnicFrontUrl || undefined,
      cnicBackUrl: formCnicBackUrl || undefined,
    });

    if (res.success) {
      setIsAddModalOpen(false);
      resetForm();
    } else {
      setFormError(res.message);
    }
  };

  // Submit Edit User
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError(null);

    const res = updateUser(editingUser.id, {
      name: formName.trim(),
      username: formUsername.trim().toLowerCase(),
      email: formEmail.trim().toLowerCase(),
      phone: formPhone.trim(),
      role: formRole,
      status: formStatus,
      designation: formDesignation.trim() || undefined,
      fatherName: formFatherName.trim() || undefined,
      cnic: formCnic.trim() || undefined,
      dob: formDob || undefined,
      address: formAddress.trim() || undefined,
      emergencyContact: formEmergencyContact.trim() || undefined,
      salary: formSalary ? Number(formSalary) : undefined,
      avatarUrl: formAvatarUrl || undefined,
      cnicFrontUrl: formCnicFrontUrl || undefined,
      cnicBackUrl: formCnicBackUrl || undefined,
    });

    if (res.success) {
      setEditingUser(null);
      resetForm();
    } else {
      setFormError(res.message);
    }
  };

  // Submit Reset Password
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    resetUserPassword(resetPasswordUser.id, newPassword);
    setResetPasswordUser(null);
    setNewPassword('');
  };

  // Submit Delete User
  const handleConfirmDelete = () => {
    if (!deletingUser) return;
    const res = deleteUser(deletingUser.id);
    if (!res.success) {
      alert(res.message);
    }
    setDeletingUser(null);
  };

  // Role Badge Styling Helper
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'SHOP_OWNER':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      case 'Admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Shop Keeper':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Salesman':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Accountant':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Employee':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Status Badge Styling Helper
  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'Suspended':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Deactivated':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Main Controls */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>User & Role-Based Access Control</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-medium">
                {users.length} Staff Accounts
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage shop staff credentials, assign roles, customize granular feature permissions, and approve registrations.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'users'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Staff Accounts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'attendance'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Staff Attendance</span>
              {todayPresentCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-100 text-emerald-700 font-bold">
                  {todayPresentCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('loginHistory')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'loginHistory'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Login History ({loginHistory.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add New Staff</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Total Staff</span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{users.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Registered system accounts</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Active Users</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {users.filter((u) => u.status === 'Active').length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Operational staff with access</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Pending Approvals</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1">
            {pendingUsers.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Awaiting Administrator review</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Suspended / Blocked</span>
            <UserX className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-600 mt-1">
            {users.filter((u) => u.status === 'Suspended' || u.status === 'Deactivated').length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Locked accounts</div>
        </div>
      </div>

      {/* Pending Approvals Notice Banner */}
      {pendingUsers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>
              {pendingUsers.length} New Registration(s) Awaiting Your Approval
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {pendingUsers.map((pending) => (
              <div
                key={pending.id}
                className="bg-white p-3 rounded-lg border border-amber-200/80 shadow-2xs flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-slate-900">{pending.name}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="font-mono">@{pending.username}</span>
                    <span>·</span>
                    <span>{pending.phone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => approveUser(pending.id, 'Salesman')}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] rounded-md transition-colors"
                  >
                    Approve (Salesman)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPermissionUser(pending)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-md transition-colors"
                  >
                    Customize
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: USERS LIST */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, @username, email, or phone..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="w-full sm:w-44">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-700"
              >
                <option value="all">All Roles</option>
                <option value="SHOP_OWNER">Shop Owner</option>
                <option value="Admin">Shop Admin / Admin</option>
                <option value="Shop Keeper">Shop Keeper (POS & Sales)</option>
                <option value="Manager">Manager</option>
                <option value="Salesman">Salesman</option>
                <option value="Accountant">Accountant</option>
                <option value="Employee">Staff / Employee</option>
              </select>
            </div>

            <div className="w-full sm:w-40">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Suspended">Suspended</option>
                <option value="Deactivated">Deactivated</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Permissions</th>
                    <th className="py-3 px-4">Last Login</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No users found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const permCount = u.permissions?.length || 0;
                      const isCurrentUser = currentUser?.id === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* User Column */}
                          <td className="py-3 px-4">
                            <div 
                              onClick={() => setProfileModalUser(u)}
                              className="flex items-center gap-3 cursor-pointer group"
                              title="Click to view full staff dossier, ID card & photos"
                            >
                              {u.avatarUrl ? (
                                <img
                                  src={u.avatarUrl}
                                  alt={u.name}
                                  className="w-9 h-9 rounded-xl object-cover border-2 border-emerald-400 shadow-2xs shrink-0 group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-slate-800 text-white font-bold flex items-center justify-center text-xs shrink-0 group-hover:bg-emerald-700 transition-colors shadow-2xs">
                                  {u.name[0]}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 flex items-center gap-1.5 group-hover:text-emerald-700 transition-colors">
                                  <span>{u.name}</span>
                                  {u.isMainAdmin && (
                                    <span
                                      className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded font-bold bg-purple-100 text-purple-800 border border-purple-200"
                                      title="Root Administrator account"
                                    >
                                      <Lock className="w-2.5 h-2.5" />
                                      <span>Root Admin</span>
                                    </span>
                                  )}
                                  {isCurrentUser && (
                                    <span className="text-[9px] px-1 rounded bg-emerald-100 text-emerald-800 font-bold">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                                  <span>@{u.username}</span>
                                  <span>·</span>
                                  <span>{u.phone || u.email}</span>
                                </div>
                                {/* Staff personal metadata pills */}
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  {u.designation && (
                                    <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium border border-emerald-200/60">
                                      {u.designation}
                                    </span>
                                  )}
                                  {u.fatherName && (
                                    <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                                      S/O {u.fatherName}
                                    </span>
                                  )}
                                  {u.cnic && (
                                    <span className="text-[9px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-mono font-medium border border-blue-200/60">
                                      CNIC: {u.cnic}
                                    </span>
                                  )}
                                  {(u.cnicFrontUrl || u.cnicBackUrl) && (
                                    <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                                      <CreditCard className="w-2.5 h-2.5" />
                                      <span>ID Card</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role Column */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadge(
                                u.role
                              )}`}
                            >
                              {u.role}
                            </span>
                          </td>

                          {/* Status Column */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                                u.status
                              )}`}
                            >
                              {u.status}
                            </span>
                          </td>

                          {/* Permissions Column */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setPermissionUser(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors text-[11px] font-semibold text-slate-700"
                            >
                              <Sliders className="w-3 h-3 text-slate-400" />
                              <span>{u.isMainAdmin ? 'All (65)' : `${permCount} Allowed`}</span>
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            </button>
                          </td>

                          {/* Last Login Column */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {u.lastLogin ? (
                              <div>
                                <div className="font-mono text-slate-700 text-[11px]">
                                  {formatDateTime(u.lastLogin)}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {formatRelativeTime(u.lastLogin)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Never logged in</span>
                            )}
                          </td>

                          {/* Actions Column */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {/* Open Staff Dossier & CNIC ID Card Modal */}
                              <button
                                type="button"
                                onClick={() => setProfileModalUser(u)}
                                className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="View & Edit ID Card, Photos & Dossier"
                              >
                                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                              </button>

                              {/* Edit Profile */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(u)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit Profile & Role"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Reset Password */}
                              <button
                                type="button"
                                onClick={() => {
                                  setResetPasswordUser(u);
                                  setNewPassword('');
                                }}
                                className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Reset User Password"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              {/* Activate / Deactivate Toggle */}
                              {!u.isMainAdmin && (
                                <>
                                  {u.status === 'Active' ? (
                                    <button
                                      type="button"
                                      onClick={() => setUserStatus(u.id, 'Deactivated')}
                                      className="p-1.5 text-slate-400 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                                      title="Deactivate Account"
                                    >
                                      <UserX className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setUserStatus(u.id, 'Active')}
                                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                      title="Activate Account"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}

                              {/* Delete User */}
                              {!u.isMainAdmin && !isCurrentUser && (
                                <button
                                  type="button"
                                  onClick={() => setDeletingUser(u)}
                                  className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Delete Account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF ATTENDANCE TRACKER */}
      {activeTab === 'attendance' && (
        <StaffAttendanceTab />
      )}

      {/* TAB 3: LOGIN HISTORY */}
      {activeTab === 'loginHistory' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">User Login & Session History</h3>
              <p className="text-xs text-slate-500">Chronological authentication trail across all staff accounts</p>
            </div>
            {currentUser?.role === 'Admin' && (
              <button
                type="button"
                onClick={clearLoginHistory}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                Clear History
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Attempt Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {loginHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      No login records recorded yet.
                    </td>
                  </tr>
                ) : (
                  loginHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                        {formatDateTime(item.timestamp)} ({formatRelativeTime(item.timestamp)})
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 font-sans">
                        @{item.username}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRoleBadge(item.role)}`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'Success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'Blocked'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW STAFF MEMBER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">Add New Staff Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs flex items-center gap-2 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Instant Login Enabled:</strong> User can log in immediately with the username and password provided.
                </span>
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-medium shrink-0">
                  {formError}
                </div>
              )}

              {/* Photo Upload Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
                <div className="relative shrink-0">
                  {formAvatarUrl ? (
                    <img
                      src={formAvatarUrl}
                      alt="Staff"
                      className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500 shadow-xs"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-800 text-white font-bold flex items-center justify-center text-xl shadow-xs">
                      {formName ? formName[0].toUpperCase() : <Camera className="w-6 h-6 text-slate-400" />}
                    </div>
                  )}
                  {formAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => setFormAvatarUrl('')}
                      className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-xs cursor-pointer"
                      title="Remove photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="font-semibold text-slate-900">Staff Member Photo</div>
                  <p className="text-[11px] text-slate-500">
                    Upload employee profile picture (JPG, PNG, WebP up to 5MB).
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => addAvatarInputRef.current?.click()}
                      disabled={isProcessingImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{formAvatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                    </button>
                    {isProcessingImage && <span className="text-[11px] text-slate-500">Processing...</span>}
                    <input
                      ref={addAvatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleImageUpload(e, setFormAvatarUrl)}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Basic Account Info */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Account Credentials & Role
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Asim Raza"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Username *</label>
                    <input
                      type="text"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="asim"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mobile Phone Number</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="0300-1122334"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="asim@pakmobile.pk"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-800"
                    >
                      <option value="Admin">Shop Admin / Admin</option>
                      <option value="Shop Keeper">Shop Keeper (POS & Sales)</option>
                      <option value="Manager">Manager</option>
                      <option value="Salesman">Salesman</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Employee">Staff / Employee</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Account Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as UserStatus)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-800"
                    >
                      <option value="Active">Active (Instant Access)</option>
                      <option value="Pending">Pending</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Deactivated">Deactivated</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Designation / Title</label>
                    <input
                      type="text"
                      value={formDesignation}
                      onChange={(e) => setFormDesignation(e.target.value)}
                      placeholder="Senior Sales Executive"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Login Password *</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Personal Dossier & CNIC Details */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Employee Dossier & CNIC Details</span>
                  <span className="text-[10px] text-emerald-600 font-medium">Pakistani ID & Records</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Father's Name (والد کا نام)</label>
                    <input
                      type="text"
                      value={formFatherName}
                      onChange={(e) => setFormFatherName(e.target.value)}
                      placeholder="e.g. Muhammad Raza"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">CNIC / ID Card Number</label>
                    <input
                      type="text"
                      value={formCnic}
                      onChange={(e) => setFormCnic(e.target.value)}
                      placeholder="35201-1234567-1"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date of Birth (DOB)</label>
                    <input
                      type="date"
                      value={formDob}
                      onChange={(e) => setFormDob(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Emergency Mobile</label>
                    <input
                      type="text"
                      value={formEmergencyContact}
                      onChange={(e) => setFormEmergencyContact(e.target.value)}
                      placeholder="0321-9876543"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Monthly Salary (PKR)</label>
                    <input
                      type="number"
                      value={formSalary}
                      onChange={(e) => setFormSalary(e.target.value)}
                      placeholder="35000"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Residential Address (رہائشی پتہ)</label>
                  <textarea
                    rows={2}
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="House #, Street, Mohallah / Sector, City"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>

                {/* CNIC Front & Back Card Uploads */}
                <div className="space-y-2 pt-1">
                  <label className="block font-semibold text-slate-700">
                    CNIC / Employee ID Card Images Upload
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Front Side */}
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 flex flex-col items-center justify-center text-center">
                      <div className="text-[11px] font-bold text-slate-700 mb-2">ID Card Front Side</div>
                      {formCnicFrontUrl ? (
                        <div className="relative group w-full h-24 rounded-lg overflow-hidden border border-slate-300">
                          <img
                            src={formCnicFrontUrl}
                            alt="CNIC Front"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setFormCnicFrontUrl('')}
                            className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md hover:bg-rose-700 cursor-pointer shadow-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addCnicFrontInputRef.current?.click()}
                          disabled={isProcessingImage}
                          className="w-full h-24 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer bg-white"
                        >
                          <Upload className="w-5 h-5 mb-1" />
                          <span className="text-[11px] font-medium">Upload Front Image</span>
                        </button>
                      )}
                      <input
                        ref={addCnicFrontInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleImageUpload(e, setFormCnicFrontUrl)}
                        className="hidden"
                      />
                    </div>

                    {/* Back Side */}
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 flex flex-col items-center justify-center text-center">
                      <div className="text-[11px] font-bold text-slate-700 mb-2">ID Card Back Side</div>
                      {formCnicBackUrl ? (
                        <div className="relative group w-full h-24 rounded-lg overflow-hidden border border-slate-300">
                          <img
                            src={formCnicBackUrl}
                            alt="CNIC Back"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setFormCnicBackUrl('')}
                            className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md hover:bg-rose-700 cursor-pointer shadow-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addCnicBackInputRef.current?.click()}
                          disabled={isProcessingImage}
                          className="w-full h-24 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer bg-white"
                        >
                          <Upload className="w-5 h-5 mb-1" />
                          <span className="text-[11px] font-medium">Upload Back Image</span>
                        </button>
                      )}
                      <input
                        ref={addCnicBackInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleImageUpload(e, setFormCnicBackUrl)}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER DETAILS */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">Edit Staff: {editingUser.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = editingUser;
                    setEditingUser(null);
                    setProfileModalUser(target);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Open Full Dossier / ID Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-medium shrink-0">
                  {formError}
                </div>
              )}

              {/* Photo Upload Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
                <div className="relative shrink-0">
                  {formAvatarUrl ? (
                    <img
                      src={formAvatarUrl}
                      alt={formName}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500 shadow-xs"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-800 text-white font-bold flex items-center justify-center text-xl shadow-xs">
                      {formName ? formName[0].toUpperCase() : 'S'}
                    </div>
                  )}
                  {formAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => setFormAvatarUrl('')}
                      className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-xs cursor-pointer"
                      title="Remove photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="font-semibold text-slate-900">Employee Photo</div>
                  <p className="text-[11px] text-slate-500">
                    Update profile picture (JPG, PNG, WebP up to 5MB).
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => editAvatarInputRef.current?.click()}
                      disabled={isProcessingImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{formAvatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                    </button>
                    {isProcessingImage && <span className="text-[11px] text-slate-500">Processing...</span>}
                    <input
                      ref={editAvatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleImageUpload(e, setFormAvatarUrl)}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Username</label>
                    <input
                      type="text"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Role</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as UserRole)}
                      disabled={editingUser.isMainAdmin}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-800 disabled:opacity-50"
                    >
                      <option value="SHOP_OWNER">Shop Owner</option>
                      <option value="Admin">Shop Admin / Admin</option>
                      <option value="Shop Keeper">Shop Keeper (POS & Sales)</option>
                      <option value="Manager">Manager</option>
                      <option value="Salesman">Salesman</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Employee">Staff / Employee</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as UserStatus)}
                      disabled={editingUser.isMainAdmin}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-800 disabled:opacity-50"
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Deactivated">Deactivated</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={formDesignation}
                      onChange={(e) => setFormDesignation(e.target.value)}
                      placeholder="e.g. Sales Manager"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Dossier */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Dossier, CNIC & Personal Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Father's Name (والد کا نام)</label>
                    <input
                      type="text"
                      value={formFatherName}
                      onChange={(e) => setFormFatherName(e.target.value)}
                      placeholder="e.g. Muhammad Raza"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">CNIC / ID Card Number</label>
                    <input
                      type="text"
                      value={formCnic}
                      onChange={(e) => setFormCnic(e.target.value)}
                      placeholder="35201-1234567-1"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formDob}
                      onChange={(e) => setFormDob(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Emergency Phone</label>
                    <input
                      type="text"
                      value={formEmergencyContact}
                      onChange={(e) => setFormEmergencyContact(e.target.value)}
                      placeholder="0321-9876543"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Salary (PKR)</label>
                    <input
                      type="number"
                      value={formSalary}
                      onChange={(e) => setFormSalary(e.target.value)}
                      placeholder="35000"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
                  <textarea
                    rows={2}
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="House, Street, Mohallah / City"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>

                {/* CNIC Card Front/Back */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 flex flex-col items-center justify-center text-center">
                    <div className="text-[11px] font-bold text-slate-700 mb-2">ID Card Front</div>
                    {formCnicFrontUrl ? (
                      <div className="relative group w-full h-24 rounded-lg overflow-hidden border border-slate-300">
                        <img
                          src={formCnicFrontUrl}
                          alt="CNIC Front"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormCnicFrontUrl('')}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md hover:bg-rose-700 cursor-pointer shadow-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => editCnicFrontInputRef.current?.click()}
                        disabled={isProcessingImage}
                        className="w-full h-24 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer bg-white"
                      >
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-[11px] font-medium">Upload Front Image</span>
                      </button>
                    )}
                    <input
                      ref={editCnicFrontInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleImageUpload(e, setFormCnicFrontUrl)}
                      className="hidden"
                    />
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 flex flex-col items-center justify-center text-center">
                    <div className="text-[11px] font-bold text-slate-700 mb-2">ID Card Back</div>
                    {formCnicBackUrl ? (
                      <div className="relative group w-full h-24 rounded-lg overflow-hidden border border-slate-300">
                        <img
                          src={formCnicBackUrl}
                          alt="CNIC Back"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormCnicBackUrl('')}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md hover:bg-rose-700 cursor-pointer shadow-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => editCnicBackInputRef.current?.click()}
                        disabled={isProcessingImage}
                        className="w-full h-24 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer bg-white"
                      >
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-[11px] font-medium">Upload Back Image</span>
                      </button>
                    )}
                    <input
                      ref={editCnicBackInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleImageUpload(e, setFormCnicBackUrl)}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESET PASSWORD */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Reset Password: {resetPasswordUser.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResetPasswordUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3 text-xs">
              <p className="text-slate-600">
                Enter a new password for <strong>@{resetPasswordUser.username}</strong>:
              </p>

              <div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 chars)"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:text-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  Apply New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DEDICATED PERMISSION ASSIGNMENT SCREEN */}
      {permissionUser && (
        <PermissionModal
          user={permissionUser}
          isOpen={Boolean(permissionUser)}
          onClose={() => setPermissionUser(null)}
          onSave={setUserPermissions}
        />
      )}

      {/* CONFIRMATION MODAL: DELETE USER */}
      <ConfirmationModal
        isOpen={Boolean(deletingUser)}
        title="Delete Staff Account"
        message={`Are you sure you want to permanently delete ${deletingUser?.name} (@${deletingUser?.username})? This action cannot be undone.`}
        confirmLabel="Delete User"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingUser(null)}
      />

      {/* MODAL 5: STAFF PROFILE & CNIC ID CARD DOSSIER */}
      {profileModalUser && (
        <StaffProfileModal
          user={profileModalUser}
          isOpen={Boolean(profileModalUser)}
          onClose={() => setProfileModalUser(null)}
          onSave={(updates) => {
            updateUser(profileModalUser.id, updates);
            setProfileModalUser((prev) => (prev ? { ...prev, ...updates } : null));
          }}
        />
      )}
    </div>
  );
};
