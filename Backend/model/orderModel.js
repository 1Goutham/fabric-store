const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    shippingInfo: {
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        pincode: {
            type: String,
            required: true
        },
        phoneNo: {
            type: String,
            required: true
        }
    },

    orderItems: [
        {
            name: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            image: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            product: {
                type: mongoose.Schema.ObjectId,
                ref: 'Product',
                required: true
            }
        }
    ],

    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },

    paymentInfo: {
        id: {
            type: String,
            required: true
        },
        status: {
            type: String,
            required: true
        }
    },

    paidAt: {
        type: Date,
        required: true
    },

    itemsPrice: {
        type: Number,
        required: true,
        default: 0.0
    },

    taxPrice: {
        type: Number,
        required: true,
        default: 0.0
    },

    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0
    },

    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },

    orderStatus: {
        type: String,
        required: true,
        default: 'Processing'
    },

    deliveredAt: Date,

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);
