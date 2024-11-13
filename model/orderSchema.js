const mongoose=require('mongoose')
const orderSchema=mongoose.Schema({
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
  },
  orderId:{
   type:String

  },
  items:[
    {
      productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product',
        required:true
      },
      quantity:{
        type:Number,
        required:true
      },
      price:{
        type:Number,
        required:true
      },
      itemTotal:{
        type:Number
      },
      cancellationReason:{
        type:String,
      },
      returnReason:{
        type:String
      },
      itemOrderStatus: {
        type: String,
        enum: ["Pending", "Shipped", "Delivered", "Cancelled","return requested","returned"],
        default: "Pending",
      },
      paymentStatus:{
        type:String,
        enum:['paid','pending','refunded'],
        default:'pending'
      }

    },
  ],
  totalAmount:{
    type:Number,
    required:true
  },
  couponDiscount:{
    type:Number
  },
  totalDiscount:{
    type:Number,
    default:0
  },
  shippingAddress:{
    addressLine1:String,
    addressLine2:String,
    street:String,
    city:String,
    state:String,
    country:String,
    zipCode:Number,
    phoneNo:Number
  },
  paymentMethod:{
    type:String,
    enum:['Cash on Delivery','Razorpay','Wallet'],
    required:true
  },
 
},{timestamps:true});

module.exports=mongoose.model('Order',orderSchema);