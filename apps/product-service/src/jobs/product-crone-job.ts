import prisma from "@packages/libs/prisma";
import cron from "node-cron";

cron.schedule("0 * * * *", async () => {
  try {
    const now = new Date();
    console.log("🔥 Running delete cron. Looking for products where deleteAt <= now");

    // Delete products where deletedAt is older than now
    const deletedProducts = await prisma.products.deleteMany({
      where: {
        isDeleted: true,
        deleteAt: { lte: now },
      },
    });
    console.log(`🔥 Deleted ${deletedProducts.count} expired products`);

    console.log(`${deletedProducts.count} expired products permanently deleted.`);
  } catch (error) {
    console.error("Error deleting expired products:", error);
  }
});
