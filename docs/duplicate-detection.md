# Event duplicate detection

Prevents the same event being listed twice when admins or organisers submit overlapping entries (e.g. one from a Luma URL and another typed by hand).

## Where it lives

- Logic: [`lib/events/duplicate-detection.ts`](../lib/events/duplicate-detection.ts)
- DB-aware wrapper: [`lib/events/check-duplicates.ts`](../lib/events/check-duplicates.ts)
- Called from:
  - [`app/api/events/route.ts`](../app/api/events/route.ts) (admin create)
  - [`app/api/events/submissions/route.ts`](../app/api/events/submissions/route.ts) (public submission)
  - [`app/api/events/duplicates/route.ts`](../app/api/events/duplicates/route.ts) (admin form's live check)

## Severity levels

`findEventDuplicateCandidates()` returns up to 5 candidates, each tagged:

| Severity | Meaning | Caller behaviour |
|---|---|---|
| `block` | High-confidence match | API returns 409. UI shows the match and blocks submit (no "Create Anyway"). |
| `warning` | Possible match | API returns 409 only on first attempt. UI shows the match with a "Create Anyway" button that re-submits with `allowPotentialDuplicate: true`. |

## Matching rules (ordered, first match wins)

1. **Same normalised URL on same day, within 6h** → `block`. URL normalisation strips `utm_*`, `fbclid`, `gclid`, etc., lowercases hostname, drops `www.` and trailing slashes, and treats `lu.ma` as `luma.com`.
2. **Same normalised title + city, within 45 min** → `block`.
3. **Same URL on same day, times differ** → `warning`.
4. **Same title + city + day** → `warning`.
5. **Same city + day + token similarity ≥ 0.42** (Jaccard over filtered tokens) → `warning`.

## Token filtering

Title similarity uses `getTitleTokens()` which strips a `GENERIC_TITLE_WORDS` stopword list (e.g. `meetup`, `startup`, `lisboa`, `luma`, `online`, …). The aim is to avoid scoring two unrelated events as similar just because they both say "Startup Grind Lisboa".

**Consequence**: titles made up entirely of stopwords (e.g. literal "Startup Grind Lisboa") produce zero meaningful tokens, so similarity is 0 and only the URL/exact-title rules apply. This is intentional; a fuzzier comparison would generate too many false-positive warnings on a Portuguese events catalogue where those words appear constantly.

## Visibility scope

`checkVisibleEventDuplicates()` queries events with `start_time >= today`. The client passed in matters:

- **Admin SSR client** sees all rows via the admin RLS policy. Used for the admin create flow.
- **Service-role client** sees all rows (bypasses RLS). Used for the public submission flow so we also catch duplicates against pending submissions.
- **Anon client** (default for unauthenticated callers) sees only approved events. Used in the dry-run path on `/api/events/submissions?dryRun=1`.

## Extending

To add a new heuristic, edit `findEventDuplicateCandidates()` and `compareEventDuplicateCandidate()` together:
- Add a new branch that builds an `EventDuplicateCandidate` with appropriate severity and score.
- Make sure the score sits in a reasonable place vs existing candidates so sorting still puts the strongest match first.

There's no test file for this module today. If you're changing thresholds, write a fixture-based unit test alongside the change — the matrix is easy to regress.
