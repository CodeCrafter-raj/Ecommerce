//get product categories

import { AuthError, ValidationError } from "@packages/error-handler";
import prisma from "@packages/libs/prisma";
import { NextFunction, Request, Response } from "express";
import { parse } from "path";
import { imageKit } from "@packages/libs/imagekit";
import { Prisma } from "@prisma/client";

// get product categories
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const config = await prisma.site_config.findFirst();

    if (!config) {
      return res.status(404).json({ message: "Site configuration not found" });
    }
    return res.status(200).json({
      categories: config.categories,
      subCategories: config.subCategories,
    });
  } catch (error) {
    return next(error);
  }
};

export const createDiscountCodes = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { public_name, discountType, discountValue, discountCode } = req.body;

    const isDiscountCodeExist = await prisma.discount_codes.findUnique({
      where: {
        discountCode: discountCode,
      },
    });
    if (isDiscountCodeExist) {
      return next(
        new ValidationError(
          "Discount code already exists, Please use a different code!"
        )
      );
    }

    const discount_code = await prisma.discount_codes.create({
      data: {
        public_name,
        discountType,
        discountValue: parseFloat(discountValue),
        discountCode,
        sellerId: req.seller.id,
      },
    });

    return res
      .status(201)
      .json({ message: "Discount code created successfully", discount_code });
  } catch (error) {
    return next(error);
  }
};

//Get Discount Codes
export const getDiscountCodes = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const discount_codes = await prisma.discount_codes.findMany({
      where: {
        sellerId: req.seller.id,
      },
    });
    return res.status(201).json({
      success: true,
      discount_codes,
    });
  } catch (error) {
    return next(error);
  }
};

//Delete Discount Code
export const deleteDiscountCode = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const sellerId = req.seller?.id;
    const discountCode = await prisma.discount_codes.findUnique({
      where: { id: id },
      select: { id: true, sellerId: true },
    });

    if (!discountCode || discountCode.sellerId !== sellerId) {
      return next(
        new ValidationError(
          "Discount code not found or you are not authorized to delete this code"
        )
      );
    }
    await prisma.discount_codes.delete({
      where: { id: id },
    });

    return res.status(200).json({
      message: "Discount code deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};



export const uploadProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileBase64 } = req.body;

    const response = await imageKit.upload({
      file: fileBase64,
      fileName: `product-${Date.now()}.jpg`,
      folder: "/products",
    });

    res.status(201).json({
      file_url: response.url,
      fileId: response.fileId, // 🔥 FIXED
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileId } = req.body;
    const response = await imageKit.deleteFile(fileId);
    res.status(201).json({
      success: true,
      response,
    });
  } catch (error) {
    return next(error);
  }
};

export const createProduct = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
      short_description,
      detailed_description,
      warranty,
      custom_specifications,
      slug,
      tags,
      cashOnDelivery = [],
      brand,
      video_url,
      category,
      colors,
      sizes = [],
      discount_codes = [],
      stock,
      sale_price,
      regular_price,
      subCategory,
      custom_properties = {},
      images = [],
    } = req.body;

    // --------------------- VALIDATION ---------------------
    if (
      !title ||
      !slug ||
      !short_description ||
      !category ||
      !subCategory ||
      !sale_price ||
      !images ||
      !tags ||
      !stock ||
      !regular_price
    ) {
      return next(new ValidationError("Missing required fields"));
    }

    if (!req.seller?.id || !req.seller?.shop?.id) {
      return next(new AuthError("Only seller can create products!"));
    }

    // ------------------ Slug Uniqueness Check ------------------
    const slugChecking = await prisma.products.findUnique({
      where: { slug },
    });

    if (slugChecking) {
      return next(
        new ValidationError("Slug already exist! Please use a different slug!")
      );
    }

    // -------------------- IMAGE DEBUG LOGS ---------------------
    console.log("🟦 Incoming images from frontend:", images);

    const formattedImages = images
      .filter((img: any) => img && img.file_id && img.url)
      .map((img: any) => ({
        file_id: img.file_id,
        url: img.url,
      }));

    console.log("🟪 Images mapped for Prisma:", formattedImages);

    // --------------------- PRODUCT CREATION ---------------------
    const newProduct = await prisma.products.create({
      data: {
        title,
        short_description,
        detailed_description,
        warranty,
        slug,
        shopId: req.seller.shop.id,

        tags: Array.isArray(tags) ? tags : tags.split(","),

        brand,
        video_url,
        category,
        subCategory,
        colors,
        sizes,
        stock: parseInt(stock),
        sale_price: parseFloat(sale_price),
        regular_price: parseFloat(regular_price),
        custom_properties,
        custom_specifications,
        cashOnDelivery,
        discount_codes,

        images: {
          create: formattedImages,
        },
      },
      include: { images: true },
    });

    return res.status(201).json({
      success: true,
      newProduct,
    });
  } catch (error) {
    return next(error);
  }
};

//get logged in seller products
export const getShopProducts = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const products = await prisma.products.findMany({
      where: {
        shopId: req?.seller?.shop?.id,
      },
      include: {
        images: true,
      },
    });
    res.status(201).json({
      success: true,
      products,
    });
    console.log("🔥 getShopProducts controller running");
  } catch (error) {
    return next(error);
  }
};

// delete product
export const deleteProduct = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const sellerId = req.seller?.shop?.id;

    const product = await prisma.products.findUnique({
      where: { id: productId },
      select: { id: true, shopId: true, isDeleted: true },
    });

    if (!product) {
      return next(new ValidationError("Product not found"));
    }

    if (product.shopId != sellerId) {
      return next(new ValidationError("Unauthorized action"));
    }

    if (product.isDeleted) {
      return next(new ValidationError("Product is already deleted"));
    }

    const deletedProduct = await prisma.products.update({
      where: { id: productId },
      data: {
        isDeleted: true,
        deleteAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours later
      },
    });

    return res.status(200).json({
      message:
        "Product is scheduled for deletion in 24 hours. You can restore it within this time.",
      deleteAt: deletedProduct.deleteAt,
    });
  } catch (error) {
    return next(error);
  }
};

// restore product
export const restoreProduct = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const sellerId = req.seller?.shop?.id;

    const product = await prisma.products.findUnique({
      where: { id: productId },
      select: { id: true, shopId: true, isDeleted: true },
    });

    if (!product) {
      return next(new ValidationError("Product not found"));
    }

    if (product.shopId != sellerId) {
      return next(new ValidationError("Unauthorized action"));
    }

    if (!product.isDeleted) {
      return res.status(400).json({
        message: "Product is not in deleted state",
      });
    }

    await prisma.products.update({
      where: { id: productId },
      data: { isDeleted: false, deleteAt: null },
    });

    return res.status(200).json({
      message: "Product successfully restored!",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error restoring product",
      error,
    });
  }
};

export const getAllProducts = async (

  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type;

    const baseFilter = {
      OR: [{ starting_date: null }, { ending_date: null }],
    };

    // Sorting based on type
    const orderBy: Prisma.productsOrderByWithRelationInput =
      type === "latest" ? { createdAt: "desc" } : { sale_price: "desc" }; // REPLACED totalSales

    const [products, total, top10Products] = await Promise.all([
      prisma.products.findMany({
        skip,
        take: limit,
        include: {
          images: true,
          shop: true,
        },
        where: {}, // ← REMOVE FILTER
        orderBy: { createdAt: "desc" },
      }),

      prisma.products.count(),

      prisma.products.findMany({
        take: 10,
        where: {},
        orderBy,
      }),
    ]);

    return res.status(200).json({
      products,
      top10By: type === "latest" ? "latest" : "topSales",
      top10Products,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return next(error);
  }
};


export const getProductDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await prisma.products.findUnique({
      where: {
        slug: req.params.slug!,
      },
      include: {
        images: true,
        shop: true,
      },
    });
    res.status(201).json({
      success: true,
      product,
    });

  } catch (error) {
    return next(error);
  }
}

//getFiltered Products
export const getFilteredProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      priceRange = "0,200000",
      page = 1,
      limit = 10,
      colors = [],
      sizes = [],
      categories = []
    } = req.query;

    const parsedPriceRange: number[] =
      typeof priceRange === "string"
        ? priceRange.split(",").map(Number)
        : Array.isArray(priceRange)
          ? priceRange.map(Number)
          : [0, 200000];

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    const filters: Record<string, any> = {
      sale_price: {
        gte: parsedPriceRange[0],
        lte: parsedPriceRange[1],
      },
    };

    if (categories && (categories as string[]).length > 0) {
      filters.category = {
        in: Array.isArray(categories)
          ? categories
          : String(categories).split(","),
      };
    }

    if (colors && (colors as string[]).length > 0) {
      filters.color = {
        hasSome: Array.isArray(colors) ? colors : [colors],
      };
    }

    if (sizes && (sizes as string[]).length > 0) {
      filters.size = {
        hasSome: Array.isArray(sizes) ? sizes : [sizes],
      };
    }

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where: filters,
        skip,
        take: parsedLimit,
        include: {
          images: true,
          shop: true,
        },
      }),
      prisma.products.count({ where: filters }),
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    return res.status(200).json({
      products,
      pagination: {
        total,
        page: parsedPage,
        totalPages,
      },
    });

  } catch (error) {
    return next(error);
  }
};





//getFilteredOffers
export const getFilteredOffers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      priceRange = [0, 1000],
      page = 1,
      limit = 10,
      colors = [],
      sizes = [],
      categories = []
    } = req.query;

    const parsedPriceRange: number[] =
      typeof priceRange === "string"
        ? priceRange.split(",").map(Number)
        : Array.isArray(priceRange)
          ? priceRange.map(Number)
          : [0, 1000];

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    const filters: Record<string, any> = {
      sale_price: {
        gte: parsedPriceRange[0],
        lte: parsedPriceRange[1],
      },
      NOT: { starting_date: null },
    };

    if (categories && (categories as string[]).length > 0) {
      filters.category = {
        in: Array.isArray(categories)
          ? categories
          : String(categories).split(","),
      };
    }

    if (colors && (colors as string[]).length > 0) {
      filters.color = {
        hasSome: Array.isArray(colors) ? colors : [colors],
      };
    }

    if (sizes && (sizes as string[]).length > 0) {
      filters.size = {
        hasSome: Array.isArray(sizes) ? sizes : [sizes],
      };
    }

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where: filters,
        skip,
        take: parsedLimit,
        include: {
          images: true,
          shop: true,
        },
      }),
      prisma.products.count({ where: filters }),
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    return res.status(200).json({
      products,
      pagination: {
        total,
        page: parsedPage,
        totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
};


//search products

export const getFilteredShops = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      categories = [],
      countries = [],
      page = 1,
      limit = 10,
    } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    const filters: Record<string, any> = {};

    if (categories && (categories as string[]).length > 0) {
      filters.category = {
        in: Array.isArray(categories)
          ? categories
          : String(categories).split(","),
      };
    }

    if (countries && String(countries).length > 0) {
      filters.country = {
        in: Array.isArray(countries)
          ? countries
          : String(countries).split(","),
      };
    }

    // Prevent empty filter → prevents full table scan
    if (Object.keys(filters).length === 0) {
      filters.id = { not: undefined };
    }

    // Sequential queries (no DB overload)
    const shops = await prisma.shops.findMany({
      where: filters,
      skip,
      take: parsedLimit,
      include: {
        //sellers: true,
        products: true,
      },
    });

    const total = await prisma.shops.count({ where: filters });

    const totalPages = Math.ceil(total / parsedLimit);

    return res.status(200).json({
      shops,
      pagination: {
        total,
        page: parsedPage,
        totalPages,
      },
    });

  } catch (error) {
    return next(error);
  }
};




export const searchProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = req.query.q as string;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    };

    const products = await prisma.products.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query,
              mode: "insensitive"
            }
          }, {
            short_description: {
              contains: query,
              mode: "insensitive"
            }
          }
        ]
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
      take: 10,
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.status(200).json({
      success: true,
      products
    })

  } catch (error) {
    return next(error);
  }
};



//top shops
// export const topShops = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const topshopsData = await prisma.orders.findMany({
//       by: ["shopId"],
//       _sum: {
//         total: true,
//       },
//       orderBy: {
//         _sum: {
//           total: "desc"
//         }
//       },
//       take: 10,
//     })

//     const shopIds = topshopsData.map((item: any) => item.shopId)

//     const shops = await prisma.shops.findMany({
//       where: {
//         id: {
//           in: shopIds
//         }
//       },
//       select: {
//         id: true,
//         name: true,
//         avatar: true,
//         coverBanner: true,
//         address: true,
//         ratings: true,
//         // followers:true,
//         category: true,
//       }
//     });

//     const enrichedShops = shops.map((shop: any) => {
//       const salesData = topshopsData.find((item: any) => item.shopId === shop.id)
//       return {
//         ...shop,
//         sales: salesData ? salesData._sum.total : 0
//       }
//     })

//     const toptenShops = enrichedShops.sort((a: any, b: any) => b.sales - a.sales).slice(0, 10)

//     return res.status(200).json({
//       success: true,
//       toptenShops
//     })

//   } catch (error) {
//     return next(error);
//   }
// };