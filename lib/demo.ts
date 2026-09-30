/** Mock providers require an explicitly enabled demo environment. */
export function privateDemoEnabled(){
  return process.env.VERCEL_ENV === "preview" && process.env.PLAYO_PRIVATE_DEMO === "1";
}
export function publicDemoEnabled(){
  return process.env.VERCEL_ENV === "production" && process.env.PLAYO_PUBLIC_DEMO === "1";
}
export function demoEnabled(){
  return privateDemoEnabled() || publicDemoEnabled();
}
