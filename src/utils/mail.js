const nodemailer = require("nodemailer");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

// Create transporter once
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER,
  port: Number(process.env.SMTP_SERVER_PORT),
  auth: {
    user: process.env.FROM_EMAIL,
    pass: process.env.SMTP_USER_PASSWORD,
  },
});

/**
 * Send an HTML email. Resolves to true when the SMTP server accepted it and
 * false otherwise (the reason is logged). Never throws, so a mail problem
 * can't fail or crash the request that triggered it.
 * (res/data are ignored; kept so existing callers don't need to change.)
 */
const sendTemplateMail = async (to, subject, body, res, data) => {
  const message = { from: process.env.FROM_EMAIL, to, subject, html: body };
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await transporter.sendMail(message);
      return true;
    } catch (err) {
      console.error(
        `[mail] "${subject}" to ${to} failed (attempt ${attempt}/3): ${err.code || ""} ${err.response || err.message}`
      );
      // Wrong credentials won't fix themselves on a retry
      if (err.code === "EAUTH") break;
    }
  }
  return false;
};

module.exports = { sendTemplateMail };
