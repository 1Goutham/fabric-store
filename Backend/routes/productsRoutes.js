const express=require('express');
const router=express.Router();
const {getProducts,createProducts, getSingleProduct, UpdateProduct, DeleteProduct} = require('../controller/productController')

router.route('/').get(getProducts);
router.route('/create').post(createProducts);
router.route('/:id').get(getSingleProduct);
router.route('/update/:id').put(UpdateProduct);
router.route('/delete/:id').delete(DeleteProduct);
module.exports = router;