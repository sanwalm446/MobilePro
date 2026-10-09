import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Smartphone,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { formatCurrency, formatDate, getWarrantyBadge } from '../../utils/formatters';

interface WarrantyViewProps {
  onTrackImei?: (imei: string) => void;
  initialSearchQuery?: string;
}

export const WarrantyView: React.FC<WarrantyViewProps> = ({ onTrackImei, initialSearchQuery }) => {
  const { mobiles, settings } = useShop();

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Expiring' | 'Expired'>('All');

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const classifiedMobiles = useMemo(() => {
    return mobiles.map((m) => {
      const badge = getWarrantyBadge(m.warrantyExpiryDate);
      let classification: 'Active' | 'Expiring' | 'Expired' = 'Active';
      if (badge.days < 0) {
        classification = 'Expired';
      } else if (badge.days <= 30) {
        classification = 'Expiring';
      }
      return { ...m, badge, classification };
    });
  }, [mobiles]);

  const activeCount = classifiedMobiles.filter((m) => m.classification === 'Active').length;
  const expiringCount = classifiedMobiles.filter((m) => m.classification === 'Expiring').length;
  const expiredCount = classifiedMobiles.filter((m) => m.classification === 'Expired').length;

  const filteredMobiles = useMemo(() => {
    return classifiedMobiles.filter((m) => {
      if (statusFilter !== 'All' && m.classification !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.brand.toLowerCase().includes(q) ||
          m.model.toLowerCase().includes(q) ||
          m.imei1.includes(q) ||
          m.warrantyPeriod.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [classifiedMobiles, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Warranty Tracking & Protection System
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor checking warranties, brand coverage and identify soon-to-expire warranties to prevent customer disputes.
        </p>

        {/* 3 Status Filter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <div
            onClick={() => setStatusFilter(statusFilter === 'Active' ? 'All' : 'Active')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'Active'
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Active Warranties</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">{activeCount}</div>
            <span className="text-[11px] text-slate-500">More than 30 days remaining</span>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'Expiring' ? 'All' : 'Expiring')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'Expiring'
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Expiring Soon</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-700 mt-1">{expiringCount}</div>
            <span className="text-[11px] text-slate-500">Less than 30 days remaining</span>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'Expired' ? 'All' : 'Expired')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'Expired'
                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Expired Coverage</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl font-bold font-mono text-rose-700 mt-1">{expiredCount}</div>
            <span className="text-[11px] text-slate-500">Warranty ended</span>
          </div>
        </div>
      </div>

      {/* Warranty Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search phone, IMEI, warranty type..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="text-xs text-slate-500">
            Showing <strong className="text-slate-800">{filteredMobiles.length}</strong> items
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Mobile & Specs</th>
                <th className="py-3 px-4">IMEI 1</th>
                <th className="py-3 px-4">Warranty Plan</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Inventory Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMobiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No warranty records match filter.
                  </td>
                </tr>
              ) : (
                filteredMobiles.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-sm">
                        {m.brand} {m.model}
                      </div>
                      <div className="text-[11px] text-slate-500">{m.condition} · {m.color}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {m.imei1}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {m.warrantyPeriod}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(m.warrantyExpiryDate)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${m.badge.color}`}>
                        {m.badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-700 text-xs">{m.status}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {onTrackImei && (
                        <button
                          onClick={() => onTrackImei(m.imei1)}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          Track Lifecycle →
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
