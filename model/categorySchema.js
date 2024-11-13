const mongoose=require('mongoose');
const Discount=require('../model/discountSchema')
const categorySchema=mongoose.Schema({
  name:{
    type:String,
    required:true,
    trim:true,
    unique:true

  },
  status:{
    type:String,
    enum:['Active','Inactive'],
    default:'Active'
  },
 
  productIds:[{
    type:mongoose.Types.ObjectId,
    ref:'product',

  }],
  discount:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Discount',
    default:[]
  }]
  

},{timestamps:true})
const Category= new mongoose.model('Category',categorySchema)
module.exports=Category