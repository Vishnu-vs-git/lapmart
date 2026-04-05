const messages = require("../../constants/messages");
const STATUS_CODES = require("../../constants/statusCodes");
const Coupon = require("../../model/couponSchema");

exports.getCoupons = async (req, res) => {
  try {
    const message= req.session.message;
    delete req.session.message
   const coupons=await Coupon.find();

    res.render("admin/couponManagement", { coupons,message });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).render("admin/couponManagement", {
      coupons: [],
      message: {
        text: messages.COUPON.COUPON_LOAD_ERROR,
        type: "error"
      }
    });
  }
  }

//....................> Coupon add form rendering------>
exports.loadAddCoupon = async (req, res) => {
  try {
    res.render("admin/addCouponForm");
  } catch (error) {
    
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).render("admin/addCouponForm", {
      message: {
        text: messages.COUPON.FORM_LOAD_ERROR,
        type: "error"
      }
    });
  }
};

//-------> adding coupons ---------->
exports.postAddCoupon = async (req, res) => {
  try {

    const { code, couponType, couponValue, minPurchaseAmount, startDate, expiryDate, usageLimit, isActive } = req.body;
    
    
    const existingCoupon=await Coupon.findOne({code});
     if(existingCoupon){
      return res.status(STATUS_CODES.BAD_REQUEST).json({success:false,message:messages.COUPON.EXISTS});
     }

     
     if (new Date(startDate) >= new Date(expiryDate)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: messages.COUPON.INVALID_DATE });
    }

    const coupon = new Coupon({
      code,
      couponType,
      couponValue,
      minPurchaseAmount,
      startDate,
      expiryDate,
      usageLimit: usageLimit || 0, 
     
    });

    await coupon.save();
    res.json({ success: true, message: messages.COUPON.ADD_SUCCESS });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: messages.COUPON.ADD_ERROR });
  }
};


//------>block and unblock coupons


exports.blockCoupon= async (req, res) => {
  try {
    const { couponId } = req.body;

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      { isActive: false }, 
      { new: true }
    );

    if (updatedCoupon) {
      res.status(STATUS_CODES.OK).json({ success: true, message: messages.COUPON.BLOCK_SUCCESS, isActive: updatedCoupon.isActive });
    } else {
      res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: messages.COUPON.NOT_FOUND });
    }
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: messages.COMMON.INTERNAL_ERROR });
  }
};

exports.UnblockCoupon= async (req, res) => {
  try {
    const { couponId } = req.body;
    
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      { isActive: true },
      { new: true }
    );
    
    
    if (updatedCoupon) {
      res.status(STATUS_CODES.OK).json({ success: true, message: messages.COUPON.UNBLOCK_SUCCESS, isActive: updatedCoupon.isActive });
    } else {
      res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: messages.COUPON.NOT_FOUND });
    }
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: messages.COMMON.INTERNAL_ERROR });
  }
};
exports.removeCoupon=async(req,res)=>{
  try{
    const {couponId}=req.body;
    const coupon=await Coupon.findById(couponId);
    if(!coupon){
      return res.status(STATUS_CODES.NOT_FOUND).json({success:false,message:messages.COUPON.NOT_FOUND});
    }
    await Coupon.findByIdAndDelete(couponId)
    return res.status(STATUS_CODES.OK).json({success:true,message:messages.COUPON.DELETE_SUCCESS});

  }catch(error){
    res.status(500).json({success:false,message: messages.COMMON.INTERNAL_ERROR})
  }
}

exports.getEditCoupon=async(req,res)=>{
  try{
      const couponId=req.params.id;
      if (!couponId) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: messages.COUPON.ID_REQUIRED,
        });
      }
    const coupon=await Coupon.findById(couponId);
    res.render("admin/editCoupon",{coupon})
  }catch(error){   
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).render("admin/editCoupon", {
    coupon: null,
    message: {
      text: messages.COMMON.INTERNAL_ERROR,
      type: "error"
    }
  });
  }
}

exports.postEditCoupon=async(req,res)=>{
  try{
    const couponId=req.params.id;
    const{code,couponType,couponValue,minPurchaseAmount,startDate,expiryDate,totalUsageLimit}=req.body;
   
     const updatedcoupon= await Coupon.findByIdAndUpdate(couponId,{
      code,
      couponType,
      couponValue,
      minPurchaseAmount,
      startDate,
      expiryDate,
      totalUsageLimit
     },{new:true});
     
      if(!updatedcoupon){
        return res.status(STATUS_CODES.NOT_FOUND).json({success:false,message: messages.COUPON.UPDATE_ERROR});

      }
      req.session.message= messages.COUPON.UPDATE_SUCCESS;
      res.redirect("/admin/coupons")
  }catch(error){
  
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({message:messages.COUPON.UPDATE_ERROR})
  }
}


