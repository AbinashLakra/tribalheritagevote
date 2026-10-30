import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin login required.' }, { status: 401 });
  }

  // Only super admin or someone with can_manage_admins can view requests
  if (session.role !== 'super_admin' && !session.permissions?.can_manage_admins) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Super Admin privileges required to manage staff requests.' },
      { status: 403 }
    );
  }

  const admin = createAdminClient();
  const { data: requests, error } = await admin
    .from('admin_access_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, requests });
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin login required.' }, { status: 401 });
  }

  if (session.role !== 'super_admin' && !session.permissions?.can_manage_admins) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Only Super Admin can approve, shift, or revoke admin permissions.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { id, status, permissions } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required to update admin access.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const updatePayload: Record<string, any> = {
      reviewed_by: session.name || session.username,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updatePayload.status = status;
    }

    if (permissions && typeof permissions === 'object') {
      updatePayload.permissions = permissions;
    }

    const { data: updated, error: updateError } = await admin
      .from('admin_access_requests')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Staff Admin privileges successfully updated and active in real-time.`,
      request: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update admin request.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin login required.' }, { status: 401 });
  }

  if (session.role !== 'super_admin' && !session.permissions?.can_manage_admins) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Super Admin privileges required to delete requests.' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required to delete.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error: deleteError } = await admin
      .from('admin_access_requests')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Access request successfully deleted from the ledger.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete admin request.' },
      { status: 500 }
    );
  }
}
