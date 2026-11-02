'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Shield,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
  RefreshCw,
  Video,
  Database,
  History,
  FileSpreadsheet,
  Search,
  Check,
  Crown,
  Trash2,
  Sliders,
  Filter,
  BarChart3,
  Flame,
  ArrowRightLeft,
} from 'lucide-react';
import { ROLE_PRESETS, RoleCategoryKey } from '@/lib/auth/admin-constants';

interface AccessRequest {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  role_type?: 'co_admin' | 'panel_admin';
  assigned_panel?: 1 | 2 | 3 | 4 | null;
  permissions: {
    requested_role?: string;
    can_moderate_videos?: boolean;
    can_manage_contest?: boolean;
    can_view_audit_logs?: boolean;
    can_export_data?: boolean;
    can_view_analytics?: boolean;
    can_manage_admins?: boolean;
  };
  is_phone_verified: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at?: string;
}

const PERMISSION_METADATA = [
  {
    key: 'can_moderate_videos',
    label: 'Video Moderation',
    desc: 'Approve, reject, unapprove, or flag audition videos and performances',
    icon: Video,
  },
  {
    key: 'can_manage_contest',
    label: 'Contest Schedule & Voting Controls',
    desc: 'Start/stop voting, modify live countdown dates & times',
    icon: Flame,
  },
  {
    key: 'can_view_audit_logs',
    label: 'Audit Trail Ledger',
    desc: 'Inspect voter IP logs, tamper detection, and security events',
    icon: History,
  },
  {
    key: 'can_export_data',
    label: 'CSV Data Export',
    desc: 'Download voter rolls, tally results, and artist rosters',
    icon: FileSpreadsheet,
  },
  {
    key: 'can_view_analytics',
    label: 'Executive Analytics',
    desc: 'View live turnout counters, leaderboard, and district statistics',
    icon: BarChart3,
  },
  {
    key: 'can_manage_admins',
    label: 'Staff Admin Governance',
    desc: 'Approve, shift categories, and supervise the 4 Panel Admins',
    icon: Crown,
  },
] as const;

const PANEL_DEFINITIONS = [
  {
    id: 1,
    name: 'Admin 1: Panel 1',
    categories: 'Cat 1 & 2: Music Video (Nagpuri) & Lead Dance',
    roleKey: 'panel_admin_1',
  },
  {
    id: 2,
    name: 'Admin 2: Panel 2',
    categories: 'Cat 3 & 4: Leading Actor & Lead Singer',
    roleKey: 'panel_admin_2',
  },
  {
    id: 3,
    name: 'Admin 3: Panel 3',
    categories: 'Cat 5 & 6: Cinematographer & Director',
    roleKey: 'panel_admin_3',
  },
  {
    id: 4,
    name: 'Admin 4: Panel 4',
    categories: 'Cat 7 & 8: Choreographer & Music Director',
    roleKey: 'panel_admin_4',
  },
] as const;

export default function AdminAccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Status Filter & Search
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'revoked' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editable state per request ID
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [selectedRoleType, setSelectedRoleType] = useState<Record<string, 'co_admin' | 'panel_admin'>>({});
  const [selectedPanel, setSelectedPanel] = useState<Record<string, 1 | 2 | 3 | 4 | null>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/requests');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch access requests.');
      }
      const list: AccessRequest[] = data.requests || [];
      setRequests(list);

      // Initialize state mappings
      const permsMap: Record<string, Record<string, boolean>> = {};
      const roleMap: Record<string, 'co_admin' | 'panel_admin'> = {};
      const panelMap: Record<string, 1 | 2 | 3 | 4 | null> = {};

      list.forEach((req) => {
        const isCoAdmin = req.role_type === 'co_admin' || req.permissions?.requested_role === 'main_admin';
        roleMap[req.id] = isCoAdmin ? 'co_admin' : 'panel_admin';
        panelMap[req.id] = (req.assigned_panel as 1 | 2 | 3 | 4 | null) ?? (isCoAdmin ? null : 1);

        permsMap[req.id] = {
          can_moderate_videos: Boolean(req.permissions?.can_moderate_videos ?? true),
          can_manage_contest: isCoAdmin ? true : Boolean(req.permissions?.can_manage_contest),
          can_view_audit_logs: isCoAdmin ? true : Boolean(req.permissions?.can_view_audit_logs),
          can_export_data: isCoAdmin ? true : Boolean(req.permissions?.can_export_data),
          can_view_analytics: Boolean(req.permissions?.can_view_analytics ?? true),
          can_manage_admins: isCoAdmin ? true : Boolean(req.permissions?.can_manage_admins),
        };
      });

      setSelectedPermissions(permsMap);
      setSelectedRoleType(roleMap);
      setSelectedPanel(panelMap);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // 8-second auto-refresh polling so incoming access requests appear immediately
    const timer = setInterval(() => {
      fetchRequests();
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // Toggle single permission checkbox
  const handleTogglePerm = (reqId: string, permKey: string) => {
    setSelectedPermissions((prev) => ({
      ...prev,
      [reqId]: {
        ...prev[reqId],
        [permKey]: !prev[reqId]?.[permKey],
      },
    }));
  };

  // Direct Panel / Role Shift Handler
  const handleShiftRole = (
    reqId: string,
    target: 'second_main_admin' | 'panel_1' | 'panel_2' | 'panel_3' | 'panel_4'
  ) => {
    if (target === 'second_main_admin') {
      setSelectedRoleType((prev) => ({ ...prev, [reqId]: 'co_admin' }));
      setSelectedPanel((prev) => ({ ...prev, [reqId]: null }));
      setSelectedPermissions((prev) => ({
        ...prev,
        [reqId]: {
          can_moderate_videos: true,
          can_manage_contest: true,
          can_view_audit_logs: true,
          can_export_data: true,
          can_view_analytics: true,
          can_manage_admins: true,
        },
      }));
    } else {
      const panelNum = parseInt(target.replace('panel_', ''), 10) as 1 | 2 | 3 | 4;
      setSelectedRoleType((prev) => ({ ...prev, [reqId]: 'panel_admin' }));
      setSelectedPanel((prev) => ({ ...prev, [reqId]: panelNum }));
      setSelectedPermissions((prev) => ({
        ...prev,
        [reqId]: {
          can_moderate_videos: true,
          can_manage_contest: false,
          can_view_audit_logs: false,
          can_export_data: false,
          can_view_analytics: true,
          can_manage_admins: false,
        },
      }));
    }
  };

  // Update Status & Shift Privileges
  const handleUpdateStatus = async (
    reqId: string,
    newStatus: 'approved' | 'rejected' | 'revoked',
    actionLabel?: string
  ) => {
    setUpdatingId(reqId);
    setActionSuccess(null);
    setError(null);

    try {
      const perms = selectedPermissions[reqId] || {};
      const role_type = selectedRoleType[reqId] || 'panel_admin';
      const assigned_panel = role_type === 'co_admin' ? null : selectedPanel[reqId] || 1;

      const res = await fetch('/api/admin/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reqId,
          status: newStatus,
          role_type,
          assigned_panel,
          permissions: perms,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update request privileges.');
      }

      setActionSuccess(
        actionLabel ||
          `Admin access updated to ${newStatus.toUpperCase()} (Role: ${role_type === 'co_admin' ? 'Second Main Admin' : `Panel ${assigned_panel}`}).`
      );
      await fetchRequests();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete Request
  const handleDeleteRequest = async (reqId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete the admin request from ${name}?`)) {
      return;
    }

    setUpdatingId(reqId);
    setActionSuccess(null);
    setError(null);

    try {
      const res = await fetch(`/api/admin/requests?id=${reqId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete request.');
      }

      setActionSuccess(`Access request for ${name} permanently deleted.`);
      await fetchRequests();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered list
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (activeTab !== 'all' && req.status !== activeTab) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = req.full_name?.toLowerCase().includes(q);
        const matchPhone = req.phone?.includes(q);
        const matchEmail = req.email?.toLowerCase().includes(q);
        const matchReason = req.reason?.toLowerCase().includes(q);
        return matchName || matchPhone || matchEmail || matchReason;
      }
      return true;
    });
  }, [requests, activeTab, searchQuery]);

  // Statistics counters
  const counts = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      approved: requests.filter((r) => r.status === 'approved').length,
      revoked: requests.filter((r) => r.status === 'revoked').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
    };
  }, [requests]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#0f2d59] text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Governance &amp; Staff Shift Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f2d59]">
            Sub-Admin Access Governance &amp; Role Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Supervise staff admins, approve applications, and freely switch Admin 1, 2, 3, or 4 between evaluation category panels or elevate to Second Main Admin in real-time.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Requesters</span>
        </button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#0f2d59] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Requesters ({counts.all})
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Pending Review ({counts.pending})</span>
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Active / Approved ({counts.approved})</span>
          </button>

          <button
            onClick={() => setActiveTab('revoked')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'revoked'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-rose-800 bg-rose-50 hover:bg-rose-100'
            }`}
          >
            <UserX className="w-3 h-3" />
            <span>Revoked ({counts.revoked})</span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'rejected'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Rejected ({counts.rejected})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, email..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Requests List */}
      {loading && requests.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-blue-700 animate-spin mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">Loading access requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <UserCheck className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Requesters Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'No requests match your current search query. Try clearing the search box.'
              : 'There are currently no staff admin access requests in this category.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredRequests.map((req) => {
            const isUpdating = updatingId === req.id;
            const perms = selectedPermissions[req.id] || {};
            const currentRole = selectedRoleType[req.id] || 'panel_admin';
            const currentPanel = selectedPanel[req.id] ?? 1;

            return (
              <div
                key={req.id}
                className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-sm transition-all ${
                  req.status === 'pending'
                    ? 'border-amber-400 ring-4 ring-amber-100/60'
                    : req.status === 'approved'
                    ? 'border-emerald-300 ring-2 ring-emerald-50'
                    : req.status === 'revoked'
                    ? 'border-rose-300 bg-rose-50/20'
                    : 'border-slate-200 opacity-80'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left Info Column */}
                  <div className="space-y-4 flex-1">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                        {req.full_name}
                      </h3>

                      {/* Status badge */}
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          req.status === 'pending'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : req.status === 'revoked'
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {req.status === 'approved' ? 'Active / Approved' : req.status}
                      </span>

                      {/* Verified phone badge */}
                      {req.is_phone_verified && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          Phone Verified (OTP)
                        </span>
                      )}

                      {/* Current Assigned Role Badge */}
                      {currentRole === 'co_admin' ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-400 flex items-center gap-1 shadow-xs">
                          <Crown className="w-3 h-3 text-amber-600" />
                          👑 SECOND MAIN ADMIN (ALL ACCESS)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-950 border border-blue-300 flex items-center gap-1 shadow-xs">
                          <Video className="w-3 h-3 text-blue-700" />
                          🎬 PANEL {currentPanel} ADMIN
                        </span>
                      )}
                    </div>

                    {/* Metadata line */}
                    <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-semibold text-slate-900">+91 {req.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Applied: {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      {req.reviewed_by && (
                        <div className="text-slate-500">
                          Reviewed by: <strong className="text-slate-700">{req.reviewed_by}</strong>
                        </div>
                      )}
                    </div>

                    {/* Purpose Statement */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      <span className="font-bold text-slate-900">Application Reason: </span>
                      {req.reason}
                    </div>

                    {/* ──────────────── CATEGORY & ROLE SHIFT CONTROLS ──────────────── */}
                    <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-extrabold text-[#0f2d59] uppercase tracking-wider flex items-center gap-1.5">
                          <ArrowRightLeft className="w-4 h-4 text-blue-700" />
                          <span>Panel Category Shift &amp; Role Assignment:</span>
                        </p>
                        <span className="text-[11px] text-blue-800 font-semibold">
                          Click to instantly switch admin panel:
                        </span>
                      </div>

                      {/* 5 Quick Shift Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
                        {/* Second Main Admin Shift */}
                        <button
                          type="button"
                          onClick={() => handleShiftRole(req.id, 'second_main_admin')}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            currentRole === 'co_admin'
                              ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300 text-amber-950 shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-amber-50/50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-amber-900">
                            <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Second Main Admin</span>
                          </div>
                          <p className="text-[10px] text-slate-600 mt-0.5 line-clamp-2">
                            All categories + staff governance
                          </p>
                        </button>

                        {/* Panel 1, 2, 3, 4 Shifts */}
                        {PANEL_DEFINITIONS.map((p) => {
                          const isActive = currentRole === 'panel_admin' && currentPanel === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleShiftRole(req.id, `panel_${p.id}` as any)}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-300 text-blue-950 shadow-xs'
                                  : 'bg-white border-slate-200 hover:bg-blue-50/50 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold text-blue-950">
                                <Video className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                <span>{p.name}</span>
                              </div>
                              <p className="text-[10px] text-slate-600 mt-0.5 line-clamp-2">
                                {p.categories}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ──────────────── GRANULAR PERMISSIONS TOGGLES ──────────────── */}
                    <div className="space-y-2 pt-1">
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-blue-700" />
                        <span>Feature Privileges (Customize if needed):</span>
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                        {PERMISSION_METADATA.map((item) => {
                          const Icon = item.icon;
                          const isChecked = Boolean(perms[item.key]);

                          return (
                            <label
                              key={item.key}
                              className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-blue-50/80 border-blue-300 shadow-xs'
                                  : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-500'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePerm(req.id, item.key)}
                                className="mt-0.5 rounded text-[#0f2d59] focus:ring-blue-500 h-4 w-4"
                              />
                              <div className="space-y-0.5 select-none">
                                <div className="flex items-center gap-1 font-bold text-slate-900">
                                  <Icon className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                  <span>{item.label}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                  {item.desc}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions Column */}
                  <div className="flex flex-col gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 min-w-[190px]">
                    {/* Primary Shift / Approve Button */}
                    {req.status === 'pending' ? (
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            req.id,
                            'approved',
                            `Access approved for ${req.full_name} as ${
                              currentRole === 'co_admin' ? 'Second Main Admin' : `Panel ${currentPanel} Admin`
                            }.`
                          )
                        }
                        disabled={isUpdating}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Approve Access</span>
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            req.id,
                            'approved',
                            `Permissions successfully shifted and updated for ${req.full_name}.`
                          )
                        }
                        disabled={isUpdating}
                        className="px-4 py-2.5 rounded-xl bg-[#0f2d59] hover:bg-blue-900 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Save &amp; Shift Access</span>
                      </button>
                    )}

                    {/* Secondary Status Shift Buttons */}
                    {req.status === 'approved' ? (
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            req.id,
                            'revoked',
                            `Access privileges revoked for ${req.full_name}. Their login is now disabled.`
                          )
                        }
                        disabled={isUpdating}
                        className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Revoke / Suspend</span>
                      </button>
                    ) : req.status === 'revoked' ? (
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            req.id,
                            'approved',
                            `Staff account reinstated for ${req.full_name}.`
                          )
                        }
                        disabled={isUpdating}
                        className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Reinstate Access</span>
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            req.id,
                            'rejected',
                            `Access request from ${req.full_name} marked as rejected.`
                          )
                        }
                        disabled={isUpdating}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}

                    {/* Delete Request Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteRequest(req.id, req.full_name)}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete Request</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
