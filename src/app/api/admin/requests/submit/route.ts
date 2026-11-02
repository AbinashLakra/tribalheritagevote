import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyOtpCode } from '@/lib/sms/sms-service';
import { ROLE_PRESETS, RoleCategoryKey } from '@/lib/auth/admin-constants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_name, phone, email, reason, role_category = 'all_access', otp } = body;

    if (!full_name || !phone || !email || !reason) {
      return NextResponse.json(
        { success: false, error: 'Full name, phone, email, and purpose are all required.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    // Verify OTP using SMS verification engine
    const otpCheck = await verifyOtpCode(cleanPhone, otp);
    if (!otpCheck.success) {
      return NextResponse.json(
        { success: false, error: otpCheck.message },
        { status: 400 }
      );
    }
    const admin = createAdminClient();

    // Check if phone already requested
    const { data: existing } = await admin
      .from('admin_access_requests')
      .select('id, status, role_type, assigned_panel, permissions')
      .or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone}`)
      .maybeSingle();

    // Determine requested role category preset
    const validKey = (role_category in ROLE_PRESETS ? role_category : 'panel_admin_1') as RoleCategoryKey;
    const preset = ROLE_PRESETS[validKey];

    // Check if this specific admin position is already approved and filled by SOMEONE ELSE!
    const { data: approvedAdmins } = await admin
      .from('admin_access_requests')
      .select('id, role_type, assigned_panel, permissions')
      .eq('status', 'approved');

    const isSlotTaken = (approvedAdmins || []).some((adm) => {
      // If the current requester is already the one holding this approved slot, allow them to re-verify or update
      if (existing && adm.id === existing.id) return false;

      if (preset.role_type === 'co_admin') {
        return adm.role_type === 'co_admin' || adm.permissions?.requested_role === 'main_admin';
      }
      if (preset.role_type === 'panel_admin' && preset.assigned_panel) {
        return (
          adm.assigned_panel === preset.assigned_panel ||
          adm.permissions?.requested_role === `panel_admin_${preset.assigned_panel}`
        );
      }
      return false;
    });

    if (isSlotTaken) {
      return NextResponse.json(
        {
          success: false,
          error: `The requested position (${preset.label}) is already approved and filled by another admin. Please select an available panel position or contact the Super Administrator.`,
        },
        { status: 400 }
      );
    }

    const initialPermissions = {
      requested_role: validKey,
      requested_label: preset.label,
      can_moderate_videos: preset.permissions.can_moderate_videos,
      can_manage_contest: preset.permissions.can_manage_contest,
      can_view_audit_logs: preset.permissions.can_view_audit_logs,
      can_export_data: preset.permissions.can_export_data,
      can_view_analytics: preset.permissions.can_view_analytics,
      can_manage_admins: preset.permissions.can_manage_admins,
    };

    let resultRecord: any;

    if (existing) {
      // UPDATE existing request with the latest details so Main Admin sees it immediately!
      const { data: updated, error: updateError } = await admin
        .from('admin_access_requests')
        .update({
          full_name: full_name.trim(),
          phone: cleanPhone,
          email: email.trim().toLowerCase(),
          reason: reason.trim(),
          status: 'pending',
          is_phone_verified: true,
          role_type: preset.role_type,
          assigned_panel: preset.assigned_panel,
          permissions: initialPermissions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update admin request:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update request: ' + updateError.message },
          { status: 500 }
        );
      }
      resultRecord = updated;
    } else {
      // Insert fresh request
      const { data: inserted, error: insertError } = await admin
        .from('admin_access_requests')
        .insert({
          full_name: full_name.trim(),
          phone: cleanPhone,
          email: email.trim().toLowerCase(),
          reason: reason.trim(),
          status: 'pending',
          is_phone_verified: true,
          role_type: preset.role_type,
          assigned_panel: preset.assigned_panel,
          permissions: initialPermissions,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to insert admin request:', insertError);
        return NextResponse.json(
          { success: false, error: 'Failed to record request: ' + insertError.message },
          { status: 500 }
        );
      }
      resultRecord = inserted;
    }

    return NextResponse.json({
      success: true,
      message: `Admin access request submitted for ${preset.label}! Mobile number verified. The Main Admin will review and can approve or customize your privileges.`,
      requestId: resultRecord.id,
      roleRequested: validKey,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Server error while submitting admin access request.' },
      { status: 500 }
    );
  }
}
