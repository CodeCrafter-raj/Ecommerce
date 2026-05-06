import express from "express";
import cors from "cors";
import proxy from "express-http-proxy";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ],
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/**
 * Rate limiting should be stateless and gateway-only
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.get("/gateway-health", (_, res) => {
  res.send({ status: "API Gateway is running" });
});

/**
 * Proxy Routes
 */
app.use("/auth", proxy("http://localhost:6001"));
app.use("/product", proxy("http://localhost:6003"));
app.use("/order", proxy("http://localhost:6004"));
// app.use("/chat", proxy("http://localhost:6006"));

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`API Gateway running at http://localhost:${port}`);
});




// import express from 'express';
// import cors from "cors";
// import proxy from "express-http-proxy";
// import morgan from "morgan";
// import rateLimit, { ipKeyGenerator } from 'express-rate-limit'; // <--- IMPORT ipKeyGenerator
// import cookieParser from "cookie-parser";
// import initializeSiteConfig from './libs/initializeSiteConfig';
// import { log } from 'console';

// const app = express();

// app.use(cors({
//   origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
//   allowedHeaders: ["Authorization", "content-type"],
//   credentials: true
// }));

// app.use(morgan("dev"));
// app.use(express.json({ limit: "100mb" }));
// app.use(express.urlencoded({ limit: "100mb", extended: true }));
// app.use(cookieParser());
// app.set("trust proxy", 1);

// //Applying Rate Limit
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: (req: any) => (req.user ? 1000 : 100),
//   message: { error: "Opps!! Too many request... Please Try Again Later!!" },
//   standardHeaders: true,
//   legacyHeaders: true,
//   keyGenerator: (req, res) => ipKeyGenerator(req.ip ?? 'unknown'), //<--- CHANGE: Use the helper function here
// });

// app.use(limiter);


// app.get('/gateway-health', (req, res) => {
//   res.send({ message: 'Welcome to api-gateway!' });
// });


// app.use("/chatting", proxy("http://localhost:6006"));
// app.use("/seller", proxy("http://localhost:6000"));
// app.use("/admin", proxy("http://localhost:6005"));
// app.use("/recommendation", proxy("http://localhost:6007"));
// app.use("/order", proxy("http://localhost:6004"));
// app.use(
//   "/order",
//   proxy("http://localhost:6004", {
//     proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
//       // Forward original cookies (so order-service can read access_token / seller-access-token)
//       proxyReqOpts.headers = proxyReqOpts.headers || {};
//       if (srcReq.headers.cookie) {
//         proxyReqOpts.headers["cookie"] = srcReq.headers.cookie;
//       }
//       // Forward auth header as well if present
//       if (srcReq.headers.authorization) {
//         proxyReqOpts.headers["authorization"] = srcReq.headers.authorization as string;
//       }
//       return proxyReqOpts;
//     },
//     proxyReqPathResolver: (req) => req.originalUrl // keep same pathing
//   })
// );

// app.use("/product", proxy("http://localhost:6000"));
// // app.use("/api", proxy("http://localhost:5500"));
// app.use(
//   "/api",
//   proxy("http://localhost:6000", {
//     proxyReqPathResolver: (req) => {
//       return req.originalUrl; // keep full /api/... route
//     }
//   })
// );



// const port = process.env.PORT || 8080;

// const server = app.listen(port, () => {
//   console.log(`Listening at http://localhost:${port}/api`);
//   try {
//     initializeSiteConfig();
//     console.log("Site Config Initialized");
//   } catch (err) {
//     console.log("Site Config Initialization Failed", err);
//   }
// });
// server.on('error', console.error);

