const errorHandler = require('../utils/error');
const sendToken = require('../model/sendtoken');
const User = require('../model/userModel');
const CatchasyncError = require('../utils/CatchasyncError');
const sendEmail =require('../utils/Sendmail')
const crypto=require('crypto')
const fs = require('fs');
const path = require('path');

exports.getUser=CatchasyncError(async(req,res,next)=>{
    const users=await User.findById(req.user.id)
    res.status(200).json({
        success:true,
        users
    })
})

exports.createUser=CatchasyncError(async(req,res,next)=>{
    const {name,email,password}=req.body;
    let avatar;
    let BASE_URL=process.env.BACKEND_URL.replace(/\/$/, '');
    if(req.file){
        avatar=`${BASE_URL}/uploads/user/${req.file.filename}`
    }

    const user=await User.create({
        name,
        email,
        password,
        avatar
    })
    sendToken(user,201,res);
})

exports.login=CatchasyncError(async(req,res,next)=>{
    const {email,password}=req.body;
    if(!email || !password){
        return next(new errorHandler('Incorrect Password or Email',401))
    }
    const user =await User.findOne({email}).select('+password');
    if(!user){
        return next(new errorHandler('Incorrect Password or Email',401))
    }
    const isPasswordMatched=await user.isValid(password);

    if(!isPasswordMatched){
        return next(new errorHandler('Incorrect Password',401))
    }
    const fullUser = await User.findById(user._id);

    sendToken(fullUser,200,res);

    })

exports.Logout=CatchasyncError(async(req,res,next)=>{
    res.cookie('token',null,{
        expires:new Date(Date.now()),
        httpOnly:true
    }).json({
        success:true,
        message:'Logged out successfully'
    })

})



exports.Changepassword=CatchasyncError(async(req,res,next)=>{
    const user=await User.findById(req.user.id).select('+password');

    if (!user) {
        return next(new errorHandler('User not found', 404));
    }

    const isMatch=await user.isValid(req.body.oldPassword)
    if(!isMatch){
        return next(new errorHandler('Incorrect Password',404));
    }
    user.password=req.body.password;
    await user.save();
    res.json({
        success:true,
        message:'Password Changed'
    })
})

exports.forgotPassword=CatchasyncError(async(req,res,next)=>{
    const user=await User.findOne({email:req.body.email});
    if(!user){
        return next(new errorHandler('NO user found with this email',404));
    }
    const token=user.getrengeratedpassword();
    await user.save({ validateBeforeSave: false });
    let BASE_URL=process.env.FRONTEND_URL;

    const resetUrl = `${BASE_URL}resetpassword/${token}`;
    await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        message: `You requested a password reset. Please use this link to reset your password:\n\n${resetUrl}\n\nIf you didn't request this, please ignore this email.`,
        });
    res.status(200).json({
    success: true,
    message: `Email sent to ${user.email}`
    });
})

exports.resetPassword=CatchasyncError(async(req,res,next)=>{
    const resetPasswordToken =  crypto.createHash('sha256').update(req.params.token).digest('hex'); 
    const user=await User.findOne({
        resetpasswordtoken:resetPasswordToken,
        resetpasswordtokenexpire:{
            $gt:Date.now()
        }
    });
    if(!user){
        return next(new errorHandler('Invaild Token or Token expired',404))
    }
    if(req.body.password!==req.body.confirmPassword){
        return next(new errorHandler('Password does not match',404))
    }

    user.password=req.body.password;
    user.resetpasswordtoken = undefined;
    user.resetpasswordtokenexpire = undefined;
    await user.save({ validateBeforeSave: false });
    sendToken(user,201,res)

})

exports.UpdateUser=CatchasyncError(async(req,res,next)=>{
    let newUser={
        name:req.body.name,
        email:req.body.email
    }
    const currentUser = await User.findById(req.user.id);
    let avatar;
    let BASE_URL=process.env.BACKEND_URL.replace(/\/$/, '');
    if(req.file){
        avatar=`${BASE_URL}/uploads/user/${req.file.originalname}`
        newUser={...newUser,avatar}
        if (currentUser.avatar && currentUser.avatar !== 'user') {
            const oldPath = path.join(__dirname, '..', currentUser.avatar.replace(BASE_URL, ''));
            fs.unlink(oldPath, err => {
                if (err) console.error('Failed to delete old image:', err);
        });
    }
    }
    const user=await User.findByIdAndUpdate(req.user.id,newUser,{
        new:true,
    })
    res.status(200).json({
        success: true,
        user
    })
})

exports.getAllUsers = CatchasyncError(async (req, res, next) => {
   const users = await User.find();
   res.status(200).json({
        success: true,
        users
   })
})

exports.DeleteUser=CatchasyncError(async(req,res,next)=>{
    const user=await User.findById(req.params.id);

    if(!user){
        return next(new errorHandler('This UserName is not available',404));
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(201).json({
        success:true
    })

})