# Chema

Chema is a diaspora community crowdfunding platform for bereavement support. Families create verified funeral-support campaigns, members give through Stripe, and successful gifts update dashboards in real time.

**No family mourns alone.**

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Firebase Authentication, Cloud Firestore, Firebase Storage
- Stripe PaymentIntents, Stripe Connect Express, Stripe webhooks
- Firestore `onSnapshot` listeners
- Lucide React, Zod, Firebase Admin SDK

## Payment sequence

This sequence is mandatory. The browser is never the source of truth for a successful payment.

```text
User submits payment
        ↓
Stripe processes payment
        ↓
Stripe sends webhook
        ↓
Server verifies Stripe signature
        ↓
Firestore contribution becomes "paid"
        ↓
Campaign totals update atomically
        ↓
Chema Book entry created
        ↓
Firestore onSnapshot fires
        ↓
Member dashboard updates automatically
```

Amounts are stored in **cents** in Firestore and converted only for display. Stripe is always sent amounts in cents.

## Setup

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Firebase

1. Create a Firebase project.
2. Enable **Authentication** with Email/Password and Google.
3. Create a Cloud Firestore database.
4. Enable Firebase Storage.
5. Copy the web app config into the `NEXT_PUBLIC_FIREBASE_*` variables.
6. Generate a service account key and set:

```env
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

Keep the private key on one line in `.env.local` with `\n` for newlines.

7. Deploy rules and indexes from this repo:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Or paste `firestore.rules`, `firestore.indexes.json`, and `storage.rules` in the Firebase console.

8. In Firestore, set at least one user document `role` to `platform_admin` so campaigns can be verified.

### 3. Stripe

1. Create a Stripe account and enable **Connect** with the Express dashboard.
2. Set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Point a webhook to:

```text
https://your-domain.com/api/stripe/webhook
```

For local development:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

4. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Subscribe the webhook to:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`
- `account.updated`

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Landing page |
| `/login` `/register` | Email/password and Google auth |
| `/dashboard` | Real-time member contributions |
| `/campaigns` | Active Chema campaigns |
| `/campaigns/[slug]` | Campaign story, book, giving |
| `/campaigns/create` | Multi-step campaign creation |
| `/campaigns/[id]/edit` | Organizer edits and updates |
| `/communities` | Community directory |
| `/communities/[id]` | Join, leave, invite, community campaigns |
| `/profile` | Member profile |
| `/settings` | Profile and Stripe Connect onboarding |
| `/admin` | Verify pending campaigns |

## Roles

Stored on `users/{userId}.role`:

- `member`
- `campaign_creator`
- `beneficiary`
- `community_admin`
- `platform_admin`

New accounts always start as `member`. Role elevation happens on the server. Users cannot change their own role from the client.

## Security notes

- Stripe secret keys stay on the server.
- Payment success is taken only from verified Stripe webhooks.
- Clients cannot mark a contribution `paid` or change `amountRaised` / `contributorCount`.
- Webhook handling uses the Firebase Admin SDK and stores each Stripe event ID in `processedStripeEvents` so retries cannot double-count.
- Beneficiary bank details are never stored in Firestore. Stripe Connect Express holds them.
- Platform support is an optional extra, shown separately from the family’s Chema.

## Giving

Authenticated members can give $10, $20, $50, $100, or a custom amount, optionally add a message, give anonymously, and add optional platform support.

Example:

```text
Chema for family: $50
Support Chema platform: $2
Total charged: $52
```

After Stripe confirmation the UI shows **Confirming your Chema...** until Firestore reports `paid`, then **Chema received**.
