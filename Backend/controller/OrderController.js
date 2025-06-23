const CatchasyncError = require('../utils/CatchasyncError');

exports.createOrder = CatchasyncError(async (req, res, next) => {
    const { orderItems, shippingInfo, totalAmount, paymentInfo } = req.body;

    const order = await Order.create({
        orderItems,
        shippingInfo,
        totalAmount,
        paymentInfo,
        paidAt: Date.now(),
        user: req.user.id,
    });

    res.status(201).json({
        success: true,
        order,
    });
});