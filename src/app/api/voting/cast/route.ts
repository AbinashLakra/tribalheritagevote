import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { voteSchema } from '@/features/voting/schemas';
import { validateRequestBody, getClientIp, hashIp, hashUserAgent } from '@/lib/security/request-validation';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logSecurityEvent, logAuditEvent } from '@/lib/security/audit';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate voter
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED: Please verify your mobile number to cast your vote.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // 2. Rate limiting check (Max 5 vote attempts per user per 15 minutes)
    const rateLimit = checkRateLimit({
      key: `vote_user:${user.id}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.success) {
      await logSecurityEvent('vote_rate_limit_exceeded', user.id, {
        remaining: rateLimit.remaining,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Too many voting attempts. Please wait a few minutes before trying again.',
          code: 'RATE_LIMITED',
        },
        { status: 429 }
      );
    }

    // 3. Validate request payload
    const validation = await validateRequestBody(request, voteSchema);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error, code: 'INVALID_PAYLOAD' },
        { status: 400 }
      );
    }

    const { contestId, nominationId } = validation.data;

    // 4. Client fingerprinting for fraud prevention
    const rawIp = getClientIp(request);
    const ipHash = hashIp(rawIp);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const uaHash = hashUserAgent(userAgent);

    // 5. Invoke the authoritative atomic PostgreSQL RPC `cast_vote`
    // This executes within a single database transaction and enforces UNIQUE (contest_id, voter_id)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('cast_vote', {
      p_contest_id: contestId,
      p_nomination_id: nominationId,
      p_ip_hash: ipHash,
      p_user_agent_hash: uaHash,
    });

    if (rpcError) {
      const errorMsg = rpcError.message || '';

      // Check for duplicate category vote attempt
      if (
        errorMsg.includes('DUPLICATE_CATEGORY_VOTE') ||
        errorMsg.includes('DUPLICATE_VOTE') ||
        errorMsg.includes('uq_contest_category_voter') ||
        errorMsg.includes('unique_violation') ||
        errorMsg.includes('23505')
      ) {
        await logSecurityEvent('duplicate_vote_attempt', user.id, {
          contestId,
          nominationId,
          ipHash,
        });

        return NextResponse.json(
          {
            success: false,
            error: 'You have already cast your vote in this award category. Each verified citizen must cast 1 vote in each of the 8 categories.',
            code: 'DUPLICATE_CATEGORY_VOTE',
          },
          { status: 409 }
        );
      }

      // Check for contest status errors
      if (errorMsg.includes('CONTEST_NOT_OPEN') || errorMsg.includes('VOTING_CLOSED') || errorMsg.includes('VOTING_NOT_STARTED')) {
        return NextResponse.json(
          { success: false, error: errorMsg, code: 'CONTEST_INACTIVE' },
          { status: 400 }
        );
      }

      // Check for phone verification requirement
      if (errorMsg.includes('VERIFICATION_REQUIRED')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Your mobile number has not been verified. Please complete OTP verification.',
            code: 'VERIFICATION_REQUIRED',
          },
          { status: 403 }
        );
      }

      // Other RPC error
      return NextResponse.json(
        { success: false, error: errorMsg || 'Unable to record your vote.', code: 'RPC_ERROR' },
        { status: 400 }
      );
    }

    // 6. Record auditable event
    await logAuditEvent({
      actorId: user.id,
      action: 'vote_cast_successfully',
      targetEntity: 'votes',
      targetId: (rpcResult as { vote_id?: string })?.vote_id || null,
      details: { contestId, nominationId, ipHash },
    });

    return NextResponse.json({
      success: true,
      data: rpcResult,
      message: 'Your vote has been verified and permanently recorded!',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected voting failure';
    return NextResponse.json({ success: false, error: message, code: 'SERVER_ERROR' }, { status: 500 });
  }
}

