# Security Specification & Hardened Invariants

## 1. Data Invariants
1. **Admin Authority**: Only the verified bootstrapped admin (`lailafarag210@gmail.com` with `email_verified == true`) or explicitly registered `/admins/{uid}` documents may create, update, or delete `/settings`, `/grades_resources`, `/stories`, `/official_papers`, `/news`, or `/admins`.
2. **Teacher Prep Ownership & Public Share-By-ID**: Teachers must be signed in with a verified email to create, update, or delete their own `/teacher_preps/{prepId}`, with `ownerUid == request.auth.uid` enforced and immutable on update. Anyone with the exact `prepId` share link may `get` that single prep, while `list` is strictly restricted to `resource.data.ownerUid == request.auth.uid || isAdmin()`.
3. **Order Integrity**: Only verified signed-in users may create `/orders/{orderId}` with `ownerUid == request.auth.uid` and initial `status == 'pending_whatsapp'`. Only admins may confirm orders or update terminal status. `list` on `/orders` is strictly restricted to `resource.data.ownerUid == request.auth.uid || isAdmin()`.
4. **Strict Payload & Size Caps**: Every document enforces `hasAll`, `hasOnly`, type assertions, string `.size()` bounds, numeric `>= 0` bounds, and `isValidId(id)` regex checks (`^[a-zA-Z0-9_\-]+$`) on single-document operations.
5. **Temporal Integrity**: `createdAt` and `updatedAt` are strictly validated against `request.time` via `serverTimestamp()`.

## 2. Dirty Dozen Adversarial Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated write to `/grades_resources/hack1` (`create`).
2. Non-admin authenticated user writing to `/news/fake_news` (`create`).
3. Unverified email spoofing `lailafarag210@gmail.com` with `email_verified: false` updating `/settings/global`.
4. Shadow update adding `isAdmin: true` to `/teacher_preps/prep1`.
5. Oversized `id` (> 128 chars or containing slashes/spaces) on `/stories/{storyId}`.
6. Teacher creating `/teacher_preps/prep2` with `ownerUid` set to another user's UID.
7. Teacher listing `/teacher_preps` without filtering by `ownerUid == request.auth.uid`.
8. Non-owner reading `/orders/order1` owned by another user.
9. User updating `/orders/order1` status from `pending_whatsapp` directly to `confirmed`.
10. Injecting a 1MB string into `titleEn` on `/grades_resources/res1`.
11. Mutating immutable `ownerUid` or `createdAt` during an update on `/teacher_preps/prep1`.
12. Client forging a past/future `createdAt` timestamp instead of `request.time`.
