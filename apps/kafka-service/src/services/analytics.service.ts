import prisma from "@packages/libs/prisma";


export const updateUserAnalytics = async (event: any) => {
  try {
    const existingData = await prisma.userAnalytics.findUnique({
      where: {
        userId: event.userId
      },
      select: { actions: true }
    });

    // let updatedActions: any[] = existingData?.actions || [];
    let updatedActions: any[] = Array.isArray(existingData?.actions)
      ? existingData!.actions
      : [];


    const actionExists = updatedActions.some(
      (entry: any) =>
        entry.productId === event.productId &&
        entry.action === event.action
    );

    // Always store product_view for recommendations
    if (event.action === "product_view") {
      updatedActions.push({
        productId: event.productId,
        shopId: event.shopId,
        action: event.action,
        timestamp: new Date()
      });
    }

    // Add to cart / wishlist (avoid duplicates)
    else if (
      ["add_to_cart", "add_to_wishlist"].includes(event.action) &&
      !actionExists
    ) {
      updatedActions.push({
        productId: event.productId,
        shopId: event.shopId,
        action: event.action,
        timestamp: new Date()
      });
    }

    // Remove from cart
    else if (event.action === "remove_from_cart") {
      updatedActions = updatedActions.filter(
        entry => !(entry.productId === event.productId && entry.action === "add_to_cart")
      );
    }

    // Remove from wishlist
    else if (event.action === "remove_from_wishlist") {
      updatedActions = updatedActions.filter(
        entry => !(entry.productId === event.productId && entry.action === "add_to_wishlist")
      );
    }

    // Keep only the last 50 actions
    while (updatedActions.length > 50) {
      updatedActions.shift();
    }

    const extraFields: Record<string, any> = {};

    if (event.country) extraFields.country = event.country;
    if (event.city) extraFields.city = event.city;
    if (event.device) extraFields.device = event.device;

    await prisma.userAnalytics.upsert({
      where: {
        userId: event.userId
      },

      update: {
        lastVisitTime: new Date(),
        actions: updatedActions,
        ...extraFields
      },

      create: {
        userId: event.userId,
        lastVisitTime: new Date(),
        actions: updatedActions,
        ...extraFields
      }
    });

  } catch (error) {
    console.log("Error updating user analytics", error);
  }
};


export const updateProductAnalytics = async (event: any) => {
  try {
    if (!event.productId) return;

    const updateFields: Record<string, any> = {};

    if (event.action === "product_view") {
      updateFields.views = { increment: 1 };
      updateFields.lastViewedAt = new Date();
    }

    if (event.action === "add_to_cart") {
      updateFields.cartAdds = { increment: 1 };
    }

    if (event.action === "add_to_wishlist") {
      updateFields.wishListAdds = { increment: 1 };
    }

    if (event.action === "remove_from_cart") {
      updateFields.cartAdds = { decrement: 1 };
    }

    if (event.action === "remove_from_wishlist") {
      updateFields.wishListAdds = { decrement: 1 };
    }

    if (event.action === "purchase") {
      updateFields.purchases = { increment: 1 };
    }

    await prisma.productAnalytics.upsert({
      where: { productId: event.productId },

      update: {
        ...updateFields,
        lastViewedAt: new Date(),
      },

      create: {
        productId: event.productId,
        shopId: event.shopId || null,
        views: event.action === "product_view" ? 1 : 0,
        cartAdds: event.action === "add_to_cart" ? 1 : 0,
        wishListAdds: event.action === "add_to_wishlist" ? 1 : 0,
        purchases: event.action === "purchase" ? 1 : 0,
        lastViewedAt: new Date(),
      }
    });

  } catch (error) {
    console.log("Error updating product analytics", error);
  }
};




































// import prisma from "@packages/libs/prisma";

// export const updateUserAnalytics = async (event: any) => {
//   try {
//     const exisitingData = await prisma.userAnalytics.findUnique({
//       where: {
//         userId: event.userId
//       }
//     });

//     let updatedActions: any = exisitingData?.actions || [];

//     const actionExisits = updatedActions.some((entry: any) => entry.productId === event.productId && event.action === event.action);

//     //Always store product view for recommendations
//     if (event.action === "product_view") {
//       updatedActions.push({
//         productId: event?.productId,
//         shopId: event?.shopId,
//         action: event?.action,
//         timestamp: new Date()
//       })
//     }

//     else if (["add_to_cart", "add_to_wishlist"].includes(event.action) && !actionExisits) {
//       updatedActions.push({
//         productId: event?.productId,
//         shopId: event?.shopId,
//         action: event?.action,
//         timestamp: new Date()
//       })
//     }

//     else if (event.action === "remove_from_cart") {
//       updatedActions = updatedActions.filter(
//         (entry: any) =>
//           !(entry.productId === event.productId && entry.action === "add_to_cart")
//       );
//     }
//     //Remove add to cart when remove from cart is triggered
//     else if (event.action === "remove_from_wishlist") {
//       updatedActions = updatedActions.filter(
//         (entry: any) =>
//           !(entry.productId === event.productId && entry.action === "add_to_wishlist")
//       );
//     }

//     //Remove add_to_wishlist when remove from wishlist is triggered
//     else if (event.action === "remove_from_wishlist") {
//       updatedActions = updatedActions.filter(
//         (entry: any) =>
//           !(entry.productId === event.productId && entry.action === "add_to_wishlist")
//       );
//     }

//     //Keep only the last 50 actions(prevent storage overload)
//     if (updatedActions.length > 50) {
//       updatedActions.shift();
//     }

//     const extraFields: Record<string, any> = {};

//     if (event.country) {
//       extraFields.country = event.country;
//     }

//     if (event.city) {
//       extraFields.city = event.city;
//     }

//     if (event.device) {
//       extraFields.device = event.device;
//     }

//     await prisma.userAnalytics.upsert({
//       where: {
//         userId: event.userId
//       },
//       update: {
//         lastVisitTime: new Date(),
//         actions: updatedActions,
//         ...extraFields
//       },
//       create: {
//         userId: event?.userId,
//         lastVisitTime: new Date(),
//         actions: updatedActions,
//         ...extraFields
//       },
//     });


//   } catch (error) {
//     console.log("Error updating user analytics", error);
//   }
// };


// export const updateProductAnalytics = async (event: any) => {
//   try {
//     if (!event.productId) return;

//     const updateFields: Record<string, any> = {};

//     if (event.action === "product_view") {
//       updateFields.views = {
//         increment: 1
//       }
//     }

//     if (event.action === "add_to_cart") {
//       updateFields.cartAdds = {
//         increment: 1
//       }
//     }

//     if (event.action === "add_to_wishlist") {
//       updateFields.wishListAdds = {
//         increment: 1
//       }
//     }

//     if (event.action === "remove_from_cart") {
//       updateFields.cartAdds = {
//         decrement: 1
//       }
//     }

//     if (event.action === "remove_from_wishlist") {
//       updateFields.wishListAdds = {
//         decrement: 1
//       }
//     }

//     if (event.action === "purchase") {
//       updateFields.purchases = {
//         increment: 1
//       }
//     }


//     await prisma.productAnalytics.upsert({
//       where: {
//         productId: event.productId
//       },

//       update: {
//         lastViewed: new Date(),
//         ...updateFields,
//       },

//       create: {
//         productId: event.productId,
//         shopId: event.shopId || null,
//         views: event.action === "product_view" ? 1 : 0,
//         cartAdds: event.action === "add_to_cart" ? 1 : 0,
//         wishListAdds: event.action === "add_to_wishlist" ? 1 : 0,
//         purchases: event.action === "purchase" ? 1 : 0,
//         lastViewedAt: new Date(),
//       }
//     })

//   } catch (error) {
//     console.log("Error updating product analytics", error);
//   }
// };