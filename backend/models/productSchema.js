const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    cargos: {
        type: Array,
        default: []
    },
    hoodies: {
        type: Array,
        default: []
    },
    tees: {
        type: Array,
        default: []
    },
    shirts: {
        type: Array,
        default: []
    },
    jeans: {
        type: Array,
        default: []
    },
    joggers: {
        type: Array,
        default: []
    }
}, {
    collection: 'products',
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);