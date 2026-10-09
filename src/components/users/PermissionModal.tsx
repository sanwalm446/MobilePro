import React, { useState, useMemo } from 'react';
import {
  Shield,
  Check,
  X,
  Search,
  CheckSquare,
  Square,
  RotateCcw,
  AlertTriangle,
  Lock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
} from 'lucide-react';
import { User, PermissionKey } from '../../types';
import {
  PERMISSION_GROUPS,
  ALL_PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
} from '../../data/permissionTemplates';

interface PermissionModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, permissions: PermissionKey[]) => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  // Working state of permissions
  const [selectedPermissions, setSelectedPermissions] = useState<Set<PermissionKey>>(
    () => new Set(user.permissions || [])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    PERMISSION_GROUPS.forEach((g) => {
      map[g.id] = true;
    });
    return map;
  });

  // Toggle single permission
  const handleToggle = (key: PermissionKey) => {
    if (user.isMainAdmin) return;
    const next = new Set(selectedPermissions);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedPermissions(next);
  };

  // Toggle group
  const handleToggleGroup = (groupKeys: PermissionKey[]) => {
    if (user.isMainAdmin) return;
    const next = new Set(selectedPermissions);
    const allSelected = groupKeys.every((k) => next.has(k));

    if (allSelected) {
      groupKeys.forEach((k) => next.delete(k));
    } else {
      groupKeys.forEach((k) => next.add(k));
    }
    setSelectedPermissions(next);
  };

  // Select all
  const handleSelectAll = () => {
    if (user.isMainAdmin) return;
    setSelectedPermissions(new Set(ALL_PERMISSIONS));
  };

  // Remove all
  const handleRemoveAll = () => {
    if (user.isMainAdmin) return;
    setSelectedPermissions(new Set());
  };

  // Reset to role default
  const handleResetToRole = () => {
    if (user.isMainAdmin) return;
    const defaults = ROLE_DEFAULT_PERMISSIONS[user.role] || [];
    setSelectedPermissions(new Set(defaults));
  };

  // Toggle group collapse
  const toggleCollapse = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Filter groups according to search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return PERMISSION_GROUPS;
    const q = searchQuery.toLowerCase();

    return PERMISSION_GROUPS.map((group) => {
      const filteredPerms = group.permissions.filter(
        (p) =>
          p.label.toLowerCase().includes(q) ||
          p.key.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
      return {
        ...group,
        permissions: filteredPerms,
      };
    }).filter((g) => g.permissions.length > 0 || g.name.toLowerCase().includes(q));
  }, [searchQuery]);

  const handleSave = () => {
    onSave(user.id, Array.from(selectedPermissions));
    onClose();
  };

  const countSelected = selectedPermissions.size;
  const countTotal = ALL_PERMISSIONS.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                Permission Management: {user.name}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300 mt-1 flex-wrap">
              <span>Username: <strong className="text-white font-mono">@{user.username}</strong></span>
              <span>·</span>
              <span>Role: <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-semibold">{user.role}</span></span>
              <span>·</span>
              <span>Status: <span className="font-semibold text-slate-200">{user.status}</span></span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Protection Banner for Main Admin */}
        {user.isMainAdmin && (
          <div className="p-3 bg-purple-50 border-b border-purple-200 text-purple-900 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              <strong>Primary Administrator Protection:</strong> This root account maintains permanent, full access to all system modules and settings.
            </span>
          </div>
        )}

        {/* Control Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search permissions..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={user.isMainAdmin}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg disabled:opacity-50 transition-colors"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleRemoveAll}
              disabled={user.isMainAdmin}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg disabled:opacity-50 transition-colors"
            >
              Remove All
            </button>
            <button
              type="button"
              onClick={handleResetToRole}
              disabled={user.isMainAdmin}
              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to {user.role} Defaults</span>
            </button>

            <div className="text-xs font-mono font-bold text-slate-700 ml-2 px-2 py-1 bg-slate-200/70 rounded-md">
              {countSelected} / {countTotal} Allowed
            </div>
          </div>
        </div>

        {/* Scrollable Groups & Checkboxes */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {filteredGroups.map((group) => {
            const groupKeys = group.permissions.map((p) => p.key);
            const selectedCountInGroup = groupKeys.filter((k) => selectedPermissions.has(k)).length;
            const isAllGroupSelected = groupKeys.length > 0 && selectedCountInGroup === groupKeys.length;
            const isSomeGroupSelected = selectedCountInGroup > 0 && !isAllGroupSelected;
            const isExpanded = expandedGroups[group.id] ?? true;

            return (
              <div
                key={group.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
              >
                {/* Group Header */}
                <div
                  onClick={() => toggleCollapse(group.id)}
                  className="p-3 bg-slate-50/80 hover:bg-slate-100/70 transition-colors flex items-center justify-between cursor-pointer border-b border-slate-100"
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleGroup(groupKeys);
                      }}
                      disabled={user.isMainAdmin}
                      className="p-0.5 text-slate-600 hover:text-emerald-600"
                      title={isAllGroupSelected ? 'Deselect entire group' : 'Select entire group'}
                    >
                      {isAllGroupSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : isSomeGroupSelected ? (
                        <div className="w-4 h-4 rounded border-2 border-emerald-600 flex items-center justify-center">
                          <div className="w-2 h-2 bg-emerald-600 rounded-xs" />
                        </div>
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                        <span>{group.name}</span>
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-700">
                          {selectedCountInGroup} / {groupKeys.length}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        {group.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Group Checkbox Items */}
                {isExpanded && (
                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {group.permissions.map((perm) => {
                      const isChecked = selectedPermissions.has(perm.key);
                      return (
                        <label
                          key={perm.key}
                          className={`p-2.5 rounded-lg border flex items-start gap-2.5 transition-all cursor-pointer select-none ${
                            isChecked
                              ? 'bg-emerald-50/50 border-emerald-200 text-slate-900'
                              : 'bg-slate-50/40 border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggle(perm.key)}
                            disabled={user.isMainAdmin}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 mt-0.5 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs leading-tight">
                                {perm.label}
                              </span>
                              {perm.isSensitive && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded border border-amber-200 shrink-0">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  <span>Sensitive</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                              {perm.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Assigned: <strong className="text-slate-800 font-mono">{countSelected}</strong> active permissions for <strong className="text-slate-800">{user.name}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Permissions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
