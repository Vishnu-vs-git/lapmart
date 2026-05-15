const Coupon=require('../../model/couponSchema')
const User=require('../../model/userSchema')
const Cart=require('../../model/cartSchema');
const messages = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');






exports.getCoupon = async (req, res) => {
  try {
    const coupons = await Coupon.find({ isActive: true });

    if (!coupons || coupons.length === 0) {
      
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: messages.COUPON.FETCH_EMPTY });
    }
    return res.status(STATUS_CODES.OK).json({
      success: true,
      coupons
    });
  } catch (error) {
     return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success:false, message: messages.COMMON.INTERNAL_ERROR });
  }
};



exports.applyCoupon= async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.session.user._id; 

    const coupon = await Coupon.findOne({ code: couponCode });
    if (!coupon) {
      
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: messages.COUPON.INVALID });
    }
    if (coupon.expiryDate < Date.now()) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: messages.COUPON.EXPIRED });
    }

  
    const cart = await Cart.findOne({ userId }).populate('items.productId');
   
    const userUsage = coupon.usageByUser.find((usage) => usage.userId.toString() === userId);

    if (userUsage && userUsage.count >= coupon.totalUsageLimit) {
     
      return res.status(STATUS_CODES.BAD_REQUEST).json({success:false,message:messages.COUPON.USAGE_LIMIT_REACHED})
    };
 
  req.session.appliedCoupon = couponCode;

    let subTotal = 0;
    cart.items.forEach((item) => {
      subTotal += item.price* item.quantity;
      
    });
    


    let discountAmount = 0;
    if (coupon.couponType=== messages.COUPON_TYPE.PERCENTAGE) {
      discountAmount = (coupon.couponValue / 100) * subTotal;
    } else if (coupon.couponType === messages.COUPON_TYPE.FIXED) {
      discountAmount = coupon.couponValue;
    }

    discountAmount = Math.min(discountAmount, subTotal);
    const discountedTotal = subTotal - discountAmount;
    
    let taxRate=.18;
    let newTax=Math.round(discountedTotal*.18);
  
    cart.tax=newTax
     cart.couponDiscount=discountAmount;
     cart.grandTotal=discountedTotal+newTax
     await cart.save();


    res.json({
      success: true,
      message: messages.COUPON.APPLY_SUCCESS,
      discountedTotal: discountedTotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      couponCode: couponCode
    });
  } catch (error) {
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success:false, message: messages.COUPON.APPLY_ERROR});
  }
};
