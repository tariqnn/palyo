# PlayUp launch checklist

## Required before inviting real users

- [x] Production website deployed and reporting healthy.
- [x] Production PostgreSQL/Neon database connected and migrated.
- [x] Unique protected production administrator password configured.
- [x] Signup, login, onboarding, booking, cancellation, waitlist, scoring, reviews, and role permissions tested.
- [x] English and Arabic language switcher available across the website.
- [x] Arabic right-to-left layout and responsive navigation implemented.
- [ ] Configure Resend or SMTP and test password-reset delivery to a real inbox.
- [ ] Replace fictional demo venues, players, games, prices, and schedules with real launch data.
- [ ] Assign a person to monitor support messages, reports, bookings, and cancellations every day.
- [ ] Confirm database backup and recovery settings in Neon and perform one recovery drill.
- [x] Add baseline production observability, speed monitoring, database health checks, and scheduled uptime alerts.
- [ ] Run final user acceptance testing on an iPhone, Android phone, tablet, and desktop in English and Arabic.
- [x] Run automated English/Arabic responsive checks on iPhone 13 and Pixel 7 browser profiles (physical phones still required above).

## Business and legal readiness

- [ ] Connect a PlayUp custom domain and update `NEXT_PUBLIC_SITE_URL`.
- [ ] Create and configure a branded support email address.
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
