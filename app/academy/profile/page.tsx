import { AcademyShell } from "@/components/academy-shell";
import { academyProfileAction } from "@/app/actions";
import { requireAcademyAccess } from "@/lib/academy";
import { one, query } from "@/lib/db";
import { AcademyProfileEditor } from "./academy-profile-editor";

type Academy = {
  name: string;
  description: string;
  phone: string | null;
  email: string | null;
  address: string;
  image_url: string;
  sports: string[];
};

type Package = {
  title: string;
  description: string;
  price: string;
  duration: string;
  image_url: string;
};

type Event = {
  title: string;
  description: string;
  location: string;
  image_url: string;
  starts_at: Date | string;
};

export default async function AcademyProfile({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const access = await requireAcademyAccess();
  const feedback = await searchParams;
  const [academy, packages, events] = await Promise.all([
    one<Academy>(
      "SELECT name,description,phone,email,address,image_url,sports FROM academies WHERE id=$1",
      [access.academyId],
    ),
    query<Package>(
      "SELECT title,description,price,duration,image_url FROM academy_packages WHERE academy_id=$1 ORDER BY sort_order",
      [access.academyId],
    ).catch(() => []),
    query<Event>(
      "SELECT title,description,location,image_url,starts_at FROM academy_events WHERE academy_id=$1 ORDER BY starts_at",
      [access.academyId],
    ).catch(() => []),
  ]);

  return (
    <AcademyShell name={academy?.name || "Academy"}>
      {feedback.notice && (
        <div className="alert" role="status" aria-live="polite">
          {feedback.notice}
        </div>
      )}
      {feedback.error && (
        <div className="alert alert-error" role="alert">
          {feedback.error}
        </div>
      )}
      <div className="admin-heading">
        <div>
          <span className="eyebrow muted">Public information</span>
          <h1>Academy page</h1>
          <p>Update what players see on your public academy profile.</p>
        </div>
      </div>
      <AcademyProfileEditor
        action={academyProfileAction}
        academy={{
          name: academy?.name || "",
          description: academy?.description || "",
          phone: academy?.phone || "",
          email: academy?.email || "",
          address: academy?.address || "",
          imageUrl: academy?.image_url || "",
          sports: academy?.sports?.join(", ") || "",
        }}
        packages={packages.map((item) => ({
          title: item.title,
          description: item.description || "",
          price: item.price || "",
          duration: item.duration || "",
          imageUrl: item.image_url || "",
        }))}
        events={events.map((item) => ({
          title: item.title,
          startsAt: new Date(item.starts_at).toISOString(),
          location: item.location || "",
          description: item.description || "",
          imageUrl: item.image_url || "",
        }))}
      />
    </AcademyShell>
  );
}
