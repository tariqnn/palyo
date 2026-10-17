import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getSiteConfig } from "@/lib/site-editor";
import { SiteEditorForm } from "@/components/site-editor-form";

export const metadata = {
  title: "Owner Studio | PlayUp",
  description: "Company owner controls for public content, text, photos, branding, and homepage layout.",
};

export default async function SiteEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  await requireAdmin();
  const config = await getSiteConfig();
  const { notice, error } = await searchParams;

  return (
    <AdminShell>
      <div style={{ maxWidth: 1120, margin: "0 auto", paddingBottom: 90 }}>
        {notice && (
          <div className="alert alert-success" style={{ marginBottom: 18 }}>
            {notice}
          </div>
        )}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 18 }}>
            {error}
          </div>
        )}

        <SiteEditorForm initialConfig={config} />
      </div>
    </AdminShell>
  );
}
