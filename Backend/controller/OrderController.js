const CatchasyncError = require('../utils/CatchasyncError');
const Order = require('../model/orderModel');
const errorHandler = require('../utils/error');

// Create new order  =>  POST /api/orders
exports.createOrder = CatchasyncError(async (req, res, next) => {
    const { 
        orderItems, 
        shippingInfo, 
        itemsPrice, 
        taxPrice, 
        shippingPrice, 
        totalPrice, 
        paymentInfo, 
        paidAt 
    } = req.body;

    const order = await Order.create({
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt: paidAt || Date.now(),
        user: req.user ? req.user.id : null
    });

    res.status(201).json({
        success: true,
        order
    });
});

// Get logged-in user orders  =>  GET /api/orders/me
exports.getMyOrders = CatchasyncError(async (req, res, next) => {
    const orders = await Order.find({ user: req.user.id });

    res.status(200).json({
        success: true,
        orders
    });
});

// Get single order by ID  =>  GET /api/orders/:id
exports.getSingleOrder = CatchasyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
        return next(new errorHandler('Order not found', 404));
    }

    res.status(200).json({
        success: true,
        order
    });
});

exports.adminGetAllOrders = CatchasyncError(async (req, res, next) => {
    const orders = await Order.find().populate('user', 'name email');

    let totalAmount = 0;
    orders.forEach(order => {
        totalAmount += order.totalPrice;
    });

    res.status(200).json({
        success: true,
        totalAmount,
        orders
    });
});

exports.adminUpdateOrderStatus = CatchasyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new errorHandler('Order not found', 404));
    }

    if (order.orderStatus === 'Delivered') {
        return next(new errorHandler('Order already delivered', 400));
    }

    order.orderStatus = req.body.status;

    if (req.body.status === 'Delivered') {
        order.deliveredAt = Date.now();
    }

    await order.save();

    res.status(200).json({
        success: true
    });
});

exports.adminDeleteOrder = CatchasyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new errorHandler('Order not found', 404));

    }

    await order.deleteOne();

    res.status(200).json({
        success: true
    });
});
