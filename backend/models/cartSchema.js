const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  username: { type: String, required: true },
  items: [
    {
      about: String,
      brandName: String,
      id: String,
      image: String,
      keyword: [String],
      name: String,
      priceCents: Number,
      quantity: Number
    }
  ]
});

module.exports = mongoose.model('Cart', cartSchema);
