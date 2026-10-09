import React, { useState, useEffect } from 'react';
import {
  Shield,
  Clock,
  RotateCw,
  HardDrive,
  Download,
  AlertCircle,
  CheckCircle,
  Calendar,
  Layers,
  Trash2,
  RefreshCw,
  Sparkles,
  Info,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import {
  BackupFrequency,
  BackupScheduleSettings,
  DatabaseSnapshotEntry,
} from '../../types';
import {
  FREQUENCY_LABELS,
  calculateNextSnapshotTime,
  loadTenantSnapshots,
  saveTenantSnapshots,
  createSnapshotFromDatabase,
} from '../../services/backupScheduleService';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { formatFileSize } from '../../services/productImageService';

export const BackupScheduleSection: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportDatabaseJson,
    importDatabaseJson,
    currentTenantId,
    addLog,
  } = useShop();

  const currentBackupSettings: BackupScheduleSettings = settings.backupSettings || {
    enabled: true,
    frequency: 'DAILY',
    lastSnapshotAt: undefined,
    nextScheduledSnapshotAt: undefined,
    autoDownloadLocalFile: false,
    maxRetainedSnapshots: 5,
  };

  const [frequency, setFrequency] = useState<BackupFrequency>(currentBackupSettings.frequency);
  const [isEnabled, setIsEnabled] = useState<boolean>(currentBackupSettings.enabled);
  const [maxRetained, setMaxRetained] = useState<number>(currentBackupSettings.maxRetainedSnapshots || 5);
  const [autoDownload, setAutoDownload] = useState<boolean>(Boolean(currentBackupSettings.autoDownloadLocalFile));

  const [snapshots, setSnapshots] = useState<DatabaseSnapshotEntry[]>([]);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<{ success: boolean; message: string } | null>(null);

  // Sync state if settings change
  useEffect(() => {
    if (settings.backupSettings) {
      setFrequency(settings.backupSettings.frequency);
      setIsEnabled(settings.backupSettings.enabled);
      setMaxRetained(settings.backupSettings.maxRetainedSnapshots || 5);
      setAutoDownload(Boolean(settings.backupSettings.autoDownloadLocalFile));
    }
  }, [settings.backupSettings]);

  // Load existing snapshots for this tenant
  useEffect(() => {
    const loaded = loadTenantSnapshots(currentTenantId || 'default');
    setSnapshots(loaded);
  }, [currentTenantId]);

  // Save Settings handler
  const handleSaveSchedule = () => {
    const nextTime = isEnabled && frequency !== 'DISABLED'
      ? calculateNextSnapshotTime(frequency, currentBackupSettings.lastSnapshotAt || new Date().toISOString())
      : undefined;

    const newSettings: BackupScheduleSettings = {
      enabled: isEnabled,
      frequency: isEnabled ? frequency : 'DISABLED',
      lastSnapshotAt: currentBackupSettings.lastSnapshotAt,
      nextScheduledSnapshotAt: nextTime,
      autoDownloadLocalFile: autoDownload,
      maxRetainedSnapshots: maxRetained,
    };

    updateSettings({ backupSettings: newSettings });
    setSaveMessage('Backup schedule configuration saved successfully!');
    addLog(
      'Backup Schedule Updated',
      `Configured database snapshot frequency: ${frequency} (Enabled: ${isEnabled})`,
      'System',
      'info'
    );
    setTimeout(() => setSaveMessage(null), 4000);
  };

  // Immediate Manual Snapshot creation
  const handleCreateSnapshotNow = () => {
    setIsCreatingSnapshot(true);
    setSaveMessage(null);
    setRestoreMessage(null);

    try {
      const dbJson = exportDatabaseJson();
      const newSnap = createSnapshotFromDatabase(dbJson, 'MANUAL');

      const updated = [newSnap, ...snapshots];
      saveTenantSnapshots(currentTenantId || 'default', updated, maxRetained);
      setSnapshots(updated.slice(0, maxRetained));

      const nowIso = new Date().toISOString();
      const nextTime = isEnabled && frequency !== 'DISABLED'
        ? calculateNextSnapshotTime(frequency, nowIso)
        : undefined;

      updateSettings({
        backupSettings: {
          ...currentBackupSettings,
          enabled: isEnabled,
          frequency,
          lastSnapshotAt: nowIso,
          nextScheduledSnapshotAt: nextTime,
        },
      });

      addLog(
        'Database Snapshot Created',
        `Created manual snapshot (${formatFileSize(newSnap.sizeBytes)}) with ${newSnap.itemCounts.mobiles} devices`,
        'System',
        'success'
      );

      setSaveMessage('New local database snapshot created and verified!');
      setTimeout(() => setSaveMessage(null), 4000);
    } catch {
      setRestoreMessage({ success: false, message: 'Failed to create database snapshot.' });
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  // Download snapshot file
  const handleDownloadSnapshot = (snap: DatabaseSnapshotEntry) => {
    if (!snap.dataPayload) return;
    const blob = new Blob([snap.dataPayload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mobiflow_snapshot_${snap.timestamp.split('T')[0]}_${snap.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Restore snapshot
  const handleRestoreSnapshot = (snap: DatabaseSnapshotEntry) => {
    if (!snap.dataPayload) {
      setRestoreMessage({ success: false, message: 'Snapshot payload is empty or unavailable.' });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to restore database snapshot from ${formatDateTime(snap.timestamp)}? This will overwrite the current live dataset with the snapshot data.`
    );
    if (!confirmed) return;

    const res = importDatabaseJson(snap.dataPayload);
    setRestoreMessage(res);
    if (res.success) {
      addLog(
        'Snapshot Restored',
        `Admin restored database snapshot ${snap.id} from ${formatDateTime(snap.timestamp)}`,
        'System',
        'warning'
      );
    }
    setTimeout(() => setRestoreMessage(null), 6000);
  };

  // Delete snapshot
  const handleDeleteSnapshot = (id: string) => {
    const filtered = snapshots.filter((s) => s.id !== id);
    saveTenantSnapshots(currentTenantId || 'default', filtered, maxRetained);
    setSnapshots(filtered);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Automated Local Database Snapshots & Redundancy</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isEnabled && frequency !== 'DISABLED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {isEnabled && frequency !== 'DISABLED' ? FREQUENCY_LABELS[frequency].badge : 'Inactive'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Schedule recurring point-in-time snapshots to prevent data loss from accidental browser clearance.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCreateSnapshotNow}
          disabled={isCreatingSnapshot}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isCreatingSnapshot ? 'animate-spin' : ''}`} />
          <span>{isCreatingSnapshot ? 'Capturing Snapshot...' : 'Take Snapshot Now'}</span>
        </button>
      </div>

      {/* Notifications */}
      {saveMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{saveMessage}</span>
        </div>
      )}

      {restoreMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            restoreMessage.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {restoreMessage.success ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{restoreMessage.message}</span>
        </div>
      )}

      {/* Frequency Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
        {/* Toggle & Frequency Selector */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Snapshot Recurring Frequency</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-700">Enable Automated Schedule</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(['HOURLY', 'EVERY_4_HOURS', 'DAILY', 'WEEKLY'] as BackupFrequency[]).map((freq) => (
              <label
                key={freq}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  frequency === freq && isEnabled
                    ? 'bg-white border-blue-500 shadow-2xs ring-1 ring-blue-500/30'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300'
                } ${!isEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold text-slate-900">{FREQUENCY_LABELS[freq].title}</span>
                  <input
                    type="radio"
                    name="backupFrequency"
                    value={freq}
                    disabled={!isEnabled}
                    checked={frequency === freq}
                    onChange={() => setFrequency(freq)}
                    className="text-blue-600 mt-0.5"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {FREQUENCY_LABELS[freq].desc}
                </p>
              </label>
            ))}
          </div>
        </div>

        {/* Schedule Summary & Retention Controls */}
        <div className="space-y-3 bg-white p-3.5 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Snapshot Redundancy Status
            </span>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Last Snapshot:</span>
                <span className="font-semibold text-slate-900 font-mono text-[11px]">
                  {currentBackupSettings.lastSnapshotAt
                    ? formatRelativeTime(currentBackupSettings.lastSnapshotAt)
                    : 'None yet'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Next Scheduled:</span>
                <span className="font-semibold text-blue-600 font-mono text-[11px]">
                  {isEnabled && currentBackupSettings.nextScheduledSnapshotAt
                    ? formatDateTime(currentBackupSettings.nextScheduledSnapshotAt)
                    : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 block">
                Snapshots to Retain (History Cap)
              </label>
              <select
                value={maxRetained}
                onChange={(e) => setMaxRetained(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
              >
                <option value={3}>Keep latest 3 snapshots</option>
                <option value={5}>Keep latest 5 snapshots (Default)</option>
                <option value={10}>Keep latest 10 snapshots</option>
              </select>
              <span className="text-[10px] text-slate-400 block">
                Older snapshots are pruned automatically to preserve storage.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveSchedule}
            className="w-full py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs mt-2"
          >
            Save Schedule Configuration
          </button>
        </div>
      </div>

      {/* Local Snapshots Vault List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
            <span>Retained Point-In-Time Local Snapshots ({snapshots.length})</span>
          </h3>
          <span className="text-[11px] text-slate-500">
            Protected under workspace ID: <code className="text-slate-700 font-mono">{currentTenantId}</code>
          </span>
        </div>

        {snapshots.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-center space-y-2">
            <Layers className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-xs font-semibold text-slate-700">No Local Snapshots Captured Yet</div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Click &quot;Take Snapshot Now&quot; or enable the scheduled frequency above to begin capturing automated snapshots.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
            {snapshots.map((snap, idx) => (
              <div
                key={snap.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>{formatDateTime(snap.timestamp)}</span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        ({formatRelativeTime(snap.timestamp)})
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          snap.trigger === 'AUTOMATIC'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {snap.trigger}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                      <span>Size: <strong>{formatFileSize(snap.sizeBytes)}</strong></span>
                      <span>·</span>
                      <span>{snap.itemCounts.mobiles} Mobiles</span>
                      <span>·</span>
                      <span>{snap.itemCounts.sales} Sales</span>
                      <span>·</span>
                      <span>{snap.itemCounts.customers} Customers</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleDownloadSnapshot(snap)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200"
                    title="Download snapshot JSON file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Export</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRestoreSnapshot(snap)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition-colors"
                    title="Restore database from this snapshot"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteSnapshot(snap.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete this snapshot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
