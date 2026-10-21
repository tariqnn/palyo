import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Match invite",
  robots: { index: false, follow: false },
};

export default async function MatchInvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const validId = /^[A-Za-z0-9_-]{1,128}$/.test(id);

  return (
    <main className="page">
      <div
        className="container"
        style={{ maxWidth: 560, textAlign: "center", padding: "60px 0" }}
      >
        <span className="eyebrow">PlayUp match invite</span>
        <h1 style={{ fontSize: 34, margin: "10px 0" }}>Join the match</h1>
        <p className="muted">
          Open this invite in PlayUp to join the match. You may need to sign in
          first.
        </p>
        {validId ? (
          <a
            className="btn btn-primary"
            href={`playup://match/${encodeURIComponent(id)}`}
            style={{ marginTop: 16 }}
          >
            Open PlayUp
          </a>
        ) : (
          <p role="status">This match invite link is incomplete or invalid.</p>
        )}
        <p className="muted" style={{ marginTop: 18, fontSize: 13 }}>
          If the app does not open, launch PlayUp, sign in, then tap the invite
          link again.
        </p>
        <Link className="section-link" href="/venues">
          Browse courts
        </Link>
      </div>
    </main>
  );
}
