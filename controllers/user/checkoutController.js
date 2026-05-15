const user = require("../../model/userSchema");
const cart = require("../../model/cartSchema");
const product = require("../../model/productSchema");
const Address = require("../../model/addressSchema");
const Order = require("../../model/orderSchema");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const messages = require("../../constants/messages");
const STATUS_CODES = require("../../constants/statusCodes");

const razorpayInstance = new Razorpay({
  key_id: process.env.YOUR_RAZORPAY_KEY_ID,
  key_secret: process.env.YOUR_RAZORPAY_SECRET_KEY,
});

exports.getCheckpoutPage = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const cartTotal = 0;
    const savedAddresses = await user.findById(userId).populate("address");
    const cartItems = await cart
      .findOne({ userId: userId })
      .populate("items.productId");

    if (!cartItems) {
      
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success:false,message:messages.CART.CART_ERROR});
    }

    const insufficientStock = cartItems.items.some((item) => {
      if (
        item.productId.quantity < item.quantity ||
        item.productId.quantity === 0
      ) {
        item.quantity = item.productId.quantity;
        req.session.message = `requested quantity is not available,the stock of ${item.productId.name} is ${item.productId.quantity}`;
     
        return true;
      }
      return false;
    });
   

    if (insufficientStock) {
      return res.redirect("/user/cart");
    }
    if (!savedAddresses) {   
       return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success:false,message:messages.COMMON.INTERNAL_ERROR});
    }
    res.render("user/checkout", { savedAddresses, cartItems, cartTotal });
  } catch (error) {
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({success:false,message:messages.COMMON.INTERNAL_ERROR});
  }
};

exports.postCheckoutAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;

    const {
      addressLine1,
      addressLine2,
      street,
      state,
      country,
      zipCode,
      phoneNo,
      userName,
      city,
    } = req.body;
    const saveUser = async () => {
      const address = new Address({
        addressLine1,
        addressLine2,
        street,
        state,
        country,
        zipCode,
        phoneNo,
        city,
        User: userId,
        userName,
      });

      const savedAddress = await address.save();
      await user.findByIdAndUpdate(userId, {
        $push: { address: savedAddress._id },
      });
    };
    saveUser();
    res.redirect("/user/checkout");
  } catch (error) {
    res.redirect("/user/addAddress");
  }
};

exports.createRazorPayOrder = async (req, res) => {
  
  
  try {
    const userId = req.session.user._id;
    const{addressData,paymentMethod}=req.body;

     if (!userId || !addressData || !paymentMethod) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: messages.COMMON.REQUIRED_FIELDS
      });
    }
    const cartitems = await cart.findOne({ userId: userId });
    const amount = cartitems.grandTotal;
    const orderOptions = {
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpayInstance.orders.create(orderOptions);
    
    if (!order) {
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: messages.ORDER.CREATE_ERROR
      });
    }
     
    const items = cartitems.items.map((item) => {
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        itemTotal: item.total,
        itemOrderStatus: messages.ORDER_STATUS.PENDING, 
        paymentStatus: messages.PAYMENT.PENDING,
        originalPrice:item.originalPrice
      };
    });
    const orderIds = generateOrderId();
   
    const orderitem = new Order({
      userId: userId,
      orderId: orderIds,
      items: items,
      subTotal:cartitems.subTotal,
      totalAmount: cartitems.grandTotal,
      shippingAddress: addressData,
      paymentMethod: paymentMethod,
      orderStatus: messages.ORDER_STATUS.PENDING, 
      tax:cartitems.tax,
      couponDiscount:cartitems.couponDiscount,
      totalDiscount:cartitems.totalDiscount
    });
    
    await orderitem.save();

   return res.status(STATUS_CODES.OK).json({
      success: true,
      message: messages.ORDER.CREATE_SUCCESS,
      order,
      orderIds
    });

  } catch (error) {
    return res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: messages.ORDER.CREATE_ERROR });
  }
};

exports.verifyPayment = async (req, res) => {

  try {
    const { paymentId, orderId,orderIds, signature, address, paymentMethod } = req.body;
      if (!paymentId || !orderId || !orderIds || !signature) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: messages.COMMON.REQUIRED_FIELDS
      });
    }
    const hmac = crypto.createHmac(process.env.SIGNATURE_ALGORITHM, process.env.SIGNATURE_SECRET);
    hmac.update(orderId + "|" + paymentId);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== signature) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: messages.ORDER.PAYMENT_FAILED
      });
    }
    
    const userId = req.session.user._id;
    const orderItems = await Order.findOne({ orderId: orderIds, userId: userId });
    if (!orderItems) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: messages.ORDER.NOT_FOUND
      });
    }

 if (orderItems) {
  orderItems.isPaid=true;
  orderItems.items = orderItems.items.map((item) => {
    return {
      ...item, 
      paymentStatus: messages.PAYMENT_STATUS.PAID, 
    };
  });

  await orderItems.save(); 
  
}


    for (const item of orderItems.items) {
      await product.findByIdAndUpdate(item.productId._id, {
        $inc: { quantity: -item.quantity,productSold:+item.quantity },
      });
    }

    await orderItems.save();
    await cart.deleteOne({ userId: userId });

    res.status(STATUS_CODES.CREATED).json({ success: true, orderItems });
  } catch (error) {
    return res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: messages.ORDER.PAYMENT_FAILED });
  }
};

//---------> function to generate orderid
function generateOrderId() {
  const prefix = "ORD";
  const timestamp = Date.now();
  const randomComponent = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}-${randomComponent}`;
}
//----------------------------------------------------------------->











