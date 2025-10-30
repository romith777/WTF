require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Load models
let Cart = null;
let Product = null;

const nodemailer = require('nodemailer');
const crypto = require('crypto');

// OTP Schema
let OTP = null;
try {
  OTP = require('./models/otpSchema');
  console.log('OTP model loaded.');
} catch (err) {
  console.warn('Warning: could not load ./models/otpSchema. OTP functionality will be skipped.');
}

try {
  Cart = require('./models/cartSchema');
} catch (err) {
  console.warn('Cart model not loaded');
}

try {
  Product = require('./models/productSchema');
} catch (err) {
  console.warn('Product model not loaded');
}

// ✅ FIXED: Cache the connection for serverless
let cachedDb = null;

// MongoDB connection with proper serverless configuration
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.warn('MONGODB_URI not set in environment variables');
    return null;
  }

  // Return cached connection if available
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('Using cached MongoDB connection');
    return cachedDb;
  }

  try {
    // Optimized settings for Vercel serverless
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
      maxPoolSize: 10, // Limit connection pool
      minPoolSize: 1,
      maxIdleTimeMS: 10000,
      retryWrites: true,
      w: 'majority'
    };

    await mongoose.connect(uri, options);
    cachedDb = mongoose.connection;
    console.log('MongoDB connected successfully');
    return cachedDb;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    return null;
  }
}

// Connect on startup
connectDB();

// Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String, required: true }
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const favoritesSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  items: { type: Array, default: [] },
  updatedAt: { type: Date, default: Date.now }
});
const Favorites = mongoose.models.Favorites || mongoose.model('Favorites', favoritesSchema);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from parent directory (root folder)
app.use(express.static(path.join(__dirname, '..')));

// ✅ ADDED: Middleware to ensure DB connection before each request
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date(),
    message: 'Backend is running!',
    env_check: process.env.MONGODB_URI ? 'MONGODB_URI is set' : 'MONGODB_URI is missing'
  });
});

// API Routes
app.get('/products', async (req, res) => {
  try {
    if (!Product) {
      return res.status(500).json({ error: 'Product model not available' });
    }
    const productsData = await Product.findOne({});
    res.json({
      tees: productsData?.tees || [],
      hoodies: productsData?.hoodies || [],
      cargos: productsData?.cargos || [],
      shirts: productsData?.shirts || [],
      jeans: productsData?.jeans || [],
      joggers: productsData?.joggers || []
    });
  } catch (err) {
    console.error('Products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ status: 'error' });
    }
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.json({ status: 'exists' });
    }
    const hashed = await bcrypt.hash(password, 10);
    await new User({ username, email, password: hashed }).save();
    res.json({ status: 'success' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ status: 'error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ status: 'error' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const user = emailRegex.test(username)
      ? await User.findOne({ email: username })
      : await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.json({ status: 'nouser' });
    }
    res.json({ status: 'success', wt_user: user.username, email: user.email });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ status: 'error' });
  }
});

app.post('/api/cart', async (req, res) => {
  try {
    const { username, items } = req.body;
    if (!username || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    if (Cart) {
      await Cart.findOneAndUpdate(
        { username },
        { items, updatedAt: new Date() },
        { upsert: true }
      );
    }
    res.json({ message: 'cart saved', itemCount: items.length });
  } catch (err) {
    console.error('Cart error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/api/cart/:username', async (req, res) => {
  try {
    const cartData = Cart ? await Cart.findOne({ username: req.params.username }) : null;
    res.json({ username: req.params.username, items: cartData?.items || [] });
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/favorites', async (req, res) => {
  try {
    const { username, items } = req.body;
    if (!username || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    await Favorites.findOneAndUpdate(
      { username },
      { items, updatedAt: new Date() },
      { upsert: true }
    );
    res.json({ message: 'favorites saved' });
  } catch (err) {
    console.error('Favorites error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/api/favorites/:username', async (req, res) => {
  try {
    const favData = await Favorites.findOne({ username: req.params.username });
    res.json({ username: req.params.username, items: favData?.items || [] });
  } catch (err) {
    console.error('Get favorites error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

// ✅ CHANGED: Email transporter setup using MAILUSER and MAILPASS
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAILUSER,
    pass: process.env.MAILPASS
  }
});

// Generate 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Send OTP Email with detailed error logging
async function sendOTPEmail(email, otp) {
  // Check if email credentials are configured
  if (!process.env.MAILUSER || !process.env.MAILPASS) {
    console.error('Email credentials not configured. MAILUSER:', process.env.MAILUSER ? 'set' : 'missing', 'MAILPASS:', process.env.MAILPASS ? 'set' : 'missing');
    return false;
  }

  const mailOptions = {
    from: process.env.MAILUSER,
    to: email,
    subject: 'WTPRINTS - Email Verification OTP',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'League Spartan', Arial, sans-serif; background-color: #f8f8f8; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 32px; font-weight: 800; color: #ee0652; letter-spacing: 1px; }
          .otp-box { background: linear-gradient(135deg, #ee0652, #ff0066); color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0; }
          .otp-code { font-size: 42px; font-weight: 800; letter-spacing: 8px; margin: 10px 0; }
          .message { color: #666; line-height: 1.8; font-size: 16px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #f0f0f0; text-align: center; color: #999; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">WTPRINTS</div>
          </div>
          <p class="message">Thank you for signing up with WTPRINTS! To complete your registration, please verify your email address.</p>
          <div class="otp-box">
            <p style="margin: 0; font-size: 16px;">Your Verification Code</p>
            <div class="otp-code">${otp}</div>
            <p style="margin: 0; font-size: 14px;">Valid for 5 minutes</p>
          </div>
          <p class="message">Enter this code on the verification page to activate your account. If you didn't request this code, please ignore this email.</p>
          <div class="footer">
            <p>© 2025 WTPRINTS. All rights reserved.</p>
            <p>Stay unique. Stay printed.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    console.log('Attempting to send email to:', email);
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error.message);
    console.error('Error code:', error.code);
    console.error('Error response:', error.response);
    return false;
  }
}


// Route: Request OTP (Step 1 of signup)
app.post('/request-otp', async (req, res) => {
  try {
    const { email, username } = req.body;
    
    if (!email || !username) {
      return res.status(400).json({ status: 'error', message: 'Email and username required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.json({ status: 'exists', message: 'Username or email already exists' });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP in database
    if (OTP) {
      // Delete any existing OTP for this email
      await OTP.deleteMany({ email });
      
      // Create new OTP
      await OTP.create({ email, otp });
    }

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp);

    if (emailSent) {
      res.json({ status: 'success', message: 'OTP sent to email' });
    } else {
      res.status(500).json({ status: 'error', message: 'Failed to send OTP' });
    }
  } catch (err) {
    console.error('Request OTP error:', err);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// Route: Verify OTP and Complete Signup (Step 2 of signup)
app.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, username, password } = req.body;

    if (!email || !otp || !username || !password) {
      return res.status(400).json({ status: 'error', message: 'All fields required' });
    }

    // Verify OTP
    if (OTP) {
      const otpRecord = await OTP.findOne({ email, otp });
      
      if (!otpRecord) {
        return res.json({ status: 'invalid', message: 'Invalid or expired OTP' });
      }

      // OTP is valid, delete it
      await OTP.deleteOne({ _id: otpRecord._id });
    }

    // Check if user already exists (double check)
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.json({ status: 'exists', message: 'Username or email already exists' });
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.json({ status: 'success', message: 'Account created successfully' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// Only listen locally
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
