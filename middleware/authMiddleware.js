const jwt = require('jsonwebtoken');

// Middleware to check for JWT in cookies or Authorization header
const authMiddleware = (req, res, next) => {
  // Try to get token from HTTP-only cookie (for web browsers)
  const token = req.cookies.jwt || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized, no token found." });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    // Attach the decoded user info to the request object
    req.user = decoded;
    next();
  });
};

module.exports = authMiddleware;
