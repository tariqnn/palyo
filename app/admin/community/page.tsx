import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { ConfirmButton } from "@/components/confirm-button";
import { adminDeletePostAction } from "@/app/actions";
import { currentUser } from "@/lib/auth";
import { one, query } from "@/lib/db";

type Count = { posts: string; comments: string; reviews: string };
type Post = { id: string; name: string; username: string; body: string; created_at: string; comments: string; likes: string };
type Review = { id: string; game_id: string; title: string; name: string; venue_rating: number; organization_rating: number; experience_rating: number; body: string | null; created_at: string };
const date = (value: string) => new Date(value).toLocaleString("en-JO", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Amman" });

export default async function AdminCommunity({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string; page?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/admin");
  const filters = await searchParams;
  const counts = await one<Count>("SELECT (SELECT count(*)::text FROM posts) AS posts,(SELECT count(*)::text FROM post_comments) AS comments,(SELECT count(*)::text FROM reviews) AS reviews");
  const pages = Math.max(1, Math.ceil(Number(counts?.posts || 0) / 20));
  const requested = Number(filters.page);
  const page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, pages) : 1;
  const [posts, reviews] = await Promise.all([
    query<Post>(`SELECT p.id,p.body,p.created_at,u.name,u.username,
      (SELECT count(*)::text FROM post_comments c WHERE c.post_id=p.id) AS comments,
      (SELECT count(*)::text FROM post_likes l WHERE l.post_id=p.id) AS likes
      FROM posts p JOIN users u ON u.id=p.user_id ORDER BY p.created_at DESC LIMIT 20 OFFSET $1`, [(page - 1) * 20]),
    query<Review>(`SELECT r.id,r.game_id,r.body,r.venue_rating,r.organization_rating,r.experience_rating,r.created_at,g.title,u.name
      FROM reviews r JOIN games g ON g.id=r.game_id JOIN users u ON u.id=r.user_id ORDER BY r.created_at DESC LIMIT 10`)
  ]);
  return <AdminShell><div className="admin-heading"><div><span className="eyebrow muted">Community</span><h1>Content review</h1><p>Inspect recent posts and reviews. Remove inappropriate posts when needed.</p></div><Link className="btn btn-outline btn-small" href="/community">Open feed</Link></div>
    {filters.notice && <div className="alert">{filters.notice}</div>}{filters.error && <div className="alert alert-error">{filters.error}</div>}
    <div className="admin-summary-strip"><span><strong>{counts?.posts || 0}</strong> posts</span><span><strong>{counts?.comments || 0}</strong> comments</span><span><strong>{counts?.reviews || 0}</strong> reviews</span></div>
    <div className="admin-community-grid"><section className="admin-panel"><div className="admin-panel-head"><div><span className="eyebrow muted">Feed</span><h2>Posts</h2></div></div>{posts.length ? posts.map(p => <article className="admin-post" key={p.id}><div className="admin-post-head"><Link href={`/profile/${p.username}`}><strong>{p.name}</strong></Link><small>{date(p.created_at)}</small></div><p>{p.body}</p><div className="admin-post-footer"><span>{p.likes} likes · {p.comments} comments</span><form action={adminDeletePostAction}><input type="hidden" name="postId" value={p.id}/><ConfirmButton className="text-button" message="Permanently remove this post and its comments?">Remove post</ConfirmButton></form></div></article>) : <p className="admin-empty">No posts yet.</p>}{pages > 1 && <nav className="pagination" aria-label="Post pages">{page > 1 && <Link href={`/admin/community?page=${page - 1}`}>Previous</Link>}<span>Page {page} of {pages}</span>{page < pages && <Link href={`/admin/community?page=${page + 1}`}>Next</Link>}</nav>}</section><section className="admin-panel"><div className="admin-panel-head"><div><span className="eyebrow muted">Feedback</span><h2>Recent reviews</h2></div></div>{reviews.length ? reviews.map(r => <article className="admin-post" key={r.id}><div className="admin-post-head"><strong>{r.name}</strong><small>{date(r.created_at)}</small></div><p>{r.body || "No written comment."}</p><div className="admin-post-footer"><span>Venue {r.venue_rating}/5 · Organization {r.organization_rating}/5 · Experience {r.experience_rating}/5</span><Link className="inline-link" href={`/games/${r.game_id}`}>{r.title}</Link></div></article>) : <p className="admin-empty">No reviews yet.</p>}</section></div>
  </AdminShell>;
}
