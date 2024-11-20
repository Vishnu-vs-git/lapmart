const mongoose=require('mongoose');
const User=require('../model/userSchema');
const Product=require('../model/productSchema')
const wishlistSchema= new mongoose.Schema({
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true ,

  },
  productId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Product',
    required:true
  },
  addedAt:{
    type:Date,default:Date.now
  }
})
module.exports=mongoose.model('Wishlist',wishlistSchema);
