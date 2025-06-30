const errorHandler = require('../middleware/errorHandler');
const Product=require('../model/productModel');
const CatchasyncError = require('../utils/CatchasyncError');
const APIFeatures = require('../utils/apiFeatures');

exports.getProducts = CatchasyncError(async (req, res, next) => {
    const resPerPage = 8;
    
    const features = new APIFeatures(Product.find(), req.query).search().filter();

    const filteredProductsCount = await features.query.clone().countDocuments();
    const totalProductsCount = await Product.countDocuments();

    let productsCount = totalProductsCount;
    if (filteredProductsCount !== totalProductsCount) {
        productsCount = filteredProductsCount;
    }

    const products = await features.paginate(resPerPage).query;

    res.status(200).json({
        success: true,
        productsCount,
        resPerPage,
        products
    });
});

exports.createProducts=(async(req,res)=>{
    const product=new Product(req.body);
    try {
        const Savedproduct=await product.save();
        res.status(201).json({
            success:true,
            Savedproduct
        })    
    } catch (err) {
        res.status(500).json({message:err.message})
        
    }
});

exports.getSingleProduct = CatchasyncError(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new errorHandler('product not found', 404));
    }

    res.status(200).json({
        success: true,
        product
    });
});


exports.UpdateProduct=(async(req,res)=>{
    const product=await Product.findById(req.params.id);

    if(!product){
        return res.status(404).json({message:'id not found'})
    }

    const newproduct=await Product.findByIdAndUpdate(req.params.id,req.body,{
        new:true,
        runValidators:true
    });
    res.json({
        success:true,
        newproduct
    })  
})

exports.DeleteProduct=(async(req,res)=>{
    const product=await Product.findById(req.params.id);

    if(!product){
        return res.status(404).json({message:'id not found'})
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({
        success:true
    })  
})

exports.CreateReview=CatchasyncError(async(req,res,next)=>{
    const {rating,comment,product}=req.body;
    const review={
        user:user._id,
        rating:rating,
        
    }
})

exports.adminGetProducts=CatchasyncError(async(req,res,next)=>{
    const products=await Product.find({})
     if (!products) {
        return next(new errorHandler('product not found', 404));
    }

    res.status(200).json({
       success: true,
        products,
        productsCount: products.length
    });
})