const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors
    });
  }

  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Resource already exists'
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Referenced resource does not exist'
    });
  }

  const statusCode = err.status || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message || 'Internal server error';

  res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;