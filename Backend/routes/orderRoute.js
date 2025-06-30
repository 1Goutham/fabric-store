const express = require('express');
const router=express.Router();

const { 
    createOrder, 
    getSingleOrder, 
    myOrders,
    getMyOrders,
    adminGetAllOrders,
    adminUpdateOrderStatus,
    adminDeleteOrder
} = require('../controller/OrderController');

const { isAuthenticated,authorizeRoles } = require('../middleware/isAuthenticated');
router.post('/new', isAuthenticated, createOrder);
router.get('/list', isAuthenticated, getMyOrders);

router.route('/admin').get(isAuthenticated, authorizeRoles('admin'), adminGetAllOrders)
router.put('/admin/:id', isAuthenticated, authorizeRoles('admin'), adminUpdateOrderStatus);
router.delete('/admin/:id', isAuthenticated, authorizeRoles('admin'), adminDeleteOrder);
router.get('/:id', isAuthenticated, getSingleOrder);
                 

module.exports = router;

module.exports = router;
