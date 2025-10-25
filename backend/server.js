// server_fixed_debug.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5500';

// --- Optional: try requiring Cart model safely ---
let Cart = null;
try {
  Cart = require('./models/cartSchema');
  console.log('Cart model loaded.');
} catch (err) {
  console.warn('Warning: could not load ./models/cartSchema. Cart DB ops will be skipped.');
}

// --- MongoDB connection (non-fatal) ---
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI not set. Skipping DB connection.');
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected.');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
  }
}
connectDB();

// --- Basic user schema ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String, required: true }
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS config
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse sendBeacon for /cart
app.use('/cart', express.text({ type: '*/*' }));

// --- Routes ---

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.get('/_health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'dev' });
});

app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ status: 'error', message: 'username and password required' });
    }
    
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.json({ status: 'exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const u = new User({ username, email, password: hashed });
    await u.save();
    res.json({ status: 'success' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ status: 'error' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(username);
    const user = isEmail 
      ? await User.findOne({ email: username }) 
      : await User.findOne({ username });
    
    if (!user) {
      return res.json({ status: 'nouser' });
    }
    
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.json({ status: 'nouser' });
    }
    
    res.json({ status: 'success', wt_user: user.username, email: user.email });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ status: 'error' });
  }
});

app.post('/cart', async (req, res) => {
  try {
    let body = req.body;
    
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error('Failed to parse /cart body:', e.message);
        return res.status(400).send('Bad request - invalid JSON');
      }
    }
    
    const { username, items } = body || {};
    
    if (!username) {
      return res.status(400).send('username required');
    }
    if (!Array.isArray(items)) {
      return res.status(400).send('items array required');
    }

    console.log('Cart received for user:', username, 'items:', items.length);

    if (Cart && Cart.findOneAndUpdate) {
      try {
        await Cart.findOneAndUpdate(
          { username }, 
          { items, updatedAt: new Date() }, 
          { upsert: true }
        );
        console.log('Cart saved to DB for:', username, items);
      } catch (e) {
        console.error('Cart DB save failed:', e.message);
      }
    } else {
      console.log('Cart model not available. Items count:', items.length);
    }
    
    res.status(200).send('cart saved');
  } catch (err) {
    console.error('Error in /cart:', err);
    res.status(500).send('server error');
  }
});

// Add this route after your POST /cart route

app.get('/cart/:username', async (req, res) => {
  try {
    const { username } = req.params;
    console.log("Fetching cart for username:", username);
    
    if (!username) {
      return res.status(400).json({ error: 'username required' });
    }

    // If Cart model is available, fetch from DB
    if (Cart && Cart.findOne) {
      try {
        const cartData = await Cart.findOne({ username });
        
        if (!cartData || !cartData.items) {
          console.log('No cart found for user:', username);
          return res.json({ username, items: [] });
        }
        
        console.log('Cart found for user:', username, 'items:', cartData.items.length);
        return res.json({ username, items: cartData.items });
      } catch (e) {
        console.error('Cart DB fetch failed:', e.message);
        return res.status(500).json({ error: 'Database error' });
      }
    } else {
      console.log('Cart model not available');
      return res.json({ username, items: [] });
    }
  } catch (err) {
    console.error('Error in GET /cart:', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Favorites Schema (add this near your User schema)
const favoritesSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  items: { type: Array, default: [] },
  updatedAt: { type: Date, default: Date.now }
});
const Favorites = mongoose.models.Favorites || mongoose.model('Favorites', favoritesSchema);

// POST /favorites - Save favorites
app.post('/favorites', async (req, res) => {
  try {
    let body = req.body;
    
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error('Failed to parse /favorites body:', e.message);
        return res.status(400).send('Bad request - invalid JSON');
      }
    }
    
    const { username, items } = body || {};
    
    if (!username) {
      return res.status(400).send('username required');
    }
    if (!Array.isArray(items)) {
      return res.status(400).send('items array required');
    }

    console.log('Favorites received for user:', username, 'items:', items.length);

    try {
      await Favorites.findOneAndUpdate(
        { username }, 
        { items, updatedAt: new Date() }, 
        { upsert: true }
      );
      console.log('Favorites saved to DB for:', username);
    } catch (e) {
      console.error('Favorites DB save failed:', e.message);
    }
    
    res.status(200).send('favorites saved');
  } catch (err) {
    console.error('Error in /favorites:', err);
    res.status(500).send('server error');
  }
});

// GET /favorites/:username - Fetch favorites
app.get('/favorites/:username', async (req, res) => {
  try {
    const { username } = req.params;
    console.log("Fetching favorites for username:", username);
    
    if (!username) {
      return res.status(400).json({ error: 'username required' });
    }

    try {
      const favData = await Favorites.findOne({ username });
      
      if (!favData || !favData.items) {
        console.log('No favorites found for user:', username);
        return res.json({ username, items: [] });
      }
      
      console.log('Favorites found for user:', username, 'items:', favData.items.length);
      return res.json({ username, items: favData.items });
    } catch (e) {
      console.error('Favorites DB fetch failed:', e.message);
      return res.status(500).json({ error: 'Database error' });
    }
  } catch (err) {
    console.error('Error in GET /favorites:', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Add text parsing middleware for favorites
app.use('/favorites', express.text({ type: '*/*' }));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});