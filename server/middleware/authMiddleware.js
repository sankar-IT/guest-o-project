import jwt from 'jsonwebtoken';
import User from '../models/userSchema.js';
import Staff from '../models/staffSchema.js';

<<<<<<< HEAD
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
=======
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check both User and Staff collections
      let user = await User.findById(decoded.id).select('-password');
>>>>>>> develop
      if (!user) {
        user = await Staff.findById(decoded.id).select('-password');
      }

      if (!user) {
<<<<<<< HEAD
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

=======
        return res.status(401).json({ success: false, message: 'Not authorized, account not found' });
      }

      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Not authorized, account deactivated' });
      }

>>>>>>> develop
      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
<<<<<<< HEAD
      console.error('Auth Middleware Error:', error);
      res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
=======
      console.error('Auth Middleware Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
>>>>>>> develop
    }
  }

  if (!token) {
<<<<<<< HEAD
    res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

// Middleware to restrict access to admins only
=======
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

>>>>>>> develop
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
<<<<<<< HEAD
    res.status(403).json({
      success: false,
      message: 'Access denied. Admins only.'
    });
=======
    return res.status(403).json({ success: false, message: 'Not authorized as an admin' });
>>>>>>> develop
  }
};
