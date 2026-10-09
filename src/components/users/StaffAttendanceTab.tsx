import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  FileText,
  Download,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { StaffAttendance, AttendanceStatus, UserRole } from '../../types';
import { formatCurrency } from '../../utils/formatters';

export const StaffAttendanceTab: React.FC = () => {
  const {
    users,
    currentUser,
    attendanceList,
    markAttendance,
    updateAttendance,
    deleteAttendance,
    checkInStaff,
    checkOutStaff,
  } = useShop();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Modal State for Manual Attendance Marking / Editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<StaffAttendance | null>(null);
  const [modalUserId, setModalUserId] = useState('');
  const [modalDate, setModalDate] = useState(todayStr);
  const [modalCheckIn, setModalCheckIn] = useState('09:00 AM');
  const [modalCheckOut, setModalCheckOut] = useState('08:00 PM');
  const [modalStatus, setModalStatus] = useState<AttendanceStatus>('Present');
  const [modalNotes, setModalNotes] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Active staff only (excluding non-operational accounts)
  const activeStaffMembers = useMemo(() => {
    return users.filter((u) => u.status === 'Active');
  }, [users]);

  // Daily Summary statistics for selected date
  const dailyAttendanceRecords = useMemo(() => {
    return attendanceList.filter((a) => a.date === selectedDate);
  }, [attendanceList, selectedDate]);

  const summary = useMemo(() => {
    const totalStaff = activeStaffMembers.length;
    const presentCount = dailyAttendanceRecords.filter(
      (a) => a.status === 'Present' || a.status === 'Late' || a.status === 'Half Day'
    ).length;
    const onTimeCount = dailyAttendanceRecords.filter((a) => a.status === 'Present').length;
    const lateCount = dailyAttendanceRecords.filter((a) => a.status === 'Late').length;
    const halfDayCount = dailyAttendanceRecords.filter((a) => a.status === 'Half Day').length;
    const absentCount = dailyAttendanceRecords.filter((a) => a.status === 'Absent').length;
    const leaveCount = dailyAttendanceRecords.filter((a) => a.status === 'On Leave').length;
    const unrecordedCount = Math.max(0, totalStaff - dailyAttendanceRecords.length);

    return {
      totalStaff,
      presentCount,
      onTimeCount,
      lateCount,
      halfDayCount,
      absentCount,
      leaveCount,
      unrecordedCount,
      attendanceRate: totalStaff > 0 ? Math.round((presentCount / totalStaff) * 100) : 0,
    };
  }, [activeStaffMembers, dailyAttendanceRecords]);

  // Filtered staff list combined with attendance record for the selected date
  const staffAttendanceRows = useMemo(() => {
    return activeStaffMembers
      .map((staff) => {
        const record = dailyAttendanceRecords.find((a) => a.userId === staff.id);
        return {
          staff,
          record,
        };
      })
      .filter(({ staff, record }) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = staff.name.toLowerCase().includes(q);
          const matchUsername = staff.username.toLowerCase().includes(q);
          const matchPhone = staff.phone?.toLowerCase().includes(q) || false;
          const matchCnic = staff.cnic?.toLowerCase().includes(q) || false;
          if (!matchName && !matchUsername && !matchPhone && !matchCnic) return false;
        }

        if (selectedRoleFilter !== 'all' && staff.role !== selectedRoleFilter) {
          return false;
        }

        if (selectedStatusFilter !== 'all') {
          if (selectedStatusFilter === 'Not Marked') {
            if (record) return false;
          } else {
            if (!record || record.status !== selectedStatusFilter) return false;
          }
        }

        return true;
      });
  }, [activeStaffMembers, dailyAttendanceRecords, searchQuery, selectedRoleFilter, selectedStatusFilter]);

  // Open modal for new attendance
  const handleOpenAdd = (staffId?: string) => {
    setEditingAttendance(null);
    setModalUserId(staffId || (activeStaffMembers[0]?.id || ''));
    setModalDate(selectedDate);
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    setModalCheckIn(nowTime);
    setModalCheckOut('');
    setModalStatus('Present');
    setModalNotes('');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (record: StaffAttendance) => {
    setEditingAttendance(record);
    setModalUserId(record.userId);
    setModalDate(record.date);
    setModalCheckIn(record.checkInTime || '');
    setModalCheckOut(record.checkOutTime || '');
    setModalStatus(record.status);
    setModalNotes(record.notes || '');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Handle Save
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const userObj = users.find((u) => u.id === modalUserId);
    if (!userObj) {
      setModalError('Please select a valid staff member.');
      return;
    }

    if (!modalDate) {
      setModalError('Please choose an attendance date.');
      return;
    }

    if (editingAttendance) {
      updateAttendance(editingAttendance.id, {
        userId: userObj.id,
        userName: userObj.name,
        role: userObj.role,
        date: modalDate,
        checkInTime: modalCheckIn.trim() || undefined,
        checkOutTime: modalCheckOut.trim() || undefined,
        status: modalStatus,
        notes: modalNotes.trim(),
      });
    } else {
      markAttendance({
        userId: userObj.id,
        userName: userObj.name,
        role: userObj.role,
        date: modalDate,
        checkInTime: modalCheckIn.trim() || undefined,
        checkOutTime: modalCheckOut.trim() || undefined,
        status: modalStatus,
        notes: modalNotes.trim(),
        markedBy: currentUser?.name || 'Admin',
      });
    }

    setIsModalOpen(false);
  };

  // Date Navigator Helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const getStatusBadge = (status?: AttendanceStatus) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
      case 'Late':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
      case 'Half Day':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold';
      case 'Absent':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      case 'On Leave':
        return 'bg-blue-50 text-blue-700 border-blue-200 font-bold';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200 font-medium';
    }
  };

  return (
    <div className="space-y-5">
      {/* Date Navigation & Controls Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Staff Attendance & Time Clock</span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {summary.attendanceRate}% Present Today
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record daily employee check-ins, departures, punctuality, and leaves.
            </p>
          </div>
        </div>

        {/* Date Selector with Next / Prev controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-white transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
            />
            <button
              type="button"
              onClick={handleNextDay}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-white transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              selectedDate === todayStr
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Mark Attendance</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Daily Attendance Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Total Staff</span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-extrabold font-mono text-slate-900 mt-1">
            {summary.totalStaff}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active roster</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-700 flex items-center justify-between">
            <span>Present / On-Time</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold font-mono text-emerald-600 mt-1">
            {summary.onTimeCount}
          </div>
          <div className="text-[10px] text-emerald-600/80 mt-0.5">Regular check-in</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-700 flex items-center justify-between">
            <span>Late Check-in</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-extrabold font-mono text-amber-600 mt-1">
            {summary.lateCount}
          </div>
          <div className="text-[10px] text-amber-600/80 mt-0.5">Delayed arrival</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-xs">
          <div className="text-[11px] font-semibold text-indigo-700 flex items-center justify-between">
            <span>Half Day</span>
            <AlertCircle className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-extrabold font-mono text-indigo-600 mt-1">
            {summary.halfDayCount}
          </div>
          <div className="text-[10px] text-indigo-600/80 mt-0.5">Half shift</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-700 flex items-center justify-between">
            <span>Absent</span>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-extrabold font-mono text-rose-600 mt-1">
            {summary.absentCount}
          </div>
          <div className="text-[10px] text-rose-600/80 mt-0.5">Unexcused</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-xs">
          <div className="text-[11px] font-semibold text-blue-700 flex items-center justify-between">
            <span>Approved Leave</span>
            <FileText className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-extrabold font-mono text-blue-600 mt-1">
            {summary.leaveCount}
          </div>
          <div className="text-[10px] text-blue-600/80 mt-0.5">Leave granted</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name, @username, phone, or CNIC..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="w-full sm:w-44">
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-800 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Half Day">Half Day</option>
            <option value="Absent">Absent</option>
            <option value="On Leave">On Leave</option>
            <option value="Not Marked">Not Marked Yet</option>
          </select>
        </div>

        <div className="w-full sm:w-44">
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-800 font-medium"
          >
            <option value="all">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Salesman">Salesman</option>
            <option value="Accountant">Accountant</option>
            <option value="Shop Keeper">Shop Keeper</option>
            <option value="Employee">Employee</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">
              Attendance Register for {selectedDate}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({staffAttendanceRows.length} staff members)
            </span>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            {selectedDate === todayStr ? '● Live Today' : `Historical Record`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role & CNIC</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Notes / Reason</th>
                <th className="py-3 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffAttendanceRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No staff records found matching your filter.
                  </td>
                </tr>
              ) : (
                staffAttendanceRows.map(({ staff, record }) => {
                  const isMarked = Boolean(record);
                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Staff Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {staff.avatarUrl ? (
                            <img
                              src={staff.avatarUrl}
                              alt={staff.name}
                              className="w-9 h-9 rounded-xl object-cover border border-emerald-400 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {staff.name[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{staff.name}</span>
                              {staff.isMainAdmin && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold border border-purple-200">
                                  Root Admin
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              @{staff.username} {staff.phone ? `· ${staff.phone}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & CNIC */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{staff.role}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {staff.cnic ? `CNIC: ${staff.cnic}` : 'No CNIC on file'}
                        </div>
                      </td>

                      {/* Attendance Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isMarked ? (
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] border ${getStatusBadge(
                              record?.status
                            )}`}
                          >
                            {record?.status}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] text-slate-400 bg-slate-100 border border-slate-200">
                            Not Marked
                          </span>
                        )}
                      </td>

                      {/* Check-In Time */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-800 whitespace-nowrap">
                        {record?.checkInTime ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {record.checkInTime}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Check-Out Time */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-800 whitespace-nowrap">
                        {record?.checkOutTime ? (
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {record.checkOutTime}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Notes / Reason */}
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {record?.notes || <span className="text-slate-400 italic">No notes</span>}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click Check In for Today */}
                          {!record?.checkInTime && selectedDate === todayStr && (
                            <button
                              type="button"
                              onClick={() => checkInStaff(staff.id)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md font-bold text-[11px] transition-colors cursor-pointer"
                              title="Instant Check-In at Current Time"
                            >
                              Check In
                            </button>
                          )}

                          {/* 1-Click Check Out for Today */}
                          {record?.checkInTime && !record?.checkOutTime && selectedDate === todayStr && (
                            <button
                              type="button"
                              onClick={() => checkOutStaff(staff.id)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md font-bold text-[11px] transition-colors cursor-pointer"
                              title="Instant Check-Out at Current Time"
                            >
                              Check Out
                            </button>
                          )}

                          {/* Edit / Customize */}
                          {record ? (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(record)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Attendance Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenAdd(staff.id)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Mark Attendance Record"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete record */}
                          {record && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete attendance record for ${staff.name} on ${selectedDate}?`)) {
                                  deleteAttendance(record.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Record"
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

      {/* MODAL: MARK / EDIT ATTENDANCE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingAttendance ? 'Edit Attendance Record' : 'Mark Staff Attendance'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5 text-xs">
              {modalError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-medium">
                  {modalError}
                </div>
              )}

              {/* Staff Member Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Staff Member *
                </label>
                <select
                  value={modalUserId}
                  onChange={(e) => setModalUserId(e.target.value)}
                  disabled={Boolean(editingAttendance)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                  required
                >
                  {activeStaffMembers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}) — @{u.username}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Attendance Date *
                </label>
                <input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-bold text-slate-900"
                  required
                />
              </div>

              {/* Attendance Status */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Attendance Status *
                </label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as AttendanceStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-bold text-slate-900"
                  required
                >
                  <option value="Present">Present (Full Day)</option>
                  <option value="Late">Late Arrival</option>
                  <option value="Half Day">Half Day Shift</option>
                  <option value="Absent">Absent (Unexcused)</option>
                  <option value="On Leave">Approved Leave</option>
                </select>
              </div>

              {/* Check-In and Check-Out Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Check-In Time
                  </label>
                  <input
                    type="text"
                    value={modalCheckIn}
                    onChange={(e) => setModalCheckIn(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Check-Out Time
                  </label>
                  <input
                    type="text"
                    value={modalCheckOut}
                    onChange={(e) => setModalCheckOut(e.target.value)}
                    placeholder="08:00 PM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono font-medium"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notes / Delay Reason / Leave Comments
                </label>
                <textarea
                  rows={2}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="e.g. Delayed by 30 mins due to rain, approved by manager"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  {editingAttendance ? 'Update Record' : 'Save Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
