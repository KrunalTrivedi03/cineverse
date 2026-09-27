const fs = require("fs");
const path = require("path");

module.exports = function buildEmailTemplate(options) {
  const base = fs.readFileSync(
    path.join(__dirname, "../templates/layouts/baseLayout.html"),
    "utf-8"
  );

  const content = fs.readFileSync(
    path.join(__dirname, `../templates/${options.template}`),
    "utf-8"
  );

  let logo = "";
  try {
    logo = fs.readFileSync(
      path.join(__dirname, "../templates/partials/movieLogo.svg"),
      "utf-8",
    );
  } catch (err) {
    console.warn("Logo not found, using fallback text");
    logo = "<h2 style='color:white;'>NOW</h2>";
  }

  let finalContent = content;

  Object.keys(options.replacements).forEach(key => {
    finalContent = finalContent.replace(
      new RegExp(`{{${key}}}`, "g"),
      options.replacements[key]
    );
  });

  return base
    .replace("{{TITLE}}", options.title)
    .replace("{{SUBTITLE}}", options.subtitle)
    .replace("{{HEADING}}", options.heading)
    .replace("{{LOGO}}", logo)
    .replace("{{CONTENT}}", finalContent)
    .replace("{{YEAR}}", new Date().getFullYear());
};