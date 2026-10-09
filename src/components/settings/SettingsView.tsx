import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Shield,
  UserCheck,
  Clock,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { formatDateTime } from '../../utils/formatters';
import { ShopBrandingSection } from './ShopBrandingSection';
import { SecuritySettingsSection } from './SecuritySettingsSection';
import { BackupScheduleSection } from './BackupScheduleSection';

interface SettingsViewProps {
  onNavigate?: (view: any) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigate }) => {
  const {
    resetToSampleData,
    exportDatabaseJson,
    importDatabaseJson,
    users,
    currentUser,
    setCurrentUser,
    hasPermission,
    logs,
  } = useShop();

  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pakmobile_pos_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importDatabaseJson(content);
        setImportStatus(res);
        setTimeout(() => setImportStatus(null), 5000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Shop Settings & System Administration
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure shop identity, receipt header & footer terms, currency symbols, database backups and user roles.
        </p>
      </div>

      {importStatus && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            importStatus.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {importStatus.success ? (
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600" />
          )}
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* Shop Profile & Logo Branding Section */}
      <ShopBrandingSection />

      {/* Multi-Factor OTP & Authentication Security Section */}
      <SecuritySettingsSection />

      {/* Automated Local Database Snapshot & Frequency Schedule Section */}
      <BackupScheduleSection />

      {/* Database Backup & Data Safety Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Shield className="w-4 h-4 text-blue-600" />
          <span>Data Safety, Backup & Disaster Recovery</span>
        </h2>
        <p className="text-xs text-slate-500">
          Your inventory, IMEI registers, invoices and customer accounts are stored safely in local browser storage. Export a complete JSON backup for off-site backup or migration.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download Database JSON Backup</span>
          </button>

          <label className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5">
            <Upload className="w-4 h-4" />
            <span>Restore Backup JSON</span>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 ml-auto flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Demo Pakistani Dataset</span>
          </button>
        </div>
      </div>

      {/* User Management & Roles */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>User Accounts & Configurable Roles</span>
          </h2>
          {onNavigate && hasPermission('view_users') && (
            <button
              type="button"
              onClick={() => onNavigate('users')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Open Full User Management & Permissions Matrix →
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {users.map((u) => (
            <div
              key={u.id}
              onClick={() => setCurrentUser(u)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                currentUser?.id === u.id
                  ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  {u.avatarUrl ? (
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="w-5 h-5 rounded-md object-cover border border-emerald-400 shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-md bg-slate-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                      {u.name[0]}
                    </div>
                  )}
                  <span className="font-semibold text-slate-900 truncate">{u.name}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                  {u.role}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">{u.email}</div>
              <div className="mt-2 text-[10px] text-slate-500">
                {u.role === 'Admin'
                  ? 'Full system access & settings'
                  : u.role === 'Manager'
                  ? 'Stock purchases, sales & ledgers'
                  : u.role === 'Accountant'
                  ? 'Cash book, bills & reconciliation'
                  : 'Point of Sale (POS) sales counter'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Audit & Activity Logs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-sm text-slate-900">System Activity & Audit Logs</h3>
            <span className="text-xs text-slate-400 font-mono">({logs.length} logged events)</span>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('activity-log')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Open Full Audit Log Manager →
            </button>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
          {logs.map((log) => (
            <div key={log.id} className="p-3.5 hover:bg-slate-50 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{log.action}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    {log.userName} ({log.role})
                  </span>
                </div>
                <p className="text-slate-600 mt-1">{log.details}</p>
              </div>
              <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                {formatDateTime(log.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        title="Reset All Shop Records"
        message="This will overwrite current inventory, transactions, and ledgers with the fresh default Pakistani Mobile Shop sample dataset (iPhone 15 Pro Max, S24 Ultra, Star Telecom ledgers, customer khata). Are you sure?"
        confirmLabel="Yes, Reset Database"
        cancelLabel="Cancel"
        isDanger
        onConfirm={() => {
          resetToSampleData();
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
