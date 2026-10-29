# Application Security & Row Level Security (RLS) Policy

## 1. Defense-in-Depth Principles

1. **Deny by Default**: Every table has Row Level Security enabled. Unauthenticated or non-permitted roles have zero access.
2. **Zero Public Write to Votes Table**:
   - The `votes` table has NO public `INSERT`, `UPDATE`, or `DELETE` grants.
   - Ballots are only accepted via the `SECURITY DEFINER` function `cast_vote`, which verifies timing, nomination status, and phone verification inside an atomic PostgreSQL transaction.
3. **Voter Anonymity & Phone Hashing**:
   - Plaintext phone numbers are never stored in public views.
   - Internal voter records use salted SHA-256 hashes (`phone_hash`).
   - IP addresses and User-Agents are hashed before persistence.
4. **Direct-to-R2 Media Security**:
   - Cloudflare R2 master credentials (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) reside exclusively in server-side memory.
   - Artists receive short-lived (1-hour) presigned PUT URLs with server-controlled paths: `nominations/{contest_id}/{artist_id}/{uuid}.mp4`.
   - Post-upload verification uses S3 `HeadObject` to validate actual file size and physical existence.
5. **Rate Limiting & Anti-Abuse**:
   - Sliding-window in-memory rate limiting on voting, OTP requests, and upload presigning.
   - Incident tracking in `security_events` table upon duplicate vote or rate limit violations.

---

## 2. Row Level Security Matrix

| Table | Public Read | Public Write | Authenticated User | Admin / Reviewer |
| :--- | :--- | :--- | :--- | :--- |
| `profiles` | Name, avatar | ❌ None | Update own profile | Read all |
| `user_roles` | Own roles | ❌ None | Read own roles | Manage roles |
| `contests` | Active / Scheduled | ❌ None | Read only | Full CRUD |
| `artist_profiles` | Verified only | ❌ None | Manage own profile | Review / Verify |
| `nominations` | Approved only | ❌ None | Manage own draft | Moderate / Review |
| `upload_records` | ❌ None | ❌ None | View own uploads | Full view |
| `voter_identities`| ❌ None | ❌ None | View own status | Admin view |
| `votes` | ❌ None | ❌ None | View own receipt | Admin view |
| `audit_logs` | ❌ None | ❌ None | ❌ None | Admin view |

