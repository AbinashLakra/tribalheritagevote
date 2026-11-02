import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = createAdminClient();

    // Query all currently APPROVED admin access requests
    const { data: approvedAdmins, error } = await admin
      .from('admin_access_requests')
      .select('id, full_name, role_type, assigned_panel, permissions')
      .eq('status', 'approved');

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const filledSlots = {
      main_admin: false,
      panel_admin_1: false,
      panel_admin_2: false,
      panel_admin_3: false,
      panel_admin_4: false,
    };

    (approvedAdmins || []).forEach((adm) => {
      if (adm.role_type === 'co_admin' || adm.permissions?.requested_role === 'main_admin') {
        filledSlots.main_admin = true;
      }
      if (adm.role_type === 'panel_admin' || adm.assigned_panel) {
        if (adm.assigned_panel === 1 || adm.permissions?.requested_role === 'panel_admin_1') {
          filledSlots.panel_admin_1 = true;
        }
        if (adm.assigned_panel === 2 || adm.permissions?.requested_role === 'panel_admin_2') {
          filledSlots.panel_admin_2 = true;
        }
        if (adm.assigned_panel === 3 || adm.permissions?.requested_role === 'panel_admin_3') {
          filledSlots.panel_admin_3 = true;
        }
        if (adm.assigned_panel === 4 || adm.permissions?.requested_role === 'panel_admin_4') {
          filledSlots.panel_admin_4 = true;
        }
      }
    });

    const totalFilled = Object.values(filledSlots).filter(Boolean).length;
    const allFilled = totalFilled >= 5;

    return NextResponse.json({
      success: true,
      data: {
        filledSlots,
        totalFilled,
        totalCapacity: 5,
        allFilled,
        approvedCount: approvedAdmins?.length || 0,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query slot status';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
