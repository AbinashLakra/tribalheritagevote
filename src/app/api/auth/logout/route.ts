import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: 'Voter session logged out successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Logout failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
