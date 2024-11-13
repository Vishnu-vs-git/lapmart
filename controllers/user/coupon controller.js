const Coupon=require('../../model/couponSchema')
const User=require('../../model/userSchema')
const Cart=require('../../model/cartSchema')






exports.getCoupon = async (req, res) => {
  try {
    const coupons = await Coupon.find({ isActive: true });

    if (!coupons || coupons.length === 0) {
      return res.status(404).json({ message: 'No coupons found' });
    }
    res.json({ coupons }); // Always returns an array, even if it's just one coupon
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).send('Internal server error');
  }
};



exports.applyCoupon= async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.session.user._id; 

    
    const coupon = await Coupon.findOne({ code: couponCode });
    if (!coupon) {
      return res.json({ success: false, message: 'Invalid coupon code.' });
    }
    if (coupon.expiryDate < Date.now()) {
      return res.json({ success: false, message: 'Coupon has expired.' });
    }

  
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    //----->here we find the usage count of particular user.
    const userUsage = coupon.usageByUser.find((usage) => usage.userId.toString() === userId);

    //----> here we check the usage of that coupon by particular user;

    if (userUsage && userUsage.count >= coupon.totalUsageLimit) {
     
      return res.json({success:false,message:'You have reached the usage limit for this coupon.'})
    };
 
     //--- here we temporarilly storet the data into  session
         req.session.appliedCoupon = couponCode;

   

    let subTotal = 0;
    cart.items.forEach((item) => {
      subTotal += item.price* item.quantity;
      console.log('itemquantity',item.quantity)
    });
    

    // Calculate the discount
    let discountAmount = 0;
    if (coupon.couponType=== 'percentage') {
      discountAmount = (coupon.couponValue / 100) * subTotal;
    } else if (coupon.couponType === 'fixed') {
      discountAmount = coupon.couponValue;
    }

    // Ensure discount does not exceed subtotal
    discountAmount = Math.min(discountAmount, subTotal);
    const discountedTotal = subTotal - discountAmount;
     cart.subTotal=discountedTotal;
     cart.couponDiscount=discountAmount;
     await cart.save();


    // Send back the discounted total and coupon details
    res.json({
      success: true,
      message: 'Coupon applied successfully!',
      discountedTotal: discountedTotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      couponCode: couponCode
    });
  } catch (error) {
    console.error('Coupon application error:', error);
    res.status(500).json({ success: false, message: 'Failed to apply coupon. Please try again.' });
  }
};
