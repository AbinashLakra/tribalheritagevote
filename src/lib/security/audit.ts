import { createAdminClient } from '@/lib/supabase/admin';

export interface AuditLogParams {
  actorId?: string | null;
  action: string;
  targetEntity: string;
  targetId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
}

/**
 * Creates an immutable audit trail entry in the `audit_logs` table.
 * Uses the Supabase admin client to ensure writes are recorded reliably.
 * Never throws an uncaught error to prevent audit logging from disrupting user flows.
 */
export async function logAuditEvent({
  actorId = null,
  action,
  targetEntity,
  targetId = null,
  details = {},
  ipAddress = null,
}: AuditLogParams): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('audit_logs').insert({
      actor_id: actorId,
      action,
      target_entity: targetEntity,
      target_id: targetId,
      details,
      ip_address: ipAddress,
    });

    if (error) {
      console.error('[AUDIT_LOG_ERROR] Failed to insert audit log entry:', error);
    }
  } catch (err) {
    console.error('[AUDIT_LOG_CRITICAL] Exception while logging audit event:', err);
  }
}

/**
 * Logs security-relevant incidents such as duplicate vote attempts,
 * rate limit violations, or unauthorized access attempts.
 */
export async function logSecurityEvent(
  eventType: string,
  identifier: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('security_events').insert({
      event_type: eventType,
      identifier,
      details,
    });

    if (error) {
      console.error('[SECURITY_EVENT_ERROR] Failed to record security event:', error);
    }
  } catch (err) {
    console.error('[SECURITY_EVENT_CRITICAL] Exception while recording security event:', err);
  }
}
