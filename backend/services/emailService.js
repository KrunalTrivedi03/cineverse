const nodemailer = require("nodemailer");

exports.sendEmail = async ({ to, subject, html }) => {
  // Create transporter here so env vars are guaranteed to be loaded
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "loaded ✓" : "MISSING ✗");

  const info = await transporter.sendMail({
    from: `"CineVerse" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log("Email sent:", info.messageId);
  return info;
};