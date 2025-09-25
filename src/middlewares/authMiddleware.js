const jwt = require("jsonwebtoken");
const User = require("../models/User"); // You may need to implement this model

exports.protect = async (req, res, next) => {
  // Try cookie first
  let token = req.cookies?.token;

  // Fallback to Authorization header for mobile clients
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }

};

// Admin middleware for role-based access
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required.' });
};
