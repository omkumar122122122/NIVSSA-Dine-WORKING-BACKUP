const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

async function sendTestEmail() {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "NIVSSA Dine Email Test",
      text: "Hello! NIVSSA Dine email system is working successfully.",
    });

    console.log("EMAIL SENT SUCCESSFULLY ✅");
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.log("EMAIL FAILED ❌");
    console.log(error.message);
  }
}

sendTestEmail();