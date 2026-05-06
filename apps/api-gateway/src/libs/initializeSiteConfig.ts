import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const initializeSiteConfig = async () => {
  try {
    const existingConfig = await prisma.site_config.findFirst();
    if (!existingConfig) {
      await prisma.site_config.create({ 
        data: { 
          categories: [
            "Electronics", 
            "Fashion", 
            "Home & Garden",
            "Health & Beauty",
            "Sports & Outdoors",
            "Toys & Hobbies",
            "Automotive",
            "Books & Media"
          ], 
          subCategories: {
            "Electronics":["Mobile Phones", "Laptops", "Cameras", "Televisions"],
            "Fashion":["Men's Clothing", "Women's Clothing", "Accessories", "Footwear"],
            "Home & Garden":["Furniture", "Kitchen & Dining", "Bedding", "Garden Tools"],
            "Health & Beauty":["Skincare", "Makeup", "Haircare", "Personal Care"],
            "Sports & Outdoors":["Fitness Equipment", "Outdoor Gear", "Sportswear", "Cycling"],
            "Toys & Hobbies":["Action Figures", "Dolls", "Puzzles", "Board Games"],
            "Automotive":["Car Accessories", "Motorcycle Parts", "Tools & Equipment", "Oils & Fluids"],
            "Books & Media":["Fiction", "Non-Fiction", "Comics", "Educational"]  
          } 
        } 
      });
    }
  } catch (error) {
    console.log("Error initializing site config:",error);
  }
};

export default initializeSiteConfig;
