const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const schemaPath = path.resolve(__dirname, "../../../prisma/schema.prisma");
const swaggerOutputPath = path.resolve(__dirname, "../src/swagger-output.json");
const lastSchemaHashPath = path.resolve(__dirname, "../.schema-hash");

function hashFile(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(data).digest("hex");
}

const currentHash = hashFile(schemaPath);
const previousHash = fs.existsSync(lastSchemaHashPath)
  ? fs.readFileSync(lastSchemaHashPath, "utf8")
  : null;

if (currentHash !== previousHash) {
  console.log("🧩 Prisma schema changed — regenerating Swagger docs...");
  execSync("node src/swagger.js", { stdio: "inherit", cwd: path.resolve(__dirname, "..") });
  fs.writeFileSync(lastSchemaHashPath, currentHash);
} else {
  console.log("✅ No schema changes detected — skipping Swagger regeneration.");
}
