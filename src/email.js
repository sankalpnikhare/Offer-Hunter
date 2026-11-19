
const nodemailer = require("nodemailer");

async function sendOfferEmail(productName, price) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: process.env.ALERT_EMAIL,
        subject: "KFC Offer Alert!",
        text: `


Product: ${productName}
Price: Rs. ${price}


    `
    };

    const result = await transporter.sendMail(mailOptions);

    console.log("Email sent successfully!");
    console.log("Message ID:", result.messageId);
}

module.exports = { sendOfferEmail };
