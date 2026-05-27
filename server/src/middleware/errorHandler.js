// Central error handler — catches anything thrown with next(err) or unhandled route errors.
// Keeps error messages out of the client in production.
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== "production";

  // Never log to stdout in tests
  if (process.env.NODE_ENV !== "test") {
    console.error(`[${req.method}] ${req.path} → ${status}:`, err.message);
  }

  res.status(status).json({
    success: false,
    message: isDev ? err.message : "Something went wrong",
    ...(isDev && { stack: err.stack?.split("\n").slice(0, 4) }),
  });
}
