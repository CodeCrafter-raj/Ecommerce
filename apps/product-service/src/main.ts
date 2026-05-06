// apps/auth-service/src/main.ts
import dotenv from "dotenv";
dotenv.config({ path: "../../../.env" });
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "@packages/error-handler/index";
import router from "./routes/product.routes";
import "./jobs/product-crone-job"

const app = express();


// ---------- Middleware Setup ----------
app.use(
  cors({
    origin: ["http://localhost:3000"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);

// 🔥 Increase request body size limit for Base64 image uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use(cookieParser());

// Health check route
app.get("/", (req, res) => {
  res.send({ message: "Hello Product API" });
});



// ---------- Routes + Error Handling ----------
app.use("/api", router);
app.use(errorMiddleware);

// ---------- Start Server ----------
const port = process.env.PORT || 6000;
const server = app.listen(port, () => {
  console.log(`Product Service running at http://localhost:${port}/api`);
});

server.on("error", (err) => {
  console.error("Server Error:", err);
});
