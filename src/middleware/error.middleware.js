export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  // Use err.status/err.statusCode for custom error objects (e.g. from project.service.js),
  // or res.statusCode if explicitly set before throw, otherwise default to 500.
  const statusCode = err.status || err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};