import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "@packages/error-handler";
import router from "./routes/order.routes";
import { createOrderFromStripeWebhook } from "./controllers/order.controller";

const app = express();

// CORS
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
  })
);

// ---------------------------------------------
// STRIPE WEBHOOK — must use raw body
// ---------------------------------------------
app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    (req as any).rawBody = req.body;
    next();
  },
  createOrderFromStripeWebhook   // rename if needed
);


// ---------------------------------------------
// Now enable normal JSON parser
// ---------------------------------------------
app.use(express.json());
app.use(cookieParser());

// ---------------------------------------------
// Normal routes
// ---------------------------------------------
app.get("/", (req, res) => {
  res.send({ message: "Welcome to order-service!" });
});

app.use("/api/order", router); // order routes


app.use(errorMiddleware);

const port = process.env.PORT || 6004;
const server = app.listen(port, () => {
  console.log(`Order Service running at http://localhost:${port}`);
});
server.on("error", console.error);




