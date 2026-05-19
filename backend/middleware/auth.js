const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Read token from httpOnly cookie first, fall back to Authorization header
  const cookieToken = req.cookies?.token;
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.split(' ')[1];
  const token = cookieToken || headerToken;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, { issuer: 'hr-genie-api', audience: 'hr-genie-frontend' }, (err, user) => {
    if (err) {
      // Also try without iss/aud for tokens issued before this update
      jwt.verify(token, process.env.JWT_SECRET, (fallbackErr, fallbackUser) => {
        if (fallbackErr) {
          return res.status(401).json({ error: 'Invalid or expired token' });
        }
        req.user = fallbackUser; // { id, email, role, org_id }
        next();
      });
      return;
    }
    req.user = user; // { id, email, role, org_id }
    next();
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };