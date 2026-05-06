
import { Request, Response, NextFunction } from "express";

import {
  validateRegistrationData,
  checkOTPRestrictions,
  trackOtpRequests,
  sendOTP,
  verifyOtp,
  handleForgotPassword,
  verifyForgotPasswordOtp
} from "../utils/auth.helper";

import prisma from "@packages/libs/prisma";
import { AuthError, NotFoundError, ValidationError } from "@packages/error-handler";

import bcrypt from "bcryptjs";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { sendLog } from "@packages/utils/logs/send-logs";

import setCookie from "../utils/cookie/setCookie";
import Stripe from "stripe";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover"
})

export const userRegistration = async (
  // Corrected: Request first, then Response 
  req: Request, res: Response, next: NextFunction
) => {
  try {
    // Assuming validateRegistrationData, prisma, ValidationError, 
    // checkOTPRestrictions, trackOtpRequests, and sendOTP are defined/imported.
    validateRegistrationData(req.body, "user");
    const { name, email } = req.body;

    // Corrected: Prisma syntax requires { field: value }
    const existingUser = await prisma.users.findUnique({ where: { email } });

    if (existingUser) {
      return next(new ValidationError("User already exists with this email!"));
    };

    await checkOTPRestrictions(email, next);
    await trackOtpRequests(email, next);
    await sendOTP(name, email, "user-activation-mail");


    res.status(200).json({
      message: "OTP send to email.Please verify your account.",
    });
  } catch (err) {
    // Corrected: Use the caught error variable 'err'
    return next(err);
  }
};


//Verify user with otp
export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const { email, otp, password, name } = req.body;
    if (!email || !otp || !password || !name) {
      return next(new ValidationError("All fields are required"));
    }

    const existingUser = await prisma.users.findUnique({ where: { email } });

    if (existingUser) {
      return next(new ValidationError("User already exists with this email!"));
    }

    await verifyOtp(email, otp, next);

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.users.create({
      data: { name, email, password: hashedPassword },
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
    });


  } catch (error) {
    return next(error);
  }

}



export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ValidationError("Email and password are required!"));
    }

    const user = await prisma.users.findUnique({ where: { email: email.toLowerCase() } });


    if (!user) return next(new AuthError("User doesn't exists"));

    //verify password
    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return next(new AuthError("Invalid email or password"));
    }

    res.clearCookie("seller-access-token");
    res.clearCookie("seller-refresh-token");


    //Generate Access and Refresh token id user exist
    const accessToken = jwt.sign(
      { id: user.id, role: "user" },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: "15m",
      }
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: "user" },
      process.env.REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: "7d"
      }
    );

    //store the refresh and access token in an httpOnl secure cookie
    setCookie(res, "refresh_token", refreshToken);
    setCookie(res, "access_token", accessToken);

    res.status(200).json({
      message: "LoggedIn Successfully",
      user: { id: user.id, email: user.email, name: user.name },
    });


  } catch (err) {
    console.log(err);
    return next(err)
  }
}

export const refreshToken = async (req: any, res: Response, next: NextFunction) => {
  try {

    const refreshToken = req.cookies["refresh_token"] || req.cookies["seller-refresh-token"] || req.headers.authorization?.split(" ")[1];

    if (!refreshToken) {
      return res.status(401).json({ message: "Unauthorized! No refresh token." });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as { id: string, role: string };

    if (!decoded || !decoded.id || !decoded.role) {
      return next(new JsonWebTokenError("Forbidden! Invalid refresh token."));
    }


    let account;
    if (decoded.role === "user") {
      account = await prisma.users.findUnique({ where: { id: decoded.id } });
    } else if (decoded.role === "seller") {
      account = await prisma.sellers.findUnique({
        where: { id: decoded.id },
        include: { shop: true },
      })
      // req.seller=account;
    }


    if (!account) {
      return new AuthError("Forbidden! user/seller not found")
    }


    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    );

    if (decoded.role === "user") {
      setCookie(res, "access_token", newAccessToken);
    } else if (decoded.role === "seller") {
      setCookie(res, "seller-access-token", newAccessToken);
    }

    req.role = decoded.role;

    return res.status(201).json({ success: true });
  } catch (error) {
    return next(error)
  }
}

export const getUser = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    await sendLog({
      type: "success",
      message: `User ${user.email} logged in`,
      source: "auth-service",
    });
    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

//user Firgot password logic
export const userForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction) => {
  await handleForgotPassword(req, res, next, "user");

};


//Verify forgot password OTP
export const verifyUserForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await verifyForgotPasswordOtp(req, res, next);
}

//Reset user Password
export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword)

      return next(new ValidationError("Email and new password are required"));

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return next(new ValidationError("User not found!"));

    //compare new password with the existing one

    const isSamePassword = await bcrypt.compare(newPassword, user.password!);

    if (isSamePassword) {
      return next(
        new ValidationError("New password cannot be the same as the old password!")
      );
    }

    //hash the new password

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
      where: { email },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Password reset successfully" });

  } catch (error) {
    next(error)
  }
};


//Change Password
export const changePassword = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // 1. Required field check
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as the old password",
      });
    }

    // Strong password regex
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    // 2. Validate new password strength
    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number & special character",
      });
    }

    // 3. Get logged-in user
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      return res.status(404).json({
        success: false,
        message: "User not found or password not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect current password",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return next(error);
  }
};


export const registerSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //1.Validate input (name, email, phone_number, country, password)
    validateRegistrationData(req.body, "seller");

    const { name, email } = req.body;

    //2️Check if seller already exists
    const existingSeller = await prisma.sellers.findUnique({ where: { email } });

    if (existingSeller) {
      return next(
        new ValidationError("Seller already exists with this email!")
      );
    }

    //3OTP request limiting logic
    await checkOTPRestrictions(email, next);
    await trackOtpRequests(email, next);

    //4️Send OTP
    await sendOTP(name, email, "seller-activation-mail");

    //5Response (NO seller creation here)
    res.status(200).json({
      success: true,
      message: "OTP sent to email. Please verify your account.",
    });

  } catch (error) {
    next(error);
  }
};


export const verifySeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name, phone_number, country } = req.body;

    // 1️⃣ Basic validation
    if (!email || !otp || !password || !name || !phone_number || !country) {
      return next(new ValidationError("All fields are required"));
    }

    // 2️⃣ Check if seller already exists
    const existingSeller = await prisma.sellers.findUnique({ where: { email } });

    if (existingSeller) {
      return next(new ValidationError("Seller already exists with this email!"));
    }

    // 3️⃣ Verify OTP
    await verifyOtp(email, otp, next);

    // 4️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5️⃣ Create seller
    const seller = await prisma.sellers.create({
      data: { name, email, password: hashedPassword, country, phone_number },
    });

    // 6️⃣ Respond success + return sellerId
    res.status(201).json({
      success: true,
      message: "Seller registered successfully",
      sellerId: seller.id,
    });

  } catch (error) {
    next(error);
  }
};


//Login Seller
export const loginSeller = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ValidationError("Email and password are required!"));
    }

    const seller = await prisma.sellers.findUnique({ where: { email: email.toLowerCase() } });


    if (!seller) return next(new AuthError("Seller doesn't exists"));

    //verify password
    const isMatch = await bcrypt.compare(password, seller.password!);
    if (!isMatch) {
      return next(new AuthError("Invalid email or password"));
    }

    res.clearCookie("access_token");
    res.clearCookie("refresh_token");


    //Generate Access and Refresh token id user exist
    const accessToken = jwt.sign(
      { id: seller.id, role: "seller" },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: "30m",
      }
    );

    const refreshToken = jwt.sign(
      { id: seller.id, role: "seller" },
      process.env.REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: "7d"
      }
    );

    //store the refresh and access token in an httpOnl secure cookie
    setCookie(res, "seller_refresh_token", refreshToken);
    setCookie(res, "seller_access_token", accessToken);

    res.status(200).json({
      message: "LoggedIn Successfully",
      user: { id: seller.id, email: seller.email, name: seller.name },
    });


  } catch (err) {
    console.log(err);
    return next(err)
  }
}

//get logged in seller
export const getSeller = async (
  req: any,
  res: Response,
  next: NextFunction) => {
  try {
    const seller = req.seller;
    res.status(201).json({
      success: true,
      seller,
    });

  } catch (error) {
    next(error)
  }
};


export const createShop = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("CREATE SHOP BODY:", req.body);
    const { name, bio, address, opening_hours, website, category, sellerId } = req.body;

    if (!name || !bio || !address || !sellerId || !opening_hours || !category) {
      return next(new ValidationError("All fields are required"));
    }

    const shopData: any = {
      name, bio, address, opening_hours, category, sellerId
    };

    if (website && website.trim() != "") {
      shopData.website = website
    }

    const shop = await prisma.shops.create({
      data: shopData,
    });

    res.status(201).json({
      success: true,
      shop,
    });

  } catch (error) {
    console.log(error);
    next(error)
  }

}

//create stripe
export const createStripeConnectLink = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sellerId } = req.body;
    if (!sellerId) return next(new ValidationError("Seller ID is required"));

    const seller = await prisma.sellers.findUnique({
      where: {
        id: sellerId
      }
    });

    if (!seller) {
      return next(new ValidationError("Seller is not available with this di!"));
    }

    const account = await stripe.accounts.create({
      type: "express",
      email: seller?.email,
      country: "IN",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
    });
    await prisma.sellers.update({
      where: {
        id: sellerId
      },
      data: {
        stripeId: account.id,
      },
    });
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `http://localhost:3000/success`,
      return_url: `http://localhost:3000/success`,
      type: "account_onboarding",
    });

    res.json({ url: accountLink.url });
  } catch (error) {
    return next(error);
  }
}

//Add New Address
export const addUserAddress = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { label, name, street, city, country, zip, isDefault } = req.body;

    if (!label || !name || !street || !city || !country || !zip) {
      return next(new ValidationError("All fields are required"));
    }

    // 1. Enforce max 2 addresses
    const count = await prisma.address.count({ where: { userId } });
    if (count >= 2) {
      return next(new ValidationError("You can only add up to 2 addresses."));
    }

    // 2. If isDefault true, remove previous default
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // 3. If first address → always default
    const willBeDefault = count === 0 ? true : Boolean(isDefault);

    const newAddress = await prisma.address.create({
      data: {
        label,
        name,
        street,
        city,
        country,
        zip,
        isDefault: willBeDefault,
        userId,
      },
    });

    res.status(201).json({ success: true, address: newAddress });
  } catch (error) {
    next(error);
  }
};

export const deleteUserAddress = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { addressId } = req.params;

    if (!addressId) {
      return next(new ValidationError("Address ID is required"));
    }

    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      return next(new NotFoundError("Address not found or unauthorized"));
    }

    const wasDefault = existing.isDefault;

    await prisma.address.delete({
      where: { id: addressId },
    });

    // If default was deleted, promote another one
    if (wasDefault) {
      const another = await prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" }
      });

      if (another) {
        await prisma.address.update({
          where: { id: another.id },
          data: { isDefault: true },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });

  } catch (error) {
    next(error);
  }
};


export const getUserAddresses = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: "desc" },   // default on top
        { createdAt: "desc" }
      ],
    });

    res.status(200).json({
      success: true,
      addresses,
    });

  } catch (error) {
    next(error);
  }
};

export const updateUserAddress = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { addressId } = req.params;

    const { label, name, street, city, country, zip, isDefault } = req.body;

    if (!addressId) {
      return next(new ValidationError("Address ID is required"));
    }

    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      return next(new NotFoundError("Address not found or unauthorized"));
    }

    // If marking this as default → clear previous default
    if (isDefault === true) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id: addressId },
      data: {
        label: label ?? existing.label,
        name: name ?? existing.name,
        street: street ?? existing.street,
        city: city ?? existing.city,
        country: country ?? existing.country,
        zip: zip ?? existing.zip,
        isDefault: isDefault === true ? true : existing.isDefault,
      },
    });

    res.status(200).json({
      success: true,
      address: updated,
    });

  } catch (error) {
    next(error);
  }
};


// export const loginAdmin = async (req: any, res: Response, next: NextFunction) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return next(new ValidationError("Email and password are required"));
//     }

//     const user = await prisma.users.findUnique({ where: { email } });
//     if (!user) {
//       return next(new ValidationError("Admin not found"));
//     }

//     const isMatch = await bcrypt.compare(password, user.password!);
//     if (!isMatch) {
//       return next(new ValidationError("Incorrect password"));
//     }

//     const isAdmin = user.role === "admin";

//     if (!isAdmin) {
//       // sendLog({
//       //   type: "error",
//       //   message: `Admin login for ${email} failed`,
//       //   source: "auth-service",
//       // });
//       return next(new ValidationError("Invalid access"));
//     }

//     // sendLog({
//     //   type: "info",
//     //   message: `Admin login for ${email} success`,
//     //   source: "auth-service",
//     // });

//     res.clearCookie("seller-access-token");
//     res.clearCookie("seller-refresh-token");

//     const accessToken = jwt.sign(
//       { id: user.id, role: "admin" },
//       process.env.ACCESS_TOKEN_SECRET as string,
//       { expiresIn: "30m" }
//     );

//     const refreshToken = jwt.sign(
//       { id: user.id, role: "admin" },
//       process.env.REFRESH_TOKEN_SECRET as string,
//       { expiresIn: "7d" }
//     );

//     setCookie(res, "refresh_token", refreshToken);
//     setCookie(res, "access_token", accessToken);



//     res.status(200).json({
//       message: "Admin logged in successfully",
//       success: true,
//       user: { id: user.id, email: user.email, name: user.name },
//     });

//   } catch (error) {
//     return next(error);
//   }
// };

//fetch layout data 
export const getLayoutData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const layout = await prisma.site_config.findFirst();
    res.status(200).json({
      success: true,
      layout,
    });
  } catch (error) {
    next(error);
  }
};

