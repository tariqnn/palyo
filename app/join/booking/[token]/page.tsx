import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Booking invite",
  robots: { index: false, follow: false },
};

export default async function BookingInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const validToken = /^[A-Za-z0-9_-]{24,64}$/.test(token);

  return (
    <main className="page">
      <div
        className="container"
        style={{ maxWidth: 560, textAlign: "center", padding: "60px 0" }}
      >
        <span className="eyebrow">PlayUp booking invite</span>
        <h1 style={{ fontSize: 34, margin: "10px 0" }}>Join the booking</h1>
        <p className="muted">
          Open this invite in PlayUp to join your friend&apos;s court booking.
          You may need to sign in first.
        </p>
        {validToken ? (
          <a
            className="btn btn-primary"
            href={`playup://booking/${encodeURIComponent(token)}`}
            style={{ marginTop: 16 }}
          >
            Open PlayUp
          </a>
        ) : (
          <p role="status">This booking invite link is incomplete or invalid.</p>
        )}
        <p className="muted" style={{ marginTop: 18, fontSize: 13 }}>
          If the app does not open, launch PlayUp, sign in, then tap the invite
          link again.
        </p>
        <Link className="section-link" href="/venues">
          Browse venues
        </Link>
      </div>
    </main>
  );
}
