
require("dotenv").config();

const { chromium } = require("playwright-core");

const ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const API_TOKEN = process.env.CF_API_TOKEN;

const RESTAURANT_URL =
  "https://www.swiggy.com/city/nagpur/kfc-sitabuldi-rest53868";

async function main() {
  let browser;

  try {
    const endpoint =
      `wss://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/browser-run/devtools/browser?keep_alive=600000`;

    console.log("Connecting to Cloudflare...");

    browser = await chromium.connectOverCDP(endpoint, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`
      }
    });

    console.log("Cloudflare connected!");

    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();

    console.log("\nOpening KFC Sitabuldi...");

    const response = await page.goto(RESTAURANT_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    console.log(
      "Restaurant HTTP Status:",
      response?.status()
    );

    await page.waitForTimeout(10000);

    console.log("Page title:", await page.title());
    console.log("Current URL:", page.url());

    // Inspect repeated-order section
    const cards = page.locator(
      '[data-testid="menu-reorder-item"]'
    );

    const count = await cards.count();

    console.log("\nRepeated order cards:", count);

    let found = false;

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const text = await card.innerText();

      if (text.includes("4 Pc Hot Wings & Regular Popcorn")) {
        found = true;

        console.log("\nTARGET PRODUCT FOUND!");
        console.log(text);
      }
    }

    if (!found) {
      console.log("\nTarget product not found.");
      console.log("Login may be required, or the section may not have loaded.");
    }

    await page.screenshot({
      path: "cloudflare-swiggy-test.png",
      fullPage: false
    });

    console.log("\nScreenshot saved.");

  } catch (error) {
    console.error("\nERROR:", error.message);

  } finally {
    if (browser) {
      await browser.close();
      console.log("\nDisconnected from remote browser.");
    }
  }
}

main();
