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
} from 'lucide-react';
import { ROLE_PRESETS, RoleCategoryKey } from '@/lib/auth/admin-constants';

interface AccessRequest {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  permissions: {
    requested_role?: string;
    can_moderate_videos?: boolean;
    can_manage_contest?: boolean;
    can_view_audit_logs?: boolean;
    can_export_data?: boolean;
    can_view_analytics?: boolean;
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
    desc: 'Approve, reject, or flag audition videos and performances',
    icon: Video,
  },
  {
    key: 'can_manage_contest',
    label: 'Contest Timeline',
    desc: 'Modify contest stages, extend voting window, set dates',
    icon: Flame,
  },
  {
    key: 'can_view_audit_logs',
    label: 'Audit Trail',
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
] as const;

export default function AdminAccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Status Filter & Search
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'revoked' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editable Permissions per request ID
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, Record<string, boolean>>>({});
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
      setRequests(data.requests || []);

      // Initialize permissions mapping from database records
      const permsMap: Record<string, Record<string, boolean>> = {};
      data.requests?.forEach((req: AccessRequest) => {
        permsMap[req.id] = {
          can_moderate_videos: Boolean(req.permissions?.can_moderate_videos),
          can_manage_contest: Boolean(req.permissions?.can_manage_contest),
          can_view_audit_logs: Boolean(req.permissions?.can_view_audit_logs),
          can_export_data: Boolean(req.permissions?.can_export_data),
          can_view_analytics: Boolean(req.permissions?.can_view_analytics ?? true),
        };
      });
      setSelectedPermissions(permsMap);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
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

  // Quick Preset Role Application (Shift Access at any time!)
  const handleApplyPreset = (reqId: string, presetKey: 'all_access' | 'video_reviewer' | 'contest_coordinator' | 'auditor' | 'data_analyst' | 'clear') => {
    if (presetKey === 'clear') {
      setSelectedPermissions((prev) => ({
        ...prev,
        [reqId]: {
          can_moderate_videos: false,
          can_manage_contest: false,
          can_view_audit_logs: false,
          can_export_data: false,
          can_view_analytics: false,
        },
      }));
      return;
    }

    const preset = ROLE_PRESETS[presetKey];
    setSelectedPermissions((prev) => ({
      ...prev,
      [reqId]: {
        can_moderate_videos: preset.permissions.can_moderate_videos,
        can_manage_contest: preset.permissions.can_manage_contest,
        can_view_audit_logs: preset.permissions.can_view_audit_logs,
        can_export_data: preset.permissions.can_export_data,
        can_view_analytics: preset.permissions.can_view_analytics,
      },
    }));
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
      const res = await fetch('/api/admin/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reqId,
          status: newStatus,
          permissions: perms,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update request privileges.');
      }

      setActionSuccess(actionLabel || `Staff permissions successfully updated to ${newStatus.toUpperCase()}.`);
      await fetchRequests();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete Request
  const handleDeleteRequest = async (reqId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete the request from ${name}?`)) {
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

      setActionSuccess(`Access request for ${name} deleted successfully.`);
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
      // Tab filter
      if (activeTab !== 'all' && req.status !== activeTab) {
        return false;
      }
      // Search filter
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
            <span>Main Super Admin Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f2d59]">
            Sub-Admin Access Governance &amp; Role Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Review incoming administrator applications, assign all-access or granular feature categories, and shift or revoke staff privileges at any time in real-time.
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
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'all'
                ? 'bg-[#0f2d59] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Requesters ({counts.all})
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
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
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
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
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
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
            className={`px-3 py-1.5 rounded-xl transition-all ${
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
            const isAllAccess =
              perms.can_moderate_videos &&
              perms.can_manage_contest &&
              perms.can_view_audit_logs &&
              perms.can_export_data &&
              perms.can_view_analytics;

            const requestedRole = req.permissions?.requested_role;

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
                  <div className="space-y-3.5 flex-1">
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

                      {/* Requested Role Highlight */}
                      {requestedRole === 'all_access' ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-xs">
                          <Crown className="w-3 h-3 text-amber-600" />
                          ⭐ ALL ACCESS REQUESTED
                        </span>
                      ) : requestedRole ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          Requested: {requestedRole.replace('_', ' ')}
                        </span>
                      ) : null}
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

                    {/* ──────────────── GRANULAR PERMISSIONS & SHIFT CONTROLS ──────────────── */}
                    <div className="pt-2 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-blue-700" />
                          <span>Granular Feature Categories &amp; Access Shift:</span>
                        </p>

                        {/* Quick Presets / Shift Access Buttons */}
                        <div className="flex flex-wrap items-center gap-1 text-[11px]">
                          <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">
                            Quick Shift:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleApplyPreset(req.id, 'all_access')}
                            className="px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Crown className="w-2.5 h-2.5 text-amber-600" />
                            <span>All Access</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyPreset(req.id, 'video_reviewer')}
                            className="px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium border border-blue-200 transition-colors cursor-pointer"
                          >
                            Jury Only
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyPreset(req.id, 'contest_coordinator')}
                            className="px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium border border-blue-200 transition-colors cursor-pointer"
                          >
                            Contest Lead
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyPreset(req.id, 'auditor')}
                            className="px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium border border-blue-200 transition-colors cursor-pointer"
                          >
                            Auditor
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyPreset(req.id, 'clear')}
                            className="px-1.5 py-0.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-[10px] cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* 5 Distinct Granular Toggles */}
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
                            `Access approved for ${req.full_name} with selected permissions.`
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
