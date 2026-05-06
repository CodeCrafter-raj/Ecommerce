import { AuthError } from "@packages/error-handler";
import { Request, Response, NextFunction } from "express"

export const isSeller = (req: any, res: Response, next: NextFunction) => {
  if (req.role != "seller") {
    return next(new AuthError("Access denied:Seller Only"));
  }
  next();
};

export const isAdmin = (req: any, res: Response, next: NextFunction) => {
  if (req.role != "admin") {
    return next(new AuthError("Access denied:Admin Only"));
  }
  next();
};

export const isUser = (req: any, res: Response, next: NextFunction) => {
  if (req.role != "user") {
    return next(new AuthError("Access denied:User Only"));
  }
  next();
};