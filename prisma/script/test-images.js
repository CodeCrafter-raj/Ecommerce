// CommonJS version — works with Node immediately
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  try {
    const img = await prisma.images.create({
      data: {
        file_id: "TEST_FILE_ID_" + Date.now(),
        url: "https://example.com/test.jpg",
        // productId: "someExistingProductId"  // optional for now
      },
    });

    console.log("CREATE IMAGE OK:", img);
  } catch (err) {
    console.error("CREATE IMAGE ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
