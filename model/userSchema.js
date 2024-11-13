const mongoose=require('mongoose')
const addressSchema=require('./addressSchema')
const userSchema=mongoose.Schema({
  userName:{
    type:String,
    required:false,
    trim:true
  },email:{
    type:String,
    required:false,
    trim:true,
   
  },phone:{
    type:String,
    required:false,
    trim:true
  },password:{
    type:String,
    required:false,

  },address: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Address', 
  }],
  status:{
    type:String,
    enum:['Active','Inactive'],
    default:'Active'
  },
  userUsage: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      count: { type: Number, default: 0 },
    },
  ],
  isBlocked:{
       type:Boolean,
       default:'false'
  },googleId:{type:String},

  
},{timestamps:true});
const User=mongoose.model('User',userSchema);
module.exports=User