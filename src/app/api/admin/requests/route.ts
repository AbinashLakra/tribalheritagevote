import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

async function checkAdminAuth() {
  const session = await getAdminSession();
  if (session) {
    if (
      session.role === 'super_admin' ||
      session.role === 'co_admin' ||
      session.permissions?.can_manage_admins
    ) {
      return { authorized: true, name: session.name || session.username };
    }
  }

  // Fallback to Supabase user session
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const admin = createAdminClient();
      const { data: role } = await admin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'super_admin'])
        .maybeSingle();

      if (role) {
        return { authorized: true, name: user.email || 'Main Administrator' };
      }
    }
  } catch {
    // ignore
  }

  return { authorized: false, name: null };
}

export async function GET() {
  const auth = await checkAdminAuth();
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Super Admin or Second Main Admin privileges required.' },
      { status: 401 }
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

  return NextResponse.json({ success: true, requests: requests || [] });
}

export async function PATCH(req: NextRequest) {
  const auth = await checkAdminAuth();
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Only Super Admin or Second Main Admin can approve, shift, or revoke admin permissions.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { id, status, permissions, role_type, assigned_panel } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required to update admin access.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const updatePayload: Record<string, any> = {
      reviewed_by: auth.name || 'Main Administrator',
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updatePayload.status = status;
    }

    if (role_type) {
      updatePayload.role_type = role_type;
    }

    if (assigned_panel !== undefined) {
      updatePayload.assigned_panel = assigned_panel;
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
  const auth = await checkAdminAuth();
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Super Admin or Second Main Admin privileges required to delete requests.' },
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
      message: 'Access request successfully deleted from the database ledger.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete admin request.' },
      { status: 500 }
    );
  }
}
