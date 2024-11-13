const mongoose=require('mongoose')
const Discount=require('../model/discountSchema')
const productSchema=mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  price:{
    type:Number,
    required:true
  },
  quantity:{

    type:Number,
    required:true,
    default:0
  },
 
  processor:{
    type:String,
   

  },
  rating: {
    type: Number,
    min:0,
    max:5,
    default:0

  },
  reviews: {
    type: Number,
    
},
  category:[{
    type:String,
  }],
  discount:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Discount',
    default:null
  },
  reviews:[{
    userid:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
    comment:{type:String},
    rating:{type:Number,min:1,max:5}
  }],

  processorGeneration:{
     type:String
  },
  ramCapacity:{
    type:String,

  },
  isfeatured:{
    type:Boolean
  },
  ramGeneration:{
    type:String,

  },
  storageType:{
    type:String,

  },
  weight:{
    type:String
  },
  operatingSystem: {
    type: String
  },
 
  touchScreen: {
    type: String,
    enum:['Yes','No'],
    default:'No'
  },
  graphicsType: {
    type: String
  },
  keyFeatures: [{
    type: String
  }],
  graphicsGeneration: {
    type: String
  },
  color:[ {
    type: String
  }],
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  description: {
    type: String,
    required:false
  },
  discountType: { 
    type: String, 
    enum: ['percentage', 'fixed'],
     
     }, 
  
  discountValue: { 
    type: Number,
     default: 0 ,
    },
    finalPrice: { 
      type: Number
    } 

 
},{timestamps:true})

const Product=mongoose.model('Product',productSchema);
module.exports=Product;