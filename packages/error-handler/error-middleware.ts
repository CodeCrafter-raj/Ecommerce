import { AppError } from "./app-error";
import { Request, Response, NextFunction } from "express";

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    console.log(`Error ${req.method} ${req.url} - ${err.message}`);

    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  console.log("Unhandled error:", err);

  return res.status(500).json({
    error: "Something went wrong, Please Try Again!",
  });
};












// // error-middleware.ts (FIXED)
// import { AppError } from "./index.ts";
// import {Request, Response, NextFunction} from "express"; //  Import NextFunction

// export const errorMiddleware = (
//     err: Error,
//     req: Request,
//     res: Response,
//     next: NextFunction //  MUST be the 4th argument for error middleware
// ) => {
//     if(err instanceof AppError )
//     {
//         console.log(`Error ${req.method} ${req.url} - ${err.message}`);

//         return res.status(err.statusCode).json({
//             status:"error",
//             message:err.message,
//             ...(err.details && {details:err.details}),
//         });
//     }

//     console.log("Unhandled error:", err);

//     return res.status(500).json({
//         error:"Something went wrong, Please Try Again!",
//     });
// };

