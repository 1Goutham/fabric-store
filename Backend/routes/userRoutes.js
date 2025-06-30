const express=require('express');
const { createUser, login, DeleteUser, Logout, Changepassword, forgotPassword, resetPassword, UpdateUser, getUser, getAllUsers } = require('../controller/userController');
const router=express.Router();
const multer=require('multer');
const path = require('path');
const {isAuthenticated, authorizeRoles}=require('../middleware/isAuthenticated');
const { UpdateProduct } = require('../controller/productController');

const upload =multer({storage:multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'..','uploads/user'))
    },
    filename:function(req,file,cb){
        cb(null,file.originalname)
    }
})})


router.route('/register').post(upload.single('avatar'),createUser);
router.route('/login').post(login);
router.route('/delete').post(DeleteUser);
router.route('/logout').get(Logout); 
router.route('/forgotPassword').post(forgotPassword);
router.route('/ChangePassword').put(isAuthenticated,Changepassword);

router.route('/password/reset/:token').post(resetPassword);
router.route('/myprofile').get(isAuthenticated,getUser);
router.route('/update').put(isAuthenticated, upload.single('avatar'),UpdateUser);
router.route('/admin').get(isAuthenticated,authorizeRoles('admin'),getAllUsers);
router.route('/admin/:id').delete(isAuthenticated,authorizeRoles('admin'),DeleteUser);
module.exports = router;