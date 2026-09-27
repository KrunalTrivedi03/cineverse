const { sendEmail }      = require("../services/emailService");
const buildEmailTemplate = require("./emailTemplateBuilder");

/**
 * Sends a one-time welcome email to a user who just created an account via Google.
 *
 * @param {object} params
 * @param {string} params.toEmail
 * @param {string} params.toName
 */
async function sendWelcomeEmail({ toEmail, toName }) {
  const html = buildEmailTemplate({
    template: "welcomeGoogle.html",
    title:    "Welcome to NOW",
    subtitle: "ACCOUNT CREATED",
    heading:  `Hey ${toName}, you're in!`,
    replacements: {
      USERNAME:   toName,
      EMAIL:      toEmail,
      CLIENT_URL: (process.env.CLIENT_URL || "").replace(/\/$/, ""),
    },
  });

  await sendEmail({
    to:      toEmail,
    subject: "🎬 Welcome to NOW!",
    html,
  });
}

module.exports = sendWelcomeEmail;