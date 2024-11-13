const Coupon = require("../../model/couponSchema");

exports.getCoupons = async (req, res) => {
  try {
   const coupons=await Coupon.find();

    res.render("admin/couponManagement", { coupons });
  } catch (error) {}
};
///....................> Coupon add form rendering------>
exports.loadAddCoupon = async (req, res) => {
  try {
    res.render("admin/addCouponForm");
  } catch (error) {
    console.error("error in loading form", error);
  }
};

//-------> adding coupons logic////
exports.postAddCoupon = async (req, res) => {
  try {

    const { code, couponType, couponValue, minPurchaseAmount, startDate, expiryDate, usageLimit, isActive } = req.body;
    
    
    const existingCoupon=await Coupon.findOne({code});
     if(existingCoupon){
      return res.status(400).json({success:false,message:'Coupon code already exists. '})
     }

     
     if (new Date(startDate) >= new Date(expiryDate)) {
      return res.status(400).json({ success: false, message: "Start date must be before expiry date." });
    }

    console.log('req.body is:', req.body);      
    const coupon = new Coupon({
      code,
      couponType,
      couponValue,
      minPurchaseAmount,
      startDate,
      expiryDate,
      usageLimit: usageLimit || 0, 
     
    });

    console.log('Coupon is:', coupon);

   
    await coupon.save();
    res.json({ success: true, message: 'Coupon added successfully!' });
  } catch (error) {
    console.error('Error saving coupon:', error);
    res.status(500).json({ success: false, message: 'Failed to add coupon.' });
  }
};


//------>block and unblock customers


exports.blockCoupon= async (req, res) => {
  try {
    const { couponId } = req.body;

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      { isActive: false }, // Set isActive to false for blocking
      { new: true }
    );

    console.log('updaredCoupon:',updatedCoupon)
    
    
    if (updatedCoupon) {
      res.json({ success: true, message: 'Coupon blocked successfully!', isActive: updatedCoupon.isActive });
    } else {
      res.status(404).json({ success: false, message: 'Coupon not found.' });
    }
  } catch (error) {
    console.error('Error blocking coupon:', error);
    res.status(500).json({ success: false, message: 'Server error while blocking coupon.' });
  }
};

exports.UnblockCoupon= async (req, res) => {
  try {
    const { couponId } = req.body;
    
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      { isActive: true }, // Set isActive to true for unblocking
      { new: true }
    );
    console.log('updaredCoupon:in unblock',updatedCoupon)
    
    if (updatedCoupon) {
      res.json({ success: true, message: 'Coupon unblocked successfully!', isActive: updatedCoupon.isActive });
    } else {
      res.status(404).json({ success: false, message: 'Coupon not found.' });
    }
  } catch (error) {
    console.error('Error unblocking coupon:', error);
    res.status(500).json({ success: false, message: 'Server error while unblocking coupon.' });
  }
};
exports.removeCoupon=async(req,res)=>{
  try{
    const {couponId}=req.body;
    const coupon=await Coupon.findById(couponId);
    if(!coupon){
      return res.status(404).json({success:false,message:'coupon not found'})
    }
    await Coupon.findByIdAndDelete(couponId)
    res.json({success:true,message:'coupon deleted successfully'})



  }catch(error){
    console.error("Error in removing coupon",error)
    res.status(500).json({success:false,message:'Internal server error'})
  }
}

exports.getEditCoupon=async(req,res)=>{
  try{
    res.render("admin/editCoupon")
  }catch(error){
    console.error('error in getting page',error);
    res.statsu(500).json({message:'error in getting edit coupon page'});
  }
}



