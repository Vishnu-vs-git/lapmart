const mongoose=require('mongoose')
const userSchema=mongoose.Schema({
  firstName:{
    type:String,
    required:true,
    trim:true
  },lastName:{
    type:String,
    required:true,
    trim:true
  },email:{
    type:String,
    required:true,
    trim:true,
    unique:true
  },phone:{
    type:String,
    required:true,
    trim:true
  },password:{
    type:'String',
    required:true,

  },address:{
      type:addressSchema,
      required:true

  },isBlocked:{
       type:String,
       default:'unblocked'
  },googleId:{type:String},

  
},{timestamps:true});
module.exports=mongoose.model('user',userSchema);