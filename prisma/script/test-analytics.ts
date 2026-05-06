// test-analytics.ts (temp)
import prisma from "@prisma/client";

async function test() {
  await prisma.userAnalytics.upsert({
    where: { userId: "000000000000000000000000" },
    update: { lastVisitTime: new Date(), actions: [] },
    create: { userId: "000000000000000000000000", lastVisitTime: new Date(), actions: [] },
  });

  const u = await prisma.userAnalytics.findUnique({ where: { userId: "000000000000000000000000" } });
  console.log('userAnalytics found:', u);

  await prisma.productAnalytics.upsert({
    where: { productId: "product-test-1" },
    update: { views: { increment: 1 }, lastViewedAt: new Date() },
    create: { productId: "product-test-1", views: 1, cartAdds: 0, wishListAdds: 0, purchases: 0, lastViewedAt: new Date() }
  });

  const p = await prisma.productAnalytics.findUnique({ where: { productId: "product-test-1" } });
  console.log('productAnalytics found:', p);
}

test().catch(console.error).finally(() => process.exit());
