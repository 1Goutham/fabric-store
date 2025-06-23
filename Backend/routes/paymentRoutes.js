const express = require('express');
const router=express.Router();
require('dotenv').config({ path: './config/config.env' });
const { processPayment, sendStripeApi } = require('../controller/paymentController');
const {isAuthenticated}=require('../middleware/isAuthenticated');

router.route('/process').post( isAuthenticated, processPayment);
router.route('/stripeapi').get( isAuthenticated, sendStripeApi);


module.exports = router;