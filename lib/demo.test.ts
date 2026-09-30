import { afterEach, describe, expect, it, vi } from "vitest";
import { paymentProvider } from "./payment";

afterEach(()=>vi.unstubAllEnvs());

describe("demo payment guard",()=>{
  it("requires an explicitly enabled Preview or Production demo",async()=>{
    vi.stubEnv("NODE_ENV","production");
    vi.stubEnv("PLAYO_PRIVATE_DEMO","1");
    vi.stubEnv("PLAYO_PUBLIC_DEMO","");
    vi.stubEnv("VERCEL_ENV","production");
    expect(()=>paymentProvider()).toThrow(/explicitly enabled demo/);
    vi.stubEnv("VERCEL_ENV","preview");
    await expect(paymentProvider().charge({amountFils:6000,currency:"JOD",idempotencyKey:"demo-test"})).resolves.toMatchObject({status:"PAID"});
    vi.stubEnv("VERCEL_ENV","production");
    vi.stubEnv("PLAYO_PUBLIC_DEMO","1");
    await expect(paymentProvider().charge({amountFils:6000,currency:"JOD",idempotencyKey:"public-demo-test"})).resolves.toMatchObject({status:"PAID"});
  });
});
