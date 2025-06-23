const mongoose =require('mongoose');
const { type } = require('os');

const ProductSchema= new mongoose.Schema({
    name:{
        type:String,
        required:[true,'enter name']
    },
    description:{
        type:String,
        required:[true,'enter description']
    },
    price:{
        type:Number,
        required:[true,'enter price']
    },
    stock:{
        type:Number,
        required:[true,'enter stock']
    },
    category: {
        type: String,
        required: [true, "enter category"],
        enum: {
            values: [
            'Cotton',
            'Synthetic',
            'Knitted',
            'Linen',
            'Designer'
            ],
            message: "select correct category"
        }
    },
    images:[{
        image:{
            type:String,
            required:false
        }
    }],
    ratings:{
        type:Number,
        default:0
    },
    Review:[{
        name:{
            type:String,
            required:[true,"enter reviwername"]
            },
        rating:{
            type:Number,
            required:[true,"enter rating"]
            },
        Comment:{
            type:String,
            required:[true,"enter comment"]
            }
        }],
        user:{
                type:mongoose.Schema.Types.ObjectId
            },
     NumofReviews:{
        type:Number,
        default: 0
        }
});

const Product = mongoose.model('Product', ProductSchema);
module.exports=mongoose.model('product',ProductSchema)