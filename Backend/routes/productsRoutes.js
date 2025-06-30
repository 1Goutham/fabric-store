const express=require('express');
const router=express.Router();
const {getProducts,createProducts, getSingleProduct, UpdateProduct, DeleteProduct, adminGetProducts} = require('../controller/productController')
const { isAuthenticated,authorizeRoles } = require('../middleware/isAuthenticated');
router.route('/').get(getProducts);
router.route('/create').post(createProducts);

router.route('/update/:id').put(UpdateProduct);
router.route('/delete/:id').delete(isAuthenticated,authorizeRoles('admin'),DeleteProduct);
router.route('/admin').get(isAuthenticated,authorizeRoles('admin'),adminGetProducts);
router.route('/:id').get(getSingleProduct);
module.exports = router;