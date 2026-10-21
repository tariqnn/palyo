import { redirect } from "next/navigation";

export default async function LegacyMatchLink({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/join/match/${encodeURIComponent(id)}`);
}
