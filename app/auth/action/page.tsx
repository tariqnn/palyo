import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import { AuthAction } from "./auth-action";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Account security | ${brand.name}`,
  robots: { index: false, follow: false },
};

export default async function AuthActionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  return <AuthAction mode={one(params.mode) ?? ""} code={one(params.oobCode) ?? ""} apiKey={one(params.apiKey) ?? ""} />;
}
