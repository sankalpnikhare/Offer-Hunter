
require("dotenv").config();

const { chromium } = require("playwright");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

const { sendOfferEmail } = require("./email");

const TARGET_ITEM = "4 Pc Hot Wings & Regular Popcorn";
const MAX_PRICE = 250;

const STATE_DIR = path.join(__dirname, "../data");
const STATE_FILE = path.join(STATE_DIR, "alert-state.json");

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { alerted: false };
  }
}

function saveState(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function main() {
  let browser;

  try {
    browser = await chromium.connectOverCDP(
      "http://127.0.0.1:9222"
    );

    console.log("Connected to Chrome!");

    const context = browser.contexts()[0];

    let page = context.pages().find(p =>
      p.url().includes("swiggy.com")
    );

    if (!page) {
      throw new Error("Swiggy tab not found.");
    }

    console.log("Current page:", page.url());

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    await new Promise(resolve => {
      rl.question(
        "Open KFC Sitabuldi and wait for Want to repeat? Then press ENTER: ",
        resolve
      );
    });

    rl.close();

    const cards = page.locator(
      '[data-testid="menu-reorder-item"]'
    );

    const count = await cards.count();

    console.log("Repeated order cards:", count);

    let offerFound = false;

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);

      const name = await card
        .locator(".sc-dlfnOL")
        .first()
        .innerText();

      if (name.trim() !== TARGET_ITEM) continue;

      offerFound = true;

      const priceText = await card
        .locator(".sc-gLnqCc .sc-dlfnOL")
        .innerText();

      const price = Number(
        priceText.replace(/[^\d.]/g, "")
      );

      if (!Number.isFinite(price)) {
        throw new Error("Invalid product price: " + priceText);
      }

      console.log("\nTARGET ITEM FOUND!");
      console.log("Product:", name);
      console.log("Price: ₹", price);

      const state = readState();

      if (price < MAX_PRICE) {
        if (!state.alerted) {
          console.log("\nPrice condition met. Sending email...");

          await sendOfferEmail(name, price);

          saveState({
            alerted: true,
            lastPrice: price,
            lastAlertedAt: new Date().toISOString()
          });

          console.log("Offer notification sent!");
        } else {
          console.log("Already alerted for this offer.");
        }
      } else {
        console.log("Price is not below ₹250.");

        // Reset so a future discounted offer can trigger an alert.
        saveState({ alerted: false });
      }

      break;
    }

    if (!offerFound) {
      console.log("Target item is not present.");

      saveState({ alerted: false });
    }

  } catch (error) {
    console.error("\nERROR:", error.message);

  } finally {
    if (browser) {
      await browser.close();
      console.log("Playwright disconnected.");
    }
  }
}

main();
