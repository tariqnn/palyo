/** Mock providers require an explicitly enabled demo environment. */
const flag = (current:string, legacy:string) => process.env[current] ?? process.env[legacy];

export function privateDemoEnabled(){
  return process.env.VERCEL_ENV === "preview" && flag("PLAYUP_PRIVATE_DEMO", "PLAYO_PRIVATE_DEMO") === "1";
}
export function publicDemoEnabled(){
  return process.env.VERCEL_ENV === "production" && flag("PLAYUP_PUBLIC_DEMO", "PLAYO_PUBLIC_DEMO") === "1";
}
export function demoEnabled(){
  return privateDemoEnabled() || publicDemoEnabled();
}
