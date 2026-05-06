import dotenv from "dotenv";
dotenv.config({ path: "../../../.env" });

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";

import router from "./routes/auth.router";
import { errorMiddleware } from "@packages/error-handler";

const app = express();

/**
 * Load Swagger File
 */
const swaggerPath = path.join(__dirname, "swagger-output.json");

if (fs.existsSync(swaggerPath)) {
  const swaggerDocument = JSON.parse(
    fs.readFileSync(swaggerPath, "utf-8")
  );

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
  );
}

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (_, res) => {
  res.send({ status: "Auth service healthy" });
});

app.use("/api", router);
app.use(errorMiddleware);

const port = process.env.PORT || 6001;

app.listen(port, () => {
  console.log(`Auth Service running on port ${port}`);
});


// // apps/auth-service/src/main.ts
// import dotenv from "dotenv";
// dotenv.config({ path: "../../../.env" });
// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import swaggerUi from "swagger-ui-express";
// import fs from "fs";
// import path from "path";

// import { errorMiddleware } from "@packages/error-handler";
// import router from "./routes/auth.router";



// const app = express();

// /**
//  * Helper function to locate swagger-output.json
//  * Checks multiple potential paths (useful for Nx + Webpack builds)
//  */
// function findSwaggerPath(): string | null {
//   const candidates = [
//     // 1️ When running from compiled dist (webpack output)
//     path.join(__dirname, "swagger-output.json"),
//     // 2️ When running in dev mode (ts-node)
//     path.join(process.cwd(), "apps", "auth-service", "src", "swagger-output.json"),
//     // 3️ Sometimes bundled output may use a nested dist path
//     path.join(process.cwd(), "apps", "auth-service", "dist", "swagger-output.json"),
//     // 4️ Fallback relative to root
//     path.join(process.cwd(), "src", "swagger-output.json"),
//   ];

//   for (const p of candidates) {
//     if (fs.existsSync(p)) {
//       console.log(" Swagger document found at:", p);
//       return p;
//     }
//   }

//   console.error(" No swagger-output.json found in any candidate path:", candidates);
//   return null;
// }

// const swaggerPath = findSwaggerPath();

// // ---------- Middleware Setup ----------
// app.use(
//   cors({
//     origin: ["http://localhost:3000"],
//     allowedHeaders: ["Authorization", "Content-Type"],
//     credentials: true,
//   })
// );

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use(cookieParser());

// // Health check route
// app.get("/", (req, res) => {
//   res.send({ message: "Hello API" });
// });

// app.use((req, res, next) => {
//   console.log("AUTH SERVICE RECEIVED:", req.method, req.url);
//   next();
// });

// // ---------- Swagger Setup ----------
// if (swaggerPath) {
//   // Serve the raw swagger JSON
//   app.get("/docs-json", (req, res) => {
//     res.sendFile(swaggerPath);
//   });

//   // Load swagger JSON for UI
//   const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf-8"));

//   // Serve Swagger UI from CDN (robust option)
//   app.use(
//     "/api-docs",
//     swaggerUi.serve,
//     swaggerUi.setup(swaggerDocument, {
//       explorer: true,
//       customfavIcon:
//         "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.3/favicon-32x32.png",
//       customCssUrl:
//         "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.3/swagger-ui.min.css",
//       customJs: [
//         "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.3/swagger-ui-bundle.min.js",
//         "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.3/swagger-ui-standalone-preset.min.js",
//       ],
//     })
//   );

//   console.log(" Swagger Docs available at http://localhost:5500/api-docs");
// } else {
//   app.get("/api-docs", (req, res) =>
//     res.status(404).send("Swagger documentation file not found.")
//   );
// }

// // ---------- Routes + Error Handling ----------
// app.use("/api", router);
// app.use(errorMiddleware);

// // ---------- Start Server ----------
// const port = process.env.PORT || 6001;
// const server = app.listen(port, () => {
//   console.log(` Auth service running at http://localhost:${port}/api`);
// });


// server.on("error", (err) => {
//   console.error("Server Error:", err);
// });
