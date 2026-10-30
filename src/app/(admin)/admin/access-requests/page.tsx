'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';

interface AccessRequest {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  permissions: {
    can_moderate_videos?: boolean;
    can_manage_contest?: boolean;
    can_view_audit_logs?: boolean;
    can_export_data?: boolean;
    can_view_analytics?: boolean;
  };
  is_phone_verified: boolean;
  reviewed_by?: string;
  created_at: string;
}

export default function AdminAccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
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

      // Initialize permissions mapping
      const permsMap: Record<string, Record<string, boolean>> = {};
      data.requests?.forEach((req: AccessRequest) => {
        permsMap[req.id] = {
          can_moderate_videos: Boolean(req.permissions?.can_moderate_videos ?? true),
          can_manage_contest: Boolean(req.permissions?.can_manage_contest ?? false),
          can_view_audit_logs: Boolean(req.permissions?.can_view_audit_logs ?? false),
          can_export_data: Boolean(req.permissions?.can_export_data ?? false),
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

  const handleTogglePerm = (reqId: string, permKey: string) => {
    setSelectedPermissions((prev) => ({
      ...prev,
      [reqId]: {
        ...prev[reqId],
        [permKey]: !prev[reqId]?.[permKey],
      },
    }));
  };

  const handleUpdateStatus = async (
    reqId: string,
    newStatus: 'approved' | 'rejected' | 'revoked'
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
        throw new Error(data.error || 'Failed to update request status.');
      }

      setActionSuccess(`Staff request has been marked as ${newStatus.toUpperCase()}.`);
      await fetchRequests();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#0f2d59] text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Super Admin Governance Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f2d59]">
            Staff Access Requests &amp; Role Delegation
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Review incoming administrator applications, verify applicant identity, and grant granular feature access.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
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

      {/* Requests List */}
      {loading && requests.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-blue-700 animate-spin mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">Loading access requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <UserCheck className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Admin Requests Pending</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When staff members submit an access request through the admin portal, they will appear here for your review and approval.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const isUpdating = updatingId === req.id;
            const perms = selectedPermissions[req.id] || {};

            return (
              <div
                key={req.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm transition-all ${
                  req.status === 'pending'
                    ? 'border-amber-300 ring-2 ring-amber-100'
                    : req.status === 'approved'
                    ? 'border-emerald-300'
                    : 'border-slate-200 opacity-80'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  {/* Left Info */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        {req.full_name}
                      </h3>
                      
                      {/* Status badge */}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          req.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {req.status}
                      </span>

                      {/* Verified phone badge */}
                      {req.is_phone_verified && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          Phone Verified
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>+91 {req.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Applied: {new Date(req.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      <span className="font-bold text-slate-900">Purpose / Role: </span>
                      {req.reason}
                    </div>

                    {/* Permissions Config Box */}
                    <div className="pt-2">
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                        Assign Granular Feature Permissions:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                        {/* Video Moderation */}
                        <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-blue-50/50">
                          <input
                            type="checkbox"
                            checked={perms.can_moderate_videos ?? false}
                            onChange={() => handleTogglePerm(req.id, 'can_moderate_videos')}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-semibold text-slate-800">Video Moderation</span>
                        </label>

                        {/* Contest Dates */}
                        <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-blue-50/50">
                          <input
                            type="checkbox"
                            checked={perms.can_manage_contest ?? false}
                            onChange={() => handleTogglePerm(req.id, 'can_manage_contest')}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-semibold text-slate-800">Contest Timeline</span>
                        </label>

                        {/* Audit Logs */}
                        <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-blue-50/50">
                          <input
                            type="checkbox"
                            checked={perms.can_view_audit_logs ?? false}
                            onChange={() => handleTogglePerm(req.id, 'can_view_audit_logs')}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-semibold text-slate-800">Audit Trail</span>
                        </label>

                        {/* Export Data */}
                        <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-blue-50/50">
                          <input
                            type="checkbox"
                            checked={perms.can_export_data ?? false}
                            onChange={() => handleTogglePerm(req.id, 'can_export_data')}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-semibold text-slate-800">CSV Export</span>
                        </label>

                        {/* View Analytics */}
                        <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-blue-50/50">
                          <input
                            type="checkbox"
                            checked={perms.can_view_analytics ?? true}
                            onChange={() => handleTogglePerm(req.id, 'can_view_analytics')}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-semibold text-slate-800">Executive Overview</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-row lg:flex-col gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                    <button
                      onClick={() => handleUpdateStatus(req.id, 'approved')}
                      disabled={isUpdating}
                      className="flex-1 lg:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{req.status === 'approved' ? 'Update Privileges' : 'Approve Access'}</span>
                    </button>

                    {req.status === 'approved' ? (
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'revoked')}
                        disabled={isUpdating}
                        className="flex-1 lg:flex-none px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Revoke Access</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'rejected')}
                        disabled={isUpdating}
                        className="flex-1 lg:flex-none px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
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

