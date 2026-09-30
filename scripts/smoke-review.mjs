import { chromium } from "playwright";

const browser=await chromium.launch({channel:"chrome",headless:true});
const context=await browser.newContext({baseURL:"http://localhost:3000"});
const page=await context.newPage();
try{
  await page.goto("/login");
  await page.getByLabel("Email").fill("salma27@playo.local");
  await page.getByLabel("Password").fill("PlayoDemo2026!");
  await page.getByRole("button",{name:"Log In"}).click();
  await page.waitForURL("**/games");
  await page.goto("/bookings?tab=past");
  const completed=page.locator(".card").filter({hasText:"COMPLETED"}).first();
  if(!await completed.count())throw new Error("Seed has no completed booking for demo player");
  await completed.getByRole("link",{name:"View"}).click();
  await page.getByRole("link",{name:"Reviews"}).click();
  await page.locator('select[name="venue"]').selectOption("4");
  await page.locator('textarea[name="body"]').fill("Well organized session and a good pitch.");
  await page.getByRole("button",{name:"Save review"}).click();
  await page.waitForURL("**tab=reviews&notice=**");
  if(!await page.getByText("Well organized session and a good pitch.").count())throw new Error("Review was not shown");
  console.log("PASS completed player review saved and displayed");
}finally{await browser.close();}
