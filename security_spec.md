# Security Specification for travel-app

## Data Invariants
1. A trip must belong to a valid user (`userId` matches the document path and `request.auth.uid`).
2. An expense must belong to a trip that the user owns.
3. Timestamps (`updatedAt`, `createdAt`) must be server-generated.
4. Document IDs must be valid alphanumeric strings.

## The Dirty Dozen Payloads (Denied)
1. **Malicious UID**: Creating a user profile with a UID that doesn't match `request.auth.uid`.
2. **Trip Hijack**: Updating a trip's `userId` field to a different user.
3. **Ghost Field**: Adding `isAdmin: true` to a Trip or Expense.
4. **Invalid Amount**: Setting `amount: -100` in an Expense.
5. **Orphaned Expense**: Creating an expense for a `tripId` that does not exist or belongs to another user.
6. **Huge Payload**: Injecting 1MB of garbage into an expense's `name`.
7. **Cross-User Read**: Authenticated user 'A' trying to list expenses for user 'B'.
8. **Date Poisoning**: Setting `date: "9999-99-99"` (if regex used).
9. **Status Shortcut**: (If status existed) Skipping required states.
10. **Unauthorized PII Read**: Attempting to read another user's email from their profile.
11. **Type Poisoning**: Sending `amount: "one hundred"` instead of a number.
12. **Self-Promotion**: Authenticated user trying to create an entry in an `admins` collection (if it existed).

## Test Runner (Draft)
I will provide a `firestore.rules.test.ts` to simulate these.
