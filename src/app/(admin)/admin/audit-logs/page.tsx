import { History, ShieldCheck, User } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatDateIST } from '@/lib/utils/formatters';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Immutable Security Audit Logs',
  description: 'Cryptographic security audit trail tracking all voting and administrative actions.',
};

export default async function AdminAuditLogsPage() {
  const admin = createAdminClient();

  const { data: logs } = await admin
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div className="space-y-1 border-b border-ivory-300 pb-5">
        <span className="text-xs font-bold uppercase tracking-widest text-terracotta-600">
          Traceability &amp; Compliance
        </span>
        <h1 className="text-3xl font-extrabold text-charcoal-900">
          Security &amp; Operational Audit Trail
        </h1>
        <p className="text-sm text-charcoal-600">
          Immutable event log of all authenticated voting actions, moderation decisions, and contest state transitions.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-ivory-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-ivory-100/70 border-b border-ivory-300 font-bold text-charcoal-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Timestamp (IST)</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4 hidden sm:table-cell">Target ID</th>
                <th className="py-3.5 px-4">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200 text-charcoal-700">
              {logs && logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-ivory-50/60 font-mono">
                    <td className="py-3 px-4 sm:px-6 whitespace-nowrap text-charcoal-500">
                      {formatDateIST(log.created_at)}
                    </td>
                    <td className="py-3 px-4 font-bold text-charcoal-900">
                      <span className="inline-block px-2 py-0.5 rounded bg-ivory-200 text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-forest-800">
                      {log.target_entity}
                    </td>
                    <td className="py-3 px-4 text-charcoal-500 hidden sm:table-cell truncate max-w-xs">
                      {log.target_id || '—'}
                    </td>
                    <td className="py-3 px-4 text-charcoal-600 truncate max-w-xs">
                      {log.actor_id ? `${log.actor_id.slice(0, 8)}...` : 'System'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-charcoal-500 font-sans">
                    No audit records recorded yet. All administrative actions will be logged here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
