const fs = require("fs");
const path = require("path");

const source = path.resolve(__dirname, "src", "swagger-output.json");
const destDir = path.resolve(__dirname, "dist");
const dest = path.join(destDir, "swagger-output.json");

try {
  if (!fs.existsSync(source)) {
    console.error(" Source swagger file not found:", source);
    process.exit(1);
  }

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  fs.copyFileSync(source, dest);
  console.log(" Swagger file copied to dist successfully!");
} catch (err) {
  console.error(" Error copying Swagger file:", err);
  process.exit(1);
}
