
require("dotenv").config();

const { sendOfferEmail } = require("./email");

async function test() {
  try {
    await sendOfferEmail(
      "4 Pc Hot Wings & Regular Popcorn",
      199
    );
  } catch (error) {
    console.error("Email failed:", error.message);
  }
}

test();
