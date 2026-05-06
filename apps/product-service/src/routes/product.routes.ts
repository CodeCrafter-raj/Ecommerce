import express, { Router } from "express";
import { createDiscountCodes, createProduct, deleteDiscountCode, deleteProductImage, getCategories, getDiscountCodes, getShopProducts, uploadProductImage, deleteProduct, restoreProduct, getAllProducts, getProductDetails, getFilteredProducts, getFilteredOffers, searchProducts, getFilteredShops } from "../controllers/product.controller";
import isAuthenticated from "@packages/middleware/isAuthenticated";

const router: Router = express.Router();

router.get("/get-categories", getCategories);
router.post("/create-discount-codes", isAuthenticated, createDiscountCodes);
router.get("/get-discount-codes", isAuthenticated, getDiscountCodes);
router.delete("/delete-discount-code/:id", isAuthenticated, deleteDiscountCode);
router.post("/upload-product-image", isAuthenticated, uploadProductImage);
router.delete("/delete-product-image", isAuthenticated, deleteProductImage);
router.post("/create-product", isAuthenticated, createProduct);
router.get("/get-shop-products", isAuthenticated, getShopProducts);
router.delete("/delete-product/:productId", isAuthenticated, deleteProduct);
router.put("/restore-product/:productId", isAuthenticated, restoreProduct);
router.get("/get-all-products", getAllProducts);
router.get("/get-product-details/:slug", getProductDetails);
router.get("/get-filtered-products", getFilteredProducts);
router.get("/get-filtered-offers", isAuthenticated, getFilteredOffers);
router.get("/get-filtered-shops", getFilteredShops);
router.get("/search-products", searchProducts);
// router.get("/top-shops", topShops);

export default router;