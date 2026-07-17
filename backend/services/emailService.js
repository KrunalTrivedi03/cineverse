// const nodemailer = require("nodemailer");

// exports.sendEmail = async ({ to, subject, html }) => {
//   // Create transporter here so env vars are guaranteed to be loaded
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   console.log("EMAIL_USER:", process.env.EMAIL_USER);
//   console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "loaded ✓" : "MISSING ✗");

//   const info = await transporter.sendMail({
//     from: `"Encore" <${process.env.EMAIL_USER}>`,
//     to,
//     subject,
//     html,
//   });

//   console.log("Email sent:", info.messageId);
//   return info;
// };

const SibApiV3Sdk = require("sib-api-v3-sdk");

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

exports.sendEmail = async ({ to, subject, html }) => {
  try {
    const result = await emailApi.sendTransacEmail({
      sender: { email: process.env.EMAIL_USER, name: "Encore" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });

    console.log("Email sent:", result.messageId);
    return result;
  } catch (err) {
    console.error("Brevo error:", err.response?.body || err.message);
    throw new Error(err.response?.body?.message || "Failed to send email");
  }
};