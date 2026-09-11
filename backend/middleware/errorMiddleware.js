/**
 * Catches requests to routes that don't exist and forwards a 404 error
 * into the central error handler below.
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Central error handler. Every thrown/next(error) call in the app ends up
 * here, so all API error responses share the same shape:
 *   { success: false, message: "..." }
 *
 * Must be registered LAST, after all routes, with 4 arguments so Express
 * recognizes it as an error-handling middleware.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // If a controller threw without explicitly setting a status code,
  // res.statusCode defaults to 200 - upgrade that to 500.
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || "Something went wrong";

  // Mongoose bad ObjectId (CastError) -> 404 instead of a raw 500
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found";
  }

  // Mongoose validation errors -> 400 with a readable message
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // Mongoose duplicate key error (e.g. email already registered) -> 400
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `An account with that ${field} already exists`;
  }

  // Malformed/expired JWTs -> 401
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Not authorized, invalid token";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Not authorized, token expired";
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Stack traces are only useful (and safe) to expose in development.
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
