import { afterEach, describe, expect, it, vi } from "vitest";
import { demoEnabled, publicDemoEnabled } from "./demo";

afterEach(()=>vi.unstubAllEnvs());

describe("demo flags",()=>{
  it("only enables the public demo on Production with the flag set",()=>{
    vi.stubEnv("VERCEL_ENV","production");
    vi.stubEnv("PLAYUP_PUBLIC_DEMO",undefined);
    expect(demoEnabled()).toBe(false);
    vi.stubEnv("PLAYUP_PUBLIC_DEMO","1");
    expect(publicDemoEnabled()).toBe(true);
  });

  it("accepts legacy PlayO Vercel flags during the rebrand",()=>{
    vi.stubEnv("VERCEL_ENV","production");
    vi.stubEnv("PLAYUP_PUBLIC_DEMO",undefined);
    vi.stubEnv("PLAYO_PUBLIC_DEMO","1");
    expect(demoEnabled()).toBe(true);
  });
});
