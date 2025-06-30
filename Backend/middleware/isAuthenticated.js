const CatchasyncError = require("../utils/CatchasyncError");
const jwt=require('jsonwebtoken');
const errorHandler = require('../utils/error');
const User=require('../model/userModel')

exports.isAuthenticated=CatchasyncError(async(req,res,next)=>{
    const {token}=req.cookies;
    if(!token){
        return next(new errorHandler('Please Login your account',404));
    }
    const decode=jwt.verify(token,process.env.JWT_SECRET);
    req.user=await User.findById(decode.id);
    next();
});

exports.authorizeRoles = (...roles) => {
   return  (req, res, next) => {
        if(!roles.includes(req.user.role)){
            return next(new errorHandler(`Role ${req.user.role} is not allowed`, 401))
        }
        next()
    }
};

