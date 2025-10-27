require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;  // ✅ FIXED: Was API_URI

// Load models
let Cart = null;
let Product = null;

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

// MongoDB connection
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI not set');
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB error:', err.message);
  }
}
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

// ✅ FIXED: Serve static files from parent directory (root folder)
app.use(express.static(path.join(__dirname, '..')));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date(),
    message: 'Backend is running!'
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
    res.status(500).json({ status: 'error' });
  }
});

app.post('/cart', async (req, res) => {
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
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/cart/:username', async (req, res) => {
  try {
    const cartData = Cart ? await Cart.findOne({ username: req.params.username }) : null;
    res.json({ username: req.params.username, items: cartData?.items || [] });
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/favorites', async (req, res) => {
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
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/favorites/:username', async (req, res) => {
  try {
    const favData = await Favorites.findOne({ username: req.params.username });
    res.json({ username: req.params.username, items: favData?.items || [] });
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

// Only listen locally
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
