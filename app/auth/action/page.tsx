import type { Metadata } from "next";
import { AuthAction } from "./auth-action";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account security",
  robots: { index: false, follow: false },
};

export default async function AuthActionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const mode = one(params.mode) ?? "";
  const code = one(params.oobCode) ?? "";
  const apiKey = one(params.apiKey) ?? "";
  return <AuthAction key={`${mode}:${code}`} mode={mode} code={code} apiKey={apiKey} />;
}
