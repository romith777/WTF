const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 5500;

// --- MongoDB Connection ---
mongoose.connect('mongodb+srv://unknownme7707_db_user:y6Y5XGFVjBhQ7UFH@clusterone.oe9zc1s.mongodb.net/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.error("MongoDB Connection Error:", err));

// --- User Schema ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('users', userSchema);

// --- Middleware ---
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// serve frontend files (HTML/CSS/assets) from parent folder
app.use(express.static(path.join(__dirname, '..')));

// --- Routes ---

// Signup Route
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ username }) || await User.findOne({ email });
        if(existingUser){ 
            res.redirect('/login.html?signup=exists');
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({ username, email, password: hashedPassword });
        try {
            const savedUser = await user.save();
            console.log("User saved to DB:", savedUser);
            try{
                res.redirect('/login.html?signup=success');
            } catch (err) {
                console.error(err);
                res.status(500).send('Error signing up');
            }
        } catch(err) {
            console.error("Error saving user:", err);
}
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if(!user){
            res.redirect('/login.html?login=nouser');
            return;
        }

        const match = await bcrypt.compare(password, user.password);
        if(!match) return res.status(400).send("Incorrect password");

        res.send("Login successful!");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// Default route (login page)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'login.html'));
});

// --- Start Server ---
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
