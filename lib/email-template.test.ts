import { describe, expect, it } from "vitest";
import { buildPasswordResetEmail } from "./email-template";

describe("password reset email template", () => {
  it("provides a readable plain-text fallback and a branded HTML message", () => {
    const url = "https://play-up.fit/reset-password/secure-token";
    const email = buildPasswordResetEmail(url);

    expect(email.text).toContain(url);
    expect(email.text).toContain("expires in one hour");
    expect(email.html).toContain("Reset your password");
    expect(email.html).toContain(`href="${url}"`);
    expect(email.html).toContain("This is an automated transactional email.");
  });

  it("escapes URL content before placing it in HTML", () => {
    const email = buildPasswordResetEmail("https://play-up.fit/reset?a=1&b=<script>");

    expect(email.html).toContain("?a=1&amp;b=&lt;script&gt;");
    expect(email.html).not.toContain("<script>");
  });
});
