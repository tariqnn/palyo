# PlayUp launch checklist

## Required before inviting real users

- [x] Production website deployed and reporting healthy.
- [x] Production PostgreSQL/Neon database connected and migrated.
- [x] Unique protected production administrator password configured.
- [x] Signup, login, onboarding, booking, cancellation, waitlist, scoring, reviews, and role permissions tested.
- [x] English and Arabic language switcher available across the website.
- [x] Arabic right-to-left layout and responsive navigation implemented.
- [ ] Configure Resend or SMTP and test password-reset delivery to a real inbox.
- [x] Remove fictional demo venues, academies, activities, offers, games, prices, schedules, reviews, bookings, tournaments, and community posts from production. Keep the administrator and audit history.
- [x] Add the Infinity Sports Academy profile, five sourced facility listings, and two factual TripAdvisor venue listings. Rates are unpublished unless confirmed by the venue; no match schedule has been invented.
- [ ] Assign a person to monitor support messages, reports, bookings, and cancellations every day.
- [ ] Confirm database backup and recovery settings in Neon and perform one recovery drill.
- [x] Add baseline production observability, speed monitoring, database health checks, and scheduled uptime alerts.
- [ ] Run final user acceptance testing on an iPhone, Android phone, tablet, and desktop in English and Arabic.
- [x] Run automated English/Arabic responsive checks on iPhone 13 and Pixel 7 browser profiles (physical phones still required above).

## Business and legal readiness

- [x] Connect `play-up.fit` and `www.play-up.fit` to Vercel, verify Namecheap DNS, set Production `NEXT_PUBLIC_SITE_URL` to `https://play-up.fit`, and deploy the updated production build.
- [x] Publish the verified Creative Networks contact email and phone for support requests.
- [ ] Add the operating company/person name and contact details to Terms and Privacy pages.
- [ ] Review terms for injuries and liability, venue responsibility, no-shows, minimum age, recording consent, and Jordanian jurisdiction.
- [x] Document and implement account deletion and personal-data requests with admin support-ticket handling.
- [ ] Sign agreements with launch venues/academies and confirm prices and schedules.

## Launch scope decisions

- [x] Launch the website as the first public pilot; do not promote mobile and web as one shared account system yet.
- [x] Keep cash-at-venue messaging visible until a licensed payment provider is integrated.
- [x] Keep video marked unavailable until a real streaming provider and storage policy are configured.
- [x] Keep tournaments limited to basic registration, fixtures, and standings for the pilot.

## First-week operations

- [ ] Start with 10–30 invited users and two or three real venues.
- [ ] Review failed logins, support requests, cancellations, no-shows, and capacity issues daily.
- [ ] Verify every published match has an accountable organizer and current contact details.
- [ ] Collect feedback in English and Arabic after each completed booking.
- [ ] Review monitoring, database growth, and support response time after 24 hours and seven days.

## Current deployment status — 2026-10-16

- Production deployment `dpl_34G99q3h1Ldej7v836Rs7ziGrvJe` is Ready and aliased to `https://play-up.fit`. `/api/health`, `/academies`, `/venues`, the Infinity academy profile, and the local logo asset returned HTTP 200 after deployment.
- The production database has 1 administrator, 7 active sourced venue records (5 Infinity Sports facilities and 2 TripAdvisor listings), and 1 active Infinity Sports Academy profile. Demo venues, games, bookings, reviews, activities, offers, tournaments, and community posts are all zero. No public member accounts or games are present yet.
- Current rates are unconfirmed for all court listings. Infinity's official site publishes the volleyball package at 100 JOD for 10 sessions; basketball programs say contact for pricing.
- Password-reset delivery, support email, and legal operator details are not configured in Production.
- The verified Namecheap records are `A @ 216.198.79.1`, `A @ 64.29.17.1`, and `CNAME www a1b622ff674d65fc.vercel-dns-017.com`.
- Production `NEXT_PUBLIC_SITE_URL` is set to `https://play-up.fit`.

## Current production verification — 2026-10-17

- The corrected site is deployed and aliased to `https://play-up.fit` as Vercel deployment `dpl_AueWm7CsQBQSMGnRC4fDutS6doHG`.
- Production readback shows 7 active sourced venues, zero demo venues, zero future games, zero public member accounts, and 1 administrator. All 7 rates are null; venue cards say “Contact for rates” and do not expose booking until a venue confirms pricing.
- Playwright checks returned HTTP 200 with no page errors for `/venues`, `/venues/map`, `/leaderboards`, `/games`, and football, basketball, and tennis pages. All 7 venue directions links are present. Seeded matches, the administrator leaderboard row, and the old 20 JD default price are absent.
- Full site gates passed: typecheck, 12 unit tests, optimized production build; lint had 0 errors and 5 existing unused-variable warnings. Production audit confirms the database is reachable and reports email recovery, support email, and legal operator details as unconfigured.
- Booking remains disabled until real venue rates and availability are entered. The map route and all 7 directions links render; the native Flutter map still needs signed-in physical-device acceptance testing.

## Map and release-readiness follow-up — 2026-10-17

- Latest deployment: `dpl_BCmQ8bpPgTgRGyCBRZAKpQipnveB`, aliased to `https://play-up.fit` and Ready.
- `/venues/map` now embeds OpenStreetMap using the verified Infinity campus coordinates. It lists all 7 real venues, marks the 5 Infinity courts at their shared campus, and leaves Trax/Ayla without fabricated pins while preserving address-based directions. A 390px mobile browser check returned HTTP 200 with no page errors or test content; map tiles rendered.
- Final web gates passed: TypeScript, 12 unit tests, optimized production build, and production database audit. Current database audit: 1 administrator, 7 venues, 0 demo venues, 0 future games, and database health `ok`.
- Flutter checks passed: `flutter analyze` (no issues) and `flutter test` (22/22). Signed-in physical-device UAT and the current TestFlight/App Store build were not verified in this pass.
- Production contact pages use the verified Creative Networks email and phone; the fictitious support address, phone, office address, social links, and tournament banner are removed. Live `/contact`, `/privacy`, `/terms`, `/venues/map`, `/leaderboards`, and `/games` checks return HTTP 200 with no placeholder contacts or test content.
- Flutter gates re-run against the current checkout: `flutter analyze` reports no issues and `flutter test` passes 22/22. The latest TestFlight build is 1.0.0 (23), assigned to the internal `testing` group.
- Public launch remains blocked on password-reset email delivery, legal operator name/address and final legal review, a Neon recovery drill, physical-device acceptance, and Android Play release. Court rates and availability are intentionally not configured for this contact-only launch. Online card payments are unavailable until a licensed provider is configured in the app.
