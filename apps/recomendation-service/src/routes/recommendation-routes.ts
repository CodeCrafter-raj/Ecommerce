import express, { Router } from "express";
import isAuthenticated from "@packages/middleware/isAuthenticated";
import { getRecommenedProducts } from "../controllers/recommendation-controller";

const router: Router = express.Router();


router.get("/recommendations", isAuthenticated, getRecommenedProducts);

export default router;
