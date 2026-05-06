// import express from "express";
// import { Router } from "express";
// import { createShop, createStripeConnectLink, getSeller, getUser, loginSeller, loginUser, refreshToken, registerSeller, resetUserPassword, userForgotPassword, userRegistration, verifySeller, verifyUser, verifyUserForgotPassword } from "../controllers/auth.controller";
// import isAuthenticated from "@packages/middleware";
// import { isSeller } from "@packages/middleware";
import express, { Router } from "express";

import {
  createShop,
  createStripeConnectLink,
  getSeller,
  getUser,
  loginSeller,
  loginUser,
  refreshToken,
  registerSeller,
  resetUserPassword,
  userForgotPassword,
  userRegistration,
  verifySeller,
  verifyUser,
  verifyUserForgotPassword,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  getUserAddresses,
  changePassword,
  getLayoutData
} from "../controllers/auth.controller";

import isAuthenticated from "@packages/middleware/isAuthenticated";
import { isSeller } from "@packages/middleware/authorizeRoles";




const router: Router = express.Router();

router.post("/user-registration", userRegistration);
router.post("/verify-user", verifyUser);
router.post("/login-user", loginUser);
router.post("/refresh-token", refreshToken);
router.get("/logged-in-user", isAuthenticated, getUser);
router.post("/user-forgot-password", userForgotPassword);
router.post("/reset-user-password", resetUserPassword);
router.post("/verify-user-forgot-password", verifyUserForgotPassword);
router.post("/seller-registration", registerSeller);
router.post("/verify-seller", verifySeller);
router.post("/create-shop", createShop);
router.post("/create-stripe-link", createStripeConnectLink);
router.post("/login-seller", loginSeller);
router.get("/logged-in-seller", isAuthenticated, isSeller, getSeller);
router.post("/add-user-address", isAuthenticated, addUserAddress);
router.post("/update-user-address/:addressId", isAuthenticated, updateUserAddress);
router.delete("/delete-user-address/:addressId", isAuthenticated, deleteUserAddress);
router.get("/user-addresses", isAuthenticated, getUserAddresses);
router.post("/change-password", isAuthenticated, changePassword);
router.get("/get-layouts", getLayoutData);

export default router;
