# Guaranteed One-Vote-Per-Contest Flow

## 1. The Core Business Rule
For every contest edition:
**ONE VERIFIED MOBILE ACCOUNT = ONE ACCEPTED VOTE = ONE SELECTED ARTIST.**

A voter cannot vote for a second candidate or vote twice, regardless of session refreshes, device changes, or clearing browser cache.

---

## 2. Execution Sequence

```
[Voter on Artist Profile]
       │
       ▼ (1. Click "Vote for this Artist")
[Phone Verification Check]
       │ ── Unauthenticated? ──► Opens PhoneVerificationModal
       │ ── Enters Phone (+91 XXXXXXXXXX) ──► Receives 6-digit SMS OTP
       │ ── Verifies OTP ──► Supabase Session Established (is_verified = true)
       ▼
[Pre-Vote Status Check]
       │ ── Calls /api/voting/status?contestId=...
       │ ── If has_voted = true ──► Button switches to "Vote Recorded in this Contest"
       ▼
[Explicit Confirmation Dialog]
       │ ── Highlights candidate name, performance title, and category
       │ ── Explains that the vote is final and irreversible
       ▼ (2. Voter clicks "Yes, Cast My Vote")
[Next.js Server: /api/voting/cast]
       │ ── Verifies authenticated session via cookie
       │ ── Evaluates sliding-window rate limit (Max 5 attempts / 15 mins)
       │ ── Validates payload UUIDs with Zod
       │ ── Generates salted SHA-256 hashes for IP & User-Agent
       ▼
[PostgreSQL Atomic RPC: cast_vote]
       │ ── 1. Locks contest row (FOR SHARE)
       │ ── 2. Verifies status = 'open' AND NOW() BETWEEN voting_start_at AND voting_end_at
       │ ── 3. Verifies nomination.status = 'approved'
       │ ── 4. Executes INSERT INTO votes (...)
       │       └── Protected by CONSTRAINT uq_contest_voter UNIQUE (contest_id, voter_id)
       │           If duplicate, throws PostgreSQL unique_violation (code 23505) instantly
       │ ── 5. In same transaction: UPDATE nominations SET vote_count = vote_count + 1
       │ ── 6. Commits transaction and returns cryptographic receipt
       ▼
[Client Receipt View: /vote/receipt/[id]]
       └── Displays certified cryptographic receipt with print and leaderboard links
```

