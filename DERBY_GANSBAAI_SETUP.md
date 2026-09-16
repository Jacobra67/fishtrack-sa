# Gansbaai Galjoen Derby 2026 — setup checklist

Two console steps make the derby live. Both happen in the [Firebase Console](https://console.firebase.google.com/project/fishtrack-sa).

## Step 1: Publish the new Firestore rules

1. Open **Firestore Database → Rules**.
2. Replace the contents with the full text of `firestore.rules` from this repo.
3. Click **Publish**.

The new rules only *add* the `derbies` section. All existing app behavior
(catch logging, users, species) is unchanged.

## Step 2: Enable Anonymous Authentication

1. Open **Authentication → Sign-in method**.
2. Enable **Anonymous**.

Without this, entry and catch submissions fail for everyone.

## Step 3: Create the derby config document

1. Open **Firestore Database → Data**.
2. Create collection `derbies` (if it doesn't exist).
3. Add document with ID exactly: `gansbaai_galjoen_2026`
4. Add these fields (all type **string**, except `adminUids` which is an **array**):

| Field | Type | Value |
|---|---|---|
| `name` | string | `Gansbaai Galjoen Derby 2026` |
| `location` | string | `Gansbaai — weigh-in at Birkenhead Boat Angling Club` |
| `start` | string | `2026-09-26T07:00:00+02:00` |
| `end` | string | `2026-09-26T18:00:00+02:00` |
| `entriesClose` | string | `2026-09-26T18:00:00+02:00` |
| `adminUids` | array | (empty for now — see Step 4) |

## Step 4: Register verifiers (weigh-in table admins)

1. On the phone/laptop that will verify catches, open `derby-admin.html`
   (fishtrack-sa.netlify.app/derby-admin.html).
2. Copy the **device ID** shown at the top.
3. In the console, open `derbies/gansbaai_galjoen_2026` and add that ID as a
   string element inside the `adminUids` array.
4. Reload the admin page — it should show "✔ You are a verifier".

Repeat for each verifier device (yours + the weigh-master's, ideally).

**Important:** anonymous IDs are per-browser. If the verifier clears browser
data or switches browsers, they get a new ID and must be re-added.

## Day-of-derby flow

- Anglers: `fishtrack-sa.netlify.app/gansbaai.html` — enter, then submit
  catches with photo + span. Submissions show as "awaiting weigh-in".
- Weigh-in table: `derby-admin.html` — tap ✔ Verify when a fish is measured.
  Verified catches appear on the live leaderboard within 60 seconds.
- Leaderboards: Biggest Galjoen (span), Most Galjoen, Top Teams, Biggest Overall.
- Lucky draw: every angler with ≥1 verified catch is in the reel draw.
