//Import the default export safely for ESM + TS (works in nodenext)
// import pkg from "ioredis";
// const { Redis } = pkg as typeof import("ioredis");



import Redis from "ioredis";

// Create client
const redisClient = new Redis(process.env.REDIS_DATABASE_URI!, {
  tls: {},                     // 🔥 Required for Upstash (TLS connection)
  maxRetriesPerRequest: null,  // 🔥 Prevents MaxRetriesPerRequestError
  enableReadyCheck: false,     // 🔥 Avoids ready check issues with cloud Redis
});

// Listen for events
redisClient.on("connect", () => {
  console.log("Redis client has established a connection.");
});

redisClient.on("ready", () => {
  console.log("Redis connection is successful and READY to use!");
});

redisClient.on("error", (err: unknown) => {
  console.error("Redis connection error:", err);
});

// Test the connection (run once)
(async () => {
  try {
    const res = await redisClient.ping();
    console.log("Redis ping successful:", res);
  } catch (err) {
    console.error("Redis ping failed:", err);
  }
})();

export default redisClient;


// import Redis from "ioredis";

// // Create client
// const redisClient = new Redis(process.env.REDIS_DATABASE_URI!);

// // Listen for events
// redisClient.on("connect", () => {
//   console.log("Redis client has established a connection.");
// });

// redisClient.on("ready", () => {
//   console.log("Redis connection is successful and READY to use!");
// });

// redisClient.on("error", (err: unknown) => {
//   console.error("Redis connection error:", err);
// });

// // Test the connection
// (async () => {
//   try {
//     await redisClient.ping();
//     console.log("Redis ping successful!");
//   } catch (err) {
//     console.error("Redis ping failed:", err);
//   }
// })();

// export default redisClient;

















// import Redis from "ioredis";

// console.log('Redis HOST:', process.env.REDIS_DATABASE_URI);


// // Corrected Code
// const redisClient = new Redis(process.env.REDIS_DATABASE_URI!);

// // 1. Listen for connection success
// redisClient.on('connect', () => {
//   console.log(' Redis client has established a connection.');
// });

// // 2. Listen for readiness (the connection is fully active and ready for commands)
// redisClient.on('ready', () => {
//   console.log('Redis connection is successful and READY to use!');
// });

// // 3. Listen for errors
// redisClient.on('error', (err) => {
//   console.error('Redis connection error:', err);
//   // This helps identify issues like wrong credentials, network firewalls, or TLS settings.
// });

// (async () => {
//     // This is what forces the immediate connection attempt
//     await redisClient.ping();
// })();

// export default redisClient;





// // import Redis from "ioredis";

// // // Corrected Code
// // const redisClient=new Redis({
// //   host:process.env.REDIS_HOST || "127.0.0.1",
// //   // Changed "6379" (string) to 6379 (number)
// //   port:Number(process.env.REDIS_PORT) || 6379,
// //   password:process.env.REDIS_PASSWORD,
// // })

// // export default redisClient;








// // import Redis from "ioredis";

// // const redis=new Redis({
// //   host:process.env.REDIS_HOST || "127.0.0.1",
// //   port:Number(process.env.REDIS_PORT) || "6379",
// //   password:process.env.REDIS_PASSWORD,
// // })

// // export default redis;