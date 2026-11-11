import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export interface SendEmailOtpResult {
  success: boolean;
  message: string;
  provider?: 'gmail' | 'brevo' | 'sandbox';
  codePreview?: string;
}

export interface VerifyEmailOtpResult {
  success: boolean;
  message: string;
}

export function normalizeEmail(rawEmail: string): string {
  return rawEmail.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/**
 * Computes a deterministic 20-character key so email OTPs reuse the `otp_codes`
 * table (`phone VARCHAR(20)`) safely without requiring a schema migration.
 */
function getEmailOtpStorageKey(normalizedEmail: string): string {
  const digest = crypto.createHash('sha256').update(normalizedEmail).digest('hex');
  return `em:${digest.slice(0, 17)}`;
}

/**
 * Computes the unique 64-char SHA-256 identity hash stored in `voter_identities.phone_hash`.
 */
export function getEmailIdentityHash(normalizedEmail: string): string {
  return crypto.createHash('sha256').update(`email:${normalizedEmail}`).digest('hex');
}

function hashEmailOtp(storageKey: string, code: string): string {
  const salt = process.env.ADMIN_SESSION_SECRET || 'adivasi_otp_salt_2026';
  return crypto.createHmac('sha256', salt).update(`${storageKey}:${code}`).digest('hex');
}

export function getEmailGatewayDiagnostics() {
  const hasGmailUser = Boolean(process.env.GMAIL_USER?.trim());
  const hasGmailPass = Boolean(process.env.GMAIL_APP_PASSWORD?.trim());
  const hasBrevoKey = Boolean(process.env.BREVO_API_KEY?.trim());
  const configured = (hasGmailUser && hasGmailPass) || hasBrevoKey;

  return {
    emailOtpConfigured: configured,
    provider: hasGmailUser && hasGmailPass ? 'gmail' : hasBrevoKey ? 'brevo' : 'unconfigured',
    hasGmailUser,
    hasGmailAppPassword: hasGmailPass,
    hasBrevoKey,
    googleOAuthEnabled: process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === 'true',
  };
}

function buildOtpEmailHtml(code: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <p style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #b45309; margin: 0 0 8px;">
        Dharti Abba Veer Birsa Munda Awards 2026
      </p>
      <h2 style="font-size: 20px; color: #0f172a; margin: 0 0 12px;">
        Your Voter Verification Code
      </h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 20px;">
        Use the 6-digit verification code below to confirm your email and support your favorite tribal artists:
      </p>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 20px;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #065f46; font-family: monospace;">
          ${code}
        </span>
      </div>
      <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">
        This code expires in 10 minutes. If you did not request this verification, you can safely ignore this email.
      </p>
    </div>
  `;
}

async function sendViaGmailSmtp(toEmail: string, code: string): Promise<boolean> {
  const user = process.env.GMAIL_USER?.trim();
  const rawPass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!user || !rawPass) return false;

  const pass = rawPass.replace(/\s+/g, '');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"Tribal Heritage Vote 2026" <${user}>`,
    to: toEmail,
    subject: `${code} is your Tribal Heritage Vote verification code`,
    text: `Your Tribal Heritage Vote 2026 verification code is ${code}. Valid for 10 minutes.`,
    html: buildOtpEmailHtml(code),
  });

  return true;
}

async function sendViaBrevoApi(toEmail: string, code: string): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) return false;

  const senderEmail = process.env.GMAIL_USER?.trim() || process.env.BREVO_SENDER_EMAIL?.trim();
  if (!senderEmail) return false;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Tribal Heritage Vote 2026', email: senderEmail },
      to: [{ email: toEmail }],
      subject: `${code} is your Tribal Heritage Vote verification code`,
      htmlContent: buildOtpEmailHtml(code),
      textContent: `Your Tribal Heritage Vote 2026 verification code is ${code}. Valid for 10 minutes.`,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.warn('[Brevo] Send email OTP failed:', res.status, errText);
    return false;
  }

  return true;
}

/**
 * Generates a cryptographically random 6-digit OTP, stores its HMAC-SHA256 hash
 * in `otp_codes` (10-minute expiry), and emails it via zero-cost Gmail SMTP or Brevo.
 */
export async function sendEmailOtp(rawEmail: string): Promise<SendEmailOtpResult> {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  const code = crypto.randomInt(100000, 1000000).toString();
  const storageKey = getEmailOtpStorageKey(email);
  const codeHash = hashEmailOtp(storageKey, code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const admin = createAdminClient();
  const { error: dbError } = await admin
    .from('otp_codes')
    .upsert(
      {
        phone: storageKey,
        code_hash: codeHash,
        attempts: 0,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'phone' }
    );

  if (dbError) {
    console.error('Failed to store email OTP in database:', dbError);
    return { success: false, message: 'Database error while initiating email verification.' };
  }

  try {
    if (await sendViaGmailSmtp(email, code)) {
      return {
        success: true,
        message: `Verification code sent to ${email}. Please check your Inbox or Spam folder.`,
        provider: 'gmail',
      };
    }

    if (await sendViaBrevoApi(email, code)) {
      return {
        success: true,
        message: `Verification code sent to ${email}. Please check your Inbox or Spam folder.`,
        provider: 'brevo',
      };
    }
  } catch (err: any) {
    console.error('[Email OTP] Delivery error:', err?.message || err);
    return {
      success: false,
      message: 'Failed to send verification email. Please verify email server settings or try again.',
    };
  }

  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_MOCK_OTP === 'true') {
    return {
      success: true,
      message: `Sandbox verification code generated for ${email}.`,
      provider: 'sandbox',
      codePreview: code,
    };
  }

  return {
    success: false,
    message: 'Email OTP delivery is not configured yet. Please set GMAIL_USER and GMAIL_APP_PASSWORD.',
  };
}

/**
 * Validates the 6-digit Email OTP against `otp_codes`.
 */
export async function verifyEmailOtp(
  rawEmail: string,
  enteredCode: string
): Promise<VerifyEmailOtpResult> {
  const email = normalizeEmail(rawEmail);
  const cleanCode = enteredCode.trim();

  if (!isValidEmail(email) || !cleanCode) {
    return { success: false, message: 'Email address and 6-digit verification code are required.' };
  }

  if (
    (process.env.NODE_ENV !== 'production' || process.env.ENABLE_MOCK_OTP === 'true') &&
    (cleanCode === '123456' || cleanCode === '999999')
  ) {
    return { success: true, message: 'Email verified successfully (Sandbox test mode).' };
  }

  const storageKey = getEmailOtpStorageKey(email);
  const admin = createAdminClient();
  const { data: record, error } = await admin
    .from('otp_codes')
    .select('*')
    .eq('phone', storageKey)
    .maybeSingle();

  if (error || !record) {
    return { success: false, message: 'No active verification code found. Please request a new code.' };
  }

  if (Date.now() > new Date(record.expires_at).getTime()) {
    return { success: false, message: 'Verification code has expired. Please click Resend Code.' };
  }

  if (record.attempts >= 5) {
    return { success: false, message: 'Too many incorrect attempts. Please request a fresh code.' };
  }

  const expectedHash = hashEmailOtp(storageKey, cleanCode);
  if (record.code_hash !== expectedHash) {
    await admin
      .from('otp_codes')
      .update({ attempts: record.attempts + 1, updated_at: new Date().toISOString() })
      .eq('phone', storageKey);

    return { success: false, message: 'Incorrect verification code. Please check your email and try again.' };
  }

  await admin.from('otp_codes').delete().eq('phone', storageKey);
  return { success: true, message: 'Email address verified successfully.' };
}

/**
 * Ensures `profiles` and verified `voter_identities` records exist for a verified email/Google user.
 */
export async function upsertVerifiedEmailVoterIdentity(
  userId: string,
  normalizedEmail: string,
  provider: 'MAIL' | 'GOOG' = 'MAIL',
  displayName?: string
): Promise<void> {
  const admin = createAdminClient();
  const fallbackName = displayName?.trim() || normalizedEmail.split('@')[0] || 'Voter';

  await admin.from('profiles').upsert(
    {
      id: userId,
      full_name: fallbackName.slice(0, 150),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  const identityHash = getEmailIdentityHash(normalizedEmail);
  await admin.from('voter_identities').upsert(
    {
      user_id: userId,
      phone_hash: identityHash,
      phone_country_code: provider,
      is_verified: true,
      verified_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
}

/**
 * Provisions or locates the Supabase Auth user by email in O(1) calls,
 * ensures `voter_identities` is verified, and establishes SSR session cookies.
 */
export async function signInAndProvisionEmailVoter(rawEmail: string): Promise<{
  success: boolean;
  userId?: string;
  email?: string;
  error?: string;
}> {
  const email = normalizeEmail(rawEmail);
  const admin = createAdminClient();
  const displayName = email.split('@')[0] || 'Voter';

  let linkResult = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });

  if (linkResult.error || !linkResult.data?.user) {
    const createResult = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        email,
        full_name: displayName,
        role: 'voter',
      },
    });

    if (createResult.error && !createResult.error.message.toLowerCase().includes('already')) {
      return {
        success: false,
        error: 'Failed to create voter identity: ' + createResult.error.message,
      };
    }

    linkResult = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });
  }

  const user = linkResult.data?.user;
  const hashedToken = linkResult.data?.properties?.hashed_token;
  if (!user || !hashedToken) {
    return {
      success: false,
      error: linkResult.error?.message || 'Unable to establish authenticated voter session.',
    };
  }

  await upsertVerifiedEmailVoterIdentity(user.id, email, 'MAIL', displayName);

  const supabase = await createClient();
  const { error: verifyErr } = await supabase.auth.verifyOtp({
    token_hash: hashedToken,
    type: 'email',
  });

  if (verifyErr) {
    return {
      success: false,
      error: 'Failed to initialize voter session cookie: ' + verifyErr.message,
    };
  }

  return { success: true, userId: user.id, email };
}
