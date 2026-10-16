"use server";

import { redirect } from "next/navigation";
import { query, one } from "@/lib/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";

export async function appAccountDeletionRequestAction(form: FormData) {
  let error = "";
  try {
    const input = z.object({
      name: z.string().trim().min(2).max(80),
      email: z.email(),
      details: z.string().trim().max(1800),
    }).parse({
      name: form.get("name"),
      email: form.get("email"),
      details: form.get("details") || "",
    });
    const recent = await one<{ n: string }>(
      "SELECT count(*)::text AS n FROM contact_messages WHERE email=$1 AND created_at>now()-interval '15 minutes'",
      [input.email],
    );
    if (Number(recent?.n || 0) >= 3) throw new Error("Please wait before sending another request.");
    const body = [
      "PlayUp mobile app account deletion request.",
      "The user says this email is used for their PlayUp mobile app account.",
      input.details && `Additional details: ${input.details}`,
    ].filter(Boolean).join("\n\n");
    await query(
      "INSERT INTO contact_messages(id,name,email,body) VALUES($1,$2,$3,$4)",
      [randomUUID(), input.name, input.email, body],
    );
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Your request could not be submitted.";
  }
  redirect(error ? `/delete-account?error=${encodeURIComponent(error)}` : "/delete-account?sent=1");
}
