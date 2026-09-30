import { chromium } from "playwright";
const browser=await chromium.launch({channel:"chrome",headless:true});
const baseURL="http://localhost:3000";
async function signedIn(email){const context=await browser.newContext({baseURL});const page=await context.newPage();await page.goto("/login");await page.getByLabel("Email").fill(email);await page.getByLabel("Password").fill("PlayoDemo2026!");await page.getByRole("button",{name:"Log In"}).click();await page.waitForURL("**/games",{timeout:15000});return {context,page};}
try{
 const player=await signedIn("player@playo.local");
 await player.page.goto("/admin");await player.page.waitForURL("**/games",{timeout:15000});
 console.log("PASS player denied admin access");
 const scorekeeper=await signedIn("scorekeeper@playo.local");
 await scorekeeper.page.goto("/admin/analytics");await scorekeeper.page.waitForURL("**/admin",{timeout:15000});
 console.log("PASS scorekeeper denied platform analytics");
 await player.page.goto("/bookings");
 const gameHref=await player.page.locator('a[href^="/games/"]').first().getAttribute("href");
 if(!gameHref)throw new Error("Demo player has no game booking");
 const gameId=gameHref.split("/").at(-1);
 const organizer=await signedIn("organizer@playo.local");
 await organizer.page.goto(`/admin/games/${gameId}`);
 if(await organizer.page.getByRole("button",{name:"Create Stream"}).count()){
  await organizer.page.locator('select[name="visibility"]').selectOption("PRIVATE");
  await organizer.page.getByRole("button",{name:"Create Stream"}).click();
  await organizer.page.waitForURL("**/admin/games/*?notice=**",{timeout:15000});
 }
 const viewer=await organizer.page.getByRole("link",{name:"Viewer page →"}).getAttribute("href");
 if(!viewer)throw new Error("Stream viewer link missing");
 await player.page.goto(viewer);
 if(!((await player.page.locator("body").innerText()).includes("This stream is private")))throw new Error("Participant could view private stream");
 const admin=await signedIn("admin@playo.local");await admin.page.goto(viewer);
 if(!((await admin.page.locator("body").innerText()).includes("Video is not available")))throw new Error("Admin could not view private stream page");
 console.log("PASS private stream requires organizer or admin");
 await Promise.all([player.context.close(),scorekeeper.context.close(),organizer.context.close(),admin.context.close()]);
}finally{await browser.close();}
