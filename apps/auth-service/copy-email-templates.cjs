// copy-email-templates.cjs
const fs = require("fs");
const path = require("path");

const srcDir = path.resolve("src/utils/email-templates");
const destDir = path.resolve("../../dist/apps/auth-service/src/utils/email-templates"); //

fs.mkdirSync(destDir, { recursive: true });

fs.readdirSync(srcDir).forEach(file => {
  const srcFile = path.join(srcDir, file);
  const destFile = path.join(destDir, file);
  fs.copyFileSync(srcFile, destFile);
  console.log(` Copied: ${file}`);
});