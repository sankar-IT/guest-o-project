import jwt from 'jsonwebtoken';
import User from '../models/userSchema.js';
import Staff from '../models/staffSchema.js';

// Middleware to protect routes and verify JWT token
export const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Try to find user in User collection first
      let user = await User.findById(decoded.id).select('-password');
      
      // If not in User, check Staff collection
      if (!user) {
        user = await Staff.findById(decoded.id).select('-password');
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth Middleware Error:', error);
      res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

// Middleware to restrict access to admins only
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admins only.'
    });
  }
};
