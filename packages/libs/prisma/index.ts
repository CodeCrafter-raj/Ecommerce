import { PrismaClient } from "@prisma/client";
require("dotenv").config({ path: "./.env" });


declare global {
  namespace globalThis {
    var prismadb: PrismaClient
  }
};

const prisma = new PrismaClient();



if (process.env.NODE_ENV === "production") global.prismadb = prisma;

export default prisma;

// import { PrismaClient } from "@prisma/client";
// require("dotenv").config({ path: "./.env" });

// declare global {
//   // Avoid multiple instances of PrismaClient in dev mode
//   var prismadb: PrismaClient | undefined;
// }

// const prisma = global.prismadb || new PrismaClient();

// if (process.env.NODE_ENV !== "production") global.prismadb = prisma;

// export default prisma;
