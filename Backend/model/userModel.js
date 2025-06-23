const mongoose=require('mongoose');
const bcrypt=require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const crypto=require('crypto')

const UserSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Please enter your name']
    },
    email:{
        type:String,
        required:[true,'Please enter your email'],
        unique:true,
        validate:[validator.isEmail,'please enter valid email']
    },
    avatar: {
        type: String,
        default: 'user'
    },
    password:{
        type:String,
        required:[function () {return this.isNew},'Please enter your password'],
        minLength:[6,"Your password must be atleast 6 characters"],
        select:false
    },
    role:{
        type:String,
        default:'user'
    },
    resetpasswordtoken:String,
    resetpasswordtokenexpire:Date
})

UserSchema.pre('save',async function(next){
    if(!this.isModified('password')){
        return next();
    }
    this.password=await bcrypt.hash(this.password,8);
    next();
})

UserSchema.methods.isValid=async function(enteredPassword){
    return bcrypt.compare(enteredPassword,this.password);
}

UserSchema.methods.JwtToken=function(){
    return jwt.sign({id:this.id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_TIME
    })
}

UserSchema.methods.getrengeratedpassword=function(){
    const token = crypto.randomBytes(20).toString('hex');
    this.resetpasswordtoken=crypto.createHash('sha256').update(token).digest('hex');
    this.resetpasswordtokenexpire=Date.now()+30*60*1000;
    return token
}

module.exports=mongoose.model('User',UserSchema)