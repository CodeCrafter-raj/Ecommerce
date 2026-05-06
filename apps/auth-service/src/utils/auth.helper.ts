import crypto from "crypto";
import { ValidationError } from "@packages/error-handler";
import redis from "@packages/libs/reddis";
import prisma from "@packages/libs/prisma";

import { sendEmail } from "./sendMail";
import { Request, Response, NextFunction } from "express";


const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;



export const validateRegistrationData = (
  data: any,
  userType: "user" | "seller") => {
  const { name, email, password, phone_number, country } = data;

  if (
    !name || !email || !password || (userType === "seller" && (!phone_number || !country))
  ) {
    throw new ValidationError(`Mising required fields!!`)
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email id ? Please enter a valid email address")
  };

};


export const checkOTPRestrictions = async (
  email: string,
  next: NextFunction) => {

  if (await redis.get(`otp_lock:${email}`)) {
    throw new ValidationError("Account locked due to multiple failed attemp try again after 30 minutes");
  }

  if (await redis.get(`otp_spam_lock:${email}`)) {
    throw new ValidationError("Too many OTP request!Please wait 1hour before requesting again.");
  }

  if (await redis.get(`otp_cooldown:${email}`)) {
    throw new ValidationError("Please wait 1minute before requesting a new OTP!");
  }
};



export const trackOtpRequests = async (email: string, next: NextFunction) => {
  const otpRequestKey = `otp_request_count:${email}`;
  let otpRequests = parseInt((await redis.get(otpRequestKey)) || "0")

  if (otpRequests >= 2) {
    await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600); //Lock for 1 hour
    throw new ValidationError("Too many otp request.Please wait 1hour before requesting again.");
  }

  await redis.set(otpRequestKey, otpRequests + 1, "EX", 3600)//tracking request 
}

export const sendOTP = async (name: string, email: string, template: string) => {
  const otp = crypto.randomInt(1000, 9999).toString();
  await sendEmail(email, "Verify Your Email", template, { name, otp });
  await redis.set(`otp:${email}`, otp, "EX", 300);
  await redis.set(`otp_cooldown:${email}`, "true", "EX", 60);
};



export const verifyOtp = async (
  email: string,
  otp: string,
  next: NextFunction) => {

  const storedOtp = await redis.get(`otp:${email}`);

  if (!storedOtp) {
    throw new ValidationError("Invalid or expired OTP!");
  }

  const failedAttemptsKey = `otp_attempts:${email}`;

  const failedAttempts = parseInt((await redis.get(failedAttemptsKey)) || "0")

  if (storedOtp != otp) {
    if (failedAttempts >= 2) {
      await redis.set(`opt_lock:${email}`, "locked", "EX", 1800); //Lock for 30 minutes
      await redis.del(`otp:${email}`, failedAttemptsKey);
      throw new ValidationError("Too many failed attempst. Your account is locked for 30 minutes!");
    }

    await redis.set(failedAttemptsKey, failedAttempts + 1, "EX", 300);
    throw new ValidationError(`Incorrect OTP. ${2 - failedAttempts} attempts left.`);
  }

  await redis.del(`otp:${email}`, failedAttemptsKey);
};

export const handleForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
  userType: "user" | "seller"
) => {
  try {

    const { email } = req.body;

    if (!email) throw new ValidationError("Email is required!");

    //Find user/seller in DB
    const user = userType === "user"
      ? await prisma.users.findUnique({ where: { email } })
      : await prisma.sellers.findUnique({ where: { email } });

    if (!user) throw new ValidationError(`${userType} not found!`);


    //Check otp restrictions
    await checkOTPRestrictions(email, next);
    await trackOtpRequests(email, next);


    //forgot-password-user-mail this is the template name
    await sendOTP(user.name, email, userType === "user" ? "forgot-password-user-mail" : "forgot-password-seller-mail");

    res.status(200).json({ message: "OTP sent to email. Please verify your account" });

  } catch (error) {
    next(error);

  }
}


export const verifyForgotPasswordOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,

) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      throw new ValidationError("Email and OTP are required!");

    await verifyOtp(email, otp, next);

    res.status(200).json({
      message: "OTP verified. You can now reset your password"
    });

  } catch (err) {
    next(err);
  }
}