function notFound(req, res, next) {
  const error = new Error(`Not found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  const status = error.status || res.statusCode || 500;
  res.status(status).json({ message: error.message || 'Server error', errors: error.errors || undefined });
}

module.exports = { notFound, errorHandler };
