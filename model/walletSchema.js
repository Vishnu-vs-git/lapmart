const mongoose=require('mongoose')
const User=require('../model/userSchema')
const walletSchema=new mongoose.Schema({
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:User
  },
  balance:{
    type:Number,
    default:0
  },
  transaction:[{
     walletamount:{
      type:Number,
      default:0
     },
     orderId:{
        type:String,
        
     },
     transactionType:{
      type:String,
      enum:['Credited','Debited']
     },
     transactionDate:{
        type:Date,
        required:true,
        default:Date.now()
     }
  }]
},{timestamps:true})
module.exports=mongoose.model('Wallet',walletSchema)