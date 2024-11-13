const mongoose = require('mongoose');
const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 0
      },
      price: {
        type: Number,
        required: true
      },
      finalPrice: {
        type: Number
      },
      total: {
        type: Number,
        required: true
      }
    }
  ],
  subTotal: {
    type: Number,
    required: true,
    default: 0
  },
  totalDiscount: {
    type: Number,
    default:0
  },
  couponDiscount:{
    type:Number,
    default:0
  }
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
