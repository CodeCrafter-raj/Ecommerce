import { errorMiddleware } from "./error-middleware";
import { AppError } from "./app-error";

export { errorMiddleware, AppError };

export class NotFoundError extends AppError {
  constructor(message = "Resource not Found") {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid request data", details?: any) {
    super(message, 400, true, details);
  }
}

export class AuthError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden access") {
    super(message, 403);
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Database Error", details?: any) {
    super(message, 500, true, details);
  }
}
