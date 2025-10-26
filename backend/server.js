require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Load Cart model
let Cart = null;
try {
  Cart = require('./models/cartSchema');
  console.log('Cart model loaded.');
} catch (err) {
  console.warn('Warning: could not load ./models/cartSchema. Cart DB ops will be skipped.');
}

// Load Product model
let Product = null;
try {
  Product = require('./models/productSchema');
  console.log('Product model loaded.');
} catch (err) {
  console.warn('Warning: could not load ./models/productSchema. Product DB ops will be skipped.');
}

// MongoDB connection
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

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String, required: true }
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Favorites Schema
const favoritesSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  items: { type: Array, default: [] },
  updatedAt: { type: Date, default: Date.now }
});
const Favorites = mongoose.models.Favorites || mongoose.model('Favorites', favoritesSchema);

// ✅ UPDATED CORS - Allow all origins for Vercel
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static files (HTML, CSS, JS, images)
app.use(express.static(__dirname));

// ✅ Serve specific folders
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/cart', express.static(path.join(__dirname, 'cart')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/product_pages', express.static(path.join(__dirname, 'product_pages')));
app.use('/req_scripts', express.static(path.join(__dirname, 'req_scripts')));
app.use('/user', express.static(path.join(__dirname, 'user')));
app.use('/favouritesPage', express.static(path.join(__dirname, 'favouritesPage')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/_health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'dev' });
});

// GET /products - Fetch all products
app.get('/products', async (req, res) => {
  try {
    if (!Product) {
      return res.status(500).json({ error: 'Product model not available' });
    }

    const productsData = await Product.findOne({});
    
    if (!productsData) {
      return res.json({
        tees: [],
        hoodies: [],
        cargos: [],
        shirts: [],
        jeans: [],
        joggers: []
      });
    }

    res.json({
      tees: productsData.tees || [],
      hoodies: productsData.hoodies || [],
      cargos: productsData.cargos || [],
      shirts: productsData.shirts || [],
      jeans: productsData.jeans || [],
      joggers: productsData.joggers || []
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
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
        return res.status(400).json({ error: 'Bad request - invalid JSON' });
      }
    }
    
    const { username, items } = body || {};
    
    if (!username) {
      return res.status(400).json({ error: 'username required' });
    }
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items array required' });
    }

    if (Cart && Cart.findOneAndUpdate) {
      try {
        await Cart.findOneAndUpdate(
          { username }, 
          { items, updatedAt: new Date() }, 
          { upsert: true }
        );
      } catch (e) {
        console.error('Cart DB save failed:', e.message);
        return res.status(500).json({ error: 'Database error' });
      }
    }
    
    res.status(200).json({ message: 'cart saved', itemCount: items.length });
  } catch (err) {
    console.error('Error in /cart:', err);
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/cart/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({ error: 'username required' });
    }

    if (!Cart) {
      return res.json({ username, items: [] });
    }

    const cartData = await Cart.findOne({ username });
    
    if (!cartData || !cartData.items) {
      return res.json({ username, items: [] });
    }
    return res.json({ username, items: cartData.items });
  } catch (error) {
    console.error('Error in GET /cart:', error);
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/favorites', async (req, res) => {
  try {
    let body = req.body;
    
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error('Failed to parse /favorites body:', e.message);
        return res.status(400).json({ error: 'Bad request - invalid JSON' });
      }
    }
    
    const { username, items } = body || {};
    
    if (!username) {
      return res.status(400).json({ error: 'username required' });
    }
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items array required' });
    }

    try {
      await Favorites.findOneAndUpdate(
        { username }, 
        { items, updatedAt: new Date() }, 
        { upsert: true }
      );
      res.status(200).json({ message: 'favorites saved', itemCount: items.length });
    } catch (e) {
      console.error('Favorites DB save failed:', e.message);
      return res.status(500).json({ error: 'Database error' });
    }
  } catch (err) {
    console.error('Error in /favorites:', err);
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/favorites/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({ error: 'username required' });
    }

    try {
      const favData = await Favorites.findOne({ username });
      
      if (!favData || !favData.items) {
        return res.json({ username, items: [] });
      }
      
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

// ✅ Catch-all route for HTML pages
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.statusCode || 500).json({
    error: 'Internal server error',
    message: err.message || 'Something went wrong'
  });
});

// Only listen if not in production (Vercel handles this)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// ✅ Export for Vercel
module.exports = app;
