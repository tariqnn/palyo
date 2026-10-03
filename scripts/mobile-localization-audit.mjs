import { chromium, devices } from "playwright";

const baseURL = process.env.AUDIT_BASE_URL || "http://localhost:3000";
const profiles = [
  ["iPhone 13", devices["iPhone 13"]],
  ["Pixel 7", devices["Pixel 7"]],
];
const routes = ["/", "/login", "/games", "/venues", "/privacy", "/terms"];
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const [deviceName, device] of profiles) {
    for (const locale of ["en", "ar"]) {
      const context = await browser.newContext(device);
      await context.addCookies([{ name: "playup_locale", value: locale, url: baseURL }]);
      const page = await context.newPage();
      const errors = [];
      page.on("console", (message) => {
        if (message.type() === "error" && !message.text().includes("/_next/hmr")) errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));

      for (const route of routes) {
        const response = await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
        await page.waitForFunction(() => document.body.dataset.localized === "true", undefined, { timeout: 30_000 });
        await page.waitForTimeout(300);
        const state = await page.evaluate(() => ({
          lang: document.documentElement.lang,
          dir: document.documentElement.dir,
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          text: document.body.innerText,
        }));
        const expectedDirection = locale === "ar" ? "rtl" : "ltr";
        const hasArabic = /[\u0600-\u06FF]/.test(state.text);
        if (!response?.ok() || state.lang !== locale || state.dir !== expectedDirection || state.overflow || (locale === "ar" && !hasArabic)) {
          throw new Error(`${deviceName} ${locale} ${route} failed: ${JSON.stringify({ status: response?.status(), ...state, text: state.text.slice(0, 300), hasArabic, errors })}`);
        }
      }

      if (errors.length) throw new Error(`${deviceName} ${locale} console errors: ${errors.join(" | ")}`);
      results.push({ device: deviceName, locale, routes: routes.length, status: "passed" });
      await context.close();
    }
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(results, null, 2));
