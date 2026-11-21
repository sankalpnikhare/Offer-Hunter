
require("dotenv").config();

const { chromium } = require("playwright-core");
const readline = require("readline");

async function main() {
  let browser;

  try {
    const endpoint =
      `wss://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/browser-run/devtools/browser?keep_alive=1200000`;

    console.log("Connecting to Cloudflare...");

    browser = await chromium.connectOverCDP(endpoint, {
      headers: {
        Authorization: `Bearer ${process.env.CF_API_TOKEN}`
      }
    });

    console.log("Remote browser connected!");

    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();

    console.log("Opening Swiggy...");

    await page.goto("https://www.swiggy.com", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // Generate a Live View URL
    const cdp = await context.newCDPSession(page);

    const { devtoolsFrontendUrl } = await cdp.send(
      "Cloudflare.getLiveView",
      {
        mode: "tab",
        expiresInMs: 3600000
      }
    );

    console.log("\n==================================");
    console.log("OPEN THIS LIVE VIEW LINK:");
    console.log(devtoolsFrontendUrl);
    console.log("==================================");

    console.log("\nLog into Swiggy using the remote browser.");
    console.log("Navigate to KFC Sitabuldi.");
    console.log("Wait until the repeated-orders section appears.");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    await new Promise(resolve => {
      rl.question(
        "\nPress ENTER after completing login and navigation: ",
        resolve
      );
    });

    rl.close();

    console.log("\nCurrent URL:", page.url());
    console.log("Page title:", await page.title());

    const cards = page.locator(
      '[data-testid="menu-reorder-item"]'
    );

    const count = await cards.count();

    console.log("Repeated order cards:", count);

    for (let i = 0; i < count; i++) {
      const text = await cards.nth(i).innerText();

      console.log(`\nCard ${i + 1}:`, text);

      if (text.includes("4 Pc Hot Wings & Regular Popcorn")) {
        console.log("\nTARGET PRODUCT FOUND!");
      }
    }

  } catch (error) {
    console.error("\nERROR:", error.message);

  } finally {
    if (browser) {
      await browser.close();
      console.log("\nDisconnected from Cloudflare.");
    }
  }
}

main();
