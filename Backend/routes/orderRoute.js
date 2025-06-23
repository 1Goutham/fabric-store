const express = require('express');
const router=express.Router();
const { newOrder, getSingleOrder, myOrders, orders, updateOrder, deleteOrder, createOrder } = require('../controller/OrderController');
const {isAuthenticated}=require('../middleware/isAuthenticated');

router.route('/new').post(isAuthenticated,createOrder);

module.exports = router;