import { afterEach, describe, expect, it, vi } from "vitest";
import { paymentProvider } from "./payment";

afterEach(()=>vi.unstubAllEnvs());

describe("private demo payment guard",()=>{
  it("allows simulated payment only on an explicitly enabled Vercel Preview",async()=>{
    vi.stubEnv("NODE_ENV","production");
    vi.stubEnv("PLAYO_PRIVATE_DEMO","1");
    vi.stubEnv("VERCEL_ENV","production");
    expect(()=>paymentProvider()).toThrow(/private Vercel Preview/);
    vi.stubEnv("VERCEL_ENV","preview");
    await expect(paymentProvider().charge({amountFils:6000,currency:"JOD",idempotencyKey:"demo-test"})).resolves.toMatchObject({status:"PAID"});
  });
});
