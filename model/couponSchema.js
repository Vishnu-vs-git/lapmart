const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema([{
  code: {
    type: String, // Added "type" here
   
    unique: true,
    uppercase: true, // Changed to lowercase "uppercase"
    trim: true,
  },
  couponType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  couponValue: {
    type: Number,
  
  },
  minPurchaseAmount: {
    type: Number,
    default: 0,
  },
  startDate: {
    type: Date,
  
  },
  expiryDate: {
    type: Date,

  },
 
  totalUsageLimit: {
    type: Number,
    default: 5,  
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  usageByUser: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
     
    },
    count: {
      type: Number,
      default: 0,
    },
  }],
}], { timestamps: true });

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
