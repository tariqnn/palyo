/** Mock providers may run on Vercel only for an explicitly enabled Preview deployment. */
export function privateDemoEnabled(){
  return process.env.VERCEL_ENV === "preview" && process.env.PLAYO_PRIVATE_DEMO === "1";
}
