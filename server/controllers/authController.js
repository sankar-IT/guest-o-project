import authService from '../services/authService.js';
import Staff from '../models/staffSchema.js';
import jwt from 'jsonwebtoken';


class AuthController {
  async register(req, res) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: authService.generateToken(user._id)
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await authService.login(email, password);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: authService.generateToken(user._id)
        }
      });
    } catch (error) {
      const statusCode = error.statusCode || 401;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Preserve admin login for dashboard
  async adminLogin(req, res) {
    try {
      const { email, password } = req.body;
      const user = await authService.login(email, password, 'admin');
      
      res.status(200).json({
        success: true,
        message: 'Admin login successful',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: authService.generateToken(user._id)
        }
      });
    } catch (error) {
      const statusCode = error.statusCode || 401;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  async googleLogin(req, res) {
    try {
      const { token } = req.body;
      const user = await authService.googleLogin(token);
      
      res.status(200).json({
        success: true,
        message: 'Google login successful',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: authService.generateToken(user._id)
        }
      });
    } catch (error) {
      const statusCode = error.statusCode || 401;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  async sendOTP(req, res) {
    try {
      const { email } = req.body;
      
      const existingUser = await authService.checkExistingUser(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      await authService.sendOTP(email);
      res.status(200).json({
        success: true,
        message: 'OTP sent to your email'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async registerWithOTP(req, res) {
    try {
      const { email, otp, userData } = req.body;
      const isOTPValid = await authService.verifyOTP(email, otp);
      
      if (!isOTPValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      const user = await authService.register(userData);
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: authService.generateToken(user._id)
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @desc Staff login for administrative access
   * @route POST /api/auth/staff-login
   * @access Public (Restricted to role: admin)
   */
  async staffLogin(req, res) {
    try {
      const { email, password } = req.body;

      // 1. Validate: email and password
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide both email and password'
        });
      }

      // 2. Find staff by email and include password for comparison
      const staff = await Staff.findOne({ email }).select('+password');

      // 3. If email does not exist, return proper error message
      if (!staff) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // 4. If password is incorrect, return proper error message
      const isMatch = await staff.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // 5. If role is not "admin", deny access with message: "Access denied. Admins only."
      if (staff.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admins only.'
        });
      }

      // 6. Generate JWT token after successful login
      const token = authService.generateToken(staff._id);

      // 7. Return: token, user id, name, email, role
      res.status(200).json({
        success: true,
        message: 'Staff login successful',
        data: {
          token,
          id: staff._id,
          name: staff.name,
          email: staff.email,
          role: staff.role
        }
      });

    } catch (error) {
      // 11. Use async/await and proper try/catch error handling
      console.error('Staff Login Error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

export default new AuthController();
